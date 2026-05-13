<?php

namespace App\Http\Controllers;

use App\Models\Space;
use App\Models\Task;
use App\Models\TaskList;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MyTasksController extends Controller
{
    /**
     * Overview screen ("My Tasks")
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        $userId = $user->id;
        $today = now()->toDateString();

        $query = Task::visibleTo($user)
            ->with(['list:id,name,space_id', 'list.space:id,name', 'assignedTo:id,name']);

        // Only filter by assigned_to if NOT admin/manager/owner
        if (!in_array($user->role, ['admin', 'owner', 'manager']) && 
            (!$user->roleModel || !in_array($user->roleModel->slug, ['admin', 'owner', 'manager']))) {
            $query->where('assigned_to', $userId);
        }

        $myTasks = $query->orderByRaw('due_date IS NULL, due_date ASC')
            ->orderByDesc('updated_at')
            ->get();

        $today_tasks = $myTasks->filter(fn ($t) => $t->due_date && $t->due_date->toDateString() === $today && ! $t->date_done)->values();
        $overdue = $myTasks->filter(fn ($t) => $t->due_date && $t->due_date->toDateString() < $today && ! $t->date_done)->values();
        $upcoming = $myTasks->filter(fn ($t) => $t->due_date && $t->due_date->toDateString() > $today && ! $t->date_done)->values();
        $unscheduled = $myTasks->filter(fn ($t) => ! $t->due_date && ! $t->date_done)->values();
        $done = $myTasks->filter(fn ($t) => $t->date_done !== null)->values();

        $delegated = Task::visibleTo($request->user())
            ->with(['list:id,name,space_id', 'list.space:id,name', 'assignedTo:id,name'])
            ->where('created_by', $userId)
            ->where('assigned_to', '!=', $userId)
            ->orderByDesc('updated_at')
            ->limit(50)
            ->get();

        $recents = Task::visibleTo($request->user())
            ->with(['list:id,name,space_id', 'list.space:id,name'])
            ->where(fn ($q) => $q->where('assigned_to', $userId)->orWhere('created_by', $userId))
            ->orderByDesc('updated_at')
            ->limit(8)
            ->get();

        return Inertia::render('MyTasks/Overview', [
            'today_tasks' => $today_tasks,
            'overdue' => $overdue,
            'upcoming' => $upcoming,
            'unscheduled' => $unscheduled,
            'done' => $done,
            'delegated' => $delegated,
            'recents' => $recents,
            'assigned' => $myTasks->filter(fn ($t) => ! $t->date_done)->values(),
        ]);
    }

    public function assigned(Request $request): Response
    {
        $userId = $request->user()->id;

        $tasks = Task::with([
                'list:id,name,space_id',
                'list.space:id,name',
                'assignedTo:id,name',
                'list.statuses',
                'parent:id,title',
            ])
            ->withCount(['subtasks', 'comments'])
            ->where('assigned_to', $userId)
            ->orderByDesc('updated_at')
            ->get();

        return Inertia::render('MyTasks/Assigned', [
            'tasks' => $tasks,
        ]);
    }

    public function today(Request $request): Response
    {
        $userId = $request->user()->id;
        $today = now()->toDateString();

        $tasks = Task::with(['list:id,name,space_id', 'list.space:id,name', 'assignedTo:id,name'])
            ->where('assigned_to', $userId)
            ->whereNull('date_done')
            ->get();

        $today_tasks = $tasks->filter(fn ($t) => $t->due_date && $t->due_date->toDateString() === $today)->values();
        $overdue = $tasks->filter(fn ($t) => $t->due_date && $t->due_date->toDateString() < $today)->values();
        $upcoming = $tasks->filter(fn ($t) => $t->due_date && $t->due_date->toDateString() > $today)
            ->sortBy('due_date')->values();
        $unscheduled = $tasks->filter(fn ($t) => ! $t->due_date)->values();

        return Inertia::render('MyTasks/Today', [
            'today_tasks' => $today_tasks,
            'overdue' => $overdue,
            'upcoming' => $upcoming,
            'unscheduled' => $unscheduled,
        ]);
    }

    /**
     * Personal list — auto-creates a private personal Space and a "Personal List"
     * for the current user, then redirects to that list.
     */
    public function personal(Request $request): RedirectResponse
    {
        $user = $request->user();

        $space = Space::firstOrCreate(
            ['created_by' => $user->id, 'is_personal' => true],
            ['name' => 'Personal · '.$user->name, 'description' => 'Private personal space']
        );

        $list = TaskList::firstOrCreate(
            ['space_id' => $space->id, 'name' => 'Personal List'],
            ['created_by' => $user->id, 'color' => '#a855f7']
        );

        return redirect()->route('lists.show', $list->id);
    }
}
