<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TaskComment extends Model
{
    protected $fillable = ['task_id', 'user_id', 'body', 'is_resolved', 'is_read', 'parent_id'];

    protected $casts = ['is_resolved' => 'boolean', 'is_read' => 'boolean'];

    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    public function replies(): HasMany
    {
        return $this->hasMany(self::class, 'parent_id')->oldest();
    }

    public function likes(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'task_comment_likes', 'comment_id', 'user_id')->withTimestamps();
    }
}
