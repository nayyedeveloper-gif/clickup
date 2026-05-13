import { useEffect, useState } from 'react';
import axios from 'axios';
import { Globe } from 'lucide-react';

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
            const fallback = { url, error: 'failed' };
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

    useEffect(() => {
        if (!url) return;
        let active = true;
        setLoading(true);
        fetchPreview(url).then((d) => {
            if (active) {
                setData(d);
                setLoading(false);
            }
        });
        return () => { active = false; };
    }, [url]);

    if (loading || !data || data.error || (!data.title && !data.description && !data.image)) {
        return null;
    }

    return (
        <a
            href={data.url || url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 block max-w-md rounded-lg overflow-hidden border border-neutral-800 bg-neutral-900/60 hover:bg-neutral-900 transition group"
        >
            {data.image && (
                <div className="w-full aspect-[1.91/1] bg-neutral-950 overflow-hidden">
                    <img
                        src={data.image}
                        alt=""
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform"
                        onError={(e) => { e.target.style.display = 'none'; }}
                    />
                </div>
            )}
            <div className="px-3 py-2.5 space-y-1">
                <div className="flex items-center gap-1.5 text-[11px] text-neutral-500">
                    <Globe size={10} />
                    <span className="truncate">{data.site_name || data.host}</span>
                </div>
                {data.title && (
                    <div className="text-sm font-semibold text-white leading-snug line-clamp-2">
                        {data.title}
                    </div>
                )}
                {data.description && (
                    <div className="text-[12.5px] text-neutral-400 leading-snug line-clamp-2">
                        {data.description}
                    </div>
                )}
            </div>
        </a>
    );
}
