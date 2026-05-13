import { router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { MessageSquare, Search, X } from 'lucide-react';

export default function NewDmModal({ onClose }) {
    const { auth } = usePage().props;
    const myId = auth?.user?.id;
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState('');

    useEffect(() => {
        let cancelled = false;
        axios.get(route('members.index'))
            .then((res) => {
                if (cancelled) return;
                const list = Array.isArray(res.data) ? res.data : (res.data?.users || []);
                setMembers(list);
                setLoading(false);
            })
            .catch(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, []);

    const filtered = members
        .filter((m) => m.id !== myId)
        .filter((m) =>
            !query.trim()
            || m.name?.toLowerCase().includes(query.trim().toLowerCase())
            || m.email?.toLowerCase().includes(query.trim().toLowerCase())
        );

    const startChat = (userId) => {
        router.visit(route('messages.index', { user: userId }));
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div onClick={(e) => e.stopPropagation()} className="bg-neutral-900 rounded-lg border border-neutral-800 w-full max-w-md">
                <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
                    <h2 className="text-sm font-semibold flex items-center gap-2">
                        <MessageSquare size={16} className="text-purple-400" /> New direct message
                    </h2>
                    <button onClick={onClose} className="text-neutral-400 hover:text-white"><X size={16} /></button>
                </div>
                <div className="p-3 border-b border-neutral-800">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-neutral-800 border border-neutral-700">
                        <Search size={13} className="text-neutral-500" />
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search teammates..."
                            autoFocus
                            className="flex-1 bg-transparent text-sm text-white outline-none"
                        />
                    </div>
                </div>
                <div className="max-h-80 overflow-y-auto py-1">
                    {loading ? (
                        <div className="px-4 py-6 text-center text-xs text-neutral-500">Loading...</div>
                    ) : filtered.length === 0 ? (
                        <div className="px-4 py-6 text-center text-xs text-neutral-500">No teammates found</div>
                    ) : filtered.map((m) => (
                        <button
                            key={m.id}
                            onClick={() => startChat(m.id)}
                            className="w-full flex items-center gap-3 px-4 py-2 hover:bg-neutral-800/70 text-left"
                        >
                            <span className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white text-sm font-semibold flex items-center justify-center">
                                {(m.name || '?').charAt(0).toUpperCase()}
                            </span>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm text-neutral-100 truncate">{m.name}</div>
                                <div className="text-xs text-neutral-500 truncate">{m.email}</div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
