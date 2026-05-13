<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PresenceController extends Controller
{
    /**
     * Heartbeat endpoint: updates the authenticated user's last_seen_at timestamp.
     * Called periodically from the client (every ~60 seconds).
     */
    public function heartbeat(Request $request): JsonResponse
    {
        $user = $request->user();
        if ($user) {
            $user->forceFill(['last_seen_at' => now()])->save();
        }

        return response()->json(['ok' => true, 'server_time' => now()->toIso8601String()]);
    }

    /**
     * Bulk presence lookup: returns is_online + last_seen_at for a set of users.
     */
    public function lookup(Request $request): JsonResponse
    {
        $ids = collect($request->input('ids', []))
            ->map(fn ($v) => (int) $v)
            ->filter()
            ->unique()
            ->values()
            ->all();

        if (empty($ids)) {
            return response()->json(['users' => []]);
        }

        $users = User::whereIn('id', $ids)
            ->get(['id', 'last_seen_at'])
            ->map(fn ($u) => [
                'id' => $u->id,
                'is_online' => $u->is_online,
                'last_seen_at' => $u->last_seen_at?->toIso8601String(),
            ]);

        return response()->json(['users' => $users]);
    }
}
