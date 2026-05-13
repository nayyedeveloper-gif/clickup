import { router, usePage } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { X, MessageCircle, Send, Paperclip, Smile, AtSign, ThumbsUp, User as UserIcon } from 'lucide-react';

export default function CommentModal({ task, onClose, onChanged, position }) {
    const { auth } = usePage().props;
    const currentUserId = auth?.user?.id;
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [comment, setComment] = useState('');
    const [replyTo, setReplyTo] = useState(null);
    const [likingId, setLikingId] = useState(null);
    const commentRef = useRef(null);

    // Prevent body scroll when modal is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, []);

    // Calculate position for dropdown
    const modalStyle = position ? {
        position: 'fixed',
        left: position.left,
        zIndex: 50,
    } : {};

    // Determine if modal should show above or below
    if (position) {
        const spaceBelow = window.innerHeight - position.bottom;
        const modalHeight = 500; // h-[500px]
        if (spaceBelow < modalHeight) {
            // Not enough space below, show above
            modalStyle.bottom = window.innerHeight - position.top + 8;
        } else {
            // Show below
            modalStyle.top = position.bottom + 8;
        }
    }

    const refreshComments = () => {
        if (!task?.id) return;
        fetch(route('task-comments.index', task.id), { credentials: 'same-origin' })
            .then(res => res.json())
            .then(data => {
                setComments(data.comments || []);
                setLoading(false);
            })
            .catch(err => {
                console.error('Error fetching comments:', err);
                setLoading(false);
            });
    };

    useEffect(() => {
        if (!task?.id) return;
        setReplyTo(null);
        setLoading(true);
        refreshComments();
    }, [task?.id]);

    const sendComment = (e) => {
        e.preventDefault();
        if (!comment.trim() || !task?.id) return;

        router.post(
            route('task-comments.store', task.id),
            { body: comment.trim(), parent_id: replyTo?.id || null },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    setComment('');
                    setReplyTo(null);
                    refreshComments();
                    onChanged?.();
                },
            }
        );
    };

    const deleteComment = (commentId) => {
        if (!confirm('Delete this comment?')) return;

        router.delete(route('task-comments.destroy', commentId), {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                refreshComments();
                onChanged?.();
            },
        });
    };

    const toggleLike = async (commentObj) => {
        if (!commentObj?.id || likingId) return;
        setLikingId(commentObj.id);
        try {
            if (commentObj.liked_by_me) {
                await axios.delete(route('task-comments.unlike', commentObj.id));
            } else {
                await axios.post(route('task-comments.like', commentObj.id));
            }
            refreshComments();
        } catch (err) {
            console.error('Error updating like:', err);
        } finally {
            setLikingId(null);
        }
    };

    const renderComment = (c, isReply = false) => (
        <div key={c.id} className={`flex gap-3 group ${isReply ? 'ml-10 mt-3' : ''}`}>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-sm font-bold text-white uppercase shrink-0">
                {c.user?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-sm font-semibold text-white truncate">
                            {c.user?.name || 'User'}
                        </span>
                        <span className="text-xs text-neutral-500 flex-shrink-0">
                            {new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                    {c.user_id === currentUserId && (
                        <button
                            onClick={() => deleteComment(c.id)}
                            className="text-neutral-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                            title="Delete comment"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>
                <div className="text-sm text-neutral-200 leading-relaxed mb-2">{c.body}</div>
                <div className="flex items-center gap-4">
                    {!isReply && (
                        <button
                            type="button"
                            onClick={() => setReplyTo(c)}
                            className="flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
                        >
                            <MessageCircle size={12} /> Reply
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => toggleLike(c)}
                        disabled={likingId === c.id}
                        className={`flex items-center gap-1 text-xs transition-colors ${c.liked_by_me ? 'text-purple-400' : 'text-neutral-500 hover:text-purple-400'}`}
                    >
                        <ThumbsUp size={12} /> Like {c.likes_count > 0 ? `(${c.likes_count})` : ''}
                    </button>
                </div>
                {(c.replies || []).map((reply) => renderComment(reply, true))}
            </div>
        </div>
    );

    if (!task) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-40"
                onClick={onClose}
            />
            {/* Modal */}
            <div
                className="w-[540px] max-w-full h-[500px] bg-neutral-900 shadow-2xl flex flex-col rounded-lg"
                style={modalStyle}
                onMouseDown={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between ">
                    <div className="flex items-center gap-2">
                        <MessageCircle size={20} className="text-neutral-400" />
                        <h2 className="text-lg font-semibold text-white">Comments</h2>
                        <span className="text-sm text-neutral-500">({comments.length})</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-neutral-500 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Task info */}
                <div className="px-6 py-3 border-b border-neutral-800 bg-neutral-800/50">
                    <h3 className="text-sm font-medium text-white truncate">{task.title}</h3>
                    <p className="text-xs text-neutral-500">{task.list?.name || 'Task'}</p>
                </div>

                {/* Comments list */}
                <div className="flex-1 overflow-y-auto px-6 py-4 bg-neutral-900">
                    {loading ? (
                        <div className="flex items-center justify-center text-neutral-500 py-8">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500 mr-2"></div>
                            Loading comments…
                        </div>
                    ) : comments.length === 0 ? (
                        <div className="text-center text-neutral-500 py-12">
                            <MessageCircle size={48} className="mx-auto mb-4 opacity-30" />
                            <p className="text-lg font-medium mb-1">No comments yet</p>
                            <p className="text-sm opacity-70">Be the first to share your thoughts!</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {comments.map((c) => renderComment(c))}
                        </div>
                    )}
                </div>

                {/* Comment input */}
                <div className="px-6 py-4 border-t border-neutral-800 bg-neutral-900">
                    {replyTo && (
                        <div className="mb-3 flex items-center justify-between rounded-md border border-neutral-700 bg-neutral-800/80 px-3 py-2 text-xs text-neutral-300">
                            <span>Replying to {replyTo.user?.name || 'comment'}</span>
                            <button
                                type="button"
                                onClick={() => setReplyTo(null)}
                                className="text-neutral-500 hover:text-white"
                            >
                                Cancel
                            </button>
                        </div>
                    )}
                    <form onSubmit={sendComment} className="space-y-3">
                        <div className="flex items-start gap-3">
                            {/* User avatar */}
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-sm font-bold text-white uppercase shrink-0">
                                Y
                            </div>
                            <div className="flex-1 min-w-0">
                                <textarea
                                    ref={commentRef}
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            sendComment(e);
                                        }
                                    }}
                                    placeholder="Add a comment..."
                                    rows={1}
                                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2.5 text-sm placeholder-neutral-500 focus:outline-none focus:border-purple-500 focus:bg-neutral-800 resize-none overflow-hidden transition-colors text-white"
                                    style={{
                                        minHeight: '40px',
                                        maxHeight: '120px'
                                    }}
                                    onInput={(e) => {
                                        // Auto-resize
                                        e.target.style.height = 'auto';
                                        e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                                    }}
                                />
                            </div>
                        </div>
                        <div className="flex items-center justify-between" style={{ paddingLeft: '3.25rem' }}>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    className="p-2 rounded-lg text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800 transition-colors"
                                    title="Add attachment"
                                >
                                    <Paperclip size={16} />
                                </button>
                                <button
                                    type="button"
                                    className="p-2 rounded-lg text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800 transition-colors"
                                    title="Add emoji"
                                >
                                    <Smile size={16} />
                                </button>
                                <button
                                    type="button"
                                    className="p-2 rounded-lg text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800 transition-colors"
                                    title="Mention someone"
                                >
                                    <AtSign size={16} />
                                </button>
                            </div>
                            <button
                                type="submit"
                                disabled={!comment.trim()}
                                className="px-5 py-2 rounded-lg bg-purple-500 hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium text-white transition-colors"
                            >
                                Send
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}
