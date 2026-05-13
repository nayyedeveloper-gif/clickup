import { Link, router } from '@inertiajs/react';
import { useState } from 'react';
import HomeShell, { Tab } from '@/Components/HomeShell';
import { MessageSquareReply } from 'lucide-react';

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

export default function Replies({ comments, tab }) {
    const [active, setActive] = useState(tab || 'unread');

    const filtered = comments.filter((c) =>
        active === 'unread' ? !c.is_read : c.is_read
    );

    const toggleResolved = (id, current) => {
        // Just toggles the read/unread state via a comment update endpoint? We don't have one yet.
        // Use a simple PUT to TaskCommentController if available; otherwise no-op.
        // For now we just navigate to the task
    };

    return (
        <HomeShell
            title="Replies"
            tabs={
                <>
                    <Tab active={active === 'unread'} onClick={() => setActive('unread')}>
                        Unread
                    </Tab>
                    <Tab active={active === 'read'} onClick={() => setActive('read')}>
                        Read
                    </Tab>
                </>
            }
        >
            {filtered.length === 0 ? (
                <Empty />
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
                                    <span className="font-medium">{c.user?.name}</span>{' '}
                                    replied on{' '}
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

function Empty() {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center px-8">
            <div className="w-20 h-20 rounded-full bg-neutral-800/50 flex items-center justify-center mb-4">
                <MessageSquareReply size={32} className="text-neutral-500" />
            </div>
            <h2 className="text-lg font-semibold mb-1">You're all caught up!</h2>
            <p className="text-sm text-neutral-400">
                Looks like you don't have any unread replies.
            </p>
        </div>
    );
}
