<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Contact extends Model
{
    protected $fillable = [
        'company_id', 'owner_id', 'first_name', 'last_name',
        'email', 'phone', 'title', 'status', 'notes',
    ];

    public const STATUSES = ['lead', 'prospect', 'customer', 'lost'];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function deals(): HasMany
    {
        return $this->hasMany(Deal::class);
    }

    public function activities(): HasMany
    {
        return $this->hasMany(CrmActivity::class);
    }

    protected function fullName(): Attribute
    {
        return Attribute::make(
            get: fn () => trim(($this->first_name ?? '').' '.($this->last_name ?? ''))
        );
    }
}
