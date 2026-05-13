import { router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import Sidebar from '@/Components/Sidebar';
import {
    X,
    User as UserIcon,
    Calendar,
    Flag,
    Tag as TagIcon,
    Play,
    Square,
    Trash2,
    Send,
    Plus,
    ChevronLeft,
    Clock,
    CheckSquare,
    MessageSquare,
    Paperclip,
    MoreHorizontal,
    Link as LinkIcon,
    Copy,
    CheckCircle2,
} from 'lucide-react';

const PRIORITIES = [
    { id: 'urgent', label: 'Urgent' },
    { id: 'high', label: 'High' },
    { id: 'medium', label: 'Medium' },
    { id: 'low', label: 'Low' },
];

function fmtDuration(totalSeconds) {
    if (!totalSeconds) return '0m';
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
}

export default function TaskShow({ task: initialTask, tagsAvailable, statuses }) {
    const { auth } = usePage().props;
    const [task, setTask] = useState(initialTask);
    const [members, setMembers] = useState([]);
    const [comment, setComment] = useState('');
    const [tick, setTick] = useState(0);
    const titleRef = useRef(null);
    const [activeTab, setActiveTab] = useState('comments'); // comments | activity

    // Fetch members for assignee dropdown
    useEffect(() => {
        fetch(route('members.index'), { headers: { Accept: 'application/json' } })
            .then((r) => r.json())
            .then((res) => setMembers(res.users || []));
    }, []);

    // Live timer tick
    useEffect(() => {
        const id = setInterval(() => setTick((t) => t + 1), 1000);
        return () => clearInterval(id);
    }, []);

    const refresh = () => {
        router.reload({ only: ['task'] });
    };

    const updateField = (field, value) => {
        router.put(
            route('tasks.update', task.id),
            { [field]: value },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    refresh();
                },
            }
        );
    };

    const sendComment = (e) => {
        e.preventDefault();
        if (!comment.trim()) return;
        router.post(
            route('task-comments.store', task.id),
            { body: comment },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    setComment('');
                    refresh();
                },
            }
        );
    };

    const deleteComment = (id) => {
        router.delete(route('task-comments.destroy', id), {
            preserveScroll: true,
            preserveState: true,
            onSuccess: refresh,
        });
    };

    const addSubtask = () => {
        const title = window.prompt('Subtask title');
        if (!title) return;
        router.post(
            route('tasks.store'),
            {
                title,
                status: 'to_do',
                priority: 'medium',
                space_id: task.space_id,
                task_list_id: task.task_list_id,
                parent_task_id: task.id,
            },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    refresh();
                },
            }
        );
    };

    const startTimer = () =>
        router.post(
            route('time.start', task.id),
            {},
            { preserveScroll: true, preserveState: true, onSuccess: refresh }
        );

    const stopTimer = () =>
        router.post(
            route('time.stop', task.id),
            {},
            { preserveScroll: true, preserveState: true, onSuccess: refresh }
        );

    const runningEntry = useMemo(
        () => task.time_entries?.find((e) => !e.ended_at),
        [task]
    );

    const totalSeconds = useMemo(() => {
        if (!task.time_entries) return 0;
        const completed = task.time_entries
            .filter((e) => e.ended_at)
            .reduce((sum, e) => sum + (e.duration_seconds || 0), 0);
        const live = runningEntry
            ? Math.floor((Date.now() - new Date(runningEntry.started_at).getTime()) / 1000)
            : 0;
        return completed + live;
    }, [task, runningEntry, tick]);

    const copyTaskLink = () => {
        navigator.clipboard.writeText(window.location.href);
    };

    return (
        <div className="flex h-screen bg-neutral-950 text-neutral-100">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top Navigation Bar */}
                <div className="px-4 py-2 border-b border-neutral-800 flex items-center gap-2 pr-20">
                    <button
                        onClick={() => window.history.back()}
                        className="p-1.5 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <div className="flex items-center gap-2 text-xs text-neutral-500">
                        <span>{task.list?.space?.name || 'Workspace'}</span>
                        <ChevronLeft size={12} className="rotate-180" />
                        <span>{task.list?.name || 'List'}</span>
                        <ChevronLeft size={12} className="rotate-180" />
                        <span className="text-neutral-300">Task</span>
                    </div>
                    <div className="flex-1" />
                    <button
                        onClick={copyTaskLink}
                        className="p-1.5 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white"
                        title="Copy link"
                    >
                        <LinkIcon size={16} />
                    </button>
                    <button
                        onClick={() => router.get(route('all-tasks'))}
                        className="p-1.5 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white"
                        title="Close"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Main Content - Split View */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Left Panel - Task Details */}
                    <div className="flex-1 overflow-y-auto px-6 py-5">
                        {/* Title */}
                        <input
                            ref={titleRef}
                            defaultValue={task.title}
                            onBlur={(e) => {
                                const v = e.target.value.trim();
                                if (v && v !== task.title) updateField('title', v);
                            }}
                            className="w-full bg-transparent text-2xl font-semibold focus:outline-none mb-6"
                            placeholder="Task title"
                        />

                        {/* Task Fields Grid */}
                        <div className="grid grid-cols-2 gap-x-6 gap-y-4 mb-6">
                            <Field label="Status" icon={CheckSquare}>
                                <select
                                    value={task.status}
                                    onChange={(e) => updateField('status', e.target.value)}
                                    className="bg-neutral-900 border border-neutral-800 rounded px-3 py-1.5 text-sm w-full focus:border-purple-500 focus:outline-none"
                                >
                                    {statuses?.map((s) => (
                                        <option key={s.key} value={s.key}>
                                            {s.label}
                                        </option>
                                    ))}
                                </select>
                            </Field>

                            <Field label="Assignees" icon={UserIcon}>
                                <select
                                    value={task.assigned_to?.id || ''}
                                    onChange={(e) =>
                                        updateField('assigned_to', e.target.value || null)
                                    }
                                    className="bg-neutral-900 border border-neutral-800 rounded px-3 py-1.5 text-sm w-full focus:border-purple-500 focus:outline-none"
                                >
                                    <option value="">Unassigned</option>
                                    {members.map((m) => (
                                        <option key={m.id} value={m.id}>
                                            {m.name}
                                        </option>
                                    ))}
                                </select>
                            </Field>

                            <Field label="Priority" icon={Flag}>
                                <select
                                    value={task.priority || 'medium'}
                                    onChange={(e) => updateField('priority', e.target.value)}
                                    className="bg-neutral-900 border border-neutral-800 rounded px-3 py-1.5 text-sm w-full focus:border-purple-500 focus:outline-none"
                                >
                                    {PRIORITIES.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.label}
                                        </option>
                                    ))}
                                </select>
                            </Field>

                            <Field label="Due date" icon={Calendar}>
                                <input
                                    type="date"
                                    defaultValue={task.due_date || ''}
                                    onChange={(e) =>
                                        updateField('due_date', e.target.value || null)
                                    }
                                    className="bg-neutral-900 border border-neutral-800 rounded px-3 py-1.5 text-sm w-full focus:border-purple-500 focus:outline-none"
                                />
                            </Field>

                            <Field label="Start date" icon={Calendar}>
                                <input
                                    type="date"
                                    defaultValue={task.start_date || ''}
                                    onChange={(e) =>
                                        updateField('start_date', e.target.value || null)
                                    }
                                    className="bg-neutral-900 border border-neutral-800 rounded px-3 py-1.5 text-sm w-full focus:border-purple-500 focus:outline-none"
                                />
                            </Field>

                            <Field label="Time tracked" icon={Clock}>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-mono">{fmtDuration(totalSeconds)}</span>
                                    {runningEntry ? (
                                        <button
                                            onClick={stopTimer}
                                            className="flex items-center gap-1 px-2 py-1 rounded bg-red-600/80 hover:bg-red-500 text-xs"
                                        >
                                            <Square size={12} /> Stop
                                        </button>
                                    ) : (
                                        <button
                                            onClick={startTimer}
                                            className="flex items-center gap-1 px-2 py-1 rounded bg-emerald-600/80 hover:bg-emerald-500 text-xs"
                                        >
                                            <Play size={12} /> Start
                                        </button>
                                    )}
                                </div>
                            </Field>
                        </div>

                        {/* Tags */}
                        <div className="mb-6">
                            <Label icon={TagIcon}>Tags</Label>
                            <div className="flex flex-wrap gap-1 mt-1">
                                {(task.tags || []).map((tag) => (
                                    <span
                                        key={tag.id}
                                        className="px-2 py-1 rounded text-xs flex items-center gap-1"
                                        style={{
                                            backgroundColor: `${tag.color}20`,
                                            color: tag.color,
                                            border: `1px solid ${tag.color}40`,
                                        }}
                                    >
                                        {tag.name}
                                        <button
                                            onClick={() =>
                                                router.delete(
                                                    route('tags.detach', [task.id, tag.id]),
                                                    { preserveScroll: true, preserveState: true, onSuccess: refresh }
                                                )
                                            }
                                            className="opacity-50 hover:opacity-100"
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))}
                                <TagPicker
                                    available={tagsAvailable || []}
                                    used={(task.tags || []).map((t) => t.id)}
                                    spaceId={task.space_id || task.list?.space_id}
                                    taskId={task.id}
                                    onChanged={refresh}
                                />
                            </div>
                        </div>

                        {/* Description */}
                        <div className="mb-6">
                            <Label icon={MessageSquare}>Description</Label>
                            <textarea
                                defaultValue={task.description || ''}
                                onBlur={(e) => {
                                    if ((e.target.value || '') !== (task.description || '')) {
                                        updateField('description', e.target.value);
                                    }
                                }}
                                rows={6}
                                placeholder="Add a description..."
                                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-sm focus:outline-none focus:border-purple-500 mt-2"
                            />
                        </div>

                        {/* Subtasks */}
                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-2">
                                <Label icon={CheckSquare}>Subtasks</Label>
                                <button
                                    onClick={addSubtask}
                                    className="flex items-center gap-1 text-xs text-neutral-400 hover:text-white"
                                >
                                    <Plus size={12} /> Add subtask
                                </button>
                            </div>
                            <div className="space-y-1">
                                {(task.subtasks || []).map((sub) => (
                                    <div
                                        key={sub.id}
                                        className="flex items-center gap-3 px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={sub.status === 'completed'}
                                            onChange={(e) =>
                                                router.put(
                                                    route('tasks.update', sub.id),
                                                    {
                                                        status: e.target.checked
                                                            ? 'completed'
                                                            : 'to_do',
                                                    },
                                                    {
                                                        preserveScroll: true,
                                                        preserveState: true,
                                                        onSuccess: refresh,
                                                    }
                                                )
                                            }
                                            className="rounded bg-neutral-800 border-neutral-600"
                                        />
                                        <span
                                            className={`flex-1 text-sm ${sub.status === 'completed' ? 'text-neutral-500' : ''}`}
                                        >
                                            {sub.title}
                                        </span>
                                        {sub.assigned_to && (
                                            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-[9px] font-bold text-white">
                                                {sub.assigned_to.name.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {(task.subtasks || []).length === 0 && (
                                    <div className="text-sm text-neutral-500 italic">
                                        No subtasks yet
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Attachments placeholder */}
                        <div className="mb-6">
                            <Label icon={Paperclip}>Attachments</Label>
                            <div className="mt-2 p-4 border border-dashed border-neutral-700 rounded-lg text-center text-neutral-500 text-sm">
                                Drop files here to upload
                            </div>
                        </div>
                    </div>

                    {/* Right Panel - Activity */}
                    <div className="w-[380px] border-l border-neutral-800 flex flex-col bg-neutral-950">
                        {/* Activity Header */}
                        <div className="px-4 py-3 border-b border-neutral-800">
                            <h3 className="text-sm font-semibold flex items-center gap-2">
                                <MessageSquare size={14} />
                                Activity
                            </h3>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b border-neutral-800">
                            <button
                                onClick={() => setActiveTab('comments')}
                                className={`flex-1 px-4 py-2 text-xs font-medium transition ${
                                    activeTab === 'comments'
                                        ? 'text-white border-b-2 border-purple-500'
                                        : 'text-neutral-400 hover:text-white'
                                }`}
                            >
                                Comments ({(task.comments || []).length})
                            </button>
                            <button
                                onClick={() => setActiveTab('activity')}
                                className={`flex-1 px-4 py-2 text-xs font-medium transition ${
                                    activeTab === 'activity'
                                        ? 'text-white border-b-2 border-purple-500'
                                        : 'text-neutral-400 hover:text-white'
                                }`}
                            >
                                History
                            </button>
                        </div>

                        {/* Comments List */}
                        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                            {activeTab === 'comments' ? (
                                (task.comments || []).length === 0 ? (
                                    <div className="text-center py-8 text-neutral-500 text-sm">
                                        <MessageSquare size={32} className="mx-auto mb-2 text-neutral-700" />
                                        <p>No comments yet</p>
                                        <p className="text-xs mt-1">Start the conversation!</p>
                                    </div>
                                ) : (
                                    (task.comments || []).map((c) => (
                                        <div key={c.id} className="flex gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                                                {c.user?.name?.charAt(0).toUpperCase() || '?'}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xs font-semibold text-neutral-200">
                                                        {c.user?.name || 'Unknown'}
                                                    </span>
                                                    <span className="text-[10px] text-neutral-500">
                                                        {new Date(c.created_at).toLocaleString()}
                                                    </span>
                                                </div>
                                                <div className="text-sm text-neutral-300 whitespace-pre-wrap bg-neutral-900 border border-neutral-800 rounded-lg p-3">
                                                    {c.body}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )
                            ) : (
                                <div className="text-center py-8 text-neutral-500 text-sm">
                                    <Clock size={32} className="mx-auto mb-2 text-neutral-700" />
                                    <p>Activity history coming soon</p>
                                </div>
                            )}
                        </div>

                        {/* Comment Composer */}
                        <form onSubmit={sendComment} className="px-4 py-3 border-t border-neutral-800">
                            <div className="flex gap-2">
                                <input
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder="Write a comment..."
                                    className="flex-1 bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
                                />
                                <button
                                    type="submit"
                                    disabled={!comment.trim()}
                                    className="px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Send size={14} />
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Field({ label, icon: Icon, children }) {
    return (
        <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                {Icon && <Icon size={12} />}
                <span>{label}</span>
            </div>
            {children}
        </div>
    );
}

function Label({ icon: Icon, children }) {
    return (
        <div className="flex items-center gap-1.5 text-xs font-medium text-neutral-400 uppercase tracking-wide">
            {Icon && <Icon size={12} />}
            {children}
        </div>
    );
}

function TagPicker({ available, used, spaceId, taskId, onChanged }) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState('');

    const candidates = available.filter((t) => !used.includes(t.id));

    const attach = (tagId) => {
        router.post(
            route('tags.attach', taskId),
            { tag_id: tagId },
            { preserveScroll: true, preserveState: true, onSuccess: onChanged }
        );
        setOpen(false);
    };

    const create = (e) => {
        e.preventDefault();
        if (!name.trim() || !spaceId) return;
        router.post(
            route('tags.store', spaceId),
            { name: name.trim() },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    setName('');
                    onChanged();
                    setOpen(false);
                },
            }
        );
    };

    return (
        <div className="relative">
            <button
                onClick={() => setOpen((o) => !o)}
                className="px-2 py-1 rounded text-xs border border-dashed border-neutral-600 text-neutral-400 hover:text-white hover:border-neutral-400"
            >
                + Add tag
            </button>
            {open && (
                <div className="absolute z-10 mt-1 w-56 bg-neutral-900 border border-neutral-800 rounded-lg shadow-xl p-2">
                    {candidates.length > 0 && (
                        <div className="space-y-1 max-h-40 overflow-auto mb-2">
                            {candidates.map((t) => (
                                <button
                                    key={t.id}
                                    onClick={() => attach(t.id)}
                                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs hover:bg-neutral-800 text-left"
                                >
                                    <span
                                        className="w-2 h-2 rounded-full"
                                        style={{ background: t.color }}
                                    />
                                    {t.name}
                                </button>
                            ))}
                        </div>
                    )}
                    <form onSubmit={create} className="flex gap-1">
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="New tag..."
                            className="flex-1 bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-xs focus:outline-none focus:border-purple-500"
                        />
                        <button
                            type="submit"
                            className="px-2 py-1 rounded bg-purple-600 hover:bg-purple-500 text-xs"
                        >
                            Add
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}
