import { Head, router, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import HomeShell, { Tab } from '@/Components/HomeShell';
import {
    Target,
    Plus,
    Trash2,
    CheckCircle2,
    Circle,
    Calendar,
    Folder as FolderIcon,
    X,
    ChevronDown,
    ChevronRight,
    TrendingUp,
} from 'lucide-react';

const TYPE_LABEL = {
    number: 'Number',
    currency: 'Currency',
    percentage: 'Percentage',
    boolean: 'True / False',
    task: 'Task',
};

function formatValue(g, val) {
    const v = Number(val ?? 0);
    if (g.target_type === 'currency') return `${g.unit || '$'}${v.toLocaleString()}`;
    if (g.target_type === 'percentage') return `${v}%`;
    if (g.target_type === 'boolean') return v >= 1 ? 'Done' : 'Pending';
    return `${v.toLocaleString()}${g.unit ? ' ' + g.unit : ''}`;
}

function formatDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function ProgressBar({ value, color = '#7c3aed' }) {
    return (
        <div className="w-full h-1.5 rounded-full bg-neutral-800 overflow-hidden">
            <div
                className="h-full transition-all"
                style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: color }}
            />
        </div>
    );
}

function GoalRow({ goal, onUpdate, onDelete }) {
    const [editing, setEditing] = useState(false);
    const [current, setCurrent] = useState(goal.current_value);

    const save = () => {
        if (current === goal.current_value) { setEditing(false); return; }
        router.put(route('goals.update', goal.id), { current_value: current }, {
            preserveScroll: true,
            onFinish: () => setEditing(false),
        });
    };

    const toggleBoolean = () => {
        const next = goal.current_value >= 1 ? 0 : 1;
        router.put(route('goals.update', goal.id), { current_value: next }, { preserveScroll: true });
    };

    const toggleStatus = () => {
        const next = goal.status === 'completed' ? 'active' : 'completed';
        router.put(route('goals.update', goal.id), { status: next }, { preserveScroll: true });
    };

    return (
        <div className="flex items-center gap-3 px-4 py-3 hover:bg-neutral-900/60 group border-b border-neutral-900">
            <button onClick={toggleStatus} className="text-neutral-500 hover:text-white shrink-0">
                {goal.status === 'completed' ? (
                    <CheckCircle2 size={16} className="text-emerald-500" />
                ) : (
                    <Circle size={16} />
                )}
            </button>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium truncate ${goal.status === 'completed' ? 'text-neutral-500' : ''}`}>
                        {goal.name}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 uppercase tracking-wide">
                        {TYPE_LABEL[goal.target_type]}
                    </span>
                </div>
                <div className="mt-1.5 flex items-center gap-3">
                    <div className="flex-1 max-w-md">
                        <ProgressBar value={goal.progress} color={goal.color} />
                    </div>
                    <span className="text-xs text-neutral-400 tabular-nums w-14 text-right">{goal.progress}%</span>
                </div>
            </div>

            <div className="hidden md:flex items-center gap-2 text-xs text-neutral-400 shrink-0">
                {goal.target_type === 'boolean' ? (
                    <button onClick={toggleBoolean} className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700">
                        {goal.current_value >= 1 ? 'Done' : 'Mark done'}
                    </button>
                ) : editing ? (
                    <div className="flex items-center gap-1">
                        <input
                            type="number"
                            value={current}
                            onChange={(e) => setCurrent(e.target.value)}
                            onBlur={save}
                            onKeyDown={(e) => e.key === 'Enter' && save()}
                            autoFocus
                            className="w-24 px-2 py-1 rounded bg-neutral-800 border border-neutral-700 text-white text-xs"
                        />
                        <span className="text-neutral-500">/ {formatValue(goal, goal.target_value)}</span>
                    </div>
                ) : (
                    <button onClick={() => setEditing(true)} className="hover:text-white tabular-nums">
                        {formatValue(goal, goal.current_value)} / {formatValue(goal, goal.target_value)}
                    </button>
                )}
            </div>

            <div className="hidden lg:flex items-center gap-1 text-xs text-neutral-500 shrink-0 w-28">
                <Calendar size={12} />
                {formatDate(goal.due_date)}
            </div>

            <button
                onClick={() => onDelete(goal)}
                className="opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-red-400 transition"
                title="Delete"
            >
                <Trash2 size={14} />
            </button>
        </div>
    );
}

function NewGoalModal({ folders, onClose }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        description: '',
        folder_id: '',
        target_type: 'number',
        target_value: 100,
        current_value: 0,
        unit: '',
        due_date: '',
        color: '#7c3aed',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('goals.store'), {
            preserveScroll: true,
            onSuccess: () => { reset(); onClose(); },
        });
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-neutral-900 rounded-lg border border-neutral-800 w-full max-w-md">
                <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
                    <h2 className="text-sm font-semibold flex items-center gap-2">
                        <Target size={16} className="text-purple-400" /> New Goal
                    </h2>
                    <button onClick={onClose} className="text-neutral-400 hover:text-white"><X size={16} /></button>
                </div>
                <form onSubmit={submit} className="p-4 space-y-3">
                    <div>
                        <label className="text-xs text-neutral-400">Name</label>
                        <input
                            type="text" value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            placeholder="e.g. Increase MRR to $50,000"
                            className="mt-1 w-full px-3 py-2 rounded-md bg-neutral-800 border border-neutral-700 text-sm text-white"
                            required autoFocus
                        />
                        {errors.name && <div className="text-red-400 text-xs mt-1">{errors.name}</div>}
                    </div>
                    <div>
                        <label className="text-xs text-neutral-400">Description</label>
                        <textarea
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            rows={2}
                            className="mt-1 w-full px-3 py-2 rounded-md bg-neutral-800 border border-neutral-700 text-sm text-white"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs text-neutral-400">Target type</label>
                            <select
                                value={data.target_type}
                                onChange={(e) => setData('target_type', e.target.value)}
                                className="mt-1 w-full px-3 py-2 rounded-md bg-neutral-800 border border-neutral-700 text-sm text-white"
                            >
                                {Object.entries(TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-neutral-400">Folder</label>
                            <select
                                value={data.folder_id}
                                onChange={(e) => setData('folder_id', e.target.value)}
                                className="mt-1 w-full px-3 py-2 rounded-md bg-neutral-800 border border-neutral-700 text-sm text-white"
                            >
                                <option value="">No folder</option>
                                {folders.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs text-neutral-400">Target value</label>
                            <input
                                type="number" step="any" value={data.target_value}
                                onChange={(e) => setData('target_value', e.target.value)}
                                disabled={data.target_type === 'boolean'}
                                className="mt-1 w-full px-3 py-2 rounded-md bg-neutral-800 border border-neutral-700 text-sm text-white disabled:opacity-50"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-neutral-400">Unit</label>
                            <input
                                type="text" value={data.unit}
                                onChange={(e) => setData('unit', e.target.value)}
                                placeholder={data.target_type === 'currency' ? '$' : 'optional'}
                                className="mt-1 w-full px-3 py-2 rounded-md bg-neutral-800 border border-neutral-700 text-sm text-white"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs text-neutral-400">Due date</label>
                            <input
                                type="date" value={data.due_date}
                                onChange={(e) => setData('due_date', e.target.value)}
                                className="mt-1 w-full px-3 py-2 rounded-md bg-neutral-800 border border-neutral-700 text-sm text-white"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-neutral-400">Color</label>
                            <input
                                type="color" value={data.color}
                                onChange={(e) => setData('color', e.target.value)}
                                className="mt-1 w-full h-[38px] rounded-md bg-neutral-800 border border-neutral-700 cursor-pointer"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={onClose} className="px-3 py-2 text-sm text-neutral-300 hover:text-white">Cancel</button>
                        <button
                            type="submit" disabled={processing}
                            className="px-4 py-2 text-sm bg-purple-600 hover:bg-purple-500 rounded-md text-white disabled:opacity-50"
                        >Create goal</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function NewFolderModal({ onClose }) {
    const { data, setData, post, processing, reset } = useForm({ name: '', color: '#7c3aed' });
    const submit = (e) => {
        e.preventDefault();
        post(route('goal-folders.store'), {
            preserveScroll: true,
            onSuccess: () => { reset(); onClose(); },
        });
    };
    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <form onSubmit={submit} className="bg-neutral-900 rounded-lg border border-neutral-800 w-full max-w-sm p-4 space-y-3">
                <h2 className="text-sm font-semibold flex items-center gap-2">
                    <FolderIcon size={16} className="text-purple-400" /> New Goal Folder
                </h2>
                <input
                    type="text" value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    placeholder="Folder name"
                    className="w-full px-3 py-2 rounded-md bg-neutral-800 border border-neutral-700 text-sm text-white"
                    required autoFocus
                />
                <div className="flex items-center gap-2">
                    <label className="text-xs text-neutral-400">Color</label>
                    <input type="color" value={data.color} onChange={(e) => setData('color', e.target.value)} className="rounded-md cursor-pointer" />
                </div>
                <div className="flex justify-end gap-2">
                    <button type="button" onClick={onClose} className="px-3 py-2 text-sm text-neutral-300 hover:text-white">Cancel</button>
                    <button type="submit" disabled={processing} className="px-4 py-2 text-sm bg-purple-600 hover:bg-purple-500 rounded-md text-white">Create</button>
                </div>
            </form>
        </div>
    );
}

export default function GoalsIndex({ folders, goals, stats, filter }) {
    const [showNewGoal, setShowNewGoal] = useState(false);
    const [showNewFolder, setShowNewFolder] = useState(false);
    const [collapsed, setCollapsed] = useState({});
    const [active, setActive] = useState(filter || 'all');

    const filtered = useMemo(() => {
        if (active === 'active') return goals.filter((g) => g.status === 'active');
        if (active === 'completed') return goals.filter((g) => g.status === 'completed');
        if (active === 'archived') return goals.filter((g) => g.status === 'archived');
        return goals;
    }, [goals, active]);

    const grouped = useMemo(() => {
        const map = new Map();
        map.set('__none', { folder: null, goals: [] });
        folders.forEach((f) => map.set(`f-${f.id}`, { folder: f, goals: [] }));
        filtered.forEach((g) => {
            const key = g.folder_id ? `f-${g.folder_id}` : '__none';
            if (!map.has(key)) map.set(key, { folder: g.folder, goals: [] });
            map.get(key).goals.push(g);
        });
        return Array.from(map.values()).filter((b) => b.goals.length > 0 || b.folder);
    }, [folders, filtered]);

    const onDelete = (goal) => {
        if (!confirm(`Delete "${goal.name}"?`)) return;
        router.delete(route('goals.destroy', goal.id), { preserveScroll: true });
    };

    const toggle = (key) => setCollapsed((s) => ({ ...s, [key]: !s[key] }));

    return (
        <>
            <Head title="Goals" />
            <HomeShell
                title="Goals"
                subtitle="Track measurable outcomes across your workspace"
                actions={
                    <>
                        <button
                            onClick={() => setShowNewFolder(true)}
                            className="px-3 py-1.5 text-xs rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-200 flex items-center gap-1.5"
                        >
                            <FolderIcon size={13} /> New folder
                        </button>
                        <button
                            onClick={() => setShowNewGoal(true)}
                            className="px-3 py-1.5 text-xs rounded-md bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-1.5"
                        >
                            <Plus size={13} /> New goal
                        </button>
                    </>
                }
                tabs={
                    <>
                        <Tab active={active === 'all'} onClick={() => setActive('all')}>All</Tab>
                        <Tab active={active === 'active'} onClick={() => setActive('active')}>Active</Tab>
                        <Tab active={active === 'completed'} onClick={() => setActive('completed')}>Completed</Tab>
                        <Tab active={active === 'archived'} onClick={() => setActive('archived')}>Archived</Tab>
                    </>
                }
            >
                <div className="px-6 py-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                        <StatCard icon={Target} label="Total goals" value={stats.total} />
                        <StatCard icon={Circle} label="Active" value={stats.active} color="text-purple-400" />
                        <StatCard icon={TrendingUp} label="On track" value={stats.on_track} color="text-emerald-400" />
                        <StatCard icon={CheckCircle2} label="Completed" value={stats.completed} color="text-emerald-500" />
                    </div>

                    {filtered.length === 0 ? (
                        <div className="text-center py-16">
                            <Target className="mx-auto text-neutral-700" size={48} />
                            <h3 className="mt-3 text-sm font-medium text-neutral-300">No goals yet</h3>
                            <p className="text-xs text-neutral-500 mt-1">Create your first goal to start measuring progress.</p>
                            <button
                                onClick={() => setShowNewGoal(true)}
                                className="mt-4 px-4 py-2 text-xs rounded-md bg-purple-600 hover:bg-purple-500 text-white inline-flex items-center gap-1.5"
                            >
                                <Plus size={13} /> Create goal
                            </button>
                        </div>
                    ) : (
                        <div className="rounded-lg border border-neutral-800 bg-neutral-900/40 overflow-hidden">
                            {grouped.map((bucket, idx) => {
                                const key = bucket.folder ? `f-${bucket.folder.id}` : '__none';
                                const isCollapsed = collapsed[key];
                                const label = bucket.folder ? bucket.folder.name : 'No folder';
                                return (
                                    <div key={key} className={idx > 0 ? 'border-t border-neutral-800' : ''}>
                                        <button
                                            onClick={() => toggle(key)}
                                            className="w-full px-4 py-2 flex items-center gap-2 bg-neutral-900/70 hover:bg-neutral-900 text-xs uppercase tracking-wider text-neutral-400"
                                        >
                                            {isCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                                            <FolderIcon size={12} style={{ color: bucket.folder?.color || '#7c3aed' }} />
                                            <span className="font-semibold">{label}</span>
                                            <span className="text-neutral-600 normal-case tracking-normal">· {bucket.goals.length}</span>
                                        </button>
                                        {!isCollapsed && bucket.goals.map((g) => (
                                            <GoalRow key={g.id} goal={g} onDelete={onDelete} />
                                        ))}
                                        {!isCollapsed && bucket.goals.length === 0 && (
                                            <div className="px-4 py-3 text-xs text-neutral-600 italic">No goals in this folder</div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </HomeShell>
            {showNewGoal && <NewGoalModal folders={folders} onClose={() => setShowNewGoal(false)} />}
            {showNewFolder && <NewFolderModal onClose={() => setShowNewFolder(false)} />}
        </>
    );
}

function StatCard({ icon: Icon, label, value, color = 'text-neutral-300' }) {
    return (
        <div className="rounded-lg border border-neutral-800 bg-neutral-900/40 px-4 py-3">
            <div className="flex items-center gap-2 text-xs text-neutral-500">
                <Icon size={13} className={color} />
                {label}
            </div>
            <div className="mt-1 text-2xl font-semibold text-white tabular-nums">{value}</div>
        </div>
    );
}
