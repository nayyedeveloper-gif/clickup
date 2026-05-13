<?php

use App\Models\Channel;
use Illuminate\Support\Facades\Broadcast;

/*
 * Private channel authorisation.
 *
 * These callbacks determine whether the authenticated user is allowed to
 * listen on the given private channel.
 */

// Presence channel for a chat channel — any member of the Channel (or public) may join.
Broadcast::channel('chat.channel.{channelId}', function ($user, int $channelId) {
    $channel = Channel::find($channelId);
    if (! $channel) {
        return false;
    }

    // Public channels: any authenticated user.
    if (! $channel->is_private) {
        return ['id' => $user->id, 'name' => $user->name];
    }

    // Private channels: user must be an explicit channel member.
    $isMember = $channel->users()->where('users.id', $user->id)->exists();
    if ($isMember) {
        return ['id' => $user->id, 'name' => $user->name];
    }

    // Fallback: the creator can always join their own private channel.
    return $channel->created_by === $user->id
        ? ['id' => $user->id, 'name' => $user->name]
        : false;
});

// DM presence channel — ordered pair (smaller id . "-" . larger id).
Broadcast::channel('chat.dm.{pair}', function ($user, string $pair) {
    [$a, $b] = array_map('intval', explode('-', $pair) + [1 => 0]);
    if ($a <= 0 || $b <= 0) {
        return false;
    }

    return ($user->id === $a || $user->id === $b)
        ? ['id' => $user->id, 'name' => $user->name]
        : false;
});

// Per-user private channel for inbox nudges (DM / channel while on other pages)
Broadcast::channel('user.{id}', function ($user, int $id) {
    return (int) $user->id === (int) $id;
});

// Laravel database notification broadcasts (Echo `private()` + `notification()`)
Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

// Global presence channel — tracks who is online across the whole app.
Broadcast::channel('presence.global', function ($user) {
    return [
        'id' => $user->id,
        'name' => $user->name,
        'avatar_url' => $user->avatar_url ?? null,
    ];
});
