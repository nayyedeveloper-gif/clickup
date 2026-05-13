<?php

namespace App\Observers;

use App\Mail\InvitationAcceptedMail;
use App\Mail\InvitationMail;
use App\Models\Invitation;
use App\Models\User;
use Illuminate\Support\Facades\Mail;

class InvitationObserver
{
    public function created(Invitation $invitation)
    {
        // Send invitation email
        if ($invitation->email) {
            $inviter = User::find($invitation->invited_by);
            if ($inviter) {
                Mail::to($invitation->email)->send(new InvitationMail($invitation, $inviter));
            }
        }
    }

    public function updated(Invitation $invitation)
    {
        // Notify inviter when invitation is accepted
        if ($invitation->wasChanged('status') && $invitation->status === 'accepted') {
            $inviter = User::find($invitation->invited_by);
            $user = User::find($invitation->user_id);
            
            if ($inviter && $inviter->email && $user) {
                Mail::to($inviter->email)->send(new InvitationAcceptedMail($invitation, $user));
            }
        }
    }
}
