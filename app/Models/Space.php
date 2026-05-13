<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Space extends Model
{
    protected $fillable = ['name', 'description', 'color', 'icon', 'parent_id', 'created_by', 'is_personal'];

    protected $casts = ['is_personal' => 'boolean'];

    public function parent(): BelongsTo
    {
        return $this->belongsTo(Space::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(Space::class, 'parent_id');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }

    public function folders(): HasMany
    {
        return $this->hasMany(Folder::class)->orderBy('position');
    }

    public function lists(): HasMany
    {
        return $this->hasMany(TaskList::class)
            ->whereNull('folder_id')
            ->orderBy('position');
    }

    public function channels(): HasMany
    {
        return $this->hasMany(Channel::class);
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'space_user')
            ->withPivot('role')
            ->withTimestamps();
    }

    public function invitations(): HasMany
    {
        return $this->hasMany(Invitation::class);
    }

    /**
     * Top-level spaces the user may list (membership / creator, or full access for system admin / spaces.manage).
     */
    public static function queryAccessibleBy(User $user): Builder
    {
        $query = static::query()->whereNull('parent_id');

        $fullAccess = $user->hasPlatformAdminAccess() || $user->hasPermission('spaces.manage');

        if (! $fullAccess) {
            $query->where(function ($q) use ($user) {
                $q->where('created_by', $user->id)
                    ->orWhereHas('users', function ($uq) use ($user) {
                        $uq->where('users.id', $user->id);
                    });
            });
        }

        return $query;
    }

    /**
     * Shared / team spaces only (excludes personal spaces from sidebar-style listings).
     */
    public static function queryWorkspaceAccessibleBy(User $user): Builder
    {
        return static::queryAccessibleBy($user)->where('is_personal', false);
    }
}
