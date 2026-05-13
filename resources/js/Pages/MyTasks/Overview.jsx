import { Link, router, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import HomeShell from '@/Components/HomeShell';
import TaskRow from '@/Components/TaskRow';
import { ChevronDown, ChevronRight, FileText, Calendar } from 'lucide-react';

export default function Overview({ today_tasks, overdue, upcoming, unscheduled, done, delegated, recents, assigned }) {
    const { auth } = usePage().props;
    const userName = auth?.user?.name?.split(' ')[0] || 'there';

    const [tab, setTab] = useState('todo'); // 'todo' | 'done' | 'delegated'
    const [expanded, setExpanded] = useState({
        today: true,
        overdue: true,
        next: false,
        unscheduled: false,
    });

    const toggle = (k) => setExpanded((s) => ({ ...s, [k]: !s[k] }));

    const greeting = useMemo(() => {
        const h = new Date().getHours();
        if (h < 5) return 'Good night';
        if (h < 12) return 'Good morning';
        if (h < 18) return 'Good afternoon';
        return 'Good evening';
    }, []);

    const refresh = () => router.reload({ only: ['today_tasks', 'overdue', 'upcoming', 'unscheduled', 'done', 'delegated', 'recents', 'assigned'] });

    const groups = tab === 'todo'
        ? [
            { key: 'today', label: 'Today', tasks: today_tasks },
            { key: 'overdue', label: 'Overdue', tasks: overdue },
            { key: 'next', label: 'Next', tasks: upcoming },
            { key: 'unscheduled', label: 'Unscheduled', tasks: unscheduled },
        ]
        : tab === 'done'
        ? [{ key: 'done', label: 'Done', tasks: done }]
        : [{ key: 'delegated', label: 'Delegated', tasks: delegated }];

    return (
        <HomeShell title="My Tasks" showMobileBack={false}>
            <div className="px-6 py-5">
                <h2 className="text-2xl font-semibold mb-5">{greeting}, {userName}</h2>

                <div className="grid grid-cols-2 gap-4">
                    {/* Recents card */}
                    <Card title="Recents" icon={<FileText size={14} />}>
                        {recents.length === 0 && <Empty text="Nothing recent" />}
                        <div className="space-y-1">
                            {recents.map((t) => (
                                <Link
                                    key={t.id}
                                    href={route('lists.show', t.task_list_id || t.list?.id || 0)}
                                    className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-neutral-800/60 text-sm"
                                >
                                    <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
                                    <span className="truncate">{t.title}</span>
                                    {t.list?.name && (
                                        <span className="text-xs text-neutral-500 truncate">
                                            · in {t.list.name}
                                        </span>
                                    )}
                                </Link>
                            ))}
                        </div>
                    </Card>

                    {/* Agenda card */}
                    <Card title="Agenda" icon={<Calendar size={14} />}>
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            <Calendar size={36} className="text-neutral-700 mb-3" />
                            <p className="text-sm text-neutral-400 max-w-xs">
                                Connect your calendar to view upcoming events and join your next call.
                            </p>
                            <div className="mt-4 space-y-2 w-full max-w-xs">
                                <CalendarBtn name="Google Calendar" />
                                <CalendarBtn name="Microsoft Outlook" />
                            </div>
                        </div>
                    </Card>

                    {/* My Work card spans full width */}
                    <Card
                        title="My Work"
                        className="col-span-1"
                        tabs={
                            <div className="flex items-center gap-3 text-sm">
                                <TabBtn active={tab === 'todo'} onClick={() => setTab('todo')}>To Do</TabBtn>
                                <TabBtn active={tab === 'done'} onClick={() => setTab('done')}>Done</TabBtn>
                                <TabBtn active={tab === 'delegated'} onClick={() => setTab('delegated')}>Delegated</TabBtn>
                            </div>
                        }
                    >
                        {groups.map((g) => (
                            <div key={g.key}>
                                <button
                                    onClick={() => toggle(g.key)}
                                    className="w-full flex items-center gap-1 px-2 py-1.5 hover:bg-neutral-800/40 text-xs uppercase tracking-wider text-neutral-400"
                                >
                                    {expanded[g.key] ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                                    <span>{g.label}</span>
                                    <span className="text-neutral-500">{g.tasks.length}</span>
                                </button>
                                {expanded[g.key] && g.tasks.length > 0 && (
                                    <div>
                                        {g.tasks.map((t) => (
                                            <TaskRow key={t.id} task={t} onChange={refresh} />
                                        ))}
                                    </div>
                                )}
                                {expanded[g.key] && g.tasks.length === 0 && (
                                    <div className="px-4 py-2 text-xs text-neutral-500 italic">No tasks</div>
                                )}
                            </div>
                        ))}
                    </Card>

                    {/* Assigned to me card */}
                    <Card title="Assigned to me">
                        {assigned.length === 0 ? (
                            <Empty text="Nothing assigned to you" />
                        ) : (
                            <div className="-mx-4">
                                {assigned.slice(0, 8).map((t) => (
                                    <TaskRow key={t.id} task={t} onChange={refresh} />
                                ))}
                                {assigned.length > 8 && (
                                    <Link
                                        href={route('my-tasks.assigned')}
                                        className="block px-4 py-2 text-xs text-purple-400 hover:underline"
                                    >
                                        View all ({assigned.length})
                                    </Link>
                                )}
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </HomeShell>
    );
}

function Card({ title, icon, tabs, children, className = '' }) {
    return (
        <div className={`bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden ${className}`}>
            <div className="px-4 py-3 border-b border-neutral-800 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold">
                    {icon}
                    <span>{title}</span>
                </div>
                {tabs}
            </div>
            <div className="p-2">{children}</div>
        </div>
    );
}

function TabBtn({ active, onClick, children }) {
    return (
        <button
            onClick={onClick}
            className={`relative pb-1 ${
                active
                    ? 'text-white border-b-2 border-purple-500'
                    : 'text-neutral-400 hover:text-white'
            }`}
        >
            {children}
        </button>
    );
}

function CalendarBtn({ name }) {
    return (
        <div className="flex items-center justify-between px-3 py-2 bg-neutral-800/40 hover:bg-neutral-800 rounded-md text-sm">
            <span>{name}</span>
            <button className="px-2 py-0.5 rounded bg-neutral-700 hover:bg-neutral-600 text-xs">
                Connect
            </button>
        </div>
    );
}

function Empty({ text }) {
    return <div className="px-3 py-6 text-center text-xs text-neutral-500 italic">{text}</div>;
}
