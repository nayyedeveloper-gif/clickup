import { useEffect, useRef } from 'react';
import { REACTION_CATEGORIES } from './helpers';

export default function ReactionPicker({ onReact, onClose, align = 'right' }) {
    const ref = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) onClose();
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [onClose]);

    return (
        <div
            ref={ref}
            className={`absolute bottom-full ${align === 'right' ? 'right-0' : 'left-0'} mb-2 w-72 rounded-xl bg-neutral-900 border border-neutral-800 shadow-2xl shadow-black/40 z-50 overflow-hidden`}
        >
            <div className="p-3 space-y-3">
                {Object.entries(REACTION_CATEGORIES).map(([label, emojis]) => (
                    <div key={label}>
                        <div className="px-1 mb-1.5 text-[10px] font-medium uppercase tracking-wider text-neutral-500">
                            {label}
                        </div>
                        <div className="grid grid-cols-8 gap-0.5">
                            {emojis.map((emoji) => (
                                <button
                                    key={emoji}
                                    type="button"
                                    onClick={() => { onReact(emoji); onClose(); }}
                                    className="w-8 h-8 flex items-center justify-center text-lg rounded-md hover:bg-neutral-800 active:scale-95 transition"
                                    title={emoji}
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
