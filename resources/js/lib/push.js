import axios from 'axios';

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const raw = window.atob(base64);
    const output = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
    return output;
}

export function isPushSupported() {
    return (
        typeof window !== 'undefined' &&
        'serviceWorker' in navigator &&
        'PushManager' in window &&
        'Notification' in window
    );
}

export async function ensureServiceWorker() {
    if (!('serviceWorker' in navigator)) return null;
    try {
        const existing = await navigator.serviceWorker.getRegistration('/');
        if (existing) return existing;
        return await navigator.serviceWorker.register('/service-worker.js', { scope: '/' });
    } catch (e) {
        console.warn('[push] Service worker registration failed', e);
        return null;
    }
}

export async function getCurrentSubscription() {
    const reg = await ensureServiceWorker();
    if (!reg) return null;
    try {
        return await reg.pushManager.getSubscription();
    } catch (_) {
        return null;
    }
}

export async function subscribeUser() {
    if (!isPushSupported()) throw new Error('Push is not supported in this browser.');
    const reg = await ensureServiceWorker();
    if (!reg) throw new Error('Service worker unavailable.');

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') throw new Error('Permission denied.');

    // Fetch the public VAPID key from the server
    const { data } = await axios.get(route('push.public-key'));
    const publicKey = data?.public_key;
    if (!publicKey) throw new Error('VAPID public key missing.');

    const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
    });

    // Send subscription to backend
    const sub = subscription.toJSON();
    await axios.post(route('push.subscribe'), {
        endpoint: sub.endpoint,
        keys: {
            p256dh: sub.keys.p256dh,
            auth: sub.keys.auth,
        },
    });

    return subscription;
}

export async function unsubscribeUser() {
    const sub = await getCurrentSubscription();
    if (!sub) return;
    const endpoint = sub.endpoint;
    try { await sub.unsubscribe(); } catch (_) { /* ignore */ }
    try { await axios.post(route('push.unsubscribe'), { endpoint }); } catch (_) { /* ignore */ }
}

export async function sendTestPush() {
    await axios.post(route('push.test'));
}
