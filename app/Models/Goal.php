<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Goal extends Model
{
    protected $fillable = [
        'owner_id',
        'folder_id',
        'name',
        'description',
        'target_type',
        'target_value',
        'current_value',
        'unit',
        'start_date',
        'due_date',
        'status',
        'color',
        'position',
    ];

    protected $casts = [
        'start_date' => 'date',
        'due_date' => 'date',
        'target_value' => 'float',
        'current_value' => 'float',
    ];

    protected $appends = ['progress'];

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function folder(): BelongsTo
    {
        return $this->belongsTo(GoalFolder::class, 'folder_id');
    }

    protected function progress(): Attribute
    {
        return Attribute::get(function () {
            if ($this->target_type === 'boolean') {
                return $this->current_value >= 1 ? 100 : 0;
            }
            if (! $this->target_value || $this->target_value <= 0) {
                return 0;
            }
            $pct = ($this->current_value / $this->target_value) * 100;
            return max(0, min(100, round($pct, 1)));
        });
    }
}
