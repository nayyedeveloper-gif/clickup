import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import EmojiPicker from 'emoji-picker-react';
import { Paperclip, Smile, Send, X, Sticker, AtSign, CornerUpLeft, File as FileIcon, Image as ImageIcon } from 'lucide-react';
import Avatar from './Avatar';
import { STICKERS } from './helpers';

/** Keep in sync with server `CHAT_MAX_ATTACHMENT_KB` (102400 = 100 MiB). */
const MAX_ATTACHMENT_BYTES = 102400 * 1024;

function isLocalImagePreviewable(file) {
    const t = (file.type || '').toLowerCase();
    if (t.includes('heic') || t.includes('heif')) return false;
    if (t.startsWith('image/')) return true;
    const ext = (file.name || '').split('.').pop()?.toLowerCase() ?? '';
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'bmp'].includes(ext);
}

function formatBytes(n) {
    if (!n || n < 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    let v = n;
    let i = 0;
    while (v >= 1024 && i < units.length - 1) {
        v /= 1024;
        i += 1;
    }
    const rounded = v < 10 && i > 0 ? v.toFixed(1) : Math.round(v);
    return `${rounded} ${units[i]}`;
}

/**
 * Professional, Slack/Linear-style composer.
 * Works for both Channels (pass `channelId`) and Direct Messages (pass `receiverId`).
 * Ref: { addFiles(FileList|File[]) } — used by drag-and-drop on the parent chat column.
 */
const Composer = forwardRef(function Composer(
    {
        channelId = null,
        receiverId = null,
        replyTo = null,
        onCancelReply,
        onSent,
        onType = null,
        placeholder = 'Write a message...',
    },
    ref
) {
    const [content, setContent] = useState('');
    const [sending, setSending] = useState(false);
    /** null = hidden; { percent: 0-100 } determinate; { indeterminate, loaded } when total unknown */
    const [uploadState, setUploadState] = useState(null);
    const [sendError, setSendError] = useState(null);
    const [showEmoji, setShowEmoji] = useState(false);
    const [showStickers, setShowStickers] = useState(false);
    const [showMentions, setShowMentions] = useState(false);
    const [mentionQuery, setMentionQuery] = useState('');
    const [mentionUsers, setMentionUsers] = useState([]);
    const [attachments, setAttachments] = useState([]);
    const [mentionIds, setMentionIds] = useState([]);

    const textareaRef = useRef(null);
    const fileInputRef = useRef(null);
    const emojiRef = useRef(null);
    const stickerRef = useRef(null);
    const mentionRef = useRef(null);

    const isDirect = !!receiverId;

    // Auto-resize textarea
    useEffect(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = 'auto';
        el.style.height = Math.min(el.scrollHeight, 160) + 'px';
    }, [content]);

    // Close popovers on outside click
    useEffect(() => {
        const handler = (e) => {
            if (emojiRef.current && !emojiRef.current.contains(e.target)) setShowEmoji(false);
            if (stickerRef.current && !stickerRef.current.contains(e.target)) setShowStickers(false);
            if (mentionRef.current && !mentionRef.current.contains(e.target)) setShowMentions(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Debounced mention search
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (!showMentions) return;
            try {
                const res = await fetch(`${route('users.search')}?q=${encodeURIComponent(mentionQuery)}`);
                const json = await res.json();
                setMentionUsers(json.users || []);
            } catch {
                setMentionUsers([]);
            }
        }, 150);
        return () => clearTimeout(timer);
    }, [mentionQuery, showMentions]);

    // Throttled typing notification (max once every 2.5s)
    const lastTypingRef = useRef(0);
    const emitTyping = () => {
        if (!onType) return;
        const now = Date.now();
        if (now - lastTypingRef.current > 2500) {
            lastTypingRef.current = now;
            onType();
        }
    };

    const handleContentChange = (e) => {
        const val = e.target.value;
        setContent(val);
        if (val.trim().length > 0) emitTyping();

        // Detect @mention trigger at cursor
        const caret = e.target.selectionStart;
        const before = val.slice(0, caret);
        const match = before.match(/(?:^|\s)@([\w\-.]*)$/);
        if (match) {
            setMentionQuery(match[1]);
            setShowMentions(true);
        } else {
            setShowMentions(false);
        }
    };

    const selectMention = (user) => {
        const el = textareaRef.current;
        if (!el) return;
        const caret = el.selectionStart;
        const before = content.slice(0, caret).replace(/@[\w\-.]*$/, `@${user.name} `);
        const after = content.slice(caret);
        const next = before + after;
        setContent(next);
        setMentionIds((prev) => (prev.includes(user.id) ? prev : [...prev, user.id]));
        setShowMentions(false);
        // restore focus/caret
        requestAnimationFrame(() => {
            el.focus();
            const pos = before.length;
            el.setSelectionRange(pos, pos);
        });
    };

    const addFiles = useCallback((files) => {
        const list = Array.from(files || []);
        if (!list.length) return;
        const oversize = list.find((f) => f.size > MAX_ATTACHMENT_BYTES);
        if (oversize) {
            setSendError(`File too large: "${oversize.name}" (max ${formatBytes(MAX_ATTACHMENT_BYTES)} per file).`);
            return;
        }
        setSendError(null);
        setAttachments((prev) => {
            const merged = [...prev];
            for (const file of list) {
                if (merged.length >= 10) break;
                let previewUrl;
                if (isLocalImagePreviewable(file)) {
                    try {
                        previewUrl = URL.createObjectURL(file);
                    } catch {
                        previewUrl = undefined;
                    }
                }
                merged.push({ file, previewUrl });
            }
            return merged;
        });
    }, []);

    useImperativeHandle(ref, () => ({ addFiles }), [addFiles]);

    const attachmentsRef = useRef(attachments);
    attachmentsRef.current = attachments;
    useEffect(
        () => () => {
            attachmentsRef.current.forEach((entry) => {
                if (entry?.previewUrl) URL.revokeObjectURL(entry.previewUrl);
            });
        },
        []
    );

    const removeAttachment = (idx) =>
        setAttachments((prev) => {
            const removed = prev[idx];
            if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl);
            return prev.filter((_, i) => i !== idx);
        });

    const reset = () => {
        setAttachments((prev) => {
            prev.forEach((entry) => {
                if (entry?.previewUrl) URL.revokeObjectURL(entry.previewUrl);
            });
            return [];
        });
        setContent('');
        setMentionIds([]);
        setShowEmoji(false);
        setShowStickers(false);
        setShowMentions(false);
        setUploadState(null);
        setSendError(null);
    };

    const submit = async (e, stickerEmoji = null) => {
        e?.preventDefault();
        const hasContent = content.trim() || stickerEmoji || attachments.length;
        if (!hasContent || sending) return;
        setSendError(null);
        setSending(true);
        if (attachments.length > 0) {
            setUploadState({ percent: 0 });
        } else {
            setUploadState(null);
        }

        const form = new FormData();
        if (channelId) form.append('channel_id', channelId);
        if (receiverId) {
            form.append('receiver_id', receiverId);
            form.append('is_direct_message', '1');
        }
        if (stickerEmoji) {
            form.append('type', 'sticker');
            form.append('sticker_key', stickerEmoji);
        } else {
            form.append('content', content);
            form.append('type', 'text');
        }
        if (replyTo?.id) form.append('reply_to_id', replyTo.id);
        mentionIds.forEach((id) => form.append('mentions[]', id));
        attachments.forEach((entry) => form.append('attachments[]', entry.file));

        try {
            const res = await axios.post(route('messages.store'), form, {
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                // Do not set Content-Type: Laravel/browser need multipart boundary on FormData.
                onUploadProgress: (progressEvent) => {
                    if (!attachments.length) return;
                    const loaded = progressEvent.loaded ?? 0;
                    const total = progressEvent.total ?? 0;
                    if (total > 0) {
                        setUploadState({ percent: Math.min(100, Math.round((loaded * 100) / total)) });
                    } else {
                        setUploadState({ indeterminate: true, loaded });
                    }
                },
            });
            reset();
            onCancelReply?.();
            onSent?.(res.data.message);
        } catch (err) {
            const data = err.response?.data;
            let msg =
                data?.message ||
                data?.errors?.attachments?.[0] ||
                (typeof data?.errors === 'object' && data.errors
                    ? Object.values(data.errors).flat().join(' ')
                    : null) ||
                err.message ||
                'Failed to send message.';
            if (err.response?.status === 413) {
                msg = 'Upload too large for the server (increase PHP post_max_size / upload_max_filesize).';
            }
            setSendError(msg);
        } finally {
            setSending(false);
            setUploadState(null);
        }
    };

    const sendSticker = (emoji) => submit(null, emoji);

    const canSend = useMemo(
        () => content.trim().length > 0 || attachments.length > 0,
        [content, attachments.length]
    );

    return (
        <div className="px-2.5 md:px-4 pb-2.5 md:pb-4 pt-2">
            {/* Reply banner */}
            {replyTo && (
                <div className="mb-2 flex items-center gap-2 px-2.5 md:px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800">
                    <div className="w-0.5 self-stretch bg-purple-500 rounded" />
                    <CornerUpLeft size={12} className="text-purple-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                        <div className="text-[11px] text-neutral-500">
                            Replying to <span className="text-purple-300 font-medium">{replyTo.sender?.name}</span>
                        </div>
                        <div className="text-xs text-neutral-300 truncate">
                            {replyTo.content || (replyTo.type === 'sticker' ? replyTo.sticker_key : 'attachment')}
                        </div>
                    </div>
                    <button
                        onClick={onCancelReply}
                        className="p-1 text-neutral-500 hover:text-white hover:bg-neutral-800 rounded transition"
                        title="Cancel reply"
                    >
                        <X size={14} />
                    </button>
                </div>
            )}

            {/* Composer shell */}
            <div className="relative rounded-2xl bg-neutral-900 border border-neutral-800 focus-within:border-neutral-700 focus-within:ring-1 focus-within:ring-purple-500/20 transition">
                {sendError && (
                    <div className="px-3 pt-2 text-xs text-red-400 border-b border-neutral-800">{sendError}</div>
                )}
                {uploadState && sending && attachments.length > 0 && (
                    <div className="px-3 pt-2 pb-1 border-b border-neutral-800">
                        <div className="flex items-center justify-between text-[11px] text-neutral-400 mb-1">
                            <span>
                                {uploadState.indeterminate
                                    ? `Uploading… ${formatBytes(uploadState.loaded || 0)}`
                                    : 'Uploading attachments…'}
                            </span>
                            {!uploadState.indeterminate && <span>{uploadState.percent}%</span>}
                        </div>
                        <div className="h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                            {uploadState.indeterminate ? (
                                <div className="h-full w-full rounded-full bg-purple-500/50 animate-pulse" />
                            ) : (
                                <div
                                    className="h-full bg-purple-500 transition-all duration-200"
                                    style={{ width: `${uploadState.percent}%` }}
                                />
                            )}
                        </div>
                    </div>
                )}

                {/* Attachments preview */}
                {attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 p-3 border-b border-neutral-800">
                        {attachments.map((entry, i) => {
                            const file = entry.file;
                            const isRasterPreview = Boolean(entry.previewUrl);
                            return (
                                <div
                                    key={`${file.name}-${file.size}-${file.lastModified}-${i}`}
                                    className="group/att relative flex items-stretch gap-2 pr-7 rounded-lg bg-neutral-800/90 border border-neutral-700 text-xs text-neutral-200 overflow-hidden min-h-[4.5rem]"
                                >
                                    {isRasterPreview ? (
                                        <div className="relative h-[4.5rem] w-[4.5rem] shrink-0 bg-neutral-950">
                                            <img
                                                src={entry.previewUrl}
                                                alt=""
                                                className="h-full w-full object-cover"
                                            />
                                        </div>
                                    ) : (
                                        <div className="flex h-[4.5rem] w-[4.5rem] shrink-0 items-center justify-center bg-neutral-950 border-r border-neutral-800">
                                            {file.type?.startsWith('image/') ? (
                                                <ImageIcon size={20} className="text-neutral-500" />
                                            ) : (
                                                <FileIcon size={20} className="text-neutral-500" />
                                            )}
                                        </div>
                                    )}
                                    <div className="flex min-w-0 flex-1 flex-col justify-center py-1.5 pr-1">
                                        <span className="truncate font-medium text-neutral-100">{file.name}</span>
                                        <span className="shrink-0 text-[10px] text-neutral-500">{formatBytes(file.size)}</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeAttachment(i)}
                                        className="absolute right-1 top-1/2 -translate-y-1/2 p-0.5 text-neutral-500 hover:text-red-400 rounded"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Input */}
                <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={handleContentChange}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey && !showMentions) {
                            e.preventDefault();
                            submit(e);
                        }
                    }}
                    onPaste={(e) => {
                        const files = Array.from(e.clipboardData?.files || []);
                        if (files.length) {
                            e.preventDefault();
                            addFiles(files);
                        }
                    }}
                    placeholder={placeholder}
                    rows={1}
                    className="w-full bg-transparent px-3 md:px-4 pt-3 pb-2 text-[14px] md:text-[14.5px] text-white placeholder:text-neutral-500 outline-none focus:outline-none focus:ring-0 border-none focus:border-none resize-none"
                />

                {/* Toolbar */}
                <div className="flex items-center justify-between px-1.5 md:px-2 pb-1.5 md:pb-2">
                    <div className="flex items-center">
                        <ToolbarButton onClick={() => fileInputRef.current?.click()} title="Attach file">
                            <Paperclip size={16} />
                        </ToolbarButton>

                        <div ref={emojiRef} className="relative">
                            <ToolbarButton onClick={() => { setShowEmoji((v) => !v); setShowStickers(false); }} title="Emoji">
                                <Smile size={16} />
                            </ToolbarButton>
                            {showEmoji && (
                                <div className="absolute bottom-full left-0 mb-2 z-40 rounded-xl overflow-hidden shadow-2xl shadow-black/40">
                                    <EmojiPicker
                                        theme="dark"
                                        height={360}
                                        width={320}
                                        lazyLoadEmojis
                                        onEmojiClick={(e) => {
                                            setContent((c) => c + e.emoji);
                                            setShowEmoji(false);
                                            requestAnimationFrame(() => textareaRef.current?.focus());
                                        }}
                                    />
                                </div>
                            )}
                        </div>

                        <div ref={stickerRef} className="relative">
                            <ToolbarButton onClick={() => { setShowStickers((v) => !v); setShowEmoji(false); }} title="Stickers">
                                <Sticker size={16} />
                            </ToolbarButton>
                            {showStickers && (
                                <div className="absolute bottom-full left-0 mb-2 z-40 w-72 p-2 rounded-xl bg-neutral-900 border border-neutral-800 shadow-2xl shadow-black/40">
                                    <div className="px-1 mb-1.5 text-[10px] font-medium uppercase tracking-wider text-neutral-500">
                                        Stickers
                                    </div>
                                    <div className="grid grid-cols-8 gap-0.5">
                                        {STICKERS.map((s) => (
                                            <button
                                                key={s}
                                                type="button"
                                                onClick={() => sendSticker(s)}
                                                className="w-8 h-8 flex items-center justify-center text-xl rounded-md hover:bg-neutral-800 active:scale-95 transition"
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <ToolbarButton
                            onClick={() => {
                                const el = textareaRef.current;
                                if (!el) return;
                                const pos = el.selectionStart;
                                const next = content.slice(0, pos) + '@' + content.slice(pos);
                                setContent(next);
                                setShowMentions(true);
                                setMentionQuery('');
                                requestAnimationFrame(() => {
                                    el.focus();
                                    const p = pos + 1;
                                    el.setSelectionRange(p, p);
                                });
                            }}
                            title="Mention"
                        >
                            <AtSign size={16} />
                        </ToolbarButton>
                    </div>

                    <button
                        type="button"
                        onClick={(e) => submit(e)}
                        disabled={!canSend || sending}
                        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium text-white bg-purple-600 hover:bg-purple-500 disabled:bg-neutral-800 disabled:text-neutral-500 disabled:cursor-not-allowed transition"
                    >
                        <Send size={12} />
                        Send
                    </button>
                </div>

                {/* Mentions popover */}
                {showMentions && mentionUsers.length > 0 && (
                    <div
                        ref={mentionRef}
                        className="absolute bottom-full left-4 right-4 mb-2 max-h-56 overflow-y-auto rounded-xl bg-neutral-900 border border-neutral-800 shadow-2xl shadow-black/40 z-40 py-1"
                    >
                        {mentionUsers.map((u) => (
                            <button
                                key={u.id}
                                type="button"
                                onClick={() => selectMention(u)}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-neutral-200 hover:bg-neutral-800 transition"
                            >
                                <Avatar name={u.name} size="sm" />
                                <div className="flex-1 min-w-0 text-left">
                                    <div className="truncate text-neutral-100">{u.name}</div>
                                    <div className="truncate text-[11px] text-neutral-500">{u.email}</div>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Hint */}
            <div className="hidden sm:block mt-1.5 px-1 text-[11px] text-neutral-600">
                <kbd className="text-neutral-400">Enter</kbd> to send · <kbd className="text-neutral-400">Shift + Enter</kbd> for new line · <kbd className="text-neutral-400">@</kbd> to mention
                {' · '}
                Drag files into the chat to attach
            </div>

            <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={(e) => addFiles(e.target.files)}
                className="hidden"
            />
        </div>
    );
});

function ToolbarButton({ onClick, children, title }) {
    return (
        <button
            type="button"
            onClick={onClick}
            title={title}
            className="w-8 h-8 flex items-center justify-center rounded-md text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
        >
            {children}
        </button>
    );
}

export default Composer;
