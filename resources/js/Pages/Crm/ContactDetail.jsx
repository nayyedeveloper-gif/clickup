import { Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import CrmShell from '@/Components/CrmShell';
import { ChevronLeft, Mail, Phone, Building2, Briefcase, Send, Trash2 } from 'lucide-react';

const ACTIVITY_TYPES = [
    { id: 'note', label: 'Note' },
    { id: 'call', label: 'Call' },
    { id: 'email', label: 'Email' },
    { id: 'meeting', label: 'Meeting' },
    { id: 'task', label: 'Task' },
];

export default function ContactDetail({ contact, companies }) {
    const [type, setType] = useState('note');
    const [body, setBody] = useState('');
    const [subject, setSubject] = useState('');
    const editForm = useForm({
        first_name: contact.first_name,
        last_name: contact.last_name || '',
        email: contact.email || '',
        phone: contact.phone || '',
        title: contact.title || '',
        company_id: contact.company_id || '',
        status: contact.status,
        notes: contact.notes || '',
    });

    const saveField = (field, value) => {
        editForm.setData(field, value);
        router.put(
            route('contacts.update', contact.id),
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
                contact_id: contact.id,
                company_id: contact.company_id || null,
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

    return (
        <CrmShell active="contacts">
            <Link
                href={route('contacts.index')}
                className="inline-flex items-center gap-1 text-sm text-neutral-400 hover:text-white mb-3"
            >
                <ChevronLeft size={14} /> Back to contacts
            </Link>

            <div className="grid grid-cols-3 gap-6">
                {/* Left: profile */}
                <div className="col-span-1 bg-neutral-900 border border-neutral-800 rounded-lg p-5 h-fit">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xl font-bold mb-3">
                        {contact.first_name.charAt(0).toUpperCase()}
                    </div>
                    <input
                        defaultValue={`${contact.first_name} ${contact.last_name || ''}`}
                        onBlur={(e) => {
                            const [first, ...rest] = e.target.value.trim().split(' ');
                            saveField('first_name', first || contact.first_name);
                            saveField('last_name', rest.join(' '));
                        }}
                        className="w-full bg-transparent text-xl font-semibold border-none focus:outline-none mb-3"
                    />

                    <div className="space-y-2 text-sm">
                        <Row icon={Briefcase}>
                            <input
                                defaultValue={editForm.data.title}
                                onBlur={(e) => saveField('title', e.target.value)}
                                placeholder="Job title"
                                className="bg-transparent border-none focus:outline-none w-full"
                            />
                        </Row>
                        <Row icon={Building2}>
                            <select
                                value={editForm.data.company_id}
                                onChange={(e) => saveField('company_id', e.target.value || null)}
                                className="bg-transparent border-none focus:outline-none w-full"
                            >
                                <option value="">No company</option>
                                {companies.map((c) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </Row>
                        <Row icon={Mail}>
                            <input
                                defaultValue={editForm.data.email}
                                onBlur={(e) => saveField('email', e.target.value)}
                                placeholder="Email"
                                className="bg-transparent border-none focus:outline-none w-full"
                            />
                        </Row>
                        <Row icon={Phone}>
                            <input
                                defaultValue={editForm.data.phone}
                                onBlur={(e) => saveField('phone', e.target.value)}
                                placeholder="Phone"
                                className="bg-transparent border-none focus:outline-none w-full"
                            />
                        </Row>
                    </div>

                    <div className="mt-4">
                        <label className="block text-xs text-neutral-400 mb-1">Status</label>
                        <select
                            value={editForm.data.status}
                            onChange={(e) => saveField('status', e.target.value)}
                            className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-sm"
                        >
                            <option value="lead">Lead</option>
                            <option value="prospect">Prospect</option>
                            <option value="customer">Customer</option>
                            <option value="lost">Lost</option>
                        </select>
                    </div>

                    <div className="mt-4">
                        <label className="block text-xs text-neutral-400 mb-1">Notes</label>
                        <textarea
                            rows={4}
                            defaultValue={editForm.data.notes}
                            onBlur={(e) => saveField('notes', e.target.value)}
                            className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-2 text-sm"
                        />
                    </div>
                </div>

                {/* Right: activity */}
                <div className="col-span-2 space-y-4">
                    {/* Deals */}
                    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
                        <h3 className="text-sm font-semibold mb-3">Deals ({(contact.deals || []).length})</h3>
                        {(contact.deals || []).length === 0 && (
                            <div className="text-xs text-neutral-500 italic">No deals yet.</div>
                        )}
                        <div className="space-y-1">
                            {(contact.deals || []).map((d) => (
                                <div
                                    key={d.id}
                                    className="flex items-center justify-between text-sm px-3 py-2 rounded bg-neutral-800/40"
                                >
                                    <span>{d.title}</span>
                                    <span
                                        className="text-xs px-2 py-0.5 rounded"
                                        style={{
                                            backgroundColor: `${d.stage?.color || '#6366f1'}33`,
                                            color: d.stage?.color || '#6366f1',
                                        }}
                                    >
                                        {d.stage?.name || ''}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Composer */}
                    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
                        <form onSubmit={postActivity} className="space-y-2">
                            <div className="flex items-center gap-2">
                                <select
                                    value={type}
                                    onChange={(e) => setType(e.target.value)}
                                    className="bg-neutral-950 border border-neutral-800 rounded text-sm px-2 py-1.5"
                                >
                                    {ACTIVITY_TYPES.map((t) => (
                                        <option key={t.id} value={t.id}>{t.label}</option>
                                    ))}
                                </select>
                                <input
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    placeholder="Subject (optional)"
                                    className="flex-1 bg-neutral-950 border border-neutral-800 rounded text-sm px-2 py-1.5"
                                />
                            </div>
                            <textarea
                                value={body}
                                onChange={(e) => setBody(e.target.value)}
                                rows={3}
                                placeholder="Add note, log a call, …"
                                className="w-full bg-neutral-950 border border-neutral-800 rounded text-sm px-2 py-2"
                            />
                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-purple-600 hover:bg-purple-500 text-sm"
                                >
                                    <Send size={14} /> Log
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Activity timeline */}
                    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
                        <h3 className="text-sm font-semibold mb-3">Activity</h3>
                        {(contact.activities || []).length === 0 && (
                            <div className="text-xs text-neutral-500 italic">No activity yet.</div>
                        )}
                        <div className="space-y-3">
                            {(contact.activities || []).map((a) => (
                                <div
                                    key={a.id}
                                    className="border-l-2 border-purple-500 pl-3 group"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="text-xs text-neutral-400">
                                            <span className="uppercase font-semibold mr-2">{a.type}</span>
                                            <span>
                                                {a.user?.name} · {new Date(a.happened_at || a.created_at).toLocaleString()}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => deleteActivity(a.id)}
                                            className="text-neutral-500 hover:text-red-400 opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                    {a.subject && <div className="text-sm font-medium">{a.subject}</div>}
                                    {a.body && (
                                        <div className="text-sm text-neutral-300 whitespace-pre-wrap">{a.body}</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </CrmShell>
    );
}

function Row({ icon: Icon, children }) {
    return (
        <div className="flex items-center gap-2 text-neutral-300">
            <Icon size={14} className="text-neutral-500" />
            {children}
        </div>
    );
}
