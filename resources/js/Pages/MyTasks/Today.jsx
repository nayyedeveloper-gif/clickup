import { router } from '@inertiajs/react';
import { useState } from 'react';
import HomeShell from '@/Components/HomeShell';
import TaskRow from '@/Components/TaskRow';
import { ChevronDown, ChevronRight, Calendar } from 'lucide-react';

export default function Today({ today_tasks, overdue, upcoming, unscheduled }) {
    const [expanded, setExpanded] = useState({ today: true, overdue: true, next: false, unscheduled: false });
    const toggle = (k) => setExpanded((s) => ({ ...s, [k]: !s[k] }));

    const refresh = () => router.reload({ only: ['today_tasks', 'overdue', 'upcoming', 'unscheduled'] });

    const groups = [
        { key: 'today', label: 'Today', tasks: today_tasks },
        { key: 'overdue', label: 'Overdue', tasks: overdue },
        { key: 'next', label: 'Next', tasks: upcoming },
        { key: 'unscheduled', label: 'Unscheduled', tasks: unscheduled },
    ];

    return (
        <HomeShell
            title={
                <span className="flex items-center gap-2">
                    <span className="text-neutral-400">My Tasks /</span> Today &amp; Overdue
                </span>
            }
        >
            <div className="grid grid-cols-2">
                {/* My Work */}
                <div className="border-r border-neutral-800">
                    <div className="px-4 py-3 border-b border-neutral-800 text-sm font-semibold">
                        My Work
                    </div>
                    {groups.map((g) => (
                        <div key={g.key}>
                            <button
                                onClick={() => toggle(g.key)}
                                className="w-full flex items-center gap-1 px-4 py-2 hover:bg-neutral-800/40 text-xs uppercase tracking-wider text-neutral-400"
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
                </div>

                {/* Agenda */}
                <div>
                    <div className="px-4 py-3 border-b border-neutral-800 text-sm font-semibold">
                        Agenda
                    </div>
                    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                        <Calendar size={48} className="text-neutral-700 mb-4" />
                        <p className="text-sm text-neutral-400 max-w-xs mb-4">
                            Connect your calendar to view upcoming events and join your next call.
                        </p>
                        <div className="space-y-2 w-full max-w-xs">
                            <div className="flex items-center justify-between px-3 py-2 bg-neutral-800/40 rounded-md text-sm">
                                <span>Google Calendar</span>
                                <button className="px-2 py-0.5 rounded bg-neutral-700 hover:bg-neutral-600 text-xs">
                                    Connect
                                </button>
                            </div>
                            <div className="flex items-center justify-between px-3 py-2 bg-neutral-800/40 rounded-md text-sm">
                                <span>Microsoft Outlook</span>
                                <button className="px-2 py-0.5 rounded bg-neutral-700 hover:bg-neutral-600 text-xs">
                                    Connect
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </HomeShell>
    );
}
