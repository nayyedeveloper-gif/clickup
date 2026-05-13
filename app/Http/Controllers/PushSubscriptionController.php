<?php

namespace App\Http\Controllers;

use App\Models\PushSubscription;
use App\Services\WebPushService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PushSubscriptionController extends Controller
{
    public function publicKey(): JsonResponse
    {
        return response()->json([
            'public_key' => config('webpush.public_key'),
        ]);
    }

    public function subscribe(Request $request): JsonResponse
    {
        $data = $request->validate([
            'endpoint' => ['required', 'url'],
            'keys.p256dh' => ['required', 'string'],
            'keys.auth' => ['required', 'string'],
        ]);

        $user = $request->user();
        $endpoint = $data['endpoint'];

        $sub = PushSubscription::updateOrCreate(
            [
                'user_id' => $user->id,
                'endpoint_hash' => hash('sha256', $endpoint),
            ],
            [
                'endpoint' => $endpoint,
                'p256dh_key' => $data['keys']['p256dh'],
                'auth_token' => $data['keys']['auth'],
                'user_agent' => substr((string) $request->userAgent(), 0, 255),
            ]
        );

        return response()->json(['ok' => true, 'id' => $sub->id]);
    }

    public function unsubscribe(Request $request): JsonResponse
    {
        $data = $request->validate([
            'endpoint' => ['required', 'url'],
        ]);

        PushSubscription::where('user_id', $request->user()->id)
            ->where('endpoint_hash', hash('sha256', $data['endpoint']))
            ->delete();

        return response()->json(['ok' => true]);
    }

    public function test(Request $request, WebPushService $push): JsonResponse
    {
        $push->sendToUser($request->user()->id, [
            'title' => '29 Management',
            'body' => 'Test notification — push is working!',
            'url' => url('/messages'),
            'tag' => 'test-notification',
        ]);
        return response()->json(['ok' => true]);
    }
}
