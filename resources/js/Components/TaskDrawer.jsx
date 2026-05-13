import { router } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
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
    Paperclip,
    Smile,
    AtSign,
    ThumbsUp,
    MessageCircle,
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

export default function TaskDrawer({ taskId, onClose, onChanged, statuses = [] }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [members, setMembers] = useState([]);
    const [comment, setComment] = useState('');
    const [tick, setTick] = useState(0); // for live timer
    const titleRef = useRef(null);

    // Fetch task whenever id changes
    useEffect(() => {
        if (!taskId) return;
        let active = true;
        setLoading(true);
        setError(null);
        axios.get(route('tasks.show', taskId), { headers: { Accept: 'application/json' } })
            .then((res) => {
                if (active) {
                    setData(res.data);
                    setLoading(false);
                }
            })
            .catch(err => {
                console.error("Task fetch error:", err);
                if (active) {
                    setError(err.response?.status === 401 ? 'Your session expired. Please refresh and login again.' : 'Task details could not be loaded.');
                    setLoading(false);
                }
            });

        let channel = null;
        if (window.Echo) {
            channel = window.Echo.channel(`tasks.${taskId}`);
            channel.listen('.comment.sent', (e) => {
                setData((prev) => {
                    if (!prev || prev.task.id !== taskId) return prev;
                    const exists = prev.task.comments.some(c => c.id === e.comment.id);
                    if (exists) return prev;
                    return {
                        ...prev,
                        task: {
                            ...prev.task,
                            comments: [...prev.task.comments, e.comment]
                        }
                    };
                });
                onChanged?.();
            });
        }

        return () => {
            active = false;
            if (window.Echo && channel) {
                window.Echo.leave(`tasks.${taskId}`);
            }
        };
    }, [taskId, onChanged]);

    // Fetch members once
    useEffect(() => {
        axios.get(route('members.index'), { headers: { Accept: 'application/json' } })
            .then((res) => setMembers(res.data?.users || []))
            .catch(err => console.error("Members fetch error:", err));
    }, []);

    // Live timer tick
    useEffect(() => {
        const id = setInterval(() => setTick((t) => t + 1), 1000);
        return () => clearInterval(id);
    }, []);

    // Close on Esc
    useEffect(() => {
        const onKey = (e) => e.key === 'Escape' && onClose();
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    const refresh = () => {
        axios.get(route('tasks.show', taskId), { headers: { Accept: 'application/json' } })
            .then(res => setData(res.data))
            .catch(err => {
                console.error("Refresh error:", err);
                setError('Task details could not be refreshed.');
            });
    };

    const updateField = (field, value) => {
        router.put(
            route('tasks.update', taskId),
            { [field]: value },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    refresh();
                    onChanged?.();
                },
            }
        );
    };

    const sendComment = (e) => {
        e.preventDefault();
        if (!comment.trim()) return;
        router.post(
            route('task-comments.store', taskId),
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
                space_id: task?.space_id,
                task_list_id: task?.task_list_id,
                parent_task_id: task?.id,
            },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    refresh();
                    onChanged?.();
                },
            }
        );
    };

    const startTimer = () =>
        router.post(
            route('time.start', taskId),
            {},
            { preserveScroll: true, preserveState: true, onSuccess: refresh }
        );

    const stopTimer = () =>
        router.post(
            route('time.stop', taskId),
            {},
            { preserveScroll: true, preserveState: true, onSuccess: refresh }
        );

    const task = data?.task;
    const runningEntry = useMemo(
        () => task?.time_entries?.find((e) => !e.ended_at),
        [task]
    );
    const totalSeconds = useMemo(() => {
        if (!task?.time_entries) return 0;
        const completed = task.time_entries
            .filter((e) => e.ended_at)
            .reduce((sum, e) => sum + (e.duration_seconds || 0), 0);
        const live = runningEntry
            ? Math.floor((Date.now() - new Date(runningEntry.started_at).getTime()) / 1000)
            : 0;
        return completed + live;
    }, [task, runningEntry, tick]);

    if (!taskId) return null;

    return (
        <div className="fixed inset-0 z-50 flex" onMouseDown={onClose}>
            <div className="flex-1 bg-black/40 backdrop-blur-sm" />
            <div
                onMouseDown={(e) => e.stopPropagation()}
                className="w-[560px] max-w-full h-full bg-neutral-950 border-l border-neutral-800 text-neutral-100 shadow-2xl flex flex-col"
            >
                {loading ? (
                    <div className="flex-1 flex items-center justify-center text-neutral-500">
                        Loading…
                    </div>
                ) : error || !task ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
                        <div className="text-sm text-red-300 mb-2">{error || 'Task details could not be loaded.'}</div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-3 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-sm"
                            >
                                Close
                            </button>
                            <button
                                type="button"
                                onClick={() => { window.location.href = route('tasks.show', taskId); }}
                                className="px-3 py-1.5 rounded bg-purple-600 hover:bg-purple-500 text-sm"
                            >
                                Open task page
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Header */}
                        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between">
                            <div className="text-xs text-neutral-500">
                                {task.list?.name || 'Task'}
                            </div>
                            <button
                                onClick={onClose}
                                className="text-neutral-400 hover:text-white"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Title */}
                        <div className="px-5 pt-4">
                            <input
                                ref={titleRef}
                                key={task.id}
                                defaultValue={task.title}
                                onBlur={(e) => {
                                    const v = e.target.value.trim();
                                    if (v && v !== task.title) updateField('title', v);
                                }}
                                className="w-full bg-transparent text-2xl font-semibold focus:outline-none"
                            />
                        </div>

                        {/* Meta grid */}
                        <div className="px-5 mt-2 grid grid-cols-[120px_1fr] gap-x-3 gap-y-2 text-sm">
                            <Label icon={Flag}>Status</Label>
                            <select
                                value={task.status}
                                onChange={(e) => updateField('status', e.target.value)}
                                className="bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-sm w-fit"
                            >
                                {statuses.map((s) => (
                                    <option key={s.id} value={s.key}>
                                        {s.label}
                                    </option>
                                ))}
                                {statuses.length === 0 && (
                                    <>
                                        <option value="to_do">To Do</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="completed">Completed</option>
                                    </>
                                )}
                            </select>

                            <Label icon={Flag}>Priority</Label>
                            <select
                                value={task.priority || 'medium'}
                                onChange={(e) => updateField('priority', e.target.value)}
                                className="bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-sm w-fit"
                            >
                                {PRIORITIES.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.label}
                                    </option>
                                ))}
                            </select>

                            <Label icon={UserIcon}>Assignee</Label>
                            <select
                                value={task.assigned_to || ''}
                                onChange={(e) =>
                                    updateField('assigned_to', e.target.value || null)
                                }
                                className="bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-sm w-fit"
                            >
                                <option value="">Unassigned</option>
                                {members.map((m) => (
                                    <option key={m.id} value={m.id}>
                                        {m.name}
                                    </option>
                                ))}
                            </select>

                            <Label icon={Calendar}>Start date</Label>
                            <input
                                type="date"
                                defaultValue={task.start_date || ''}
                                onChange={(e) =>
                                    updateField('start_date', e.target.value || null)
                                }
                                className="bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-sm w-fit"
                            />

                            <Label icon={Calendar}>Due date</Label>
                            <input
                                type="date"
                                defaultValue={task.due_date || ''}
                                onChange={(e) =>
                                    updateField('due_date', e.target.value || null)
                                }
                                className="bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-sm w-fit"
                            />

                            <Label icon={TagIcon}>Tags</Label>
                            <div className="flex flex-wrap gap-1">
                                {(task.tags || []).map((tag) => (
                                    <button
                                        key={tag.id}
                                        onClick={() =>
                                            router.delete(
                                                route('tags.detach', [task.id, tag.id]),
                                                { preserveScroll: true, preserveState: true, onSuccess: refresh }
                                            )
                                        }
                                        className="px-2 py-0.5 rounded text-[11px]"
                                        style={{
                                            backgroundColor: `${tag.color}20`,
                                            color: tag.color,
                                            border: `1px solid ${tag.color}40`,
                                        }}
                                    >
                                        {tag.name} ×
                                    </button>
                                ))}
                                <TagPicker
                                    available={data?.tagsAvailable || []}
                                    used={(task.tags || []).map((t) => t.id)}
                                    spaceId={task.space_id || task.list?.space_id}
                                    taskId={task.id}
                                    onChanged={refresh}
                                />
                            </div>
                        </div>

                        {/* Description */}
                        <div className="px-5 mt-5">
                            <div className="text-xs uppercase text-neutral-500 mb-1">Description</div>
                            <textarea
                                key={`desc-${task.id}`}
                                defaultValue={task.description || ''}
                                onBlur={(e) => {
                                    if ((e.target.value || '') !== (task.description || '')) {
                                        updateField('description', e.target.value);
                                    }
                                }}
                                rows={4}
                                placeholder="Add a description…"
                                className="w-full bg-neutral-900 border border-neutral-800 rounded p-3 text-sm focus:outline-none focus:border-purple-500"
                            />
                        </div>

                        {/* Time tracking */}
                        <div className="px-5 mt-5">
                            <div className="flex items-center justify-between">
                                <div className="text-xs uppercase text-neutral-500">Time tracking</div>
                                <div className="text-sm font-mono">{fmtDuration(totalSeconds)}</div>
                            </div>
                            <div className="mt-2 flex items-center gap-2">
                                {runningEntry ? (
                                    <button
                                        onClick={stopTimer}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-red-600 hover:bg-red-500 text-sm"
                                    >
                                        <Square size={14} /> Stop
                                    </button>
                                ) : (
                                    <button
                                        onClick={startTimer}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-sm"
                                    >
                                        <Play size={14} /> Start
                                    </button>
                                )}
                                <span className="text-xs text-neutral-500">
                                    {(task.time_entries || []).length} entries
                                </span>
                            </div>
                        </div>

                        {/* Subtasks */}
                        <div className="px-5 mt-5">
                            <div className="flex items-center justify-between mb-1">
                                <div className="text-xs uppercase text-neutral-500">Subtasks</div>
                                <button
                                    onClick={addSubtask}
                                    className="flex items-center gap-1 text-xs text-neutral-400 hover:text-white"
                                >
                                    <Plus size={12} /> Add
                                </button>
                            </div>
                            <div className="space-y-1">
                                {(task.subtasks || []).map((sub) => (
                                    <div
                                        key={sub.id}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded text-sm"
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
                                            className={`flex-1 ${
                                                sub.status === 'completed'
                                                    ? 'text-neutral-500'
                                                    : ''
                                            }`}
                                        >
                                            {sub.title}
                                        </span>
                                    </div>
                                ))}
                                {(task.subtasks || []).length === 0 && (
                                    <div className="text-xs text-neutral-500 italic px-1">
                                        No subtasks
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Comments */}
                        <div className="px-5 mt-5 flex-1 overflow-y-auto">
                            <div className="text-xs uppercase text-neutral-500 mb-2">
                                Comments ({(task.comments || []).length})
                            </div>
                            <div className="space-y-4">
                                {(task.comments || []).map((c) => (
                                    <div
                                        key={c.id}
                                        className="flex gap-3"
                                    >
                                        {/* User avatar */}
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-[10px] font-bold text-white uppercase shrink-0">
                                            {c.user?.name?.charAt(0) || 'U'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-sm font-semibold text-neutral-100">
                                                    {c.user?.name || 'User'}
                                                </span>
                                                <span className="text-xs text-neutral-500">
                                                    {new Date(c.created_at).toLocaleDateString()} at {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <div className="text-sm text-neutral-300 whitespace-pre-wrap">{c.body}</div>
                                            <div className="flex items-center gap-3 mt-2">
                                                <button className="flex items-center gap-1 text-xs text-neutral-400 hover:text-neutral-200">
                                                    <MessageCircle size={12} /> Reply
                                                </button>
                                                <button className="flex items-center gap-1 text-xs text-neutral-400 hover:text-purple-400">
                                                    <ThumbsUp size={12} /> Like
                                                </button>
                                                <button
                                                    onClick={() => deleteComment(c.id)}
                                                    className="text-neutral-500 hover:text-red-400"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {(task.comments || []).length === 0 && (
                                    <div className="text-xs text-neutral-500 italic">
                                        No comments yet
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Comment composer */}
                        <div className="px-5 py-3 border-t border-neutral-800">
                            <form onSubmit={sendComment} className="space-y-3">
                                <div className="flex items-start gap-2">
                                    {/* User avatar */}
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-[10px] font-bold text-white uppercase shrink-0">
                                        {data?.currentUser?.name?.charAt(0) || 'Y'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <textarea
                                            value={comment}
                                            onChange={(e) => setComment(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    sendComment(e);
                                                }
                                            }}
                                            placeholder="Write a comment…"
                                            rows={1}
                                            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 resize-none overflow-hidden"
                                            style={{
                                                minHeight: '32px',
                                                maxHeight: '120px'
                                            }}
                                            onInput={(e) => {
                                                // Auto-resize
                                                e.target.style.height = 'auto';
                                                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center justify-between pl-10">
                                    <div className="flex items-center gap-1">
                                        <button
                                            type="button"
                                            className="p-1.5 rounded text-neutral-400 hover:text-white hover:bg-neutral-800"
                                            title="Add attachment"
                                        >
                                            <Paperclip size={14} />
                                        </button>
                                        <button
                                            type="button"
                                            className="p-1.5 rounded text-neutral-400 hover:text-white hover:bg-neutral-800"
                                            title="Add emoji"
                                        >
                                            <Smile size={14} />
                                        </button>
                                        <button
                                            type="button"
                                            className="p-1.5 rounded text-neutral-400 hover:text-white hover:bg-neutral-800"
                                            title="Mention someone"
                                        >
                                            <AtSign size={14} />
                                        </button>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={!comment.trim()}
                                        className="px-4 py-1.5 rounded bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                                    >
                                        Comment
                                    </button>
                                </div>
                            </form>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

function Label({ icon: Icon, children }) {
    return (
        <div className="flex items-center gap-1.5 text-xs text-neutral-400 pt-1.5">
            <Icon size={12} /> {children}
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
                className="px-2 py-0.5 rounded text-[11px] border border-dashed border-neutral-700 text-neutral-400 hover:text-white hover:border-neutral-500"
            >
                + Tag
            </button>
            {open && (
                <div className="absolute z-10 mt-1 w-56 bg-neutral-900 border border-neutral-800 rounded shadow-xl p-2">
                    {candidates.length > 0 && (
                        <div className="space-y-1 max-h-40 overflow-auto mb-2">
                            {candidates.map((t) => (
                                <button
                                    key={t.id}
                                    onClick={() => attach(t.id)}
                                    className="w-full flex items-center gap-2 px-2 py-1 rounded text-xs hover:bg-neutral-800"
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
                            placeholder="New tag…"
                            className="flex-1 bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-xs"
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
