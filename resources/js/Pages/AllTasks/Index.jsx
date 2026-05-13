import { Link, router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import Sidebar from '@/Components/Sidebar';
import CommentModal from '@/Components/CommentModal';
import {
    LayoutList,
    Kanban,
    Calendar as CalendarIcon,
    Plus,
    ChevronDown,
    ChevronRight,
    Trash2,
    Filter,
    Search,
    CheckCircle2,
    User,
    MoreHorizontal,
    List,
    LayoutGrid,
    MessageCircle,
} from 'lucide-react';

const PRIORITIES = [
    { id: 'urgent', label: 'Urgent', color: '#ef4444' },
    { id: 'high', label: 'High', color: '#f97316' },
    { id: 'medium', label: 'Medium', color: '#eab308' },
    { id: 'low', label: 'Low', color: '#6b7280' },
];

const VIEWS = [
    { id: 'list', label: 'List', icon: List },
    { id: 'board', label: 'Board', icon: LayoutGrid },
    { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
];

function priorityTone(p) {
    switch (p) {
        case 'urgent': return 'bg-red-500/20 text-red-300 border-red-500/30';
        case 'high': return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
        case 'medium': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
        case 'low': return 'bg-neutral-700 text-neutral-300 border-neutral-600';
        default: return 'bg-neutral-700 text-neutral-300';
    }
}

function priorityFlag(p) {
    const color = PRIORITIES.find(x => x.id === p)?.color || '#6b7280';
    return <span className="text-[10px] font-bold" style={{ color }}>●</span>;
}

function statusStyle(color) {
    return {
        backgroundColor: `${color}33`,
        color,
        border: `1px solid ${color}66`,
    };
}

export default function AllTasksIndex({ tasks, groupedByStatus, statuses, spaces, selectedSpace }) {
    const { auth } = usePage().props;
    const userName = auth?.user?.name || 'Workspace';

    const [view, setView] = useState('list');
    const [filterSpace, setFilterSpace] = useState(selectedSpace || 'all');
    const [activeCommentTask, setActiveCommentTask] = useState(null);
    const [commentModalPosition, setCommentModalPosition] = useState(null);

    // Handle space filter change
    useEffect(() => {
        const params = {};
        if (filterSpace !== 'all') {
            params.space = filterSpace;
        }
        router.get(route('all-tasks'), params, { preserveState: true, replace: true });
    }, [filterSpace]);

    // Handle comment icon click with position calculation
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

    const [expandedGroups, setExpandedGroups] = useState(() => {
        // All groups expanded by default
        const keys = Object.keys(groupedByStatus);
        return Object.fromEntries(keys.map(k => [k, true]));
    });
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterPriority, setFilterPriority] = useState('all');
    const [filterAssignee, setFilterAssignee] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [showClosed, setShowClosed] = useState(false);
    const [groupBy, setGroupBy] = useState('status'); // status | list | assignee | priority

    const toggleGroup = (key) => {
        setExpandedGroups(s => ({ ...s, [key]: !s[key] }));
    };

    const expandAll = () => {
        const keys = Object.keys(filteredGrouped);
        setExpandedGroups(Object.fromEntries(keys.map(k => [k, true])));
    };

    const collapseAll = () => {
        const keys = Object.keys(filteredGrouped);
        setExpandedGroups(Object.fromEntries(keys.map(k => [k, false])));
    };

    // Filter tasks
    const filteredGrouped = useMemo(() => {
        let result = {};
        
        for (const [key, group] of Object.entries(groupedByStatus)) {
            let filtered = group.tasks.filter(t => {
                if (filterStatus !== 'all' && t.status !== filterStatus) return false;
                if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
                if (filterAssignee !== 'all') {
                    if (filterAssignee === 'me' && t.assigned_to?.id !== auth?.user?.id) return false;
                    if (filterAssignee === 'unassigned' && t.assigned_to) return false;
                }
                if (searchQuery) {
                    const q = searchQuery.toLowerCase();
                    if (!t.title.toLowerCase().includes(q) && 
                        !(t.description || '').toLowerCase().includes(q)) return false;
                }
                // Hide completed unless showClosed is on
                if (!showClosed && t.status === 'completed') return false;
                return true;
            });
            
            if (filtered.length > 0 || Object.keys(groupedByStatus).length === 1) {
                result[key] = { ...group, tasks: filtered };
            }
        }
        
        return result;
    }, [groupedByStatus, filterStatus, filterPriority, filterAssignee, searchQuery, showClosed, auth?.user?.id]);

    const findStatus = (key) => statuses.find(s => s.key === key) || { key, label: key, color: '#6b7280' };

    const totalTasks = useMemo(() => 
        Object.values(filteredGrouped).reduce((sum, g) => sum + g.tasks.length, 0),
        [filteredGrouped]
    );

    const updateTaskStatus = (taskId, status) => {
        router.put(route('tasks.update', taskId), { status }, { preserveScroll: true });
    };

    const updateTaskDueDate = (taskId, due_date) => {
        router.put(route('tasks.update', taskId), { due_date }, { preserveScroll: true });
    };

    const updateTaskStartDate = (taskId, start_date) => {
        router.put(route('tasks.update', taskId), { start_date }, { preserveScroll: true });
    };

    const updateTaskAssignee = (taskId, assignedTo) => {
        router.put(route('tasks.update', taskId), { assigned_to: assignedTo }, { preserveScroll: true });
    };

    const deleteTask = (taskId) => {
        if (confirm('Delete this task?')) {
            router.delete(route('tasks.destroy', taskId), { preserveScroll: true });
        }
    };

    const statusOptions = [{ key: 'all', label: 'All statuses' }, ...statuses.map(s => ({ key: s.key, label: s.label }))];

    return (
        <div className="flex h-screen bg-neutral-950 text-neutral-100">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-neutral-800 pr-20">
                    <div className="flex items-center gap-2 text-xs text-neutral-500 mb-1">
                        <span>မကျယ်သေးဘူး</span>
                        <ChevronRight size={12} />
                        <span className="text-neutral-300">All Tasks</span>
                    </div>
                    <h1 className="text-xl font-semibold">{userName}'s Workspace</h1>
                </div>

                {/* View Tabs */}
                <div className="px-6 py-2 border-b border-neutral-800 flex items-center gap-1">
                    {VIEWS.map(v => (
                        <button
                            key={v.id}
                            onClick={() => setView(v.id)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm transition ${
                                view === v.id 
                                    ? 'bg-neutral-800 text-white' 
                                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
                            }`}
                        >
                            <v.icon size={14} />
                            {v.label}
                        </button>
                    ))}
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm text-neutral-400 hover:text-white hover:bg-neutral-800/50 ml-1">
                        <Plus size={14} />
                        View
                    </button>
                </div>

                {/* Filters & Actions Bar */}
                <div className="px-6 py-3 border-b border-neutral-800 flex items-center gap-3">
                    {/* Space filter */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-neutral-500">Space:</span>
                        <select
                            value={filterSpace}
                            onChange={(e) => setFilterSpace(e.target.value)}
                            className="bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs"
                        >
                            <option value="all">All spaces</option>
                            {spaces.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="h-4 w-px bg-neutral-700 mx-1" />

                    {/* Group by */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-neutral-500">Group:</span>
                        <select
                            value={groupBy}
                            onChange={(e) => setGroupBy(e.target.value)}
                            className="bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs"
                        >
                            <option value="status">Status</option>
                            <option value="list">List</option>
                            <option value="priority">Priority</option>
                            <option value="assignee">Assignee</option>
                        </select>
                    </div>

                    <div className="h-4 w-px bg-neutral-700 mx-1" />

                    {/* Filters */}
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs"
                    >
                        {statusOptions.map(s => (
                            <option key={s.key} value={s.key}>{s.label}</option>
                        ))}
                    </select>

                    <select
                        value={filterPriority}
                        onChange={(e) => setFilterPriority(e.target.value)}
                        className="bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs"
                    >
                        <option value="all">All priorities</option>
                        {PRIORITIES.map(p => (
                            <option key={p.id} value={p.id}>{p.label}</option>
                        ))}
                    </select>

                    <select
                        value={filterAssignee}
                        onChange={(e) => setFilterAssignee(e.target.value)}
                        className="bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs"
                    >
                        <option value="all">Everyone</option>
                        <option value="me">Assigned to me</option>
                        <option value="unassigned">Unassigned</option>
                    </select>

                    <label className="flex items-center gap-1.5 text-xs text-neutral-400 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={showClosed}
                            onChange={(e) => setShowClosed(e.target.checked)}
                            className="rounded bg-neutral-800 border-neutral-600"
                        />
                        Closed
                    </label>

                    <div className="flex-1" />

                    {/* Search */}
                    <div className="relative">
                        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500" />
                        <input
                            type="text"
                            placeholder="Search tasks..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-neutral-900 border border-neutral-700 rounded pl-8 pr-3 py-1.5 text-xs w-48 focus:outline-none focus:border-purple-500"
                        />
                    </div>

                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs bg-neutral-800 text-neutral-300 hover:bg-neutral-700">
                        <Filter size={12} />
                        Filter
                    </button>
                </div>

                {/* Task List */}
                <div className="flex-1 overflow-auto">
                    {view === 'board' ? (
                        <BoardView
                            filteredGrouped={filteredGrouped}
                            statuses={statuses}
                            onStatusChange={updateTaskStatus}
                            onAssigneeChange={updateTaskAssignee}
                            onDelete={deleteTask}
                        />
                    ) : view === 'list' ? (
                    <>
                    {/* Column Headers */}
                    <div className="grid grid-cols-[10fr_1.5fr_1.5fr_1fr_1fr_1fr_1fr_0.8fr_1.2fr_32px] gap-2 px-4 py-2 border-b border-neutral-800 bg-neutral-900/50 text-[11px] uppercase tracking-wider text-neutral-500 sticky top-0 z-10 items-center">
                        <div className="">Name</div>
                        <div className="">Description</div>
                        <div className="">Comment</div>
                        <div className="">Assignee</div>
                        <div className="">Start date</div>
                        <div className="">Due date</div>
                        <div className="">Date done</div>
                        <div className="">Priority</div>
                        <div className="">Status</div>
                        <div className=""></div>
                    </div>

                    {/* Task Groups */}
                    {Object.entries(filteredGrouped).map(([key, group]) => {
                        const st = group.status;
                        const isOpen = expandedGroups[key] ?? true;
                        const count = group.tasks.length;
                        
                        return (
                            <div key={key} className="border-b border-neutral-800">
                                {/* Group Header */}
                                <button
                                    onClick={() => toggleGroup(key)}
                                    className="w-full flex items-center gap-2 px-4 py-2 bg-neutral-900/30 hover:bg-neutral-900/50 transition"
                                >
                                    {isOpen ? <ChevronDown size={14} className="text-neutral-500" /> : <ChevronRight size={14} className="text-neutral-500" />}
                                    <div 
                                        className="w-2.5 h-2.5 rounded-full"
                                        style={{ background: st.color || '#6b7280' }}
                                    />
                                    <span className="text-xs font-medium text-neutral-200">{st.label || key}</span>
                                    <span className="text-xs text-neutral-500 ml-1">{count}</span>
                                </button>

                                {/* Group Tasks */}
                                {isOpen && (
                                    <div>
                                        {group.tasks.map(task => (
                                            <TaskRow 
                                                key={task.id} 
                                                task={task} 
                                                statuses={statuses}
                                                onClick={() => router.push(route('tasks.show', task.id))}
                                                onStatusChange={(status) => updateTaskStatus(task.id, status)}
                                                onAssigneeChange={(uid) => updateTaskAssignee(task.id, uid)}
                                                onDueDateChange={(date) => updateTaskDueDate(task.id, date)}
                                                onStartDateChange={(date) => updateTaskStartDate(task.id, date)}
                                                onDelete={() => deleteTask(task.id)}
                                            />
                                        ))}
                                        {count === 0 && (
                                            <div className="px-4 py-3 text-xs text-neutral-500 italic">
                                                No tasks in this group
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {totalTasks === 0 && (
                        <div className="flex flex-col items-center justify-center py-16 text-neutral-500">
                            <CheckCircle2 size={48} className="mb-4 text-neutral-700" />
                            <p className="text-sm">No tasks found matching your filters</p>
                            <button 
                                onClick={() => {
                                    setFilterStatus('all');
                                    setFilterPriority('all');
                                    setFilterAssignee('all');
                                    setSearchQuery('');
                                }}
                                className="mt-2 text-xs text-purple-400 hover:text-purple-300"
                            >
                                Clear filters
                            </button>
                        </div>
                    )}
                    </>
                    ) : (
                        <div className="flex items-center justify-center h-full text-neutral-500 text-sm">
                            Calendar view coming soon
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
}

function formatDateForInput(dateStr) {
    if (!dateStr) return '';
    if (typeof dateStr === 'string' && dateStr.includes('T')) return dateStr.split('T')[0];
    return dateStr;
}

function TaskRow({ task, statuses, onClick, onStatusChange, onAssigneeChange, onDueDateChange, onStartDateChange, onDelete }) {
    const st = statuses.find(s => s.key === task.status) || { key: task.status, label: task.status, color: '#6b7280' };
    const hasSubtasks = (task.subtasks_count || 0) > 0;
    const [editing, setEditing] = useState(false);
    const [editValue, setEditValue] = useState(task.title);

    const handleSaveEdit = () => {
        if (editValue.trim() !== task.title) {
            router.put(route('tasks.update', task.id), { title: editValue.trim() }, { preserveScroll: true });
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

    // Update editValue when task.title changes from outside
    if (!editing && editValue !== task.title) {
        setEditValue(task.title);
    }

    return (
        <div className="grid grid-cols-[10fr_1.5fr_1.5fr_1fr_1fr_1fr_1fr_0.8fr_1.2fr_32px] gap-2 px-4 py-2.5 border-b border-neutral-800/60 hover:bg-neutral-800/40 group items-center relative">
            <div className="flex items-center gap-2 overflow-hidden">
                <span className="inline-block w-4 shrink-0" />
                <div 
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: st.color || '#6b7280' }}
                />
                {editing ? (
                    <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={handleSaveEdit}
                        onKeyDown={handleKeyDown}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 bg-neutral-800 border border-purple-500 rounded px-2 py-0.5 text-sm text-neutral-100 outline-none focus:ring-2 focus:ring-purple-500"
                        autoFocus
                    />
                ) : (
                    <div className="flex items-center gap-1 flex-1 min-w-0">
                        <Link
                            href={route('tasks.show', task.id)}
                            className="text-sm text-neutral-100 text-left hover:underline truncate leading-relaxed py-1"
                            title={task.title}
                        >
                            {task.title}
                        </Link>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                setEditing(true);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-0.5 text-neutral-400 hover:text-purple-400 transition shrink-0"
                            title="Edit task name"
                        >
                            <Edit3 size={12} />
                        </button>
                    </div>
                )}
                {hasSubtasks && (
                    <span className="text-[10px] text-neutral-500 bg-neutral-800 px-1.5 py-0.5 rounded shrink-0">
                        {task.subtasks_count}
                    </span>
                )}
            </div>
            <div
                onClick={() => {
                    // Open comment modal/popup
                    setActiveCommentTask(task);
                }}
                className="flex items-center gap-2 py-1 min-h-[1.5rem] cursor-pointer hover:text-neutral-300"
            >
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        handleCommentClick(task, e);
                    }}
                    className="relative p-1 text-neutral-400 hover:text-purple-400"
                    title="Comments"
                >
                    <MessageCircle size={14} />
                    {(task.comments_count || task.comments?.length || 0) > 0 && (
                        <span className="absolute -top-2 -right-2 w-5 h-5 bg-purple-600 text-white text-[10px] font-medium rounded-full flex items-center justify-center shadow-md border border-white">
                            {(task.comments_count || task.comments?.length || 0) > 99 ? '99+' : (task.comments_count || task.comments?.length || 0)}
                        </span>
                    )}
                </button>
            </div>
            <div className="relative">
                <AssigneePicker
                    assigned={task.assigned_to}
                    onChange={onAssigneeChange}
                />
            </div>
            <div className="text-xs text-neutral-400">
                <input
                    type="date"
                    value={formatDateForInput(task.start_date)}
                    onChange={(e) => onStartDateChange(e.target.value)}
                    className="bg-transparent border-none p-0 text-[11px] text-neutral-400 focus:ring-0 w-24 cursor-pointer hover:text-neutral-200"
                />
            </div>
            <div className="text-xs text-neutral-400">
                <input
                    type="date"
                    value={formatDateForInput(task.due_date)}
                    onChange={(e) => onDueDateChange(e.target.value)}
                    className={`bg-transparent border-none p-0 text-[11px] focus:ring-0 w-24 cursor-pointer hover:text-neutral-200 ${isOverdue(task.due_date) ? 'text-red-400' : 'text-neutral-400'}`}
                />
            </div>
            <div className="text-xs text-neutral-500 italic">
                {task.date_done ? formatDate(task.date_done) : '—'}
            </div>
            <div className="flex items-center gap-2 relative">
                <select
                    value={task.status}
                    onChange={(e) => onStatusChange(e.target.value)}
                    className="text-[10px] rounded px-2 py-0.5 border-none w-full max-w-[120px] cursor-pointer"
                    style={statusStyle(st.color || '#6b7280')}
                    onClick={(e) => e.stopPropagation()}
                >
                    {statuses.map(s => (
                        <option key={s.key} value={s.key} className="bg-neutral-800 text-neutral-100">
                            {s.label}
                        </option>
                    ))}
                </select>
            </div>
            <div className="">
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    className="text-neutral-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition"
                >
                    <Trash2 size={14} />
                </button>
            </div>
        </div>
    );
}

function BoardView({ filteredGrouped, statuses, onStatusChange, onAssigneeChange, onDelete }) {
    const groups = Object.entries(filteredGrouped);
    if (groups.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-neutral-500">
                <CheckCircle2 size={48} className="mb-4 text-neutral-700" />
                <p className="text-sm">No tasks to display</p>
            </div>
        );
    }
    return (
        <div className="flex gap-3 p-4 h-full overflow-x-auto">
            {groups.map(([key, group]) => {
                const st = group.status;
                const color = st?.color || '#6b7280';
                return (
                    <div key={key} className="flex-shrink-0 w-72 flex flex-col bg-neutral-900/40 rounded-lg border border-neutral-800">
                        <div className="px-3 py-2.5 border-b border-neutral-800 flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                            <span className="text-xs font-semibold text-neutral-200 uppercase tracking-wider">{st?.label || key}</span>
                            <span className="text-xs text-neutral-500 ml-auto">{group.tasks.length}</span>
                        </div>
                        <div className="flex-1 p-2 space-y-2 overflow-y-auto">
                            {group.tasks.map(task => (
                                <BoardCard
                                    key={task.id}
                                    task={task}
                                    statuses={statuses}
                                    onStatusChange={(s) => onStatusChange(task.id, s)}
                                    onAssigneeChange={(uid) => onAssigneeChange(task.id, uid)}
                                    onDelete={() => onDelete(task.id)}
                                />
                            ))}
                            {group.tasks.length === 0 && (
                                <div className="text-[11px] text-neutral-600 italic px-2 py-3 text-center">No tasks</div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function BoardCard({ task, statuses, onStatusChange, onAssigneeChange, onDelete }) {
    const st = statuses.find(s => s.key === task.status) || { key: task.status, label: task.status, color: '#6b7280' };
    return (
        <div className="group relative bg-neutral-900 hover:bg-neutral-800/80 border border-neutral-800 rounded-md p-2.5 transition">
            <div className="flex items-start justify-between gap-2 mb-1.5">
                <Link href={route('tasks.show', task.id)} className="text-sm text-neutral-100 hover:underline line-clamp-2 flex-1" title={task.title}>
                    {task.title}
                </Link>
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    className="text-neutral-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition flex-shrink-0"
                >
                    <Trash2 size={12} />
                </button>
            </div>
            {task.list?.name && (
                <div className="text-[10px] text-neutral-500 mb-1.5 truncate">{task.list.name}</div>
            )}
            <div className="flex items-center justify-between gap-2 mt-2">
                <select
                    value={task.status}
                    onChange={(e) => { e.stopPropagation(); onStatusChange(e.target.value); }}
                    onClick={(e) => e.stopPropagation()}
                    className="text-[10px] rounded px-1.5 py-0.5 border-none flex-1 max-w-[110px] truncate"
                    style={statusStyle(st.color || '#6b7280')}
                >
                    {statuses.map(s => (
                        <option key={s.key} value={s.key} className="bg-neutral-800 text-neutral-100">
                            {s.label}
                        </option>
                    ))}
                </select>
                <div className="flex items-center gap-1.5 ml-auto">
                    {task.priority && task.priority !== 'medium' && (
                        <span className="text-[10px]" title={task.priority}>{priorityFlag(task.priority)}</span>
                    )}
                    {task.due_date && (
                        <span className={`text-[10px] ${isOverdue(task.due_date) ? 'text-red-400' : 'text-neutral-400'}`}>
                            {formatDate(task.due_date)}
                        </span>
                    )}
                    <AssigneePicker
                        assigned={task.assigned_to}
                        onChange={onAssigneeChange}
                        compact
                    />
                </div>
            </div>
        </div>
    );
}

let _membersCache = null;
let _membersPromise = null;
function fetchMembers() {
    if (_membersCache) return Promise.resolve(_membersCache);
    if (_membersPromise) return _membersPromise;
    _membersPromise = axios.get(route('members.index'))
        .then(r => {
            _membersCache = r.data?.users || [];
            return _membersCache;
        })
        .finally(() => { _membersPromise = null; });
    return _membersPromise;
}

function AssigneePicker({ assigned, onChange, compact = false }) {
    const [open, setOpen] = useState(false);
    const [members, setMembers] = useState([]);
    const [search, setSearch] = useState('');
    const ref = useRef(null);

    useEffect(() => {
        if (!open) return;
        fetchMembers().then(setMembers).catch(() => setMembers([]));
        const onClickOutside = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', onClickOutside);
        return () => document.removeEventListener('mousedown', onClickOutside);
    }, [open]);

    const filtered = useMemo(() => {
        if (!search.trim()) return members;
        const q = search.toLowerCase();
        return members.filter(m => m.name?.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q));
    }, [members, search]);

    const handlePick = (e, userId) => {
        e.stopPropagation();
        setOpen(false);
        onChange?.(userId);
    };

    return (
        <div className="relative inline-block" ref={ref} onClick={(e) => e.stopPropagation()}>
            <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
                className={`flex items-center gap-1.5 hover:bg-neutral-800/60 rounded px-1.5 py-0.5 transition ${compact ? '' : 'max-w-full'}`}
                title={assigned?.name || 'Unassigned'}
            >
                {assigned ? (
                    <>
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                            {assigned.name.charAt(0).toUpperCase()}
                        </div>
                        {!compact && (
                            <span className="text-xs text-neutral-300 truncate">{assigned.name}</span>
                        )}
                    </>
                ) : (
                    <>
                        <div className="w-5 h-5 rounded-full border border-dashed border-neutral-600 flex items-center justify-center flex-shrink-0">
                            <User size={10} className="text-neutral-500" />
                        </div>
                        {!compact && <span className="text-xs text-neutral-500">Unassigned</span>}
                    </>
                )}
            </button>

            {open && (
                <div className="absolute z-50 mt-1 left-0 w-56 bg-neutral-900 border border-neutral-700 rounded-md shadow-xl overflow-hidden">
                    <div className="p-2 border-b border-neutral-800">
                        <div className="relative">
                            <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-neutral-500" />
                            <input
                                autoFocus
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search members..."
                                className="w-full bg-neutral-950 rounded pl-7 pr-2 py-1 text-xs focus:outline-none"
                            />
                        </div>
                    </div>
                    <div className="max-h-60 overflow-y-auto py-1">
                        <button
                            type="button"
                            onClick={(e) => handlePick(e, null)}
                            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-neutral-300 hover:bg-neutral-800"
                        >
                            <div className="w-5 h-5 rounded-full border border-dashed border-neutral-600 flex items-center justify-center">
                                <User size={10} className="text-neutral-500" />
                            </div>
                            Unassigned
                        </button>
                        {filtered.map(m => (
                            <button
                                key={m.id}
                                type="button"
                                onClick={(e) => handlePick(e, m.id)}
                                className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-neutral-800 ${assigned?.id === m.id ? 'text-purple-300 bg-neutral-800/40' : 'text-neutral-300'}`}
                            >
                                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-[10px] font-bold text-white">
                                    {m.name.charAt(0).toUpperCase()}
                                </div>
                                <span className="truncate">{m.name}</span>
                            </button>
                        ))}
                        {filtered.length === 0 && (
                            <div className="px-3 py-2 text-[11px] text-neutral-500 italic">No members found</div>
                        )}
                    </div>
                </div>
            )}
            
            {/* Comment Modal */}
            {activeCommentTask && (
                <CommentModal
                    task={activeCommentTask}
                    onClose={() => {
                        setActiveCommentTask(null);
                        setCommentModalPosition(null);
                    }}
                    onChanged={() => { router.reload(); }}
                    position={commentModalPosition}
                />
            )}
        </div>
    );
}

function isOverdue(dateStr) {
    if (!dateStr) return false;
    const today = new Date().toISOString().split('T')[0];
    return dateStr < today;
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
}
