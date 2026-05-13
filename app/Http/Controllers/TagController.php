<?php

namespace App\Http\Controllers;

use App\Models\Space;
use App\Models\Tag;
use App\Models\Task;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class TagController extends Controller
{
    public function store(Request $request, Space $space): RedirectResponse
    {
        $this->authorize('view', $space);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:60'],
            'color' => ['nullable', 'string', 'max:16'],
        ]);

        Tag::firstOrCreate(
            ['space_id' => $space->id, 'name' => $validated['name']],
            ['color' => $validated['color'] ?? '#6366f1']
        );

        return back();
    }

    public function attach(Request $request, Task $task): RedirectResponse
    {
        $validated = $request->validate([
            'tag_id' => ['required', 'exists:tags,id'],
        ]);

        $task->tags()->syncWithoutDetaching([$validated['tag_id']]);

        return back();
    }

    public function detach(Task $task, Tag $tag): RedirectResponse
    {
        $task->tags()->detach($tag->id);

        return back();
    }

    public function destroy(Tag $tag): RedirectResponse
    {
        $tag->delete();

        return back();
    }
}
