<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Task;
use App\Models\TaskComment;
use Illuminate\Http\Request;

class TaskController extends Controller
{
    public function index(Request $request)
    {
        $query = Task::visibleTo($request->user())
            ->with(['assignedTo:id,name,avatar_path,last_seen_at', 'list']);

        if ($request->has('list_id')) {
            $query->where('list_id', $request->list_id);
        }

        if ($request->has('assigned_to')) {
            $query->where('assigned_to', $request->assigned_to);
        }

        $tasks = $query->orderBy('created_at', 'desc')->get();
        return response()->json($tasks);
    }

    public function show(Task $task)
    {
        $task->load(['assignee', 'comments.user', 'subtasks', 'tags']);
        return response()->json($task);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'list_id' => 'required|exists:lists,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'assigned_to' => 'nullable|exists:users,id',
            'due_date' => 'nullable|date',
            'priority' => 'nullable|string',
            'status' => 'nullable|string',
        ]);

        $task = Task::create(array_merge($validated, [
            'created_by' => auth()->id(),
        ]));

        return response()->json($task, 201);
    }

    public function update(Request $request, Task $task)
    {
        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'assigned_to' => 'nullable|exists:users,id',
            'due_date' => 'nullable|date',
            'priority' => 'nullable|string',
            'status' => 'nullable|string',
        ]);

        $task->update($validated);
        return response()->json($task);
    }

    public function addComment(Request $request, Task $task)
    {
        $validated = $request->validate([
            'content' => 'required|string',
        ]);

        $comment = $task->comments()->create([
            'user_id' => auth()->id(),
            'content' => $validated['content'],
        ]);

        return response()->json($comment->load('user:id,name,avatar_path,last_seen_at'), 201);
    }

    public function destroy(Task $task)
    {
        $task->delete();
        return response()->json(['message' => 'Task deleted successfully']);
    }
}
