export function formatTime(date) {
    if (!date) return '';
    return new Date(date).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function relativeTime(date) {
    if (!date) return '';
    const diff = (Date.now() - new Date(date).getTime()) / 1000;
    if (diff < 60) return 'now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
    return new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function dayLabel(date) {
    const d = new Date(date);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const target = new Date(d); target.setHours(0, 0, 0, 0);
    const diff = (today - target) / 86400000;
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    if (diff < 7) return d.toLocaleDateString(undefined, { weekday: 'long' });
    return d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
}

/**
 * Group messages by day and also group consecutive messages from the same author
 * within a short window (under 5 minutes) so we can render professional message groups.
 */
export function buildMessageGroups(messages, windowSeconds = 300) {
    const items = [];
    let currentDay = null;
    let currentGroup = null;

    for (const m of messages) {
        const day = dayLabel(m.created_at);
        if (day !== currentDay) {
            items.push({ type: 'day', label: day, key: `day-${day}-${m.id}` });
            currentDay = day;
            currentGroup = null;
        }

        const prev = currentGroup?.messages.at(-1);
        const sameAuthor = prev && prev.sender_id === m.sender_id;
        const closeInTime =
            prev && (new Date(m.created_at).getTime() - new Date(prev.created_at).getTime()) / 1000 < windowSeconds;
        const noReply = !m.reply_to;

        if (sameAuthor && closeInTime && noReply) {
            currentGroup.messages.push(m);
        } else {
            currentGroup = {
                type: 'group',
                key: `grp-${m.id}`,
                sender: m.sender,
                sender_id: m.sender_id,
                started_at: m.created_at,
                messages: [m],
            };
            items.push(currentGroup);
        }
    }
    return items;
}

/** Compare message ids from API vs Echo payloads (number vs string). */
export function messageIdEquals(a, b) {
    if (a == null || b == null) return false;
    return Number(a) === Number(b);
}

/**
 * Append a message only if that id is not already in the list.
 * Prevents duplicate rows when Composer adds the HTTP response and websocket adds the same message.
 */
export function appendMessageIfNew(prev, message) {
    if (!message || message.id == null) return prev;
    if (prev.some((m) => messageIdEquals(m.id, message.id))) return prev;
    return [...prev, message];
}

export const STICKERS = [
    '👍', '👎', '🎉', '🔥', '❤️', '😂', '😮', '😢',
    '👀', '💯', '✅', '❌', '🚀', '💪', '🤝', '🙏',
];

export const REACTION_CATEGORIES = {
    Frequent: ['👍', '👎', '❤️', '😂', '😮', '😢', '🔥', '🎉'],
    People: ['👋', '🙏', '🤝', '👀', '💯', '✅', '❌', '🚀'],
    Objects: ['💪', '🎨', '📝', '💡', '🎯', '⭐', '💎', '🔔'],
};
