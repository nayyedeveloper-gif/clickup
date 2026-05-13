<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class GoalFolder extends Model
{
    protected $fillable = ['user_id', 'name', 'color', 'position'];

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function goals(): HasMany
    {
        return $this->hasMany(Goal::class, 'folder_id')->orderBy('position');
    }
}
