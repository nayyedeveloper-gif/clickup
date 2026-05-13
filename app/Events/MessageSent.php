<?php

namespace App\Events;

use App\Models\Message;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageSent implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Message $message;

    public function __construct(Message $message)
    {
        $this->message = $message->loadMissing([
            'sender:id,name',
            'receiver:id,name',
            'attachments',
            'reactions:id,message_id,user_id,emoji',
            'replyTo:id,sender_id,content,type,sticker_key',
            'replyTo.sender:id,name',
        ]);
    }

    public function broadcastOn(): array
    {
        if ($this->message->is_direct_message && $this->message->receiver_id) {
            $a = min($this->message->sender_id, $this->message->receiver_id);
            $b = max($this->message->sender_id, $this->message->receiver_id);
            $channelName = "chat.dm.{$a}-{$b}";
            \Log::info("Broadcasting message to channel: " . $channelName, [
                'sender_id' => $this->message->sender_id,
                'receiver_id' => $this->message->receiver_id,
            ]);
            return [new PresenceChannel($channelName)];
        }

        return [new PresenceChannel("chat.channel.{$this->message->channel_id}")];
    }

    public function broadcastAs(): string
    {
        return 'message.sent';
    }

    public function broadcastWith(): array
    {
        return ['message' => $this->message->toArray()];
    }
}
