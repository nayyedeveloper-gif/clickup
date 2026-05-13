<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Lightweight inbox ping for each recipient's private channel (any page in the app).
 * Keeps badges fresh without duplicating full MessageSent on the open chat thread.
 */
class MessageInboxNudge implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * @param  array<int>  $recipientUserIds
     * @param  array{message_id:int,sender_id:int,sender_name:string,preview:string,context:string,channel_id:?int,url:string}  $payload
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
        return 'inbox.message';
    }

    /**
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return $this->payload;
    }
}
