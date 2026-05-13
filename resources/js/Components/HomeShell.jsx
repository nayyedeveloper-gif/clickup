import Sidebar from '@/Components/Sidebar';
import MobileAppBar from '@/Components/Mobile/MobileAppBar';

export default function HomeShell({
    title,
    subtitle,
    actions,
    tabs,
    children,
    mobileBackHref = null,
    showMobileBack = true,
    showMobileMenu = true,
    /** Shown only below the mobile app bar (e.g. full-width search). Hidden on lg+. */
    mobileBelowAppBar = null,
}) {
    return (
        <div className="flex h-screen bg-neutral-950 text-neutral-100 overflow-hidden">
            <Sidebar />
            <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                {/* Mobile: native-style app bar */}
                <div className="shrink-0 lg:hidden">
                    <MobileAppBar
                        title={title}
                        subtitle={subtitle}
                        backHref={mobileBackHref}
                        showBack={showMobileBack}
                        showMenu={showMobileMenu}
                        right={actions}
                    />
                    {mobileBelowAppBar ? (
                        <div className="border-b border-neutral-800 bg-neutral-950/90 px-2 pb-2 pt-1 lg:hidden">
                            {mobileBelowAppBar}
                        </div>
                    ) : null}
                    {tabs ? (
                        <div className="flex gap-1 overflow-x-auto border-b border-neutral-800 bg-neutral-950/90 px-2 pb-2 pt-1 no-scrollbar">
                            {tabs}
                        </div>
                    ) : null}
                </div>

                {/* Desktop header */}
                <div className="hidden border-b border-neutral-800 px-3 pt-3 sm:px-4 lg:block lg:px-6 lg:pt-4">
                    <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between lg:gap-3">
                        <div className="min-w-0">
                            <h1 className="truncate text-base font-semibold">{title}</h1>
                            {subtitle && (
                                <div className="mt-0.5 line-clamp-2 text-xs text-neutral-500">{subtitle}</div>
                            )}
                        </div>
                        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                            {actions}
                        </div>
                    </div>
                    {tabs ? (
                        <div className="mt-2 flex items-center gap-1 overflow-x-auto no-scrollbar">{tabs}</div>
                    ) : null}
                </div>

                <div className="min-h-0 flex-1 overflow-auto">{children}</div>
            </div>
        </div>
    );
}

export function Tab({ active, onClick, children }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`whitespace-nowrap border-b-2 px-3 py-2 text-sm transition-colors ${
                active
                    ? 'border-purple-500 text-white'
                    : 'border-transparent text-neutral-400 hover:text-white'
            }`}
        >
            {children}
        </button>
    );
}
