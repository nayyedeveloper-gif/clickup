<?php

namespace App\Http\Controllers;

use App\Models\Dashboard;
use App\Models\DashboardWidget;
use App\Models\Deal;
use App\Models\Goal;
use App\Models\Task;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $userId = Auth::id();
        $dashboards = Dashboard::where('user_id', $userId)
            ->orderBy('position')
            ->orderBy('id')
            ->get();

        return Inertia::render('Dashboards/Index', [
            'dashboards' => $dashboards,
        ]);
    }

    public function show(Dashboard $dashboard)
    {
        abort_unless($dashboard->user_id === Auth::id(), 403);
        $dashboard->load('widgets');

        $widgets = $dashboard->widgets->map(function ($widget) {
            return [
                'id' => $widget->id,
                'type' => $widget->type,
                'title' => $widget->title,
                'config' => $widget->config ?? [],
                'position' => $widget->position,
                'width' => $widget->width,
                'height' => $widget->height,
                'data' => $this->resolveWidgetData($widget),
            ];
        });

        return Inertia::render('Dashboards/Show', [
            'dashboard' => $dashboard,
            'widgets' => $widgets,
            'widgetTypes' => $this->widgetCatalog(),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:255',
            'icon' => 'nullable|string|max:32',
            'color' => 'nullable|string|max:16',
        ]);
        $data['user_id'] = Auth::id();

        $dashboard = Dashboard::create($data);

        // Seed with default widgets
        $defaults = [
            ['type' => 'task_count', 'title' => 'My open tasks', 'width' => 1, 'height' => 1, 'position' => 0, 'config' => ['scope' => 'mine_open']],
            ['type' => 'task_count', 'title' => 'Due today', 'width' => 1, 'height' => 1, 'position' => 1, 'config' => ['scope' => 'today']],
            ['type' => 'task_count', 'title' => 'Overdue', 'width' => 1, 'height' => 1, 'position' => 2, 'config' => ['scope' => 'overdue']],
            ['type' => 'task_count', 'title' => 'Completed (7d)', 'width' => 1, 'height' => 1, 'position' => 3, 'config' => ['scope' => 'completed_7d']],
            ['type' => 'status_breakdown', 'title' => 'Status breakdown', 'width' => 2, 'height' => 2, 'position' => 4, 'config' => []],
            ['type' => 'my_tasks', 'title' => 'My tasks', 'width' => 2, 'height' => 2, 'position' => 5, 'config' => ['limit' => 8]],
            ['type' => 'deal_pipeline', 'title' => 'Deal pipeline', 'width' => 2, 'height' => 2, 'position' => 6, 'config' => []],
            ['type' => 'team_workload', 'title' => 'Team workload', 'width' => 2, 'height' => 2, 'position' => 7, 'config' => []],
            ['type' => 'goal_progress', 'title' => 'Goals', 'width' => 2, 'height' => 2, 'position' => 8, 'config' => []],
        ];
        foreach ($defaults as $w) {
            $dashboard->widgets()->create($w);
        }

        return redirect()->route('dashboards.show', $dashboard->id)->with('success', 'Dashboard created');
    }

    public function update(Request $request, Dashboard $dashboard)
    {
        abort_unless($dashboard->user_id === Auth::id(), 403);
        $data = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string|max:255',
            'icon' => 'nullable|string|max:32',
            'color' => 'nullable|string|max:16',
        ]);
        $dashboard->update($data);
        return back()->with('success', 'Dashboard updated');
    }

    public function destroy(Dashboard $dashboard)
    {
        abort_unless($dashboard->user_id === Auth::id(), 403);
        $dashboard->delete();
        return redirect()->route('dashboards.index')->with('success', 'Dashboard deleted');
    }

    public function storeWidget(Request $request, Dashboard $dashboard)
    {
        abort_unless($dashboard->user_id === Auth::id(), 403);
        $data = $request->validate([
            'type' => 'required|string|max:64',
            'title' => 'required|string|max:255',
            'width' => 'nullable|integer|min:1|max:4',
            'height' => 'nullable|integer|min:1|max:4',
            'config' => 'nullable|array',
        ]);
        $data['position'] = (int) $dashboard->widgets()->max('position') + 1;
        $widget = $dashboard->widgets()->create($data);
        return back()->with('success', 'Widget added')->with('widget_id', $widget->id);
    }

    public function destroyWidget(DashboardWidget $widget)
    {
        abort_unless($widget->dashboard->user_id === Auth::id(), 403);
        $widget->delete();
        return back()->with('success', 'Widget removed');
    }

    private function widgetCatalog(): array
    {
        return [
            ['type' => 'task_count', 'title' => 'Task count', 'description' => 'Single number — counts of tasks matching a scope'],
            ['type' => 'status_breakdown', 'title' => 'Status breakdown', 'description' => 'Bar chart of your tasks grouped by status'],
            ['type' => 'my_tasks', 'title' => 'My tasks', 'description' => 'List of tasks assigned to you'],
            ['type' => 'deal_pipeline', 'title' => 'Deal pipeline', 'description' => 'CRM deals grouped by stage'],
            ['type' => 'team_workload', 'title' => 'Team workload', 'description' => 'Open task count per teammate'],
            ['type' => 'goal_progress', 'title' => 'Goal progress', 'description' => 'Top active goals with progress bars'],
            ['type' => 'recent_activity', 'title' => 'Recent activity', 'description' => 'Latest comments on your tasks'],
        ];
    }

    private function resolveWidgetData(DashboardWidget $widget)
    {
        $userId = Auth::id();
        $today = now()->toDateString();

        switch ($widget->type) {
            case 'task_count':
                $scope = $widget->config['scope'] ?? 'mine_open';
                $q = Task::query();
                switch ($scope) {
                    case 'mine_open':
                        $q->where('assigned_to', $userId)->whereNull('date_done');
                        break;
                    case 'today':
                        $q->where('assigned_to', $userId)->whereDate('due_date', $today)->whereNull('date_done');
                        break;
                    case 'overdue':
                        $q->where('assigned_to', $userId)->whereDate('due_date', '<', $today)->whereNull('date_done');
                        break;
                    case 'completed_7d':
                        $q->where('assigned_to', $userId)->whereNotNull('date_done')->where('date_done', '>=', now()->subDays(7));
                        break;
                    case 'created_7d':
                        $q->where('created_by', $userId)->where('created_at', '>=', now()->subDays(7));
                        break;
                    default:
                        $q->where('assigned_to', $userId);
                }
                return ['count' => $q->count()];

            case 'status_breakdown':
                $rows = Task::where('assigned_to', $userId)
                    ->selectRaw('status, COUNT(*) as count')
                    ->groupBy('status')
                    ->get();
                return ['rows' => $rows];

            case 'my_tasks':
                $limit = (int) ($widget->config['limit'] ?? 8);
                $tasks = Task::where('assigned_to', $userId)
                    ->whereNull('date_done')
                    ->with('list:id,name')
                    ->orderByRaw('due_date IS NULL, due_date ASC')
                    ->limit($limit)
                    ->get(['id', 'title', 'status', 'priority', 'due_date', 'task_list_id']);
                return ['tasks' => $tasks];

            case 'deal_pipeline':
                $deals = Deal::query()
                    ->selectRaw('pipeline_stage_id, COUNT(*) as count, COALESCE(SUM(amount), 0) as total')
                    ->groupBy('pipeline_stage_id')
                    ->with('stage:id,name,color')
                    ->get();
                return ['stages' => $deals];

            case 'team_workload':
                $rows = User::query()
                    ->leftJoin('tasks', function ($j) {
                        $j->on('tasks.assigned_to', '=', 'users.id')->whereNull('tasks.date_done');
                    })
                    ->groupBy('users.id', 'users.name')
                    ->orderByDesc('open_count')
                    ->limit(10)
                    ->get(['users.id', 'users.name', DB::raw('COUNT(tasks.id) as open_count')]);
                return ['rows' => $rows];

            case 'goal_progress':
                $goals = Goal::where('owner_id', $userId)
                    ->where('status', 'active')
                    ->orderBy('due_date')
                    ->limit(6)
                    ->get(['id', 'name', 'target_type', 'target_value', 'current_value', 'unit', 'color', 'due_date']);
                return ['goals' => $goals];

            case 'recent_activity':
                $items = \App\Models\TaskComment::whereHas('task', fn ($q) => $q->where('assigned_to', $userId))
                    ->where('user_id', '!=', $userId)
                    ->with(['user:id,name', 'task:id,title'])
                    ->latest()
                    ->limit(8)
                    ->get();
                return ['items' => $items];

            default:
                return [];
        }
    }
}
