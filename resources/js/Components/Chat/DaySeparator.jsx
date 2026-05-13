export default function DaySeparator({ label }) {
    return (
        <div className="relative flex items-center gap-3 my-6 px-4">
            <div className="flex-1 h-px bg-neutral-800" />
            <span className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-400 bg-neutral-900 border border-neutral-800 rounded-full">
                {label}
            </span>
            <div className="flex-1 h-px bg-neutral-800" />
        </div>
    );
}
