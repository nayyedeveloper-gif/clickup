import { useForm, usePage } from '@inertiajs/react';
import { useMemo } from 'react';
import { Hash, Lock, X } from 'lucide-react';

export default function NewChannelModal({ onClose }) {
    const { props } = usePage();
    const spaces = props?.sidebar?.spaces || [];
    const spaceOptions = useMemo(() => {
        const items = [];

        const collectSpaces = (nodes = []) => {
            nodes.forEach((node) => {
                if (node?.id) {
                    items.push({ id: node.id, name: node.name });
                }
                if (Array.isArray(node?.children) && node.children.length > 0) {
                    collectSpaces(node.children);
                }
            });
        };

        collectSpaces(spaces);
        return items;
    }, [spaces]);

    const defaultSpaceId = spaceOptions[0]?.id ? String(spaceOptions[0].id) : '';
    const { data, setData, post, processing, errors, reset } = useForm({
        space_id: defaultSpaceId,
        name: '',
        description: '',
        is_private: false,
    });

    const submit = (e) => {
        e.preventDefault();
        console.log('NewChannelModal submitting:', data);
        post('/channels', {
            preserveScroll: false,
            onError: (errors) => {
                console.error('NewChannelModal errors:', errors);
            },
            onSuccess: (page) => {
                const hasErrors = Object.keys(page?.props?.errors || {}).length > 0;
                if (hasErrors) {
                    console.error('NewChannelModal success response contains errors:', page.props.errors);
                    return;
                }

                console.log('NewChannelModal success');
                reset();
                onClose();
            },
        });
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <form
                onSubmit={submit}
                onClick={(e) => e.stopPropagation()}
                className="bg-neutral-900 rounded-lg border border-neutral-800 w-full max-w-md"
            >
                <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
                    <h2 className="text-sm font-semibold flex items-center gap-2">
                        <Hash size={16} className="text-purple-400" /> New Channel
                    </h2>
                    <button type="button" onClick={onClose} className="text-neutral-400 hover:text-white">
                        <X size={16} />
                    </button>
                </div>
                <div className="p-4 space-y-3">
                    {errors.channel && (
                        <div className="px-3 py-2 rounded-md border border-red-500/40 bg-red-500/10 text-xs text-red-300">
                            {errors.channel}
                        </div>
                    )}
                    <div>
                        <label className="text-xs text-neutral-400">Space</label>
                        <select
                            value={data.space_id}
                            onChange={(e) => setData('space_id', e.target.value)}
                            className="mt-1 w-full px-3 py-2 rounded-md bg-neutral-800 border border-neutral-700 text-sm text-white outline-none focus:border-purple-500"
                            required
                        >
                            {spaceOptions.length === 0 && (
                                <option value="">No spaces available</option>
                            )}
                            {spaceOptions.map((space) => (
                                <option key={space.id} value={space.id}>
                                    {space.name}
                                </option>
                            ))}
                        </select>
                        {errors.space_id && <div className="text-red-400 text-xs mt-1">{errors.space_id}</div>}
                    </div>
                    <div>
                        <label className="text-xs text-neutral-400">Channel name</label>
                        <div className="mt-1 flex items-center gap-1 px-3 py-2 rounded-md bg-neutral-800 border border-neutral-700 focus-within:border-purple-500">
                            {data.is_private ? <Lock size={13} className="text-neutral-500" /> : <Hash size={13} className="text-neutral-500" />}
                            <input
                                type="text" value={data.name}
                                onChange={(e) => setData('name', e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                                placeholder="general"
                                className="flex-1 bg-transparent text-sm text-white outline-none"
                                required autoFocus
                            />
                        </div>
                        {errors.name && <div className="text-red-400 text-xs mt-1">{errors.name}</div>}
                    </div>
                    <div>
                        <label className="text-xs text-neutral-400">Description (optional)</label>
                        <input
                            type="text" value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            placeholder="What's this channel about?"
                            className="mt-1 w-full px-3 py-2 rounded-md bg-neutral-800 border border-neutral-700 text-sm text-white outline-none focus:border-purple-500"
                        />
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox" checked={data.is_private}
                            onChange={(e) => setData('is_private', e.target.checked)}
                            className="rounded bg-neutral-800 border-neutral-700"
                        />
                        <span className="text-sm text-neutral-300 flex items-center gap-1.5">
                            <Lock size={12} /> Make private
                        </span>
                    </label>
                </div>
                <div className="flex justify-end gap-2 px-4 py-3 border-t border-neutral-800">
                    <button type="button" onClick={onClose} className="px-3 py-1.5 text-sm text-neutral-300 hover:text-white">
                        Cancel
                    </button>
                    <button
                        type="submit" disabled={processing}
                        className="px-4 py-1.5 text-sm bg-purple-600 hover:bg-purple-500 rounded-md text-white disabled:opacity-50"
                    >
                        Create channel
                    </button>
                </div>
            </form>
        </div>
    );
}
