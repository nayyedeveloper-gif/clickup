import { useState } from 'react';
import { Paperclip, Reply, Smile, Trash2, CornerUpLeft, CornerUpRight, Download } from 'lucide-react';
import Avatar from './Avatar';
import ReactionPicker from './ReactionPicker';
import ForwardMessageModal from './ForwardMessageModal';
import LinkPreview, { extractFirstUrl } from './LinkPreview';
import { formatTime } from './helpers';

/**
 * Renders a Slack/Linear-style message group:
 * - Avatar shown once per group
 * - Header (name + time) shown once
 * - Each subsequent message indented, hover reveals inline timestamp
 * - Reactions, attachments, replies, and actions handled per-message
 */
export default function MessageGroup({ group, myId, onReply, onDelete, onReact }) {
    return (
        <div className="group/msgrp relative flex gap-2.5 md:gap-3 px-2.5 md:px-4 py-2 hover:bg-white/[0.02] transition-colors">
            <div className="pt-0.5">
                <Avatar name={group.sender?.name} src={group.sender?.avatar_url} size="md" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-0.5">
                    <span className="text-[14px] md:text-[15px] font-semibold text-neutral-100 leading-none">
                        {group.sender?.name || 'Unknown'}
                    </span>
                    <span className="text-[10px] md:text-[11px] text-neutral-500 leading-none">
                        {formatTime(group.started_at)}
                    </span>
                </div>
                <div className="space-y-1">
                    {group.messages.map((m) => (
                        <MessageItem
                            key={m.id}
                            m={m}
                            myId={myId}
                            onReply={onReply}
                            onDelete={onDelete}
                            onReact={onReact}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

function MessageItem({ m, myId, onReply, onDelete, onReact }) {
    const [showPicker, setShowPicker] = useState(false);
    const [showForward, setShowForward] = useState(false);
    const isSticker = m.type === 'sticker';
    const reactions = m.reactions || [];
    const attachments = m.attachments || [];
    const mine = m.sender_id === myId;

    const reactionsByEmoji = reactions.reduce((acc, r) => {
        if (!acc[r.emoji]) acc[r.emoji] = { count: 0, users: [] };
        acc[r.emoji].count++;
        acc[r.emoji].users.push(r.user_id);
        return acc;
    }, {});

    return (
        <div className="group/msg relative">
            {/* Forwarded badge */}
            {m.forwarded_from && (
                <div className="flex items-center gap-1.5 mb-1 text-[11px] text-neutral-500 italic">
                    <CornerUpRight size={11} className="text-purple-400" />
                    <span>Forwarded from</span>
                    <span className="font-medium text-neutral-400 not-italic">{m.forwarded_from.sender?.name || 'Unknown'}</span>
                </div>
            )}

            {/* Reply preview */}
            {m.reply_to && (
                <div className="flex items-center gap-2 mb-1 text-xs text-neutral-500">
                    <CornerUpLeft size={12} className="shrink-0" />
                    <Avatar name={m.reply_to.sender?.name} src={m.reply_to.sender?.avatar_url} size="xs" />
                    <span className="font-medium text-neutral-400">{m.reply_to.sender?.name}</span>
                    <span className="truncate text-neutral-500">{m.reply_to.content || (m.reply_to.type === 'sticker' ? m.reply_to.sticker_key : '')}</span>
                </div>
            )}

            {/* Content */}
            {isSticker ? (
                <div className="text-5xl leading-none py-1">{m.sticker_key}</div>
            ) : m.content ? (
                <div className="text-[14.5px] text-neutral-200 leading-relaxed whitespace-pre-wrap break-words">
                    <LinkifiedText text={m.content} />
                </div>
            ) : null}

            {/* Link preview — first URL in content */}
            {m.content && !isSticker && (() => {
                const url = extractFirstUrl(m.content);
                return url ? <LinkPreview url={url} /> : null;
            })()}

            {/* Attachments */}
            {attachments.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                    {attachments.map((a) => (
                        <AttachmentView key={a.id} a={a} />
                    ))}
                </div>
            )}

            {/* Reactions */}
            {reactions.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                    {Object.entries(reactionsByEmoji).map(([emoji, data]) => {
                        const hasReacted = data.users.includes(myId);
                        return (
                            <button
                                key={emoji}
                                type="button"
                                onClick={() => onReact(m, emoji)}
                                className={`inline-flex items-center gap-1 px-2 h-6 rounded-full text-xs border transition ${
                                    hasReacted
                                        ? 'bg-purple-500/10 border-purple-500/60 text-purple-200'
                                        : 'bg-neutral-800/80 border-neutral-700/70 text-neutral-300 hover:border-neutral-600'
                                }`}
                            >
                                <span className="text-sm leading-none">{emoji}</span>
                                <span className="tabular-nums text-[11px] font-medium leading-none">{data.count}</span>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Hover actions */}
            <div
                className={`absolute -top-4 right-1 md:right-2 transition-opacity opacity-100 md:opacity-0 md:group-hover/msg:opacity-100 ${
                    showPicker ? 'opacity-100' : ''
                }`}
            >
                <div className="flex items-center rounded-lg bg-neutral-900 border border-neutral-800 shadow-lg shadow-black/40 overflow-hidden">
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setShowPicker((v) => !v)}
                            className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
                            title="Add reaction"
                        >
                            <Smile size={14} />
                        </button>
                        {showPicker && (
                            <ReactionPicker
                                onReact={(emoji) => onReact(m, emoji)}
                                onClose={() => setShowPicker(false)}
                            />
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={() => onReply(m)}
                        className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
                        title="Reply"
                    >
                        <Reply size={14} />
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowForward(true)}
                        className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
                        title="Forward"
                    >
                        <CornerUpRight size={14} />
                    </button>
                    {mine && (
                        <button
                            type="button"
                            onClick={() => onDelete(m)}
                            className="p-1.5 text-neutral-400 hover:text-red-400 hover:bg-neutral-800 transition"
                            title="Delete"
                        >
                            <Trash2 size={14} />
                        </button>
                    )}
                </div>
            </div>

            {showForward && (
                <ForwardMessageModal
                    message={m}
                    onClose={() => setShowForward(false)}
                />
            )}
        </div>
    );
}

function attachmentDownloadUrl(url) {
    if (!url) return url;
    return url.includes('?') ? `${url}&download=1` : `${url}?download=1`;
}

function extensionFromAttachmentName(a) {
    const name = a.original_name || '';
    let ext = name.includes('.') ? name.split('.').pop()?.toLowerCase() ?? '' : '';
    if (ext && ext.length <= 8) return ext;
    const path = a.path || '';
    const base = path.split('/').pop() || '';
    if (base.includes('.')) {
        ext = base.split('.').pop()?.toLowerCase() ?? '';
    }
    return ext;
}

function isHeicLikeAttachment(a) {
    const m = (a.mime_type || '').toLowerCase();
    const ext = extensionFromAttachmentName(a);
    return m.includes('heic') || m.includes('heif') || ext === 'heic' || ext === 'heif';
}

function canTryBrowserImagePreview(a) {
    if (isHeicLikeAttachment(a)) return false;
    if (a.is_image) return true;
    const m = (a.mime_type || '').toLowerCase();
    if (m.startsWith('image/')) return true;
    const ext = extensionFromAttachmentName(a);
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'bmp'].includes(ext);
}

function AttachmentView({ a }) {
    const [imgFailed, setImgFailed] = useState(false);
    const downloadHref = attachmentDownloadUrl(a.url);
    const tryImage = canTryBrowserImagePreview(a) && !imgFailed;

    if (tryImage) {
        return (
            <div className="max-w-full rounded-lg border border-neutral-800 bg-neutral-950/40 overflow-hidden">
                <a
                    href={a.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block group/img"
                    title="Open original"
                >
                    <img
                        src={a.url}
                        alt={a.original_name || 'Image'}
                        className="block w-auto max-w-full max-h-[min(92vh,2600px)] h-auto object-contain bg-neutral-950"
                        loading="lazy"
                        decoding="async"
                        onError={() => setImgFailed(true)}
                    />
                </a>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-neutral-800 px-3 py-2 text-xs text-neutral-300">
                    <span className="min-w-0 flex-1 truncate font-medium text-neutral-100" title={a.original_name}>
                        {a.original_name || 'Image'}
                    </span>
                    {a.size_bytes ? (
                        <span className="shrink-0 text-[11px] text-neutral-500 tabular-nums">{formatBytes(a.size_bytes)}</span>
                    ) : null}
                    <a
                        href={downloadHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Download"
                        className="inline-flex shrink-0 items-center gap-1 rounded-md border border-neutral-700 px-2 py-1 text-[11px] text-neutral-200 hover:border-neutral-500 hover:text-white"
                    >
                        <Download size={12} />
                        Download
                    </a>
                </div>
            </div>
        );
    }
    return (
        <a
            href={downloadHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-neutral-800/60 border border-neutral-700 text-sm text-neutral-200 hover:bg-neutral-800 hover:border-neutral-600 transition"
        >
            <Paperclip size={14} className="text-neutral-400" />
            <span className="truncate max-w-[18rem]">{a.original_name}</span>
            {a.size_bytes ? (
                <span className="text-[11px] text-neutral-500 tabular-nums">
                    {formatBytes(a.size_bytes)}
                </span>
            ) : null}
        </a>
    );
}

function LinkifiedText({ text }) {
    const parts = String(text || '').split(/(\bhttps?:\/\/[^\s<>"')]+)/i);
    return (
        <>
            {parts.map((part, i) => {
                if (/^https?:\/\//i.test(part)) {
                    return (
                        <a
                            key={i}
                            href={part}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-300 hover:text-purple-200 underline underline-offset-2 break-all"
                        >
                            {part}
                        </a>
                    );
                }
                return <span key={i}>{part}</span>;
            })}
        </>
    );
}

function formatBytes(n) {
    if (!n && n !== 0) return '';
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / 1024 / 1024).toFixed(1)} MB`;
}
