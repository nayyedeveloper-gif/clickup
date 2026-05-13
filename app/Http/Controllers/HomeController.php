<?php

namespace App\Http\Controllers;

use App\Models\Space;
use Illuminate\Http\Request;
use Inertia\Inertia;

class HomeController extends Controller
{
    public function index()
    {
        $spaces = Space::whereNull('parent_id')
            ->with('children', 'createdBy')
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('Home', [
            'auth' => [
                'user' => auth()->user(),
            ],
            'spaces' => $spaces,
        ]);
    }

    public function myTasks()
    {
        $user = auth()->user();
        $tasks = \App\Models\Task::where('created_by', $user->id)
            ->orWhere('assigned_to', $user->id)
            ->with(['createdBy', 'assignedTo', 'space'])
            ->orderBy('created_at', 'desc')
            ->get();

        $spaces = Space::whereNull('parent_id')
            ->with('children', 'createdBy')
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('MyTasks', [
            'tasks' => $tasks,
            'spaces' => $spaces,
        ]);
    }

    public function assignedToMe()
    {
        $user = auth()->user();
        $tasks = \App\Models\Task::where('assigned_to', $user->id)
            ->with(['createdBy', 'assignedTo', 'space'])
            ->orderBy('created_at', 'desc')
            ->get();

        $spaces = Space::whereNull('parent_id')
            ->with('children', 'createdBy')
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('AssignedToMe', [
            'tasks' => $tasks,
            'spaces' => $spaces,
        ]);
    }

    public function allTasks()
    {
        $tasks = \App\Models\Task::visibleTo(auth()->user())
            ->with(['createdBy', 'assignedTo', 'space'])
            ->orderBy('created_at', 'desc')
            ->get();

        $spaces = Space::whereNull('parent_id')
            ->with('children', 'createdBy')
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('AllTasks', [
            'tasks' => $tasks,
            'spaces' => $spaces,
        ]);
    }
}
