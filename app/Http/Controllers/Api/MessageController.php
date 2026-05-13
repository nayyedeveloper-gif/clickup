<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Message;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MessageController extends Controller
{
    public function index()
    {
        $userId = auth()->id();
        
        // Get recent conversations
        $recentMessages = Message::where(function($q) use ($userId) {
                $q->where('sender_id', $userId)
                  ->orWhere('receiver_id', $userId);
            })
            ->whereNull('channel_id')
            ->with(['sender:id,name,avatar_path,last_seen_at', 'receiver:id,name,avatar_path,last_seen_at'])
            ->orderBy('created_at', 'desc')
            ->get();

        $conversations = $recentMessages->groupBy(function($msg) use ($userId) {
            return $msg->sender_id === $userId ? $msg->receiver_id : $msg->sender_id;
        })->map(function($msgs) {
            return $msgs->first();
        })->values();

        return response()->json($conversations);
    }

    public function show(User $user)
    {
        $userId = auth()->id();
        $partnerId = $user->id;

        $messages = Message::where(function($q) use ($userId, $partnerId) {
                $q->where('sender_id', $userId)->where('receiver_id', $partnerId);
            })
            ->orWhere(function($q) use ($userId, $partnerId) {
                $q->where('sender_id', $partnerId)->where('receiver_id', $userId);
            })
            ->whereNull('channel_id')
            ->with(['sender:id,name,avatar_path,last_seen_at', 'receiver:id,name,avatar_path,last_seen_at'])
            ->orderBy('created_at', 'desc')
            ->paginate(50);

        return response()->json($messages);
    }

    public function store(Request $request, User $user)
    {
        $validated = $request->validate([
            'content' => 'required|string',
        ]);

        $message = Message::create([
            'sender_id' => auth()->id(),
            'receiver_id' => $user->id,
            'content' => $validated['content'],
        ]);

        return response()->json($message->load(['sender', 'receiver']), 201);
    }
}
