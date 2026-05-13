<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Channel;
use App\Models\Space;
use Illuminate\Http\Request;

class ChannelController extends Controller
{
    public function index(Space $space)
    {
        $this->authorize('viewAny', Channel::class);

        $user = auth()->user();

        abort_unless(
            $space->users()->where('users.id', $user->id)->exists(),
            403,
            'You must be a member of this space.'
        );

        $channels = Channel::query()
            ->where('space_id', $space->id)
            ->where(function ($query) use ($user) {
                $query->where(function ($q) {
                    $q->where('is_private', false);
                })->orWhere(function ($q) use ($user) {
                    $q->where('is_private', true)
                        ->where(function ($inner) use ($user) {
                            $inner->where('created_by', $user->id)
                                ->orWhereHas('users', function ($qq) use ($user) {
                                    $qq->where('users.id', $user->id);
                                });
                        });
                });
            })
            ->orderBy('name')
            ->get();

        return response()->json($channels);
    }

    public function show(Channel $channel)
    {
        $this->authorize('view', $channel);

        $channel->load(['space', 'users:id,name,avatar_path,last_seen_at']);

        return response()->json($channel);
    }

    public function messages(Channel $channel)
    {
        $this->authorize('view', $channel);

        $messages = $channel->messages()
            ->with('sender:id,name,avatar_path,last_seen_at')
            ->orderBy('created_at', 'desc')
            ->paginate(50);

        return response()->json($messages);
    }

    public function sendMessage(Request $request, Channel $channel)
    {
        $this->authorize('sendMessage', $channel);

        $validated = $request->validate([
            'content' => 'required|string',
            'parent_id' => 'nullable|exists:messages,id',
        ]);

        $message = $channel->messages()->create([
            'sender_id' => auth()->id(),
            'content' => $validated['content'],
            'reply_to_id' => $validated['parent_id'] ?? null,
        ]);

        return response()->json($message->load('sender:id,name,avatar_path,last_seen_at'), 201);
    }

    public function store(Request $request)
    {
        $this->authorize('create', Channel::class);

        $validated = $request->validate([
            'space_id' => 'required|exists:spaces,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'is_private' => 'nullable|boolean',
        ]);

        if (! $request->user()->spaces()->where('spaces.id', $validated['space_id'])->exists()) {
            abort(403, 'You must be a member of this space to create a channel in it.');
        }

        $channel = Channel::create(array_merge($validated, [
            'created_by' => auth()->id(),
        ]));

        $channel->users()->syncWithoutDetaching([
            auth()->id() => ['role' => 'admin'],
        ]);

        return response()->json($channel, 201);
    }
}
