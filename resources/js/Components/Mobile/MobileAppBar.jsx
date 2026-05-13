import { router } from '@inertiajs/react';
import { ArrowLeft, PanelLeft } from 'lucide-react';

const SIDEBAR_OPEN = 'sidebar:open';

/**
 * Native-style top bar: menu + back + title (+ optional subtitle / right actions).
 * Hidden at lg+ (desktop uses sidebar + page headers).
 */
export default function MobileAppBar({
    title,
    subtitle = null,
    backHref = null,
    onBack = null,
    right = null,
    /** When false, back button is omitted (e.g. root inbox). */
    showBack = true,
    /** Opens the main sidebar (custom event listened to by Sidebar). */
    showMenu = true,
}) {
    const handleBack = () => {
        if (typeof onBack === 'function') {
            onBack();
            return;
        }
        if (backHref) {
            router.visit(backHref);
            return;
        }
        if (typeof window !== 'undefined' && window.history.length > 1) {
            window.history.back();
            return;
        }
        try {
            router.visit(route('inbox.index'));
        } catch {
            /* noop */
        }
    };

    const openSidebar = () => {
        if (typeof document === 'undefined') return;
        document.dispatchEvent(new CustomEvent(SIDEBAR_OPEN));
    };

    return (
        <header className="sticky top-0 z-[45] flex shrink-0 items-center gap-1 border-b border-neutral-800 bg-neutral-950/90 px-2 pb-2 pt-[max(0.35rem,env(safe-area-inset-top))] backdrop-blur-md supports-[backdrop-filter]:bg-neutral-950/75 lg:hidden">
            {showMenu ? (
                <button
                    type="button"
                    onClick={openSidebar}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white transition-colors hover:bg-neutral-800 active:bg-neutral-700"
                    aria-label="Open menu"
                >
                    <PanelLeft className="h-5 w-5" strokeWidth={2.25} />
                </button>
            ) : null}
            {showBack ? (
                <button
                    type="button"
                    onClick={handleBack}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white transition-colors hover:bg-neutral-800 active:bg-neutral-700"
                    aria-label="Back"
                >
                    <ArrowLeft className="h-5 w-5" strokeWidth={2.25} />
                </button>
            ) : null}
            <div className="min-w-0 flex-1">
                <h1 className="truncate text-base font-semibold leading-tight text-white">{title}</h1>
                {subtitle ? <p className="mt-0.5 truncate text-xs text-neutral-500">{subtitle}</p> : null}
            </div>
            {right ? <div className="flex shrink-0 items-center gap-1">{right}</div> : null}
        </header>
    );
}
