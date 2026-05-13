import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import HomeShell from '@/Components/HomeShell';
import {
    ArrowLeft,
    BarChart3,
    Plus,
    Trash2,
    X,
    CheckSquare,
    Briefcase,
    Users,
    Target,
    MessageSquare,
    Activity,
} from 'lucide-react';

const STATUS_COLORS = {
    'todo': '#6b7280',
    'in_progress': '#3b82f6',
    'in progress': '#3b82f6',
    'review': '#f59e0b',
    'done': '#10b981',
    'completed': '#10b981',
    'blocked': '#ef4444',
};

const PRIORITY_COLORS = {
    urgent: '#ef4444',
    high: '#f59e0b',
    normal: '#3b82f6',
    low: '#9ca3af',
};

function formatStatus(s) {
    return (s || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function WidgetShell({ widget, onDelete, children }) {
    const colSpan = { 1: 'md:col-span-1', 2: 'md:col-span-2', 3: 'md:col-span-3', 4: 'md:col-span-4' }[widget.width] || 'md:col-span-2';
    return (
        <div className={`group rounded-lg border border-neutral-800 bg-neutral-900/40 overflow-hidden ${colSpan} flex flex-col`}>
            <div className="px-4 py-2.5 border-b border-neutral-800 flex items-center justify-between">
                <div className="text-xs font-semibold text-neutral-300 uppercase tracking-wider truncate">{widget.title}</div>
                <button
                    onClick={onDelete}
                    className="opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-red-400 transition"
                    title="Remove widget"
                >
                    <Trash2 size={13} />
                </button>
            </div>
            <div className="flex-1 p-4 min-h-[120px]">{children}</div>
        </div>
    );
}

function TaskCountWidget({ widget }) {
    const count = widget.data?.count ?? 0;
    return (
        <div className="h-full flex flex-col justify-center">
            <div className="text-4xl font-bold text-white tabular-nums">{count}</div>
            <div className="text-xs text-neutral-500 mt-1">{widget.config?.scope?.replace(/_/g, ' ') || 'tasks'}</div>
        </div>
    );
}

function StatusBreakdownWidget({ widget }) {
    const rows = widget.data?.rows || [];
    const total = rows.reduce((s, r) => s + Number(r.count || 0), 0) || 1;
    if (rows.length === 0) return <Empty label="No tasks assigned to you" />;
    return (
        <div className="space-y-2">
            {rows.map((r) => {
                const pct = (r.count / total) * 100;
                const color = STATUS_COLORS[(r.status || '').toLowerCase()] || '#7c3aed';
                return (
                    <div key={r.status} className="text-xs">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-neutral-300">{formatStatus(r.status)}</span>
                            <span className="text-neutral-500 tabular-nums">{r.count}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                            <div className="h-full" style={{ width: `${pct}%`, background: color }} />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function MyTasksWidget({ widget }) {
    const tasks = widget.data?.tasks || [];
    if (tasks.length === 0) return <Empty label="No open tasks" />;
    return (
        <div className="space-y-1.5 max-h-72 overflow-y-auto -mx-2 px-2">
            {tasks.map((t) => (
                <div key={t.id} className="flex items-center gap-2 text-xs py-1.5 px-2 rounded hover:bg-neutral-800/60">
                    <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ background: PRIORITY_COLORS[t.priority] || '#6b7280' }}
                    />
                    <span className="text-neutral-200 flex-1 truncate">{t.title}</span>
                    {t.due_date && (
                        <span className="text-neutral-500 tabular-nums">
                            {new Date(t.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                    )}
                </div>
            ))}
        </div>
    );
}

function DealPipelineWidget({ widget }) {
    const stages = widget.data?.stages || [];
    if (stages.length === 0) return <Empty label="No deals" />;
    const max = Math.max(...stages.map((s) => Number(s.total) || 0), 1);
    return (
        <div className="space-y-2">
            {stages.map((s) => {
                const pct = (Number(s.total) / max) * 100;
                const color = s.stage?.color || '#7c3aed';
                return (
                    <div key={s.pipeline_stage_id || 'unstaged'} className="text-xs">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-neutral-300">{s.stage?.name || 'Unstaged'}</span>
                            <span className="text-neutral-500 tabular-nums">
                                {s.count} · ${Number(s.total).toLocaleString()}
                            </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                            <div className="h-full" style={{ width: `${pct}%`, background: color }} />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function TeamWorkloadWidget({ widget }) {
    const rows = widget.data?.rows || [];
    if (rows.length === 0) return <Empty label="No teammates" />;
    const max = Math.max(...rows.map((r) => Number(r.open_count) || 0), 1);
    return (
        <div className="space-y-2">
            {rows.map((r) => {
                const pct = (Number(r.open_count) / max) * 100;
                return (
                    <div key={r.id} className="text-xs">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-neutral-300 truncate">{r.name}</span>
                            <span className="text-neutral-500 tabular-nums">{r.open_count}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                            <div className="h-full bg-purple-500" style={{ width: `${pct}%` }} />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function GoalProgressWidget({ widget }) {
    const goals = widget.data?.goals || [];
    if (goals.length === 0) {
        return (
            <div className="text-xs text-neutral-500">
                No active goals. <Link href={route('goals.index')} className="text-purple-400 hover:underline">Create one</Link>
            </div>
        );
    }
    return (
        <div className="space-y-3">
            {goals.map((g) => {
                const pct = g.target_value > 0 ? Math.min(100, (g.current_value / g.target_value) * 100) : 0;
                return (
                    <div key={g.id} className="text-xs">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-neutral-200 truncate">{g.name}</span>
                            <span className="text-neutral-500 tabular-nums">{Math.round(pct)}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                            <div className="h-full" style={{ width: `${pct}%`, background: g.color || '#7c3aed' }} />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function RecentActivityWidget({ widget }) {
    const items = widget.data?.items || [];
    if (items.length === 0) return <Empty label="No recent activity" />;
    return (
        <div className="space-y-2 max-h-72 overflow-y-auto -mx-2 px-2">
            {items.map((c) => (
                <div key={c.id} className="text-xs py-1.5 px-2 rounded hover:bg-neutral-800/60">
                    <div className="flex items-center gap-2">
                        <span className="font-medium text-neutral-200">{c.user?.name || 'Someone'}</span>
                        <span className="text-neutral-500">commented on</span>
                        <span className="text-neutral-300 truncate">{c.task?.title}</span>
                    </div>
                    <div className="text-neutral-500 mt-0.5 truncate">{c.body}</div>
                </div>
            ))}
        </div>
    );
}

function Empty({ label }) {
    return <div className="text-xs text-neutral-500 italic">{label}</div>;
}

function renderWidget(widget) {
    switch (widget.type) {
        case 'task_count': return <TaskCountWidget widget={widget} />;
        case 'status_breakdown': return <StatusBreakdownWidget widget={widget} />;
        case 'my_tasks': return <MyTasksWidget widget={widget} />;
        case 'deal_pipeline': return <DealPipelineWidget widget={widget} />;
        case 'team_workload': return <TeamWorkloadWidget widget={widget} />;
        case 'goal_progress': return <GoalProgressWidget widget={widget} />;
        case 'recent_activity': return <RecentActivityWidget widget={widget} />;
        default: return <Empty label={`Unknown widget: ${widget.type}`} />;
    }
}

const WIDGET_ICONS = {
    task_count: CheckSquare,
    status_breakdown: BarChart3,
    my_tasks: CheckSquare,
    deal_pipeline: Briefcase,
    team_workload: Users,
    goal_progress: Target,
    recent_activity: MessageSquare,
};

function AddWidgetModal({ dashboard, widgetTypes, onClose }) {
    const [type, setType] = useState(widgetTypes[0]?.type || 'task_count');
    const [title, setTitle] = useState('');
    const [width, setWidth] = useState(2);
    const [scope, setScope] = useState('mine_open');

    const submit = (e) => {
        e.preventDefault();
        const config = type === 'task_count' ? { scope } : {};
        router.post(
            route('dashboards.widgets.store', dashboard.id),
            { type, title: title || widgetTypes.find((w) => w.type === type)?.title || 'Widget', width, config },
            { preserveScroll: true, onSuccess: onClose },
        );
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <form onSubmit={submit} className="bg-neutral-900 rounded-lg border border-neutral-800 w-full max-w-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold flex items-center gap-2">
                        <Plus size={16} className="text-purple-400" /> Add Widget
                    </h2>
                    <button type="button" onClick={onClose} className="text-neutral-400 hover:text-white"><X size={16} /></button>
                </div>
                <div>
                    <label className="text-xs text-neutral-400">Widget type</label>
                    <div className="mt-1 grid grid-cols-2 gap-2">
                        {widgetTypes.map((w) => {
                            const Icon = WIDGET_ICONS[w.type] || Activity;
                            return (
                                <button
                                    key={w.type} type="button"
                                    onClick={() => setType(w.type)}
                                    className={`text-left p-2.5 rounded-md border text-xs flex items-start gap-2 ${
                                        type === w.type
                                            ? 'border-purple-500 bg-purple-500/10'
                                            : 'border-neutral-800 hover:border-neutral-700 bg-neutral-900'
                                    }`}
                                >
                                    <Icon size={14} className="text-purple-400 mt-0.5 shrink-0" />
                                    <div>
                                        <div className="font-semibold text-neutral-200">{w.title}</div>
                                        <div className="text-neutral-500 mt-0.5">{w.description}</div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs text-neutral-400">Title</label>
                        <input
                            type="text" value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder={widgetTypes.find((w) => w.type === type)?.title}
                            className="mt-1 w-full px-3 py-2 rounded-md bg-neutral-800 border border-neutral-700 text-sm text-white"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-neutral-400">Width</label>
                        <select
                            value={width} onChange={(e) => setWidth(Number(e.target.value))}
                            className="mt-1 w-full px-3 py-2 rounded-md bg-neutral-800 border border-neutral-700 text-sm text-white"
                        >
                            <option value={1}>1 column</option>
                            <option value={2}>2 columns</option>
                            <option value={3}>3 columns</option>
                            <option value={4}>Full width</option>
                        </select>
                    </div>
                </div>
                {type === 'task_count' && (
                    <div>
                        <label className="text-xs text-neutral-400">Scope</label>
                        <select
                            value={scope} onChange={(e) => setScope(e.target.value)}
                            className="mt-1 w-full px-3 py-2 rounded-md bg-neutral-800 border border-neutral-700 text-sm text-white"
                        >
                            <option value="mine_open">My open tasks</option>
                            <option value="today">Due today</option>
                            <option value="overdue">Overdue</option>
                            <option value="completed_7d">Completed (7 days)</option>
                            <option value="created_7d">Created (7 days)</option>
                        </select>
                    </div>
                )}
                <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={onClose} className="px-3 py-2 text-sm text-neutral-300 hover:text-white">Cancel</button>
                    <button type="submit" className="px-4 py-2 text-sm bg-purple-600 hover:bg-purple-500 rounded-md text-white">Add widget</button>
                </div>
            </form>
        </div>
    );
}

export default function DashboardShow({ dashboard, widgets, widgetTypes }) {
    const [showAdd, setShowAdd] = useState(false);

    const onDeleteWidget = (w) => {
        if (!confirm(`Remove "${w.title}"?`)) return;
        router.delete(route('dashboards.widgets.destroy', w.id), { preserveScroll: true });
    };

    return (
        <>
            <Head title={dashboard.name} />
            <HomeShell
                title={dashboard.name}
                subtitle={dashboard.description}
                actions={
                    <>
                        <Link
                            href={route('dashboards.index')}
                            className="px-3 py-1.5 text-xs rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-200 flex items-center gap-1.5"
                        >
                            <ArrowLeft size={13} /> All dashboards
                        </Link>
                        <button
                            onClick={() => setShowAdd(true)}
                            className="px-3 py-1.5 text-xs rounded-md bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-1.5"
                        >
                            <Plus size={13} /> Add widget
                        </button>
                    </>
                }
            >
                <div className="px-6 py-4">
                    {widgets.length === 0 ? (
                        <div className="text-center py-16">
                            <BarChart3 className="mx-auto text-neutral-700" size={48} />
                            <h3 className="mt-3 text-sm font-medium text-neutral-300">Empty dashboard</h3>
                            <p className="text-xs text-neutral-500 mt-1">Add widgets to start visualizing your work.</p>
                            <button
                                onClick={() => setShowAdd(true)}
                                className="mt-4 px-4 py-2 text-xs rounded-md bg-purple-600 hover:bg-purple-500 text-white inline-flex items-center gap-1.5"
                            >
                                <Plus size={13} /> Add widget
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {widgets.map((w) => (
                                <WidgetShell key={w.id} widget={w} onDelete={() => onDeleteWidget(w)}>
                                    {renderWidget(w)}
                                </WidgetShell>
                            ))}
                        </div>
                    )}
                </div>
            </HomeShell>
            {showAdd && (
                <AddWidgetModal dashboard={dashboard} widgetTypes={widgetTypes} onClose={() => setShowAdd(false)} />
            )}
        </>
    );
}
