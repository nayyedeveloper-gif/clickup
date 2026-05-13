<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\HasApiTokens;

#[Fillable(['name', 'email', 'password', 'role', 'title', 'avatar_color', 'role_id', 'avatar_path', 'last_seen_at'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    protected $appends = ['avatar_url', 'is_online'];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'last_seen_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function getAvatarUrlAttribute(): ?string
    {
        if (! $this->avatar_path) {
            return null;
        }

        return Storage::disk('public')->url($this->avatar_path);
    }

    public function getIsOnlineAttribute(): bool
    {
        if (! $this->last_seen_at) {
            return false;
        }

        return $this->last_seen_at->gt(now()->subMinutes(2));
    }

    public function teams(): BelongsToMany
    {
        return $this->belongsToMany(Team::class, 'team_user')
            ->withPivot('role')
            ->withTimestamps();
    }

    public function spaces(): BelongsToMany
    {
        return $this->belongsToMany(Space::class, 'space_user')
            ->withPivot('role')
            ->withTimestamps();
    }

    public function channels(): BelongsToMany
    {
        return $this->belongsToMany(Channel::class, 'channel_user')
            ->withPivot('role')
            ->withTimestamps();
    }

    public function assignedTasks(): HasMany
    {
        return $this->hasMany(Task::class, 'assigned_to');
    }

    public function roleModel()
    {
        return $this->belongsTo(Role::class, 'role_id');
    }

    public function hasPermission(string $permissionSlug): bool
    {
        if (! $this->roleModel) {
            return false;
        }

        return $this->roleModel->permissions()->where('slug', $permissionSlug)->exists();
    }

    public function hasAnyPermission(array $permissionSlugs): bool
    {
        if (! $this->roleModel) {
            return false;
        }

        return $this->roleModel->permissions()->whereIn('slug', $permissionSlugs)->exists();
    }

    public function hasRole(string $roleSlug): bool
    {
        // Check string role column
        if ($this->role === $roleSlug) {
            return true;
        }

        // Check role model relation
        if (! $this->roleModel) {
            return false;
        }

        return $this->roleModel->slug === $roleSlug;
    }

    /**
     * Super admin: may edit the role ↔ permission matrix (users.permissions).
     */
    public function isSuperAdmin(): bool
    {
        return $this->hasRole('super-admin');
    }

    /**
     * Legacy + slug: first admin account or explicit super-admin / admin role.
     * Used for space listing, invites, and channel audit visibility.
     */
    public function hasPlatformAdminAccess(): bool
    {
        if ($this->hasRole('super-admin') || $this->hasRole('admin')) {
            return true;
        }

        return (int) $this->role_id === 1;
    }

    /**
     * See all tasks in a list (not only those assigned to self).
     */
    public function canViewAllTasksInSharedLists(): bool
    {
        if ($this->hasPlatformAdminAccess()) {
            return true;
        }

        if (in_array($this->role, ['admin', 'owner', 'manager'], true)) {
            return true;
        }

        return $this->hasRole('manager');
    }
}
