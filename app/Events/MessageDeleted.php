<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageDeleted implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public int $messageId,
        public ?int $channelId,
        public ?int $senderId,
        public ?int $receiverId,
    ) {}

    public function broadcastOn(): array
    {
        if ($this->channelId) {
            return [new PresenceChannel("chat.channel.{$this->channelId}")];
        }
        if ($this->senderId && $this->receiverId) {
            $a = min($this->senderId, $this->receiverId);
            $b = max($this->senderId, $this->receiverId);
            return [new PresenceChannel("chat.dm.{$a}-{$b}")];
        }
        return [];
    }

    public function broadcastAs(): string
    {
        return 'message.deleted';
    }

    public function broadcastWith(): array
    {
        return ['id' => $this->messageId];
    }
}
