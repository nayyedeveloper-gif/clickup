<?php

namespace App\Events;

use App\Models\Message;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageReactionUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Message $message;

    public function __construct(Message $message)
    {
        $this->message = $message->loadMissing(['reactions:id,message_id,user_id,emoji']);
    }

    public function broadcastOn(): array
    {
        if ($this->message->is_direct_message && $this->message->receiver_id) {
            $a = min($this->message->sender_id, $this->message->receiver_id);
            $b = max($this->message->sender_id, $this->message->receiver_id);
            return [new PresenceChannel("chat.dm.{$a}-{$b}")];
        }

        return [new PresenceChannel("chat.channel.{$this->message->channel_id}")];
    }

    public function broadcastAs(): string
    {
        return 'message.reaction';
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->message->id,
            'reactions' => $this->message->reactions->map(fn ($r) => [
                'id' => $r->id, 'user_id' => $r->user_id, 'emoji' => $r->emoji,
            ])->values(),
        ];
    }
}
