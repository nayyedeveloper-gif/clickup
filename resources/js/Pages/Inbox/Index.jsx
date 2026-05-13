import { Link } from '@inertiajs/react';
import HomeShell from '@/Components/HomeShell';
import { CheckSquare, MessageSquare, UserPlus, Inbox as InboxIcon } from 'lucide-react';

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

export default function Inbox({ items }) {
    return (
        <HomeShell title="Inbox" showMobileBack={false}>
            {items.length === 0 ? (
                <Empty />
            ) : (
                <div className="divide-y divide-neutral-800">
                    {items.map((item) => {
                        const listId = item.task?.list?.id || item.task?.task_list_id;
                        if (!listId) return null;
                        return (
                        <Link
                            key={item.id}
                            href={route('lists.show', listId)}
                            className="flex items-start gap-3 px-6 py-4 hover:bg-neutral-900/60 transition-colors"
                        >
                            <Avatar name={item.actor?.name} />
                            <div className="flex-1 min-w-0">
                                <div className="text-sm">
                                    <span className="font-medium">
                                        {item.actor?.name || 'Someone'}
                                    </span>{' '}
                                    {item.kind === 'comment' && (
                                        <>
                                            <MessageSquare size={12} className="inline text-neutral-500 mx-1" />
                                            commented on{' '}
                                            <span className="font-medium">{item.task?.title}</span>
                                        </>
                                    )}
                                    {item.kind === 'assignment' && (
                                        <>
                                            <UserPlus size={12} className="inline text-neutral-500 mx-1" />
                                            assigned you to{' '}
                                            <span className="font-medium">{item.task?.title}</span>
                                        </>
                                    )}
                                </div>
                                {item.kind === 'comment' && item.comment?.body && (
                                    <div className="mt-1 text-sm text-neutral-400 line-clamp-2">
                                        {item.comment.body}
                                    </div>
                                )}
                                <div className="mt-1 text-xs text-neutral-500">
                                    {item.task?.list?.name && <span>in {item.task.list.name} · </span>}
                                    {relTime(item.happened_at)}
                                </div>
                            </div>
                        </Link>
                        );
                    })}
                </div>
            )}
        </HomeShell>
    );
}

function Empty() {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center px-8">
            <div className="w-20 h-20 rounded-full bg-neutral-800/50 flex items-center justify-center mb-4">
                <InboxIcon size={32} className="text-neutral-500" />
            </div>
            <h2 className="text-lg font-semibold mb-1">You're all caught up!</h2>
            <p className="text-sm text-neutral-400">
                Nothing new in your inbox right now. New assignments and comments will show up here.
            </p>
        </div>
    );
}
