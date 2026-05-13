<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;

class TaskAssignedNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly int $taskId,
        private readonly string $taskTitle,
        private readonly string $actorName,
        private readonly string $url,
        private readonly string $event, // 'assigned' | 'commented' | 'updated'
    ) {}

    public function via($notifiable): array
    {
        return ['database', 'broadcast'];
    }

    public function toArray($notifiable): array
    {
        $body = match ($this->event) {
            'commented' => "{$this->actorName} commented on a task",
            'updated' => "{$this->actorName} updated a task",
            default => "{$this->actorName} assigned you a task",
        };

        return [
            'type' => 'task',
            'event' => $this->event,
            'task_id' => $this->taskId,
            'task_title' => $this->taskTitle,
            'actor_name' => $this->actorName,
            'url' => $this->url,
            'title' => $this->taskTitle,
            'preview' => $body,
        ];
    }

    public function toBroadcast($notifiable): BroadcastMessage
    {
        return new BroadcastMessage($this->toArray($notifiable));
    }

    public function broadcastType(): string
    {
        return 'notification.created';
    }
}
