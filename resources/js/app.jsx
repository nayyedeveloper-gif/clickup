import '../css/app.css';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import ChatInboxBridge from './Components/Chat/ChatInboxBridge';
import AccessDeniedModal from './Components/AccessDeniedModal';
import { PresenceProvider } from './Contexts/PresenceContext';
import { ensureServiceWorker } from './lib/push';

// Pre-register service worker so push notifications can be received.
// The user still must explicitly allow notifications from Profile settings.
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    ensureServiceWorker().catch(() => {});
}

// Handle "push clicked" messages from the service worker (open the relevant URL)
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
        const { data } = event || {};
        if (data && data.type === 'push-click' && data.url) {
            try {
                const target = new URL(data.url, window.location.origin);
                if (target.pathname + target.search !== window.location.pathname + window.location.search) {
                    window.location.href = target.toString();
                }
            } catch (_) { /* ignore */ }
        }
    });
}

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

function AppWithModal({ Component, ...props }) {
    return (
        <>
            <Component {...props} />
            <AccessDeniedModal />
        </>
    );
}

function AppWithProviders({ App, props }) {
    const currentUserId =
        props?.initialPage?.props?.auth?.user?.id ??
        props?.page?.props?.auth?.user?.id ??
        null;

    // Create a wrapper that includes the modal inside the Inertia tree
    const WrappedApp = (appProps) => <AppWithModal Component={App} {...appProps} />;

    return (
        <PresenceProvider currentUserId={currentUserId}>
            <WrappedApp {...props} />
            {currentUserId ? <ChatInboxBridge userId={currentUserId} /> : null}
        </PresenceProvider>
    );
}

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob('./Pages/**/*.jsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(<AppWithProviders App={App} props={props} />);
    },
    progress: {
        color: '#4B5563',
    },
});
