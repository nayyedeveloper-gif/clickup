import { Head, Link, router, usePage } from '@inertiajs/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, MessageSquare, Plus, Search, Image as ImageIcon, Hash } from 'lucide-react';
import MediaGalleryDrawer from '@/Components/Chat/MediaGalleryDrawer';
import MobileBottomNav from '@/Components/Mobile/MobileBottomNav';
import Sidebar from '@/Components/Sidebar';
import NewDmModal from '@/Components/Modals/NewDmModal';
import Avatar from '@/Components/Chat/Avatar';
import Composer from '@/Components/Chat/Composer';
import MessageGroup from '@/Components/Chat/MessageGroup';
import DaySeparator from '@/Components/Chat/DaySeparator';
import { appendMessageIfNew, buildMessageGroups, messageIdEquals, relativeTime } from '@/Components/Chat/helpers';
import { useChatFileDropZone } from '@/Components/Chat/useChatFileDropZone';
import { usePresence } from '@/Contexts/PresenceContext';

export default function MessagesIndex({ conversations, partner: initialPartner, thread: initialThread, activeUserId }) {
    const { auth } = usePage().props;
    const myId = auth?.user?.id;

    const [partner, setPartner] = useState(initialPartner || null);
    const [messages, setMessages] = useState(initialThread || []);
    const [search, setSearch] = useState('');
    const [showNewDm, setShowNewDm] = useState(false);
    const [showMedia, setShowMedia] = useState(false);
    const [showMobileThread, setShowMobileThread] = useState(!!initialPartner);
    const [replyTo, setReplyTo] = useState(null);
    const [partnerTyping, setPartnerTyping] = useState(false);
    const scrollerRef = useRef(null);
    const composerRef = useRef(null);
    const echoChannelRef = useRef(null);
    const typingTimerRef = useRef(null);
    const { isOnline } = usePresence();

    const forwardFilesToComposer = useCallback((files) => {
        composerRef.current?.addFiles(files);
    }, []);

    const { active: fileDragActive, onDragEnter, onDragLeave, onDragOverCapture, onDropCapture } =
        useChatFileDropZone(forwardFilesToComposer);

    // Sync when navigating between threads
    useEffect(() => {
        setPartner(initialPartner || null);
        setMessages(initialThread || []);
        setReplyTo(null);
        setShowMobileThread(!!initialPartner);
    }, [activeUserId, initialPartner, initialThread]);

    // Real-time listeners for DM thread
    useEffect(() => {
        if (!partner?.id) return;
        const pair = [myId, partner.id].sort((a, b) => a - b).join('-');
        const channelName = `chat.dm.${pair}`;
        const echoChannel = window.Echo.join(channelName);
        echoChannelRef.current = echoChannel;

        echoChannel.listen('.message.sent', (e) => {
            setMessages((prev) => appendMessageIfNew(prev, e.message));
            // Clear typing indicator when message arrives
            setPartnerTyping(false);
            if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        });
        echoChannel.listen('.message.deleted', (e) => {
            setMessages((prev) => prev.filter((m) => !messageIdEquals(m.id, e.id)));
        });
        echoChannel.listen('.message.reaction', (e) => {
            setMessages((prev) =>
                prev.map((m) => (messageIdEquals(m.id, e.id) ? { ...m, reactions: e.reactions } : m))
            );
        });

        // Typing indicator via client-only whisper
        echoChannel.listenForWhisper('typing', (e) => {
            if (e?.userId && e.userId !== myId) {
                setPartnerTyping(true);
                if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
                typingTimerRef.current = setTimeout(() => setPartnerTyping(false), 3500);
            }
        });

        return () => {
            if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
            setPartnerTyping(false);
            echoChannelRef.current = null;
            window.Echo.leave(channelName);
        };
    }, [partner?.id, myId]);

    const handleTyping = () => {
        const ch = echoChannelRef.current;
        if (!ch) return;
        try { ch.whisper('typing', { userId: myId }); } catch { /* ignore */ }
    };

    // Auto-scroll on new messages or partner change
    useEffect(() => {
        const el = scrollerRef.current;
        if (!el) return;
        el.scrollTop = el.scrollHeight;
    }, [messages.length, partner?.id]);

    const filteredConvos = useMemo(() => {
        if (!search.trim()) return conversations;
        const q = search.trim().toLowerCase();
        return conversations.filter(
            (c) => c.name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q)
        );
    }, [conversations, search]);

    const onDeleteMessage = (m) => {
        if (!confirm('Delete this message?')) return;
        router.delete(route('messages.destroy', m.id), {
            preserveScroll: true,
            onSuccess: () => setMessages((prev) => prev.filter((x) => x.id !== m.id)),
        });
    };

    const onReact = (m, emoji) => {
        if (!emoji) return;
        const mine = (m.reactions || []).find((r) => r.user_id === myId && r.emoji === emoji);

        // Optimistic update
        setMessages((prev) =>
            prev.map((x) => {
                if (x.id !== m.id) return x;
                const existing = x.reactions || [];
                const next = mine
                    ? existing.filter((r) => !(r.user_id === myId && r.emoji === emoji))
                    : [...existing, { id: `tmp-${Date.now()}`, user_id: myId, emoji }];
                return { ...x, reactions: next };
            })
        );

        if (mine) {
            // Use POST with _method override because DELETE with request body is problematic in Inertia
            router.post(route('messages.unreact', m.id), { _method: 'delete', emoji }, {
                preserveScroll: true,
                preserveState: true,
            });
        } else {
            router.post(route('messages.react', m.id), { emoji }, {
                preserveScroll: true,
                preserveState: true,
            });
        }
    };

    const groupedItems = useMemo(() => buildMessageGroups(messages), [messages]);

    return (
        <>
            <Head title={partner ? `Chat · ${partner.name}` : 'Direct Messages'} />
            <div className="flex h-screen bg-neutral-950 text-neutral-100 overflow-hidden">
                <div className="hidden lg:flex">
                    <Sidebar />
                </div>
                <div className="flex-1 flex overflow-hidden min-w-0">
                    {/* Conversation list */}
                    <aside
                        className={`${
                            showMobileThread ? 'hidden md:flex' : 'flex'
                        } w-full md:w-[320px] bg-neutral-950 border-r border-neutral-800 flex-col`}
                    >
                        <header className="h-14 shrink-0 border-b border-neutral-800 px-2 md:px-4 flex items-center gap-2">
                            <Link
                                href={route('channels.index')}
                                className="md:hidden flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-neutral-300 transition-colors hover:bg-neutral-800 hover:text-white active:bg-neutral-700"
                                aria-label="Channels"
                            >
                                <Hash size={20} strokeWidth={2.25} />
                            </Link>
                            <div className="min-w-0 flex-1">
                                <h2 className="text-[15px] font-semibold leading-tight text-white">Messages</h2>
                            </div>
                            <button
                                onClick={() => setShowNewDm(true)}
                                className="w-8 h-8 flex items-center justify-center rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
                                title="New message"
                            >
                                <Plus size={15} />
                            </button>
                        </header>

                        <div className="p-3 border-b border-neutral-800">
                            <div className="flex items-center gap-2 h-10 px-3 rounded-xl bg-neutral-900 focus-within:bg-neutral-800 transition">
                                <Search size={13} className="text-neutral-500 shrink-0" />
                                <input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search conversations"
                                    className="flex-1 bg-transparent text-sm text-white placeholder:text-neutral-500 outline-none"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto px-2 py-2">
                            {filteredConvos.length === 0 ? (
                                <div className="px-4 py-12 text-center text-xs text-neutral-500">
                                    {search ? 'No matches' : 'No conversations yet'}
                                </div>
                            ) : (
                                filteredConvos.map((c) => {
                                    const active = partner?.id === c.id;
                                    return (
                                        <Link
                                            key={c.id}
                                            href={route('messages.index', { user: c.id })}
                                            onClick={() => setShowMobileThread(true)}
                                            className={`flex items-center gap-3 px-2.5 py-2 rounded-lg transition ${
                                                active ? 'bg-neutral-800' : 'hover:bg-neutral-900'
                                            }`}
                                        >
                                            <Avatar name={c.name} src={c.avatar_url} size="md" status={isOnline(c.id) ? 'online' : 'offline'} />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className={`text-sm truncate ${c.unread > 0 ? 'text-white font-semibold' : 'text-neutral-200'}`}>
                                                        {c.name}
                                                    </span>
                                                    <span className="text-[10px] text-neutral-500 shrink-0 tabular-nums">
                                                        {relativeTime(c.last_at)}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between gap-2 mt-0.5">
                                                    <span className={`text-xs truncate ${c.unread > 0 ? 'text-neutral-300' : 'text-neutral-500'}`}>
                                                        {c.last_from_me ? 'You: ' : ''}{c.last_message || '—'}
                                                    </span>
                                                    {c.unread > 0 && (
                                                        <span className="shrink-0 min-w-[18px] h-[18px] px-1.5 inline-flex items-center justify-center text-[10px] font-semibold text-white bg-purple-600 rounded-full">
                                                            {c.unread}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })
                            )}
                        </div>
                    </aside>

                    {/* Conversation view */}
                    <section className={`${showMobileThread ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-neutral-950 min-w-0`}>
                        {!partner ? (
                            <EmptyState onNew={() => setShowNewDm(true)} />
                        ) : (
                            <div
                                className={`flex flex-1 flex-col min-h-0 relative ${
                                    fileDragActive ? 'ring-2 ring-inset ring-purple-500/50 rounded-lg' : ''
                                }`}
                                onDragEnter={onDragEnter}
                                onDragLeave={onDragLeave}
                                onDragOverCapture={onDragOverCapture}
                                onDropCapture={onDropCapture}
                            >
                                {fileDragActive && (
                                    <div className="pointer-events-none absolute inset-x-0 bottom-24 z-10 flex justify-center px-4">
                                        <div className="rounded-lg border border-purple-500/60 bg-neutral-900/95 px-4 py-2 text-sm text-white shadow-lg">
                                            Release to attach files
                                        </div>
                                    </div>
                                )}
                                {/* Header */}
                                <header className="h-14 px-3 md:px-5 flex items-center gap-2.5 md:gap-3 border-b border-neutral-800 shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => setShowMobileThread(false)}
                                        className="md:hidden flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white transition-colors hover:bg-neutral-800 active:bg-neutral-700"
                                        title="Back to conversations"
                                    >
                                        <ArrowLeft size={20} strokeWidth={2.25} />
                                    </button>
                                    <Avatar name={partner.name} src={partner.avatar_url} size="md" status={isOnline(partner.id) ? 'online' : 'offline'} />
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm md:text-[15px] font-semibold text-white leading-tight truncate">
                                            {partner.name}
                                        </div>
                                        <div className="text-[11px] leading-tight truncate">
                                            {partnerTyping ? (
                                                <span className="text-purple-400 flex items-center gap-1">
                                                    <TypingDots /> typing…
                                                </span>
                                            ) : (
                                                <>
                                                    <span className={isOnline(partner.id) ? 'text-emerald-400' : 'text-neutral-500'}>
                                                        {isOnline(partner.id) ? 'Online' : 'Offline'}
                                                    </span>
                                                    <span className="hidden sm:inline text-neutral-600"> · </span>
                                                    <span className="hidden sm:inline text-neutral-500">{partner.email}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            type="button"
                                            onClick={() => setShowMedia(true)}
                                            className="w-8 h-8 flex items-center justify-center rounded-md text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
                                            title="Shared media"
                                        >
                                            <ImageIcon size={15} />
                                        </button>
                                    </div>
                                </header>

                                {/* Messages */}
                                <div
                                    ref={scrollerRef}
                                    className="flex-1 overflow-y-auto"
                                >
                                    {groupedItems.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full text-center px-8">
                                            <Avatar name={partner.name} src={partner.avatar_url} size="xl" />
                                            <h3 className="mt-4 text-lg font-semibold text-white">{partner.name}</h3>
                                            <p className="mt-1 text-sm text-neutral-400">
                                                This is the beginning of your conversation with {partner.name}.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="py-3 md:py-4">
                                            {groupedItems.map((g) =>
                                                g.type === 'day' ? (
                                                    <DaySeparator key={g.key} label={g.label} />
                                                ) : (
                                                    <MessageGroup
                                                        key={g.key}
                                                        group={g}
                                                        myId={myId}
                                                        onReply={setReplyTo}
                                                        onDelete={onDeleteMessage}
                                                        onReact={onReact}
                                                    />
                                                )
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Composer */}
                                <Composer
                                    ref={composerRef}
                                    receiverId={partner.id}
                                    replyTo={replyTo}
                                    onCancelReply={() => setReplyTo(null)}
                                    onSent={(msg) => setMessages((prev) => appendMessageIfNew(prev, msg))}
                                    onType={handleTyping}
                                    placeholder={`Message ${partner.name}`}
                                />
                            </div>
                        )}
                    </section>
                </div>
            </div>
            {showNewDm && <NewDmModal onClose={() => setShowNewDm(false)} />}
            {showMedia && partner && (
                <MediaGalleryDrawer
                    partner={partner}
                    onClose={() => setShowMedia(false)}
                />
            )}
            <MobileBottomNav />
        </>
    );
}

function TypingDots() {
    return (
        <span className="inline-flex gap-0.5 items-end">
            <span className="w-1 h-1 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1 h-1 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1 h-1 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '300ms' }} />
        </span>
    );
}

function HeaderIconButton({ children, title }) {
    return (
        <button
            type="button"
            title={title}
            className="w-8 h-8 flex items-center justify-center rounded-md text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
        >
            {children}
        </button>
    );
}

function EmptyState({ onNew }) {
    return (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
            <div className="w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                <MessageSquare size={28} className="text-neutral-500" />
            </div>
            <h3 className="mt-5 text-base font-semibold text-white">Your messages</h3>
            <p className="mt-1 text-sm text-neutral-500 max-w-sm">
                Send a private message to a teammate, or pick an existing conversation from the list.
            </p>
            <button
                onClick={onNew}
                className="mt-5 h-9 px-4 inline-flex items-center gap-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-sm font-medium text-white transition"
            >
                <Plus size={14} /> New message
            </button>
        </div>
    );
}
