import { Link, router, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import CrmShell from '@/Components/CrmShell';
import { Plus, Trash2, X, DollarSign, Calendar, Building2 } from 'lucide-react';

const fmt = (amount, currency = 'USD') =>
    new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        maximumFractionDigits: 0,
    }).format(Number(amount || 0));

export default function Deals({ pipeline, pipelines, deals, companies, contacts }) {
    const [showCreate, setShowCreate] = useState(false);
    const [createInStage, setCreateInStage] = useState(null);
    const [draggingId, setDraggingId] = useState(null);
    const [editingDeal, setEditingDeal] = useState(null);

    const form = useForm({
        pipeline_id: pipeline.id,
        pipeline_stage_id: pipeline.stages?.[0]?.id || '',
        title: '',
        amount: '',
        currency: 'USD',
        expected_close_date: '',
        company_id: '',
        contact_id: '',
        notes: '',
    });

    const editForm = useForm({
        title: '',
        amount: '',
        currency: 'USD',
        pipeline_stage_id: '',
        expected_close_date: '',
        company_id: '',
        contact_id: '',
        notes: '',
    });

    const openEdit = (deal) => {
        setEditingDeal(deal);
        editForm.setData({
            title: deal.title || '',
            amount: deal.amount || '',
            currency: deal.currency || 'USD',
            pipeline_stage_id: deal.pipeline_stage_id,
            expected_close_date: deal.expected_close_date || '',
            company_id: deal.company_id || '',
            contact_id: deal.contact_id || '',
            notes: deal.notes || '',
        });
    };

    const submitEdit = (e) => {
        e.preventDefault();
        if (!editingDeal) return;
        editForm.put(route('deals.update', editingDeal.id), {
            preserveScroll: true,
            onSuccess: () => setEditingDeal(null),
        });
    };

    const dealsByStage = useMemo(() => {
        const map = {};
        (pipeline.stages || []).forEach((s) => (map[s.id] = []));
        deals.forEach((d) => (map[d.pipeline_stage_id] ||= []).push(d));
        return map;
    }, [pipeline, deals]);

    const stageStats = (stage) => {
        const stageDeals = dealsByStage[stage.id] || [];
        const total = stageDeals.reduce((s, d) => s + Number(d.amount || 0), 0);
        return { count: stageDeals.length, total };
    };

    const submit = (e) => {
        e.preventDefault();
        form.post(route('deals.store'), {
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
                form.setData('pipeline_id', pipeline.id);
                form.setData('pipeline_stage_id', pipeline.stages?.[0]?.id || '');
                setShowCreate(false);
                setCreateInStage(null);
            },
        });
    };

    const remove = (id) => {
        if (!confirm('Delete this deal?')) return;
        router.delete(route('deals.destroy', id), { preserveScroll: true });
    };

    const moveDeal = (dealId, stageId) => {
        router.put(
            route('deals.update', dealId),
            { pipeline_stage_id: stageId, pipeline_id: pipeline.id },
            { preserveScroll: true }
        );
    };

    const onDragStart = (id) => setDraggingId(id);
    const onDragOver = (e) => e.preventDefault();
    const onDrop = (stageId) => {
        if (draggingId) moveDeal(draggingId, stageId);
        setDraggingId(null);
    };

    const totals = useMemo(() => {
        const open = deals
            .filter((d) => {
                const s = pipeline.stages?.find((s) => s.id === d.pipeline_stage_id);
                return s?.type === 'open';
            })
            .reduce((sum, d) => sum + Number(d.amount || 0), 0);
        const won = deals
            .filter((d) => {
                const s = pipeline.stages?.find((s) => s.id === d.pipeline_stage_id);
                return s?.type === 'won';
            })
            .reduce((sum, d) => sum + Number(d.amount || 0), 0);
        return { open, won };
    }, [deals, pipeline]);

    return (
        <CrmShell
            active="deals"
            actions={
                <div className="flex items-center gap-2">
                    {pipelines.length > 1 && (
                        <select
                            value={pipeline.id}
                            onChange={(e) =>
                                router.get(route('deals.index'), { pipeline: e.target.value })
                            }
                            className="bg-neutral-900 border border-neutral-800 text-sm rounded-md px-2 py-1.5"
                        >
                            {pipelines.map((p) => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    )}
                    <button
                        onClick={() => {
                            setCreateInStage(null);
                            setShowCreate(true);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm bg-purple-600 hover:bg-purple-500"
                    >
                        <Plus size={14} /> New Deal
                    </button>
                </div>
            }
        >
            {/* Summary */}
            <div className="grid grid-cols-3 gap-3 mb-5">
                <Stat label="Pipeline value" value={fmt(totals.open)} tone="text-neutral-100" />
                <Stat label="Won" value={fmt(totals.won)} tone="text-emerald-400" />
                <Stat label="Total deals" value={deals.length} tone="text-neutral-100" />
            </div>

            {/* Kanban */}
            <div className="flex gap-3 overflow-x-auto pb-4">
                {(pipeline.stages || []).map((stage) => {
                    const { count, total } = stageStats(stage);
                    return (
                        <div
                            key={stage.id}
                            onDragOver={onDragOver}
                            onDrop={() => onDrop(stage.id)}
                            className="w-72 flex-shrink-0 bg-neutral-900 rounded-lg border border-neutral-800"
                        >
                            <div
                                className="px-3 py-2 border-b border-neutral-800"
                                style={{ borderTop: `3px solid ${stage.color}` }}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-semibold">{stage.name}</span>
                                        <span className="text-xs text-neutral-500">{count}</span>
                                    </div>
                                    <button
                                        onClick={() => {
                                            form.setData('pipeline_stage_id', stage.id);
                                            setCreateInStage(stage);
                                            setShowCreate(true);
                                        }}
                                        className="text-neutral-500 hover:text-white"
                                    >
                                        <Plus size={14} />
                                    </button>
                                </div>
                                <div className="mt-1 text-xs text-neutral-500">{fmt(total)}</div>
                            </div>
                            <div className="p-2 space-y-2 min-h-[100px]">
                                {(dealsByStage[stage.id] || []).map((deal) => (
                                    <div
                                        key={deal.id}
                                        draggable
                                        onDragStart={() => onDragStart(deal.id)}
                                        onClick={() => openEdit(deal)}
                                        className="bg-neutral-800/60 hover:bg-neutral-800 border border-neutral-800 rounded-md p-3 group cursor-pointer"
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <span className="text-sm font-medium">{deal.title}</span>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); remove(deal.id); }}
                                                className="text-neutral-500 hover:text-red-400 opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-neutral-400 mb-1">
                                            <DollarSign size={11} />
                                            <span className="font-mono">{fmt(deal.amount, deal.currency)}</span>
                                        </div>
                                        {deal.company && (
                                            <div className="flex items-center gap-2 text-xs text-neutral-400 mb-1 truncate">
                                                <Building2 size={11} /> {deal.company.name}
                                            </div>
                                        )}
                                        {deal.expected_close_date && (
                                            <div className="flex items-center gap-2 text-xs text-neutral-500">
                                                <Calendar size={11} /> {deal.expected_close_date}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Create modal */}
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
                            <h3 className="text-lg font-semibold">New deal{createInStage ? ` · ${createInStage.name}` : ''}</h3>
                            <button onClick={() => setShowCreate(false)} className="text-neutral-400 hover:text-white">
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={submit} className="space-y-3">
                            <Field label="Title" required>
                                <input
                                    autoFocus
                                    value={form.data.title}
                                    onChange={(e) => form.setData('title', e.target.value)}
                                    required
                                    className="ipt"
                                />
                            </Field>
                            <div className="grid grid-cols-2 gap-3">
                                <Field label="Amount">
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={form.data.amount}
                                        onChange={(e) => form.setData('amount', e.target.value)}
                                        className="ipt"
                                    />
                                </Field>
                                <Field label="Currency">
                                    <select
                                        value={form.data.currency}
                                        onChange={(e) => form.setData('currency', e.target.value)}
                                        className="ipt"
                                    >
                                        {['USD','MMK'].map((c) => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </Field>
                            </div>
                            <Field label="Stage">
                                <select
                                    value={form.data.pipeline_stage_id}
                                    onChange={(e) => form.setData('pipeline_stage_id', e.target.value)}
                                    required
                                    className="ipt"
                                >
                                    {pipeline.stages.map((s) => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </Field>
                            <div className="grid grid-cols-2 gap-3">
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
                                <Field label="Primary contact">
                                    <select
                                        value={form.data.contact_id}
                                        onChange={(e) => form.setData('contact_id', e.target.value)}
                                        className="ipt"
                                    >
                                        <option value="">—</option>
                                        {contacts.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.first_name} {c.last_name}
                                            </option>
                                        ))}
                                    </select>
                                </Field>
                            </div>
                            <Field label="Expected close date">
                                <input
                                    type="date"
                                    value={form.data.expected_close_date}
                                    onChange={(e) => form.setData('expected_close_date', e.target.value)}
                                    className="ipt"
                                />
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
                                <button type="button" onClick={() => setShowCreate(false)} className="px-3 py-2 text-sm text-neutral-300 hover:text-white">
                                    Cancel
                                </button>
                                <button type="submit" disabled={form.processing} className="px-4 py-2 text-sm rounded-md bg-purple-600 hover:bg-purple-500 disabled:opacity-50">
                                    Create deal
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit modal */}
            {editingDeal && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
                    onMouseDown={() => setEditingDeal(null)}
                >
                    <div
                        onMouseDown={(e) => e.stopPropagation()}
                        className="bg-neutral-900 border border-neutral-800 rounded-xl w-[560px] max-w-full p-6 max-h-[90vh] overflow-y-auto"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Edit deal</h3>
                            <button onClick={() => setEditingDeal(null)} className="text-neutral-400 hover:text-white">
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={submitEdit} className="space-y-3">
                            <Field label="Title" required>
                                <input
                                    autoFocus
                                    value={editForm.data.title}
                                    onChange={(e) => editForm.setData('title', e.target.value)}
                                    required
                                    className="ipt"
                                />
                            </Field>
                            <div className="grid grid-cols-2 gap-3">
                                <Field label="Amount">
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={editForm.data.amount}
                                        onChange={(e) => editForm.setData('amount', e.target.value)}
                                        className="ipt"
                                    />
                                </Field>
                                <Field label="Currency">
                                    <select
                                        value={editForm.data.currency}
                                        onChange={(e) => editForm.setData('currency', e.target.value)}
                                        className="ipt"
                                    >
                                        {['USD','MMK'].map((c) => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </Field>
                            </div>
                            <Field label="Stage">
                                <select
                                    value={editForm.data.pipeline_stage_id}
                                    onChange={(e) => editForm.setData('pipeline_stage_id', e.target.value)}
                                    required
                                    className="ipt"
                                >
                                    {pipeline.stages.map((s) => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </Field>
                            <div className="grid grid-cols-2 gap-3">
                                <Field label="Company">
                                    <select
                                        value={editForm.data.company_id}
                                        onChange={(e) => editForm.setData('company_id', e.target.value)}
                                        className="ipt"
                                    >
                                        <option value="">—</option>
                                        {companies.map((c) => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </Field>
                                <Field label="Primary contact">
                                    <select
                                        value={editForm.data.contact_id}
                                        onChange={(e) => editForm.setData('contact_id', e.target.value)}
                                        className="ipt"
                                    >
                                        <option value="">—</option>
                                        {contacts.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.first_name} {c.last_name}
                                            </option>
                                        ))}
                                    </select>
                                </Field>
                            </div>
                            <Field label="Expected close date">
                                <input
                                    type="date"
                                    value={editForm.data.expected_close_date || ''}
                                    onChange={(e) => editForm.setData('expected_close_date', e.target.value)}
                                    className="ipt"
                                />
                            </Field>
                            <Field label="Notes">
                                <textarea
                                    rows={3}
                                    value={editForm.data.notes}
                                    onChange={(e) => editForm.setData('notes', e.target.value)}
                                    className="ipt"
                                />
                            </Field>
                            <div className="flex justify-between items-center pt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (confirm('Delete this deal?')) {
                                            router.delete(route('deals.destroy', editingDeal.id), {
                                                preserveScroll: true,
                                                onSuccess: () => setEditingDeal(null),
                                            });
                                        }
                                    }}
                                    className="flex items-center gap-1 text-sm text-red-400 hover:text-red-300"
                                >
                                    <Trash2 size={14} /> Delete
                                </button>
                                <div className="flex gap-2">
                                    <button type="button" onClick={() => setEditingDeal(null)} className="px-3 py-2 text-sm text-neutral-300 hover:text-white">
                                        Cancel
                                    </button>
                                    <button type="submit" disabled={editForm.processing} className="px-4 py-2 text-sm rounded-md bg-purple-600 hover:bg-purple-500 disabled:opacity-50">
                                        Save changes
                                    </button>
                                </div>
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

function Stat({ label, value, tone }) {
    return (
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
            <div className="text-xs text-neutral-500 mb-1">{label}</div>
            <div className={`text-2xl font-semibold ${tone}`}>{value}</div>
        </div>
    );
}
