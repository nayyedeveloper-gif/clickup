import { router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import Sidebar from '@/Components/Sidebar';
import { Plus, Trash2, X, Users as UsersIcon, Crown, Shield } from 'lucide-react';

const ROLE_BADGES = {
    owner: { label: 'Owner', color: 'bg-amber-500/20 text-amber-300', icon: Crown },
    admin: { label: 'Admin', color: 'bg-blue-500/20 text-blue-300', icon: Shield },
    member: { label: 'Member', color: 'bg-neutral-700 text-neutral-300', icon: null },
};

const TEAM_COLORS = ['#6366f1', '#3b82f6', '#10b981', '#eab308', '#f97316', '#ef4444', '#a855f7'];

function Avatar({ name, size = 32 }) {
    const initial = (name || '?').charAt(0).toUpperCase();
    return (
        <div
            className="rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold"
            style={{ width: size, height: size, fontSize: size * 0.4 }}
        >
            {initial}
        </div>
    );
}

export default function TeamsIndex({ teams, users }) {
    const [tab, setTab] = useState('teams'); // 'teams' | 'people'
    const [showCreateTeam, setShowCreateTeam] = useState(false);
    const [editingTeam, setEditingTeam] = useState(null);

    const teamForm = useForm({ name: '', description: '', color: TEAM_COLORS[0] });

    const submitTeam = (e) => {
        e.preventDefault();
        teamForm.post(route('teams.store'), {
            preserveScroll: true,
            onSuccess: () => {
                teamForm.reset();
                setShowCreateTeam(false);
            },
        });
    };

    const removeTeam = (team) => {
        if (!confirm(`Delete team "${team.name}"?`)) return;
        router.delete(route('teams.destroy', team.id), { preserveScroll: true });
    };

    return (
        <div className="flex h-screen bg-neutral-950 text-neutral-100 overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-neutral-800">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold">Teams</h1>
                        <button
                            onClick={() => setShowCreateTeam(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm bg-purple-600 hover:bg-purple-500"
                        >
                            <Plus size={14} /> New Team
                        </button>
                    </div>
                    {/* Tabs */}
                    <div className="mt-3 flex items-center gap-1">
                        {[
                            { id: 'teams', label: 'Teams' },
                            { id: 'people', label: 'People' },
                        ].map((t) => (
                            <button
                                key={t.id}
                                onClick={() => setTab(t.id)}
                                className={`px-3 py-1.5 rounded-md text-sm border-b-2 ${
                                    tab === t.id
                                        ? 'border-purple-500 text-white'
                                        : 'border-transparent text-neutral-400 hover:text-white'
                                }`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-auto p-6">
                    {tab === 'teams' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {teams.length === 0 && (
                                <div className="col-span-full text-center text-neutral-500 py-12 border border-dashed border-neutral-800 rounded-lg">
                                    No teams yet. Create your first team.
                                </div>
                            )}
                            {teams.map((team) => (
                                <div
                                    key={team.id}
                                    className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 hover:border-neutral-700 transition"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                                                style={{ background: team.color || '#6366f1' }}
                                            >
                                                {team.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <button
                                                    onClick={() => setEditingTeam(team)}
                                                    className="font-semibold hover:underline text-left"
                                                >
                                                    {team.name}
                                                </button>
                                                <div className="text-xs text-neutral-500">
                                                    {team.members_count} members
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => removeTeam(team)}
                                            className="text-neutral-500 hover:text-red-400"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                    {team.description && (
                                        <p className="text-sm text-neutral-400 mb-3">{team.description}</p>
                                    )}
                                    <div className="flex items-center -space-x-2">
                                        {(team.members || []).slice(0, 6).map((m) => (
                                            <div key={m.id} className="ring-2 ring-neutral-900 rounded-full">
                                                <Avatar name={m.name} size={28} />
                                            </div>
                                        ))}
                                        {(team.members || []).length > 6 && (
                                            <div className="ring-2 ring-neutral-900 rounded-full bg-neutral-800 px-2 h-7 flex items-center text-xs">
                                                +{team.members.length - 6}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {tab === 'people' && (
                        <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
                            <div className="grid grid-cols-12 gap-2 px-4 py-2 border-b border-neutral-800 text-[11px] uppercase text-neutral-500">
                                <div className="col-span-4">Member</div>
                                <div className="col-span-3">Title</div>
                                <div className="col-span-2">Role</div>
                                <div className="col-span-1 text-right">Open</div>
                                <div className="col-span-1 text-right">Done</div>
                                <div className="col-span-1 text-right">Total</div>
                            </div>
                            {users.map((u) => {
                                const role = ROLE_BADGES[u.role] || ROLE_BADGES.member;
                                return (
                                    <div
                                        key={u.id}
                                        className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-neutral-800/60 hover:bg-neutral-800/30 items-center"
                                    >
                                        <div className="col-span-4 flex items-center gap-3">
                                            <Avatar name={u.name} />
                                            <div>
                                                <div className="text-sm font-medium">{u.name}</div>
                                                <div className="text-xs text-neutral-500">{u.email}</div>
                                            </div>
                                        </div>
                                        <div className="col-span-3 text-sm text-neutral-400">
                                            {u.title || '—'}
                                        </div>
                                        <div className="col-span-2">
                                            <span
                                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] ${role.color}`}
                                            >
                                                {role.icon && <role.icon size={10} />}
                                                {role.label}
                                            </span>
                                        </div>
                                        <div className="col-span-1 text-right text-sm font-mono">
                                            {u.open_tasks ?? 0}
                                        </div>
                                        <div className="col-span-1 text-right text-sm font-mono text-emerald-400">
                                            {u.done_tasks ?? 0}
                                        </div>
                                        <div className="col-span-1 text-right text-sm font-mono">
                                            {(u.open_tasks ?? 0) + (u.done_tasks ?? 0)}
                                        </div>
                                    </div>
                                );
                            })}
                            {users.length === 0 && (
                                <div className="px-4 py-8 text-center text-neutral-500 text-sm">
                                    No users yet.
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Create team modal */}
                {showCreateTeam && (
                    <Modal onClose={() => setShowCreateTeam(false)}>
                        <h3 className="text-lg font-semibold mb-4">New team</h3>
                        <form onSubmit={submitTeam} className="space-y-3">
                            <div>
                                <label className="block text-xs text-neutral-400 mb-1">Name</label>
                                <input
                                    autoFocus
                                    value={teamForm.data.name}
                                    onChange={(e) => teamForm.setData('name', e.target.value)}
                                    required
                                    className="w-full bg-neutral-950 border border-neutral-800 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-neutral-400 mb-1">Description</label>
                                <textarea
                                    value={teamForm.data.description}
                                    onChange={(e) => teamForm.setData('description', e.target.value)}
                                    rows={3}
                                    className="w-full bg-neutral-950 border border-neutral-800 rounded-md px-3 py-2 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-neutral-400 mb-1">Color</label>
                                <div className="flex items-center gap-2">
                                    {TEAM_COLORS.map((c) => (
                                        <button
                                            key={c}
                                            type="button"
                                            onClick={() => teamForm.setData('color', c)}
                                            className={`w-6 h-6 rounded-full border-2 ${
                                                teamForm.data.color === c
                                                    ? 'border-white'
                                                    : 'border-transparent'
                                            }`}
                                            style={{ background: c }}
                                        />
                                    ))}
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateTeam(false)}
                                    className="px-3 py-2 text-sm text-neutral-300 hover:text-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={teamForm.processing}
                                    className="px-4 py-2 text-sm rounded-md bg-purple-600 hover:bg-purple-500 disabled:opacity-50"
                                >
                                    Create
                                </button>
                            </div>
                        </form>
                    </Modal>
                )}

                {/* Team editor modal */}
                {editingTeam && (
                    <TeamEditor
                        team={editingTeam}
                        users={users}
                        onClose={() => setEditingTeam(null)}
                    />
                )}
            </div>
        </div>
    );
}

function Modal({ children, onClose }) {
    return (
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
            onMouseDown={onClose}
        >
            <div
                onMouseDown={(e) => e.stopPropagation()}
                className="bg-neutral-900 border border-neutral-800 rounded-xl w-[480px] max-w-full p-6 shadow-2xl"
            >
                {children}
            </div>
        </div>
    );
}

function TeamEditor({ team, users, onClose }) {
    const editForm = useForm({
        name: team.name,
        description: team.description || '',
        color: team.color || '#6366f1',
    });
    const [pickUserId, setPickUserId] = useState('');

    const save = (e) => {
        e.preventDefault();
        editForm.put(route('teams.update', team.id), { preserveScroll: true });
    };

    const addMember = () => {
        if (!pickUserId) return;
        router.post(
            route('teams.members.add', team.id),
            { user_id: pickUserId, role: 'member' },
            {
                preserveScroll: true,
                onSuccess: () => setPickUserId(''),
            }
        );
    };

    const updateMemberRole = (userId, role) =>
        router.put(
            route('teams.members.update', [team.id, userId]),
            { role },
            { preserveScroll: true }
        );

    const removeMember = (userId) =>
        router.delete(route('teams.members.remove', [team.id, userId]), { preserveScroll: true });

    const memberIds = (team.members || []).map((m) => m.id);
    const candidates = users.filter((u) => !memberIds.includes(u.id));

    return (
        <Modal onClose={onClose}>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Edit team</h3>
                <button onClick={onClose} className="text-neutral-400 hover:text-white">
                    <X size={18} />
                </button>
            </div>

            <form onSubmit={save} className="space-y-3 mb-5">
                <input
                    value={editForm.data.name}
                    onChange={(e) => editForm.setData('name', e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-sm"
                />
                <textarea
                    value={editForm.data.description}
                    onChange={(e) => editForm.setData('description', e.target.value)}
                    rows={2}
                    placeholder="Description"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-sm"
                />
                <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                        {TEAM_COLORS.map((c) => (
                            <button
                                key={c}
                                type="button"
                                onClick={() => editForm.setData('color', c)}
                                className={`w-5 h-5 rounded-full border-2 ${
                                    editForm.data.color === c ? 'border-white' : 'border-transparent'
                                }`}
                                style={{ background: c }}
                            />
                        ))}
                    </div>
                    <button
                        type="submit"
                        className="px-3 py-1.5 rounded bg-purple-600 hover:bg-purple-500 text-sm"
                    >
                        Save
                    </button>
                </div>
            </form>

            {/* Members */}
            <div className="text-xs uppercase text-neutral-500 mb-2 flex items-center gap-1">
                <UsersIcon size={12} /> Members
            </div>
            <div className="space-y-1 max-h-60 overflow-y-auto">
                {(team.members || []).map((m) => (
                    <div
                        key={m.id}
                        className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-neutral-800/50"
                    >
                        <Avatar name={m.name} size={24} />
                        <span className="flex-1 text-sm">{m.name}</span>
                        <select
                            value={m.pivot?.role || 'member'}
                            onChange={(e) => updateMemberRole(m.id, e.target.value)}
                            className="bg-neutral-950 border border-neutral-800 rounded text-xs px-2 py-1"
                        >
                            <option value="owner">Owner</option>
                            <option value="admin">Admin</option>
                            <option value="member">Member</option>
                        </select>
                        <button
                            onClick={() => removeMember(m.id)}
                            className="text-neutral-500 hover:text-red-400"
                        >
                            <Trash2 size={12} />
                        </button>
                    </div>
                ))}
            </div>

            {/* Add member */}
            {candidates.length > 0 && (
                <div className="flex items-center gap-2 mt-3">
                    <select
                        value={pickUserId}
                        onChange={(e) => setPickUserId(e.target.value)}
                        className="flex-1 bg-neutral-950 border border-neutral-800 rounded px-2 py-1.5 text-sm"
                    >
                        <option value="">Select user…</option>
                        {candidates.map((u) => (
                            <option key={u.id} value={u.id}>
                                {u.name}
                            </option>
                        ))}
                    </select>
                    <button
                        onClick={addMember}
                        disabled={!pickUserId}
                        className="px-3 py-1.5 rounded bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-sm flex items-center gap-1"
                    >
                        <Plus size={14} /> Add
                    </button>
                </div>
            )}
        </Modal>
    );
}
