import { createContext, useContext, useEffect, useRef, useState } from 'react';
import axios from 'axios';

const PresenceContext = createContext({
    onlineUsers: new Set(),
    isOnline: () => false,
});

export function PresenceProvider({ currentUserId, children }) {
    const [onlineUsers, setOnlineUsers] = useState(new Set());
    const heartbeatRef = useRef(null);
    const channelRef = useRef(null);

    useEffect(() => {
        if (!currentUserId || !window.Echo) return;

        // Join the global presence channel.
        const channel = window.Echo.join('presence.global');
        channelRef.current = channel;

        channel.here((users) => {
            const ids = new Set((users || []).map((u) => u.id));
            setOnlineUsers(ids);
        });

        channel.joining((user) => {
            setOnlineUsers((prev) => {
                const next = new Set(prev);
                next.add(user.id);
                return next;
            });
        });

        channel.leaving((user) => {
            setOnlineUsers((prev) => {
                const next = new Set(prev);
                next.delete(user.id);
                return next;
            });
        });

        // Heartbeat every 60 seconds to keep last_seen_at fresh.
        const sendHeartbeat = () => {
            axios.post(route('presence.heartbeat')).catch(() => { /* ignore */ });
        };

        sendHeartbeat();
        heartbeatRef.current = setInterval(sendHeartbeat, 60_000);

        return () => {
            if (heartbeatRef.current) clearInterval(heartbeatRef.current);
            try { window.Echo.leave('presence.global'); } catch { /* ignore */ }
        };
    }, [currentUserId]);

    const value = {
        onlineUsers,
        isOnline: (userId) => onlineUsers.has(userId),
    };

    return (
        <PresenceContext.Provider value={value}>
            {children}
        </PresenceContext.Provider>
    );
}

export function usePresence() {
    return useContext(PresenceContext);
}
