import { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { usePage } from '@inertiajs/react';
import { CornerUpRight, Search, X, Check } from 'lucide-react';
import Avatar from './Avatar';

/**
 * Modal to forward a message to one or more users (DMs) or channels.
 */
export default function ForwardMessageModal({ message, onClose, onForwarded }) {
    const { props } = usePage();
    const sidebar = props.sidebar || {};
    const allMembers = sidebar.allMembers || [];
    const channels = sidebar.channels || [];

    const [query, setQuery] = useState('');
    const [selected, setSelected] = useState([]); // array of { type, id, name }
    const [comment, setComment] = useState('');
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');
    const inputRef = useRef(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const filteredUsers = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return allMembers.slice(0, 50);
        return allMembers
            .filter((u) => u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q))
            .slice(0, 50);
    }, [allMembers, query]);

    const filteredChannels = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return channels.slice(0, 50);
        return channels.filter((c) => c.name?.toLowerCase().includes(q)).slice(0, 50);
    }, [channels, query]);

    const isSelected = (type, id) =>
        selected.some((s) => s.type === type && s.id === id);

    const toggleSelect = (entry) => {
        setSelected((prev) =>
            prev.some((s) => s.type === entry.type && s.id === entry.id)
                ? prev.filter((s) => !(s.type === entry.type && s.id === entry.id))
                : [...prev, entry]
        );
    };

    const submit = async (e) => {
        e?.preventDefault();
        if (selected.length === 0 || sending) return;
        setSending(true);
        setError('');
        try {
            const recipients = selected.map((s) => ({ type: s.type, id: s.id }));
            const res = await axios.post(route('messages.forward', message.id), {
                recipients,
                comment: comment.trim() || null,
            });
            onForwarded?.(res.data?.messages || []);
            onClose?.();
        } catch (err) {
            setError(err?.response?.data?.message || 'Failed to forward.');
        } finally {
            setSending(false);
        }
    };

    const preview =
        message?.type === 'sticker'
            ? `Sticker ${message.sticker_key || ''}`
            : (message?.content || '').slice(0, 200);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="px-5 py-3 border-b border-neutral-800 flex items-center gap-2">
                    <CornerUpRight size={16} className="text-purple-400" />
                    <h3 className="text-[15px] font-semibold text-white flex-1">Forward message</h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white"
                    >
                        <X size={16} />
                    </button>
                </header>

                {/* Original message preview */}
                <div className="px-5 py-3 border-b border-neutral-800 bg-neutral-950/50">
                    <div className="text-[11px] uppercase tracking-wide text-neutral-500 mb-1">Forwarding</div>
                    <div className="flex items-start gap-2">
                        <Avatar name={message?.sender?.name} src={message?.sender?.avatar_url} size="sm" />
                        <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-neutral-300">{message?.sender?.name}</div>
                            <div className="text-sm text-neutral-400 break-words line-clamp-3">
                                {preview || <span className="italic text-neutral-500">(attachment only)</span>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search */}
                <div className="px-4 pt-3">
                    <div className="flex items-center gap-2 h-9 px-3 rounded-lg bg-neutral-950 border border-neutral-800 focus-within:border-neutral-700">
                        <Search size={13} className="text-neutral-500 shrink-0" />
                        <input
                            ref={inputRef}
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search members or channels…"
                            className="flex-1 bg-transparent text-sm text-white placeholder:text-neutral-500 outline-none"
                        />
                    </div>
                </div>

                {/* Selected chips */}
                {selected.length > 0 && (
                    <div className="px-4 pt-3 flex flex-wrap gap-1.5">
                        {selected.map((s) => (
                            <span
                                key={`${s.type}-${s.id}`}
                                className="inline-flex items-center gap-1 pl-2 pr-1 h-6 rounded-full text-[11px] bg-purple-500/15 border border-purple-500/40 text-purple-200"
                            >
                                {s.type === 'channel' ? `# ${s.name}` : s.name}
                                <button
                                    type="button"
                                    onClick={() => toggleSelect(s)}
                                    className="w-4 h-4 rounded-full hover:bg-purple-500/30 flex items-center justify-center"
                                >
                                    <X size={10} />
                                </button>
                            </span>
                        ))}
                    </div>
                )}

                {/* Results list */}
                <div className="max-h-72 overflow-y-auto py-2 px-2">
                    {filteredChannels.length > 0 && (
                        <>
                            <div className="px-3 py-1 text-[10px] uppercase tracking-wider text-neutral-500">Channels</div>
                            {filteredChannels.map((c) => {
                                const selectedRow = isSelected('channel', c.id);
                                return (
                                    <button
                                        key={`ch-${c.id}`}
                                        type="button"
                                        onClick={() => toggleSelect({ type: 'channel', id: c.id, name: c.name })}
                                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-left transition ${
                                            selectedRow ? 'bg-purple-500/10' : 'hover:bg-neutral-800/70'
                                        }`}
                                    >
                                        <div className="w-6 h-6 rounded bg-neutral-800 text-neutral-400 flex items-center justify-center text-xs">#</div>
                                        <span className="flex-1 text-sm text-neutral-200 truncate">{c.name}</span>
                                        {selectedRow && <Check size={14} className="text-purple-400" />}
                                    </button>
                                );
                            })}
                        </>
                    )}

                    {filteredUsers.length > 0 && (
                        <>
                            <div className="px-3 py-1 text-[10px] uppercase tracking-wider text-neutral-500 mt-2">People</div>
                            {filteredUsers.map((u) => {
                                const selectedRow = isSelected('user', u.id);
                                return (
                                    <button
                                        key={`u-${u.id}`}
                                        type="button"
                                        onClick={() => toggleSelect({ type: 'user', id: u.id, name: u.name })}
                                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-left transition ${
                                            selectedRow ? 'bg-purple-500/10' : 'hover:bg-neutral-800/70'
                                        }`}
                                    >
                                        <Avatar name={u.name} src={u.avatar_url} size="sm" />
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm text-neutral-200 truncate">{u.name}</div>
                                            <div className="text-[11px] text-neutral-500 truncate">{u.email}</div>
                                        </div>
                                        {selectedRow && <Check size={14} className="text-purple-400" />}
                                    </button>
                                );
                            })}
                        </>
                    )}

                    {filteredUsers.length === 0 && filteredChannels.length === 0 && (
                        <div className="px-4 py-8 text-center text-xs text-neutral-500">No matches</div>
                    )}
                </div>

                {/* Comment + submit */}
                <form onSubmit={submit} className="p-4 border-t border-neutral-800 space-y-3">
                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Add a comment (optional)"
                        rows={2}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-md px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 outline-none resize-none"
                    />
                    {error && <div className="text-xs text-red-400">{error}</div>}
                    <div className="flex items-center justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-3 py-1.5 text-sm text-neutral-300 hover:text-white"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={selected.length === 0 || sending}
                            className="px-4 py-1.5 text-sm rounded-md bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {sending ? 'Forwarding…' : `Forward${selected.length > 0 ? ` to ${selected.length}` : ''}`}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
