<?php

namespace App\Http\Middleware;

use App\Models\Channel;
use App\Models\Message;
use App\Models\Space;
use App\Models\Task;
use App\Models\TaskComment;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();
        $isSpaceManager = false;

        if ($user) {
            $isSpaceManager = Space::whereHas('users', function ($query) use ($user) {
                $query->where('users.id', $user->id)
                    ->whereIn('space_user.role', ['owner', 'manager']);
            })->exists();
        }

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user ? array_merge($user->toArray(), [
                    'role_id' => $user->role_id,
                    'permissions' => $user->roleModel ? $user->roleModel->permissions->pluck('slug')->toArray() : [],
                    'is_space_manager' => $isSpaceManager,
                ]) : null,
            ],
            'sidebar' => fn () => $user ? $this->sidebarData($request) : null,
            'badges' => fn () => $user ? $this->badges($request) : null,
            'notifications' => fn () => $user ? $this->notificationsData($user) : null,
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
        ];
    }

    private function notificationsData(User $user): array
    {
        $recent = $user->notifications()
            ->latest()
            ->limit(20)
            ->get()
            ->map(function ($n) {
                $data = $n->data ?? [];

                return [
                    'id' => $n->id,
                    'type' => $data['type'] ?? 'generic',
                    'title' => $data['title'] ?? 'Notification',
                    'preview' => $data['preview'] ?? '',
                    'url' => $data['url'] ?? null,
                    'data' => $data,
                    'read_at' => optional($n->read_at)?->toIso8601String(),
                    'created_at' => optional($n->created_at)?->toIso8601String(),
                ];
            })
            ->values()
            ->all();

        return [
            'unread_count' => $user->unreadNotifications()->count(),
            'items' => $recent,
        ];
    }

    private function badges(Request $request): array
    {
        $userId = $request->user()->id;
        $today = now()->toDateString();
        $lastSeenAt = $request->session()->get('inbox_last_seen_at');

        $todayCount = Task::where('assigned_to', $userId)
            ->where(function ($q) use ($today) {
                $q->whereDate('due_date', '<=', $today);
            })
            ->whereNull('date_done')
            ->count();

        $assignedCount = Task::where('assigned_to', $userId)
            ->whereNull('date_done')
            ->count();

        // Unread replies (comments on tasks created by user)
        $repliesCount = TaskComment::whereHas('task', fn ($q) => $q->where('created_by', $userId))
            ->where('user_id', '!=', $userId)
            ->where('is_read', false)
            ->count();

        // Unread assigned comments (comments on tasks assigned to user)
        $assignedCommentsCount = TaskComment::whereHas('task', fn ($q) => $q->where('assigned_to', $userId))
            ->where('user_id', '!=', $userId)
            ->where('is_read', false)
            ->count();

        // Inbox feed window (keep badge aligned with InboxController)
        $inboxSince = now()->subDays(30);

        // Unread comments that belong in the Inbox feed (same OR as InboxController) — one row per
        // comment, avoids double-counting when the user is both creator and assignee on a task.
        $inboxUnreadComments = TaskComment::whereHas('task', fn ($q) => $q
            ->where('assigned_to', $userId)
            ->orWhere('created_by', $userId))
            ->where('user_id', '!=', $userId)
            ->where('is_read', false)
            ->where('created_at', '>=', $inboxSince)
            ->count();

        // "New" assignments: same window as inbox; when user has opened Inbox before, only after that.
        $newAssignmentsCount = Task::where('assigned_to', $userId)
            ->where('created_by', '!=', $userId)
            ->where('updated_at', '>=', $inboxSince)
            ->when($lastSeenAt, fn ($q) => $q->where('updated_at', '>', $lastSeenAt))
            ->count();

        // Sidebar Inbox badge: unread inbox-thread comments + assignment activity (not replies+assigned sum).
        $inboxCount = $inboxUnreadComments + $newAssignmentsCount;

        // Direct Message unread counts
        $unreadMessages = Message::where('receiver_id', $userId)
            ->where('is_read', false)
            ->where('is_direct_message', true)
            ->count();

        // Unread counts by sender for sidebar members list
        $unreadBySender = Message::where('receiver_id', $userId)
            ->where('is_read', false)
            ->where('is_direct_message', true)
            ->groupBy('sender_id')
            ->selectRaw('sender_id, count(*) as count')
            ->pluck('count', 'sender_id')
            ->toArray();

        // Simple Channel unread check (has messages in last 24h from others)
        $newChannelMessages = Message::whereNotNull('channel_id')
            ->where('sender_id', '!=', $userId)
            ->where('created_at', '>=', now()->subDay())
            ->groupBy('channel_id')
            ->pluck('channel_id')
            ->toArray();

        return [
            'assigned' => $assignedCount,
            'today' => $todayCount,
            'inbox' => $inboxCount,
            'replies' => $repliesCount,
            'assignedComments' => $assignedCommentsCount,
            'newAssignments' => $newAssignmentsCount,
            'chat' => $unreadMessages,
            'unreadBySender' => $unreadBySender,
            'newChannels' => $newChannelMessages,
        ];
    }

    private function sidebarData(Request $request): array
    {
        $userId = $request->user()->id;

        if (! $request->user()->hasPermission('spaces.view')) {
            $spaces = collect();

            $channels = Channel::where(function ($query) use ($userId) {
                $query->where('is_private', false);

                $query->orWhere(function ($privateQuery) use ($userId) {
                    $privateQuery->where('is_private', true)
                        ->where(function ($membershipQuery) use ($userId) {
                            $membershipQuery->where('created_by', $userId)
                                ->orWhereHas('users', function ($userQuery) use ($userId) {
                                    $userQuery->where('users.id', $userId);
                                });
                        });
                });
            })
                ->orderBy('name')
                ->get(['id', 'name', 'is_private']);

            $directMessages = Message::with(['sender:id,name', 'receiver:id,name'])
                ->where('is_direct_message', true)
                ->where(function ($query) use ($userId) {
                    $query->where('sender_id', $userId)
                        ->orWhere('receiver_id', $userId);
                })
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($message) use ($userId) {
                    return $message->sender_id === $userId ? $message->receiver : $message->sender;
                })
                ->filter()
                ->unique('id')
                ->values();

            $allMembers = User::select('id', 'name', 'email', 'avatar_path', 'last_seen_at')
                ->where('id', '!=', $userId)
                ->orderBy('name')
                ->get();

            return [
                'spaces' => $spaces,
                'channels' => $channels,
                'directMessages' => $directMessages,
                'allMembers' => $allMembers,
            ];
        }

        $spaces = Space::queryWorkspaceAccessibleBy($request->user())
            ->withCount([
                'tasks as active_tasks_count' => fn ($q) => $q->whereIn('status', ['to_do', 'todo', 'in_progress', 'pending']),
                'tasks as completed_tasks_count' => fn ($q) => $q->where('status', 'completed'),
            ])->with([
                'children' => fn ($q) => $q
                    ->select('id', 'name', 'parent_id', 'color', 'icon')
                    ->withCount([
                        'tasks as active_tasks_count' => fn ($qq) => $qq->whereIn('status', ['to_do', 'todo', 'in_progress', 'pending']),
                        'tasks as completed_tasks_count' => fn ($qq) => $qq->where('status', 'completed'),
                    ]),
                'folders' => fn ($q) => $q->select('id', 'space_id', 'name', 'color', 'position')
                    ->withCount(['tasks as active_tasks_count' => fn ($q) => $q->whereIn('status', ['to_do', 'todo', 'in_progress', 'pending'])]),
                'folders.lists' => fn ($q) => $q->select('id', 'space_id', 'folder_id', 'name', 'color', 'position')
                    ->withCount(['tasks as active_tasks_count' => fn ($q) => $q->whereIn('status', ['to_do', 'todo', 'in_progress', 'pending'])]),
                'lists' => fn ($q) => $q->select('id', 'space_id', 'folder_id', 'name', 'color', 'position')
                    ->withCount(['tasks as active_tasks_count' => fn ($q) => $q->whereIn('status', ['to_do', 'todo', 'in_progress', 'pending'])]),
            ])
            ->orderBy('created_at', 'desc')
            ->get(['id', 'name', 'parent_id', 'color', 'icon']);

        $channels = Channel::where(function ($query) use ($userId) {
            // Public channels are visible workspace-wide.
            $query->where('is_private', false);

            // Private channels must include the user as creator or member.
            $query->orWhere(function ($privateQuery) use ($userId) {
                $privateQuery->where('is_private', true)
                    ->where(function ($membershipQuery) use ($userId) {
                        $membershipQuery->where('created_by', $userId)
                            ->orWhereHas('users', function ($userQuery) use ($userId) {
                                $userQuery->where('users.id', $userId);
                            });
                    });
            });
        })
            ->orderBy('name')
            ->get(['id', 'name', 'is_private']);

        $directMessages = Message::with(['sender:id,name', 'receiver:id,name'])
            ->where('is_direct_message', true)
            ->where(function ($query) use ($userId) {
                $query->where('sender_id', $userId)
                    ->orWhere('receiver_id', $userId);
            })
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($message) use ($userId) {
                return $message->sender_id === $userId ? $message->receiver : $message->sender;
            })
            ->filter()
            ->unique('id')
            ->values();

        // Get all members for direct messages
        $allMembers = User::select('id', 'name', 'email', 'avatar_path', 'last_seen_at')
            ->where('id', '!=', $userId)
            ->orderBy('name')
            ->get();

        return [
            'spaces' => $spaces,
            'channels' => $channels,
            'directMessages' => $directMessages,
            'allMembers' => $allMembers,
        ];
    }
}
