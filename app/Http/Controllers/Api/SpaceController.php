<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Space;
use Illuminate\Http\Request;

class SpaceController extends Controller
{
    public function index()
    {
        $this->authorize('viewAny', Space::class);

        $user = auth()->user();

        $spaces = Space::queryWorkspaceAccessibleBy($user)
            ->withCount(['channels', 'users', 'tasks as completed_tasks_count' => function ($query) {
                $query->whereNotNull('date_done');
            }])
            ->orderBy('name')
            ->get();

        return response()->json($spaces);
    }

    public function show(Space $space)
    {
        $this->authorize('view', $space);

        $space->load(['channels', 'users:id,name,email,avatar_path,last_seen_at']);

        return response()->json($space);
    }

    public function store(Request $request)
    {
        $this->authorize('create', Space::class);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'icon' => 'nullable|string',
            'color' => 'nullable|string',
        ]);

        $space = Space::create(array_merge($validated, [
            'created_by' => auth()->id(),
            'is_personal' => false,
        ]));

        $space->users()->attach(auth()->id(), ['role' => 'owner']);

        return response()->json($space, 201);
    }

    public function update(Request $request, Space $space)
    {
        $this->authorize('update', $space);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'icon' => 'nullable|string',
            'color' => 'nullable|string',
        ]);

        $space->update($validated);

        return response()->json($space);
    }

    public function destroy(Space $space)
    {
        $this->authorize('delete', $space);

        $space->delete();

        return response()->json(['message' => 'Space deleted successfully']);
    }
}
