<?php

namespace App\Mail;

use App\Models\Channel;
use App\Models\Message;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class MessageNotificationMail extends Mailable
{
    use Queueable, SerializesModels;

    public $messageModel;

    public $user;

    public ?Channel $channel;

    public bool $isMention;

    public bool $isDirect;

    public function __construct(
        Message $message,
        User $user,
        ?Channel $channel,
        bool $isMention = false,
        bool $isDirect = false,
    ) {
        $this->messageModel = $message;
        $this->user = $user;
        $this->channel = $channel;
        $this->isMention = $isMention;
        $this->isDirect = $isDirect;
    }

    public function envelope(): Envelope
    {
        if ($this->isDirect) {
            $from = $this->messageModel->sender?->name ?? 'Someone';

            return new Envelope(
                subject: "New direct message from {$from}",
            );
        }

        $name = $this->channel?->name ?? 'Channel';

        $subject = $this->isMention
            ? "You were mentioned in {$name}"
            : "New message in {$name}";

        return new Envelope(
            subject: $subject,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.message-notification',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
