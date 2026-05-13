<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\TaskComment;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class InboxController extends Controller
{
    /**
     * Inbox: feed of recent activity touching the user
     *  - tasks recently assigned to me
     *  - tasks I'm assignee on with new comments by others
     *  - tasks I created with new comments by others
     */
    public function index(Request $request): Response
    {
        $userId = $request->user()->id;
        $since = now()->subDays(30);

        // Viewing Inbox clears "new inbox" badge baseline.
        $request->session()->put('inbox_last_seen_at', now()->toDateTimeString());

        $assignments = Task::with(['assignedTo:id,name', 'createdBy:id,name', 'list:id,name'])
            ->where('assigned_to', $userId)
            ->where('updated_at', '>=', $since)
            ->orderByDesc('updated_at')
            ->limit(20)
            ->get()
            ->map(fn (Task $t) => [
                'id' => "task-{$t->id}",
                'kind' => 'assignment',
                'task' => $t,
                'happened_at' => $t->updated_at,
                'actor' => $t->createdBy,
            ]);

        $commentItems = TaskComment::with([
                'task:id,title,assigned_to,created_by,task_list_id',
                'task.list:id,name',
                'user:id,name',
            ])
            ->whereHas('task', fn ($q) => $q
                ->where('assigned_to', $userId)
                ->orWhere('created_by', $userId))
            ->where('user_id', '!=', $userId)
            ->where('created_at', '>=', $since)
            ->orderByDesc('created_at')
            ->limit(40)
            ->get()
            ->map(fn (TaskComment $c) => [
                'id' => "comment-{$c->id}",
                'kind' => 'comment',
                'task' => $c->task,
                'comment' => $c,
                'happened_at' => $c->created_at,
                'actor' => $c->user,
            ]);

        $items = $assignments->concat($commentItems)
            ->sortByDesc('happened_at')
            ->values();

        // Mark inbox comments as read
        TaskComment::whereHas('task', fn ($q) => $q
                ->where('assigned_to', $userId)
                ->orWhere('created_by', $userId))
            ->where('user_id', '!=', $userId)
            ->where('is_read', false)
            ->update(['is_read' => true]);

        return Inertia::render('Inbox/Index', [
            'items' => $items,
        ]);
    }

    /**
     * Replies: comments on tasks I created where someone else replied.
     */
    public function replies(Request $request): Response
    {
        $userId = $request->user()->id;
        $tab = $request->input('tab', 'unread'); // 'unread' | 'read'

        $comments = TaskComment::with([
                'task:id,title,assigned_to,created_by,task_list_id',
                'task.list:id,name',
                'user:id,name',
            ])
            ->whereHas('task', fn ($q) => $q->where('created_by', $userId)->orWhere('assigned_to', $userId))
            ->where('user_id', '!=', $userId)
            ->orderByDesc('created_at')
            ->limit(50)
            ->get();

        // Mark replies as read if we are on the unread tab
        if ($tab === 'unread') {
            TaskComment::whereHas('task', fn ($q) => $q
                    ->where('created_by', $userId)
                    ->orWhere('assigned_to', $userId))
                ->where('user_id', '!=', $userId)
                ->where('is_read', false)
                ->update(['is_read' => true]);
        }

        return Inertia::render('Inbox/Replies', [
            'comments' => $comments,
            'tab' => $tab,
        ]);
    }

    /**
     * Comments on tasks where the current user is assignee but the comment is not theirs.
     */
    public function assignedComments(Request $request): Response
    {
        $userId = $request->user()->id;
        $resolved = $request->boolean('resolved');
        $range = (int) $request->input('range', 90); // days

        $query = TaskComment::with([
                'task:id,title,assigned_to,created_by,task_list_id',
                'task.list:id,name',
                'user:id,name',
            ])
            ->whereHas('task', fn ($q) => $q->where('assigned_to', $userId))
            ->where('user_id', '!=', $userId)
            ->where('created_at', '>=', now()->subDays($range));

        if ($resolved) {
            $query->where('is_resolved', true);
        }

        $comments = $query->orderByDesc('created_at')->limit(100)->get();

        // Mark assigned comments as read
        TaskComment::whereHas('task', fn ($q) => $q->where('assigned_to', $userId))
            ->where('user_id', '!=', $userId)
            ->where('is_read', false)
            ->update(['is_read' => true]);

        return Inertia::render('Inbox/AssignedComments', [
            'comments' => $comments,
            'filters' => [
                'resolved' => $resolved,
                'range' => $range,
            ],
        ]);
    }
}
