import { router } from '@inertiajs/react';
import { useState } from 'react';
import { Flag, Circle, CheckCircle2 } from 'lucide-react';
import TaskDrawer from '@/Components/TaskDrawer';

const PRIORITY_TONE = {
    urgent: 'text-red-400',
    high: 'text-orange-400',
    medium: 'text-yellow-400',
    low: 'text-neutral-500',
};

function formatDue(date) {
    if (!date) return '';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const diff = Math.round((d - today) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    if (diff === -1) return 'Yesterday';
    if (diff < 0) return `${Math.abs(diff)}d overdue`;
    if (diff < 7) return d.toLocaleDateString('en', { weekday: 'short' });
    return d.toLocaleDateString('en', { month: 'short', day: 'numeric' });
}

export default function TaskRow({ task, onChange }) {
    const [open, setOpen] = useState(false);
    const isDone = !!task.date_done;
    const due = formatDue(task.due_date);
    const overdue = !isDone && task.due_date && new Date(task.due_date) < new Date(new Date().toDateString());

    const toggleDone = (e) => {
        e.stopPropagation();
        router.put(
            route('tasks.update', task.id),
            { date_done: isDone ? null : new Date().toISOString().slice(0, 10) },
            {
                preserveScroll: true,
                onSuccess: () => onChange?.(),
            }
        );
    };

    return (
        <>
            <div
                onClick={() => setOpen(true)}
                className="grid grid-cols-12 gap-3 px-4 py-2 hover:bg-neutral-800/40 cursor-pointer items-center text-sm border-b border-neutral-800/40"
            >
                <div className="col-span-7 flex items-center gap-2 min-w-0">
                    <button onClick={toggleDone} className="text-neutral-500 hover:text-emerald-400 shrink-0">
                        {isDone ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Circle size={16} />}
                    </button>
                    <span
                        className={`truncate ${
                            isDone ? 'line-through text-neutral-500' : 'text-neutral-100'
                        }`}
                    >
                        {task.title}
                    </span>
                    {task.list?.name && (
                        <span className="text-xs text-neutral-500 truncate">
                            · {task.list.space?.name ? `${task.list.space.name} / ` : ''}{task.list.name}
                        </span>
                    )}
                </div>
                <div className="col-span-2">
                    <Flag size={12} className={`inline ${PRIORITY_TONE[task.priority] || PRIORITY_TONE.medium}`} />
                    <span className={`ml-1 text-xs ${PRIORITY_TONE[task.priority] || PRIORITY_TONE.medium}`}>
                        {task.priority || 'medium'}
                    </span>
                </div>
                <div className="col-span-2 text-xs">
                    <span className={overdue ? 'text-red-400' : 'text-neutral-400'}>{due}</span>
                </div>
                <div className="col-span-1 text-right">
                    {task.assigned_to?.name && (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-[10px] font-bold text-white">
                            {task.assigned_to.name.charAt(0).toUpperCase()}
                        </span>
                    )}
                </div>
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
