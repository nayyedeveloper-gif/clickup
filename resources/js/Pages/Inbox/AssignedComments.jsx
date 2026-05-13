import { Link, router } from '@inertiajs/react';
import { useState } from 'react';
import HomeShell, { Tab } from '@/Components/HomeShell';
import { Search, MessageSquare } from 'lucide-react';

function relTime(date) {
    if (!date) return '';
    const diff = (Date.now() - new Date(date).getTime()) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

function Avatar({ name }) {
    const initial = (name || '?').charAt(0).toUpperCase();
    return (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
            {initial}
        </div>
    );
}

export default function AssignedComments({ comments, filters }) {
    const [tab, setTab] = useState('assigned'); // 'assigned' | 'delegated'
    const [resolved, setResolved] = useState(!!filters?.resolved);
    const [range, setRange] = useState(filters?.range || 90);
    const [q, setQ] = useState('');

    const refresh = (overrides = {}) => {
        router.get(
            route('assigned-comments.index'),
            {
                resolved: overrides.resolved ?? resolved ? 1 : 0,
                range: overrides.range ?? range,
            },
            { preserveState: true, replace: true }
        );
    };

    const filtered = q
        ? comments.filter((c) =>
              (c.body || '').toLowerCase().includes(q.toLowerCase()) ||
              (c.task?.title || '').toLowerCase().includes(q.toLowerCase())
          )
        : comments;

    return (
        <HomeShell
            title="Assigned Comments"
            tabs={
                <>
                    <Tab active={tab === 'assigned'} onClick={() => setTab('assigned')}>
                        Assigned to me
                    </Tab>
                    <Tab active={tab === 'delegated'} onClick={() => setTab('delegated')}>
                        Delegated by me
                    </Tab>
                </>
            }
        >
            {/* Filters */}
            <div className="px-6 py-3 flex items-center gap-2 border-b border-neutral-800">
                <button className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs bg-neutral-900 hover:bg-neutral-800 transition">
                    Filter
                </button>
                <button
                    onClick={() => {
                        const v = !resolved;
                        setResolved(v);
                        refresh({ resolved: v });
                    }}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs border ${
                        resolved
                            ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
                            : 'bg-neutral-900 border-neutral-800 text-neutral-300'
                    }`}
                >
                    {resolved ? '✓ Resolved' : 'Resolved'}
                </button>
                <select
                    value={range}
                    onChange={(e) => {
                        const v = Number(e.target.value);
                        setRange(v);
                        refresh({ range: v });
                    }}
                    className="bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-md text-xs px-2 py-1"
                >
                    <option value={7}>Last 7 Days</option>
                    <option value={30}>Last 30 Days</option>
                    <option value={90}>Last 90 Days</option>
                    <option value={365}>Last year</option>
                </select>
                <div className="relative ml-auto">
                    <Search size={12} className="absolute left-2 top-1.5 text-neutral-500" />
                    <input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Search"
                        className="bg-neutral-900 rounded-md pl-7 pr-3 py-1 text-xs focus:bg-neutral-800"
                    />
                </div>
            </div>

            {filtered.length === 0 ? (
                <Empty hasFilter={resolved || q !== ''} onClear={() => { setResolved(false); setQ(''); refresh({ resolved: false }); }} />
            ) : (
                <div className="divide-y divide-neutral-800">
                    {filtered.map((c) => (
                        <Link
                            key={c.id}
                            href={route('lists.show', c.task?.task_list_id || 0)}
                            className="flex items-start gap-3 px-6 py-4 hover:bg-neutral-900/60"
                        >
                            <Avatar name={c.user?.name} />
                            <div className="flex-1 min-w-0">
                                <div className="text-sm">
                                    <span className="font-medium">{c.user?.name}</span> on{' '}
                                    <span className="font-medium">{c.task?.title}</span>
                                </div>
                                <div className="mt-1 text-sm text-neutral-300 line-clamp-2">
                                    {c.body}
                                </div>
                                <div className="mt-1 text-xs text-neutral-500">
                                    {c.task?.list?.name && <span>in {c.task.list.name} · </span>}
                                    {relTime(c.created_at)}
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </HomeShell>
    );
}

function Empty({ hasFilter, onClear }) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center px-8 py-20">
            <div className="w-16 h-16 rounded-full bg-neutral-800/50 flex items-center justify-center mb-4">
                <MessageSquare size={28} className="text-neutral-500" />
            </div>
            <h2 className="text-lg font-semibold mb-2">No results found</h2>
            {hasFilter && (
                <button
                    onClick={onClear}
                    className="px-3 py-1.5 rounded-md bg-neutral-800 hover:bg-neutral-700 text-sm"
                >
                    Clear filters
                </button>
            )}
        </div>
    );
}
