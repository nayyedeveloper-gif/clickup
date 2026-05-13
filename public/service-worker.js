/**
 * 29 Management — Web Push Service Worker
 */

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
    let data = {};
    try {
        data = event.data ? event.data.json() : {};
    } catch (e) {
        data = { title: '29 Management', body: event.data ? event.data.text() : '' };
    }

    const title = data.title || '29 Management';
    const options = {
        body: data.body || '',
        icon: data.icon || '/logo.png',
        badge: data.badge || '/logo.png',
        tag: data.tag || undefined,
        data: { url: data.url || '/' },
        requireInteraction: true,
    };

    // Delay slightly; skip the OS banner if the user already has this app focused in a tab
    // (in-app realtime handles that case). Still deliver push when all tabs are closed.
    const SHOW_DELAY_MS = 5000;
    event.waitUntil(
        (async () => {
            try {
                const clients = await self.clients.matchAll({
                    type: 'window',
                    includeUncontrolled: true,
                });
                const hasFocusedAppTab = clients.some((c) => c.focused === true);
                if (hasFocusedAppTab) {
                    return;
                }
            } catch (_) {
                /* continue — show notification */
            }

            await new Promise((r) => setTimeout(r, SHOW_DELAY_MS));

            try {
                await self.registration.showNotification(title, options);
            } catch (_) {
                /* noop */
            }
        })()
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const targetUrl = (event.notification.data && event.notification.data.url) || '/';

    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
            // Focus an open tab on the same origin if possible
            for (const client of clients) {
                try {
                    const clientUrl = new URL(client.url);
                    const target = new URL(targetUrl, self.location.origin);
                    if (clientUrl.origin === target.origin && 'focus' in client) {
                        client.focus();
                        client.postMessage({ type: 'push-click', url: targetUrl });
                        return;
                    }
                } catch (_) { /* ignore */ }
            }
            if (self.clients.openWindow) {
                return self.clients.openWindow(targetUrl);
            }
        })
    );
});
