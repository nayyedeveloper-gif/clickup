import { Link } from '@inertiajs/react';
import Sidebar from '@/Components/Sidebar';
import { Building2, Users, Target } from 'lucide-react';

const TABS = [
    { id: 'contacts', label: 'Contacts', icon: Users, route: 'crm.contacts.index' },
    { id: 'companies', label: 'Companies', icon: Building2, route: 'crm.companies.index' },
    { id: 'deals', label: 'Deals', icon: Target, route: 'crm.deals.index' },
];

export default function CrmShell({ active, children, actions }) {
    return (
        <div className="flex h-screen bg-neutral-950 text-neutral-100 overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="px-6 pt-4 border-b border-neutral-800">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold">CRM</h1>
                        <div>{actions}</div>
                    </div>
                    <div className="mt-3 flex items-center gap-1">
                        {TABS.map((t) => {
                            const Icon = t.icon;
                            return (
                                <Link
                                    key={t.id}
                                    href={route(t.route)}
                                    className={`flex items-center gap-1.5 px-3 py-2 text-sm border-b-2 ${
                                        active === t.id
                                            ? 'border-purple-500 text-white'
                                            : 'border-transparent text-neutral-400 hover:text-white'
                                    }`}
                                >
                                    <Icon size={14} />
                                    {t.label}
                                </Link>
                            );
                        })}
                    </div>
                </div>
                <div className="flex-1 overflow-auto p-6">{children}</div>
            </div>
        </div>
    );
}
