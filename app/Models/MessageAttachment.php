<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MessageAttachment extends Model
{
    protected $fillable = [
        'message_id',
        'disk',
        'path',
        'original_name',
        'mime_type',
        'size_bytes',
        'width',
        'height',
    ];

    protected $appends = ['url', 'is_image'];

    public function message(): BelongsTo
    {
        return $this->belongsTo(Message::class);
    }

    public function getUrlAttribute(): string
    {
        // Serve via authenticated route so files work without public/storage symlink
        // and stay restricted to thread participants.
        return route('messages.attachments.show', ['messageAttachment' => $this->getKey()], false);
    }

    public function getIsImageAttribute(): bool
    {
        $mime = strtolower((string) $this->mime_type);

        if (str_contains($mime, 'heic') || str_contains($mime, 'heif')) {
            return false;
        }

        if ($mime !== '' && str_starts_with($mime, 'image/')) {
            return true;
        }

        $ext = strtolower((string) pathinfo((string) $this->original_name, PATHINFO_EXTENSION));
        if ($ext === '' && $this->path) {
            $ext = strtolower((string) pathinfo((string) basename($this->path), PATHINFO_EXTENSION));
        }

        return in_array($ext, ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'bmp'], true);
    }
}
