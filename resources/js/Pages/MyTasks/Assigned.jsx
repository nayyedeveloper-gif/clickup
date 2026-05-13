import { Head, Link, router } from '@inertiajs/react';
import { useMemo, useRef, useState } from 'react';
import HomeShell from '@/Components/HomeShell';
import TaskTableRow from '@/Components/TaskTableRow';
import CommentModal from '@/Components/CommentModal';
import FilterPopover, { evaluateFilters } from '@/Components/Popovers/FilterPopover';
import CustomizePopover from '@/Components/Popovers/CustomizePopover';
import {
    ChevronDown,
    ChevronRight,
    Filter,
    EyeOff,
    Search,
    Settings2,
    Plus,
    GripVertical,
    Check,
} from 'lucide-react';

const STATUS_GROUPS = [
    { key: 'open', label: 'TO DO', color: '#9ca3af' },
    { key: 'todo', label: 'TO DO', color: '#9ca3af' },
    { key: 'in_progress', label: 'IN PROGRESS', color: '#3b82f6' },
    { key: 'in progress', label: 'IN PROGRESS', color: '#3b82f6' },
    { key: 'review', label: 'REVIEW', color: '#f59e0b' },
    { key: 'blocked', label: 'BLOCKED', color: '#ef4444' },
    { key: 'done', label: 'COMPLETE', color: '#10b981' },
    { key: 'completed', label: 'COMPLETE', color: '#10b981' },
];

const PRIORITY_GROUP_ORDER = ['urgent', 'high', 'medium', 'normal', 'low', 'none'];

function statusMeta(key) {
    return STATUS_GROUPS.find((s) => s.key === (key || '').toLowerCase())
        || { key: key || 'open', label: (key || 'TO DO').toUpperCase(), color: '#9ca3af' };
}

function GroupBadge({ groupBy, value }) {
    if (groupBy === 'status') {
        const meta = statusMeta(value);
        return (
            <span
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider text-white"
                style={{ background: meta.color }}
            >
                <Check size={11} /> {meta.label}
            </span>
        );
    }
    if (groupBy === 'priority') {
        const colors = { urgent: '#ef4444', high: '#f59e0b', medium: '#eab308', normal: '#3b82f6', low: '#9ca3af', none: '#6b7280' };
        return (
            <span
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider text-white"
                style={{ background: colors[value] || '#6b7280' }}
            >
                {value || 'NONE'}
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider bg-neutral-700 text-neutral-100">
            {value || 'OTHER'}
        </span>
    );
}

function Pill({ active, onClick, children, color }) {
    return (
        <button
            onClick={onClick}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition ${
                active
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                    : 'bg-neutral-800/70 text-neutral-300 border border-neutral-800 hover:bg-neutral-800'
            }`}
            style={active && color ? { background: `${color}26`, color, borderColor: `${color}66` } : {}}
        >
            {children}
        </button>
    );
}

const HeaderButton = ({ buttonRef, icon: Icon, label, active, onClick, badge }) => (
    <button
        ref={buttonRef}
        type="button"
        onClick={onClick}
        className={`relative inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-md border px-0 text-xs transition lg:min-h-0 lg:min-w-0 lg:px-2.5 lg:py-1 ${
            active
                ? 'bg-neutral-800 text-white border-neutral-700'
                : 'bg-transparent text-neutral-400 border-neutral-800 hover:text-white hover:bg-neutral-800/60'
        }`}
    >
        <Icon size={15} className="shrink-0 lg:h-[13px] lg:w-[13px]" />
        {label ? (
            <span className="sr-only lg:not-sr-only lg:inline">{label}</span>
        ) : (
            <span className="sr-only">Search</span>
        )}
        {badge > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-purple-500 px-1 text-[10px] font-semibold leading-none text-white lg:static lg:ml-1 lg:inline-flex">
                {badge}
            </span>
        )}
    </button>
);

const COLUMNS = [
    { key: 'assignee', label: 'Assignee' },
    { key: 'priority', label: 'Priority' },
    { key: 'due_date', label: 'Due date' },
];

export default function Assigned({ tasks }) {
    const [groupBy, setGroupBy] = useState('status');
    const [showSubtasks, setShowSubtasks] = useState(true);
    const [search, setSearch] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [collapsed, setCollapsed] = useState({});
    const [columns, setColumns] = useState({ assignee: true, priority: true, due_date: true });
    const [showColumnsBar, setShowColumnsBar] = useState(false);
    const [filters, setFilters] = useState([]);

    // Customize settings
    const [settings, setSettings] = useState({
        showEmptyStatuses: false,
        wrapText: false,
        showTaskLocations: true,
        showSubtaskParents: true,
        showClosed: false,
    });

    // Popover open state
    const [openPopover, setOpenPopover] = useState(null); // 'filter' | 'customize' | null
    const filterBtnRef = useRef(null);
    const customizeBtnRef = useRef(null);
    const [activeCommentTask, setActiveCommentTask] = useState(null);
    const [commentModalPosition, setCommentModalPosition] = useState(null);

    const refresh = () => router.reload({ only: ['tasks'] });
    const handleCommentClick = (task, event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        setCommentModalPosition({
            top: rect.top,
            left: rect.left,
            bottom: rect.bottom,
            right: rect.right,
            width: rect.width,
            height: rect.height,
        });
        setActiveCommentTask(task);
    };

    const filtered = useMemo(() => {
        let list = tasks;
        if (!showSubtasks) list = list.filter((t) => !t.parent_task_id);
        if (!settings.showClosed) list = list.filter((t) => !t.date_done);
        if (search.trim()) {
            const q = search.trim().toLowerCase();
            list = list.filter((t) => t.title?.toLowerCase().includes(q));
        }
        // Apply advanced filters
        const active = filters.filter((f) => f.field);
        if (active.length > 0) list = list.filter((t) => evaluateFilters(t, active));
        return list;
    }, [tasks, showSubtasks, settings.showClosed, search, filters]);

    const grouped = useMemo(() => {
        const groups = new Map();
        filtered.forEach((t) => {
            let key;
            if (groupBy === 'status') key = (t.status || 'open').toLowerCase();
            else if (groupBy === 'priority') key = t.priority || 'none';
            else if (groupBy === 'list') key = t.list?.name || 'No list';
            else key = 'All';
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key).push(t);
        });

        // Optionally inject empty statuses
        if (settings.showEmptyStatuses && groupBy === 'status') {
            ['todo', 'in_progress', 'review', 'blocked', 'done'].forEach((k) => {
                if (!groups.has(k)) groups.set(k, []);
            });
        }

        const entries = Array.from(groups.entries());
        if (groupBy === 'priority') {
            entries.sort(([a], [b]) => PRIORITY_GROUP_ORDER.indexOf(a) - PRIORITY_GROUP_ORDER.indexOf(b));
        } else if (groupBy === 'status') {
            entries.sort(([a], [b]) => {
                const order = ['open', 'todo', 'in_progress', 'in progress', 'review', 'blocked', 'done', 'completed'];
                const ai = order.indexOf(a); const bi = order.indexOf(b);
                return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
            });
        } else {
            entries.sort(([a], [b]) => String(a).localeCompare(String(b)));
        }
        return entries;
    }, [filtered, groupBy, settings.showEmptyStatuses]);

    const toggle = (k) => setCollapsed((s) => ({ ...s, [k]: !s[k] }));

    const activeFilterCount = filters.filter((f) => f.field).length;
    const fieldsShown = Object.values(columns).filter(Boolean).length;

    return (
        <>
            <Head title="Assigned to me" />
            <HomeShell
                title="Assigned to me"
                subtitle="My tasks"
                actions={
                    <div className="flex items-center gap-1.5 relative">
                        <HeaderButton
                            buttonRef={filterBtnRef}
                            icon={Filter}
                            label="Filter"
                            active={openPopover === 'filter' || activeFilterCount > 0}
                            badge={activeFilterCount}
                            onClick={() => setOpenPopover((p) => (p === 'filter' ? null : 'filter'))}
                        />
                        <HeaderButton
                            icon={EyeOff}
                            label={settings.showClosed ? 'Hide Closed' : 'Closed'}
                            active={settings.showClosed}
                            onClick={() => setSettings((s) => ({ ...s, showClosed: !s.showClosed }))}
                        />
                        <HeaderButton
                            icon={Search}
                            label=""
                            active={showSearch}
                            onClick={() => setShowSearch((v) => !v)}
                        />
                        <HeaderButton
                            buttonRef={customizeBtnRef}
                            icon={Settings2}
                            label="Customize"
                            active={openPopover === 'customize'}
                            onClick={() => setOpenPopover((p) => (p === 'customize' ? null : 'customize'))}
                        />

                        {openPopover === 'filter' && (
                            <FilterPopover
                                anchorRef={filterBtnRef}
                                filters={filters}
                                onChange={setFilters}
                                onClose={() => setOpenPopover(null)}
                            />
                        )}
                        {openPopover === 'customize' && (
                            <CustomizePopover
                                anchorRef={customizeBtnRef}
                                settings={settings}
                                onChange={setSettings}
                                onClose={() => setOpenPopover(null)}
                                summary={{
                                    fieldsShown,
                                    filterCount: activeFilterCount,
                                    groupBy,
                                    subtasksCollapsed: !showSubtasks,
                                }}
                                onOpenFilters={() => setOpenPopover('filter')}
                                onChangeGroup={() => {
                                    const order = ['status', 'priority', 'list', 'none'];
                                    setGroupBy(order[(order.indexOf(groupBy) + 1) % order.length]);
                                }}
                                onToggleSubtasks={() => setShowSubtasks((v) => !v)}
                                onToggleColumns={() => setShowColumnsBar((v) => !v)}
                            />
                        )}
                    </div>
                }
                tabs={
                    <div className="flex w-full flex-col gap-2 lg:flex-row lg:items-center">
                        <div className="flex min-w-0 items-center gap-2 overflow-x-auto no-scrollbar">
                            <Pill active>
                                <GripVertical size={11} className="opacity-60" />
                                Group: {groupBy[0].toUpperCase() + groupBy.slice(1)}
                                <select
                                    value={groupBy}
                                    onChange={(e) => setGroupBy(e.target.value)}
                                    className="cursor-pointer border-0 bg-transparent text-[11px] outline-none"
                                >
                                    <option value="status">Status</option>
                                    <option value="priority">Priority</option>
                                    <option value="list">List</option>
                                    <option value="none">None</option>
                                </select>
                            </Pill>
                            <Pill active={showSubtasks} onClick={() => setShowSubtasks((v) => !v)}>
                                <span className="opacity-60">⤷</span> Subtasks
                            </Pill>
                        </div>
                        {showSearch && (
                            <input
                                autoFocus
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search tasks…"
                                className="w-full rounded-md border border-neutral-800 bg-neutral-800/70 px-2.5 py-2 text-xs text-white outline-none focus:bg-neutral-700 lg:ml-2 lg:w-56"
                            />
                        )}
                        {activeFilterCount > 0 && (
                            <button
                                type="button"
                                onClick={() => setFilters([])}
                                className="shrink-0 text-left text-[11px] text-neutral-400 hover:text-red-400 lg:ml-2"
                            >
                                Clear filters ({activeFilterCount})
                            </button>
                        )}
                    </div>
                }
            >
                {showColumnsBar && (
                    <div className="flex flex-wrap items-center gap-2 border-b border-neutral-800 bg-neutral-900/50 px-3 py-2 sm:px-6 sm:py-3">
                        <span className="text-xs text-neutral-500 mr-2">Columns:</span>
                        {COLUMNS.map((c) => (
                            <button
                                key={c.key}
                                onClick={() => setColumns((s) => ({ ...s, [c.key]: !s[c.key] }))}
                                className={`px-2 py-1 rounded text-xs border ${
                                    columns[c.key]
                                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                                        : 'bg-neutral-800 text-neutral-400 border-neutral-800'
                                }`}
                            >
                                {columns[c.key] ? <Check size={11} className="inline mr-1" /> : null}
                                {c.label}
                            </button>
                        ))}
                    </div>
                )}

                <div className="min-w-0 overflow-x-auto lg:overflow-x-visible">
                    <div className="min-w-[560px] lg:min-w-0">
                        {/* Table header */}
                        <div className="sticky top-0 z-10 bg-neutral-950 border-b border-neutral-800">
                            <div className="flex items-center gap-3 px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                                <span className="w-4" />
                                <span className="flex-1">Name</span>
                                {columns.assignee && <span className="w-12 text-right" />}
                                {columns.priority && <span className="w-28">Priority</span>}
                                {columns.due_date && <span className="w-24">Due date</span>}
                            </div>
                        </div>

                        {filtered.length === 0 ? (
                            <div className="px-6 py-16 text-center text-sm text-neutral-500">
                                Nothing matches the current filters.
                            </div>
                        ) : (
                            grouped.map(([key, list]) => {
                                const isOpen = !collapsed[key];
                                return (
                                    <div key={key} className="border-b border-neutral-800">
                                        <button
                                            type="button"
                                            onClick={() => toggle(key)}
                                            className="flex w-full items-center gap-2 px-4 py-2 hover:bg-neutral-900/40"
                                        >
                                            {isOpen ? (
                                                <ChevronDown size={12} className="text-neutral-500" />
                                            ) : (
                                                <ChevronRight size={12} className="text-neutral-500" />
                                            )}
                                            <GroupBadge groupBy={groupBy} value={key} />
                                            <span className="text-xs text-neutral-500">{list.length}</span>
                                        </button>
                                        {isOpen && (
                                            <>
                                                {list.map((t) => (
                                                    <TaskTableRow
                                                        key={t.id}
                                                        task={t}
                                                        columns={columns}
                                                        wrapText={settings.wrapText}
                                                        showLocation={settings.showTaskLocations}
                                                        showSubtaskParent={settings.showSubtaskParents}
                                                        onChange={refresh}
                                                        onCommentClick={handleCommentClick}
                                                    />
                                                ))}
                                                {list.length === 0 && (
                                                    <div className="px-4 py-2 text-xs italic text-neutral-600">
                                                        No tasks in this status
                                                    </div>
                                                )}
                                                <Link
                                                    href="#"
                                                    onClick={(e) => e.preventDefault()}
                                                    className="flex items-center gap-2 px-4 py-1.5 text-xs text-neutral-500 hover:bg-neutral-900/40 hover:text-purple-400"
                                                >
                                                    <Plus size={13} /> Add Task
                                                </Link>
                                            </>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </HomeShell>
            {activeCommentTask && (
                <CommentModal
                    task={activeCommentTask}
                    onClose={() => {
                        setActiveCommentTask(null);
                        setCommentModalPosition(null);
                    }}
                    onChanged={refresh}
                    position={commentModalPosition}
                />
            )}
        </>
    );
}
