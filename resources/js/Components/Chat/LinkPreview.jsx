import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Globe, Link2 } from 'lucide-react';

const URL_REGEX = /\bhttps?:\/\/[^\s<>"')]+/i;

/**
 * Extract the first http(s) URL from a string.
 */
export function extractFirstUrl(text) {
    if (!text || typeof text !== 'string') return null;
    const match = text.match(URL_REGEX);
    return match ? match[0] : null;
}

// In-memory cache to avoid refetching the same URL within a session.
const cache = new Map();
const pending = new Map();

function hostFromUrl(u) {
    try {
        return new URL(u).hostname.replace(/^www\./i, '') || '';
    } catch {
        return '';
    }
}

function faviconUrlForHost(host) {
    if (!host) return null;
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=64`;
}

function fetchPreview(url) {
    if (cache.has(url)) return Promise.resolve(cache.get(url));
    if (pending.has(url)) return pending.get(url);
    const p = axios
        .get(route('link-preview'), { params: { url } })
        .then((r) => {
            cache.set(url, r.data);
            return r.data;
        })
        .catch(() => {
            const fallback = {
                url,
                error: 'failed',
                host: hostFromUrl(url),
            };
            cache.set(url, fallback);
            return fallback;
        })
        .finally(() => {
            pending.delete(url);
        });
    pending.set(url, p);
    return p;
}

export default function LinkPreview({ url }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    /** After og image fails, fall back to favicon; after favicon fails, hide thumbnail column. */
    const [thumbPhase, setThumbPhase] = useState(0);

    useEffect(() => {
        if (!url) return;
        let active = true;
        setLoading(true);
        setThumbPhase(0);
        fetchPreview(url).then((d) => {
            if (active) {
                setData(d);
                setLoading(false);
            }
        });
        return () => {
            active = false;
        };
    }, [url]);

    const host = useMemo(() => (data?.host ? data.host : hostFromUrl(url)), [data, url]);

    const heroImage = useMemo(() => {
        if (!data) return null;
        if (data.image) return data.image;
        const ct = String(data.content_type || '').toLowerCase();
        if (data.error === 'not_html' && ct.includes('image')) {
            return data.url || url;
        }
        return null;
    }, [data, url]);

    const favicon = useMemo(() => faviconUrlForHost(host), [host]);

    const thumbSrc = useMemo(() => {
        if (thumbPhase >= 2) return null;
        if (thumbPhase === 1) return favicon;
        return heroImage || favicon;
    }, [heroImage, favicon, thumbPhase]);

    const onThumbError = () => {
        if (heroImage && thumbPhase === 0) {
            setThumbPhase(1);
            return;
        }
        setThumbPhase(2);
    };

    if (!url) return null;

    if (loading) {
        return (
            <div className="mt-2 max-w-md overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900/50">
                <div className="flex h-24 animate-pulse">
                    <div className="h-full w-28 shrink-0 bg-neutral-800" />
                    <div className="flex flex-1 flex-col justify-center gap-2 p-3">
                        <div className="h-3 w-40 max-w-[75%] rounded bg-neutral-800" />
                        <div className="h-3 w-24 max-w-[50%] rounded bg-neutral-800" />
                    </div>
                </div>
            </div>
        );
    }

    if (!data) return null;

    const href = data.url || url;
    const title = data.title || data.site_name || host || 'Link';
    const description = data.description;
    const siteLabel = data.site_name || data.host || host;

    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 flex max-w-md overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900/60 transition hover:bg-neutral-900 group"
        >
            {thumbSrc ? (
                <div className="relative h-24 w-28 shrink-0 bg-neutral-950">
                    <img
                        src={thumbSrc}
                        alt=""
                        loading="lazy"
                        key={thumbSrc}
                        className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
                        onError={onThumbError}
                    />
                </div>
            ) : (
                <div className="flex h-24 w-28 shrink-0 items-center justify-center bg-neutral-950 text-neutral-600">
                    <Link2 size={22} strokeWidth={1.5} />
                </div>
            )}
            <div className="flex min-w-0 flex-1 flex-col justify-center space-y-1 px-3 py-2.5">
                <div className="flex items-center gap-1.5 text-[11px] text-neutral-500">
                    <Globe size={10} className="shrink-0" />
                    <span className="truncate">{siteLabel}</span>
                </div>
                <div className="text-sm font-semibold leading-snug text-white line-clamp-2">{title}</div>
                {description ? (
                    <div className="text-[12.5px] leading-snug text-neutral-400 line-clamp-2">{description}</div>
                ) : null}
                <div className="truncate text-[11px] text-purple-300/90">{href}</div>
            </div>
        </a>
    );
}
