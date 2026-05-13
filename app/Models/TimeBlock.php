<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TimeBlock extends Model
{
    protected $fillable = [
        'user_id',
        'task_id',
        'title',
        'description',
        'color',
        'starts_at',
        'ends_at',
        'all_day',
    ];

    protected $casts = [
        'starts_at' => 'datetime',
        'ends_at' => 'datetime',
        'all_day' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }

    /**
     * Blocks overlapping a [from, to] window.
     */
    public function scopeOverlapping(Builder $query, $from, $to): Builder
    {
        return $query
            ->where('starts_at', '<', $to)
            ->where('ends_at', '>', $from);
    }
}
