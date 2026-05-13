import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import HomeShell from '@/Components/HomeShell';
import NewChannelModal from '@/Components/Modals/NewChannelModal';
import { Hash, Lock, Plus, Trash2, Search, Users } from 'lucide-react';

export default function ChannelIndex({ channels }) {
    const [showCreate, setShowCreate] = useState(false);
    const [search, setSearch] = useState('');

    const filtered = !search.trim() ? channels : channels.filter((c) =>
        c.name?.toLowerCase().includes(search.trim().toLowerCase())
    );

    const onDelete = (e, c) => {
        e.preventDefault();
        e.stopPropagation();
        if (!confirm(`Delete #${c.name}? This removes the channel and all its messages.`)) return;
        router.delete(route('channels.destroy', c.id), { preserveScroll: true });
    };

    return (
        <>
            <Head title="Channels" />
            <HomeShell
                title="Channels"
                subtitle="Team-wide spaces for ongoing conversation"
                actions={
                    <>
                        <div className="hidden lg:flex items-center gap-2 w-full lg:w-auto">
                            <div className="flex-1 lg:flex-none flex items-center gap-2 px-2.5 py-2 rounded-lg bg-neutral-800/70 border border-neutral-800 min-w-[11rem]">
                                <Search size={12} className="text-neutral-500" />
                                <input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search channels…"
                                    className="bare-input w-full lg:w-44"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowCreate(true)}
                                className="h-10 px-3 text-xs rounded-lg bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-1.5 shrink-0"
                            >
                                <Plus size={13} /> New channel
                            </button>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowCreate(true)}
                            className="lg:hidden flex h-11 min-w-[2.75rem] items-center justify-center rounded-full bg-purple-600 px-3 text-white hover:bg-purple-500 active:bg-purple-600"
                            aria-label="New channel"
                        >
                            <Plus className="h-5 w-5" strokeWidth={2.25} />
                        </button>
                    </>
                }
                mobileBelowAppBar={
                    <div className="flex items-center gap-2 px-1 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800">
                        <Search size={14} className="text-neutral-500 shrink-0" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search channels…"
                            className="bare-input flex-1 min-w-0 text-sm"
                            aria-label="Search channels"
                        />
                    </div>
                }
            >
                <div className="p-3 sm:p-4 lg:p-6">
                    {filtered.length === 0 ? (
                        <div className="text-center py-16">
                            <Hash className="mx-auto text-neutral-700" size={48} />
                            <h3 className="mt-3 text-sm font-medium text-neutral-300">
                                {search ? 'No matching channels' : 'No channels yet'}
                            </h3>
                            <p className="text-xs text-neutral-500 mt-1">
                                {search ? 'Try a different search term.' : 'Create a channel to start collaborating.'}
                            </p>
                            {!search && (
                                <button
                                    onClick={() => setShowCreate(true)}
                                    className="mt-4 px-4 py-2 text-xs rounded-md bg-purple-600 hover:bg-purple-500 text-white inline-flex items-center gap-1.5"
                                >
                                    <Plus size={13} /> Create channel
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filtered.map((c) => (
                                <Link
                                    key={c.id}
                                    href={route('channels.show', c.id)}
                                    className="group rounded-lg border border-neutral-800 bg-neutral-900/40 hover:border-neutral-700 hover:bg-neutral-900 transition p-4 relative"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`shrink-0 w-9 h-9 rounded-md flex items-center justify-center ${c.is_private ? 'bg-amber-500/15 text-amber-400' : 'bg-purple-500/15 text-purple-400'}`}>
                                            {c.is_private ? <Lock size={15} /> : <Hash size={15} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-semibold text-white truncate">#{c.name}</span>
                                                {c.is_private && (
                                                    <span className="text-[10px] uppercase tracking-wider text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                                                        Private
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-neutral-500 mt-1 line-clamp-2">
                                                {c.description || 'No description'}
                                            </p>
                                            <div className="text-[11px] text-neutral-600 mt-2 flex items-center gap-2">
                                                <span className="truncate">
                                                    {c.space?.name ? `${c.space.name} · ` : ''}
                                                    Created by {c.creator?.name || 'Unknown'}
                                                </span>
                                                <span className="flex items-center gap-1 text-neutral-500">
                                                    <Users size={10} />
                                                    {c.users_count || 0}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => onDelete(e, c)}
                                        className="opacity-0 group-hover:opacity-100 absolute top-3 right-3 text-neutral-500 hover:text-red-400 transition"
                                        title="Delete"
                                    >
                                        <Trash2 size={13} />
                                    </button>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </HomeShell>

            {showCreate && <NewChannelModal onClose={() => setShowCreate(false)} />}
        </>
    );
}
