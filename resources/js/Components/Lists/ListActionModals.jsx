import { router, useForm } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import { X, Folder as FolderIcon, Hash } from 'lucide-react';

/* ----------------------- Modal shell ----------------------- */

function ModalShell({ title, onClose, children, footer }) {
    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className="w-full max-w-md rounded-xl bg-neutral-900 border border-neutral-800 shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-white">{title}</h2>
                    <button onClick={onClose} className="p-1 text-neutral-400 hover:text-white">
                        <X size={14} />
                    </button>
                </div>
                <div className="p-5">{children}</div>
                {footer && (
                    <div className="px-5 py-3 border-t border-neutral-800 flex justify-end gap-2">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}

/* ----------------------- Rename ----------------------- */

export function RenameListModal({ list, onClose }) {
    const { data, setData, put, processing, errors } = useForm({
        name: list.name || '',
        description: list.description || '',
        color: list.color || '',
        icon: list.icon || '',
    });

    const submit = (e) => {
        e.preventDefault();
        put(route('lists.update', list.id), {
            preserveScroll: true,
            onSuccess: onClose,
        });
    };

    return (
        <ModalShell
            title="Rename list"
            onClose={onClose}
            footer={
                <>
                    <button
                        type="button"
                        onClick={onClose}
                        className="h-9 px-3 text-sm text-neutral-300 hover:text-white"
                    >
                        Cancel
                    </button>
                    <button
                        form="rename-list-form"
                        type="submit"
                        disabled={processing}
                        className="h-9 px-4 text-sm font-medium text-white rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-60"
                    >
                        Save
                    </button>
                </>
            }
        >
            <form id="rename-list-form" onSubmit={submit} className="space-y-3">
                <div>
                    <label className="text-xs font-medium text-neutral-400">Name</label>
                    <input
                        autoFocus
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        className="mt-1.5 w-full h-10 px-3 rounded-lg bg-neutral-950 border border-neutral-800 text-sm text-white outline-none focus:border-purple-500"
                        required
                    />
                    {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
                </div>
                <div>
                    <label className="text-xs font-medium text-neutral-400">Description</label>
                    <textarea
                        value={data.description}
                        onChange={(e) => setData('description', e.target.value)}
                        rows={3}
                        className="mt-1.5 w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-sm text-white outline-none focus:border-purple-500 resize-none"
                    />
                </div>
            </form>
        </ModalShell>
    );
}

/* ----------------------- Color & Icon ----------------------- */

const COLOR_PALETTE = [
    '#a855f7', // purple
    '#ec4899', // pink
    '#ef4444', // red
    '#f97316', // orange
    '#eab308', // yellow
    '#22c55e', // green
    '#10b981', // emerald
    '#06b6d4', // cyan
    '#3b82f6', // blue
    '#6366f1', // indigo
    '#8b5cf6', // violet
    '#737373', // neutral
];

const ICONS = [
    '📋', '✅', '🚀', '🎯', '⭐', '🔥', '💡', '📌',
    '📦', '🛠️', '🐛', '⚙️', '🎨', '📊', '💼', '🏆',
];

export function ColorIconModal({ list, onClose }) {
    const [color, setColor] = useState(list.color || '');
    const [icon, setIcon] = useState(list.icon || '');
    const [saving, setSaving] = useState(false);

    const save = () => {
        setSaving(true);
        router.put(
            route('lists.update', list.id),
            { name: list.name, description: list.description || '', color, icon },
            {
                preserveScroll: true,
                preserveState: true,
                onFinish: () => setSaving(false),
                onSuccess: onClose,
            }
        );
    };

    return (
        <ModalShell
            title="Color & icon"
            onClose={onClose}
            footer={
                <>
                    <button onClick={onClose} className="h-9 px-3 text-sm text-neutral-300 hover:text-white">
                        Cancel
                    </button>
                    <button
                        onClick={save}
                        disabled={saving}
                        className="h-9 px-4 text-sm font-medium text-white rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-60"
                    >
                        Save
                    </button>
                </>
            }
        >
            <div className="space-y-5">
                <div>
                    <div className="text-xs font-medium text-neutral-400 mb-2">Color</div>
                    <div className="grid grid-cols-6 gap-2">
                        <button
                            type="button"
                            onClick={() => setColor('')}
                            className={`h-9 rounded-lg border text-[11px] text-neutral-300 ${
                                !color ? 'border-purple-500 bg-purple-500/10' : 'border-neutral-800 hover:border-neutral-700'
                            }`}
                        >
                            None
                        </button>
                        {COLOR_PALETTE.map((c) => (
                            <button
                                key={c}
                                type="button"
                                onClick={() => setColor(c)}
                                className={`h-9 rounded-lg ring-2 transition ${
                                    color === c ? 'ring-white' : 'ring-transparent hover:ring-neutral-700'
                                }`}
                                style={{ backgroundColor: c }}
                                title={c}
                            />
                        ))}
                    </div>
                </div>
                <div>
                    <div className="text-xs font-medium text-neutral-400 mb-2">Icon</div>
                    <div className="grid grid-cols-8 gap-1">
                        <button
                            type="button"
                            onClick={() => setIcon('')}
                            className={`h-9 rounded-lg border text-[11px] text-neutral-300 ${
                                !icon ? 'border-purple-500 bg-purple-500/10' : 'border-neutral-800 hover:border-neutral-700'
                            }`}
                        >
                            None
                        </button>
                        {ICONS.map((em) => (
                            <button
                                key={em}
                                type="button"
                                onClick={() => setIcon(em)}
                                className={`h-9 rounded-lg text-lg flex items-center justify-center border transition ${
                                    icon === em
                                        ? 'border-purple-500 bg-purple-500/10'
                                        : 'border-neutral-800 hover:border-neutral-700'
                                }`}
                            >
                                {em}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </ModalShell>
    );
}

/* ----------------------- Move ----------------------- */

export function MoveListModal({ list, spaces = [], onClose }) {
    const [spaceId, setSpaceId] = useState(list.space_id);
    const [folderId, setFolderId] = useState(list.folder_id || '');
    const [saving, setSaving] = useState(false);

    const space = useMemo(() => spaces.find((s) => s.id === spaceId), [spaces, spaceId]);
    const folders = space?.folders || [];

    // Reset folder when space changes
    useEffect(() => {
        if (!folders.find((f) => f.id === folderId)) {
            setFolderId('');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [spaceId]);

    const submit = () => {
        setSaving(true);
        router.post(
            route('lists.move', list.id),
            { space_id: spaceId, folder_id: folderId || null },
            {
                preserveScroll: false,
                onFinish: () => setSaving(false),
                onSuccess: onClose,
            }
        );
    };

    const unchanged = spaceId === list.space_id && (folderId || null) === (list.folder_id || null);

    return (
        <ModalShell
            title="Move list"
            onClose={onClose}
            footer={
                <>
                    <button onClick={onClose} className="h-9 px-3 text-sm text-neutral-300 hover:text-white">
                        Cancel
                    </button>
                    <button
                        onClick={submit}
                        disabled={saving || unchanged}
                        className="h-9 px-4 text-sm font-medium text-white rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        Move
                    </button>
                </>
            }
        >
            <div className="space-y-4">
                <div>
                    <label className="text-xs font-medium text-neutral-400">Destination space</label>
                    <select
                        value={spaceId}
                        onChange={(e) => setSpaceId(Number(e.target.value))}
                        className="mt-1.5 w-full h-10 px-3 rounded-lg bg-neutral-950 border border-neutral-800 text-sm text-white outline-none focus:border-purple-500"
                    >
                        {spaces.map((s) => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="text-xs font-medium text-neutral-400">Folder (optional)</label>
                    <select
                        value={folderId}
                        onChange={(e) => setFolderId(e.target.value ? Number(e.target.value) : '')}
                        className="mt-1.5 w-full h-10 px-3 rounded-lg bg-neutral-950 border border-neutral-800 text-sm text-white outline-none focus:border-purple-500"
                    >
                        <option value="">No folder (root of space)</option>
                        {folders.map((f) => (
                            <option key={f.id} value={f.id}>{f.name}</option>
                        ))}
                    </select>
                </div>
                <div className="text-[11px] text-neutral-500 inline-flex items-center gap-1.5">
                    <FolderIcon size={11} />
                    Currently in <span className="text-neutral-300">{list.space?.name || '—'}</span>
                    {list.folder?.name ? (
                        <>
                            <span className="text-neutral-700">/</span>
                            <span className="text-neutral-300">{list.folder.name}</span>
                        </>
                    ) : null}
                </div>
            </div>
        </ModalShell>
    );
}

/* ----------------------- Coming Soon (placeholder) ----------------------- */

export function ComingSoonModal({ title, description, onClose }) {
    return (
        <ModalShell title={title} onClose={onClose} footer={
            <button onClick={onClose} className="h-9 px-4 text-sm font-medium text-white rounded-lg bg-purple-600 hover:bg-purple-500">
                Got it
            </button>
        }>
            <p className="text-sm text-neutral-300">{description}</p>
            <p className="mt-2 text-xs text-neutral-500">
                This feature is on our roadmap. Reach out if you need it sooner.
            </p>
        </ModalShell>
    );
}
