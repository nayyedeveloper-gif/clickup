<?php

namespace App\Support;

use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Avoid 500s when Reverb/Pusher is unreachable (e.g. local dev without `php artisan reverb:start`).
 */
final class SafeBroadcast
{
    public static function run(callable $broadcast): void
    {
        try {
            $broadcast();
        } catch (Throwable $e) {
            Log::debug('Broadcast skipped (server unreachable or misconfigured)', [
                'message' => $e->getMessage(),
            ]);
        }
    }
}
