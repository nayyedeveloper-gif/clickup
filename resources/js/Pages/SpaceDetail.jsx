import { Head, Link, router, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import HomeShell from '@/Components/HomeShell';
import {
    Folder as FolderIcon,
    List as ListIcon,
    Plus,
    X,
    Trash2,
    Edit3,
    ArrowLeft,
    LayoutGrid,
    LayoutList,
    Layers,
    Kanban,
    Filter,
    RefreshCw,
    Sliders,
    Bookmark,
    FileText,
    Clock,
    Calendar,
    Flag,
    User as UserIcon,
} from 'lucide-react';

/* ---------- Inline forms ---------- */

function NewListForm({ spaceId, folderId = null, onDone }) {
    const { data, setData, post, processing, reset, errors } = useForm({
        name: '',
        space_id: spaceId,
        folder_id: folderId,
    });
    const submit = (e) => {
        e.preventDefault();
        post(route('lists.store'), {
            preserveScroll: true,
            onSuccess: () => { reset(); onDone(); },
        });
    };
    return (
        <form
            onSubmit={submit}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800"
        >
            <ListIcon size={14} className="text-neutral-400 shrink-0" />
            <input
                autoFocus
                value={data.name}
                onChange={(e) => setData('name', e.target.value)}
                placeholder="List name"
                className="flex-1 bg-transparent text-sm text-white outline-none"
                required
            />
            {errors.name && <span className="text-xs text-red-400">{errors.name}</span>}
            <button
                type="submit"
                disabled={processing}
                className="h-7 px-3 text-xs font-medium rounded-md bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-50"
            >
                Create
            </button>
            <button type="button" onClick={onDone} className="text-neutral-500 hover:text-white">
                <X size={14} />
            </button>
        </form>
    );
}

function NewFolderForm({ spaceId, onDone }) {
    const { data, setData, post, processing, reset, errors } = useForm({ name: '' });
    const submit = (e) => {
        e.preventDefault();
        post(route('folders.store', spaceId), {
            preserveScroll: true,
            onSuccess: () => { reset(); onDone(); },
        });
    };
    return (
        <form
            onSubmit={submit}
            className="flex items-center gap-2 p-3 rounded-lg bg-neutral-900 border border-neutral-800"
        >
            <FolderIcon size={16} className="text-amber-400 shrink-0" />
            <input
                autoFocus
                value={data.name}
                onChange={(e) => setData('name', e.target.value)}
                placeholder="Folder name"
                className="flex-1 bg-transparent text-sm text-white outline-none"
                required
            />
            {errors.name && <span className="text-xs text-red-400">{errors.name}</span>}
            <button
                type="submit"
                disabled={processing}
                className="h-7 px-3 text-xs font-medium rounded-md bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-50"
            >
                Create
            </button>
            <button type="button" onClick={onDone} className="text-neutral-500 hover:text-white">
                <X size={14} />
            </button>
        </form>
    );
}

const SPACE_COLORS = [
    '#7c3aed', // Purple
    '#ec4899', // Pink
    '#ef4444', // Red
    '#f97316', // Orange
    '#eab308', // Yellow
    '#22c55e', // Green
    '#06b6d4', // Cyan
    '#3b82f6', // Blue
    '#6366f1', // Indigo
    '#64748b', // Slate
];

function RenameModal({ entity, label, routeName, onClose }) {
    const { data, setData, put, processing, errors } = useForm({
        name: entity.name || '',
        description: entity.description || '',
        color: entity.color || '#7c3aed',
    });
    const submit = (e) => {
        e.preventDefault();
        put(route(routeName, entity.id), { preserveScroll: true, onSuccess: onClose });
    };
    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <form
                onSubmit={submit}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-sm rounded-xl bg-neutral-900 border border-neutral-800 shadow-2xl overflow-hidden"
            >
                <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-white">Edit {label}</h2>
                    <button type="button" onClick={onClose} className="p-1 text-neutral-400 hover:text-white">
                        <X size={14} />
                    </button>
                </div>
                <div className="p-5 space-y-3">
                    <div>
                        <label className="text-xs font-medium text-neutral-400">Name</label>
                        <input
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            className="mt-1.5 w-full h-10 px-3 rounded-lg bg-neutral-950 border border-neutral-800 text-sm text-white outline-none focus:border-purple-500"
                            autoFocus
                            required
                        />
                        {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
                    </div>
                    {label === 'space' && (
                        <>
                            <div>
                                <label className="text-xs font-medium text-neutral-400">Description</label>
                                <textarea
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    rows={3}
                                    className="mt-1.5 w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-sm text-white outline-none focus:border-purple-500 resize-none"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-neutral-400">Color</label>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {SPACE_COLORS.map((c) => (
                                        <button
                                            key={c}
                                            type="button"
                                            onClick={() => setData('color', c)}
                                            className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
                                                data.color === c ? 'border-white scale-110' : 'border-transparent'
                                            }`}
                                            style={{ backgroundColor: c }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>
                <div className="px-5 py-3 border-t border-neutral-800 flex justify-end gap-2">
                    <button type="button" onClick={onClose} className="h-9 px-3 text-sm text-neutral-300 hover:text-white">
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={processing}
                        className="h-9 px-4 text-sm font-medium text-white rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-60"
                    >
                        Save
                    </button>
                </div>
            </form>
        </div>
    );
}

/* ---------- View Tabs ---------- */

function ViewTabs({ value, onChange }) {
    const tabs = [
        { id: 'overview', label: 'Overview', icon: LayoutGrid },
        { id: 'list', label: 'List', icon: LayoutList },
        { id: 'board', label: 'Board', icon: Kanban },
    ];
    return (
        <div className="flex items-center gap-1 px-6 border-b border-neutral-800">
            {tabs.map(({ id, label, icon: Icon }) => {
                const active = value === id;
                return (
                    <button
                        key={id}
                        onClick={() => onChange(id)}
                        className={`relative inline-flex items-center gap-1.5 h-10 px-3 text-sm transition ${
                            active ? 'text-white' : 'text-neutral-400 hover:text-white'
                        }`}
                    >
                        <Icon size={14} className={active ? 'text-purple-400' : ''} />
                        {label}
                        {active && (
                            <span className="absolute inset-x-0 -bottom-px h-0.5 bg-purple-500 rounded-full" />
                        )}
                    </button>
                );
            })}
            <button className="inline-flex items-center gap-1 h-10 px-3 text-sm text-neutral-500 hover:text-white">
                <Plus size={13} /> View
            </button>
        </div>
    );
}

/* ---------- Action Bar ---------- */

function ActionBar({ onAddList, onAddFolder }) {
    return (
        <div className="flex items-center justify-between px-6 py-3">
            <button className="inline-flex items-center gap-1.5 h-8 px-3 text-xs text-neutral-300 rounded-md bg-neutral-900 hover:bg-neutral-800 transition">
                <Filter size={12} /> Filters
            </button>
            <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 h-8 px-3 text-[11px] text-neutral-500 rounded-md bg-neutral-900">
                    <RefreshCw size={11} /> Refreshed: just now
                </span>
                <button className="inline-flex items-center gap-1.5 h-8 px-3 text-xs text-neutral-300 rounded-md bg-neutral-900 hover:bg-neutral-800 transition">
                    <Sliders size={12} /> Customize
                </button>
                <button
                    onClick={onAddList}
                    className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-medium text-white rounded-md bg-purple-600 hover:bg-purple-500 transition"
                >
                    <Plus size={13} /> Add list
                </button>
            </div>
        </div>
    );
}

/* ---------- Card shell ---------- */

function Card({ title, action, children, className = '' }) {
    return (
        <div className={`rounded-xl bg-neutral-900 border border-neutral-800 ${className}`}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-800">
                <h3 className="text-sm font-semibold text-white">{title}</h3>
                {action}
            </div>
            <div className="p-5">{children}</div>
        </div>
    );
}

function EmptyCardState({ icon: Icon, title, action }) {
    return (
        <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-12 h-12 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center">
                <Icon size={20} className="text-neutral-500" />
            </div>
            <p className="mt-3 text-xs text-neutral-400 max-w-[14rem]">{title}</p>
            {action && <div className="mt-3">{action}</div>}
        </div>
    );
}

/* ---------- Helpers ---------- */

const PRIORITY_TONE = {
    urgent: 'text-red-400 bg-red-500/10 border-red-500/30',
    high: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
    medium: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
    low: 'text-neutral-400 bg-neutral-700/40 border-neutral-700',
};

function formatDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function ProgressBar({ value }) {
    const v = Math.max(0, Math.min(100, value || 0));
    return (
        <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                <div
                    className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
                    style={{ width: `${v}%` }}
                />
            </div>
            <span className="text-[11px] tabular-nums text-neutral-400 w-10 text-right">
                {v}%
            </span>
        </div>
    );
}

/* ---------- Page ---------- */

export default function SpaceDetail({ space }) {
    const [view, setView] = useState('overview');
    const [showFolderForm, setShowFolderForm] = useState(false);
    const [showListForm, setShowListForm] = useState(null);
    const [renaming, setRenaming] = useState(null);
    const [showBanner, setShowBanner] = useState(true);

    const renameSpace = () => setRenaming({ entity: space, label: 'space', routeName: 'spaces.update' });
    const renameFolder = (f) => setRenaming({ entity: f, label: 'folder', routeName: 'folders.update' });
    const renameList = (l) => setRenaming({ entity: l, label: 'list', routeName: 'lists.update' });

    const deleteSpace = () => {
        if (!confirm(`Delete space "${space.name}"?`)) return;
        router.delete(route('spaces.destroy', space.id), {
            onSuccess: () => router.visit(route('spaces.index')),
        });
    };
    const deleteFolder = (f) => {
        if (!confirm(`Delete folder "${f.name}"?`)) return;
        router.delete(route('folders.destroy', f.id), { preserveScroll: true });
    };
    const deleteList = (l) => {
        if (!confirm(`Delete list "${l.name}" and its tasks?`)) return;
        router.delete(route('lists.destroy', l.id), { preserveScroll: true });
    };

    // Flatten all lists across root + folders for tables/recent
    const allLists = useMemo(() => {
        const root = (space.lists || []).map((l) => ({ ...l, folder: null }));
        const inFolders = (space.folders || []).flatMap((f) =>
            (f.lists || []).map((l) => ({ ...l, folder: { id: f.id, name: f.name } }))
        );
        return [...root, ...inFolders];
    }, [space]);

    const recentLists = useMemo(
        () =>
            [...allLists]
                .sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0))
                .slice(0, 5),
        [allLists]
    );

    return (
        <>
            <Head title={space.name} />
            <HomeShell
                title={
                    <span className="flex items-center gap-2">
                        <Link
                            href={route('spaces.index')}
                            className="inline-flex items-center gap-1 text-neutral-500 hover:text-neutral-300 text-sm font-normal"
                        >
                            <ArrowLeft size={13} /> Spaces
                        </Link>
                        <span className="text-neutral-700">/</span>
                        <div 
                            className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 shadow-sm"
                            style={{ backgroundColor: space.color || '#7c3aed' }}
                        >
                            <Layers size={12} className="text-white" />
                        </div>
                        <span className="font-semibold">{space.name}</span>
                    </span>
                }
                subtitle={space.description}
                actions={
                    <div className="flex items-center gap-1">
                        <button
                            onClick={renameSpace}
                            className="w-8 h-8 inline-flex items-center justify-center rounded-md text-neutral-400 hover:text-white hover:bg-neutral-900 transition"
                            title="Rename space"
                        >
                            <Edit3 size={14} />
                        </button>
                        <button
                            onClick={deleteSpace}
                            className="w-8 h-8 inline-flex items-center justify-center rounded-md text-neutral-400 hover:text-red-400 hover:bg-neutral-900 transition"
                            title="Delete space"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                }
            >
                <ViewTabs value={view} onChange={setView} />

                {view === 'overview' && (
                    <>
                        {showBanner && (
                            <div className="mx-6 mt-4 flex items-center gap-3 px-4 py-2.5 rounded-lg bg-purple-500/10 border border-purple-500/30 text-sm text-purple-200">
                                <span className="flex-1">
                                    Get the most out of your Overview: Add, reorder, and resize cards to customize this page.{' '}
                                    <button className="underline font-medium hover:text-white">Get Started</button>
                                </span>
                                <button
                                    onClick={() => setShowBanner(false)}
                                    className="p-1 rounded-md hover:bg-purple-500/20 transition"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        )}

                        <ActionBar
                            onAddList={() => setShowListForm('space')}
                            onAddFolder={() => setShowFolderForm(true)}
                        />

                        <div className="px-6 pb-6 space-y-5">
                            {/* Inline create forms */}
                            {showFolderForm && (
                                <NewFolderForm spaceId={space.id} onDone={() => setShowFolderForm(false)} />
                            )}
                            {showListForm === 'space' && (
                                <NewListForm spaceId={space.id} onDone={() => setShowListForm(null)} />
                            )}

                            {/* Top cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                                <Card title="Recent">
                                    {recentLists.length === 0 ? (
                                        <EmptyCardState
                                            icon={Clock}
                                            title="Lists you visit will appear here for quick access."
                                        />
                                    ) : (
                                        <ul className="space-y-1.5">
                                            {recentLists.map((l) => (
                                                <li key={l.id}>
                                                    <Link
                                                        href={route('lists.show', l.id)}
                                                        className="group flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-neutral-200 hover:bg-neutral-800 transition"
                                                    >
                                                        <ListIcon size={13} className="text-purple-400 shrink-0" />
                                                        <span className="truncate">{l.name}</span>
                                                        {l.folder && (
                                                            <span className="ml-auto text-[11px] text-neutral-500 truncate">
                                                                in {l.folder.name}
                                                            </span>
                                                        )}
                                                    </Link>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </Card>

                                <Card title="Docs">
                                    <EmptyCardState
                                        icon={FileText}
                                        title="There are no Docs in this location yet."
                                        action={
                                            <button className="h-8 px-3 text-xs font-medium rounded-md bg-purple-600 hover:bg-purple-500 text-white transition">
                                                Add a Doc
                                            </button>
                                        }
                                    />
                                </Card>

                                <Card title="Bookmarks">
                                    <EmptyCardState
                                        icon={Bookmark}
                                        title="Bookmarks make it easy to save items or any URL from around the web."
                                        action={
                                            <button className="h-8 px-3 text-xs font-medium rounded-md bg-purple-600 hover:bg-purple-500 text-white transition">
                                                Add Bookmark
                                            </button>
                                        }
                                    />
                                </Card>

                                <Card title="Members">
                                    {((space.users || []).length === 0 && (space.invitations || []).length === 0) ? (
                                        <EmptyCardState
                                            icon={UserIcon}
                                            title="No members or pending invitations for this space."
                                        />
                                    ) : (
                                        <div className="space-y-4">
                                            {/* Active Members */}
                                            {space.users && space.users.length > 0 && (
                                                <div className="space-y-3">
                                                    <h4 className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Active Members</h4>
                                                    {space.users.map((u) => (
                                                        <div key={u.id} className="flex items-center gap-3">
                                                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-[10px] font-bold text-white uppercase">
                                                                {u.name.charAt(0)}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="text-xs font-medium text-neutral-200 truncate">{u.name}</div>
                                                                <div className="text-[10px] text-neutral-500 truncate">{u.email}</div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Pending Invitations */}
                                            {space.invitations && space.invitations.length > 0 && (
                                                <div className="space-y-3">
                                                    <h4 className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Pending Invitations</h4>
                                                    {space.invitations.map((inv) => (
                                                        <div key={inv.id} className="flex items-center gap-3 opacity-60">
                                                            <div className="w-7 h-7 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-[10px] font-bold text-neutral-400 uppercase">
                                                                ?
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="text-xs font-medium text-neutral-300 truncate">{inv.email}</div>
                                                                <div className="text-[10px] text-neutral-500 truncate italic">Awaiting acceptance</div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </Card>
                            </div>

                            {/* Folders card */}
                            <Card
                                title="Folders"
                                action={
                                    <button
                                        onClick={() => setShowFolderForm(true)}
                                        className="inline-flex items-center gap-1 text-xs text-neutral-400 hover:text-white"
                                    >
                                        <Plus size={12} /> New folder
                                    </button>
                                }
                            >
                                {(space.folders || []).length === 0 ? (
                                    <EmptyCardState
                                        icon={FolderIcon}
                                        title="Add new Folder to your Space"
                                        action={
                                            <button
                                                onClick={() => setShowFolderForm(true)}
                                                className="h-8 px-3 text-xs font-medium rounded-md bg-purple-600 hover:bg-purple-500 text-white transition"
                                            >
                                                Add Folder
                                            </button>
                                        }
                                    />
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                                        {space.folders.map((f) => (
                                            <div
                                                key={f.id}
                                                className="group rounded-lg bg-neutral-950 border border-neutral-800 hover:border-neutral-700 transition"
                                            >
                                                <div className="flex items-center gap-2 px-3 py-2.5 border-b border-neutral-800">
                                                    <FolderIcon size={14} className="text-amber-400 shrink-0" />
                                                    <span className="flex-1 text-sm font-medium text-neutral-100 truncate">
                                                        {f.name}
                                                    </span>
                                                    <span className="text-[11px] text-neutral-500 tabular-nums">
                                                        {(f.lists || []).length}
                                                    </span>
                                                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition">
                                                        <button
                                                            onClick={() => setShowListForm(f.id)}
                                                            className="p-1 text-neutral-500 hover:text-white rounded"
                                                            title="Add list"
                                                        >
                                                            <Plus size={11} />
                                                        </button>
                                                        <button
                                                            onClick={() => renameFolder(f)}
                                                            className="p-1 text-neutral-500 hover:text-white rounded"
                                                            title="Rename"
                                                        >
                                                            <Edit3 size={11} />
                                                        </button>
                                                        <button
                                                            onClick={() => deleteFolder(f)}
                                                            className="p-1 text-neutral-500 hover:text-red-400 rounded"
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={11} />
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="p-2 space-y-0.5">
                                                    {(f.lists || []).map((l) => (
                                                        <Link
                                                            key={l.id}
                                                            href={route('lists.show', l.id)}
                                                            className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-neutral-300 hover:bg-neutral-800 transition"
                                                        >
                                                            <ListIcon size={12} className="text-purple-400 shrink-0" />
                                                            <span className="truncate">{l.name}</span>
                                                        </Link>
                                                    ))}
                                                    {showListForm === f.id && (
                                                        <NewListForm
                                                            spaceId={space.id}
                                                            folderId={f.id}
                                                            onDone={() => setShowListForm(null)}
                                                        />
                                                    )}
                                                    {(f.lists || []).length === 0 && showListForm !== f.id && (
                                                        <button
                                                            onClick={() => setShowListForm(f.id)}
                                                            className="w-full flex items-center justify-center gap-1 px-2 py-2 text-[11px] text-neutral-500 hover:text-white hover:bg-neutral-900 rounded-md transition"
                                                        >
                                                            <Plus size={11} /> Add list
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </Card>

                            {/* Lists table */}
                            <Card
                                title="Lists"
                                action={
                                    <button
                                        onClick={() => setShowListForm('space')}
                                        className="inline-flex items-center gap-1 text-xs text-neutral-400 hover:text-white"
                                    >
                                        <Plus size={12} /> New list
                                    </button>
                                }
                            >
                                {allLists.length === 0 ? (
                                    <EmptyCardState
                                        icon={ListIcon}
                                        title="No lists yet. Create your first list to start organizing tasks."
                                        action={
                                            <button
                                                onClick={() => setShowListForm('space')}
                                                className="h-8 px-3 text-xs font-medium rounded-md bg-purple-600 hover:bg-purple-500 text-white transition"
                                            >
                                                Add List
                                            </button>
                                        }
                                    />
                                ) : (
                                    <div className="overflow-x-auto -mx-5">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b border-neutral-800 text-[11px] uppercase tracking-wider text-neutral-500">
                                                    <th className="font-medium text-left py-2 px-5">Name</th>
                                                    <th className="font-medium text-left py-2 px-3 w-24">
                                                        <span className="inline-flex items-center gap-1"><Flag size={11} /> Color</span>
                                                    </th>
                                                    <th className="font-medium text-left py-2 px-3 w-56">Progress</th>
                                                    <th className="font-medium text-left py-2 px-3 w-28">
                                                        <span className="inline-flex items-center gap-1"><Calendar size={11} /> Start</span>
                                                    </th>
                                                    <th className="font-medium text-left py-2 px-3 w-28">
                                                        <span className="inline-flex items-center gap-1"><Calendar size={11} /> End</span>
                                                    </th>
                                                    <th className="font-medium text-left py-2 px-3 w-28">
                                                        <span className="inline-flex items-center gap-1"><Flag size={11} /> Priority</span>
                                                    </th>
                                                    <th className="font-medium text-left py-2 px-3 w-32">
                                                        <span className="inline-flex items-center gap-1"><UserIcon size={11} /> Owner</span>
                                                    </th>
                                                    <th className="w-16" />
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {allLists.map((l) => {
                                                    const stats = l.stats || {};
                                                    const tone = stats.top_priority ? PRIORITY_TONE[stats.top_priority] : null;
                                                    return (
                                                        <tr key={l.id} className="group border-b border-neutral-800/50 hover:bg-neutral-800/40 transition">
                                                            <td className="py-2.5 px-5">
                                                                <Link
                                                                    href={route('lists.show', l.id)}
                                                                    className="inline-flex items-center gap-2 text-neutral-100 hover:text-white"
                                                                >
                                                                    <ListIcon size={13} className="text-purple-400 shrink-0" />
                                                                    <span className="truncate">{l.name}</span>
                                                                    {l.folder && (
                                                                        <span className="text-[11px] text-neutral-500">
                                                                            · {l.folder.name}
                                                                        </span>
                                                                    )}
                                                                </Link>
                                                            </td>
                                                            <td className="py-2.5 px-3">
                                                                <span
                                                                    className="inline-block w-3 h-3 rounded-full ring-1 ring-white/10"
                                                                    style={{ backgroundColor: l.color || '#737373' }}
                                                                />
                                                            </td>
                                                            <td className="py-2.5 px-3">
                                                                <ProgressBar value={stats.progress} />
                                                            </td>
                                                            <td className="py-2.5 px-3 text-neutral-300 tabular-nums">
                                                                {formatDate(stats.start)}
                                                            </td>
                                                            <td className="py-2.5 px-3 text-neutral-300 tabular-nums">
                                                                {formatDate(stats.end)}
                                                            </td>
                                                            <td className="py-2.5 px-3">
                                                                {stats.top_priority ? (
                                                                    <span className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded border ${tone}`}>
                                                                        {stats.top_priority}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-neutral-600">—</span>
                                                                )}
                                                            </td>
                                                            <td className="py-2.5 px-3 text-neutral-300 truncate">
                                                                {l.created_by?.name || l.createdBy?.name || '—'}
                                                            </td>
                                                            <td className="py-2.5 px-3">
                                                                <div className="opacity-0 group-hover:opacity-100 flex items-center justify-end gap-0.5 transition">
                                                                    <button onClick={() => renameList(l)} className="p-1 text-neutral-500 hover:text-white" title="Rename">
                                                                        <Edit3 size={12} />
                                                                    </button>
                                                                    <button onClick={() => deleteList(l)} className="p-1 text-neutral-500 hover:text-red-400" title="Delete">
                                                                        <Trash2 size={12} />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </Card>
                        </div>
                    </>
                )}

                {view === 'list' && (
                    <div className="p-6">
                        <Card title="All lists">
                            {allLists.length === 0 ? (
                                <EmptyCardState
                                    icon={ListIcon}
                                    title="No lists yet."
                                    action={
                                        <button
                                            onClick={() => setShowListForm('space')}
                                            className="h-8 px-3 text-xs font-medium rounded-md bg-purple-600 hover:bg-purple-500 text-white transition"
                                        >
                                            Add List
                                        </button>
                                    }
                                />
                            ) : (
                                <ul className="divide-y divide-neutral-800">
                                    {allLists.map((l) => (
                                        <li key={l.id} className="group flex items-center gap-3 py-2">
                                            <ListIcon size={14} className="text-purple-400 shrink-0" />
                                            <Link
                                                href={route('lists.show', l.id)}
                                                className="flex-1 truncate text-neutral-200 hover:text-white"
                                            >
                                                {l.name}
                                            </Link>
                                            <span className="text-[11px] text-neutral-500 tabular-nums">
                                                {l.stats?.total ?? 0} tasks
                                            </span>
                                            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition">
                                                <button onClick={() => renameList(l)} className="p-1 text-neutral-500 hover:text-white">
                                                    <Edit3 size={12} />
                                                </button>
                                                <button onClick={() => deleteList(l)} className="p-1 text-neutral-500 hover:text-red-400">
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </Card>
                    </div>
                )}

                {view === 'board' && (
                    <div className="p-6">
                        <Card title="Board">
                            <EmptyCardState
                                icon={Kanban}
                                title="Board view groups lists by status. Open a list to use the board view."
                            />
                        </Card>
                    </div>
                )}
            </HomeShell>

            {renaming && (
                <RenameModal
                    entity={renaming.entity}
                    label={renaming.label}
                    routeName={renaming.routeName}
                    onClose={() => setRenaming(null)}
                />
            )}
        </>
    );
}
