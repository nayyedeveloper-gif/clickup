import { router } from '@inertiajs/react';
import { useState } from 'react';
import { X, Trash2, Plus } from 'lucide-react';

const PRESET_COLORS = [
    '#9ca3af', '#6366f1', '#3b82f6', '#0ea5e9', '#10b981',
    '#22c55e', '#eab308', '#f97316', '#ef4444', '#a855f7',
];

const TYPES = [
    { id: 'open', label: 'Open' },
    { id: 'active', label: 'Active' },
    { id: 'closed', label: 'Closed' },
];

export default function StatusManager({ list, onClose }) {
    const [name, setName] = useState('');
    const [color, setColor] = useState(PRESET_COLORS[0]);
    const [type, setType] = useState('open');

    const submit = (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        router.post(
            route('statuses.store', list.id),
            { label: name.trim(), color, type },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setName('');
                    setColor(PRESET_COLORS[0]);
                    setType('open');
                },
            }
        );
    };

    const update = (status, payload) =>
        router.put(route('statuses.update', status.id), payload, { preserveScroll: true });

    const remove = (status) => {
        if (!confirm(`Delete status "${status.label}"? Existing tasks will move to the first remaining status.`)) {
            return;
        }
        router.delete(route('statuses.destroy', status.id), { preserveScroll: true });
    };

    return (
        <div className="fixed inset-0 z-50 flex" onMouseDown={onClose}>
            <div className="flex-1 bg-black/40 backdrop-blur-sm" />
            <div
                onMouseDown={(e) => e.stopPropagation()}
                className="w-[480px] max-w-full h-full bg-neutral-950 border-l border-neutral-800 text-neutral-100 shadow-2xl flex flex-col"
            >
                <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Manage statuses</h2>
                    <button onClick={onClose} className="text-neutral-400 hover:text-white">
                        <X size={18} />
                    </button>
                </div>

                {/* Existing statuses */}
                <div className="flex-1 overflow-y-auto p-5 space-y-2">
                    {(list.statuses || []).map((s) => (
                        <div
                            key={s.id}
                            className="bg-neutral-900 border border-neutral-800 rounded-lg p-3 flex items-center gap-3"
                        >
                            <button
                                className="w-5 h-5 rounded-full border border-neutral-700 cursor-pointer relative group"
                                style={{ background: s.color }}
                                title="Change color"
                            >
                                <input
                                    type="color"
                                    defaultValue={s.color}
                                    onChange={(e) => update(s, { color: e.target.value })}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                />
                            </button>
                            <input
                                defaultValue={s.label}
                                onBlur={(e) => {
                                    const v = e.target.value.trim();
                                    if (v && v !== s.label) update(s, { label: v });
                                }}
                                className="flex-1 bg-transparent border-none focus:outline-none text-sm font-medium"
                            />
                            <select
                                value={s.type}
                                onChange={(e) => update(s, { type: e.target.value })}
                                className="bg-neutral-950 border border-neutral-800 rounded text-xs px-2 py-1"
                            >
                                {TYPES.map((t) => (
                                    <option key={t.id} value={t.id}>
                                        {t.label}
                                    </option>
                                ))}
                            </select>
                            <button
                                onClick={() => remove(s)}
                                className="text-neutral-500 hover:text-red-400"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                </div>

                {/* Add new */}
                <form onSubmit={submit} className="border-t border-neutral-800 p-5 space-y-3">
                    <div className="text-xs uppercase text-neutral-500">Add status</div>
                    <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Status name (e.g. In Review)"
                        className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-sm"
                        required
                    />
                    <div className="flex items-center gap-2">
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                            className="bg-neutral-900 border border-neutral-800 rounded text-xs px-2 py-1"
                        >
                            {TYPES.map((t) => (
                                <option key={t.id} value={t.id}>
                                    {t.label}
                                </option>
                            ))}
                        </select>
                        <div className="flex items-center gap-1">
                            {PRESET_COLORS.map((c) => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => setColor(c)}
                                    className={`w-5 h-5 rounded-full border ${
                                        color === c ? 'border-white' : 'border-transparent'
                                    }`}
                                    style={{ background: c }}
                                />
                            ))}
                        </div>
                        <button
                            type="submit"
                            className="ml-auto flex items-center gap-1 px-3 py-1.5 rounded bg-purple-600 hover:bg-purple-500 text-sm"
                        >
                            <Plus size={14} /> Add
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
