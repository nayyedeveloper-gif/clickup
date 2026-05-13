import { Head, router } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import HomeShell from '@/Components/HomeShell';
import {
    ChevronLeft,
    ChevronRight,
    Plus,
    Trash2,
    X,
    Calendar as CalendarIcon,
    Search,
    GripVertical,
    Clock,
    AlignLeft,
    CheckSquare,
} from 'lucide-react';

/* ----------------------- Time helpers ----------------------- */

const HOUR_HEIGHT = 48; // px per hour in the grid
const SNAP_MIN = 15;    // snap minutes for drag/resize
const DAY_START_HOUR = 0;
const DAY_END_HOUR = 24;

const PRIORITY_COLOR = {
    urgent: '#ef4444',
    high: '#f59e0b',
    medium: '#eab308',
    normal: '#3b82f6',
    low: '#9ca3af',
};

function startOfDay(d) {
    const x = new Date(d); x.setHours(0, 0, 0, 0); return x;
}
function addDays(d, n) {
    const x = new Date(d); x.setDate(x.getDate() + n); return x;
}
function isSameDay(a, b) {
    return startOfDay(a).getTime() === startOfDay(b).getTime();
}
function fmtTime(d) {
    return new Date(d).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}
function fmtDateLong(d) {
    return new Date(d).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}
function fmtDateShort(d) {
    return new Date(d).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}
function fmtMonthRange(start, end) {
    const s = new Date(start), e = new Date(end);
    const sameMonth = s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear();
    if (sameMonth) {
        return `${s.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}`;
    }
    return `${s.toLocaleDateString(undefined, { month: 'short' })} – ${e.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}`;
}
function toIsoLocal(d) {
    // Returns "YYYY-MM-DDTHH:MM" for datetime-local input (browser local time)
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function snapMinutes(min) {
    return Math.round(min / SNAP_MIN) * SNAP_MIN;
}
function minutesFromMidnight(d) {
    const x = new Date(d);
    return x.getHours() * 60 + x.getMinutes();
}
function dateAtMinutes(day, minutes) {
    const x = startOfDay(day);
    x.setMinutes(minutes);
    return x;
}

/* ----------------------- Components ----------------------- */

function TaskChip({ task, onDragStart }) {
    const due = task.due_date ? new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : null;
    const priorityColor = PRIORITY_COLOR[task.priority] || PRIORITY_COLOR.normal;
    
    return (
        <div
            draggable
            onDragStart={(e) => {
                e.dataTransfer.effectAllowed = 'copy';
                e.dataTransfer.setData('application/x-task', JSON.stringify({
                    id: task.id, title: task.title, priority: task.priority,
                }));
                onDragStart?.(task);
            }}
            className="group flex flex-col gap-1.5 px-3 py-2.5 rounded-lg border border-neutral-800 bg-neutral-900/50 hover:border-purple-500/40 hover:bg-neutral-800/80 cursor-grab active:cursor-grabbing transition-all duration-200"
        >
            <div className="flex items-center gap-2">
                <GripVertical size={12} className="text-neutral-600 shrink-0 group-hover:text-neutral-400 transition-colors" />
                <span className="flex-1 min-w-0 text-[13px] font-medium text-neutral-200 truncate group-hover:text-white">
                    {task.title}
                </span>
                <span
                    className="w-2 h-2 rounded-full shrink-0 shadow-[0_0_8px_rgba(0,0,0,0.3)]"
                    style={{ background: priorityColor }}
                />
            </div>
            <div className="flex items-center justify-between text-[11px] text-neutral-500 pl-5">
                <span className="truncate max-w-[120px]">
                    {task.list?.name || 'No list'}
                </span>
                {due && (
                    <span className={`flex items-center gap-1 shrink-0 ${isOverdue(task.due_date) ? 'text-red-400' : ''}`}>
                        <CalendarIcon size={10} />
                        {due}
                    </span>
                )}
            </div>
        </div>
    );
}

function isOverdue(d) {
    if (!d) return false;
    return new Date(d) < startOfDay(new Date());
}

function BlockEditor({ block, onClose, onChanged }) {
    const isNew = !block.id;
    const [title, setTitle] = useState(block.title || '');
    const [description, setDescription] = useState(block.description || '');
    const [color, setColor] = useState(block.color || '#7c3aed');
    const [startsAt, setStartsAt] = useState(block.starts_at);
    const [endsAt, setEndsAt] = useState(block.ends_at);
    const [saving, setSaving] = useState(false);

    const submit = (e) => {
        e.preventDefault();
        if (!title.trim()) return;
        setSaving(true);
        const payload = {
            task_id: block.task_id || null,
            title: title.trim(),
            description: description.trim() || null,
            color,
            starts_at: new Date(startsAt).toISOString(),
            ends_at: new Date(endsAt).toISOString(),
        };
        const url = isNew ? route('planner.blocks.store') : route('planner.blocks.update', block.id);
        const method = isNew ? 'post' : 'put';
        router[method](url, payload, {
            preserveScroll: true,
            onSuccess: () => { onChanged?.(); onClose(); },
            onFinish: () => setSaving(false),
        });
    };

    const remove = () => {
        if (!block.id) return onClose();
        if (!confirm(`Delete "${block.title}"?`)) return;
        router.delete(route('planner.blocks.destroy', block.id), {
            preserveScroll: true,
            onSuccess: () => { onChanged?.(); onClose(); },
        });
    };

    const inputCls = 'mt-1.5 w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-sm text-white outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 transition-all';

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
            <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/50">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400 shadow-inner">
                            <CalendarIcon size={16} />
                        </div>
                        <h2 className="text-base font-semibold text-white">
                            {isNew ? 'Create Time Block' : 'Edit Time Block'}
                        </h2>
                    </div>
                    <button type="button" onClick={onClose} className="p-1 rounded-md text-neutral-500 hover:text-white hover:bg-neutral-800 transition-all">
                        <X size={18} />
                    </button>
                </div>
                <div className="p-5 space-y-4">
                    <div>
                        <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Block Title</label>
                        <input
                            value={title} onChange={(e) => setTitle(e.target.value)}
                            placeholder={block.task_id ? 'Working on…' : 'e.g. Deep work, Focus session'}
                            className={inputCls} autoFocus required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5"><Clock size={12} /> Starts</label>
                            <input
                                type="datetime-local"
                                value={toIsoLocal(new Date(startsAt)).slice(0, 16)}
                                onChange={(e) => setStartsAt(e.target.value)}
                                className={inputCls} required
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5"><Clock size={12} /> Ends</label>
                            <input
                                type="datetime-local"
                                value={toIsoLocal(new Date(endsAt)).slice(0, 16)}
                                onChange={(e) => setEndsAt(e.target.value)}
                                className={inputCls} required
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5"><AlignLeft size={12} /> Notes</label>
                        <textarea
                            value={description} onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            placeholder="Add some details about this block…"
                            className={inputCls}
                        />
                    </div>
                    <div>
                        <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Block Color</label>
                        <div className="flex items-center gap-3 mt-2">
                            <div className="flex-1 flex gap-2">
                                {['#7c3aed', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'].map((c) => (
                                    <button key={c} type="button" onClick={() => setColor(c)}
                                        className={`w-7 h-7 rounded-full border-2 transition-all hover:scale-110 active:scale-95 ${color === c ? 'border-white ring-2 ring-purple-500/20' : 'border-transparent'}`}
                                        style={{ background: c }} />
                                ))}
                            </div>
                            <div className="relative group">
                                <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="opacity-0 absolute inset-0 w-full h-full cursor-pointer" />
                                <div className="w-8 h-8 rounded-lg border border-neutral-700 flex items-center justify-center bg-neutral-800 group-hover:border-neutral-500 transition-colors" style={{ background: color }}>
                                    <Plus size={14} className="text-white drop-shadow-md" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="px-5 py-4 border-t border-neutral-800 flex items-center justify-between bg-neutral-900/30">
                    {!isNew ? (
                        <button type="button" onClick={remove} className="px-3 py-1.5 rounded-lg text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all inline-flex items-center gap-2">
                            <Trash2 size={14} /> Delete
                        </button>
                    ) : <span />}
                    <div className="flex gap-2">
                        <button type="button" onClick={onClose} className="px-4 py-1.5 text-sm font-medium text-neutral-400 hover:text-white transition-colors">Cancel</button>
                        <button type="submit" disabled={saving} className="px-6 py-2 text-sm font-bold bg-purple-600 hover:bg-purple-500 rounded-lg text-white disabled:opacity-60 shadow-lg shadow-purple-600/20 active:scale-95 transition-all">
                            {saving ? 'Saving…' : isNew ? 'Create' : 'Save'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}

/* ----------------------- Calendar grid ----------------------- */

function TimeGutter() {
    const hours = [];
    for (let h = DAY_START_HOUR; h < DAY_END_HOUR; h++) hours.push(h);
    return (
        <div 
            className="w-12 shrink-0 border-r border-neutral-800 bg-neutral-950/80 sticky left-0 z-40"
            style={{ minHeight: (DAY_END_HOUR - DAY_START_HOUR) * HOUR_HEIGHT + 56 }}
        >
            <div className="h-14 border-b border-neutral-800 bg-neutral-900/50" />
            <div className="relative">
                {hours.map((h) => (
                    <div key={h} className="relative flex justify-end pr-2" style={{ height: HOUR_HEIGHT }}>
                        <span className="absolute -top-2 text-[9px] font-bold text-neutral-600 uppercase">
                            {h === 0 ? '12a' : h < 12 ? `${h}a` : h === 12 ? '12p' : `${h - 12}p`}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function DayColumn({ day, isToday, blocks, onCreate, onSelectBlock, onDropTask, onMoveBlock, onResizeBlock }) {
    const colRef = useRef(null);

    const yToMinutes = (y) => {
        const totalMin = (y / HOUR_HEIGHT) * 60 + DAY_START_HOUR * 60;
        return Math.max(DAY_START_HOUR * 60, Math.min(DAY_END_HOUR * 60, snapMinutes(totalMin)));
    };

    const handleDoubleClick = (e) => {
        const rect = colRef.current.getBoundingClientRect();
        const min = yToMinutes(e.clientY - rect.top);
        const start = dateAtMinutes(day, min);
        const end = dateAtMinutes(day, Math.min(min + 60, DAY_END_HOUR * 60 - 1));
        onCreate({ starts_at: start.toISOString(), ends_at: end.toISOString() });
    };

    const handleDragOver = (e) => {
        if (e.dataTransfer.types.includes('application/x-task') || e.dataTransfer.types.includes('application/x-block')) {
            e.preventDefault();
            e.dataTransfer.dropEffect = e.dataTransfer.types.includes('application/x-block') ? 'move' : 'copy';
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const rect = colRef.current.getBoundingClientRect();
        const min = yToMinutes(e.clientY - rect.top);

        const blockData = e.dataTransfer.getData('application/x-block');
        if (blockData) {
            try {
                const { id, durationMin } = JSON.parse(blockData);
                const start = dateAtMinutes(day, min);
                const end = new Date(start.getTime() + durationMin * 60_000);
                onMoveBlock(id, start, end);
            } catch (_) {}
            return;
        }

        const taskData = e.dataTransfer.getData('application/x-task');
        if (taskData) {
            try {
                const t = JSON.parse(taskData);
                const start = dateAtMinutes(day, min);
                const end = new Date(start.getTime() + 60 * 60_000);
                onDropTask(t, start, end);
            } catch (_) {}
        }
    };

    return (
        <div
            ref={colRef}
            className={`relative flex-1 border-r border-neutral-800/80 transition-colors ${isToday ? 'bg-purple-500/[0.03]' : ''}`}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            style={{ minHeight: (DAY_END_HOUR - DAY_START_HOUR) * HOUR_HEIGHT + 56 }} // 56px for header
        >
            {/* Header */}
            <div className={`h-14 border-b border-neutral-800 flex flex-col items-center justify-center gap-1 sticky top-0 z-30 ${isToday ? 'bg-[#1a1523]' : 'bg-neutral-900/90 backdrop-blur-sm'}`}>
                <div className={`text-[9px] uppercase font-black tracking-widest ${isToday ? 'text-purple-400' : 'text-neutral-500'}`}>
                    {day.toLocaleDateString(undefined, { weekday: 'short' })}
                </div>
                <div className={`w-7 h-7 flex items-center justify-center rounded-lg text-sm font-black transition-all ${isToday ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30' : 'text-neutral-400'}`}>
                    {day.getDate()}
                </div>
            </div>

            {/* Hour cells (visual lines + double-click anchor) */}
            <div onDoubleClick={handleDoubleClick} className="relative cursor-cell min-h-full">
                {Array.from({ length: DAY_END_HOUR - DAY_START_HOUR }).map((_, i) => (
                    <div key={i} className="border-b border-neutral-800/30 pointer-events-none" style={{ height: HOUR_HEIGHT }} />
                ))}

                {/* Now indicator */}
                {isToday && <NowLine />}

                {/* Blocks */}
                {blocks.map((b) => (
                    <BlockCard
                        key={`${b.id}-${day.getTime()}`}
                        block={b}
                        day={day}
                        onClick={() => onSelectBlock(b)}
                        onResize={onResizeBlock}
                    />
                ))}
            </div>
        </div>
    );
}

function NowLine() {
    const [now, setNow] = useState(new Date());
    useEffect(() => {
        const id = setInterval(() => setNow(new Date()), 60_000);
        return () => clearInterval(id);
    }, []);
    const min = minutesFromMidnight(now) - DAY_START_HOUR * 60;
    if (min < 0 || min > (DAY_END_HOUR - DAY_START_HOUR) * 60) return null;
    const top = (min / 60) * HOUR_HEIGHT;
    return (
        <div className="absolute left-0 right-0 z-20 pointer-events-none group" style={{ top }}>
            <div className="relative">
                <div className="absolute -left-1.5 -top-1.5 w-3 h-3 rounded-full bg-pink-500 border-2 border-neutral-950 shadow-[0_0_10px_rgba(236,72,153,0.6)] animate-pulse" />
                <div className="h-px w-full bg-gradient-to-r from-pink-500 to-transparent" />
            </div>
        </div>
    );
}

function BlockCard({ block, day, onClick, onResize }) {
    const bStart = new Date(block.starts_at);
    const bEnd = new Date(block.ends_at);
    
    const dayStart = startOfDay(day);
    const dayEnd = addDays(dayStart, 1);
    
    // Effective start/end for THIS day column (clipping)
    const renderStart = new Date(Math.max(bStart.getTime(), dayStart.getTime()));
    const renderEnd = new Date(Math.min(bEnd.getTime(), dayEnd.getTime()));
    
    const startMin = minutesFromMidnight(renderStart) - DAY_START_HOUR * 60;
    const durMin = (renderEnd - renderStart) / 60_000;
    
    const top = (startMin / 60) * HOUR_HEIGHT;
    const height = Math.max(24, (durMin / 60) * HOUR_HEIGHT);

    const onDragStart = (e) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('application/x-block', JSON.stringify({
            id: block.id, durationMin: (bEnd - bStart) / 60_000,
        }));
    };

    const onResizeStart = (e) => {
        e.preventDefault(); e.stopPropagation();
        // Resize only allowed on the day the block ends
        if (!isSameDay(bEnd, day)) return;

        const startY = e.clientY;
        const startHeight = height;
        const move = (ev) => {
            const delta = ev.clientY - startY;
            const newHeight = Math.max(HOUR_HEIGHT * (SNAP_MIN / 60), startHeight + delta);
            const newDurMin = snapMinutes((newHeight / HOUR_HEIGHT) * 60);
            const totalDurMin = ((bEnd - bStart) / 60_000) - (durMin) + newDurMin;
            const newEnd = new Date(bStart.getTime() + totalDurMin * 60_000);
            onResize(block.id, bStart, newEnd, /* commit */ false);
            // Live preview
            if (ev.target.parentElement) {
                ev.target.parentElement.style.height = `${(newDurMin / 60) * HOUR_HEIGHT}px`;
            }
        };
        const up = (ev) => {
            const delta = ev.clientY - startY;
            const newHeight = Math.max(HOUR_HEIGHT * (SNAP_MIN / 60), startHeight + delta);
            const newDurMin = snapMinutes((newHeight / HOUR_HEIGHT) * 60);
            const totalDurMin = ((bEnd - bStart) / 60_000) - (durMin) + newDurMin;
            const newEnd = new Date(bStart.getTime() + totalDurMin * 60_000);
            onResize(block.id, bStart, newEnd, /* commit */ true);
            window.removeEventListener('pointermove', move);
            window.removeEventListener('pointerup', up);
        };
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', up);
    };

    const tone = block.color || '#7c3aed';
    return (
        <div
            draggable
            onDragStart={onDragStart}
            onClick={onClick}
            className="absolute left-1 right-1 rounded-lg border-l-[4px] cursor-pointer overflow-hidden group hover:shadow-2xl hover:brightness-110 active:scale-[0.98] transition-all duration-200"
            style={{
                top: top + 2,
                height: height - 4,
                background: `${tone}33`,
                borderLeftColor: tone,
                borderTop: `1px solid ${tone}44`,
                borderRight: `1px solid ${tone}44`,
                borderBottom: `1px solid ${tone}44`,
                zIndex: 10,
                backdropFilter: 'blur(4px)',
            }}
        >
            <div className="px-2.5 py-2 text-[11px] leading-snug h-full flex flex-col justify-between">
                <div className="min-w-0">
                    <div className="font-bold text-white truncate drop-shadow-sm">{block.title}</div>
                    {height > 40 && (
                        <div className="text-white/60 font-medium text-[9px] mt-0.5 tracking-tight flex items-center gap-1 truncate">
                            <Clock size={9} />
                            {fmtTime(bStart)} – {fmtTime(bEnd)}
                        </div>
                    )}
                </div>
                {block.task && height > 60 && (
                    <div className="text-[10px] text-white/50 bg-black/20 rounded px-1.5 py-0.5 mt-1 truncate border border-white/10 italic">
                        ↳ {block.task.title}
                    </div>
                )}
            </div>
            {/* Resize handle (only on the last day of the block) */}
            {isSameDay(bEnd, day) && (
                <div
                    onPointerDown={onResizeStart}
                    className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                    <div className="w-6 h-0.5 bg-white/30 rounded-full" />
                </div>
            )}
        </div>
    );
}

/* ----------------------- Page ----------------------- */

export default function PlannerIndex({ view, anchor, rangeStart, rangeEnd, blocks, scheduledTasks, unscheduled }) {
    const [editor, setEditor] = useState(null);
    const [search, setSearch] = useState('');

    const days = useMemo(() => {
        const start = new Date(rangeStart);
        const dayCount = view === 'day' ? 1 : 7;
        return Array.from({ length: dayCount }, (_, i) => addDays(start, i));
    }, [rangeStart, view]);

    const blocksByDay = useMemo(() => {
        const map = new Map(days.map((d) => [startOfDay(d).getTime(), []]));
        blocks.forEach((b) => {
            const bStart = new Date(b.starts_at);
            const bEnd = new Date(b.ends_at);
            
            days.forEach(day => {
                const dayStart = startOfDay(day);
                const dayEnd = addDays(dayStart, 1);
                
                // If block overlaps this specific day
                if (bStart < dayEnd && bEnd > dayStart) {
                    map.get(dayStart.getTime()).push(b);
                }
            });
        });
        return map;
    }, [blocks, days]);

    const navigate = (offset) => {
        const next = addDays(new Date(anchor), offset * (view === 'day' ? 1 : 7));
        router.get(route('planner.index'), {
            view, date: next.toISOString().slice(0, 10),
        }, { preserveState: false, preserveScroll: true });
    };

    const goToday = () => {
        router.get(route('planner.index'), {
            view, date: new Date().toISOString().slice(0, 10),
        }, { preserveState: false, preserveScroll: true });
    };

    const setView = (v) => {
        router.get(route('planner.index'), { view: v, date: anchor }, { preserveState: false, preserveScroll: true });
    };

    const refresh = () => router.reload({ only: ['blocks', 'scheduledTasks', 'unscheduled'], preserveScroll: true });

    const onCreate = (init) => setEditor({ ...init, title: '', color: '#7c3aed' });
    const onSelectBlock = (b) => setEditor(b);

    const onDropTask = (task, starts, ends) => {
        router.post(route('planner.blocks.store'), {
            task_id: task.id,
            title: task.title,
            color: PRIORITY_COLOR[task.priority] || '#7c3aed',
            starts_at: starts.toISOString(),
            ends_at: ends.toISOString(),
        }, { preserveScroll: true, onSuccess: refresh });
    };

    const onMoveBlock = (id, starts, ends) => {
        const block = blocks.find((b) => b.id === id);
        if (!block) return;
        router.put(route('planner.blocks.update', id), {
            task_id: block.task_id || null,
            title: block.title,
            color: block.color,
            starts_at: starts.toISOString(),
            ends_at: ends.toISOString(),
        }, { preserveScroll: true, onSuccess: refresh });
    };

    const resizeDebounce = useRef(null);
    const onResizeBlock = (id, starts, ends, commit) => {
        if (!commit) return;
        clearTimeout(resizeDebounce.current);
        resizeDebounce.current = setTimeout(() => onMoveBlock(id, starts, ends), 50);
    };

    const filteredUnscheduled = useMemo(() => {
        if (!search.trim()) return unscheduled;
        const q = search.trim().toLowerCase();
        return unscheduled.filter((t) => t.title?.toLowerCase().includes(q));
    }, [unscheduled, search]);

    const headerLabel = view === 'day'
        ? fmtDateLong(anchor)
        : fmtMonthRange(rangeStart, addDays(new Date(rangeEnd), -1));

    return (
        <>
            <Head title="Planner" />
            <HomeShell
                title="Planner"
                subtitle="Time-block your day for maximum productivity"
                actions={
                    <div className="flex items-center gap-3 pr-14">
                        <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-lg p-0.5 shadow-inner">
                            <button onClick={() => navigate(-1)} className="p-1.5 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors">
                                <ChevronLeft size={16} />
                            </button>
                            <button onClick={goToday} className="px-3 py-1 text-xs font-bold text-neutral-300 hover:text-white transition-colors">
                                Today
                            </button>
                            <button onClick={() => navigate(1)} className="p-1.5 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors">
                                <ChevronRight size={16} />
                            </button>
                        </div>

                        <span className="text-sm font-bold text-neutral-200 min-w-[150px] text-center">
                            {headerLabel}
                        </span>

                        <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-lg p-1 shadow-inner">
                            {['day', 'week'].map((v) => (
                                <button
                                    key={v}
                                    onClick={() => setView(v)}
                                    className={`px-4 py-1 text-xs font-bold rounded-md transition-all duration-200 ${view === v ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30' : 'text-neutral-500 hover:text-neutral-300'}`}
                                >
                                    {v.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    </div>
                }
            >
                <div className="flex h-full bg-neutral-950/50">
                    {/* Unscheduled side panel */}
                    <aside className="w-80 shrink-0 border-r border-neutral-800 bg-neutral-900/40 flex flex-col shadow-2xl z-30">
                        <div className="p-4 border-b border-neutral-800 bg-neutral-900/60">
                            <div className="text-[11px] font-bold uppercase tracking-widest text-neutral-500 mb-3 flex items-center justify-between">
                                <span>Unscheduled Tasks</span>
                                <span className="bg-neutral-800 text-neutral-400 px-2 py-0.5 rounded-full text-[9px]">{unscheduled.length}</span>
                            </div>
                            <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 focus-within:border-purple-500/50 transition-all shadow-inner">
                                <Search size={14} className="text-neutral-600" />
                                <input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Quick search..."
                                    className="bg-transparent border-none p-0 text-sm text-white placeholder:text-neutral-600 focus:ring-0 w-full"
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                            {filteredUnscheduled.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                                    <div className="w-12 h-12 rounded-full bg-neutral-800/50 flex items-center justify-center mb-4 text-neutral-600">
                                        <CheckSquare size={24} />
                                    </div>
                                    <p className="text-sm font-medium text-neutral-500">
                                        {search ? 'No matching tasks' : 'All caught up!'}
                                    </p>
                                    <p className="text-[11px] text-neutral-600 mt-1">Nothing left to schedule at the moment.</p>
                                </div>
                            ) : filteredUnscheduled.map((t) => (
                                <TaskChip key={t.id} task={t} />
                            ))}
                        </div>
                        
                        <div className="p-4 border-t border-neutral-800 bg-neutral-900/60">
                            <div className="text-[10px] font-medium text-neutral-500 leading-relaxed flex flex-col gap-1.5">
                                <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-purple-500" /> Drag tasks onto calendar to schedule.</div>
                                <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Double-click a slot to create a custom block.</div>
                                <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Drag to move, bottom edge to resize.</div>
                            </div>
                        </div>
                    </aside>

                    {/* Calendar */}
                    <div className="flex-1 flex flex-col bg-neutral-950/20">
                        <div className="flex-1 flex overflow-y-auto custom-scrollbar relative">
                            <TimeGutter />
                            {days.map((d) => (
                                <DayColumn
                                    key={d.toISOString()}
                                    day={d}
                                    isToday={isSameDay(d, new Date())}
                                    blocks={blocksByDay.get(startOfDay(d).getTime()) || []}
                                    onCreate={onCreate}
                                    onSelectBlock={onSelectBlock}
                                    onDropTask={onDropTask}
                                    onMoveBlock={onMoveBlock}
                                    onResizeBlock={onResizeBlock}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </HomeShell>

            {editor && (
                <BlockEditor
                    block={editor}
                    onClose={() => setEditor(null)}
                    onChanged={refresh}
                />
            )}
        </>
    );
}

