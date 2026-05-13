import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import HomeShell from '@/Components/HomeShell';
import { 
    Layers, 
    Plus, 
    Trash2, 
    Edit3, 
    ArrowRight, 
    X, 
    Search, 
    Info, 
    Folder as FolderIcon, 
    List as ListIcon,
    Rocket, 
    Briefcase, 
    Code, 
    Palette, 
    ShoppingCart, 
    Heart, 
    Zap, 
    Target, 
    Shield, 
    Globe, 
    Cpu 
} from 'lucide-react';

const SPACE_ICONS = [
    { name: 'Layers', icon: Layers },
    { name: 'Rocket', icon: Rocket },
    { name: 'Briefcase', icon: Briefcase },
    { name: 'Code', icon: Code },
    { name: 'Palette', icon: Palette },
    { name: 'Shopping', icon: ShoppingCart },
    { name: 'Heart', icon: Heart },
    { name: 'Zap', icon: Zap },
    { name: 'Target', icon: Target },
    { name: 'Shield', icon: Shield },
    { name: 'Globe', icon: Globe },
    { name: 'Cpu', icon: Cpu },
];

const SPACE_COLORS = [
    { name: 'Purple', value: '#7c3aed' },
    { name: 'Pink', value: '#ec4899' },
    { name: 'Red', value: '#ef4444' },
    { name: 'Orange', value: '#f97316' },
    { name: 'Yellow', value: '#eab308' },
    { name: 'Green', value: '#22c55e' },
    { name: 'Cyan', value: '#06b6d4' },
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Indigo', value: '#6366f1' },
    { name: 'Slate', value: '#64748b' },
];

function SpaceModal({ initial, parent, onClose }) {
    const isEdit = !!initial?.id;
    const [showCustomColor, setShowCustomColor] = useState(false);
    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: initial?.name || '',
        description: initial?.description || '',
        color: initial?.color || '#7c3aed',
        icon: initial?.icon || 'Layers',
        parent_id: parent?.id || initial?.parent_id || null,
    });

    const SelectedIcon = SPACE_ICONS.find(i => i.name === data.icon)?.icon || Layers;

    const submit = (e) => {
        e.preventDefault();
        const opts = {
            preserveScroll: true,
            onSuccess: () => { reset(); onClose(); },
        };
        if (isEdit) put(route('spaces.update', initial.id), opts);
        else post(route('spaces.store'), opts);
    };

    const inputCls = "w-full px-4 py-3 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-white outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 transition-all shadow-inner placeholder:text-neutral-700";

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200" onClick={onClose}>
            <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="bg-neutral-900 rounded-xl border border-neutral-800 w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b border-neutral-800 bg-neutral-900/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div 
                            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-inner transition-colors duration-300"
                            style={{ backgroundColor: `${data.color}20`, color: data.color }}
                        >
                            <SelectedIcon size={20} />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-white leading-none">
                                {isEdit ? 'Edit Space' : parent ? `New Sub-space in ${parent.name}` : 'Create New Space'}
                            </h2>
                            <p className="text-[11px] text-neutral-500 mt-1 uppercase tracking-wider font-semibold">Organize your projects and teams</p>
                        </div>
                    </div>
                    <button type="button" onClick={onClose} className="p-2 rounded-lg text-neutral-500 hover:text-white hover:bg-neutral-800 transition-all">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    <div>
                        <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2 block">Space Name</label>
                        <input
                            value={data.name} onChange={(e) => setData('name', e.target.value)}
                            placeholder="e.g. Marketing, Engineering, Design"
                            className={inputCls}
                            autoFocus required
                        />
                        {errors.name && <p className="mt-2 text-xs text-red-400 flex items-center gap-1"><Info size={12}/> {errors.name}</p>}
                    </div>

                    <div>
                        <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-3 block">Select Icon</label>
                        <div className="grid grid-cols-6 gap-2">
                            {SPACE_ICONS.map(({ name, icon: Icon }) => (
                                <button
                                    key={name}
                                    type="button"
                                    onClick={() => setData('icon', name)}
                                    className={`h-10 rounded-lg border transition-all duration-200 flex items-center justify-center ${
                                        data.icon === name 
                                            ? 'bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-600/20' 
                                            : 'bg-neutral-950 border-neutral-800 text-neutral-500 hover:border-neutral-700 hover:text-neutral-300'
                                    }`}
                                >
                                    <Icon size={18} />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest block">Select Space Color</label>
                            <button 
                                type="button"
                                onClick={() => setShowCustomColor(!showCustomColor)}
                                className="text-[10px] font-bold text-purple-400 hover:text-purple-300 uppercase tracking-wider flex items-center gap-1 transition-colors"
                            >
                                <Plus size={10} /> Custom Color
                            </button>
                        </div>
                        
                        <div className="grid grid-cols-5 gap-3">
                            {SPACE_COLORS.map((c) => (
                                <button
                                    key={c.value}
                                    type="button"
                                    onClick={() => setData('color', c.value)}
                                    title={c.name}
                                    className={`relative group h-10 rounded-lg border-2 transition-all duration-200 flex items-center justify-center ${
                                        data.color === c.value 
                                            ? 'border-white scale-105 shadow-lg' 
                                            : 'border-transparent hover:scale-105'
                                    }`}
                                    style={{ backgroundColor: c.value }}
                                >
                                    {data.color === c.value && (
                                        <div className="absolute inset-0 bg-white/20 rounded-md animate-pulse" />
                                    )}
                                </button>
                            ))}
                        </div>

                        {showCustomColor && (
                            <div className="mt-4 p-3 rounded-xl bg-neutral-950 border border-neutral-800 animate-in slide-in-from-top-2 duration-200">
                                <div className="flex items-center gap-4">
                                    <input 
                                        type="color" 
                                        value={data.color} 
                                        onChange={(e) => setData('color', e.target.value)}
                                        className="h-10 w-20 rounded-lg bg-neutral-900 border border-neutral-800 cursor-pointer"
                                    />
                                    <input 
                                        type="text" 
                                        value={data.color} 
                                        onChange={(e) => setData('color', e.target.value)}
                                        className="flex-1 bg-transparent border-none p-0 text-sm text-white font-mono uppercase focus:ring-0"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2 block">Description (Optional)</label>
                        <textarea
                            value={data.description} onChange={(e) => setData('description', e.target.value)}
                            rows={2}
                            placeholder="What is this space for?"
                            className={inputCls + " resize-none"}
                        />
                    </div>
                </div>
                <div className="px-6 py-5 border-t border-neutral-800 flex justify-end gap-3 bg-neutral-900/30">
                    <button type="button" onClick={onClose} className="px-5 py-2 text-sm font-bold text-neutral-400 hover:text-white transition-colors">Cancel</button>
                    <button 
                        type="submit" 
                        disabled={processing || !data.name} 
                        className="px-8 py-2.5 text-sm font-black bg-purple-600 hover:bg-purple-500 disabled:bg-purple-600/50 disabled:cursor-not-allowed rounded-xl text-white shadow-xl shadow-purple-600/20 active:scale-95 transition-all"
                    >
                        {processing ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Space'}
                    </button>
                </div>
            </form>
        </div>
    );
}

function SpaceCard({ space, onEdit, onAddChild, onDelete }) {
    const counts = (space.lists?.length || 0) + (space.folders?.length || 0);
    const color = space.color || '#7c3aed';
    const Icon = SPACE_ICONS.find(i => i.name === space.icon)?.icon || Layers;
    
    return (
        <div 
            className="group relative rounded-2xl border border-neutral-800 bg-neutral-900/40 hover:border-neutral-700 hover:bg-neutral-900/60 transition-all duration-300 flex flex-col overflow-hidden shadow-lg hover:shadow-2xl"
        >
            {/* Top accent color bar */}
            <div className="h-1.5 w-full opacity-60 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: color }} />

            <div className="p-5 flex-1">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <Link href={route('spaces.show', space.id)} className="group/title flex items-center gap-3">
                            <div 
                                className="w-8 h-8 rounded-lg shrink-0 shadow-inner flex items-center justify-center transition-all duration-300 group-hover/title:scale-110" 
                                style={{ 
                                    backgroundColor: `${color}20`,
                                    color: color,
                                    boxShadow: `0 0 15px ${color}15`
                                }} 
                            >
                                <Icon size={18} />
                            </div>
                            <span className="text-base font-bold text-white group-hover/title:text-purple-300 truncate transition-colors">
                                {space.name}
                            </span>
                        </Link>
                        {space.description && (
                            <p className="text-[11px] text-neutral-500 mt-2 line-clamp-2 leading-relaxed">{space.description}</p>
                        )}
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center gap-1 -mr-1">
                        <button onClick={() => onEdit(space)} className="p-1.5 rounded-lg text-neutral-500 hover:text-white hover:bg-neutral-800 transition-all" title="Edit">
                            <Edit3 size={14} />
                        </button>
                        <button onClick={() => onDelete(space)} className="p-1.5 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-red-500/10 transition-all" title="Delete">
                            <Trash2 size={14} />
                        </button>
                    </div>
                </div>
                <div className="mt-4 flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                    <div className="flex items-center gap-1.5"><FolderIcon size={12} className="text-neutral-600" /> {space.folders?.length || 0}</div>
                    <div className="flex items-center gap-1.5"><ListIcon size={12} className="text-neutral-600" /> {space.lists?.length || 0}</div>
                </div>

                {space.children?.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-neutral-800/50 space-y-2">
                        <div className="text-[9px] uppercase font-black tracking-widest text-neutral-600 mb-1">Sub-spaces</div>
                        {space.children.slice(0, 3).map((c) => {
                            const ChildIcon = SPACE_ICONS.find(i => i.name === c.icon)?.icon || Layers;
                            return (
                                <Link
                                    key={c.id} href={route('spaces.show', c.id)}
                                    className="flex items-center gap-2 text-[11px] text-neutral-400 hover:text-white transition-colors py-0.5"
                                >
                                    <ChildIcon size={12} style={{ color: c.color || color }} className="opacity-60" />
                                    <span className="truncate">{c.name}</span>
                                </Link>
                            );
                        })}
                        {space.children.length > 3 && (
                            <div className="text-[10px] text-neutral-600 font-bold ml-4.5 mt-1">+{space.children.length - 3} more</div>
                        )}
                    </div>
                )}
            </div>

            <div className="px-5 py-3 border-t border-neutral-800 bg-neutral-900/40 flex items-center justify-between">
                <button
                    onClick={() => onAddChild(space)}
                    className="text-[11px] font-bold text-neutral-500 hover:text-white flex items-center gap-1.5 transition-colors"
                >
                    <Plus size={14} /> Add Sub-space
                </button>
                <Link
                    href={route('spaces.show', space.id)}
                    className="text-[11px] font-black text-purple-400 hover:text-purple-300 flex items-center gap-1 px-3 py-1 rounded-lg hover:bg-purple-500/10 transition-all"
                >
                    Open Space <ArrowRight size={14} />
                </Link>
            </div>
        </div>
    );
}

export default function Spaces({ spaces }) {
    const [editor, setEditor] = useState(null); // { mode: 'create'|'edit'|'child', space?, parent? }
    const [search, setSearch] = useState('');

    const filtered = !search.trim() ? spaces : spaces.filter((s) =>
        s.name?.toLowerCase().includes(search.trim().toLowerCase())
        || s.description?.toLowerCase().includes(search.trim().toLowerCase())
    );

    const onDelete = (space) => {
        if (!confirm(`Delete "${space.name}"? Folders, lists, and tasks will be removed.`)) return;
        router.delete(route('spaces.destroy', space.id), { preserveScroll: true });
    };

    return (
        <>
            <Head title="Spaces" />
            <HomeShell
                title="Spaces"
                subtitle="Top-level containers for folders, lists, and tasks"
                actions={
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-neutral-800/70 border border-neutral-800">
                            <Search size={12} className="text-neutral-500" />
                            <input
                                value={search} onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search spaces…"
                                className="bare-input w-44"
                            />
                        </div>
                        <button
                            onClick={() => setEditor({ mode: 'create' })}
                            className="px-3 py-1.5 text-xs rounded-md bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-1.5"
                        >
                            <Plus size={13} /> New space
                        </button>
                    </div>
                }
            >
                <div className="p-6">
                    {filtered.length === 0 ? (
                        <div className="text-center py-16">
                            <Layers className="mx-auto text-neutral-700" size={48} />
                            <h3 className="mt-3 text-sm font-medium text-neutral-300">
                                {search ? 'No matching spaces' : 'No spaces yet'}
                            </h3>
                            <p className="text-xs text-neutral-500 mt-1">
                                {search ? 'Try a different search term.' : 'Create your first space to start organizing work.'}
                            </p>
                            {!search && (
                                <button
                                    onClick={() => setEditor({ mode: 'create' })}
                                    className="mt-4 px-4 py-2 text-xs rounded-md bg-purple-600 hover:bg-purple-500 text-white inline-flex items-center gap-1.5"
                                >
                                    <Plus size={13} /> Create space
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filtered.map((s) => (
                                <SpaceCard
                                    key={s.id}
                                    space={s}
                                    onEdit={(sp) => setEditor({ mode: 'edit', space: sp })}
                                    onAddChild={(parent) => setEditor({ mode: 'child', parent })}
                                    onDelete={onDelete}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </HomeShell>

            {editor && (
                <SpaceModal
                    initial={editor.mode === 'edit' ? editor.space : null}
                    parent={editor.mode === 'child' ? editor.parent : null}
                    onClose={() => setEditor(null)}
                />
            )}
        </>
    );
}
