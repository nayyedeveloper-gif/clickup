<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Lightweight task-inbox ping for per-user private channels.
 * Used for assignment / unassignment / reassignment realtime refresh.
 */
class TaskInboxNudge implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * @param  array<int>  $recipientUserIds
     * @param  array<string, mixed>  $payload
     */
    public function __construct(
        public array $recipientUserIds,
        public array $payload,
    ) {}

    /**
     * @return array<int, PrivateChannel>
     */
    public function broadcastOn(): array
    {
        return collect($this->recipientUserIds)
            ->map(fn (int $id) => new PrivateChannel('user.'.$id))
            ->values()
            ->all();
    }

    public function broadcastAs(): string
    {
        return 'inbox.task';
    }

    /**
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return $this->payload;
    }
}

