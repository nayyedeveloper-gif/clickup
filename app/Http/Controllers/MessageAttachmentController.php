<?php

namespace App\Http\Controllers;

use App\Models\MessageAttachment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Throwable;

class MessageAttachmentController extends Controller
{
    /**
     * Stream a message attachment after auth + thread membership checks.
     * S3: redirect to a short-lived presigned URL (avoids stream / Content-Disposition bugs with Flysystem).
     * Local: streamed response with a safe ASCII filename for Content-Disposition.
     */
    public function show(Request $request, MessageAttachment $messageAttachment)
    {
        $message = $messageAttachment->message()->with('channel')->first();
        abort_unless($message, 404);

        $userId = (int) $request->user()->id;

        if ($message->is_direct_message) {
            $allowed = $message->sender_id === $userId || $message->receiver_id === $userId;
        } else {
            $allowed = $message->channel_id
                && $message->channel
                && Gate::forUser($request->user())->allows('view', $message->channel);
        }

        abort_unless($allowed, 403);

        $diskName = $messageAttachment->disk;
        $disk = Storage::disk($diskName);
        abort_unless($disk->exists($messageAttachment->path), 404);

        $original = $messageAttachment->original_name ?: basename($messageAttachment->path);
        $safeName = $this->safeContentDispositionFilename($original);

        $mime = (string) ($messageAttachment->mime_type ?: 'application/octet-stream');
        if ($mime === 'application/octet-stream' && method_exists($disk, 'mimeType')) {
            try {
                $detected = $disk->mimeType($messageAttachment->path);
                if (is_string($detected) && $detected !== '') {
                    $mime = $detected;
                }
            } catch (Throwable) {
                /* keep default */
            }
        }

        $isImage = str_starts_with($mime, 'image/');
        $forceDownload = $request->boolean('download') || ! $isImage;

        $driver = (string) (config("filesystems.disks.{$diskName}.driver") ?? '');

        if ($driver === 's3') {
            if (! $disk->providesTemporaryUrls()) {
                Log::error('[MessageAttachment] S3 disk without temporary URL support', [
                    'attachment_id' => $messageAttachment->id,
                    'disk' => $diskName,
                ]);
                abort(502, 'Could not generate a download link for this attachment.');
            }
            try {
                $disposition = $forceDownload ? 'attachment' : 'inline';
                $cd = $disposition.'; filename="'.$safeName.'"';

                $url = $disk->temporaryUrl(
                    $messageAttachment->path,
                    now()->addMinutes(30),
                    [
                        'ResponseContentType' => $mime,
                        'ResponseContentDisposition' => $cd,
                    ]
                );

                return redirect()->away($url);
            } catch (Throwable $e) {
                Log::error('[MessageAttachment] presigned URL failed', [
                    'attachment_id' => $messageAttachment->id,
                    'message' => $e->getMessage(),
                ]);
                abort(502, 'Could not generate a download link for this attachment.');
            }
        }

        return $disk->response(
            $messageAttachment->path,
            $safeName,
            ['Content-Type' => $mime],
            $forceDownload ? 'attachment' : 'inline'
        );
    }

    /**
     * ASCII-safe basename for Content-Disposition / S3 presign (avoids Symfony 500 on odd characters).
     */
    private function safeContentDispositionFilename(string $filename): string
    {
        $base = basename(str_replace(["\r", "\n", '"', '<', '>'], '', $filename));
        $ascii = @iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $base);
        if ($ascii !== false && $ascii !== '') {
            $base = preg_replace('/[^A-Za-z0-9._\-]+/', '_', $ascii) ?: 'file';
        } else {
            $base = preg_replace('/[^\p{L}\p{N}._\-]/u', '_', $base) ?: 'file';
        }

        return mb_substr($base, 0, 180) ?: 'file';
    }
}
