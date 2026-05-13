<?php

namespace App\Http\Controllers;

use App\Models\Folder;
use App\Models\Space;
use App\Models\TaskList;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TaskListController extends Controller
{
    public function show(TaskList $list): Response
    {
        $user = auth()->user();
        $isPrivilegedUser = $user->canViewAllTasksInSharedLists();

        $list->load([
            'space',
            'folder',
            'statuses',
            'tasks' => function ($q) use ($user, $isPrivilegedUser) {
                $q->visibleTo($user);
                if (! $isPrivilegedUser) {
                    // Members should only see tasks explicitly assigned to them in list view.
                    $q->where('assigned_to', $user->id);
                }
                $q->with(['createdBy', 'assignedTo', 'list.statuses'])->withCount('comments');
            },
            'tasks.subtasks' => function ($q) use ($user, $isPrivilegedUser) {
                $q->visibleTo($user);
                if (! $isPrivilegedUser) {
                    $q->where('assigned_to', $user->id);
                }
                $q->with(['assignedTo'])->withCount('comments');
            },
        ]);

        // Spaces + folders for the Move modal
        $movableSpaces = Space::with(['folders:id,space_id,name'])
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn ($s) => [
                'id' => $s->id,
                'name' => $s->name,
                'folders' => $s->folders->map(fn ($f) => ['id' => $f->id, 'name' => $f->name])->values(),
            ]);

        return Inertia::render('Lists/Show', [
            'list' => $list,
            'movableSpaces' => $movableSpaces,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'description' => ['nullable', 'string'],
            'color' => ['nullable', 'string', 'max:16'],
            'space_id' => ['required', 'exists:spaces,id'],
            'folder_id' => ['nullable', 'exists:folders,id'],
        ]);

        $position = (int) TaskList::where('space_id', $validated['space_id'])
            ->where('folder_id', $validated['folder_id'] ?? null)
            ->max('position') + 1;

        $list = TaskList::create([
            ...$validated,
            'created_by' => $request->user()->id,
            'position' => $position,
        ]);

        return redirect()->route('lists.show', $list->id);
    }

    public function update(Request $request, TaskList $list): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'description' => ['nullable', 'string'],
            'color' => ['nullable', 'string', 'max:16'],
            'icon' => ['nullable', 'string', 'max:32'],
        ]);

        $list->update($validated);

        return back();
    }

    public function toggleFavorite(TaskList $list): RedirectResponse
    {
        $list->update(['is_favorite' => ! $list->is_favorite]);

        return back();
    }

    public function archive(TaskList $list): RedirectResponse
    {
        $list->update(['archived_at' => $list->archived_at ? null : now()]);

        return back();
    }

    public function duplicate(TaskList $list): RedirectResponse
    {
        $position = (int) TaskList::where('space_id', $list->space_id)
            ->where('folder_id', $list->folder_id)
            ->max('position') + 1;

        $copy = $list->replicate(['position', 'is_favorite', 'archived_at']);
        $copy->name = $list->name.' (copy)';
        $copy->position = $position;
        $copy->is_favorite = false;
        $copy->archived_at = null;
        $copy->created_by = request()->user()->id;
        $copy->save();

        // Replicate statuses
        foreach ($list->statuses()->orderBy('position')->get() as $status) {
            $copy->statuses()->create([
                'key' => $status->key,
                'label' => $status->label,
                'color' => $status->color,
                'group' => $status->group,
                'position' => $status->position,
            ]);
        }

        return redirect()->route('lists.show', $copy->id);
    }

    public function move(Request $request, TaskList $list): RedirectResponse
    {
        $validated = $request->validate([
            'space_id' => ['required', 'exists:spaces,id'],
            'folder_id' => ['nullable', 'exists:folders,id'],
        ]);

        // If folder is provided, ensure it belongs to the target space
        if (! empty($validated['folder_id'])) {
            $folder = Folder::findOrFail($validated['folder_id']);
            abort_unless((int) $folder->space_id === (int) $validated['space_id'], 422, 'Folder does not belong to the selected space.');
        }

        $position = (int) TaskList::where('space_id', $validated['space_id'])
            ->where('folder_id', $validated['folder_id'] ?? null)
            ->max('position') + 1;

        $list->update([
            'space_id' => $validated['space_id'],
            'folder_id' => $validated['folder_id'] ?? null,
            'position' => $position,
        ]);

        return back();
    }

    public function destroy(TaskList $list): RedirectResponse
    {
        $spaceId = $list->space_id;
        $list->delete();

        // If the request came from the list page itself, fall back to the space.
        $referer = request()->headers->get('referer', '');
        if (str_contains($referer, "/lists/{$list->id}")) {
            return redirect()->route('spaces.show', $spaceId);
        }

        return back();
    }
}
