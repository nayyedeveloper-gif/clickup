<?php

namespace App\Http\Controllers;

use App\Models\Space;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SpaceController extends Controller
{
    public function index()
    {
        $this->authorize('viewAny', Space::class);

        $spaces = Space::queryAccessibleBy(auth()->user())
            ->with('children', 'createdBy')
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('Spaces', [
            'spaces' => $spaces,
        ]);
    }

    public function store(Request $request)
    {
        $this->authorize('create', Space::class);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'color' => 'nullable|string|max:20',
            'icon' => 'nullable|string|max:50',
            'parent_id' => 'nullable|exists:spaces,id',
        ]);

        if (! empty($validated['parent_id'])) {
            $this->authorize('view', Space::findOrFail($validated['parent_id']));
        }

        $space = Space::create([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'color' => $validated['color'] ?? '#7c3aed',
            'icon' => $validated['icon'] ?? 'Layers',
            'parent_id' => $validated['parent_id'] ?? null,
            'created_by' => auth()->id(),
        ]);

        $space->users()->attach(auth()->id(), ['role' => 'owner']);

        return redirect()->back()->with('success', 'Space created successfully.');
    }

    public function show($id)
    {
        $user = auth()->user();
        $space = Space::with([
            'createdBy',
            'children',
            'users:id,name,email,avatar_color',
            'invitations' => function ($query) {
                $query->where('status', 'pending')->where('expires_at', '>', now());
            },
            'folders.lists.tasks' => function ($q) use ($user) {
                $q->visibleTo($user)->select('id', 'task_list_id', 'status', 'priority', 'start_date', 'due_date', 'assigned_to');
            },
            'folders.lists.createdBy:id,name',
            'lists.tasks' => function ($q) use ($user) {
                $q->visibleTo($user)->select('id', 'task_list_id', 'status', 'priority', 'start_date', 'due_date', 'assigned_to');
            },
            'lists.createdBy:id,name',
        ])->findOrFail($id);

        $this->authorize('view', $space);

        $decorate = function ($list) {
            $tasks = $list->tasks ?? collect();
            $total = $tasks->count();
            $done = $tasks->where('status', 'done')->count()
                + $tasks->where('status', 'completed')->count()
                + $tasks->where('status', 'closed')->count();
            $starts = $tasks->pluck('start_date')->filter();
            $ends = $tasks->pluck('due_date')->filter();
            $priorities = $tasks->pluck('priority')->filter()->unique()->values();
            $rank = ['urgent' => 4, 'high' => 3, 'medium' => 2, 'low' => 1];
            $topPriority = $priorities->sortByDesc(fn ($p) => $rank[$p] ?? 0)->first();

            $list->stats = [
                'total' => $total,
                'done' => $done,
                'progress' => $total > 0 ? round(($done / $total) * 100) : 0,
                'start' => optional($starts->min())->toDateString(),
                'end' => optional($ends->max())->toDateString(),
                'top_priority' => $topPriority,
            ];
            unset($list->tasks);

            return $list;
        };

        $space->lists = $space->lists->map($decorate);
        $space->folders = $space->folders->map(function ($f) use ($decorate) {
            $f->lists = $f->lists->map($decorate);

            return $f;
        });

        return Inertia::render('SpaceDetail', [
            'space' => $space,
        ]);
    }

    public function update(Request $request, $id)
    {
        $space = Space::findOrFail($id);
        $this->authorize('update', $space);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'color' => 'nullable|string|max:20',
            'icon' => 'nullable|string|max:50',
        ]);

        $space->update($validated);

        return redirect()->back()->with('success', 'Space updated successfully.');
    }

    public function destroy($id)
    {
        $space = Space::findOrFail($id);
        $this->authorize('delete', $space);

        $space->delete();

        return redirect()->back()->with('success', 'Space deleted successfully.');
    }
}
