import { Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import CrmShell from '@/Components/CrmShell';
import { Plus, Trash2, Search, X } from 'lucide-react';

const STATUSES = [
    { id: 'lead', label: 'Lead', color: 'bg-neutral-700 text-neutral-200' },
    { id: 'prospect', label: 'Prospect', color: 'bg-blue-500/20 text-blue-300' },
    { id: 'customer', label: 'Customer', color: 'bg-emerald-500/20 text-emerald-300' },
    { id: 'lost', label: 'Lost', color: 'bg-red-500/20 text-red-300' },
];

export default function Contacts({ contacts, companies, filters }) {
    const [showCreate, setShowCreate] = useState(false);
    const [q, setQ] = useState(filters?.q || '');
    const [statusFilter, setStatusFilter] = useState(filters?.status || '');

    const form = useForm({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        title: '',
        company_id: '',
        status: 'lead',
        notes: '',
    });

    const search = () => {
        router.get(route('contacts.index'), { q, status: statusFilter || undefined }, {
            preserveState: true,
            replace: true,
        });
    };

    const submit = (e) => {
        e.preventDefault();
        form.post(route('contacts.store'), {
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
                setShowCreate(false);
            },
        });
    };

    const remove = (id) => {
        if (!confirm('Delete this contact?')) return;
        router.delete(route('contacts.destroy', id), { preserveScroll: true });
    };

    return (
        <CrmShell
            active="contacts"
            actions={
                <button
                    onClick={() => setShowCreate(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm bg-purple-600 hover:bg-purple-500"
                >
                    <Plus size={14} /> New Contact
                </button>
            }
        >
            {/* Filters */}
            <div className="flex items-center gap-2 mb-4">
                <div className="relative flex-1 max-w-sm">
                    <Search size={14} className="absolute left-2.5 top-2.5 text-neutral-500" />
                    <input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && search()}
                        placeholder="Search contacts…"
                        className="w-full bg-neutral-900 rounded-md pl-8 pr-3 py-2 text-sm focus:outline-none focus:bg-neutral-800"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => {
                        setStatusFilter(e.target.value);
                        setTimeout(search, 0);
                    }}
                    className="bg-neutral-900 text-sm rounded-md px-2 py-2 focus:bg-neutral-800"
                >
                    <option value="">All status</option>
                    {STATUSES.map((s) => (
                        <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                </select>
                <button
                    onClick={search}
                    className="px-3 py-2 rounded-md bg-neutral-800 hover:bg-neutral-700 text-sm"
                >
                    Search
                </button>
            </div>

            {/* Table */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
                <div className="grid grid-cols-12 gap-2 px-4 py-2 border-b border-neutral-800 text-[11px] uppercase text-neutral-500">
                    <div className="col-span-3">Name</div>
                    <div className="col-span-3">Email</div>
                    <div className="col-span-2">Company</div>
                    <div className="col-span-2">Title</div>
                    <div className="col-span-2">Status</div>
                </div>
                {contacts.length === 0 && (
                    <div className="px-4 py-12 text-center text-neutral-500 text-sm">
                        No contacts found.
                    </div>
                )}
                {contacts.map((c) => {
                    const st = STATUSES.find((s) => s.id === c.status);
                    return (
                        <div
                            key={c.id}
                            className="grid grid-cols-12 gap-2 px-4 py-2.5 border-b border-neutral-800/60 hover:bg-neutral-800/30 group"
                        >
                            <div className="col-span-3">
                                <Link
                                    href={route('contacts.show', c.id)}
                                    className="text-sm font-medium hover:underline"
                                >
                                    {c.first_name} {c.last_name}
                                </Link>
                                {c.phone && (
                                    <div className="text-xs text-neutral-500">{c.phone}</div>
                                )}
                            </div>
                            <div className="col-span-3 text-sm text-neutral-400 truncate">
                                {c.email || '—'}
                            </div>
                            <div className="col-span-2 text-sm text-neutral-400 truncate">
                                {c.company?.name || '—'}
                            </div>
                            <div className="col-span-2 text-sm text-neutral-400 truncate">
                                {c.title || '—'}
                            </div>
                            <div className="col-span-2 flex items-center justify-between">
                                <span className={`px-2 py-0.5 rounded text-[11px] ${st?.color}`}>
                                    {st?.label || c.status}
                                </span>
                                <button
                                    onClick={() => remove(c.id)}
                                    className="text-neutral-500 hover:text-red-400 opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Create */}
            {showCreate && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
                    onMouseDown={() => setShowCreate(false)}
                >
                    <div
                        onMouseDown={(e) => e.stopPropagation()}
                        className="bg-neutral-900 border border-neutral-800 rounded-xl w-[520px] max-w-full p-6"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">New contact</h3>
                            <button
                                onClick={() => setShowCreate(false)}
                                className="text-neutral-400 hover:text-white"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={submit} className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <Field label="First name" required>
                                    <input
                                        autoFocus
                                        value={form.data.first_name}
                                        onChange={(e) => form.setData('first_name', e.target.value)}
                                        required
                                        className="ipt"
                                    />
                                </Field>
                                <Field label="Last name">
                                    <input
                                        value={form.data.last_name}
                                        onChange={(e) => form.setData('last_name', e.target.value)}
                                        className="ipt"
                                    />
                                </Field>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <Field label="Email">
                                    <input
                                        type="email"
                                        value={form.data.email}
                                        onChange={(e) => form.setData('email', e.target.value)}
                                        className="ipt"
                                    />
                                </Field>
                                <Field label="Phone">
                                    <input
                                        value={form.data.phone}
                                        onChange={(e) => form.setData('phone', e.target.value)}
                                        className="ipt"
                                    />
                                </Field>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <Field label="Job title">
                                    <input
                                        value={form.data.title}
                                        onChange={(e) => form.setData('title', e.target.value)}
                                        className="ipt"
                                    />
                                </Field>
                                <Field label="Company">
                                    <select
                                        value={form.data.company_id}
                                        onChange={(e) => form.setData('company_id', e.target.value)}
                                        className="ipt"
                                    >
                                        <option value="">—</option>
                                        {companies.map((c) => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </Field>
                            </div>
                            <Field label="Status">
                                <select
                                    value={form.data.status}
                                    onChange={(e) => form.setData('status', e.target.value)}
                                    className="ipt"
                                >
                                    {STATUSES.map((s) => (
                                        <option key={s.id} value={s.id}>{s.label}</option>
                                    ))}
                                </select>
                            </Field>
                            <Field label="Notes">
                                <textarea
                                    rows={3}
                                    value={form.data.notes}
                                    onChange={(e) => form.setData('notes', e.target.value)}
                                    className="ipt"
                                />
                            </Field>
                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowCreate(false)}
                                    className="px-3 py-2 text-sm text-neutral-300 hover:text-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={form.processing}
                                    className="px-4 py-2 text-sm rounded-md bg-purple-600 hover:bg-purple-500 disabled:opacity-50"
                                >
                                    Create contact
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                .ipt {
                    width: 100%;
                    background: #0a0a0a;
                    border: 1px solid #262626;
                    border-radius: 6px;
                    padding: 0.5rem 0.75rem;
                    font-size: 0.875rem;
                    color: #e5e5e5;
                }
                .ipt:focus { outline: none; border-color: #8b5cf6; }
            `}</style>
        </CrmShell>
    );
}

function Field({ label, required, children }) {
    return (
        <div>
            <label className="block text-xs text-neutral-400 mb-1">
                {label}{required && <span className="text-red-400"> *</span>}
            </label>
            {children}
        </div>
    );
}
