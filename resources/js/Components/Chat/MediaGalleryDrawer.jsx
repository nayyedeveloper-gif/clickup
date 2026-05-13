import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { X, Image as ImageIcon, Paperclip, Download, Loader2 } from 'lucide-react';

const TABS = [
    { id: 'images', label: 'Images', filter: (i) => i.is_image },
    { id: 'files', label: 'Files', filter: (i) => !i.is_image && !i.is_video && !i.is_audio },
    { id: 'videos', label: 'Videos', filter: (i) => i.is_video },
];

function formatBytes(n) {
    if (!n && n !== 0) return '';
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

/**
 * Media gallery drawer for a DM conversation.
 */
export default function MediaGalleryDrawer({ partner, onClose }) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('images');
    const [lightbox, setLightbox] = useState(null); // attachment object

    useEffect(() => {
        if (!partner?.id) return;
        let active = true;
        setLoading(true);
        axios
            .get(route('messages.media', partner.id))
            .then((r) => {
                if (active) setItems(r.data?.items || []);
            })
            .catch(() => {
                if (active) setItems([]);
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => { active = false; };
    }, [partner?.id]);

    const filtered = useMemo(() => {
        const tabDef = TABS.find((t) => t.id === tab);
        if (!tabDef) return items;
        return items.filter(tabDef.filter);
    }, [items, tab]);

    return (
        <>
            <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <aside className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-md bg-neutral-950 border-l border-neutral-800 flex flex-col shadow-2xl">
                <header className="h-14 px-5 flex items-center gap-3 border-b border-neutral-800 shrink-0">
                    <ImageIcon size={16} className="text-purple-400" />
                    <div className="flex-1 min-w-0">
                        <div className="text-[15px] font-semibold text-white leading-tight truncate">Shared media</div>
                        <div className="text-[11px] text-neutral-500 leading-tight truncate">with {partner?.name}</div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-md"
                    >
                        <X size={16} />
                    </button>
                </header>

                {/* Tabs */}
                <div className="border-b border-neutral-800 px-3 flex items-center gap-1">
                    {TABS.map((t) => (
                        <button
                            key={t.id}
                            type="button"
                            onClick={() => setTab(t.id)}
                            className={`px-3 py-2.5 text-sm border-b-2 transition ${
                                tab === t.id
                                    ? 'border-purple-500 text-white'
                                    : 'border-transparent text-neutral-400 hover:text-white'
                            }`}
                        >
                            {t.label}
                            <span className="ml-1.5 text-[10px] text-neutral-500">
                                {items.filter(t.filter).length}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-3">
                    {loading ? (
                        <div className="flex items-center justify-center py-16 text-neutral-500">
                            <Loader2 size={18} className="animate-spin" />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="inline-flex w-12 h-12 items-center justify-center rounded-full bg-neutral-900 border border-neutral-800 text-neutral-500 mb-3">
                                <ImageIcon size={18} />
                            </div>
                            <div className="text-sm text-neutral-400">No {tab} shared yet</div>
                        </div>
                    ) : tab === 'images' ? (
                        <div className="grid grid-cols-3 gap-1.5">
                            {filtered.map((a) => (
                                <button
                                    key={a.id}
                                    type="button"
                                    onClick={() => setLightbox(a)}
                                    className="aspect-square relative overflow-hidden rounded-md bg-neutral-900 border border-neutral-800 hover:border-purple-500 transition"
                                >
                                    <img
                                        src={a.url}
                                        alt={a.original_name}
                                        loading="lazy"
                                        className="absolute inset-0 w-full h-full object-cover"
                                    />
                                </button>
                            ))}
                        </div>
                    ) : tab === 'videos' ? (
                        <div className="grid grid-cols-2 gap-2">
                            {filtered.map((a) => (
                                <a
                                    key={a.id}
                                    href={a.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block rounded-md overflow-hidden bg-neutral-900 border border-neutral-800 hover:border-purple-500 transition"
                                >
                                    <video
                                        src={a.url}
                                        className="w-full aspect-video object-cover bg-black"
                                        preload="metadata"
                                        muted
                                    />
                                    <div className="px-2 py-1.5 text-[11px] text-neutral-400 truncate">
                                        {a.original_name}
                                    </div>
                                </a>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {filtered.map((a) => (
                                <a
                                    key={a.id}
                                    href={a.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    download
                                    className="flex items-center gap-3 px-3 py-2 rounded-md bg-neutral-900 border border-neutral-800 hover:border-purple-500 transition"
                                >
                                    <Paperclip size={14} className="text-neutral-400 shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm text-neutral-200 truncate">{a.original_name}</div>
                                        <div className="text-[11px] text-neutral-500">{formatBytes(a.size_bytes)}</div>
                                    </div>
                                    <Download size={14} className="text-neutral-400 shrink-0" />
                                </a>
                            ))}
                        </div>
                    )}
                </div>
            </aside>

            {/* Lightbox */}
            {lightbox && (
                <div
                    className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-8"
                    onClick={() => setLightbox(null)}
                >
                    <button
                        type="button"
                        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
                        onClick={() => setLightbox(null)}
                    >
                        <X size={18} />
                    </button>
                    <img
                        src={lightbox.url}
                        alt={lightbox.original_name}
                        className="max-w-full max-h-full object-contain"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </>
    );
}
