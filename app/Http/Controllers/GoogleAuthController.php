<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Laravel\Socialite\Facades\Socialite;

class GoogleAuthController extends Controller
{
    /**
     * Redirect the user to the Google authentication page.
     */
    public function redirect()
    {
        return Socialite::driver('google')->redirect();
    }

    /**
     * Obtain the user information from Google.
     */
    public function callback()
    {
        try {
            $googleUser = Socialite::driver('google')->user();
        } catch (\Exception $e) {
            return redirect()->route('login')->with('error', 'Google login failed. Please try again.');
        }

        // Find or create user
        $user = User::where('email', $googleUser->email)->first();

        if (!$user) {
            // Create new user
            $user = User::create([
                'name' => $googleUser->name,
                'email' => $googleUser->email,
                'password' => Hash::make(uniqid()), // Random password since they use Google auth
                'role' => 'member',
                'email_verified_at' => now(),
            ]);
        } else {
            // Update email verified if not already verified
            if (!$user->email_verified_at) {
                $user->email_verified_at = now();
                $user->save();
            }
        }

        // Login the user
        Auth::login($user, true);

        return redirect()->intended(route('home'));
    }

    /**
     * Mobile API: Login with Google access token.
     */
    public function mobileLogin(Request $request)
    {
        $request->validate([
            'access_token' => 'required|string',
        ]);

        try {
            $googleUser = Socialite::driver('google')->userFromToken($request->access_token);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Invalid Google token.'
            ], 401);
        }

        // Find or create user
        $user = User::where('email', $googleUser->email)->first();

        if (!$user) {
            $user = User::create([
                'name' => $googleUser->name,
                'email' => $googleUser->email,
                'password' => Hash::make(uniqid()),
                'role_id' => 2,
                'email_verified_at' => now(),
            ]);
        } elseif (!$user->email_verified_at) {
            $user->email_verified_at = now();
            $user->save();
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user' => array_merge($user->toArray(), [
                'permissions' => $user->roleModel ? $user->roleModel->permissions->pluck('slug')->toArray() : [],
            ]),
            'access_token' => $token,
            'token_type' => 'Bearer',
        ]);
    }
}
