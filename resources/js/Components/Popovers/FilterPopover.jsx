import { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import {
    Search,
    Trash2,
    Plus,
    ChevronDown,
    Info,
    CircleDot,
    Tag,
    Calendar,
    Flag,
    Archive,
    MessageSquare,
    UserCircle,
    CalendarOff,
    CalendarPlus,
    CalendarClock,
} from 'lucide-react';

/**
 * Available filter fields. Each entry knows how to render its value picker
 * and how to evaluate against a task.
 */
const FIELDS = [
    { key: 'status', label: 'Status', icon: CircleDot, type: 'multi-status' },
    { key: 'tags', label: 'Tags', icon: Tag, type: 'tags', disabled: true, hint: 'Tags coming soon' },
    { key: 'due_date', label: 'Due date', icon: Calendar, type: 'date-preset' },
    { key: 'priority', label: 'Priority', icon: Flag, type: 'multi-priority' },
    { key: 'archived', label: 'Archived', icon: Archive, type: 'bool' },
    { key: 'assigned_comment', label: 'Assigned comment', icon: MessageSquare, type: 'bool', disabled: true, hint: 'Coming soon' },
    { key: 'created_by', label: 'Created by', icon: UserCircle, type: 'user' },
    { key: 'date_closed', label: 'Date closed', icon: CalendarOff, type: 'date-range' },
    { key: 'date_created', label: 'Date created', icon: CalendarPlus, type: 'date-range' },
    { key: 'date_updated', label: 'Date updated', icon: CalendarClock, type: 'date-range' },
];

const STATUS_OPTIONS = [
    { key: 'todo', label: 'To Do', color: '#9ca3af' },
    { key: 'open', label: 'Open', color: '#9ca3af' },
    { key: 'in_progress', label: 'In Progress', color: '#3b82f6' },
    { key: 'review', label: 'Review', color: '#f59e0b' },
    { key: 'blocked', label: 'Blocked', color: '#ef4444' },
    { key: 'done', label: 'Done', color: '#10b981' },
    { key: 'completed', label: 'Completed', color: '#10b981' },
];

const PRIORITY_OPTIONS = [
    { key: 'urgent', label: 'Urgent', color: '#ef4444' },
    { key: 'high', label: 'High', color: '#f59e0b' },
    { key: 'medium', label: 'Medium', color: '#eab308' },
    { key: 'normal', label: 'Normal', color: '#3b82f6' },
    { key: 'low', label: 'Low', color: '#9ca3af' },
];

const DATE_PRESETS = [
    { key: 'overdue', label: 'Overdue' },
    { key: 'today', label: 'Today' },
    { key: 'tomorrow', label: 'Tomorrow' },
    { key: 'this_week', label: 'This week' },
    { key: 'next_week', label: 'Next week' },
    { key: 'no_due', label: 'No due date' },
];

function startOfDay(d) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }

export function evaluateFilters(task, filters) {
    return filters.every((f) => {
        if (!f.field || !f.value) return true;
        switch (f.field) {
            case 'status':
                if (!Array.isArray(f.value) || f.value.length === 0) return true;
                return f.value.includes((task.status || '').toLowerCase());
            case 'priority':
                if (!Array.isArray(f.value) || f.value.length === 0) return true;
                return f.value.includes(task.priority || 'normal');
            case 'archived':
                // Treat done = archived for now
                return f.value ? !!task.date_done : true;
            case 'created_by':
                return Number(task.created_by) === Number(f.value);
            case 'due_date': {
                const d = task.due_date ? startOfDay(task.due_date) : null;
                const today = startOfDay(new Date());
                if (f.value === 'overdue') return d && d < today && !task.date_done;
                if (f.value === 'today') return d && +d === +today;
                if (f.value === 'tomorrow') {
                    const t = new Date(today); t.setDate(t.getDate() + 1);
                    return d && +d === +t;
                }
                if (f.value === 'this_week') {
                    const end = new Date(today); end.setDate(end.getDate() + 7);
                    return d && d >= today && d < end;
                }
                if (f.value === 'next_week') {
                    const start = new Date(today); start.setDate(start.getDate() + 7);
                    const end = new Date(start); end.setDate(end.getDate() + 7);
                    return d && d >= start && d < end;
                }
                if (f.value === 'no_due') return !d;
                return true;
            }
            case 'date_created':
            case 'date_updated':
            case 'date_closed': {
                const map = { date_created: 'created_at', date_updated: 'updated_at', date_closed: 'date_done' };
                const value = task[map[f.field]];
                if (!value) return f.field === 'date_closed' ? false : true;
                const d = startOfDay(value);
                const from = f.value.from ? startOfDay(f.value.from) : null;
                const to = f.value.to ? startOfDay(f.value.to) : null;
                if (from && d < from) return false;
                if (to && d > to) return false;
                return !!(from || to);
            }
            default:
                return true;
        }
    });
}

function ValueControl({ filter, onChange }) {
    const def = FIELDS.find((f) => f.key === filter.field);
    if (!def) return null;
    const v = filter.value;

    if (def.disabled) {
        return <span className="text-xs text-neutral-500 italic">{def.hint || 'Coming soon'}</span>;
    }

    if (def.type === 'multi-status' || def.type === 'multi-priority') {
        const opts = def.type === 'multi-status' ? STATUS_OPTIONS : PRIORITY_OPTIONS;
        const arr = Array.isArray(v) ? v : [];
        return (
            <div className="flex flex-wrap gap-1">
                {opts.map((o) => {
                    const on = arr.includes(o.key);
                    return (
                        <button
                            key={o.key}
                            type="button"
                            onClick={() => onChange(on ? arr.filter((x) => x !== o.key) : [...arr, o.key])}
                            className="px-2 py-0.5 rounded text-[11px] font-medium border transition"
                            style={on
                                ? { background: `${o.color}33`, color: o.color, borderColor: `${o.color}88` }
                                : { background: 'transparent', color: '#9ca3af', borderColor: '#404040' }}
                        >
                            {o.label}
                        </button>
                    );
                })}
            </div>
        );
    }

    if (def.type === 'date-preset') {
        return (
            <select
                value={v || ''}
                onChange={(e) => onChange(e.target.value || null)}
                className="px-2 py-1 rounded bg-neutral-800 border border-neutral-700 text-xs text-white"
            >
                <option value="">Any</option>
                {DATE_PRESETS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
            </select>
        );
    }

    if (def.type === 'date-range') {
        const range = (typeof v === 'object' && v) || {};
        return (
            <div className="flex items-center gap-1 text-xs">
                <input
                    type="date" value={range.from || ''}
                    onChange={(e) => onChange({ ...range, from: e.target.value })}
                    className="px-2 py-1 rounded bg-neutral-800 border border-neutral-700 text-white"
                />
                <span className="text-neutral-500">→</span>
                <input
                    type="date" value={range.to || ''}
                    onChange={(e) => onChange({ ...range, to: e.target.value })}
                    className="px-2 py-1 rounded bg-neutral-800 border border-neutral-700 text-white"
                />
            </div>
        );
    }

    if (def.type === 'bool') {
        return (
            <label className="flex items-center gap-1.5 text-xs text-neutral-300 cursor-pointer">
                <input
                    type="checkbox" checked={!!v}
                    onChange={(e) => onChange(e.target.checked)}
                    className="rounded bg-neutral-800 border-neutral-700"
                />
                Only {def.label.toLowerCase()}
            </label>
        );
    }

    if (def.type === 'user') {
        return <UserSelect value={v} onChange={onChange} />;
    }

    return null;
}

function UserSelect({ value, onChange }) {
    const [users, setUsers] = useState([]);
    useEffect(() => {
        let cancelled = false;
        axios.get(route('members.index'))
            .then((res) => {
                if (cancelled) return;
                const list = Array.isArray(res.data) ? res.data : (res.data?.users || []);
                setUsers(list);
            })
            .catch(() => {});
        return () => { cancelled = true; };
    }, []);
    return (
        <select
            value={value || ''}
            onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
            className="px-2 py-1 rounded bg-neutral-800 border border-neutral-700 text-xs text-white min-w-[140px]"
        >
            <option value="">Anyone</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
    );
}

export default function FilterPopover({ filters, onChange, onClose, anchorRef }) {
    const [picker, setPicker] = useState(null); // null | { rowId } when picking field for a row
    const [search, setSearch] = useState('');
    const popRef = useRef(null);

    // Close on outside click
    useEffect(() => {
        const onDown = (e) => {
            if (popRef.current && !popRef.current.contains(e.target)
                && (!anchorRef?.current || !anchorRef.current.contains(e.target))) {
                onClose();
            }
        };
        document.addEventListener('mousedown', onDown);
        return () => document.removeEventListener('mousedown', onDown);
    }, [onClose, anchorRef]);

    const visibleFields = useMemo(() => {
        const q = search.trim().toLowerCase();
        return FIELDS.filter((f) => !q || f.label.toLowerCase().includes(q));
    }, [search]);

    const updateFilter = (id, patch) => onChange(filters.map((f) => (f.id === id ? { ...f, ...patch } : f)));
    const removeFilter = (id) => onChange(filters.filter((f) => f.id !== id));
    const addRow = () => {
        const id = `f-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        onChange([...filters, { id, field: null, value: null }]);
        setPicker({ rowId: id });
    };
    const setField = (rowId, fieldKey) => {
        const def = FIELDS.find((x) => x.key === fieldKey);
        let initial = null;
        if (def?.type === 'multi-status' || def?.type === 'multi-priority') initial = [];
        if (def?.type === 'date-range') initial = {};
        if (def?.type === 'bool') initial = true;
        updateFilter(rowId, { field: fieldKey, value: initial });
        setPicker(null);
        setSearch('');
    };

    return (
        <div
            ref={popRef}
            className="absolute right-0 top-full mt-2 w-[360px] bg-neutral-900 border border-neutral-700 rounded-lg shadow-2xl z-50"
        >
            <div className="px-4 py-3 border-b border-neutral-800 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-sm font-semibold text-neutral-100">
                    Filters <Info size={12} className="text-neutral-500" />
                </div>
                <button className="text-xs text-neutral-400 hover:text-white flex items-center gap-1">
                    Saved filters <ChevronDown size={11} />
                </button>
            </div>

            <div className="p-3 space-y-2 max-h-[60vh] overflow-y-auto">
                {filters.length === 0 && (
                    <div className="text-xs text-neutral-500 italic px-1">No filters yet — add one below</div>
                )}
                {filters.map((f) => {
                    const def = f.field ? FIELDS.find((x) => x.key === f.field) : null;
                    const isPicking = picker?.rowId === f.id;
                    return (
                        <div key={f.id} className="rounded-md border border-neutral-800 bg-neutral-800/40">
                            <div className="flex items-center gap-2 px-2 py-1.5">
                                <button
                                    onClick={() => setPicker(isPicking ? null : { rowId: f.id })}
                                    className="flex-1 flex items-center gap-1.5 px-2 py-1 rounded text-xs text-neutral-200 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700"
                                >
                                    {def?.icon ? <def.icon size={12} className="text-neutral-400" /> : null}
                                    <span className="flex-1 text-left">{def?.label || 'Select filter'}</span>
                                    <ChevronDown size={11} className="text-neutral-500" />
                                </button>
                                <button
                                    onClick={() => removeFilter(f.id)}
                                    className="text-neutral-500 hover:text-red-400"
                                    title="Remove filter"
                                >
                                    <Trash2 size={13} />
                                </button>
                            </div>

                            {isPicking && (
                                <div className="px-2 pb-2 border-t border-neutral-800">
                                    <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-neutral-800 border border-neutral-700 mt-2">
                                        <Search size={12} className="text-neutral-500" />
                                        <input
                                            autoFocus
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            placeholder="Search"
                                            className="flex-1 bg-transparent text-xs text-white outline-none"
                                        />
                                    </div>
                                    <div className="mt-1 max-h-56 overflow-y-auto">
                                        {visibleFields.map((fd) => {
                                            const Icon = fd.icon;
                                            return (
                                                <button
                                                    key={fd.key}
                                                    onClick={() => !fd.disabled && setField(f.id, fd.key)}
                                                    disabled={fd.disabled}
                                                    className={`w-full flex items-center gap-2 px-2 py-1.5 text-left text-xs rounded ${
                                                        fd.disabled
                                                            ? 'text-neutral-600 cursor-not-allowed'
                                                            : 'text-neutral-200 hover:bg-neutral-800'
                                                    }`}
                                                >
                                                    <Icon size={13} className="text-neutral-400" />
                                                    {fd.label}
                                                    {fd.disabled && <span className="ml-auto text-[10px] text-neutral-600">soon</span>}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {def && !isPicking && (
                                <div className="px-3 pb-2 pt-1">
                                    <ValueControl
                                        filter={f}
                                        onChange={(value) => updateFilter(f.id, { value })}
                                    />
                                </div>
                            )}
                        </div>
                    );
                })}

                <button
                    onClick={addRow}
                    className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs text-neutral-400 hover:text-white hover:bg-neutral-800 border border-dashed border-neutral-700"
                >
                    <Plus size={13} /> Add filter
                </button>
            </div>

            {filters.length > 0 && (
                <div className="px-3 py-2 border-t border-neutral-800 flex justify-between">
                    <button
                        onClick={() => onChange([])}
                        className="text-xs text-neutral-400 hover:text-red-400"
                    >
                        Clear all
                    </button>
                    <span className="text-xs text-neutral-500">
                        {filters.filter((f) => f.field).length} active
                    </span>
                </div>
            )}
        </div>
    );
}
