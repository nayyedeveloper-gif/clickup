<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\TaskList;
use App\Models\TaskStatus;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class TaskStatusController extends Controller
{
    public function store(Request $request, TaskList $list): RedirectResponse
    {
        $validated = $request->validate([
            'label' => ['required', 'string', 'max:60'],
            'color' => ['nullable', 'string', 'max:16'],
            'type' => ['nullable', 'in:open,active,closed'],
        ]);

        $key = $this->uniqueKey($list, $validated['label']);
        $position = (int) $list->statuses()->max('position') + 1;

        TaskStatus::create([
            'task_list_id' => $list->id,
            'key' => $key,
            'label' => $validated['label'],
            'color' => $validated['color'] ?? '#9ca3af',
            'type' => $validated['type'] ?? 'open',
            'position' => $position,
        ]);

        return back();
    }

    public function update(Request $request, TaskStatus $status): RedirectResponse
    {
        $validated = $request->validate([
            'label' => ['sometimes', 'required', 'string', 'max:60'],
            'color' => ['sometimes', 'nullable', 'string', 'max:16'],
            'type' => ['sometimes', 'in:open,active,closed'],
            'position' => ['sometimes', 'integer', 'min:0'],
        ]);

        $status->update($validated);

        return back();
    }

    public function destroy(TaskStatus $status): RedirectResponse
    {
        // Re-assign tasks of this status to the first remaining status
        $remaining = TaskStatus::where('task_list_id', $status->task_list_id)
            ->where('id', '!=', $status->id)
            ->orderBy('position')
            ->first();

        if (! $remaining) {
            abort(422, 'Cannot delete the last status of a list.');
        }

        Task::where('task_list_id', $status->task_list_id)
            ->where('status', $status->key)
            ->update(['status' => $remaining->key]);

        $status->delete();

        return back();
    }

    private function uniqueKey(TaskList $list, string $label): string
    {
        $base = Str::slug($label, '_');
        if ($base === '') {
            $base = 'status';
        }
        $key = $base;
        $i = 2;
        while (TaskStatus::where('task_list_id', $list->id)->where('key', $key)->exists()) {
            $key = "{$base}_{$i}";
            $i++;
        }
        return $key;
    }
}
