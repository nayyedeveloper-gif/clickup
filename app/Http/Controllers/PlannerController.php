<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\TimeBlock;
use Carbon\Carbon;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class PlannerController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $view = in_array($request->string('view')->toString(), ['day', 'week']) ? $request->string('view')->toString() : 'week';

        $anchor = $request->date('date') ? CarbonImmutable::parse($request->date('date')) : CarbonImmutable::now();

        if ($view === 'week') {
            $rangeStart = $anchor->startOfWeek(CarbonImmutable::MONDAY);
            $rangeEnd = $rangeStart->addDays(7);
        } else {
            $rangeStart = $anchor->startOfDay();
            $rangeEnd = $rangeStart->addDay();
        }

        $blocks = TimeBlock::with(['task:id,title,priority,date_done'])
            ->where('user_id', $user->id)
            ->overlapping($rangeStart, $rangeEnd)
            ->orderBy('starts_at')
            ->get();

        // Tasks scheduled by due_date inside the range, but not in a block — show as ghost rows
        $scheduledTasks = Task::visibleTo($user)
            ->with(['list:id,name,space_id', 'list.space:id,name'])
            ->where(function ($q) use ($user) {
                $q->where('assigned_to', $user->id)
                  ->orWhere('created_by', $user->id);
            })
            ->whereNull('date_done')
            ->whereNotNull('due_date')
            ->whereBetween('due_date', [$rangeStart->toDateString(), $rangeEnd->copy()->subDay()->toDateString()])
            ->orderBy('due_date')
            ->get();

        // Unscheduled (no due_date, not done) — sidebar
        $unscheduled = Task::visibleTo($user)
            ->with(['list:id,name,space_id', 'list.space:id,name'])
            ->where(function ($q) use ($user) {
                $q->where('assigned_to', $user->id)
                  ->orWhere('created_by', $user->id);
            })
            ->whereNull('date_done')
            ->whereNull('due_date')
            ->orderByDesc('updated_at')
            ->limit(50)
            ->get();

        return Inertia::render('Planner/Index', [
            'view' => $view,
            'anchor' => $anchor->toDateString(),
            'rangeStart' => $rangeStart->toIso8601String(),
            'rangeEnd' => $rangeEnd->toIso8601String(),
            'blocks' => $blocks,
            'scheduledTasks' => $scheduledTasks,
            'unscheduled' => $unscheduled,
        ]);
    }

    public function storeBlock(Request $request): RedirectResponse
    {
        $data = $this->validateBlock($request);
        $data['user_id'] = Auth::id();

        TimeBlock::create($data);

        return back();
    }

    public function updateBlock(Request $request, TimeBlock $block): RedirectResponse
    {
        $this->authorizeBlock($block);
        $data = $this->validateBlock($request);
        $block->update($data);

        return back();
    }

    public function destroyBlock(TimeBlock $block): RedirectResponse
    {
        $this->authorizeBlock($block);
        $block->delete();

        return back();
    }

    private function authorizeBlock(TimeBlock $block): void
    {
        abort_unless($block->user_id === Auth::id(), 403);
    }

    private function validateBlock(Request $request): array
    {
        $data = $request->validate([
            'task_id' => ['nullable', Rule::exists('tasks', 'id')],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'color' => ['nullable', 'string', 'max:16'],
            'starts_at' => ['required', 'date'],
            'ends_at' => ['required', 'date', 'after:starts_at'],
            'all_day' => ['nullable', 'boolean'],
        ]);

        $data['color'] = $data['color'] ?? '#7c3aed';
        $data['all_day'] = (bool) ($data['all_day'] ?? false);

        return $data;
    }
}
