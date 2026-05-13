import { useMemo } from 'react';

/**
 * Deterministic, beautiful gradient avatar.
 * Hashes the name so every user gets a stable, unique gradient.
 */
const GRADIENTS = [
    'from-purple-500 to-pink-500',
    'from-blue-500 to-cyan-500',
    'from-emerald-500 to-teal-500',
    'from-orange-500 to-rose-500',
    'from-indigo-500 to-purple-500',
    'from-amber-500 to-orange-500',
    'from-fuchsia-500 to-pink-500',
    'from-sky-500 to-indigo-500',
    'from-lime-500 to-emerald-500',
    'from-rose-500 to-red-500',
];

const SIZES = {
    xs: 'w-5 h-5 text-[9px]',
    sm: 'w-6 h-6 text-[10px]',
    md: 'w-9 h-9 text-sm',
    lg: 'w-11 h-11 text-base',
    xl: 'w-14 h-14 text-lg',
    '6': 'w-6 h-6 text-[10px]',
};

function hashIndex(str, mod) {
    let h = 0;
    for (let i = 0; i < (str || '').length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
    return Math.abs(h) % mod;
}

export default function Avatar({ name, src = null, size = 'md', status = null, className = '' }) {
    const gradient = useMemo(() => GRADIENTS[hashIndex(name || '', GRADIENTS.length)], [name]);
    const letter = (name || '?').trim().charAt(0).toUpperCase();

    return (
        <div className={`relative shrink-0 ${className}`}>
            {src ? (
                <img
                    src={src}
                    alt={name || 'avatar'}
                    className={`${SIZES[size]} rounded-full object-cover ring-1 ring-white/5 select-none aspect-square`}
                    draggable={false}
                />
            ) : (
                <span
                    className={`${SIZES[size]} rounded-full bg-gradient-to-br ${gradient} text-white font-semibold flex items-center justify-center ring-1 ring-white/5 select-none aspect-square`}
                >
                    {letter}
                </span>
            )}
            {status && (
                <span
                    className={`absolute bottom-0 right-0 rounded-full ring-2 ring-neutral-950 ${
                        size === 'xs' || size === 'sm' ? 'w-1.5 h-1.5' : 'w-2.5 h-2.5'
                    } ${status === 'online' ? 'bg-emerald-500' : status === 'away' ? 'bg-amber-500' : 'bg-neutral-500'}`}
                />
            )}
        </div>
    );
}
