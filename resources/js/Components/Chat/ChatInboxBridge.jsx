import { router } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { notifyRealtimePing } from '@/lib/realtimeAlerts';

/**
 * Subscribes to the authenticated user's private `user.{id}` channel so
 * new DMs / channel messages refresh badges and show a lightweight toast
 * when the user is not on the originating chat screen.
 *
 * Must NOT use usePage() — this component renders beside `<App />`, outside Inertia's page context.
 */
export default function ChatInboxBridge({ userId }) {
    const [toast, setToast] = useState(null);
    const hideTimer = useRef(null);
    const subscribedRef = useRef(false);

    const clearToast = useCallback(() => {
        if (hideTimer.current) {
            clearTimeout(hideTimer.current);
            hideTimer.current = null;
        }
        setToast(null);
    }, []);

    useEffect(() => {
        if (!userId || typeof window === 'undefined') {
            return undefined;
        }

        const channelName = `user.${userId}`;
        let ch = null;
        let retryTimer = null;

        const subscribe = () => {
            if (subscribedRef.current || !window.Echo) {
                return;
            }

            ch = window.Echo.private(channelName);
            subscribedRef.current = true;
            console.log('[Realtime] subscribed:', channelName);

            ch.listen('.inbox.message', (e) => {
                router.reload({ only: ['badges', 'sidebar'] });

                const preview = e?.preview || 'New message';
                const sender = e?.sender_name || 'Someone';
                const path = window.location.pathname;
                const search = window.location.search;
                const dmUser = new URLSearchParams(search).get('user');
                const onDmThread =
                    e?.context === 'dm' &&
                    path === '/messages' &&
                    dmUser !== null &&
                    String(dmUser) === String(e?.sender_id);
                const onChannelPage =
                    e?.context === 'channel' &&
                    e?.channel_id &&
                    path === `/channels/${e.channel_id}`;

                if (onDmThread || onChannelPage) {
                    return;
                }

                setToast({
                    title: sender,
                    body: preview,
                    url: e?.url || '/messages',
                });
                notifyRealtimePing({
                    title: sender,
                    body: preview,
                    url: e?.url || '/messages',
                    tag: e?.message_id != null ? `m-${e.message_id}` : undefined,
                });
                if (hideTimer.current) clearTimeout(hideTimer.current);
                hideTimer.current = setTimeout(clearToast, 7000);
            });

            ch.listen('.inbox.task', (e) => {
                console.log('[Realtime] inbox.task received:', e);
                const path = window.location.pathname;
                const onInboxPage =
                    path === '/inbox' ||
                    path === '/replies' ||
                    path === '/assigned-comments';
                const onAssignedPage = path === '/my-tasks/assigned';

                router.reload({
                    only: onAssignedPage
                        ? ['badges', 'sidebar', 'tasks']
                        : onInboxPage
                            ? ['badges', 'sidebar', 'items', 'comments']
                            : ['badges', 'sidebar'],
                });

                setToast({
                    title: 'Task update',
                    body: e?.message || e?.title || 'Task assignment changed.',
                    url: e?.url || '/inbox',
                });
                notifyRealtimePing({
                    title: e?.title ? String(e.title) : 'Task update',
                    body: e?.message || e?.title || 'Task assignment changed.',
                    url: e?.url || '/inbox',
                    tag: e?.task_id != null ? `t-${e.task_id}-${e?.action || 'task'}` : undefined,
                });
                if (hideTimer.current) clearTimeout(hideTimer.current);
                hideTimer.current = setTimeout(clearToast, 7000);
            });
        };

        if (window.Echo) {
            subscribe();
        } else {
            retryTimer = setInterval(() => {
                if (window.Echo) {
                    clearInterval(retryTimer);
                    retryTimer = null;
                    subscribe();
                }
            }, 500);
        }

        return () => {
            subscribedRef.current = false;
            if (retryTimer) {
                clearInterval(retryTimer);
            }
            if (hideTimer.current) clearTimeout(hideTimer.current);
            if (ch) {
                try {
                    ch.stopListening('.inbox.message');
                } catch {
                    /* ignore */
                }
                try {
                    ch.stopListening('.inbox.task');
                } catch {
                    /* ignore */
                }
                try {
                    window.Echo.leave(channelName);
                } catch {
                    /* ignore */
                }
            }
        };
    }, [userId, clearToast]);

    if (!toast) {
        return null;
    }

    return (
        <div className="fixed bottom-4 right-4 z-[100] max-w-sm animate-in fade-in slide-in-from-bottom-2 duration-200">
            <button
                type="button"
                onClick={() => {
                    clearToast();
                    try {
                        const u = new URL(toast.url, window.location.origin);
                        router.visit(u.pathname + u.search);
                    } catch {
                        router.visit(toast.url);
                    }
                }}
                className="w-full text-left rounded-xl border border-neutral-700 bg-neutral-900/95 shadow-xl shadow-black/40 px-4 py-3 backdrop-blur-sm hover:border-neutral-500 transition"
            >
                <div className="text-sm font-semibold text-white truncate">{toast.title}</div>
                <div className="text-xs text-neutral-300 mt-1 line-clamp-3">{toast.body}</div>
                <div className="text-[11px] text-purple-400 mt-2 font-medium">Click to open</div>
            </button>
            <button
                type="button"
                onClick={clearToast}
                className="absolute -top-2 -left-2 h-6 w-6 rounded-full bg-neutral-800 border border-neutral-600 text-neutral-400 text-xs leading-6 hover:text-white"
                aria-label="Dismiss"
            >
                ×
            </button>
        </div>
    );
}
