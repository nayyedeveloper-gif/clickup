<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    private const MAX_PER_PAGE = 50;

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $limit = min((int) $request->query('limit', 20), self::MAX_PER_PAGE);

        $items = $user->notifications()
            ->latest()
            ->limit($limit)
            ->get()
            ->map(fn ($n) => $this->transform($n))
            ->values();

        return response()->json([
            'items' => $items,
            'unread_count' => $user->unreadNotifications()->count(),
        ]);
    }

    public function markRead(Request $request, string $id): JsonResponse
    {
        $user = $request->user();
        $notification = $user->notifications()->whereKey($id)->first();

        if (! $notification) {
            return response()->json(['ok' => false, 'message' => 'Not found.'], 404);
        }

        if ($notification->unread()) {
            $notification->markAsRead();
        }

        return response()->json([
            'ok' => true,
            'unread_count' => $user->unreadNotifications()->count(),
        ]);
    }

    public function markAllRead(Request $request): JsonResponse
    {
        $request->user()->unreadNotifications->markAsRead();

        return response()->json([
            'ok' => true,
            'unread_count' => 0,
        ]);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $user = $request->user();
        $notification = $user->notifications()->whereKey($id)->first();

        if (! $notification) {
            return response()->json(['ok' => false], 404);
        }

        $notification->delete();

        return response()->json([
            'ok' => true,
            'unread_count' => $user->unreadNotifications()->count(),
        ]);
    }

    private function transform($notification): array
    {
        $data = $notification->data ?? [];

        return [
            'id' => $notification->id,
            'type' => $data['type'] ?? 'generic',
            'title' => $data['title'] ?? 'Notification',
            'preview' => $data['preview'] ?? '',
            'url' => $data['url'] ?? null,
            'data' => $data,
            'read_at' => optional($notification->read_at)->toIso8601String(),
            'created_at' => optional($notification->created_at)->toIso8601String(),
        ];
    }
}
