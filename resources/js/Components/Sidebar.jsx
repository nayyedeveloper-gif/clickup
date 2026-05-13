import { Link, usePage, router } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import NewSpaceModal from '@/Components/Modals/NewSpaceModal';
import NewChannelModal from '@/Components/Modals/NewChannelModal';
import NewDmModal from '@/Components/Modals/NewDmModal';
import { usePresence } from '@/Contexts/PresenceContext';
import NotificationBell, {
    CLOSE_NOTIFICATION_EVENT,
    CLOSE_PROFILE_EVENT,
} from '@/Components/NotificationBell';
import MobileBottomNav from '@/Components/Mobile/MobileBottomNav';
import {
    Home,
    CalendarDays,
    Users,
    Plus,
    ChevronDown,
    ChevronRight,
    Inbox,
    MessageSquareReply,
    MessageSquare,
    CheckSquare,
    UserCheck,
    CalendarClock,
    ListChecks,
    Hash,
    UserPlus,
    Search,
    Layers,
    Folder as FolderIcon,
    List as ListIcon,
    Star,
    LogOut,
    Target,
    BarChart3,
    Briefcase,
    Shield,
    Settings,
    LayoutGrid,
    LayoutList,
    Rocket,
    Code,
    Palette,
    ShoppingCart,
    Heart,
    Zap,
    Globe,
    Cpu,
    X,
} from 'lucide-react';

const SPACE_ICONS = {
    Layers,
    Rocket,
    Briefcase,
    Code,
    Palette,
    ShoppingCart,
    Heart,
    Zap,
    Target,
    Shield,
    Globe,
    Cpu,
};

const railItems = [
    { id: 'home', label: 'Home', icon: Home, route: 'inbox.index', permission: null },
    { id: 'chat', label: 'Chat', icon: MessageSquare, route: 'channels.index', permission: 'chat.view' },
    { id: 'planner', label: 'Planner', icon: CalendarDays, route: 'planner.index', permission: 'planner.view' },
    { id: 'teams', label: 'Teams', icon: Users, route: 'teams.index', permission: 'teams.view' },
    { id: 'goals', label: 'Goals', icon: Target, route: 'goals.index', permission: 'goals.view' },
    { id: 'dashboards', label: 'Dash', icon: BarChart3, route: 'dashboards.index', permission: 'dashboards.view' },
    { id: 'crm', label: 'CRM', icon: Briefcase, route: 'crm.contacts.index', permission: 'crm.view' },
    { id: 'users', label: 'Users', icon: UserCheck, route: 'users.index', permission: 'users.view' },
];

const homeMenu = [
    { id: 'inbox', label: 'Inbox', icon: Inbox, route: 'inbox.index', badgeKey: 'inbox' },
    { id: 'replies', label: 'Replies', icon: MessageSquareReply, route: 'replies.index', badgeKey: 'replies' },
    { id: 'comments', label: 'Assigned Comments', icon: MessageSquare, route: 'assigned-comments.index', badgeKey: 'assignedComments' },
];

const myTasksItems = [
    { id: 'assigned', label: 'Assigned to me', icon: UserCheck, route: 'my-tasks.assigned', badgeKey: 'assigned' },
    { id: 'today', label: 'Today & Overdue', icon: CalendarClock, route: 'my-tasks.today', badgeKey: 'today' },
    { id: 'personal', label: 'Personal List', icon: ListChecks, route: 'my-tasks.personal' },
];

/** Persist space/folder chevrons across full Inertia remounts (useRemember alone is unreliable here). */
function loadSidebarExpanded(storageKey) {
    if (typeof window === 'undefined') return {};
    try {
        const raw = sessionStorage.getItem(storageKey);
        if (!raw) return {};
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch {
        return {};
    }
}

function saveSidebarExpanded(storageKey, data) {
    if (typeof window === 'undefined') return;
    try {
        sessionStorage.setItem(storageKey, JSON.stringify(data));
    } catch {
        // ignore quota / private mode
    }
}

function loadSidebarScroll(storageKey) {
    if (typeof window === 'undefined') return 0;
    try {
        const raw = sessionStorage.getItem(storageKey);
        const value = Number(raw);
        return Number.isFinite(value) && value >= 0 ? value : 0;
    } catch {
        return 0;
    }
}

function saveSidebarScroll(storageKey, scrollTop) {
    if (typeof window === 'undefined') return;
    try {
        sessionStorage.setItem(storageKey, String(Math.max(0, Math.floor(scrollTop))));
    } catch {
        // ignore quota / private mode
    }
}

function SectionHeader({ title, action, onAction }) {
    return (
        <div className="flex items-center justify-between px-3 pt-4 pb-2 group">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                {title}
            </span>
            {action && (
                <button
                    onClick={onAction}
                    className="opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-white transition"
                    title={action}
                >
                    <Plus size={14} />
                </button>
            )}
        </div>
    );
}

function NavItem({ icon: Icon, label, href, active, badge, indent = 0, trailing }) {
    const content = (
        <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
                active
                    ? 'bg-neutral-800 text-white'
                    : 'text-neutral-300 hover:bg-neutral-800/70 hover:text-white'
            }`}
            style={{ paddingLeft: 12 + indent * 16 }}
        >
            {Icon && <Icon size={15} className="text-neutral-400 shrink-0" />}
            <span className="flex-1 truncate">{label}</span>
            {badge != null && badge > 0 && (
                <span className="text-[9px] bg-purple-600 text-white font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 shadow-sm">
                    {badge > 9 ? '9+' : badge}
                </span>
            )}
            {trailing}
        </div>
    );

    if (href) {
        return <Link href={href}>{content}</Link>;
    }
    return <button className="w-full text-left">{content}</button>;
}

function ListNode({ list, level, currentUrl }) {
    const active = currentUrl.startsWith(`/lists/${list.id}`);
    return (
        <NavItem
            icon={ListIcon}
            label={list.name}
            href={route('lists.show', list.id)}
            active={active}
            indent={level}
            badge={list.active_tasks_count}
        />
    );
}

function FolderNode({ folder, level, currentUrl, expanded, onToggle }) {
    const isOpen = expanded[`f-${folder.id}`] ?? false;
    return (
        <div>
            <button
                type="button"
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onToggle(`f-${folder.id}`);
                }}
                className="w-full text-left flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-neutral-300 hover:bg-neutral-800/70 hover:text-white"
                style={{ paddingLeft: 12 + level * 16 }}
            >
                {isOpen ? (
                    <ChevronDown size={12} className="text-neutral-500 shrink-0" />
                ) : (
                    <ChevronRight size={12} className="text-neutral-500 shrink-0" />
                )}
                <FolderIcon size={14} className="text-neutral-400 shrink-0" />
                <span className="flex-1 truncate">{folder.name}</span>
                {folder.active_tasks_count > 0 && (
                    <span className="text-[10px] text-neutral-500 font-bold px-1.5 py-0.5 rounded-full bg-neutral-800/50">
                        {folder.active_tasks_count}
                    </span>
                )}
            </button>
            {isOpen &&
                (folder.lists || []).map((list) => (
                    <ListNode
                        key={list.id}
                        list={list}
                        level={level + 1}
                        currentUrl={currentUrl}
                    />
                ))}
        </div>
    );
}

function getSpaceTotals(space) {
    const children = space?.children || [];
    const ownActive = Number(space?.active_tasks_count || 0);
    const ownCompleted = Number(space?.completed_tasks_count || 0);

    return children.reduce(
        (acc, child) => {
            const childTotals = getSpaceTotals(child);
            acc.active += childTotals.active;
            acc.completed += childTotals.completed;
            return acc;
        },
        { active: ownActive, completed: ownCompleted },
    );
}

function SpaceNode({ space, level, currentUrl, expanded, onToggle, onToggleRoot }) {
    const isOpen = expanded[`s-${space.id}`] ?? false;
    const isActive = currentUrl.includes(`/spaces/${space.id}`);
    const Icon = SPACE_ICONS[space.icon] || Layers;
    const totals = useMemo(() => getSpaceTotals(space), [space]);

    const handleChevronClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (level === 0 && onToggleRoot) {
            onToggleRoot(space.id);
        } else {
            onToggle(`s-${space.id}`);
        }
    };

    return (
        <div>
            <div className="flex items-center group px-1">
                <button
                    type="button"
                    onClick={handleChevronClick}
                    className="text-neutral-500 hover:text-white p-1 transition-transform"
                    style={{ marginLeft: level * 12 }}
                >
                    {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                </button>
                <Link
                    href={route('spaces.show', space.id)}
                    className={`flex-1 flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-sm transition-all duration-200 ${
                        isActive
                            ? 'bg-neutral-800 text-white shadow-md'
                            : 'text-neutral-400 hover:bg-neutral-800/60 hover:text-white'
                    }`}
                >
                    <div 
                        className="w-7 h-7 rounded-md shrink-0 flex items-center justify-center transition-all duration-300" 
                        style={{ 
                            backgroundColor: `${space.color || '#94a3b8'}15`,
                            color: space.color || '#94a3b8',
                            boxShadow: isActive ? `0 0 10px ${(space.color || '#94a3b8')}20` : 'none'
                        }} 
                    >
                        <Icon size={14} strokeWidth={2.5} />
                    </div>
                    <span className={`flex-1 truncate ${isActive ? 'font-black' : 'font-semibold'}`}>{space.name}</span>
                    <div className="flex items-center gap-1 shrink-0">
                        {totals.completed > 0 && (
                            <span className="text-[9px] bg-emerald-600/20 text-emerald-300 font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                                {totals.completed > 99 ? '99+' : totals.completed}
                            </span>
                        )}
                        {totals.active > 0 && (
                            <span className="text-[9px] bg-purple-600 text-white font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 shadow-sm">
                                {totals.active > 99 ? '99+' : totals.active}
                            </span>
                        )}
                    </div>
                </Link>
            </div>
            {isOpen && (
                <>
                    {(space.folders || []).map((folder) => (
                        <FolderNode
                            key={folder.id}
                            folder={folder}
                            level={level + 1}
                            currentUrl={currentUrl}
                            expanded={expanded}
                            onToggle={onToggle}
                        />
                    ))}
                    {(space.lists || []).map((list) => (
                        <ListNode
                            key={list.id}
                            list={list}
                            level={level + 1}
                            currentUrl={currentUrl}
                        />
                    ))}
                    {(space.children || []).map((child) => (
                        <SpaceNode
                            key={child.id}
                            space={child}
                            level={level + 1}
                            currentUrl={currentUrl}
                            expanded={expanded}
                            onToggle={onToggle}
                            onToggleRoot={onToggleRoot}
                        />
                    ))}
                </>
            )}
        </div>
    );
}

export default function Sidebar() {
    const { url, props } = usePage();
    const auth = props.auth;
    const sidebarData = props.sidebar || { spaces: [], channels: [], directMessages: [], allMembers: [] };
    const { spaces = [], channels = [], directMessages: [], allMembers = [] } = sidebarData;
    const badges = props.badges || {};
    const [memberSearch, setMemberSearch] = useState('');
    const { isOnline } = usePresence();
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    const filteredMembers = useMemo(() => {
        if (!memberSearch.trim()) return allMembers;
        const q = memberSearch.toLowerCase().trim();
        return allMembers.filter(m => 
            m.name?.toLowerCase().includes(q) || 
            m.email?.toLowerCase().includes(q)
        );
    }, [allMembers, memberSearch]);

    const railItemsWithBadges = useMemo(() => {
        return railItems
            .filter(item => {
                // If no permission required, show item
                if (!item.permission) return true;
                // If user has admin role (role_id === 1), show all items
                if (auth?.user?.role_id === 1) return true;
                // Check if user has the required permission
                return auth?.user?.permissions?.includes(item.permission);
            })
            .map(item => ({
                ...item,
                badge: item.id === 'chat' ? badges.chat : null
            }));
    }, [badges, auth]);

    const [openSections, setOpenSections] = useState({
        myTasks: true,
        favorites: true,
        spaces: true,
        chat: true,
    });
    const expandedStorageKey = `sidebar.spacesExpanded.${auth?.user?.id ?? 'guest'}`;
    const [expandedTree, setExpandedTree] = useState(() => loadSidebarExpanded(expandedStorageKey));

    useEffect(() => {
        setExpandedTree(loadSidebarExpanded(expandedStorageKey));
    }, [expandedStorageKey]);

    const [showNewSpace, setShowNewSpace] = useState(false);
    const [showNewChannel, setShowNewChannel] = useState(false);
    const [showNewDm, setShowNewDm] = useState(false);
    const spacesScrollRef = useRef(null);
    const sidebarScrollStorageKey = `sidebar.scrollTop.${auth?.user?.id ?? 'guest'}`;

    const toggle = (key) =>
        setOpenSections((s) => ({ ...s, [key]: !s[key] }));

    const toggleTree = (key) => {
        setExpandedTree((s) => {
            const next = { ...s, [key]: !(s[key] ?? false) };
            saveSidebarExpanded(expandedStorageKey, next);
            return next;
        });
    };

    /** Top-level spaces: only one expanded at a time (accordion). */
    const toggleRootSpace = (spaceId) => {
        setExpandedTree((s) => {
            const key = `s-${spaceId}`;
            const wasOpen = s[key] ?? false;
            const nextOpen = !wasOpen;
            const next = { ...s, [key]: nextOpen };
            if (nextOpen) {
                spaces.forEach((sp) => {
                    if (sp.id !== spaceId) {
                        next[`s-${sp.id}`] = false;
                    }
                });
            }
            saveSidebarExpanded(expandedStorageKey, next);
            return next;
        });
    };

    const userInitial = useMemo(
        () => (auth?.user?.name ? auth.user.name.charAt(0).toUpperCase() : '?'),
        [auth]
    );

    const isActive = (routeName) => {
        try {
            return url.startsWith(route(routeName, undefined, false));
        } catch {
            return false;
        }
    };

    useEffect(() => {
        const el = spacesScrollRef.current;
        if (!el) return;

        const savedScroll = loadSidebarScroll(sidebarScrollStorageKey);
        // Wait for DOM/layout after navigation before restoring scroll position.
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                el.scrollTop = savedScroll;
            });
        });
    }, [url, sidebarScrollStorageKey]);

    useEffect(() => {
        const onOpen = () => setIsMobileOpen(true);
        document.addEventListener('sidebar:open', onOpen);
        return () => document.removeEventListener('sidebar:open', onOpen);
    }, []);

    return (
        <div className="flex h-screen bg-neutral-950 text-neutral-100 select-none">
            {/* Mobile overlay */}
            {isMobileOpen && (
                <div
                    onClick={() => setIsMobileOpen(false)}
                    className="lg:hidden fixed inset-0 bg-black/50 z-40"
                />
            )}

            {/* Sidebar container */}
            <div className={`fixed lg:relative z-50 lg:z-auto h-full transition-transform duration-300 lg:translate-x-0 flex ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                {/* Icon rail */}
                <div className="w-14 bg-neutral-950 border-r border-neutral-800 flex flex-col items-center py-3 flex-shrink-0">
                    <div className="flex flex-col gap-1 flex-1">
                        {railItemsWithBadges.map((item) => {
                            const active = item.route ? isActive(item.route) : false;
                            const Icon = item.icon;
                            const button = (
                                <div
                                    className={`w-10 h-10 flex flex-col items-center justify-center rounded-md text-[10px] gap-0.5 transition-colors relative ${
                                        active
                                            ? 'bg-neutral-800 text-white'
                                            : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
                                    }`}
                                >
                                    <Icon size={18} />
                                    <span>{item.label}</span>
                                    {item.badge > 0 && (
                                        <span className="absolute top-0 right-0 w-4 h-4 bg-purple-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-lg transform translate-x-1 -translate-y-1">
                                            {item.badge > 99 ? '99+' : item.badge}
                                        </span>
                                    )}
                                </div>
                            );
                            return item.route ? (
                                <Link key={item.id} href={route(item.route)} title={item.label}>
                                    {button}
                                </Link>
                        ) : (
                            <button key={item.id} title={item.label}>
                                {button}
                            </button>
                        );
                    })}
                </div>
                <div className="flex flex-col items-center gap-2 pb-4">
                    {(auth?.user?.permissions?.includes('invite.users') || auth?.user?.role_id === 1) && (
                        <Link
                            href={route('invite.index')}
                            className={`w-10 h-10 flex flex-col items-center justify-center rounded-md text-[10px] gap-0.5 ${
                                isActive('invite.index')
                                    ? 'bg-neutral-800 text-white'
                                    : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
                            }`}
                            title="Invite"
                        >
                            <UserPlus size={18} />
                            <span>Invite</span>
                        </Link>
                    )}
                    
                    <div className="border-t border-neutral-800 w-8 my-1" />

                    <ProfileMenu user={auth?.user} initial={userInitial} />
                </div>
            </div>

            {/* Main sidebar panel */}
            <div className="w-64 bg-neutral-900 border-r border-neutral-800 flex flex-col">
                {/* Workspace header */}
                <div className="px-3 py-3 border-b border-neutral-800 flex items-center gap-2">
                    <img src="/logo.png" alt="29 Management" className="h-8 w-auto" />
                    <div className="flex-1 truncate text-sm font-semibold">
                        {auth?.user?.name ? `${auth.user.name}'s Workspace` : 'Workspace'}
                    </div>
                    <div className="flex items-center gap-1">
                        <NotificationBell />
                        <button
                            onClick={() => setIsMobileOpen(false)}
                            className="lg:hidden w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Search */}
                <div className="px-3 py-2 border-b border-neutral-800">
                    <div className="flex items-center gap-2 bg-neutral-800/60 rounded-md px-2 py-1.5 text-xs text-neutral-400">
                        <Search size={13} />
                        <span>Search</span>
                    </div>
                </div>

                <div
                    ref={spacesScrollRef}
                    onScroll={(e) => saveSidebarScroll(sidebarScrollStorageKey, e.currentTarget.scrollTop)}
                    className="flex-1 overflow-y-auto py-2"
                >
                    {/* Home section */}
                    <div className="px-1">
                        <div className="flex items-center justify-between px-3 pb-1">
                            <span className="text-sm font-semibold text-white">Home</span>
                            <Plus size={14} className="text-neutral-400 hover:text-white cursor-pointer" />
                        </div>
                        <div className="space-y-0.5">
                            {homeMenu.map((item) => (
                                <NavItem
                                    key={item.id}
                                    icon={item.icon}
                                    label={item.label}
                                    href={item.route ? route(item.route) : null}
                                    active={item.route ? isActive(item.route) : false}
                                    badge={item.badgeKey ? badges[item.badgeKey] || null : null}
                                />
                            ))}
                            <div className="flex items-center group">
                                <button
                                    onClick={() => toggle('myTasks')}
                                    className="text-neutral-500 hover:text-white p-1"
                                >
                                    {openSections.myTasks ? (
                                        <ChevronDown size={12} />
                                    ) : (
                                        <ChevronRight size={12} />
                                    )}
                                </button>
                                <Link
                                    href={route('my-tasks')}
                                    className={`flex-1 flex items-center gap-2 px-2 py-1.5 rounded-md text-sm ${
                                        isActive('my-tasks')
                                            ? 'bg-neutral-800 text-white'
                                            : 'text-neutral-300 hover:bg-neutral-800/70 hover:text-white'
                                    }`}
                                >
                                    <CheckSquare size={15} className="text-neutral-400" />
                                    <span className="flex-1">My Tasks</span>
                                </Link>
                            </div>
                            {openSections.myTasks &&
                                myTasksItems.map((item) => (
                                    <NavItem
                                        key={item.id}
                                        icon={item.icon}
                                        label={item.label}
                                        href={item.route ? route(item.route) : null}
                                        active={item.route ? isActive(item.route) : false}
                                        indent={1}
                                        badge={item.badgeKey ? badges[item.badgeKey] || null : null}
                                    />
                                ))}
                        </div>
                    </div>

                    {/* Favorites */}
                    <SectionHeader title="Favorites" action="Add favorite" />

                    {/* Spaces */}
                    <div className="px-1">
                        <div className="flex items-center justify-between px-3 pt-2 pb-1">
                            <button
                                onClick={() => toggle('spaces')}
                                className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 hover:text-neutral-300 flex items-center gap-1"
                            >
                                Spaces
                            </button>
                            <button
                                onClick={() => setShowNewSpace(true)}
                                className="text-neutral-400 hover:text-white"
                                title="Add space"
                            >
                                <Plus size={14} />
                            </button>
                        </div>
                        {openSections.spaces && (
                            <div className="space-y-0.5">
                                <NavItem
                                    icon={Star}
                                    label={`All Tasks · ${auth?.user?.name ?? 'Workspace'}`}
                                    href={route('all-tasks')}
                                    active={isActive('all-tasks')}
                                />
                                {spaces.map((space) => (
                                    <SpaceNode
                                        key={space.id}
                                        space={space}
                                        level={0}
                                        currentUrl={url}
                                        expanded={expandedTree}
                                        onToggle={toggleTree}
                                        onToggleRoot={toggleRootSpace}
                                    />
                                ))}
                                <button
                                    onClick={() => setShowNewSpace(true)}
                                    className="w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-neutral-400 hover:bg-neutral-800/70 hover:text-white"
                                >
                                    <Plus size={14} />
                                    <span>New Space</span>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Chat Section (Channels + DMs) */}
                    <div className="px-1">
                        <div className="flex items-center group">
                            <button
                                onClick={() => toggle('chat')}
                                className="text-neutral-500 hover:text-white p-1"
                            >
                                {openSections.chat ? (
                                    <ChevronDown size={12} />
                                ) : (
                                    <ChevronRight size={12} />
                                )}
                            </button>
                            <Link
                                href={route('channels.index')}
                                className={`flex-1 flex items-center gap-2 px-2 py-1.5 rounded-md text-sm ${
                                    isActive('channels.index')
                                        ? 'bg-neutral-800 text-white'
                                        : 'text-neutral-300 hover:bg-neutral-800/70 hover:text-white'
                                }`}
                            >
                                <MessageSquare size={15} className="text-neutral-400" />
                                <span className="flex-1">Chat</span>
                            </Link>
                        </div>
                        {openSections.chat && (
                            <div className="space-y-1 mt-1">
                                {/* Channels */}
                                <div className="flex items-center justify-between px-3 pt-2 pb-1">
                                    <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                                        Channels
                                    </span>
                                    <button
                                        onClick={() => setShowNewChannel(true)}
                                        className="text-neutral-400 hover:text-white"
                                        title="Add channel"
                                    >
                                        <Plus size={12} />
                                    </button>
                                </div>
                                <div className="space-y-0.5">
                                    {channels.length === 0 && (
                                        <div className="px-3 py-1 text-xs text-neutral-500 italic">
                                            No channels yet
                                        </div>
                                    )}
                                    {channels.map((channel) => {
                                        const isNew = (badges.newChannels || []).includes(channel.id);
                                        return (
                                            <NavItem
                                                key={channel.id}
                                                icon={Hash}
                                                label={channel.name}
                                                href={route('channels.show', channel.id)}
                                                active={url.includes(`/channels/${channel.id}`)}
                                                indent={1}
                                                trailing={isNew && <div className="w-2 h-2 rounded-full bg-purple-500 shadow-sm shadow-purple-500/50 shrink-0" />}
                                            />
                                        );
                                    })}
                                    <button
                                        onClick={() => setShowNewChannel(true)}
                                        className="w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-neutral-400 hover:bg-neutral-800/70 hover:text-white"
                                        style={{ paddingLeft: 28 }}
                                    >
                                        <Plus size={12} />
                                        <span>Add Channel</span>
                                    </button>
                                </div>

                                {/* Direct Messages */}
                                <div className="flex flex-col gap-2 mt-4">
                                    <div className="flex items-center justify-between px-3">
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-600">
                                            Members
                                        </span>
                                        <span className="text-[9px] bg-neutral-800 text-neutral-500 px-1.5 py-0.5 rounded-full font-bold">
                                            {filteredMembers.length}
                                        </span>
                                    </div>

                                    {/* Member Search */}
                                    <div className="px-3 mb-1">
                                        <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 focus-within:border-purple-500/40 transition-all shadow-inner group">
                                            <Search size={12} className="text-neutral-600 group-focus-within:text-purple-500/50 transition-colors" />
                                            <input
                                                id="member-sidebar-search"
                                                name="member-sidebar-search"
                                                type="text"
                                                value={memberSearch}
                                                onChange={(e) => setMemberSearch(e.target.value)}
                                                placeholder="Search members..."
                                                className="bg-transparent border-none p-0 text-[11px] text-white placeholder:text-neutral-700 focus:ring-0 w-full font-medium"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-0.5 max-h-[300px] overflow-y-auto custom-scrollbar px-1">
                                        {filteredMembers.length === 0 ? (
                                            <div className="px-3 py-6 text-center">
                                                <div className="w-8 h-8 rounded-full bg-neutral-900 mx-auto flex items-center justify-center mb-2">
                                                    <Search size={14} className="text-neutral-700" />
                                                </div>
                                                <p className="text-[10px] text-neutral-600 font-bold uppercase tracking-wider">No results</p>
                                            </div>
                                        ) : filteredMembers.map((user) => {
                                            const unreadCount = (badges.unreadBySender || {})[user.id] || 0;
                                            const isUserActive = url.includes(`user=${user.id}`);
                                            return (
                                                <Link
                                                    key={user.id}
                                                    href={route('messages.index', { user: user.id })}
                                                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                                                        isUserActive 
                                                            ? 'bg-neutral-800 text-white shadow-sm' 
                                                            : 'text-neutral-400 hover:bg-neutral-800/60 hover:text-white'
                                                    }`}
                                                >
                                                    <div className="relative shrink-0">
                                                        {user.avatar_url ? (
                                                            <img
                                                                src={user.avatar_url}
                                                                alt={user.name}
                                                                className="w-6 h-6 rounded-lg object-cover border border-neutral-700/50"
                                                            />
                                                        ) : (
                                                            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-neutral-700 to-neutral-800 flex items-center justify-center text-[10px] font-black text-neutral-300 shadow-inner border border-neutral-700/50 group-hover:scale-105 transition-transform">
                                                                {user.name.charAt(0).toUpperCase()}
                                                            </div>
                                                        )}
                                                        <div className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border-2 border-neutral-900 shadow-sm ${isOnline(user.id) ? 'bg-green-500' : 'bg-neutral-600'}`} />
                                                    </div>
                                                    <span className={`flex-1 truncate ${unreadCount > 0 || isUserActive ? 'font-bold' : 'font-medium'}`}>
                                                        {user.name}
                                                    </span>
                                                    {unreadCount > 0 && (
                                                        <span className="w-4 h-4 bg-purple-600 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-lg shadow-purple-600/20 animate-bounce">
                                                            {unreadCount > 9 ? '9+' : unreadCount}
                                                        </span>
                                                    )}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            </div>

            {showNewSpace && <NewSpaceModal onClose={() => setShowNewSpace(false)} />}
            {showNewChannel && <NewChannelModal onClose={() => setShowNewChannel(false)} />}
            {showNewDm && <NewDmModal onClose={() => setShowNewDm(false)} />}

            <MobileBottomNav />
        </div>
    );
}

function ProfileMenu({ user, initial }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const onClose = () => setOpen(false);
        document.addEventListener(CLOSE_PROFILE_EVENT, onClose);
        return () => document.removeEventListener(CLOSE_PROFILE_EVENT, onClose);
    }, []);

    useEffect(() => {
        if (!open) return;
        const onClickOutside = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', onClickOutside);
        return () => document.removeEventListener('mousedown', onClickOutside);
    }, [open]);

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                onClick={() =>
                    setOpen((o) => {
                        const next = !o;
                        if (next) {
                            document.dispatchEvent(new Event(CLOSE_NOTIFICATION_EVENT));
                        }
                        return next;
                    })
                }
                className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm shadow-lg ring-2 ring-neutral-900 hover:ring-purple-500/50 transition-all duration-200 active:scale-90"
                title={user?.name || 'Profile'}
            >
                {user?.avatar_url ? (
                    <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                    initial
                )}
            </button>
            {open && (
                <div className="absolute left-full bottom-0 ml-3 w-64 bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl overflow-hidden z-[500] animate-in slide-in-from-left-2 duration-200">
                    <div className="px-5 py-4 border-b border-neutral-800 bg-neutral-900/50">
                        <div className="text-sm font-bold text-white truncate">{user?.name || 'User'}</div>
                        <div className="text-xs text-neutral-500 truncate mt-0.5">{user?.email}</div>
                    </div>
                    <div className="py-1.5">
                        <Link
                            href={route('profile.edit')}
                            onClick={() => setOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors"
                        >
                            <Settings size={16} className="text-neutral-500" />
                            <span>Profile Settings</span>
                        </Link>
                        {(user?.role === 'admin' || user?.role === 'owner' || user?.role_id === 1) && (
                            <Link
                                href={route('users.index')}
                                onClick={() => setOpen(false)}
                                className="flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors"
                            >
                                <Shield size={16} className="text-neutral-500" />
                                <span>Users & Permissions</span>
                            </Link>
                        )}
                        <div className="h-px bg-neutral-800 my-1.5 mx-2" />
                        <button
                            type="button"
                            onClick={() => { setOpen(false); router.post(route('logout')); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                            <LogOut size={16} />
                            <span className="font-medium">Log out</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
