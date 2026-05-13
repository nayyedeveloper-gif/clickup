<?php

namespace App\Http\Controllers;

use App\Events\TaskCommentSent;
use App\Models\Task;
use App\Models\TaskComment;
use App\Services\TaskNotificationService;
use App\Support\SafeBroadcast;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TaskCommentController extends Controller
{
    public function __construct(private TaskNotificationService $notifications) {}

    public function index(Task $task): JsonResponse
    {
        $userId = (int) request()->user()->id;
        $comments = $task->comments()
            ->with([
                'user:id,name',
                'likes:id',
                'replies.user:id,name',
                'replies.likes:id',
            ])
            ->withCount('likes')
            ->whereNull('parent_id')
            ->latest()
            ->get();

        return response()->json([
            'comments' => $comments->map(fn (TaskComment $comment) => $this->serializeComment($comment, $userId)),
        ]);
    }

    public function store(Request $request, Task $task): RedirectResponse
    {
        $validated = $request->validate([
            'body' => ['required', 'string', 'max:5000'],
            'parent_id' => [
                'nullable',
                'integer',
                Rule::exists('task_comments', 'id')->where(fn ($q) => $q->where('task_id', $task->id)),
            ],
        ]);

        $comment = $task->comments()->create([
            'user_id' => $request->user()->id,
            'body' => $validated['body'],
            'is_read' => false,
            'parent_id' => $validated['parent_id'] ?? null,
        ]);

        SafeBroadcast::run(fn () => broadcast(new TaskCommentSent($comment))->toOthers());
        $this->notifications->notifyTaskCommented($task, (int) $request->user()->id);

        return back();
    }

    public function destroy(TaskComment $comment): RedirectResponse
    {
        abort_unless($comment->user_id === request()->user()->id, 403);

        $comment->delete();

        return back();
    }

    public function like(TaskComment $comment): RedirectResponse
    {
        $comment->likes()->syncWithoutDetaching([(int) request()->user()->id]);
        return back();
    }

    public function unlike(TaskComment $comment): RedirectResponse
    {
        $comment->likes()->detach((int) request()->user()->id);
        return back();
    }

    private function serializeComment(TaskComment $comment, int $userId): array
    {
        return [
            'id' => $comment->id,
            'task_id' => $comment->task_id,
            'user_id' => $comment->user_id,
            'parent_id' => $comment->parent_id,
            'body' => $comment->body,
            'created_at' => $comment->created_at?->toIso8601String(),
            'updated_at' => $comment->updated_at?->toIso8601String(),
            'user' => $comment->user ? [
                'id' => $comment->user->id,
                'name' => $comment->user->name,
            ] : null,
            'likes_count' => (int) ($comment->likes_count ?? $comment->likes->count()),
            'liked_by_me' => $comment->likes->contains('id', $userId),
            'replies' => $comment->relationLoaded('replies')
                ? $comment->replies
                    ->sortBy('created_at')
                    ->values()
                    ->map(fn (TaskComment $reply) => $this->serializeComment($reply, $userId))
                    ->all()
                : [],
        ];
    }
}
