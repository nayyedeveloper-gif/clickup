<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\TimeEntry;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class TimeEntryController extends Controller
{
    public function start(Request $request, Task $task): RedirectResponse
    {
        $userId = $request->user()->id;

        // Stop any other running entry by this user.
        TimeEntry::where('user_id', $userId)
            ->whereNull('ended_at')
            ->get()
            ->each(fn ($entry) => $this->finish($entry));

        TimeEntry::create([
            'task_id' => $task->id,
            'user_id' => $userId,
            'started_at' => now(),
        ]);

        return back();
    }

    public function stop(Request $request, Task $task): RedirectResponse
    {
        $entry = TimeEntry::where('task_id', $task->id)
            ->where('user_id', $request->user()->id)
            ->whereNull('ended_at')
            ->latest('started_at')
            ->first();

        if ($entry) {
            $this->finish($entry);
        }

        return back();
    }

    public function destroy(TimeEntry $entry): RedirectResponse
    {
        abort_unless($entry->user_id === request()->user()->id, 403);
        $entry->delete();

        return back();
    }

    private function finish(TimeEntry $entry): void
    {
        $endedAt = now();
        $entry->update([
            'ended_at' => $endedAt,
            'duration_seconds' => max(0, $endedAt->diffInSeconds($entry->started_at)),
        ]);
    }
}
