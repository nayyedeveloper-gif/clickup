<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TaskList extends Model
{
    protected $fillable = [
        'space_id',
        'folder_id',
        'created_by',
        'name',
        'description',
        'color',
        'icon',
        'is_favorite',
        'archived_at',
        'position',
    ];

    protected $casts = [
        'is_favorite' => 'boolean',
        'archived_at' => 'datetime',
    ];

    public function space(): BelongsTo
    {
        return $this->belongsTo(Space::class);
    }

    public function folder(): BelongsTo
    {
        return $this->belongsTo(Folder::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class)
            ->whereNull('parent_task_id')
            ->orderBy('position');
    }

    public function statuses(): HasMany
    {
        return $this->hasMany(TaskStatus::class)->orderBy('position');
    }

    protected static function booted(): void
    {
        static::created(function (self $list) {
            TaskStatus::seedDefaultsFor($list);
        });
    }
}
