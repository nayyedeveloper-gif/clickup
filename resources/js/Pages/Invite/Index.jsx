import { router, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import Sidebar from '@/Components/Sidebar';
import { UserPlus, Copy, Check, RotateCw, Trash2, Mail, CheckCircle } from 'lucide-react';

function statusOf(inv) {
    if (inv.status === 'accepted' || inv.accepted_at) return { label: 'Accepted', tone: 'bg-emerald-500/20 text-emerald-300' };
    if (inv.status === 'rejected') return { label: 'Rejected', tone: 'bg-red-500/20 text-red-300' };
    if (inv.expires_at && new Date(inv.expires_at) < new Date())
        return { label: 'Expired', tone: 'bg-red-500/20 text-red-300' };
    return { label: 'Pending', tone: 'bg-yellow-500/20 text-yellow-300' };
}

export default function Invite({ invitations, members, spaces }) {
    const { flash } = usePage().props;
    const form = useForm({ email: '', role: 'member', space_id: '' });
    const [copied, setCopied] = useState(null);

    const submit = (e) => {
        e.preventDefault();
        form.post(route('invite.store'), {
            preserveScroll: true,
            onSuccess: () => form.reset('email'),
        });
    };

    const inviteLink = (token) =>
        `${window.location.origin}/invitations/accept/${token}`;

    const copy = async (token) => {
        try {
            await navigator.clipboard.writeText(inviteLink(token));
            setCopied(token);
            setTimeout(() => setCopied(null), 2000);
        } catch {
            // ignore
        }
    };

    const resend = (id) =>
        router.post(route('invite.resend', id), {}, { preserveScroll: true });

    const remove = (id) => {
        if (!confirm('Revoke this invitation?')) return;
        router.delete(route('invite.destroy', id), { preserveScroll: true });
    };

    const approve = (id) => {
        if (!confirm('Approve this invitation?')) return;
        router.post(route('invite.approve', id), {}, { preserveScroll: true });
    };

    return (
        <div className="flex h-screen bg-neutral-950 text-neutral-100 overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="px-8 py-6 border-b border-neutral-800">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-300">
                            <UserPlus size={20} />
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold">Invite people</h1>
                            <p className="text-sm text-neutral-400">
                                Add teammates to your workspace by email.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-auto p-8">
                    <div className="max-w-3xl mx-auto space-y-8">
                        {flash?.success && (
                            <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-md text-sm">
                                {flash.success}
                            </div>
                        )}

                        {/* Invite form */}
                        <form
                            onSubmit={submit}
                            className="bg-neutral-900 border border-neutral-800 rounded-lg p-5"
                        >
                            <h2 className="text-sm font-semibold mb-4">Send invitation</h2>
                            <div className="grid grid-cols-12 gap-3">
                                <div className="col-span-7">
                                    <label className="block text-xs text-neutral-400 mb-1">
                                        Email address
                                    </label>
                                    <div className="relative">
                                        <Mail size={14} className="absolute left-3 top-2.5 text-neutral-500" />
                                        <input
                                            type="email"
                                            required
                                            value={form.data.email}
                                            onChange={(e) => form.setData('email', e.target.value)}
                                            placeholder="name@company.com"
                                            className="w-full bg-neutral-950 border border-neutral-800 rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-purple-500"
                                        />
                                    </div>
                                    {form.errors.email && (
                                        <div className="text-xs text-red-400 mt-1">{form.errors.email}</div>
                                    )}
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs text-neutral-400 mb-1">Role</label>
                                    <select
                                        value={form.data.role}
                                        onChange={(e) => form.setData('role', e.target.value)}
                                        className="w-full bg-neutral-950 border border-neutral-800 rounded-md px-2 py-2 text-sm"
                                    >
                                        <option value="member">Member</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                                <div className="col-span-3">
                                    <label className="block text-xs text-neutral-400 mb-1">Space</label>
                                    <select
                                        value={form.data.space_id}
                                        onChange={(e) => form.setData('space_id', e.target.value)}
                                        className="w-full bg-neutral-950 border border-neutral-800 rounded-md px-2 py-2 text-sm"
                                    >
                                        <option value="">Workspace-wide</option>
                                        {spaces.map((s) => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end mt-4">
                                <button
                                    type="submit"
                                    disabled={form.processing}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-sm font-medium"
                                >
                                    <UserPlus size={14} /> Send invite
                                </button>
                            </div>
                        </form>

                        {/* Pending invitations */}
                        <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
                            <div className="px-4 py-3 border-b border-neutral-800 flex items-center justify-between">
                                <h2 className="text-sm font-semibold">
                                    Invitations ({invitations.length})
                                </h2>
                            </div>
                            {invitations.length === 0 ? (
                                <div className="px-4 py-12 text-center text-sm text-neutral-500">
                                    No invitations sent yet.
                                </div>
                            ) : (
                                <div className="divide-y divide-neutral-800/60">
                                    {invitations.map((inv) => {
                                        const st = statusOf(inv);
                                        return (
                                            <div
                                                key={inv.id}
                                                className="grid grid-cols-12 gap-3 px-4 py-3 items-center"
                                            >
                                                <div className="col-span-4">
                                                    <div className="text-sm font-medium truncate">{inv.email}</div>
                                                    <div className="text-xs text-neutral-500">
                                                        Invited by {inv.invited_by?.name}
                                                    </div>
                                                </div>
                                                <div className="col-span-2 text-xs text-neutral-400 capitalize">
                                                    {inv.role}
                                                </div>
                                                <div className="col-span-2 text-xs text-neutral-400 truncate">
                                                    {inv.space?.name || 'Workspace'}
                                                </div>
                                                <div className="col-span-2">
                                                    <span className={`px-2 py-0.5 rounded text-[11px] ${st.tone}`}>
                                                        {st.label}
                                                    </span>
                                                </div>
                                                <div className="col-span-2 flex items-center justify-end gap-1">
                                                    <button
                                                        onClick={() => copy(inv.token)}
                                                        title="Copy invite link"
                                                        className="p-1.5 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white"
                                                    >
                                                        {copied === inv.token ? (
                                                            <Check size={14} className="text-emerald-400" />
                                                        ) : (
                                                            <Copy size={14} />
                                                        )}
                                                    </button>
                                                    {(inv.status === 'pending' || !inv.accepted_at) && (
                                                        <>
                                                            <button
                                                                onClick={() => approve(inv.id)}
                                                                title="Approve"
                                                                className="p-1.5 rounded hover:bg-neutral-800 text-neutral-400 hover:text-emerald-400"
                                                            >
                                                                <CheckCircle size={14} />
                                                            </button>
                                                            <button
                                                                onClick={() => resend(inv.id)}
                                                                title="Resend"
                                                                className="p-1.5 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white"
                                                            >
                                                                <RotateCw size={14} />
                                                            </button>
                                                        </>
                                                    )}
                                                    <button
                                                        onClick={() => remove(inv.id)}
                                                        title="Revoke"
                                                        className="p-1.5 rounded hover:bg-neutral-800 text-neutral-400 hover:text-red-400"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Active members */}
                        <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
                            <div className="px-4 py-3 border-b border-neutral-800">
                                <h2 className="text-sm font-semibold">
                                    Workspace members ({members.length})
                                </h2>
                            </div>
                            <div className="divide-y divide-neutral-800/60">
                                {members.map((u) => (
                                    <div
                                        key={u.id}
                                        className="px-4 py-3 flex items-center gap-3"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold">
                                            {u.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium">{u.name}</div>
                                            <div className="text-xs text-neutral-500">{u.email}</div>
                                        </div>
                                        <span className="text-xs text-neutral-400 capitalize">{u.role}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
