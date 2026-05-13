import { Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import CrmShell from '@/Components/CrmShell';
import {
    ChevronLeft,
    Mail,
    Phone,
    Globe,
    MapPin,
    Building2,
    Send,
    Trash2,
    Users,
    DollarSign,
    Calendar,
    FileText,
} from 'lucide-react';

const ACTIVITY_TYPES = [
    { id: 'note', label: 'Note' },
    { id: 'call', label: 'Call' },
    { id: 'email', label: 'Email' },
    { id: 'meeting', label: 'Meeting' },
    { id: 'task', label: 'Task' },
];

const fmt = (amount, currency = 'USD') =>
    new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        maximumFractionDigits: 0,
    }).format(Number(amount || 0));

export default function CompanyDetail({ company }) {
    const [tab, setTab] = useState('contacts');
    const [type, setType] = useState('note');
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');

    const saveField = (field, value) => {
        router.put(
            route('companies.update', company.id),
            { [field]: value === '' ? null : value },
            { preserveScroll: true, preserveState: true }
        );
    };

    const postActivity = (e) => {
        e.preventDefault();
        if (!body.trim() && !subject.trim()) return;
        router.post(
            route('crm.activities.store'),
            {
                company_id: company.id,
                type,
                subject: subject || null,
                body: body || null,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setSubject('');
                    setBody('');
                },
            }
        );
    };

    const deleteActivity = (id) =>
        router.delete(route('crm.activities.destroy', id), { preserveScroll: true });

    const deleteCompany = () => {
        if (!confirm('Delete this company? Related contacts and deals will be unlinked.')) return;
        router.delete(route('companies.destroy', company.id));
    };

    const totalDealValue = (company.deals || [])
        .reduce((sum, d) => sum + Number(d.amount || 0), 0);

    return (
        <CrmShell active="companies">
            <div className="flex items-center justify-between mb-3">
                <Link
                    href={route('companies.index')}
                    className="inline-flex items-center gap-1 text-sm text-neutral-400 hover:text-white"
                >
                    <ChevronLeft size={14} /> Back to companies
                </Link>
                <button
                    onClick={deleteCompany}
                    className="inline-flex items-center gap-1 text-sm text-red-400 hover:text-red-300"
                >
                    <Trash2 size={14} /> Delete
                </button>
            </div>

            <div className="grid grid-cols-3 gap-6">
                {/* Left: profile */}
                <div className="col-span-1 bg-neutral-900 border border-neutral-800 rounded-lg p-5 h-fit">
                    <div
                        className="w-16 h-16 rounded-lg flex items-center justify-center text-white text-2xl font-bold mb-3"
                        style={{ background: company.color || '#6366f1' }}
                    >
                        {company.name.charAt(0).toUpperCase()}
                    </div>
                    <input
                        defaultValue={company.name}
                        onBlur={(e) => {
                            const v = e.target.value.trim();
                            if (v && v !== company.name) saveField('name', v);
                        }}
                        className="w-full bg-transparent text-xl font-semibold border-none focus:outline-none mb-1"
                    />
                    <input
                        defaultValue={company.industry || ''}
                        onBlur={(e) => saveField('industry', e.target.value)}
                        placeholder="Industry"
                        className="w-full bg-transparent text-sm text-neutral-400 border-none focus:outline-none mb-3"
                    />

                    <div className="space-y-2 text-sm">
                        <Row icon={Globe}>
                            <input
                                defaultValue={company.website || ''}
                                onBlur={(e) => saveField('website', e.target.value)}
                                placeholder="Website"
                                className="bg-transparent border-none focus:outline-none w-full"
                            />
                        </Row>
                        <Row icon={Mail}>
                            <input
                                type="email"
                                defaultValue={company.email || ''}
                                onBlur={(e) => saveField('email', e.target.value)}
                                placeholder="Email"
                                className="bg-transparent border-none focus:outline-none w-full"
                            />
                        </Row>
                        <Row icon={Phone}>
                            <input
                                defaultValue={company.phone || ''}
                                onBlur={(e) => saveField('phone', e.target.value)}
                                placeholder="Phone"
                                className="bg-transparent border-none focus:outline-none w-full"
                            />
                        </Row>
                        <Row icon={MapPin}>
                            <input
                                defaultValue={company.address || ''}
                                onBlur={(e) => saveField('address', e.target.value)}
                                placeholder="Address"
                                className="bg-transparent border-none focus:outline-none w-full"
                            />
                        </Row>
                    </div>

                    <div className="mt-4 pt-4 border-t border-neutral-800">
                        <label className="block text-xs text-neutral-400 mb-1">Notes</label>
                        <textarea
                            defaultValue={company.notes || ''}
                            onBlur={(e) => saveField('notes', e.target.value)}
                            rows={4}
                            placeholder="Add notes..."
                            className="w-full bg-neutral-950 border border-neutral-800 rounded-md p-2 text-sm focus:outline-none focus:border-purple-500"
                        />
                    </div>

                    <div className="mt-4 pt-4 border-t border-neutral-800 grid grid-cols-3 gap-2 text-center">
                        <Stat label="Contacts" value={(company.contacts || []).length} />
                        <Stat label="Deals" value={(company.deals || []).length} />
                        <Stat label="Value" value={fmt(totalDealValue)} />
                    </div>
                </div>

                {/* Right: tabs */}
                <div className="col-span-2">
                    <div className="flex gap-1 border-b border-neutral-800 mb-4">
                        <TabBtn active={tab === 'contacts'} onClick={() => setTab('contacts')} icon={Users}>
                            Contacts ({(company.contacts || []).length})
                        </TabBtn>
                        <TabBtn active={tab === 'deals'} onClick={() => setTab('deals')} icon={DollarSign}>
                            Deals ({(company.deals || []).length})
                        </TabBtn>
                        <TabBtn active={tab === 'activities'} onClick={() => setTab('activities')} icon={FileText}>
                            Activities ({(company.activities || []).length})
                        </TabBtn>
                    </div>

                    {tab === 'contacts' && (
                        <div className="space-y-2">
                            {(company.contacts || []).length === 0 && (
                                <Empty>No contacts linked yet.</Empty>
                            )}
                            {(company.contacts || []).map((c) => (
                                <Link
                                    key={c.id}
                                    href={route('contacts.show', c.id)}
                                    className="block bg-neutral-900 border border-neutral-800 rounded-lg p-3 hover:border-neutral-700"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold">
                                            {c.first_name?.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium">
                                                {c.first_name} {c.last_name}
                                            </div>
                                            <div className="text-xs text-neutral-500 truncate">
                                                {c.title || c.email || '—'}
                                            </div>
                                        </div>
                                        <span className="text-xs text-neutral-500 capitalize">{c.status}</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}

                    {tab === 'deals' && (
                        <div className="space-y-2">
                            {(company.deals || []).length === 0 && <Empty>No deals yet.</Empty>}
                            {(company.deals || []).map((d) => (
                                <div
                                    key={d.id}
                                    className="bg-neutral-900 border border-neutral-800 rounded-lg p-3"
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm font-medium">{d.title}</span>
                                        <span className="text-sm font-mono text-neutral-300">
                                            {fmt(d.amount, d.currency)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-neutral-500">
                                        {d.stage && (
                                            <span
                                                className="px-1.5 py-0.5 rounded"
                                                style={{ background: `${d.stage.color}22`, color: d.stage.color }}
                                            >
                                                {d.stage.name}
                                            </span>
                                        )}
                                        {d.expected_close_date && (
                                            <span className="flex items-center gap-1">
                                                <Calendar size={11} /> {d.expected_close_date}
                                            </span>
                                        )}
                                        {d.contact && (
                                            <span>
                                                {d.contact.first_name} {d.contact.last_name}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {tab === 'activities' && (
                        <div>
                            {/* Activity composer */}
                            <form
                                onSubmit={postActivity}
                                className="bg-neutral-900 border border-neutral-800 rounded-lg p-3 mb-4"
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    {ACTIVITY_TYPES.map((t) => (
                                        <button
                                            type="button"
                                            key={t.id}
                                            onClick={() => setType(t.id)}
                                            className={`px-2.5 py-1 rounded-md text-xs ${
                                                type === t.id
                                                    ? 'bg-purple-600 text-white'
                                                    : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                                            }`}
                                        >
                                            {t.label}
                                        </button>
                                    ))}
                                </div>
                                <input
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    placeholder="Subject (optional)"
                                    className="w-full bg-neutral-950 border border-neutral-800 rounded-md px-3 py-2 text-sm mb-2 focus:outline-none focus:border-purple-500"
                                />
                                <textarea
                                    value={body}
                                    onChange={(e) => setBody(e.target.value)}
                                    rows={2}
                                    placeholder="Log a note, call, meeting…"
                                    className="w-full bg-neutral-950 border border-neutral-800 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
                                />
                                <div className="flex justify-end mt-2">
                                    <button
                                        type="submit"
                                        disabled={!body.trim() && !subject.trim()}
                                        className="flex items-center gap-1 px-3 py-1.5 rounded-md text-xs bg-purple-600 hover:bg-purple-500 disabled:opacity-40"
                                    >
                                        <Send size={12} /> Log activity
                                    </button>
                                </div>
                            </form>

                            <div className="space-y-2">
                                {(company.activities || []).length === 0 && (
                                    <Empty>No activities logged.</Empty>
                                )}
                                {(company.activities || []).map((a) => (
                                    <div
                                        key={a.id}
                                        className="bg-neutral-900 border border-neutral-800 rounded-lg p-3 group"
                                    >
                                        <div className="flex items-center gap-2 text-xs text-neutral-400 mb-1">
                                            <span className="px-1.5 py-0.5 rounded bg-neutral-800 capitalize">
                                                {a.type}
                                            </span>
                                            <span>{a.user?.name}</span>
                                            <span>·</span>
                                            <span>{new Date(a.happened_at).toLocaleString()}</span>
                                            <div className="flex-1" />
                                            <button
                                                onClick={() => deleteActivity(a.id)}
                                                className="opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-red-400"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                        {a.subject && (
                                            <div className="text-sm font-medium mb-0.5">{a.subject}</div>
                                        )}
                                        {a.body && (
                                            <div className="text-sm text-neutral-300 whitespace-pre-wrap">
                                                {a.body}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </CrmShell>
    );
}

function Row({ icon: Icon, children }) {
    return (
        <div className="flex items-center gap-2 text-neutral-300">
            <Icon size={14} className="text-neutral-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">{children}</div>
        </div>
    );
}

function Stat({ label, value }) {
    return (
        <div>
            <div className="text-xs text-neutral-500">{label}</div>
            <div className="text-sm font-semibold">{value}</div>
        </div>
    );
}

function TabBtn({ active, onClick, icon: Icon, children }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm border-b-2 -mb-px transition-colors ${
                active
                    ? 'border-purple-500 text-white'
                    : 'border-transparent text-neutral-400 hover:text-white'
            }`}
        >
            <Icon size={14} />
            {children}
        </button>
    );
}

function Empty({ children }) {
    return (
        <div className="text-center text-neutral-500 text-sm py-10 border border-dashed border-neutral-800 rounded-lg">
            {children}
        </div>
    );
}
