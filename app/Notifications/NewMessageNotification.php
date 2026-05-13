<?php

namespace App\Notifications;

use App\Models\Message;
use Illuminate\Bus\Queueable;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;

class NewMessageNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly Message $message,
        private readonly string $senderName,
        private readonly string $preview,
        private readonly string $url,
        private readonly string $context, // 'dm' | 'channel'
        private readonly ?string $channelName = null,
    ) {}

    public function via($notifiable): array
    {
        return ['database', 'broadcast'];
    }

    public function toArray($notifiable): array
    {
        return [
            'type' => 'message',
            'context' => $this->context,
            'message_id' => $this->message->id,
            'channel_id' => $this->message->channel_id,
            'sender_id' => $this->message->sender_id,
            'sender_name' => $this->senderName,
            'channel_name' => $this->channelName,
            'preview' => $this->preview,
            'url' => $this->url,
            'title' => $this->context === 'dm'
                ? $this->senderName
                : ($this->channelName ? "#{$this->channelName}" : 'New message'),
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
