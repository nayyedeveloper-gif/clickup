import axios from 'axios';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.axios = axios;

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

/**
 * Initialize CSRF token
 */
let token = document.head.querySelector('meta[name="csrf-token"]');

if (token) {
    window.axios.defaults.headers.common['X-CSRF-TOKEN'] = token.content;
} else {
    console.error('CSRF token not found: https://laravel.com/docs/csrf#csrf-x-csrf-token');
}

/**
 * Initialize Laravel Echo with Reverb
 */
window.Pusher = Pusher;

const csrf = document.head.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

const hostname =
    typeof window !== 'undefined' ? window.location.hostname : 'localhost';
const isLocalHost =
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '[::1]' ||
    hostname.endsWith('.local');

const schemeEnv = import.meta.env.VITE_REVERB_SCHEME;
const scheme =
    schemeEnv === 'http' || schemeEnv === 'https'
        ? schemeEnv
        : typeof window !== 'undefined' && window.location.protocol === 'https:'
          ? 'https'
          : isLocalHost
            ? 'http'
            : 'https';

const forceTLS = scheme === 'https';

const reverbPortRaw = import.meta.env.VITE_REVERB_PORT;
const wsPort = reverbPortRaw !== undefined && reverbPortRaw !== ''
    ? Number(reverbPortRaw)
    : forceTLS
      ? 443
      : 8080;

const reverbKey = import.meta.env.VITE_REVERB_APP_KEY;
if (reverbKey) {
    window.Echo = new Echo({
        broadcaster: 'reverb',
        key: reverbKey,
        wsHost: import.meta.env.VITE_REVERB_HOST ?? hostname,
        wsPort,
        wssPort: wsPort,
        forceTLS,
        enabledTransports: forceTLS ? ['wss'] : ['ws'],
        authEndpoint: `${window.location.origin}/broadcasting/auth`,
        auth: {
            headers: {
                'X-CSRF-TOKEN': csrf || '',
                'X-Requested-With': 'XMLHttpRequest',
            },
        },
    });
} else {
    console.warn('VITE_REVERB_APP_KEY is not set. Skipping Echo initialization.');
}
