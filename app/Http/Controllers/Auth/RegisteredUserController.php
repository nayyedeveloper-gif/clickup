<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    /**
     * Display the registration view.
     */
    public function create(Request $request): Response
    {
        $email = '';
        if ($request->has('token')) {
            $invitation = \App\Models\Invitation::where('token', $request->token)
                ->where('status', 'pending')
                ->where('expires_at', '>', now())
                ->first();
            
            if ($invitation) {
                $email = $invitation->email;
            }
        }

        return Inertia::render('Auth/Register', [
            'email' => $email,
            'token' => $request->token,
        ]);
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'token' => 'nullable|string|exists:invitations,token',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);

        event(new Registered($user));

        Auth::login($user);

        // Handle invitation if token is present
        if ($request->filled('token')) {
            $invitation = \App\Models\Invitation::where('token', $request->token)
                ->where('status', 'pending')
                ->where('expires_at', '>', now())
                ->first();

            if ($invitation) {
                // Auto-accept the invitation
                $invitation->update([
                    'accepted_at' => now(),
                    'status' => 'accepted',
                    'user_id' => $user->id,
                ]);

                // Assign role to user
                $user->update([
                    'role' => $invitation->role,
                    'role_id' => $invitation->role === 'admin' ? 1 : 2,
                ]);

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
                    return redirect()->route('spaces.show', $invitation->space_id)->with('success', 'Registration successful! You have been added to the workspace.');
                }
            }
        }

        return redirect(route('dashboard', absolute: false));
    }
}
