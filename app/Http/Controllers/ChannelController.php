<?php

namespace App\Http\Controllers;

use App\Models\Channel;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ChannelController extends Controller
{
    public function index()
    {
        $this->authorize('viewAny', Channel::class);

        $user = auth()->user();

        $channels = Channel::with('creator', 'space')
            ->withCount('users')
            ->where(function ($query) use ($user) {
                $query->where('is_private', false)
                    ->whereHas('space', function ($q) use ($user) {
                        $q->whereHas('users', function ($qq) use ($user) {
                            $qq->where('users.id', $user->id);
                        });
                    });
            })
            ->orWhere(function ($query) use ($user) {
                $query->where('is_private', true)
                    ->where(function ($q) use ($user) {
                        $q->where('created_by', $user->id)
                            ->orWhereHas('users', function ($qq) use ($user) {
                                $qq->where('users.id', $user->id);
                            });
                    });
            })
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('Channels/Index', [
            'channels' => $channels,
        ]);
    }

    public function create()
    {
        $this->authorize('create', Channel::class);

        return Inertia::render('Channels/Create');
    }

    public function store(Request $request)
    {
        $this->authorize('create', Channel::class);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'space_id' => 'nullable|exists:spaces,id',
            'is_private' => 'boolean',
        ]);

        if (! empty($validated['space_id'])
            && ! $request->user()->spaces()->where('spaces.id', $validated['space_id'])->exists()) {
            abort(403, 'You must be a member of this space to create a channel in it.');
        }

        try {
            $channel = DB::transaction(function () use ($validated) {
                $channel = Channel::create([
                    ...$validated,
                    'created_by' => auth()->id(),
                ]);

                $channel->users()->syncWithoutDetaching([
                    auth()->id() => ['role' => 'admin'],
                ]);

                return $channel;
            });
        } catch (\Throwable $e) {
            report($e);

            return back()->withErrors([
                'channel' => 'Channel create failed. Please try again.',
            ])->withInput();
        }

        return redirect()->route('channels.show', $channel)->with('success', 'Channel created successfully.');
    }

    public function show(Channel $channel)
    {
        $this->authorize('view', $channel);

        $user = auth()->user();

        $channel->load([
            'messages' => fn ($q) => $q->orderBy('created_at'),
            'messages.sender:id,name',
            'messages.attachments',
            'messages.reactions:id,message_id,user_id,emoji',
            'messages.mentions:id,message_id,user_id',
            'messages.replyTo:id,sender_id,content,type,sticker_key',
            'messages.replyTo.sender:id,name',
            'creator:id,name',
            'space:id,name',
            'users:id,name',
        ])->loadCount('users');

        return Inertia::render('Channels/Show', [
            'channel' => $channel,
            'canDelete' => $user->can('delete', $channel),
            'canEdit' => $user->can('update', $channel),
        ]);
    }

    public function edit(Channel $channel)
    {
        $this->authorize('update', $channel);

        return Inertia::render('Channels/Edit', [
            'channel' => $channel,
        ]);
    }

    public function update(Request $request, Channel $channel)
    {
        $this->authorize('update', $channel);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'is_private' => 'boolean',
        ]);

        $channel->update($validated);

        return redirect()->route('channels.show', $channel)->with('success', 'Channel updated successfully.');
    }

    public function destroy(Channel $channel)
    {
        $this->authorize('delete', $channel);

        $channel->delete();

        return redirect()->route('channels.index')->with('success', 'Channel deleted successfully.');
    }

    public function addMember(Request $request, Channel $channel)
    {
        $this->authorize('addMember', $channel);

        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
        ]);

        $user = User::find($validated['user_id']);

        if ($channel->users()->where('users.id', $user->id)->exists()) {
            return back()->with('error', 'User is already a member of this channel.');
        }

        $channel->users()->attach($user->id, ['role' => 'member']);

        return back()->with('success', 'Member added successfully.');
    }

    public function removeMember(Request $request, Channel $channel, User $user)
    {
        $this->authorize('removeMember', [$channel, $user]);

        $channel->users()->detach($user->id);

        return back()->with('success', 'Member removed successfully.');
    }

    public function getMembers(Channel $channel)
    {
        $this->authorize('view', $channel);

        $members = $channel->users()->get(['users.id', 'users.name', 'users.email', 'channel_user.role']);

        return response()->json($members);
    }
}
