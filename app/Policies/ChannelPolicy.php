<?php

namespace App\Policies;

use App\Models\Channel;
use App\Models\User;

class ChannelPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermission('chat.view');
    }

    public function view(User $user, Channel $channel): bool
    {
        if (! $user->hasPermission('chat.view')) {
            return false;
        }

        return $this->userCanViewChannel($user, $channel);
    }

    /**
     * Create a new channel (web/API). Requires chat + ability to post in chat.
     */
    public function create(User $user): bool
    {
        return $user->hasPermission('chat.view') && $user->hasPermission('chat.send');
    }

    public function update(User $user, Channel $channel): bool
    {
        if (! $this->view($user, $channel)) {
            return false;
        }

        return $this->canManageChannelSettings($user, $channel);
    }

    public function delete(User $user, Channel $channel): bool
    {
        if (! $this->view($user, $channel)) {
            return false;
        }

        // Public channels: only the creator may delete (not space members / channel admins).
        if (! $channel->is_private) {
            return (int) $channel->created_by === (int) $user->id;
        }

        return $this->canManageChannelSettings($user, $channel);
    }

    public function addMember(User $user, Channel $channel): bool
    {
        if (! $this->view($user, $channel)) {
            return false;
        }

        if ($channel->is_private) {
            $isMember = $channel->users()->where('users.id', $user->id)->exists();
            $isCreator = $channel->created_by === $user->id;

            return $isMember || $isCreator;
        }

        if ($channel->space_id) {
            return $user->spaces()->where('spaces.id', $channel->space_id)->exists();
        }

        return true;
    }

    public function removeMember(User $user, Channel $channel, User $member): bool
    {
        if (! $this->view($user, $channel)) {
            return false;
        }

        if ($channel->created_by === $user->id) {
            return true;
        }

        if ($user->id === $member->id) {
            return true;
        }

        return $this->isSystemAdmin($user);
    }

    /**
     * Post or forward a message into this channel.
     */
    public function sendMessage(User $user, Channel $channel): bool
    {
        if (! $user->hasPermission('chat.send')) {
            return false;
        }

        return $this->userCanParticipateInChannel($user, $channel);
    }

    /**
     * Read-only access (browse): includes moderator bypass for public channels in a space.
     */
    private function userCanViewChannel(User $user, Channel $channel): bool
    {
        if ($channel->is_private) {
            return $channel->created_by === $user->id
                || $channel->users()->where('users.id', $user->id)->exists();
        }

        if ((int) $channel->created_by === (int) $user->id) {
            return true;
        }

        if ($channel->space_id && $this->canViewPublicChannelWithoutSpaceMembership($user)) {
            return true;
        }

        if ($channel->space_id) {
            return $user->spaces()->where('spaces.id', $channel->space_id)->exists();
        }

        return true;
    }

    /**
     * Post messages: must be a normal participant (space member for public-in-space), no admin bypass.
     */
    private function userCanParticipateInChannel(User $user, Channel $channel): bool
    {
        if ($channel->is_private) {
            return $channel->created_by === $user->id
                || $channel->users()->where('users.id', $user->id)->exists();
        }

        if ($channel->space_id) {
            return (int) $channel->created_by === (int) $user->id
                || $user->spaces()->where('spaces.id', $channel->space_id)->exists();
        }

        return true;
    }

    /**
     * App / system admins need to audit public channels even when not added to the space.
     */
    private function canViewPublicChannelWithoutSpaceMembership(User $user): bool
    {
        return $this->isSystemAdmin($user)
            || $user->hasPermission('chat.manage')
            || $user->hasPermission('users.manage')
            || $user->hasRole('admin');
    }

    private function canManageChannelSettings(User $user, Channel $channel): bool
    {
        return $this->isSystemAdmin($user)
            || $channel->created_by === $user->id
            || $this->isChannelAdmin($user, $channel);
    }

    private function isChannelAdmin(User $user, Channel $channel): bool
    {
        return $channel->users()
            ->where('users.id', $user->id)
            ->where('channel_user.role', 'admin')
            ->exists();
    }

    private function isSystemAdmin(User $user): bool
    {
        return (int) $user->role_id === 1;
    }
}
