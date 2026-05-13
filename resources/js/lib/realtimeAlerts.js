/**
 * Shared realtime UX: in-app chime, optional background browser notifications,
 * light haptic-style vibration on supported mobile browsers.
 *
 * Sound / system toggles align with Profile + NotificationBell localStorage keys.
 */

export const STORAGE_SOUND_KEY = 'notifications.sound.enabled';
export const STORAGE_SYSTEM_KEY = 'notifications.system.enabled';

const DEDupe_MS = 2200;
const recentKeys = new Map();

function pruneRecent(now) {
    if (recentKeys.size < 40) {
        return;
    }
    for (const [k, t] of recentKeys) {
        if (now - t > DEDupe_MS * 3) {
            recentKeys.delete(k);
        }
    }
}

export function readSoundEnabled() {
    if (typeof window === 'undefined') {
        return true;
    }
    const v = window.localStorage.getItem(STORAGE_SOUND_KEY);
    return v === null ? true : v === '1';
}

export function readSystemAlertsEnabled() {
    if (typeof window === 'undefined') {
        return true;
    }
    const v = window.localStorage.getItem(STORAGE_SYSTEM_KEY);
    return v === null ? true : v === '1';
}

export function writeSystemAlertsEnabled(on) {
    if (typeof window === 'undefined') {
        return;
    }
    try {
        window.localStorage.setItem(STORAGE_SYSTEM_KEY, on ? '1' : '0');
    } catch {
        /* ignore */
    }
}

/**
 * Soft two-tone chime (Web Audio API). Respects readSoundEnabled().
 */
export function playNotificationChime() {
    if (!readSoundEnabled()) {
        return;
    }
    try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) {
            return;
        }
        const ctx = new AC();
        const now = ctx.currentTime;

        const playTone = (freq, start, duration, gain = 0.18) => {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = freq;
            g.gain.setValueAtTime(0, now + start);
            g.gain.linearRampToValueAtTime(gain, now + start + 0.02);
            g.gain.exponentialRampToValueAtTime(0.0001, now + start + duration);
            osc.connect(g).connect(ctx.destination);
            osc.start(now + start);
            osc.stop(now + start + duration + 0.05);
        };

        playTone(880, 0, 0.18);
        playTone(1318.5, 0.12, 0.22);

        setTimeout(() => {
            try {
                ctx.close();
            } catch {
                /* noop */
            }
        }, 800);
    } catch {
        /* non-essential */
    }
}

export function pulseMobileAlert() {
    try {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate([70, 35, 70]);
        }
    } catch {
        /* noop */
    }
}

/**
 * OS-level browser notification when the tab is in the background (or PWA not focused).
 */
export function showBackgroundBrowserNotification({ title, body, tag, url }) {
    if (typeof window === 'undefined' || !('Notification' in window)) {
        return;
    }
    if (Notification.permission !== 'granted' || !readSystemAlertsEnabled()) {
        return;
    }
    if (!document.hidden) {
        return;
    }

    const icon = `${window.location.origin}/pwa-icon-192.png`;
    const targetUrl = url || '/';

    try {
        const n = new Notification(title || '29 Management', {
            body: body || '',
            icon,
            tag: tag || 'default',
            data: { url: targetUrl },
        });
        n.onclick = () => {
            try {
                window.focus();
                n.close();
                const u = targetUrl.startsWith('http')
                    ? targetUrl
                    : `${window.location.origin}${targetUrl.startsWith('/') ? '' : '/'}${targetUrl}`;
                window.location.href = u;
            } catch {
                /* noop */
            }
        };
    } catch {
        /* noop */
    }
}

/**
 * One entry point for chat/task inbox nudges and similar realtime pings.
 * Deduplicates rapid double delivery (e.g. inbox nudge + database notification broadcast).
 */
export function notifyRealtimePing({ title, body, tag, url }) {
    const now = Date.now();
    const key = tag || `${title}|${body}|${url || ''}`;
    const prev = recentKeys.get(key);
    if (prev && now - prev < DEDupe_MS) {
        return;
    }
    recentKeys.set(key, now);
    pruneRecent(now);

    playNotificationChime();
    pulseMobileAlert();
    showBackgroundBrowserNotification({ title, body, tag: key, url });
}
