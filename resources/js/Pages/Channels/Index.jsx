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
                    <div className="flex min-h-[2.75rem] items-center gap-2.5 rounded-2xl border border-neutral-800/90 bg-neutral-900/80 px-3 py-2">
                        <Search size={16} className="shrink-0 text-neutral-500" strokeWidth={2} />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search channels…"
                            className="bare-input min-w-0 flex-1 text-[15px] placeholder:text-neutral-600"
                            aria-label="Search channels"
                        />
                    </div>
                }
            >
                <div className="px-3 pb-4 pt-2 sm:p-4 lg:p-6">
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
                        <div className="flex flex-col gap-2.5 md:grid md:grid-cols-2 md:gap-4 lg:grid-cols-3">
                            {filtered.map((c) => (
                                <Link
                                    key={c.id}
                                    href={route('channels.show', c.id)}
                                    className="group relative rounded-2xl border border-neutral-800/90 bg-neutral-900/70 p-4 shadow-sm transition active:scale-[0.99] active:bg-neutral-900 md:rounded-lg md:active:scale-100 hover:border-neutral-700 hover:bg-neutral-900"
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
                                        className="absolute right-2 top-2 flex h-10 w-10 items-center justify-center rounded-full text-neutral-500 opacity-100 transition hover:bg-neutral-800/80 hover:text-red-400 md:right-3 md:top-3 md:h-8 md:w-8 md:opacity-0 md:group-hover:opacity-100"
                                        title="Delete"
                                        type="button"
                                    >
                                        <Trash2 size={15} className="md:h-[13px] md:w-[13px]" />
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
