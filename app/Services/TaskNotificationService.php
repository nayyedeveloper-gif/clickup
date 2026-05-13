<?php

namespace App\Services;

use App\Events\TaskInboxNudge;
use App\Mail\TaskNotificationMail;
use App\Models\Task;
use App\Models\User;
use App\Notifications\TaskAssignedNotification;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class TaskNotificationService
{
    /**
     * Broadcast task assignment changes to affected users' inbox channels.
     */
    public function notifyAssignmentInboxRealtime(Task $task, mixed $oldAssigneeId = null): void
    {
        $task->loadMissing(['list:id,name']);

        $oldId = $oldAssigneeId !== null ? (int) $oldAssigneeId : null;
        $newId = $task->assigned_to ? (int) $task->assigned_to : null;

        $recipientIds = collect([$oldId, $newId])
            ->filter(fn ($id) => !is_null($id) && $id > 0)
            ->unique()
            ->values()
            ->all();

        if ($recipientIds === []) {
            Log::info('[TaskInboxRealtime] skipped (no recipients)', [
                'task_id' => (int) $task->id,
                'old_assignee_id' => $oldId,
                'new_assignee_id' => $newId,
            ]);
            return;
        }

        $action = $oldId && $newId
            ? 'reassigned'
            : ($newId ? 'assigned' : 'unassigned');

        $title = (string) ($task->title ?? 'Task');
        $message = match ($action) {
            'assigned' => 'You were assigned a task.',
            'unassigned' => 'A task was unassigned.',
            default => 'Task assignment was changed.',
        };

        Log::info('[TaskInboxRealtime] broadcasting', [
            'task_id' => (int) $task->id,
            'action' => $action,
            'old_assignee_id' => $oldId,
            'new_assignee_id' => $newId,
            'recipients' => $recipientIds,
        ]);

        broadcast(new TaskInboxNudge($recipientIds, [
            'task_id' => (int) $task->id,
            'list_id' => (int) ($task->task_list_id ?? 0),
            'title' => $title,
            'action' => $action,
            'old_assignee_id' => $oldId,
            'new_assignee_id' => $newId,
            'message' => $message,
            'url' => url('/lists/'.($task->task_list_id ?? '')),
        ]));
    }

    public function notifyTaskCreated(Task $task): void
    {
        $this->notifyAssignee($task, 'created');
        $this->notifyCreatorIfDifferent($task, 'created');
    }

    public function notifyTaskUpdated(Task $task): void
    {
        $this->notifyAssignee($task, 'updated');
        $this->notifyCreatorIfDifferent($task, 'updated');
    }

    public function notifyTaskCommented(Task $task, int $actorId): void
    {
        $task->loadMissing(['list:id,name']);

        $recipients = collect([$task->assigned_to, $task->created_by])
            ->filter()
            ->unique()
            ->reject(fn ($id) => (int) $id === (int) $actorId)
            ->values();

        $recipientIds = $recipients->map(fn ($id) => (int) $id)->all();

        foreach ($recipients as $uid) {
            $user = User::find($uid);
            if (! $user) {
                continue;
            }

            $message = 'There is a new comment on a task you are involved in.';
            $this->sendEmail($task, $user, 'commented', $message);
            $this->sendDatabaseNotification($user, $task, auth()->user()?->name ?? 'Someone', 'commented');
            $this->sendWebPush(
                $user,
                'Task comment',
                mb_substr((string) $task->title, 0, 140),
                url('/tasks/'.$task->id),
                'task-comment-'.$task->id
            );
        }

        if ($recipientIds !== []) {
            $actorName = auth()->user()?->name ?? 'Someone';
            broadcast(new TaskInboxNudge($recipientIds, [
                'task_id' => (int) $task->id,
                'list_id' => (int) ($task->task_list_id ?? 0),
                'title' => (string) ($task->title ?? 'Task'),
                'action' => 'commented',
                'message' => "{$actorName} commented on this task.",
                'url' => url('/tasks/'.$task->id),
            ]));
        }
    }

    private function notifyAssignee(Task $task, string $action): void
    {
        if (! $task->assigned_to) {
            return;
        }

        $assignedUser = User::find($task->assigned_to);
        if (! $assignedUser) {
            return;
        }

        $message = $action === 'created'
            ? 'You have been assigned a new task.'
            : 'A task assigned to you has been updated.';

        $this->sendEmail($task, $assignedUser, $action, $message);
        $this->sendDatabaseNotification($assignedUser, $task, auth()->user()?->name ?? 'Someone', $action === 'created' ? 'assigned' : 'updated');
        $this->sendWebPush(
            $assignedUser,
            $action === 'created' ? 'New assigned task' : 'Assigned task updated',
            mb_substr((string) $task->title, 0, 140),
            url('/tasks/'.$task->id),
            'task-assigned-'.$task->id
        );
    }

    private function notifyCreatorIfDifferent(Task $task, string $action): void
    {
        if (! $task->created_by) {
            return;
        }

        $actorId = auth()->id();
        if ((int) $task->created_by === (int) $actorId || (int) $task->created_by === (int) $task->assigned_to) {
            return;
        }

        $creator = User::find($task->created_by);
        if (! $creator) {
            return;
        }

        $message = $action === 'created'
            ? 'A task you created has been assigned.'
            : 'A task you created has been updated.';

        $this->sendEmail($task, $creator, $action, $message);
        $this->sendDatabaseNotification($creator, $task, auth()->user()?->name ?? 'Someone', $action === 'created' ? 'assigned' : 'updated');
        $this->sendWebPush(
            $creator,
            $action === 'created' ? 'Task assigned' : 'Task updated',
            mb_substr((string) $task->title, 0, 140),
            url('/tasks/'.$task->id),
            'task-owner-'.$task->id
        );
    }

    private function sendDatabaseNotification(User $user, Task $task, string $actorName, string $event): void
    {
        try {
            $user->notify(new TaskAssignedNotification(
                taskId: (int) $task->id,
                taskTitle: (string) ($task->title ?? 'Task'),
                actorName: $actorName,
                url: url('/tasks/'.$task->id),
                event: $event,
            ));
        } catch (\Throwable $e) {
            Log::warning('[Notification][Task] '.$e->getMessage());
        }
    }

    private function sendEmail(Task $task, User $user, string $action, string $message): void
    {
        if (! $user->email) {
            return;
        }

        try {
            Mail::to($user->email)->send(new TaskNotificationMail($task, $user, $action, $message));
        } catch (\Throwable $e) {
            Log::error('Failed to send task notification email: '.$e->getMessage());
        }
    }

    private function sendWebPush(User $user, string $title, string $body, string $url, string $tag): void
    {
        try {
            app(WebPushService::class)->sendToUser((int) $user->id, [
                'title' => $title,
                'body' => $body,
                'url' => $url,
                'tag' => $tag,
            ]);
        } catch (\Throwable $e) {
            Log::warning('[WebPush][Task] '.$e->getMessage());
        }
    }
}
