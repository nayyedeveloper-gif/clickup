<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\Task;
use App\Models\User;

class TaskController extends Controller
{
    public function show(Request $request, Task $task)
    {
        $task->load([
            'list:id,name,space_id',
            'list.space:id,name',
            'createdBy:id,name',
            'assignedTo:id,name',
            'subtasks.assignedTo:id,name',
            'comments.user:id,name',
            'tags',
            'timeEntries' => fn ($q) => $q->orderByDesc('started_at')->with('user:id,name'),
        ]);

        $tagsAvailable = $task->list && $task->list->space_id
            ? \App\Models\Tag::where('space_id', $task->list->space_id)->get()
            : [];

        $statuses = \App\Models\TaskStatus::where('task_list_id', $task->task_list_id)
            ->get(['key', 'label', 'color', 'position']);

        // Respond with JSON when requested (e.g., TaskDrawer AJAX fetch)
        if ($request->wantsJson() && ! $request->header('X-Inertia')) {
            return response()->json([
                'task' => $task,
                'tagsAvailable' => $tagsAvailable,
                'statuses' => $statuses,
            ]);
        }

        return Inertia::render('Tasks/Show', [
            'task' => $task,
            'tagsAvailable' => $tagsAvailable,
            'statuses' => $statuses,
        ]);
    }

    public function members(): JsonResponse
    {
        // Return all users for now; later restrict to workspace members.
        return response()->json([
            'users' => User::select('id', 'name', 'email')->orderBy('name')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'required|string|max:50',
            'space_id' => 'nullable|exists:spaces,id',
            'task_list_id' => 'nullable|exists:task_lists,id',
            'parent_task_id' => 'nullable|exists:tasks,id',
            'assigned_to' => 'nullable|exists:users,id',
            'due_date' => 'nullable|date',
            'start_date' => 'nullable|date',
            'date_done' => 'nullable|date',
            'priority' => 'required|in:low,medium,high,urgent',
        ]);

        $position = (int) Task::where('task_list_id', $validated['task_list_id'] ?? null)
            ->where('parent_task_id', $validated['parent_task_id'] ?? null)
            ->max('position') + 1;

        Task::create([
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'status' => $validated['status'],
            'space_id' => $validated['space_id'] ?? null,
            'task_list_id' => $validated['task_list_id'] ?? null,
            'parent_task_id' => $validated['parent_task_id'] ?? null,
            'position' => $position,
            'created_by' => auth()->id(),
            'assigned_to' => $validated['assigned_to'] ?? null,
            'due_date' => $validated['due_date'] ?? null,
            'start_date' => $validated['start_date'] ?? null,
            'date_done' => $validated['date_done'] ?? null,
            'priority' => $validated['priority'] ?? 'medium',
        ]);

        return redirect()->back()->with('success', 'Task created successfully.');
    }

    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'description' => 'sometimes|nullable|string',
            'status' => 'sometimes|required|string|max:50',
            'assigned_to' => 'sometimes|nullable|exists:users,id',
            'task_list_id' => 'sometimes|nullable|exists:task_lists,id',
            'parent_task_id' => 'sometimes|nullable|exists:tasks,id',
            'position' => 'sometimes|integer|min:0',
            'due_date' => 'sometimes|nullable|date',
            'start_date' => 'sometimes|nullable|date',
            'date_done' => 'sometimes|nullable|date',
            'priority' => 'sometimes|required|in:low,medium,high,urgent',
        ]);

        $task = Task::findOrFail($id);

        // Handle auto Date Done based on status type
        if (isset($validated['status']) && $validated['status'] !== $task->status) {
            $status = \App\Models\TaskStatus::where('task_list_id', $task->task_list_id)
                ->where('key', $validated['status'])
                ->first();
            
            if ($status && $status->type === 'closed') {
                $validated['date_done'] = now()->toDateString();
            } else if ($status) {
                $validated['date_done'] = null;
            }
        }

        $task->update($validated);

        return redirect()->back()->with('success', 'Task updated successfully.');
    }

    public function destroy($id)
    {
        $task = Task::findOrFail($id);
        $task->delete();

        return redirect()->back()->with('success', 'Task deleted successfully.');
    }
}
