import { useEffect, useRef } from 'react';
import {
    X,
    ChevronRight,
    Columns3,
    Filter,
    Layers,
    GitBranch,
    Star,
    Download,
} from 'lucide-react';

function Toggle({ checked, onChange }) {
    return (
        <button
            onClick={() => onChange(!checked)}
            className={`relative w-9 h-5 rounded-full transition shrink-0 ${
                checked ? 'bg-purple-500' : 'bg-neutral-700'
            }`}
        >
            <span
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all shadow ${
                    checked ? 'left-[18px]' : 'left-0.5'
                }`}
            />
        </button>
    );
}

function ToggleRow({ label, checked, onChange }) {
    return (
        <div className="flex items-center justify-between py-2 px-1">
            <span className="text-sm text-neutral-200">{label}</span>
            <Toggle checked={checked} onChange={onChange} />
        </div>
    );
}

function ChevronRow({ icon: Icon, label, value, onClick }) {
    return (
        <button
            onClick={onClick}
            className="w-full flex items-center gap-2.5 py-2 px-1 hover:bg-neutral-800/50 rounded text-left"
        >
            {Icon && <Icon size={14} className="text-neutral-400" />}
            <span className="text-sm text-neutral-200 flex-1">{label}</span>
            {value && <span className="text-xs text-neutral-500">{value}</span>}
            <ChevronRight size={13} className="text-neutral-500" />
        </button>
    );
}

export default function CustomizePopover({
    settings,
    onChange,
    onClose,
    summary,
    onOpenFilters,
    onChangeGroup,
    onToggleSubtasks,
    onToggleColumns,
    anchorRef,
}) {
    const popRef = useRef(null);

    useEffect(() => {
        const onDown = (e) => {
            if (popRef.current && !popRef.current.contains(e.target)
                && (!anchorRef?.current || !anchorRef.current.contains(e.target))) {
                onClose();
            }
        };
        document.addEventListener('mousedown', onDown);
        return () => document.removeEventListener('mousedown', onDown);
    }, [onClose, anchorRef]);

    const update = (k, v) => onChange({ ...settings, [k]: v });

    return (
        <div
            ref={popRef}
            className="absolute right-0 top-full mt-2 w-[300px] bg-neutral-900 border border-neutral-700 rounded-lg shadow-2xl z-50"
        >
            <div className="px-4 py-3 border-b border-neutral-800 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-neutral-100">Customize view</h3>
                <button onClick={onClose} className="text-neutral-400 hover:text-white">
                    <X size={15} />
                </button>
            </div>

            <div className="p-3 space-y-0.5 border-b border-neutral-800">
                <ToggleRow
                    label="Show empty statuses"
                    checked={settings.showEmptyStatuses}
                    onChange={(v) => update('showEmptyStatuses', v)}
                />
                <ToggleRow
                    label="Wrap text"
                    checked={settings.wrapText}
                    onChange={(v) => update('wrapText', v)}
                />
                <ToggleRow
                    label="Show task locations"
                    checked={settings.showTaskLocations}
                    onChange={(v) => update('showTaskLocations', v)}
                />
                <ToggleRow
                    label="Show subtask parent names"
                    checked={settings.showSubtaskParents}
                    onChange={(v) => update('showSubtaskParents', v)}
                />
                <ToggleRow
                    label="Show closed tasks"
                    checked={settings.showClosed}
                    onChange={(v) => update('showClosed', v)}
                />
                <button className="w-full flex items-center justify-between py-2 px-1 text-sm text-neutral-400 hover:text-white">
                    <span>More options</span>
                    <ChevronRight size={13} />
                </button>
            </div>

            <div className="p-2 space-y-0.5 border-b border-neutral-800">
                <ChevronRow
                    icon={Columns3}
                    label="Fields"
                    value={`${summary.fieldsShown} shown`}
                    onClick={onToggleColumns}
                />
                <ChevronRow
                    icon={Filter}
                    label="Filter"
                    value={summary.filterCount > 0 ? `${summary.filterCount} active` : 'None'}
                    onClick={onOpenFilters}
                />
                <ChevronRow
                    icon={Layers}
                    label="Group"
                    value={summary.groupBy[0].toUpperCase() + summary.groupBy.slice(1)}
                    onClick={onChangeGroup}
                />
                <ChevronRow
                    icon={GitBranch}
                    label="Subtasks"
                    value={summary.subtasksCollapsed ? 'Collapsed' : 'Expanded'}
                    onClick={onToggleSubtasks}
                />
            </div>

            <div className="p-2 space-y-0.5">
                <ChevronRow icon={Star} label="Favorite" />
                <ChevronRow icon={Download} label="Export view" />
            </div>
        </div>
    );
}
