<?php

namespace App\Models;

use App\Observers\MessageObserver;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Message extends Model
{
    protected static function booted()
    {
        static::observe(MessageObserver::class);
    }

    protected $fillable = [
        'channel_id',
        'sender_id',
        'receiver_id',
        'content',
        'type',
        'sticker_key',
        'reply_to_id',
        'forwarded_from_id',
        'is_direct_message',
        'is_read',
        'edited_at',
    ];

    protected $casts = [
        'is_direct_message' => 'boolean',
        'is_read' => 'boolean',
        'edited_at' => 'datetime',
    ];

    public function channel(): BelongsTo
    {
        return $this->belongsTo(Channel::class);
    }

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function receiver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'receiver_id');
    }

    public function replyTo(): BelongsTo
    {
        return $this->belongsTo(Message::class, 'reply_to_id');
    }

    public function forwardedFrom(): BelongsTo
    {
        return $this->belongsTo(Message::class, 'forwarded_from_id');
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(MessageAttachment::class);
    }

    public function reactions(): HasMany
    {
        return $this->hasMany(MessageReaction::class);
    }

    public function mentions(): HasMany
    {
        return $this->hasMany(MessageMention::class);
    }

    public function previewForNotification(): string
    {
        if ($this->type === 'sticker') {
            return '🎨 Sticker';
        }
        if (trim((string) $this->content) !== '') {
            return mb_substr((string) $this->content, 0, 140);
        }
        if ($this->relationLoaded('attachments')) {
            if ($this->attachments->isNotEmpty()) {
                return '📎 Attachment';
            }
        } elseif ($this->attachments()->exists()) {
            return '📎 Attachment';
        }

        return 'New message';
    }
}
