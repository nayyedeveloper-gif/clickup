<?php

namespace App\Observers;

use App\Models\Task;
use App\Services\TaskNotificationService;

class TaskObserver
{
    public function __construct(private TaskNotificationService $notifications) {}

    public function created(Task $task): void
    {
        $this->notifications->notifyTaskCreated($task);
        $this->notifications->notifyAssignmentInboxRealtime($task, null);
    }

    public function updated(Task $task): void
    {
        if ($task->wasChanged(['title', 'description', 'priority', 'status', 'due_date', 'assigned_to'])) {
            $this->notifications->notifyTaskUpdated($task);
        }

        if ($task->wasChanged('assigned_to')) {
            $previousAssigneeId = $task->getOriginal('assigned_to');
            $this->notifications->notifyAssignmentInboxRealtime($task, $previousAssigneeId);
        }
    }
}
