import { router } from '@inertiajs/react';
import { useState } from 'react';
import { Flag, Circle, CheckCircle2, MessageSquare, Paperclip, Edit3 } from 'lucide-react';
import TaskDrawer from '@/Components/TaskDrawer';

const PRIORITY = {
    urgent: { color: '#ef4444', label: 'Urgent' },
    high: { color: '#f59e0b', label: 'High' },
    medium: { color: '#eab308', label: 'Medium' },
    normal: { color: '#3b82f6', label: 'Normal' },
    low: { color: '#9ca3af', label: 'Low' },
};

function formatDue(date, isDone) {
    if (!date) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const diff = Math.round((d - today) / 86400000);
    const overdue = diff < 0 && !isDone;
    let label;
    if (diff === 0) label = 'Today';
    else if (diff === 1) label = 'Tomorrow';
    else if (diff === -1) label = 'Yesterday';
    else if (diff > 1 && diff < 7) label = d.toLocaleDateString('en', { weekday: 'short' });
    else if (diff < 0 && diff > -7) label = d.toLocaleDateString('en', { weekday: 'short' });
    else label = d.toLocaleDateString('en', { month: 'short', day: 'numeric' });
    return { label, overdue, today: diff === 0 };
}

export default function TaskTableRow({
    task,
    columns,
    onChange,
    wrapText = false,
    showLocation = false,
    showSubtaskParent = false,
    onCommentClick = null,
}) {
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState(false);
    const [editValue, setEditValue] = useState(task.title);
    const isDone = !!task.date_done;
    const due = formatDue(task.due_date, isDone);
    const pr = PRIORITY[task.priority] || PRIORITY.normal;
    const subtaskCount = task.subtasks_count ?? task.subtasks?.length ?? 0;
    const commentCount = task.comments_count ?? 0;
    const statuses = task.list?.statuses || [];

    const toggleDone = (e) => {
        e.stopPropagation();
        router.put(
            route('tasks.update', task.id),
            { date_done: isDone ? null : new Date().toISOString().slice(0, 10) },
            { preserveScroll: true, onSuccess: () => onChange?.() }
        );
    };

    const handleSaveEdit = () => {
        if (editValue.trim() !== task.title) {
            router.put(
                route('tasks.update', task.id),
                { title: editValue.trim() },
                { preserveScroll: true, onSuccess: () => onChange?.() }
            );
        }
        setEditing(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSaveEdit();
        } else if (e.key === 'Escape') {
            setEditValue(task.title);
            setEditing(false);
        }
    };

    const updateStatus = (e, statusKey) => {
        e.stopPropagation();
        router.put(
            route('tasks.update', task.id),
            { status: statusKey },
            { preserveScroll: true, onSuccess: () => onChange?.() }
        );
    };

    // Update editValue when task.title changes from outside
    if (!editing && editValue !== task.title) {
        setEditValue(task.title);
    }

    return (
        <>
            <div
                onClick={() => setOpen(true)}
                className="flex items-center gap-3 px-4 py-1.5 hover:bg-neutral-800/40 cursor-pointer text-sm border-b border-neutral-800/50 group"
            >
                <button onClick={toggleDone} className="text-neutral-500 hover:text-emerald-400 shrink-0 w-4">
                    {isDone ? <CheckCircle2 size={15} className="text-emerald-500" /> : <Circle size={15} />}
                </button>

                {/* Name column - flexible */}
                <div className={`flex-1 min-w-0 flex ${wrapText ? 'items-start' : 'items-center'} gap-1.5`}>
                    {editing ? (
                        <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={handleSaveEdit}
                            onKeyDown={handleKeyDown}
                            onClick={(e) => e.stopPropagation()}
                            className="flex-1 bg-neutral-800 border border-purple-500 rounded px-2 py-0.5 text-sm outline-none focus:ring-2 focus:ring-purple-500"
                            autoFocus
                        />
                    ) : (
                        <div className="flex items-center gap-1 flex-1 min-w-0">
                            <span
                                className={`truncate ${isDone ? 'text-neutral-500' : 'text-neutral-100'}`}
                                title={task.title}
                            >
                                {task.title}
                            </span>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setEditing(true);
                                }}
                                className="opacity-0 group-hover:opacity-100 p-0.5 text-neutral-400 hover:text-purple-400 transition shrink-0"
                                title="Edit task name"
                            >
                                <Edit3 size={12} />
                            </button>
                        </div>
                    )}
                    {showSubtaskParent && task.parent_task_id && task.parent?.title && (
                        <span className="text-[10px] text-neutral-500 italic shrink-0">
                            ↳ {task.parent.title}
                        </span>
                    )}
                    {showLocation && task.list?.name && (
                        <span className="text-[10px] text-neutral-500 shrink-0">
                            · {task.list.space?.name ? `${task.list.space.name} / ` : ''}{task.list.name}
                        </span>
                    )}
                    {statuses.length > 0 && (
                        <select
                            value={task.status || ''}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => updateStatus(e, e.target.value)}
                            className="text-[10px] rounded px-1.5 py-0.5 border-none cursor-pointer bg-neutral-800 text-neutral-200 shrink-0"
                            title="Change status"
                        >
                            {statuses.map((s) => (
                                <option key={s.id} value={s.key} className="bg-neutral-900 text-neutral-200">
                                    {s.label}
                                </option>
                            ))}
                        </select>
                    )}
                    {subtaskCount > 0 && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-neutral-500 px-1 rounded shrink-0">
                            <span className="opacity-60">≡</span>
                            {subtaskCount}
                        </span>
                    )}
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            if (onCommentClick) {
                                onCommentClick(task, e);
                                return;
                            }
                            setOpen(true);
                        }}
                        className="inline-flex items-center gap-0.5 text-[10px] text-neutral-500 hover:text-purple-300 shrink-0"
                        title="Open comments"
                    >
                        <MessageSquare size={10} />
                        {commentCount > 0 ? commentCount : ''}
                    </button>
                </div>

                {columns.assignee && (
                    <div className="w-12 text-right shrink-0">
                        {task.assigned_to?.name && (
                            <span
                                className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-[10px] font-bold text-white"
                                title={task.assigned_to.name}
                            >
                                {task.assigned_to.name.charAt(0).toUpperCase()}
                            </span>
                        )}
                    </div>
                )}

                {columns.priority && (
                    <div className="w-28 shrink-0 flex items-center gap-1.5 text-xs">
                        <Flag size={12} className="shrink-0" style={{ color: pr.color, fill: pr.color }} />
                        <span className="text-neutral-300">{pr.label}</span>
                    </div>
                )}

                {columns.due_date && (
                    <div className="w-24 shrink-0 text-xs">
                        {due ? (
                            <span className={due.overdue ? 'text-red-400' : due.today ? 'text-yellow-400' : 'text-neutral-300'}>
                                {due.label}
                            </span>
                        ) : (
                            <span className="text-neutral-600">—</span>
                        )}
                    </div>
                )}
            </div>

            {open && (
                <TaskDrawer
                    taskId={task.id}
                    statuses={task.list?.statuses || []}
                    onClose={() => {
                        setOpen(false);
                        onChange?.();
                    }}
                    onChanged={() => onChange?.()}
                />
            )}
        </>
    );
}
