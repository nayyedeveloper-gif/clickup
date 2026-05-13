import { Link, usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { Hash, Home, MessageSquare, UserCheck, UserRound } from 'lucide-react';

const BODY_CLASS = 'has-mobile-bottom-nav';

function canSeeChat(auth) {
    if (!auth?.user) return false;
    if (auth.user.role_id === 1) return true;
    return auth.user.permissions?.includes('chat.view');
}

/**
 * Fixed bottom tab bar (lg:hidden). Toggles body padding via class for scroll clearance.
 */
export default function MobileBottomNav() {
    const { url, props } = usePage();
    const auth = props.auth;
    const badges = props.badges || {};

    useEffect(() => {
        const mq = window.matchMedia('(max-width: 1023px)');
        const sync = () => {
            if (mq.matches) {
                document.body.classList.add(BODY_CLASS);
            } else {
                document.body.classList.remove(BODY_CLASS);
            }
        };
        sync();
        mq.addEventListener('change', sync);
        return () => {
            mq.removeEventListener('change', sync);
            document.body.classList.remove(BODY_CLASS);
        };
    }, []);

    const items = [
        {
            id: 'home',
            label: 'Home',
            icon: Home,
            href: route('inbox.index'),
            active: () => url.startsWith('/inbox') || url.startsWith('/replies') || url.startsWith('/assigned-comments') || url === '/' || url.startsWith('/home'),
        },
        ...(canSeeChat(auth)
            ? [
                  {
                      id: 'channels',
                      label: 'Channels',
                      icon: Hash,
                      href: route('channels.index'),
                      active: () => url.startsWith('/channels'),
                      badge: badges.chat > 0 ? (badges.chat > 99 ? '99+' : badges.chat) : null,
                  },
              ]
            : []),
        {
            id: 'dms',
            label: 'DMs',
            icon: MessageSquare,
            href: route('messages.index'),
            active: () => url.startsWith('/messages'),
        },
        {
            id: 'tasks',
            label: 'Tasks',
            icon: UserCheck,
            href: route('my-tasks.assigned'),
            active: () => url.startsWith('/my-tasks'),
        },
        {
            id: 'profile',
            label: 'Me',
            icon: UserRound,
            href: route('profile.edit'),
            active: () => url.startsWith('/profile'),
        },
    ];

    return (
        <nav
            className="fixed bottom-0 left-0 right-0 z-[100] border-t border-neutral-800 bg-neutral-950/95 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-md supports-[backdrop-filter]:bg-neutral-950/85 lg:hidden"
            aria-label="Main navigation"
        >
            <div className="mx-auto flex max-w-lg items-stretch justify-around px-0.5">
                {items.map((item) => {
                    const Icon = item.icon;
                    const active = item.active();
                    return (
                        <Link
                            key={item.id}
                            href={item.href}
                            className={`relative flex min-h-[52px] min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1 text-[11px] font-medium transition-colors ${
                                active ? 'text-purple-400' : 'text-neutral-500 hover:text-neutral-200'
                            }`}
                        >
                            <span className="relative">
                                <Icon className="h-6 w-6" strokeWidth={active ? 2.4 : 2} />
                                {item.badge ? (
                                    <span className="absolute -right-1.5 -top-1 flex h-[15px] min-w-[15px] items-center justify-center rounded-full bg-purple-600 px-0.5 text-[8px] font-bold text-white">
                                        {item.badge}
                                    </span>
                                ) : null}
                            </span>
                            <span className="truncate">{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
