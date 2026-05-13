import { useCallback, useEffect, useState } from 'react';
import { Bell, BellOff, CheckCircle2, Volume2, VolumeX, MonitorSmartphone } from 'lucide-react';
import {
    getCurrentSubscription,
    isPushSupported,
    sendTestPush,
    subscribeUser,
    unsubscribeUser,
} from '@/lib/push';
import {
    readSoundEnabled,
    readSystemAlertsEnabled,
    STORAGE_SOUND_KEY,
    STORAGE_SYSTEM_KEY,
    writeSystemAlertsEnabled,
} from '@/lib/realtimeAlerts';

function dispatchPrefsChanged() {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('notifications-prefs-changed'));
    }
}

export default function NotificationsSection() {
    const [supported, setSupported] = useState(true);
    const [permission, setPermission] = useState(
        typeof Notification !== 'undefined' ? Notification.permission : 'default'
    );
    const [subscribed, setSubscribed] = useState(false);
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const [soundOn, setSoundOn] = useState(() => readSoundEnabled());
    const [systemOn, setSystemOn] = useState(() => readSystemAlertsEnabled());

    const syncFromStorage = useCallback(() => {
        setSoundOn(readSoundEnabled());
        setSystemOn(readSystemAlertsEnabled());
    }, []);

    useEffect(() => {
        setSupported(isPushSupported());
        getCurrentSubscription().then((s) => setSubscribed(!!s));
        syncFromStorage();
        window.addEventListener('storage', syncFromStorage);
        window.addEventListener('notifications-prefs-changed', syncFromStorage);
        return () => {
            window.removeEventListener('storage', syncFromStorage);
            window.removeEventListener('notifications-prefs-changed', syncFromStorage);
        };
    }, [syncFromStorage]);

    const setSound = (on) => {
        try {
            window.localStorage.setItem(STORAGE_SOUND_KEY, on ? '1' : '0');
        } catch {
            /* ignore */
        }
        setSoundOn(on);
        dispatchPrefsChanged();
    };

    const setSystem = (on) => {
        writeSystemAlertsEnabled(on);
        setSystemOn(on);
        dispatchPrefsChanged();
    };

    const onRequestBrowserPermission = async () => {
        if (!('Notification' in window)) {
            return;
        }
        setBusy(true);
        setError('');
        try {
            const p = await Notification.requestPermission();
            setPermission(p);
            if (p === 'granted') {
                setMessage('Browser alerts allowed. They appear when this tab is in the background.');
            }
        } catch (e) {
            setError(e?.message || 'Could not request permission.');
        } finally {
            setBusy(false);
        }
    };

    const onEnable = async () => {
        setBusy(true);
        setError('');
        setMessage('');
        try {
            await subscribeUser();
            setSubscribed(true);
            setPermission(Notification.permission);
            setMessage('Push notifications enabled (works when the app is closed or offline).');
        } catch (e) {
            setError(e?.message || 'Failed to enable notifications.');
        } finally {
            setBusy(false);
        }
    };

    const onDisable = async () => {
        setBusy(true);
        setError('');
        setMessage('');
        try {
            await unsubscribeUser();
            setSubscribed(false);
            setMessage('Push notifications disabled.');
        } catch (e) {
            setError(e?.message || 'Failed to disable notifications.');
        } finally {
            setBusy(false);
        }
    };

    const onTest = async () => {
        setBusy(true);
        setError('');
        setMessage('');
        try {
            await sendTestPush();
            setMessage('Test sent. Check your system notification tray in a few seconds.');
        } catch (e) {
            setError(e?.message || 'Failed to send test.');
        } finally {
            setBusy(false);
        }
    };

    if (!supported) {
        return (
            <div className="text-sm text-neutral-400">
                Your browser does not support push notifications.
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="rounded-lg border border-neutral-800 bg-neutral-950/40 p-4 space-y-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    While using the app
                </div>
                <label className="flex items-center justify-between gap-3 cursor-pointer">
                    <div className="flex items-start gap-2">
                        {soundOn ? <Volume2 size={18} className="text-purple-300 mt-0.5" /> : <VolumeX size={18} className="text-neutral-500 mt-0.5" />}
                        <div>
                            <div className="text-sm font-medium text-white">In-app sound</div>
                            <div className="text-xs text-neutral-400 mt-0.5">
                                Short chime when a new message or task update arrives (same as the bell menu toggle).
                            </div>
                        </div>
                    </div>
                    <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-neutral-600 bg-neutral-900"
                        checked={soundOn}
                        onChange={(e) => setSound(e.target.checked)}
                    />
                </label>

                <label className="flex items-center justify-between gap-3 cursor-pointer">
                    <div className="flex items-start gap-2">
                        <MonitorSmartphone size={18} className="text-purple-300 mt-0.5" />
                        <div>
                            <div className="text-sm font-medium text-white">Background browser alerts</div>
                            <div className="text-xs text-neutral-400 mt-0.5">
                                When this tab is not visible, show a desktop / mobile system notification for chats and
                                tasks (Viber-style). Requires permission below.
                            </div>
                        </div>
                    </div>
                    <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-neutral-600 bg-neutral-900"
                        checked={systemOn}
                        onChange={(e) => setSystem(e.target.checked)}
                    />
                </label>

                {permission !== 'granted' && (
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                        <button
                            type="button"
                            disabled={busy || permission === 'denied'}
                            onClick={onRequestBrowserPermission}
                            className="px-3 py-1.5 text-xs rounded-md bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 disabled:opacity-60"
                        >
                            {permission === 'denied' ? 'Alerts blocked in browser' : 'Allow browser alerts'}
                        </button>
                        {permission === 'denied' && (
                            <span className="text-xs text-amber-400">Unblock this site in browser settings.</span>
                        )}
                    </div>
                )}
            </div>

            <div className="flex items-start gap-3">
                <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${subscribed ? 'bg-emerald-500/15 text-emerald-400' : 'bg-neutral-800 text-neutral-400'}`}
                >
                    {subscribed ? <Bell size={18} /> : <BellOff size={18} />}
                </div>
                <div className="flex-1">
                    <div className="text-sm font-medium text-white">Push notifications</div>
                    <div className="text-xs text-neutral-400 mt-0.5">
                        Server push when you are offline or the app is closed (uses the same permission as browser
                        alerts when you enable).
                    </div>
                    {permission === 'denied' && (
                        <div className="mt-2 text-xs text-amber-400">
                            Notifications are blocked in your browser settings. Enable them for this site to
                            continue.
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {subscribed ? (
                        <>
                            <button
                                type="button"
                                disabled={busy}
                                onClick={onTest}
                                className="px-3 py-1.5 text-xs rounded-md bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 disabled:opacity-60"
                            >
                                Send test
                            </button>
                            <button
                                type="button"
                                disabled={busy}
                                onClick={onDisable}
                                className="px-3 py-1.5 text-xs rounded-md border border-red-900/50 text-red-300 hover:bg-red-500/10 disabled:opacity-60"
                            >
                                Disable
                            </button>
                        </>
                    ) : (
                        <button
                            type="button"
                            disabled={busy || permission === 'denied'}
                            onClick={onEnable}
                            className="px-3 py-1.5 text-xs rounded-md bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-60"
                        >
                            Enable push
                        </button>
                    )}
                </div>
            </div>

            {message && (
                <div className="flex items-center gap-2 text-xs text-emerald-400">
                    <CheckCircle2 size={12} /> {message}
                </div>
            )}
            {error && <div className="text-xs text-red-400">{error}</div>}
        </div>
    );
}
