<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CrmActivity extends Model
{
    protected $fillable = [
        'user_id', 'contact_id', 'company_id', 'deal_id',
        'type', 'subject', 'body', 'happened_at',
    ];

    protected $casts = [
        'happened_at' => 'datetime',
    ];

    public const TYPES = ['note', 'call', 'email', 'meeting', 'task'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class);
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function deal(): BelongsTo
    {
        return $this->belongsTo(Deal::class);
    }
}
