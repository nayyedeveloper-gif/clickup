<?php

namespace App\Services;

use App\Events\MessageInboxNudge;
use App\Models\Channel;
use App\Models\Message;
use App\Models\User;
use App\Notifications\NewMessageNotification;
use App\Support\SafeBroadcast;
use Illuminate\Support\Facades\Log;

class ChatInboxNotifier
{
    /**
     * Private user-channel nudge + optional web push for offline recipients.
     */
    public static function notify(Message $message): void
    {
        $message->loadMissing(['sender:id,name', 'channel.users:id', 'attachments']);

        $recipientIds = self::recipientUserIds($message);
        if ($recipientIds === []) {
            return;
        }

        $senderName = $message->sender?->name ?? 'Someone';
        $preview = $message->previewForNotification();
        $url = self::inboxUrl($message);
        $context = $message->is_direct_message ? 'dm' : 'channel';

        SafeBroadcast::run(fn () => broadcast(new MessageInboxNudge($recipientIds, [
            'message_id' => $message->id,
            'sender_id' => $message->sender_id,
            'sender_name' => $senderName,
            'preview' => $preview,
            'context' => $context,
            'channel_id' => $message->channel_id,
            'url' => $url,
        ])));

        $push = app(WebPushService::class);
        $channelName = $message->channel?->name;

        foreach ($recipientIds as $rid) {
            $user = User::find($rid);
            if (! $user) {
                continue;
            }

            // Always create a persistent in-app notification (also triggers broadcast).
            try {
                $user->notify(new NewMessageNotification(
                    message: $message,
                    senderName: $senderName,
                    preview: (string) $preview,
                    url: $url,
                    context: $context,
                    channelName: $channelName,
                ));
            } catch (\Throwable $e) {
                Log::warning('[Notification] '.$e->getMessage());
            }

            // Web push to all subscribed devices (works when the app is closed). The service worker
            // skips showing a tray notification if the user already has a focused tab open.
            try {
                $push->sendToUser($rid, [
                    'title' => $senderName,
                    'body' => mb_substr((string) $preview, 0, 140),
                    'url' => $url,
                    'tag' => $context === 'dm'
                        ? 'dm-'.$message->sender_id
                        : 'channel-'.$message->channel_id,
                ]);
            } catch (\Throwable $e) {
                Log::warning('[WebPush] '.$e->getMessage());
            }
        }
    }

    /**
     * @return array<int>
     */
    private static function recipientUserIds(Message $message): array
    {
        if ($message->is_direct_message && $message->receiver_id
            && (int) $message->receiver_id !== (int) $message->sender_id) {
            return [(int) $message->receiver_id];
        }

        if (! $message->channel_id) {
            return [];
        }

        $channel = $message->relationLoaded('channel') && $message->channel
            ? $message->channel
            : Channel::query()->with('users')->find($message->channel_id);

        if (! $channel) {
            return [];
        }

        $ids = $channel->users->pluck('id')->push($channel->created_by)->unique()->filter();

        return $ids
            ->reject(fn ($id) => (int) $id === (int) $message->sender_id)
            ->values()
            ->map(fn ($id) => (int) $id)
            ->all();
    }

    private static function inboxUrl(Message $message): string
    {
        if ($message->is_direct_message && $message->receiver_id) {
            return url('/messages?user='.$message->sender_id);
        }
        if ($message->channel_id) {
            return url('/channels/'.$message->channel_id);
        }

        return url('/messages');
    }
}
