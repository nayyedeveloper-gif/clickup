<?php

namespace App\Policies;

use App\Models\Space;
use App\Models\User;

class SpacePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermission('spaces.view');
    }

    public function view(User $user, Space $space): bool
    {
        if (! $user->hasPermission('spaces.view')) {
            return false;
        }

        return $this->userCanAccessSpace($user, $space);
    }

    public function create(User $user): bool
    {
        return $user->hasPermission('spaces.view');
    }

    public function update(User $user, Space $space): bool
    {
        if (! $user->hasPermission('spaces.view')) {
            return false;
        }

        return $this->userCanManageSpace($user, $space);
    }

    public function delete(User $user, Space $space): bool
    {
        return $this->update($user, $space);
    }

    private function userCanAccessSpace(User $user, Space $space): bool
    {
        if ($this->isSystemAdmin($user)) {
            return true;
        }

        if ($user->hasPermission('spaces.manage')) {
            return true;
        }

        return (int) $space->created_by === (int) $user->id
            || $this->isSpaceMember($user, $space);
    }

    private function userCanManageSpace(User $user, Space $space): bool
    {
        if ($this->isSystemAdmin($user)) {
            return true;
        }

        if ($user->hasPermission('spaces.manage')) {
            return true;
        }

        if ((int) $space->created_by === (int) $user->id) {
            return true;
        }

        return $space->users()
            ->where('users.id', $user->id)
            ->whereIn('space_user.role', ['owner', 'manager'])
            ->exists();
    }

    private function isSpaceMember(User $user, Space $space): bool
    {
        return $space->users()->where('users.id', $user->id)->exists();
    }

    private function isSystemAdmin(User $user): bool
    {
        return (int) $user->role_id === 1;
    }
}
