import { useForm, usePage } from '@inertiajs/react';
import { useEffect, useMemo } from 'react';
import { Hash, Lock, X } from 'lucide-react';

const fieldBase =
    'w-full rounded-xl border border-neutral-700/90 bg-neutral-800/80 px-3.5 py-3 text-[15px] leading-snug text-white shadow-none ring-0 transition-colors placeholder:text-neutral-600 focus:border-purple-500/80 focus:outline-none focus:ring-0 focus:ring-offset-0';

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

    useEffect(() => {
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = prev;
        };
    }, []);

    const submit = (e) => {
        e.preventDefault();
        post('/channels', {
            preserveScroll: false,
            onError: () => {},
            onSuccess: (page) => {
                const hasErrors = Object.keys(page?.props?.errors || {}).length > 0;
                if (hasErrors) return;
                reset();
                onClose();
            },
        });
    };

    return (
        <div className="fixed inset-0 z-[120]">
            <button
                type="button"
                className="absolute inset-0 bg-black/55 backdrop-blur-[1px]"
                onClick={onClose}
                aria-label="Close"
            />
            <div className="pointer-events-none absolute inset-0 flex items-end justify-center lg:items-center lg:p-4">
                <form
                    onSubmit={submit}
                    onClick={(e) => e.stopPropagation()}
                    className="pointer-events-auto flex max-h-[min(90dvh,calc(100svh-0.5rem))] w-full max-w-lg flex-col overflow-hidden rounded-t-[1.35rem] border border-neutral-800 border-b-0 bg-neutral-900 shadow-2xl lg:max-h-[85vh] lg:max-w-md lg:rounded-2xl lg:border-b"
                >
                    <div className="flex shrink-0 justify-center pt-2.5 pb-1 lg:hidden" aria-hidden>
                        <div className="h-1 w-11 rounded-full bg-neutral-600/80" />
                    </div>

                    <div className="flex items-center justify-between px-4 pb-2 pt-1 lg:px-4 lg:py-3 lg:border-b lg:border-neutral-800">
                        <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight text-white lg:text-sm">
                            <Hash size={18} className="text-purple-400 lg:h-4 lg:w-4" strokeWidth={2.25} />
                            New Channel
                        </h2>
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex h-10 w-10 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white active:bg-neutral-800"
                            aria-label="Close"
                        >
                            <X size={20} className="lg:h-4 lg:w-4" />
                        </button>
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-2 pt-1">
                        <div className="space-y-4 pb-2">
                            {errors.channel && (
                                <div className="rounded-xl border border-red-500/35 bg-red-500/10 px-3.5 py-2.5 text-[13px] text-red-200">
                                    {errors.channel}
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <label className="block text-[13px] font-medium text-neutral-400">Space</label>
                                <select
                                    value={data.space_id}
                                    onChange={(e) => setData('space_id', e.target.value)}
                                    className={fieldBase}
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
                                {errors.space_id && (
                                    <div className="text-[13px] text-red-400">{errors.space_id}</div>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-[13px] font-medium text-neutral-400">Channel name</label>
                                <div className="flex min-h-[3rem] items-center gap-2 rounded-xl border border-neutral-700/90 bg-neutral-800/80 px-3.5 py-2 transition-colors focus-within:border-purple-500/80">
                                    {data.is_private ? (
                                        <Lock size={16} className="shrink-0 text-neutral-500" strokeWidth={2} />
                                    ) : (
                                        <Hash size={16} className="shrink-0 text-neutral-500" strokeWidth={2} />
                                    )}
                                    <input
                                        type="text"
                                        value={data.name}
                                        onChange={(e) =>
                                            setData('name', e.target.value.toLowerCase().replace(/\s+/g, '-'))
                                        }
                                        placeholder="general"
                                        className="bare-input min-h-0 min-w-0 flex-1 text-[15px] text-white placeholder:text-neutral-600"
                                        required
                                        autoFocus
                                        autoCapitalize="none"
                                        autoCorrect="off"
                                        spellCheck={false}
                                    />
                                </div>
                                {errors.name && <div className="text-[13px] text-red-400">{errors.name}</div>}
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-[13px] font-medium text-neutral-400">
                                    Description <span className="font-normal text-neutral-600">(optional)</span>
                                </label>
                                <input
                                    type="text"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    placeholder="What's this channel about?"
                                    className={fieldBase}
                                />
                            </div>

                            <label className="flex min-h-[2.75rem] cursor-pointer items-center gap-3 rounded-xl border border-neutral-800/80 bg-neutral-900/50 px-3.5 py-2.5 active:bg-neutral-800/40">
                                <input
                                    type="checkbox"
                                    checked={data.is_private}
                                    onChange={(e) => setData('is_private', e.target.checked)}
                                    className="h-4 w-4 shrink-0 rounded border-neutral-600 bg-neutral-800 text-purple-600 focus:ring-2 focus:ring-purple-500/50 focus:ring-offset-0"
                                />
                                <span className="flex flex-1 items-center gap-2 text-[15px] text-neutral-200">
                                    <Lock size={14} className="text-neutral-500" />
                                    Make private
                                </span>
                            </label>
                        </div>
                    </div>

                    <div className="flex shrink-0 items-stretch justify-end gap-2 border-t border-neutral-800 bg-neutral-900/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-sm lg:pb-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="min-h-11 min-w-[4.5rem] rounded-xl px-3 text-[15px] font-medium text-neutral-300 transition-colors hover:bg-neutral-800 hover:text-white active:bg-neutral-800"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="min-h-11 min-w-[8.5rem] rounded-xl bg-purple-600 px-5 text-[15px] font-semibold text-white shadow-sm transition-colors hover:bg-purple-500 active:bg-purple-600 disabled:opacity-50"
                        >
                            Create channel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
