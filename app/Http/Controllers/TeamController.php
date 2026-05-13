<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\Team;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TeamController extends Controller
{
    public function index(): Response
    {
        $query = Team::with(['members:id,name,email,role,title'])
            ->withCount('members');

        // If not admin, restrict to teams the user is a member of
        if (auth()->user()->role_id !== 1) {
            $query->whereHas('members', function ($q) {
                $q->where('user_id', auth()->id());
            });
        }

        $teams = $query->orderBy('name')->get();

        $usersQuery = User::select('id', 'name', 'email', 'role', 'title');
        
        // If not admin, only show users in the same teams? 
        // For now, let's just restrict the teams themselves.
        $users = $usersQuery->orderBy('name')
            ->get()
            ->map(function (User $user) {
                // Tasks the user owns: split by closed-type status if list has statuses
                $tasks = Task::where('assigned_to', $user->id)
                    ->leftJoin('task_statuses', function ($join) {
                        $join->on('tasks.task_list_id', '=', 'task_statuses.task_list_id')
                            ->on('tasks.status', '=', 'task_statuses.key');
                    })
                    ->select(
                        'tasks.id',
                        'task_statuses.type as status_type'
                    )
                    ->get();

                $user->setAttribute('open_tasks', $tasks->where('status_type', '!=', 'closed')->count());
                $user->setAttribute('done_tasks', $tasks->where('status_type', 'closed')->count());
                return $user;
            });

        return Inertia::render('Teams/Index', [
            'teams' => $teams,
            'users' => $users,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'description' => ['nullable', 'string'],
            'color' => ['nullable', 'string', 'max:16'],
        ]);

        $team = Team::create([
            ...$validated,
            'created_by' => $request->user()->id,
        ]);
        $team->members()->attach($request->user()->id, ['role' => 'owner']);

        return back();
    }

    public function update(Request $request, Team $team): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:120'],
            'description' => ['sometimes', 'nullable', 'string'],
            'color' => ['sometimes', 'nullable', 'string', 'max:16'],
        ]);

        $team->update($validated);

        return back();
    }

    public function destroy(Team $team): RedirectResponse
    {
        $team->delete();

        return back();
    }

    public function addMember(Request $request, Team $team): RedirectResponse
    {
        $validated = $request->validate([
            'user_id' => ['required', 'exists:users,id'],
            'role' => ['nullable', 'in:owner,admin,member'],
        ]);

        $team->members()->syncWithoutDetaching([
            $validated['user_id'] => ['role' => $validated['role'] ?? 'member'],
        ]);

        return back();
    }

    public function updateMember(Request $request, Team $team, User $user): RedirectResponse
    {
        $validated = $request->validate([
            'role' => ['required', 'in:owner,admin,member'],
        ]);

        $team->members()->updateExistingPivot($user->id, ['role' => $validated['role']]);

        return back();
    }

    public function removeMember(Team $team, User $user): RedirectResponse
    {
        $team->members()->detach($user->id);

        return back();
    }
}
