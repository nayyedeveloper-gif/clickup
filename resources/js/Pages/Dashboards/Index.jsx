import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import HomeShell from '@/Components/HomeShell';
import { BarChart3, Plus, Trash2, X } from 'lucide-react';

function NewDashboardModal({ onClose }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        description: '',
        color: '#7c3aed',
    });
    const submit = (e) => {
        e.preventDefault();
        post(route('dashboards.store'), {
            preserveScroll: true,
            onSuccess: () => { reset(); onClose(); },
        });
    };
    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <form onSubmit={submit} className="bg-neutral-900 rounded-lg border border-neutral-800 w-full max-w-md p-4 space-y-3">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold flex items-center gap-2">
                        <BarChart3 size={16} className="text-purple-400" /> New Dashboard
                    </h2>
                    <button type="button" onClick={onClose} className="text-neutral-400 hover:text-white"><X size={16} /></button>
                </div>
                <input
                    type="text" value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    placeholder="Dashboard name"
                    className="w-full px-3 py-2 rounded-md bg-neutral-800 border border-neutral-700 text-sm text-white"
                    required autoFocus
                />
                {errors.name && <div className="text-red-400 text-xs">{errors.name}</div>}
                <input
                    type="text" value={data.description}
                    onChange={(e) => setData('description', e.target.value)}
                    placeholder="Description (optional)"
                    className="w-full px-3 py-2 rounded-md bg-neutral-800 border border-neutral-700 text-sm text-white"
                />
                <div className="flex items-center gap-2">
                    <label className="text-xs text-neutral-400">Color</label>
                    <input type="color" value={data.color} onChange={(e) => setData('color', e.target.value)} className="rounded-md cursor-pointer" />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={onClose} className="px-3 py-2 text-sm text-neutral-300 hover:text-white">Cancel</button>
                    <button type="submit" disabled={processing} className="px-4 py-2 text-sm bg-purple-600 hover:bg-purple-500 rounded-md text-white">Create</button>
                </div>
            </form>
        </div>
    );
}

export default function DashboardsIndex({ dashboards }) {
    const [showNew, setShowNew] = useState(false);

    const onDelete = (d) => {
        if (!confirm(`Delete "${d.name}"?`)) return;
        router.delete(route('dashboards.destroy', d.id), { preserveScroll: true });
    };

    return (
        <>
            <Head title="Dashboards" />
            <HomeShell
                title="Dashboards"
                subtitle="Build custom views of your work, deals, and goals"
                actions={
                    <button
                        onClick={() => setShowNew(true)}
                        className="px-3 py-1.5 text-xs rounded-md bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-1.5"
                    >
                        <Plus size={13} /> New dashboard
                    </button>
                }
            >
                <div className="px-6 py-4">
                    {dashboards.length === 0 ? (
                        <div className="text-center py-16">
                            <BarChart3 className="mx-auto text-neutral-700" size={48} />
                            <h3 className="mt-3 text-sm font-medium text-neutral-300">No dashboards yet</h3>
                            <p className="text-xs text-neutral-500 mt-1">Create a dashboard to visualize your tasks, deals, and goals.</p>
                            <button
                                onClick={() => setShowNew(true)}
                                className="mt-4 px-4 py-2 text-xs rounded-md bg-purple-600 hover:bg-purple-500 text-white inline-flex items-center gap-1.5"
                            >
                                <Plus size={13} /> Create dashboard
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {dashboards.map((d) => (
                                <div
                                    key={d.id}
                                    className="group rounded-lg border border-neutral-800 bg-neutral-900/40 hover:border-neutral-700 hover:bg-neutral-900 transition relative overflow-hidden"
                                >
                                    <div className="h-1.5" style={{ background: d.color }} />
                                    <Link href={route('dashboards.show', d.id)} className="block p-4">
                                        <div className="flex items-start gap-3">
                                            <div
                                                className="w-9 h-9 rounded-md flex items-center justify-center shrink-0"
                                                style={{ background: `${d.color}22`, color: d.color }}
                                            >
                                                <BarChart3 size={18} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-semibold text-white truncate">{d.name}</div>
                                                {d.description && (
                                                    <div className="text-xs text-neutral-500 mt-0.5 truncate">{d.description}</div>
                                                )}
                                                <div className="text-[11px] text-neutral-600 mt-2">
                                                    Updated {new Date(d.updated_at).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                    <button
                                        onClick={() => onDelete(d)}
                                        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-red-400 transition"
                                        title="Delete"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </HomeShell>
            {showNew && <NewDashboardModal onClose={() => setShowNew(false)} />}
        </>
    );
}
