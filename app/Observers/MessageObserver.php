<?php

namespace App\Observers;

use App\Mail\MessageNotificationMail;
use App\Models\Message;
use App\Models\User;
use Illuminate\Support\Facades\Mail;

class MessageObserver
{
    public function created(Message $message): void
    {
        $messageId = (int) $message->id;

        dispatch(function () use ($messageId) {
            $fresh = Message::query()
                ->with(['sender:id,name', 'mentions', 'channel'])
                ->find($messageId);

            if (! $fresh) {
                return;
            }

            if ($fresh->is_direct_message && $fresh->receiver_id) {
                $receiver = User::find($fresh->receiver_id);
                if ($receiver && $receiver->email && $receiver->id !== $fresh->sender_id) {
                    Mail::to($receiver->email)->send(new MessageNotificationMail($fresh, $receiver, null, false, true));
                }

                return;
            }

            $channel = $fresh->channel;
            if (! $channel) {
                return;
            }

            $mentions = $fresh->mentions()->pluck('user_id')->toArray();

            foreach ($mentions as $userId) {
                if ($userId === $fresh->sender_id) {
                    continue;
                }

                $user = User::find($userId);
                if (! $user || ! $user->email) {
                    continue;
                }

                Mail::to($user->email)->send(new MessageNotificationMail($fresh, $user, $channel, true, false));
            }
        })->afterResponse();
    }
}
