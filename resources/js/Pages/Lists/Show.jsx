import { Link, router, useForm } from '@inertiajs/react';
import { useMemo, useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Sidebar from '@/Components/Sidebar';
import TaskDrawer from '@/Components/TaskDrawer';
import StatusManager from '@/Components/StatusManager';
import CommentModal from '@/Components/CommentModal';
import {
    RenameListModal,
    ColorIconModal,
    MoveListModal,
    ComingSoonModal,
} from '@/Components/Lists/ListActionModals';
import {
    LayoutList,
    Kanban,
    Calendar as CalendarIcon,
    Plus,
    ChevronDown,
    ChevronRight,
    Trash2,
    Settings,
    MoreVertical,
    Star,
    Edit3,
    Link as LinkIcon,
    Palette,
    Zap,
    LayoutTemplate,
    Archive,
    Copy,
    Move,
    Trash,
    Users,
    PlusCircle,
    Mail,
    FileText,
    Search,
    User,
    MessageCircle,
} from 'lucide-react';

const PRIORITIES = [
    { id: 'urgent', label: 'Urgent', color: '#ef4444' },
    { id: 'high', label: 'High', color: '#f97316' },
    { id: 'medium', label: 'Medium', color: '#eab308' },
    { id: 'low', label: 'Low', color: '#6b7280' },
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
    };
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
}

function isOverdue(dateStr) {
    if (!dateStr) return false;
    const today = new Date().toISOString().split('T')[0];
    return dateStr < today;
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
                        {!compact && <span className="text-xs text-neutral-500">—</span>}
                    </>
                )}
            </button>

            {open && (
                <div className="absolute z-50 mt-1 left-0 w-56 bg-neutral-900 border border-neutral-700 rounded-md shadow-xl overflow-hidden text-left">
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
        </div>
    );
}

function formatDateForInput(dateStr) {
    if (!dateStr) return '';
    if (typeof dateStr === 'string' && dateStr.includes('T')) return dateStr.split('T')[0];
    return dateStr;
}

export default function ListShow({ list, movableSpaces = [] }) {
    const statuses = list.statuses || [];
    const firstStatusKey = statuses[0]?.key || 'to_do';

    const [view, setView] = useState('list');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterPriority, setFilterPriority] = useState('all');
    const [showCreate, setShowCreate] = useState(false);
    const [expandedSubtasks, setExpandedSubtasks] = useState({});
    const [activeTaskId, setActiveTaskId] = useState(null);
    const [showStatusManager, setShowStatusManager] = useState(false);
    const [calendarMonth, setCalendarMonth] = useState(() => {
        const d = new Date();
        return new Date(d.getFullYear(), d.getMonth(), 1);
    });
    const [showListMenu, setShowListMenu] = useState(false);
    const [showMoreSubmenu, setShowMoreSubmenu] = useState(false);
    const [isFavorite, setIsFavorite] = useState(list.is_favorite || false);
    const [showRename, setShowRename] = useState(false);
    const [showColorIcon, setShowColorIcon] = useState(false);
    const [showMove, setShowMove] = useState(false);
    const [comingSoon, setComingSoon] = useState(null); // { title, description }
    const [copyHint, setCopyHint] = useState(false);
    const [collapsedGroups, setCollapsedGroups] = useState({});
    const [editingTaskId, setEditingTaskId] = useState(null);
    const [editingTaskTitle, setEditingTaskTitle] = useState('');
    const [activeCommentTask, setActiveCommentTask] = useState(null);
    const [commentModalPosition, setCommentModalPosition] = useState(null);

    // List actions
    const closeMenu = () => { setShowListMenu(false); setShowMoreSubmenu(false); };

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

    const toggleFavorite = () => {
        setIsFavorite((v) => !v); // optimistic
        router.post(route('lists.favorite', list.id), {}, {
            preserveScroll: true,
            preserveState: true,
        });
        closeMenu();
    };

    const copyLink = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            setCopyHint(true);
            setTimeout(() => setCopyHint(false), 1500);
        } catch {
            /* ignore */
        }
        closeMenu();
    };

    const duplicateList = () => {
        if (!confirm(`Duplicate list "${list.name}"?`)) return;
        router.post(route('lists.duplicate', list.id), {}, { preserveScroll: false });
        closeMenu();
    };

    const archiveList = () => {
        const archived = !!list.archived_at;
        if (!confirm(archived ? `Restore list "${list.name}"?` : `Archive list "${list.name}"?`)) return;
        router.post(route('lists.archive', list.id), {}, { preserveScroll: true });
        closeMenu();
    };

    const deleteList = () => {
        if (!confirm(`Delete list "${list.name}"? This cannot be undone.`)) return;
        router.delete(route('lists.destroy', list.id));
        closeMenu();
    };

    const showComingSoon = (title, description) => {
        closeMenu();
        setComingSoon({ title, description });
    };

    const { data, setData, post, processing, reset, errors } = useForm({
        title: '',
        description: '',
        status: firstStatusKey,
        priority: 'medium',
        start_date: '',
        due_date: '',
        space_id: list.space_id,
        task_list_id: list.id,
        parent_task_id: null,
    });

    const menuRef = useRef(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowListMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const tasks = useMemo(() => {
        return (list.tasks || []).filter((t) => {
            if (filterStatus !== 'all' && t.status !== filterStatus) return false;
            if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
            return true;
        });
    }, [list.tasks, filterStatus, filterPriority]);

    const submit = (e) => {
        e.preventDefault();
        post(route('tasks.store'), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                setData('task_list_id', list.id);
                setData('space_id', list.space_id);
                setData('status', firstStatusKey);
                setShowCreate(false);
            },
        });
    };

    const updateStatus = (taskId, statusKey) => {
        const task = list.tasks.find(t => t.id === taskId);
        let date_done = task?.date_done;
        
        // Auto date_done logic
        const statusObj = statuses.find(s => s.key === statusKey);
        if (statusObj?.type === 'closed') {
            date_done = new Date().toISOString().split('T')[0];
        } else if (statusObj) {
            date_done = null;
        }

        router.put(route('tasks.update', taskId), { 
            status: statusKey,
            date_done: date_done 
        }, { preserveScroll: true });
    };

    const updateTitle = (taskId, title) => {
        router.put(route('tasks.update', taskId), { title }, { preserveScroll: true });
    };

    const startEditingTask = (taskId, currentTitle) => {
        setEditingTaskId(taskId);
        setEditingTaskTitle(currentTitle);
    };

    const saveTaskEdit = () => {
        if (editingTaskId && editingTaskTitle.trim()) {
            updateTitle(editingTaskId, editingTaskTitle.trim());
        }
        setEditingTaskId(null);
        setEditingTaskTitle('');
    };

    const cancelTaskEdit = () => {
        setEditingTaskId(null);
        setEditingTaskTitle('');
    };

    const handleTaskEditKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            saveTaskEdit();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            cancelTaskEdit();
        }
    };

    const updateDescription = (taskId, description) => {
        router.put(route('tasks.update', taskId), { description }, { preserveScroll: true });
    };

    const updateAssignee = (taskId, assigned_to) => {
        router.put(route('tasks.update', taskId), { assigned_to }, { preserveScroll: true });
    };

    const updateDueDate = (taskId, due_date) => {
        router.put(route('tasks.update', taskId), { due_date }, { preserveScroll: true });
    };

    const updateStartDate = (taskId, start_date) => {
        router.put(route('tasks.update', taskId), { start_date }, { preserveScroll: true });
    };

    const deleteTask = (taskId) => {
        if (confirm('Delete this task?')) {
            router.delete(route('tasks.destroy', taskId), { preserveScroll: true });
        }
    };

    const toggleSubtasks = (taskId) =>
        setExpandedSubtasks((s) => ({ ...s, [taskId]: !s[taskId] }));

    const findStatus = (key) => statuses.find((s) => s.key === key);

    /* ---------- LIST VIEW ---------- */
    const renderListView = () => {
        const sortedStatuses = [...statuses].sort((a, b) => {
            const order = { completed: 0, in_progress: 1 };
            const aOrder = order[a.key] ?? 999;
            const bOrder = order[b.key] ?? 999;
            if (aOrder !== bOrder) return aOrder - bOrder;
            return statuses.indexOf(a) - statuses.indexOf(b);
        });
        const groups = sortedStatuses.map((s) => ({ key: s.key, label: s.label, color: s.color, items: tasks.filter((t) => t.status === s.key) }));
        const hasAny = tasks.length > 0;
        return (
            <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                    <div className="min-w-[980px]">
                        <div className="grid grid-cols-[3fr_1.2fr_1.5fr_1fr_1fr_1fr_1fr_1.5fr_32px] gap-2 px-4 py-2 bg-neutral-900 border-b border-neutral-800 text-[11px] uppercase tracking-wider text-neutral-500 items-center">
                            <div className="">Name</div>
                            <div className="">Status</div>
                            <div className="">Latest Comment</div>
                            <div className="">Assignee</div>
                            <div className="">Start date</div>
                            <div className="">Due date</div>
                            <div className="">Date done</div>
                            <div className=""></div>
                        </div>
                        {!hasAny && (
                            <div className="px-4 py-8 text-center text-neutral-500 text-sm">No tasks. Click "+ Task" to add one.</div>
                        )}
                        {groups.map(({ key, label, color, items }) => (
                            <div key={key} className="mt-2 first:mt-0">
                                <div className="px-4 py-2 bg-neutral-900/70 border-b border-neutral-800 flex items-center gap-2" style={{ borderTop: `2px solid ${color}` }}>
                                    <button
                                        onClick={() => setCollapsedGroups((g) => ({ ...g, [key]: !g[key] }))}
                                        className="text-neutral-500 hover:text-white"
                                        title="Toggle group"
                                    >
                                        {collapsedGroups[key] ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                                    </button>
                                    <span className="px-2 py-0.5 rounded text-[11px]" style={statusStyle(color)}>{label}</span>
                                    <span className="text-xs text-neutral-500">{items.length}</span>
                                </div>
                                {!collapsedGroups[key] && items.map((task) => {
                                    const st = findStatus(task.status);
                                    return (
                                        <div key={task.id}>
                                            <div className="grid grid-cols-[3fr_1.2fr_1.5fr_1fr_1fr_1fr_1fr_1.5fr_32px] gap-2 px-4 py-2.5 border-b border-neutral-800/60 hover:bg-neutral-800/40 group items-center relative">
                                                <div className="flex items-center gap-2 overflow-hidden">
                                                    <button
                                                        onClick={() => toggleSubtasks(task.id)}
                                                        className="text-neutral-500 hover:text-white shrink-0"
                                                        title="Toggle subtasks"
                                                    >
                                                        {(task.subtasks || []).length > 0 ? (
                                                            expandedSubtasks[task.id] ? (
                                                                <ChevronDown size={14} />
                                                            ) : (
                                                                <ChevronRight size={14} />
                                                            )
                                                        ) : (
                                                            <span className="inline-block w-3.5" />
                                                        )}
                                                    </button>
                                                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: st?.color || '#6b7280' }} />
                                                    {editingTaskId === task.id ? (
                                                        <input
                                                            type="text"
                                                            value={editingTaskTitle}
                                                            onChange={(e) => setEditingTaskTitle(e.target.value)}
                                                            onBlur={saveTaskEdit}
                                                            onKeyDown={handleTaskEditKeyDown}
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="flex-1 bg-neutral-800 border border-purple-500 rounded px-2 py-0.5 text-sm outline-none focus:ring-2 focus:ring-purple-500"
                                                            autoFocus
                                                        />
                                                    ) : (
                                                        <div className="flex items-center gap-1 flex-1 min-w-0">
                                                            <div onClick={() => setActiveTaskId(task.id)} className={`text-sm cursor-pointer flex-1 py-1 ${task.date_done ? 'text-neutral-500' : 'text-neutral-100 hover:text-purple-400'} truncate leading-relaxed`} title={task.title}>
                                                                {task.title}
                                                            </div>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    startEditingTask(task.id, task.title);
                                                                }}
                                                                className="opacity-0 group-hover:opacity-100 p-0.5 text-neutral-400 hover:text-purple-400 transition shrink-0"
                                                                title="Edit task name"
                                                            >
                                                                <Edit3 size={12} />
                                                            </button>
                                                        </div>
                                                    )}
                                                    {(task.subtasks || []).length > 0 && (
                                                        <span className="text-[10px] text-neutral-500 bg-neutral-800 px-1.5 py-0.5 rounded shrink-0">{task.subtasks.length}</span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 relative">
                                                    <select value={task.status} onChange={(e) => updateStatus(task.id, e.target.value)} className="text-[10px] rounded px-2 py-0.5 border-none w-full max-w-[120px] cursor-pointer" style={statusStyle(st?.color || '#6b7280')}>
                                                        {statuses.map((s) => (
                                                            <option key={s.id} value={s.key} className="bg-neutral-800 text-neutral-100">{s.label}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="flex items-center gap-2 py-1 min-h-[1.5rem]">
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
                                                    <AssigneePicker assigned={task.assigned_to} onChange={(uid) => updateAssignee(task.id, uid)} compact />
                                                </div>
                                                <div className="text-xs text-neutral-400">
                                                    <input type="date" value={formatDateForInput(task.start_date)} onChange={(e) => updateStartDate(task.id, e.target.value)} className="bg-transparent border-none p-0 text-[11px] text-neutral-400 focus:ring-0 w-24 cursor-pointer hover:text-neutral-200" />
                                                </div>
                                                <div className="text-xs text-neutral-400">
                                                    <input type="date" value={formatDateForInput(task.due_date)} onChange={(e) => updateDueDate(task.id, e.target.value)} className={`bg-transparent border-none p-0 text-[11px] focus:ring-0 w-24 cursor-pointer hover:text-neutral-200 ${isOverdue(task.due_date) ? 'text-red-400' : 'text-neutral-400'}`} />
                                                </div>
                                                <div className="text-xs text-neutral-500 italic">{task.date_done ? formatDate(task.date_done) : '—'}</div>
                                                <div className="">
                                                    <button onClick={() => deleteTask(task.id)} className="text-neutral-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                            {expandedSubtasks[task.id] && (task.subtasks || []).map((sub) => {
                                                const subSt = findStatus(sub.status);
                                                return (
                                                    <div key={sub.id} className="grid grid-cols-[3fr_1.2fr_1.5fr_1fr_1fr_1fr_1fr_1.5fr_32px] gap-2 px-4 py-2 pl-12 border-b border-neutral-800/60 hover:bg-neutral-800/30 items-center relative">
                                                        <div className="flex items-center gap-2 overflow-hidden text-neutral-300">
                                                            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: subSt?.color || '#6b7280' }} />
                                                            {editingTaskId === sub.id ? (
                                                                <input
                                                                    type="text"
                                                                    value={editingTaskTitle}
                                                                    onChange={(e) => setEditingTaskTitle(e.target.value)}
                                                                    onBlur={saveTaskEdit}
                                                                    onKeyDown={handleTaskEditKeyDown}
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    className="flex-1 bg-neutral-800 border border-purple-500 rounded px-2 py-0.5 text-sm outline-none focus:ring-2 focus:ring-purple-500"
                                                                    autoFocus
                                                                />
                                                            ) : (
                                                                <div className="flex items-center gap-1 flex-1 min-w-0">
                                                                    <div onClick={() => setActiveTaskId(sub.id)} className={`text-sm cursor-pointer flex-1 py-1 ${sub.date_done ? 'text-neutral-500' : 'text-neutral-300 hover:text-purple-400'} truncate leading-relaxed`} title={sub.title}>
                                                                        {sub.title}
                                                                    </div>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            startEditingTask(sub.id, sub.title);
                                                                        }}
                                                                        className="opacity-0 group-hover:opacity-100 p-0.5 text-neutral-400 hover:text-purple-400 transition shrink-0"
                                                                        title="Edit task name"
                                                                    >
                                                                        <Edit3 size={12} />
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="">
                                                            <select value={sub.status} onChange={(e) => updateStatus(sub.id, e.target.value)} className="text-[10px] rounded px-2 py-0.5 border-none w-full max-w-[120px] cursor-pointer" style={statusStyle(subSt?.color || '#6b7280')}>
                                                                {statuses.map((s) => (
                                                                    <option key={s.id} value={s.key} className="bg-neutral-800">{s.label}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                        <div className="flex items-center gap-2 py-1 min-h-[1.25rem]">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleCommentClick(sub, e);
                                                                }}
                                                                className="relative p-1 text-neutral-400 hover:text-purple-400"
                                                                title="Comments"
                                                            >
                                                                <MessageCircle size={14} />
                                                                {(sub.comments_count || sub.comments?.length || 0) > 0 && (
                                                                    <span className="absolute -top-2 -right-2 w-5 h-5 bg-purple-600 text-white text-[10px] font-medium rounded-full flex items-center justify-center shadow-md border border-white">
                                                                        {(sub.comments_count || sub.comments?.length || 0) > 99 ? '99+' : (sub.comments_count || sub.comments?.length || 0)}
                                                                    </span>
                                                                )}
                                                            </button>
                                                        </div>
                                                        <div className="">
                                                            <AssigneePicker assigned={sub.assigned_to} onChange={(uid) => updateAssignee(sub.id, uid)} compact />
                                                        </div>
                                                        <div className="text-xs text-neutral-500">
                                                            <input type="date" value={formatDateForInput(sub.start_date)} onChange={(e) => updateStartDate(sub.id, e.target.value)} className="bg-transparent border-none p-0 text-[11px] text-neutral-500 focus:ring-0 w-24 cursor-pointer hover:text-neutral-300" />
                                                        </div>
                                                        <div className="text-xs text-neutral-500">
                                                            <input type="date" value={formatDateForInput(sub.due_date)} onChange={(e) => updateDueDate(sub.id, e.target.value)} className={`bg-transparent border-none p-0 text-[11px] focus:ring-0 w-24 cursor-pointer hover:text-neutral-300 ${isOverdue(sub.due_date) ? 'text-red-400' : 'text-neutral-500'}`} />
                                                        </div>
                                                        <div className="text-xs text-neutral-500 italic">{sub.date_done ? formatDate(sub.date_done) : '—'}</div>
                                                        <div className=""></div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                })}
                                <button
                                    onClick={() => {
                                        setData('status', key);
                                        setShowCreate(true);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-neutral-500 hover:text-white hover:bg-neutral-800/40 flex items-center gap-2"
                                >
                                    <Plus size={14} /> Add Task
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="md:hidden px-3 py-1.5 text-[11px] text-neutral-500 border-t border-neutral-800">Swipe left / right to view all columns</div>
            </div>
        );
    };

    /* ---------- BOARD VIEW ---------- */
    const renderBoardView = () => (
        <div className="flex gap-4 overflow-x-auto pb-4">
            {statuses.map((column) => {
                const columnTasks = tasks.filter((t) => t.status === column.key);
                return (
                    <div
                        key={column.id}
                        className="w-72 flex-shrink-0 bg-neutral-900 rounded-lg border border-neutral-800"
                    >
                        <div className="px-3 py-2 flex items-center justify-between border-b border-neutral-800">
                            <div className="flex items-center gap-2">
                                <span
                                    className="px-2 py-0.5 rounded text-[11px]"
                                    style={statusStyle(column.color)}
                                >
                                    {column.label}
                                </span>
                                <span className="text-xs text-neutral-500">{columnTasks.length}</span>
                            </div>
                            <Plus
                                size={14}
                                className="text-neutral-500 hover:text-white cursor-pointer"
                                onClick={() => {
                                    setData('status', column.key);
                                    setShowCreate(true);
                                }}
                            />
                        </div>
                        <div className="p-2 space-y-2 min-h-[100px]">
                            {columnTasks.map((task) => (
                                <div
                                    key={task.id}
                                    onClick={() => setActiveTaskId(task.id)}
                                    className="bg-neutral-800/60 hover:bg-neutral-800 rounded-md p-3 border border-neutral-800 cursor-pointer"
                                >
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <span className="text-sm font-medium text-neutral-100">
                                            {task.title}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-[11px] text-neutral-500">
                                        <span>{task.due_date || ''}</span>
                                        <span>{task.assigned_to?.name || ''}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );

    /* ---------- CALENDAR VIEW ---------- */
    const renderCalendarView = () => {
        const year = calendarMonth.getFullYear();
        const month = calendarMonth.getMonth();
        const firstDay = new Date(year, month, 1);
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const startWeekday = (firstDay.getDay() + 6) % 7; // make Monday first

        const cells = [];
        for (let i = 0; i < startWeekday; i++) cells.push(null);
        for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
        while (cells.length % 7 !== 0) cells.push(null);

        const tasksByDay = tasks.reduce((acc, t) => {
            if (!t.due_date) return acc;
            const k = t.due_date;
            (acc[k] ||= []).push(t);
            return acc;
        }, {});

        const todayStr = new Date().toISOString().slice(0, 10);
        const monthLabel = calendarMonth.toLocaleString('default', {
            month: 'long',
            year: 'numeric',
        });

        const move = (delta) =>
            setCalendarMonth(new Date(year, month + delta, 1));

        return (
            <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
                <div className="px-4 py-3 flex items-center justify-between border-b border-neutral-800">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => move(-1)}
                            className="px-2 py-1 rounded hover:bg-neutral-800 text-neutral-400"
                        >
                            ‹
                        </button>
                        <span className="text-sm font-semibold w-32 text-center">{monthLabel}</span>
                        <button
                            onClick={() => move(1)}
                            className="px-2 py-1 rounded hover:bg-neutral-800 text-neutral-400"
                        >
                            ›
                        </button>
                    </div>
                    <button
                        onClick={() => {
                            const d = new Date();
                            setCalendarMonth(new Date(d.getFullYear(), d.getMonth(), 1));
                        }}
                        className="text-xs text-neutral-400 hover:text-white"
                    >
                        Today
                    </button>
                </div>
                <div className="grid grid-cols-7 text-[11px] text-neutral-500 uppercase border-b border-neutral-800">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                        <div key={d} className="px-2 py-1.5 text-center">
                            {d}
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-7">
                    {cells.map((day, idx) => {
                        if (!day) return <div key={idx} className="h-28 bg-neutral-950/40 border border-neutral-800/50" />;
                        const k = day.toISOString().slice(0, 10);
                        const dayTasks = tasksByDay[k] || [];
                        const isToday = k === todayStr;
                        return (
                            <div
                                key={idx}
                                className="h-28 border border-neutral-800/50 p-1.5 overflow-hidden"
                            >
                                <div
                                    className={`text-[11px] mb-1 ${
                                        isToday
                                            ? 'inline-flex items-center justify-center w-6 h-6 rounded-full bg-purple-600 text-white font-semibold'
                                            : 'text-neutral-500'
                                    }`}
                                >
                                    {day.getDate()}
                                </div>
                                <div className="space-y-1">
                                    {dayTasks.slice(0, 3).map((t) => {
                                        const st = findStatus(t.status);
                                        return (
                                            <button
                                                key={t.id}
                                                onClick={() => setActiveTaskId(t.id)}
                                                className="w-full text-left px-1.5 py-0.5 rounded text-[11px] truncate hover:opacity-80"
                                                style={statusStyle(st?.color || '#6b7280')}
                                            >
                                                {t.title}
                                            </button>
                                        );
                                    })}
                                    {dayTasks.length > 3 && (
                                        <div className="text-[10px] text-neutral-500">
                                            +{dayTasks.length - 3} more
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="flex h-screen bg-neutral-950 text-neutral-100 overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Breadcrumb */}
                <div className="px-3 md:px-6 py-3 border-b border-neutral-800 flex items-center gap-2 text-sm pl-12 md:pl-6">
                    <Link
                        href={route('spaces.show', list.space_id)}
                        className="text-neutral-400 hover:text-white"
                    >
                        {list.space?.name || 'Space'}
                    </Link>
                    {list.folder && (
                        <>
                            <span className="text-neutral-600">/</span>
                            <span className="text-neutral-400">{list.folder.name}</span>
                        </>
                    )}
                    <span className="text-neutral-600">/</span>
                    <span className="text-white font-semibold">{list.name}</span>

                    {/* List Menu Button */}
                    <div ref={menuRef} className="relative ml-2">
                        <button
                            onClick={() => setShowListMenu(!showListMenu)}
                            className="p-1 text-neutral-500 hover:text-white hover:bg-neutral-800 rounded transition"
                            title="List options"
                        >
                            <MoreVertical size={16} />
                        </button>

                        {/* List Context Menu */}
                        {showListMenu && (
                            <div className="absolute top-full left-0 mt-1 w-64 bg-neutral-900 border border-neutral-800 rounded-lg shadow-xl z-50 py-1">
                                {/* Section 1: Quick Actions */}
                                <button
                                    onClick={toggleFavorite}
                                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-800 transition"
                                >
                                    <Star size={14} className={isFavorite ? 'text-yellow-500 fill-yellow-500' : ''} />
                                    <span>{isFavorite ? 'Unfavorite' : 'Favorite'}</span>
                                </button>
                                <button
                                    onClick={() => { closeMenu(); setShowRename(true); }}
                                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-800 transition"
                                >
                                    <Edit3 size={14} />
                                    <span>Rename</span>
                                </button>
                                <button
                                    onClick={copyLink}
                                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-800 transition"
                                >
                                    <LinkIcon size={14} />
                                    <span>{copyHint ? 'Link copied!' : 'Copy link'}</span>
                                </button>

                                <div className="border-t border-neutral-800 my-1" />

                                {/* Section 2: Create & Customize */}
                                <div className="px-4 py-1.5 text-xs text-neutral-500 uppercase tracking-wider">Create new</div>
                                <button
                                    onClick={() => { setShowListMenu(false); setShowCreate(true); }}
                                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-800 transition"
                                >
                                    <PlusCircle size={14} />
                                    <span>Task</span>
                                    <ChevronRight size={14} className="ml-auto text-neutral-500" />
                                </button>

                                <div className="border-t border-neutral-800 my-1" />

                                <button
                                    onClick={() => { closeMenu(); setShowColorIcon(true); }}
                                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-800 transition"
                                >
                                    <Palette size={14} />
                                    <span>Color & icon</span>
                                </button>
                                <button
                                    onClick={() => showComingSoon('Automations', 'Run actions automatically when tasks change status, dates, or assignees.')}
                                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-800 transition"
                                >
                                    <Zap size={14} />
                                    <span>Automations</span>
                                </button>
                                <button
                                    onClick={() => showComingSoon('Custom fields', 'Add additional task fields like dropdowns, numbers, ratings, and more.')}
                                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-800 transition"
                                >
                                    <LayoutTemplate size={14} />
                                    <span>Custom fields</span>
                                </button>
                                <button
                                    onClick={() => { setShowListMenu(false); setShowStatusManager(true); }}
                                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-800 transition"
                                >
                                    <LayoutList size={14} />
                                    <span>Task statuses</span>
                                </button>

                                <div className="border-t border-neutral-800 my-1" />

                                {/* Section 3: More - Expandable Submenu */}
                                <div className="relative">
                                    <button
                                        onClick={() => setShowMoreSubmenu(!showMoreSubmenu)}
                                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-800 transition"
                                    >
                                        <MoreVertical size={14} />
                                        <span>More</span>
                                        <ChevronRight size={14} className={`ml-auto text-neutral-500 transition-transform ${showMoreSubmenu ? 'rotate-90' : ''}`} />
                                    </button>

                                    {/* More Submenu */}
                                    {showMoreSubmenu && (
                                        <div className="mx-2 mt-1 mb-2 bg-neutral-950/50 rounded-md overflow-hidden">
                                            {/* List Info Section */}
                                            <div className="px-3 py-1.5 text-xs text-neutral-500 uppercase tracking-wider">List Info</div>
                                            <button
                                                onClick={() => showComingSoon('Default task type', 'Choose what type new tasks created in this list will be (Task, Milestone, etc.).')}
                                                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-800 transition pl-6"
                                            >
                                                <FileText size={14} />
                                                <span>Default task type</span>
                                            </button>
                                            <button
                                                onClick={() => showComingSoon('Email to List', 'Forward emails to a unique address to create tasks automatically.')}
                                                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-800 transition pl-6"
                                            >
                                                <Mail size={14} />
                                                <span>Email to List</span>
                                            </button>

                                            <div className="border-t border-neutral-800/50 my-1" />

                                            {/* Imports */}
                                            <button
                                                onClick={() => showComingSoon('Imports', 'Import tasks from CSV, Trello, Asana, and more.')}
                                                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-800 transition pl-6"
                                            >
                                                <Plus size={14} />
                                                <span>Imports</span>
                                            </button>

                                            {/* Templates */}
                                            <button
                                                onClick={() => showComingSoon('Templates', 'Save and re-use list templates to spin up projects faster.')}
                                                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-800 transition pl-6"
                                            >
                                                <LayoutTemplate size={14} />
                                                <span>Templates</span>
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="border-t border-neutral-800 my-1" />

                                {/* Section 4: Move & Duplicate */}
                                <button
                                    onClick={() => { closeMenu(); setShowMove(true); }}
                                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-800 transition"
                                >
                                    <Move size={14} />
                                    <span>Move</span>
                                </button>
                                <button
                                    onClick={duplicateList}
                                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-800 transition"
                                >
                                    <Copy size={14} />
                                    <span>Duplicate</span>
                                </button>

                                <div className="border-t border-neutral-800 my-1" />

                                {/* Section 5: Archive & Delete */}
                                <button
                                    onClick={archiveList}
                                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-800 transition"
                                >
                                    <Archive size={14} />
                                    <span>{list.archived_at ? 'Restore from archive' : 'Archive'}</span>
                                </button>
                                <button
                                    onClick={deleteList}
                                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-neutral-800 transition"
                                >
                                    <Trash size={14} />
                                    <span>Delete</span>
                                </button>

                                <div className="border-t border-neutral-800 my-1" />

                                {/* Section 6: Sharing */}
                                <button
                                    onClick={() => showComingSoon('Sharing & Permissions', 'Invite teammates and configure who can view or edit this list.')}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-purple-600 hover:bg-purple-500 rounded-md mx-2 mt-1 mb-2"
                                >
                                    <Users size={14} />
                                    <span>Sharing & Permissions</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Toolbar */}
                <div className="px-3 md:px-6 py-3 border-b border-neutral-800 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div className="flex items-center gap-1 overflow-x-auto no-scrollbar w-full md:w-auto">
                        {[
                            { id: 'list', label: 'List', icon: LayoutList },
                            { id: 'board', label: 'Board', icon: Kanban },
                            { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
                        ].map(({ id, label, icon: Icon }) => (
                            <button
                                key={id}
                                onClick={() => setView(id)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm ${
                                    view === id
                                        ? 'bg-neutral-800 text-white'
                                        : 'text-neutral-400 hover:text-white'
                                }`}
                            >
                                <Icon size={14} /> {label}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full md:w-auto">
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="bg-neutral-900 text-xs rounded-md px-2 py-1.5 focus:bg-neutral-800"
                        >
                            <option value="all">All status</option>
                            {statuses.map((s) => (
                                <option key={s.id} value={s.key}>
                                    {s.label}
                                </option>
                            ))}
                        </select>
                        <select
                            value={filterPriority}
                            onChange={(e) => setFilterPriority(e.target.value)}
                            className="bg-neutral-900 text-xs rounded-md px-2 py-1.5 focus:bg-neutral-800"
                        >
                            <option value="all">All priority</option>
                            {PRIORITIES.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.label}
                                </option>
                            ))}
                        </select>
                        <button
                            onClick={() => setShowStatusManager(true)}
                            className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-sm text-neutral-400 hover:text-white"
                            title="Manage statuses"
                        >
                            <Settings size={14} />
                        </button>
                        <button
                            onClick={() => setShowCreate(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm bg-purple-600 hover:bg-purple-500 text-white"
                        >
                            <Plus size={14} /> Task
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-auto p-3 md:p-6">
                    {view === 'list' && renderListView()}
                    {view === 'board' && renderBoardView()}
                    {view === 'calendar' && renderCalendarView()}
                </div>

                {/* Task drawer */}
                {activeTaskId && (
                    <TaskDrawer
                        taskId={activeTaskId}
                        statuses={statuses}
                        onClose={() => {
                            setActiveTaskId(null);
                            router.reload({ only: ['list'] });
                        }}
                        onChanged={() => router.reload({ only: ['list'] })}
                    />
                )}

                {/* Status manager drawer */}
                {showStatusManager && (
                    <StatusManager list={list} onClose={() => setShowStatusManager(false)} />
                )}

                {/* Create modal */}
                {showCreate && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="bg-neutral-900 border border-neutral-800 rounded-xl w-[480px] p-6 shadow-2xl">
                            <h3 className="text-lg font-semibold mb-4">New task</h3>
                            <form onSubmit={submit} className="space-y-3">
                                <div>
                                    <label className="block text-xs text-neutral-400 mb-1">Title</label>
                                    <input
                                        autoFocus
                                        type="text"
                                        value={data.title}
                                        onChange={(e) => setData('title', e.target.value)}
                                        required
                                        className="w-full bg-neutral-950 border border-neutral-800 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
                                    />
                                    {errors.title && <div className="text-xs text-red-400 mt-1">{errors.title}</div>}
                                </div>
                                <div>
                                    <label className="block text-xs text-neutral-400 mb-1">Description</label>
                                    <textarea
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        rows={3}
                                        className="w-full bg-neutral-950 border border-neutral-800 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs text-neutral-400 mb-1">Status</label>
                                        <select
                                            value={data.status}
                                            onChange={(e) => setData('status', e.target.value)}
                                            className="w-full bg-neutral-950 border border-neutral-800 rounded-md px-3 py-2 text-sm"
                                        >
                                            {statuses.map((s) => (
                                                <option key={s.id} value={s.key}>
                                                    {s.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-neutral-400 mb-1">Priority</label>
                                        <select
                                            value={data.priority}
                                            onChange={(e) => setData('priority', e.target.value)}
                                            className="w-full bg-neutral-950 border border-neutral-800 rounded-md px-3 py-2 text-sm"
                                        >
                                            {PRIORITIES.map((p) => (
                                                <option key={p.id} value={p.id}>
                                                    {p.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs text-neutral-400 mb-1">Start</label>
                                        <input
                                            type="date"
                                            value={data.start_date}
                                            onChange={(e) => setData('start_date', e.target.value)}
                                            className="w-full bg-neutral-950 border border-neutral-800 rounded-md px-3 py-2 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-neutral-400 mb-1">Due</label>
                                        <input
                                            type="date"
                                            value={data.due_date}
                                            onChange={(e) => setData('due_date', e.target.value)}
                                            className="w-full bg-neutral-950 border border-neutral-800 rounded-md px-3 py-2 text-sm"
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center justify-end gap-2 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowCreate(false)}
                                        className="px-3 py-2 text-sm text-neutral-300 hover:text-white"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="px-4 py-2 text-sm rounded-md bg-purple-600 hover:bg-purple-500 disabled:opacity-50"
                                    >
                                        Create task
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>

            {/* List action modals */}
            {showRename && (
                <RenameListModal list={list} onClose={() => setShowRename(false)} />
            )}
            {showColorIcon && (
                <ColorIconModal list={list} onClose={() => setShowColorIcon(false)} />
            )}
            {showMove && (
                <MoveListModal
                    list={list}
                    spaces={movableSpaces}
                    onClose={() => setShowMove(false)}
                />
            )}
            {comingSoon && (
                <ComingSoonModal
                    title={comingSoon.title}
                    description={comingSoon.description}
                    onClose={() => setComingSoon(null)}
                />
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
