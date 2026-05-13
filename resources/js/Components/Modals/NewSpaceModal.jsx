import { useForm } from '@inertiajs/react';
import { 
    Layers, 
    X, 
    Info, 
    Plus, 
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
import { useState } from 'react';

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

export default function NewSpaceModal({ onClose }) {
    const [showCustomColor, setShowCustomColor] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        description: '',
        color: '#7c3aed',
        icon: 'Layers',
    });

    const SelectedIcon = SPACE_ICONS.find(i => i.name === data.icon)?.icon || Layers;

    const submit = (e) => {
        e.preventDefault();
        post(route('spaces.store'), {
            preserveScroll: true,
            onSuccess: () => { reset(); onClose(); },
        });
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200" onClick={onClose}>
            <form
                onSubmit={submit}
                onClick={(e) => e.stopPropagation()}
                className="bg-neutral-900 rounded-xl border border-neutral-800 w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-900/50">
                    <div className="flex items-center gap-3">
                        <div 
                            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-inner transition-colors duration-300"
                            style={{ backgroundColor: `${data.color}20`, color: data.color }}
                        >
                            <SelectedIcon size={20} />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-white leading-none">Create New Space</h2>
                            <p className="text-[11px] text-neutral-500 mt-1 uppercase tracking-wider font-semibold">Organize your projects and teams</p>
                        </div>
                    </div>
                    <button type="button" onClick={onClose} className="p-2 rounded-lg text-neutral-500 hover:text-white hover:bg-neutral-800 transition-all">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    {/* Name Input */}
                    <div>
                        <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2 block">Space Name</label>
                        <input
                            type="text" value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            placeholder="e.g. Marketing, Engineering, Design"
                            className="w-full px-4 py-3 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-white outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 transition-all shadow-inner placeholder:text-neutral-700"
                            required autoFocus
                        />
                        {errors.name && <div className="text-red-400 text-xs mt-2 flex items-center gap-1"><Info size={12}/> {errors.name}</div>}
                    </div>

                    {/* Icon Selection */}
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

                    {/* Color Selection */}
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

                    {/* Description */}
                    <div>
                        <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2 block">Description (Optional)</label>
                        <textarea
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            rows={2}
                            placeholder="What is this space for?"
                            className="w-full px-4 py-3 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-white outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 transition-all shadow-inner placeholder:text-neutral-700 resize-none"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end items-center gap-3 px-6 py-5 border-t border-neutral-800 bg-neutral-900/30">
                    <button 
                        type="button" 
                        onClick={onClose} 
                        className="px-5 py-2 text-sm font-bold text-neutral-400 hover:text-white transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit" 
                        disabled={processing || !data.name}
                        className="px-8 py-2.5 text-sm font-black bg-purple-600 hover:bg-purple-500 disabled:bg-purple-600/50 disabled:cursor-not-allowed rounded-xl text-white shadow-xl shadow-purple-600/20 active:scale-95 transition-all"
                    >
                        {processing ? 'Creating...' : 'Create Space'}
                    </button>
                </div>
            </form>
        </div>
    );
}
