import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { Bell, CheckCheck, MessageSquare, ListTodo, X } from 'lucide-react';
import { notifyRealtimePing, readSoundEnabled, STORAGE_SOUND_KEY } from '@/lib/realtimeAlerts';

export const CLOSE_NOTIFICATION_EVENT = 'app:close-notification-dropdown';
export const CLOSE_PROFILE_EVENT = 'app:close-profile-dropdown';

function relativeTime(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    const diff = (Date.now() - d.getTime()) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
    return d.toLocaleDateString();
}

function iconForType(type) {
    if (type === 'task') return ListTodo;
    return MessageSquare;
}

export default function NotificationBell() {
    const { props } = usePage();
    const auth = props.auth;
    const initialNotifications = props.notifications || { items: [], unread_count: 0 };

    const [items, setItems] = useState(initialNotifications.items || []);
    const [unreadCount, setUnreadCount] = useState(initialNotifications.unread_count || 0);
    const [open, setOpen] = useState(false);
    const [busy, setBusy] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(() => {
        if (typeof window === 'undefined') return true;
        const v = window.localStorage.getItem(STORAGE_SOUND_KEY);
        return v === null ? true : v === '1';
    });

    const dropdownRef = useRef(null);
    const bellRef = useRef(null);
    const seenIds = useRef(new Set(items.map((i) => i.id)));
    const [panelPos, setPanelPos] = useState({ top: 0, left: 0, width: 360, maxListH: 460 });

    // Sync server-pushed Inertia props if they refresh
    useEffect(() => {
        setItems(initialNotifications.items || []);
        setUnreadCount(initialNotifications.unread_count || 0);
        seenIds.current = new Set((initialNotifications.items || []).map((i) => i.id));
    }, [initialNotifications]);

    // Persist sound preference + notify Profile / other tabs
    useEffect(() => {
        try { window.localStorage.setItem(STORAGE_SOUND_KEY, soundEnabled ? '1' : '0'); } catch (_) { /* noop */ }
        window.dispatchEvent(new Event('notifications-prefs-changed'));
    }, [soundEnabled]);

    useEffect(() => {
        const sync = () => setSoundEnabled(readSoundEnabled());
        window.addEventListener('notifications-prefs-changed', sync);
        window.addEventListener('storage', sync);
        return () => {
            window.removeEventListener('notifications-prefs-changed', sync);
            window.removeEventListener('storage', sync);
        };
    }, []);

    // Close when Profile (or anything else) asks us to
    useEffect(() => {
        const onClose = () => setOpen(false);
        document.addEventListener(CLOSE_NOTIFICATION_EVENT, onClose);
        return () => document.removeEventListener(CLOSE_NOTIFICATION_EVENT, onClose);
    }, []);

    // Close dropdown on outside click (portal panel lives on document.body)
    useEffect(() => {
        if (!open) return;
        const handler = (e) => {
            if (
                dropdownRef.current && !dropdownRef.current.contains(e.target) &&
                bellRef.current && !bellRef.current.contains(e.target)
            ) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    const updatePanelPosition = useCallback(() => {
        const bell = bellRef.current;
        if (!bell) return;
        const rect = bell.getBoundingClientRect();
        const margin = 8;
        const width = Math.min(360, window.innerWidth - margin * 2);
        let left = rect.right - width;
        left = Math.max(margin, Math.min(left, window.innerWidth - width - margin));
        const top = rect.bottom + margin;
        const reserved = 120; // header + footer + padding
        const maxListH = Math.max(160, Math.min(460, window.innerHeight - top - reserved));
        setPanelPos({ top, left, width, maxListH });
    }, []);

    useLayoutEffect(() => {
        if (!open) return;
        updatePanelPosition();
        const onResize = () => updatePanelPosition();
        window.addEventListener('resize', onResize);
        window.addEventListener('scroll', onResize, true);
        return () => {
            window.removeEventListener('resize', onResize);
            window.removeEventListener('scroll', onResize, true);
        };
    }, [open, updatePanelPosition]);

    // Listen for new notifications via Echo
    useEffect(() => {
        if (!auth?.user?.id || !window.Echo) return;

        const channel = window.Echo.private(`App.Models.User.${auth.user.id}`);

        const onCreated = (payload) => {
            // Laravel broadcasts notifications with the data wrapped under "type" + actual fields.
            // Our toBroadcast() returns the data array; Echo wraps it with an "id" key.
            const data = payload || {};
            const id = data.id || `temp-${Date.now()}`;

            if (seenIds.current.has(id)) return;
            seenIds.current.add(id);

            const newItem = {
                id,
                type: data.type || 'generic',
                title: data.title || 'New notification',
                preview: data.preview || '',
                url: data.url || null,
                data,
                read_at: null,
                created_at: new Date().toISOString(),
            };

            setItems((prev) => [newItem, ...prev].slice(0, 50));
            setUnreadCount((c) => c + 1);

            const dedupeTag =
                data.message_id != null
                    ? `m-${data.message_id}`
                    : data.task_id != null
                        ? `t-${data.task_id}-${data.event || 'task'}`
                        : `n-${id}`;

            notifyRealtimePing({
                title: newItem.title,
                body: newItem.preview || '',
                url: newItem.url || '/',
                tag: dedupeTag,
            });
        };

        channel.notification(onCreated);

        return () => {
            try { window.Echo.leave(`App.Models.User.${auth.user.id}`); } catch (_) { /* noop */ }
        };
    }, [auth?.user?.id]);

    const markRead = useCallback(async (notification) => {
        if (notification.read_at) return;
        try {
            const res = await axios.post(route('notifications.read', notification.id));
            setItems((prev) => prev.map((n) => n.id === notification.id ? { ...n, read_at: new Date().toISOString() } : n));
            setUnreadCount(res.data?.unread_count ?? 0);
        } catch (_) { /* noop */ }
    }, []);

    const markAllRead = useCallback(async () => {
        if (unreadCount === 0) return;
        setBusy(true);
        try {
            await axios.post(route('notifications.read-all'));
            setItems((prev) => prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() })));
            setUnreadCount(0);
        } catch (_) { /* noop */ } finally {
            setBusy(false);
        }
    }, [unreadCount]);

    const handleItemClick = useCallback((notification) => {
        markRead(notification);
        setOpen(false);
        if (notification.url) {
            try {
                const u = new URL(notification.url, window.location.origin);
                router.visit(u.pathname + u.search);
            } catch (_) {
                window.location.href = notification.url;
            }
        }
    }, [markRead]);

    const removeItem = useCallback(async (e, notification) => {
        e.stopPropagation();
        try {
            const res = await axios.delete(route('notifications.destroy', notification.id));
            setItems((prev) => prev.filter((n) => n.id !== notification.id));
            setUnreadCount(res.data?.unread_count ?? 0);
        } catch (_) { /* noop */ }
    }, []);

    const display = useMemo(() => unreadCount > 99 ? '99+' : unreadCount, [unreadCount]);

    return (
        <div className="relative">
            <button
                ref={bellRef}
                type="button"
                onClick={() =>
                    setOpen((o) => {
                        const next = !o;
                        if (next) {
                            document.dispatchEvent(new Event(CLOSE_PROFILE_EVENT));
                        }
                        return next;
                    })
                }
                className="relative w-9 h-9 rounded-lg inline-flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
                aria-label="Notifications"
            >
                <Bell size={18} />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 inline-flex items-center justify-center text-[10px] font-bold text-white bg-red-500 rounded-full ring-2 ring-neutral-950 animate-pulse">
                        {display}
                    </span>
                )}
            </button>

            {open &&
                typeof document !== 'undefined' &&
                createPortal(
                    <div
                        ref={dropdownRef}
                        className="fixed z-[600] bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl overflow-hidden flex flex-col"
                        style={{
                            top: panelPos.top,
                            left: panelPos.left - 280,
                            width: panelPos.width,
                            maxHeight: `min(calc(100vh - ${panelPos.top + 8}px), 560px)`,
                        }}
                    >
                    {/* Header */}
                    <div className="flex shrink-0 items-center justify-between gap-2 px-4 py-3 border-b border-neutral-800">
                        <div>
                            <div className="text-sm font-semibold text-white">Notifications</div>
                            <div className="text-[11px] text-neutral-500">
                                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
                                <span className="text-neutral-700"> · </span>
                                <span className="text-neutral-500">အကြောင်းကြားချက်များ</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                onClick={() => setSoundEnabled((s) => !s)}
                                className={`text-[10px] px-2 py-1 rounded-md border ${
                                    soundEnabled
                                        ? 'border-emerald-700 text-emerald-300 bg-emerald-500/10'
                                        : 'border-neutral-700 text-neutral-400 bg-neutral-800'
                                }`}
                                title={soundEnabled ? 'Sound on' : 'Sound off'}
                            >
                                {soundEnabled ? '🔔' : '🔕'}
                            </button>
                            {unreadCount > 0 && (
                                <button
                                    type="button"
                                    onClick={markAllRead}
                                    disabled={busy}
                                    className="text-[11px] inline-flex items-center gap-1 text-purple-400 hover:text-purple-300 disabled:opacity-60"
                                >
                                    <CheckCheck size={12} /> Read all
                                </button>
                            )}
                        </div>
                    </div>

                    {/* List */}
                    <div className="min-h-0 flex-1 overflow-y-auto" style={{ maxHeight: panelPos.maxListH }}>
                        {items.length === 0 ? (
                            <div className="px-6 py-12 text-center">
                                <div className="mx-auto w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center mb-3">
                                    <Bell size={20} className="text-neutral-600" />
                                </div>
                                <p className="text-xs text-neutral-500">No notifications yet</p>
                                <p className="text-[11px] text-neutral-600 mt-1">အကြောင်းကြားချက် မရှိသေးပါ</p>
                            </div>
                        ) : items.map((n) => {
                            const Icon = iconForType(n.type);
                            const unread = !n.read_at;
                            return (
                                <button
                                    key={n.id}
                                    type="button"
                                    onClick={() => handleItemClick(n)}
                                    className={`group w-full text-left flex items-start gap-3 px-4 py-3 border-b border-neutral-800/60 last:border-b-0 transition ${
                                        unread ? 'bg-neutral-900 hover:bg-neutral-800/70' : 'bg-neutral-950 hover:bg-neutral-900'
                                    }`}
                                >
                                    <div className={`shrink-0 w-9 h-9 rounded-lg inline-flex items-center justify-center ${
                                        unread ? 'bg-purple-500/15 text-purple-300' : 'bg-neutral-800 text-neutral-500'
                                    }`}>
                                        <Icon size={16} />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className={`text-sm truncate ${unread ? 'text-white font-semibold' : 'text-neutral-300'}`}>
                                                {n.title}
                                            </span>
                                            <span className="text-[10px] text-neutral-500 shrink-0 tabular-nums">
                                                {relativeTime(n.created_at)}
                                            </span>
                                        </div>
                                        {n.preview && (
                                            <p className={`text-xs mt-0.5 truncate ${unread ? 'text-neutral-300' : 'text-neutral-500'}`}>
                                                {n.preview}
                                            </p>
                                        )}
                                    </div>

                                    <div className="shrink-0 flex flex-col items-center gap-1">
                                        {unread && (
                                            <span className="w-2 h-2 rounded-full bg-purple-500" />
                                        )}
                                        <span
                                            role="button"
                                            tabIndex={0}
                                            onClick={(e) => removeItem(e, n)}
                                            className="opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-red-400 transition cursor-pointer"
                                            title="Remove"
                                        >
                                            <X size={12} />
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Footer */}
                    {items.length > 0 && (
                        <div className="shrink-0 px-4 py-2.5 border-t border-neutral-800 text-center bg-neutral-950">
                            <span className="text-[10px] text-neutral-600">
                                Click a notification to open · Read မလုပ်မချင်း List တွင်တည်ရှိနေမည်
                            </span>
                        </div>
                    )}
                    </div>,
                    document.body
                )}
        </div>
    );
}
