<?php

namespace App\Http\Controllers;

use App\Mail\InvitationAcceptedMail;
use App\Mail\InvitationMail;
use App\Models\Invitation;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Mail;

class InvitationController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'role' => 'required|in:admin,member',
            'space_id' => 'nullable|exists:spaces,id',
        ]);

        $token = Str::random(32);

        $invitation = Invitation::create([
            'email' => $validated['email'],
            'role' => $validated['role'],
            'space_id' => $validated['space_id'] ?? null,
            'invited_by' => auth()->id(),
            'token' => $token,
            'expires_at' => now()->addDays(7),
            'status' => 'pending',
        ]);

        // Send email with invitation link
        $inviter = auth()->user();
        Mail::to($validated['email'])->send(new InvitationMail($invitation, $inviter));

        return redirect()->back()->with('success', 'Invitation sent successfully.');
    }

    public function accept($token)
    {
        $invitation = Invitation::where('token', $token)->first();

        if (!$invitation) {
            return redirect()->route('login')->with('error', 'Invalid invitation link.');
        }

        if ($invitation->status === 'accepted') {
            // If already accepted and not logged in, go to login. If logged in, go to space/dashboard.
            if (auth()->check()) {
                if ($invitation->space_id) {
                    return redirect()->route('spaces.show', $invitation->space_id)->with('info', 'You have already accepted this invitation.');
                }
                return redirect()->route('dashboard')->with('info', 'You have already accepted this invitation.');
            }
            return redirect()->route('login')->with('info', 'This invitation has already been accepted. Please log in.');
        }

        if ($invitation->expires_at && $invitation->expires_at->isPast()) {
            return redirect()->route('login')->with('error', 'This invitation link has expired.');
        }

        // Check if user exists
        $user = User::where('email', $invitation->email)->first();

        if (!$user) {
            // User doesn't exist, redirect to register with the token
            return redirect()->route('register', ['token' => $token])->with('info', 'Please create an account to accept the invitation.');
        }

        // Auto-accept the invitation if user exists
        $invitation->update([
            'accepted_at' => now(),
            'status' => 'accepted',
            'user_id' => $user->id,
        ]);

        // Assign role to user if they don't have one or if it's a legacy user
        if ($user->role === 'member' || !$user->role) {
            $user->update([
                'role' => $invitation->role,
                'role_id' => $invitation->role === 'admin' ? 1 : 2,
            ]);
        }

        // Add user to team if team_id exists
        if ($invitation->team_id) {
            $team = \App\Models\Team::find($invitation->team_id);
            if ($team) {
                $team->members()->syncWithoutDetaching([$user->id => ['role' => 'member']]);
            }
        }

        // Add user to space if space_id exists
        if ($invitation->space_id) {
            $space = \App\Models\Space::find($invitation->space_id);
            if ($space) {
                $space->users()->syncWithoutDetaching([$user->id => ['role' => 'member']]);
            }
        }

        // Send confirmation email to inviter
        $inviter = User::find($invitation->invited_by);
        if ($inviter) {
            try {
                Mail::to($inviter->email)->send(new InvitationAcceptedMail($invitation, $user));
            } catch (\Exception $e) {
                // Log or ignore mail errors
            }
        }

        // Auto login if not logged in
        if (!auth()->check()) {
            auth()->login($user);
        }

        // Redirect to the invited space or dashboard
        if ($invitation->space_id) {
            return redirect()->route('spaces.show', $invitation->space_id)->with('success', 'Invitation accepted! You have been added to the space.');
        }

        return redirect()->route('dashboard')->with('success', 'Invitation accepted successfully.');
    }
}
