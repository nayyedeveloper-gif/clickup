<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Pipeline extends Model
{
    protected $fillable = ['name', 'is_default', 'position'];

    protected $casts = ['is_default' => 'boolean'];

    public const DEFAULT_STAGES = [
        ['name' => 'Lead',          'color' => '#9ca3af', 'type' => 'open', 'probability' => 10],
        ['name' => 'Qualified',     'color' => '#3b82f6', 'type' => 'open', 'probability' => 30],
        ['name' => 'Proposal',      'color' => '#a855f7', 'type' => 'open', 'probability' => 60],
        ['name' => 'Negotiation',   'color' => '#eab308', 'type' => 'open', 'probability' => 80],
        ['name' => 'Won',           'color' => '#10b981', 'type' => 'won',  'probability' => 100],
        ['name' => 'Lost',          'color' => '#ef4444', 'type' => 'lost', 'probability' => 0],
    ];

    public function stages(): HasMany
    {
        return $this->hasMany(PipelineStage::class)->orderBy('position');
    }

    public function deals(): HasMany
    {
        return $this->hasMany(Deal::class);
    }

    protected static function booted(): void
    {
        static::created(function (self $pipeline) {
            foreach (self::DEFAULT_STAGES as $i => $row) {
                $pipeline->stages()->create([...$row, 'position' => $i]);
            }
        });
    }
}
