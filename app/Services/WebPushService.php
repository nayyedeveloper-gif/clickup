<?php

namespace App\Services;

use App\Models\PushSubscription;
use Illuminate\Support\Facades\Log;
use Minishlink\WebPush\Subscription as WebPushSubscriptionObject;
use Minishlink\WebPush\WebPush;

class WebPushService
{
    private ?WebPush $webPush = null;

    private function client(): ?WebPush
    {
        if ($this->webPush !== null) {
            return $this->webPush;
        }

        $public = config('webpush.public_key');
        $private = config('webpush.private_key');
        $subject = config('webpush.subject');

        if (! $public || ! $private) {
            Log::warning('[WebPush] VAPID keys are not configured.');
            return null;
        }

        $this->webPush = new WebPush([
            'VAPID' => [
                'subject' => $subject,
                'publicKey' => $public,
                'privateKey' => $private,
            ],
        ]);

        return $this->webPush;
    }

    /**
     * Send a push notification to all subscriptions of a user.
     *
     * @param int   $userId
     * @param array $payload Array with keys: title, body, icon, url, tag
     */
    public function sendToUser(int $userId, array $payload): void
    {
        $client = $this->client();
        if (! $client) return;

        $subs = PushSubscription::where('user_id', $userId)->get();
        if ($subs->isEmpty()) return;

        $json = json_encode([
            'title' => $payload['title'] ?? 'New notification',
            'body' => $payload['body'] ?? '',
            'icon' => $payload['icon'] ?? '/logo.png',
            'badge' => $payload['badge'] ?? '/logo.png',
            'url' => $payload['url'] ?? '/',
            'tag' => $payload['tag'] ?? null,
        ]);

        foreach ($subs as $sub) {
            $subscription = WebPushSubscriptionObject::create([
                'endpoint' => $sub->endpoint,
                'keys' => [
                    'p256dh' => $sub->p256dh_key,
                    'auth' => $sub->auth_token,
                ],
            ]);
            $client->queueNotification($subscription, $json);
        }

        // Flush all queued notifications and prune invalid ones
        foreach ($client->flush() as $report) {
            if (! $report->isSuccess()) {
                $statusCode = $report->getResponse()?->getStatusCode();
                if (in_array($statusCode, [404, 410], true)) {
                    $endpoint = $report->getRequest()->getUri()->__toString();
                    PushSubscription::where('endpoint_hash', hash('sha256', $endpoint))->delete();
                }
            }
        }
    }
}
