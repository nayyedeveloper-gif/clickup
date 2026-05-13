<?php

namespace App\Http\Controllers;

use App\Mail\InvitationAcceptedMail;
use App\Mail\InvitationMail;
use App\Models\Invitation;
use App\Models\Space;
use App\Models\Team;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class InviteController extends Controller
{
    public function index(Request $request): Response
    {
        // Permission check
        if (! $request->user()->hasPermission('invite.users') && ! $request->user()->hasPlatformAdminAccess()) {
            return redirect()->back()->with('error', 'You do not have permission to access this resource.');
        }

        $invitations = Invitation::with(['space:id,name', 'invitedBy:id,name'])
            ->where('invited_by', $request->user()->id)
            ->orderByDesc('created_at')
            ->limit(50)
            ->get();

        $members = User::select('id', 'name', 'email', 'role', 'title')
            ->orderBy('name')
            ->get();

        // Admin users can see all spaces, others only see spaces where they are owner or manager
        $spacesQuery = Space::where('is_personal', false);
        if (! $request->user()->hasPlatformAdminAccess()) {
            $spacesQuery->whereHas('users', function ($query) use ($request) {
                $query->where('users.id', $request->user()->id)
                    ->whereIn('space_user.role', ['owner', 'manager']);
            });
        }
        $spaces = $spacesQuery->orderBy('name')->get(['id', 'name']);

        return Inertia::render('Invite/Index', [
            'invitations' => $invitations,
            'members' => $members,
            'spaces' => $spaces,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email', 'max:160'],
            'role' => ['nullable', 'in:admin,member'],
            'space_id' => ['nullable', 'exists:spaces,id'],
        ]);

        // Permission check: if space_id is provided, user must be owner or manager of that space (unless admin)
        if ($validated['space_id']) {
            $space = Space::find($validated['space_id']);
            $canInviteToSpace = $space->users()
                ->where('users.id', $request->user()->id)
                ->whereIn('space_user.role', ['owner', 'manager'])
                ->exists();
            $isAdmin = $request->user()->hasPlatformAdminAccess();

            if (! $canInviteToSpace && ! $isAdmin) {
                return back()->with('error', 'You must be an owner or manager of this space to invite people.');
            }
        }

        $invitation = Invitation::create([
            'email' => $validated['email'],
            'token' => Str::random(48),
            'role' => $validated['role'] ?? 'member',
            'space_id' => $validated['space_id'] ?? null,
            'invited_by' => $request->user()->id,
            'expires_at' => now()->addDays(14),
            'status' => 'pending',
        ]);

        // Best-effort email
        try {
            if (class_exists(InvitationMail::class)) {
                $inviter = $request->user();
                Mail::to($invitation->email)->send(new InvitationMail($invitation, $inviter));
            }
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Failed to send invitation email: '.$e->getMessage());
        }

        return back()->with('success', 'Invitation sent to '.$invitation->email);
    }

    public function destroy(Invitation $invitation): RedirectResponse
    {
        abort_unless($invitation->invited_by === request()->user()->id, 403);
        $invitation->delete();

        return back();
    }

    public function resend(Invitation $invitation): RedirectResponse
    {
        abort_unless($invitation->invited_by === request()->user()->id, 403);

        $invitation->update([
            'token' => Str::random(48),
            'expires_at' => now()->addDays(14),
            'accepted_at' => null,
            'status' => 'pending',
        ]);

        try {
            if (class_exists(InvitationMail::class)) {
                $inviter = User::find($invitation->invited_by);
                Mail::to($invitation->email)->send(new InvitationMail($invitation, $inviter));
            }
        } catch (\Throwable $e) {
            // ignore
        }

        return back()->with('success', 'Invitation resent.');
    }

    public function approve(Invitation $invitation): RedirectResponse
    {
        abort_unless($invitation->invited_by === request()->user()->id, 403);

        $invitation->update([
            'status' => 'accepted',
            'accepted_at' => now(),
        ]);

        // Check if user exists
        $user = User::where('email', $invitation->email)->first();

        if ($user) {
            // Assign role to user
            $user->update(['role' => $invitation->role]);

            // Add user to team if team_id exists
            if ($invitation->team_id) {
                $team = Team::find($invitation->team_id);
                if ($team) {
                    $team->members()->syncWithoutDetaching([$user->id => ['role' => 'member']]);
                }
            }

            // Add user to space if space_id exists
            if ($invitation->space_id) {
                $space = Space::find($invitation->space_id);
                if ($space) {
                    $space->users()->syncWithoutDetaching([$user->id => ['role' => 'member']]);
                }
            }
        }

        // Send confirmation email to inviter (always send, even if user doesn't exist yet)
        $inviter = User::find($invitation->invited_by);
        if ($inviter) {
            try {
                if (class_exists(InvitationAcceptedMail::class)) {
                    Mail::to($inviter->email)->send(new InvitationAcceptedMail($invitation, $user));
                }
            } catch (\Throwable $e) {
                \Log::error('Failed to send invitation accepted email: '.$e->getMessage());
            }
        }

        return back()->with('success', 'Invitation approved successfully.');
    }
}
