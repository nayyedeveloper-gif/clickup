<?php

namespace App\Http\Controllers;

use App\Events\TaskCommentSent;
use App\Models\Task;
use App\Models\TaskComment;
use App\Services\TaskNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class TaskCommentController extends Controller
{
    public function __construct(private TaskNotificationService $notifications) {}

    public function index(Task $task): JsonResponse
    {
        $comments = $task->comments()->with('user:id,name')->latest()->get();

        return response()->json([
            'comments' => $comments,
        ]);
    }

    public function store(Request $request, Task $task): RedirectResponse
    {
        $validated = $request->validate([
            'body' => ['required', 'string', 'max:5000'],
        ]);

        $comment = $task->comments()->create([
            'user_id' => $request->user()->id,
            'body' => $validated['body'],
            'is_read' => false,
        ]);

        broadcast(new TaskCommentSent($comment))->toOthers();
        $this->notifications->notifyTaskCommented($task, (int) $request->user()->id);

        return back();
    }

    public function destroy(TaskComment $comment): RedirectResponse
    {
        abort_unless($comment->user_id === request()->user()->id, 403);

        $comment->delete();

        return back();
    }
}
