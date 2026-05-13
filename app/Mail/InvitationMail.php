<?php

namespace App\Mail;

use App\Models\Invitation;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class InvitationMail extends Mailable
{
    use Queueable, SerializesModels;

    public $invitation;
    public $inviter;

    public function __construct(Invitation $invitation, $inviter)
    {
        $this->invitation = $invitation;
        $this->inviter = $inviter;
    }

    public function envelope(): Envelope
    {
        $targetName = $this->invitation->team ? $this->invitation->team->name : ($this->invitation->space ? $this->invitation->space->name : 'the workspace');
        
        return new Envelope(
            subject: "You're invited to join {$targetName}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.invitation',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
