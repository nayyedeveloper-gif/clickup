import { Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import CrmShell from '@/Components/CrmShell';
import { Plus, Trash2, Search, X, Globe, Mail, Phone, Building2 } from 'lucide-react';

export default function Companies({ companies, filters }) {
    const [showCreate, setShowCreate] = useState(false);
    const [q, setQ] = useState(filters?.q || '');
    const form = useForm({
        name: '',
        industry: '',
        website: '',
        phone: '',
        email: '',
        address: '',
        notes: '',
        color: '#6366f1',
    });

    const search = () =>
        router.get(route('companies.index'), { q }, { preserveState: true, replace: true });

    const submit = (e) => {
        e.preventDefault();
        form.post(route('companies.store'), {
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
                setShowCreate(false);
            },
        });
    };

    const remove = (id) => {
        if (!confirm('Delete this company?')) return;
        router.delete(route('companies.destroy', id), { preserveScroll: true });
    };

    return (
        <CrmShell
            active="companies"
            actions={
                <button
                    onClick={() => setShowCreate(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm bg-purple-600 hover:bg-purple-500"
                >
                    <Plus size={14} /> New Company
                </button>
            }
        >
            <div className="flex items-center gap-2 mb-4">
                <div className="relative flex-1 max-w-sm">
                    <Search size={14} className="absolute left-2.5 top-2.5 text-neutral-500" />
                    <input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && search()}
                        placeholder="Search companies…"
                        className="w-full bg-neutral-900 rounded-md pl-8 pr-3 py-2 text-sm focus:outline-none focus:bg-neutral-800"
                    />
                </div>
                <button
                    onClick={search}
                    className="px-3 py-2 rounded-md bg-neutral-800 hover:bg-neutral-700 text-sm"
                >
                    Search
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {companies.length === 0 && (
                    <div className="col-span-full text-center text-neutral-500 py-12 border border-dashed border-neutral-800 rounded-lg">
                        No companies yet.
                    </div>
                )}
                {companies.map((c) => (
                    <Link
                        key={c.id}
                        href={route('companies.show', c.id)}
                        className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 hover:border-neutral-700 group block"
                    >
                        <div className="flex items-start gap-3 mb-3">
                            <div
                                className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg"
                                style={{ background: c.color || '#6366f1' }}
                            >
                                {c.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold truncate">{c.name}</h3>
                                {c.industry && (
                                    <div className="text-xs text-neutral-500">{c.industry}</div>
                                )}
                            </div>
                            <button
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); remove(c.id); }}
                                className="text-neutral-500 hover:text-red-400 opacity-0 group-hover:opacity-100"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>

                        <div className="space-y-1 text-xs text-neutral-400">
                            {c.website && (
                                <div className="flex items-center gap-2 truncate">
                                    <Globe size={12} /> {c.website}
                                </div>
                            )}
                            {c.email && (
                                <div className="flex items-center gap-2 truncate">
                                    <Mail size={12} /> {c.email}
                                </div>
                            )}
                            {c.phone && (
                                <div className="flex items-center gap-2 truncate">
                                    <Phone size={12} /> {c.phone}
                                </div>
                            )}
                        </div>

                        <div className="mt-3 pt-3 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-500">
                            <span>{c.contacts_count ?? 0} contacts</span>
                            <span>{c.deals_count ?? 0} deals</span>
                        </div>
                    </Link>
                ))}
            </div>

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
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <Building2 size={18} /> New company
                            </h3>
                            <button
                                onClick={() => setShowCreate(false)}
                                className="text-neutral-400 hover:text-white"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={submit} className="space-y-3">
                            <Input label="Name" required value={form.data.name} onChange={(v) => form.setData('name', v)} />
                            <div className="grid grid-cols-2 gap-3">
                                <Input label="Industry" value={form.data.industry} onChange={(v) => form.setData('industry', v)} />
                                <Input label="Website" value={form.data.website} onChange={(v) => form.setData('website', v)} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <Input label="Email" type="email" value={form.data.email} onChange={(v) => form.setData('email', v)} />
                                <Input label="Phone" value={form.data.phone} onChange={(v) => form.setData('phone', v)} />
                            </div>
                            <Input label="Address" value={form.data.address} onChange={(v) => form.setData('address', v)} />
                            <div>
                                <label className="block text-xs text-neutral-400 mb-1">Notes</label>
                                <textarea
                                    rows={3}
                                    value={form.data.notes}
                                    onChange={(e) => form.setData('notes', e.target.value)}
                                    className="w-full bg-neutral-950 border border-neutral-800 rounded-md px-3 py-2 text-sm"
                                />
                            </div>
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
                                    Create
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </CrmShell>
    );
}

function Input({ label, value, onChange, type = 'text', required }) {
    return (
        <div>
            <label className="block text-xs text-neutral-400 mb-1">
                {label}{required && <span className="text-red-400"> *</span>}
            </label>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                required={required}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
            />
        </div>
    );
}
