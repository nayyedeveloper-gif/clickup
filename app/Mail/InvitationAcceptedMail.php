<?php

namespace App\Mail;

use App\Models\Invitation;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class InvitationAcceptedMail extends Mailable
{
    use Queueable, SerializesModels;

    public $invitation;
    public $user;

    public function __construct(Invitation $invitation, User $user)
    {
        $this->invitation = $invitation;
        $this->user = $user;
    }

    public function envelope(): Envelope
    {
        $targetName = $this->invitation->team ? $this->invitation->team->name : ($this->invitation->space ? $this->invitation->space->name : 'the workspace');
        $userName = $this->user ? $this->user->name : $this->invitation->email;
        
        return new Envelope(
            subject: "{$userName} accepted your invitation to {$targetName}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.invitation-accepted',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
