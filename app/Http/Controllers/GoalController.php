<?php

namespace App\Http\Controllers;

use App\Models\Goal;
use App\Models\GoalFolder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class GoalController extends Controller
{
    public function index(Request $request)
    {
        $userId = Auth::id();

        $folders = GoalFolder::where('user_id', $userId)
            ->orderBy('position')
            ->orderBy('id')
            ->get();

        $goals = Goal::where('owner_id', $userId)
            ->with('folder:id,name,color')
            ->orderBy('status')
            ->orderBy('position')
            ->orderBy('id')
            ->get();

        $stats = [
            'total' => $goals->count(),
            'active' => $goals->where('status', 'active')->count(),
            'completed' => $goals->where('status', 'completed')->count(),
            'on_track' => $goals->where('status', 'active')->filter(fn ($g) => $g->progress >= 50)->count(),
        ];

        return Inertia::render('Goals/Index', [
            'folders' => $folders,
            'goals' => $goals,
            'stats' => $stats,
            'filter' => $request->string('filter', 'all')->toString(),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'folder_id' => 'nullable|exists:goal_folders,id',
            'target_type' => 'required|in:number,currency,percentage,boolean,task',
            'target_value' => 'required|numeric|min:0',
            'current_value' => 'nullable|numeric|min:0',
            'unit' => 'nullable|string|max:16',
            'start_date' => 'nullable|date',
            'due_date' => 'nullable|date',
            'color' => 'nullable|string|max:16',
        ]);

        if (! empty($data['folder_id'])) {
            $folder = GoalFolder::where('id', $data['folder_id'])->where('user_id', Auth::id())->firstOrFail();
            $data['folder_id'] = $folder->id;
        }

        $data['owner_id'] = Auth::id();
        $data['current_value'] = $data['current_value'] ?? 0;

        Goal::create($data);

        return redirect()->route('goals.index')->with('success', 'Goal created');
    }

    public function update(Request $request, Goal $goal)
    {
        abort_unless($goal->owner_id === Auth::id(), 403);

        $data = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'folder_id' => 'nullable|exists:goal_folders,id',
            'target_type' => 'sometimes|required|in:number,currency,percentage,boolean,task',
            'target_value' => 'sometimes|required|numeric|min:0',
            'current_value' => 'sometimes|numeric|min:0',
            'unit' => 'nullable|string|max:16',
            'start_date' => 'nullable|date',
            'due_date' => 'nullable|date',
            'status' => 'sometimes|in:active,completed,archived',
            'color' => 'nullable|string|max:16',
        ]);

        if (array_key_exists('folder_id', $data) && $data['folder_id']) {
            GoalFolder::where('id', $data['folder_id'])->where('user_id', Auth::id())->firstOrFail();
        }

        $goal->update($data);

        if ($request->wantsJson()) {
            return response()->json($goal->fresh());
        }

        return back()->with('success', 'Goal updated');
    }

    public function destroy(Goal $goal)
    {
        abort_unless($goal->owner_id === Auth::id(), 403);
        $goal->delete();
        return back()->with('success', 'Goal deleted');
    }

    public function storeFolder(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'color' => 'nullable|string|max:16',
        ]);
        $data['user_id'] = Auth::id();
        GoalFolder::create($data);
        return back()->with('success', 'Folder created');
    }

    public function destroyFolder(GoalFolder $folder)
    {
        abort_unless($folder->user_id === Auth::id(), 403);
        $folder->delete();
        return back()->with('success', 'Folder deleted');
    }
}
