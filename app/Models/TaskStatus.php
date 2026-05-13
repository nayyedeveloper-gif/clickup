<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TaskStatus extends Model
{
    protected $fillable = [
        'task_list_id',
        'key',
        'label',
        'color',
        'type',
        'position',
    ];

    public const TYPES = ['open', 'active', 'closed'];

    public const DEFAULTS = [
        ['key' => 'to_do', 'label' => 'To Do', 'color' => '#9ca3af', 'type' => 'open'],
        ['key' => 'in_progress', 'label' => 'In Progress', 'color' => '#3b82f6', 'type' => 'active'],
        ['key' => 'completed', 'label' => 'Completed', 'color' => '#10b981', 'type' => 'closed'],
    ];

    public function list(): BelongsTo
    {
        return $this->belongsTo(TaskList::class, 'task_list_id');
    }

    public static function seedDefaultsFor(TaskList $list): void
    {
        foreach (self::DEFAULTS as $i => $row) {
            self::create([
                ...$row,
                'task_list_id' => $list->id,
                'position' => $i,
            ]);
        }
    }
}
