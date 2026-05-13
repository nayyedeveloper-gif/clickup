import { Link } from '@inertiajs/react';
import { CheckSquare, Users, Zap, BarChart3 } from 'lucide-react';

const HIGHLIGHTS = [
    { icon: CheckSquare, title: 'Everything in one place', desc: 'Tasks, docs, goals & chat — unified in a single workspace.' },
    { icon: Users, title: 'Built for teams', desc: 'Real-time collaboration with granular permissions.' },
    { icon: BarChart3, title: 'Actionable dashboards', desc: 'Build custom views of your work with live widgets.' },
    { icon: Zap, title: 'Fast by default', desc: 'Keyboard-first UX with zero loading spinners.' },
];

export default function GuestLayout({ children, title, subtitle }) {
    return (
        <div className="min-h-screen grid lg:grid-cols-2 bg-neutral-950 text-neutral-100">
            {/* Left — brand / marketing */}
            <div className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-gradient-to-br from-purple-950 via-neutral-950 to-neutral-950 p-10">
                {/* Decorative orbs */}
                <div className="pointer-events-none absolute inset-0">
                    <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-purple-600/20 blur-3xl" />
                    <div className="absolute bottom-0 right-0 w-[28rem] h-[28rem] rounded-full bg-pink-500/10 blur-3xl" />
                </div>

                <div className="relative z-10">
                    <Link href="/" className="inline-flex items-center gap-2">
                        <img src="/logo.png" alt="29 Management" className="h-10 w-auto" />
                    </Link>
                </div>

                <div className="relative z-10 space-y-10">
                    <div>
                        <h1 className="text-3xl xl:text-4xl font-bold leading-tight bg-gradient-to-r from-white via-white to-purple-300 bg-clip-text text-transparent">
                            One place for work, deals, and goals.
                        </h1>
                        <p className="mt-3 text-sm text-neutral-400 max-w-md">
                            Manage tasks, run your CRM pipeline, track goals and dashboards — all from a single, fast workspace.
                        </p>
                    </div>

                    <ul className="grid grid-cols-2 gap-5 max-w-xl">
                        {HIGHLIGHTS.map(({ icon: Icon, title: t, desc }) => (
                            <li key={t} className="flex gap-3">
                                <span className="shrink-0 w-8 h-8 rounded-md bg-neutral-800/80 border border-neutral-700 flex items-center justify-center text-purple-400">
                                    <Icon size={15} />
                                </span>
                                <div>
                                    <div className="text-sm font-semibold text-neutral-100">{t}</div>
                                    <div className="text-xs text-neutral-500 mt-0.5 leading-relaxed">{desc}</div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="relative z-10 text-xs text-neutral-500">
                    © {new Date().getFullYear()} ProjectHub · Built for high-output teams.
                </div>
            </div>

            {/* Right — form */}
            <div className="flex items-center justify-center px-4 py-10 sm:px-8">
                <div className="w-full max-w-md">
                    {/* Mobile-only brand */}
                    <Link href="/" className="lg:hidden inline-flex items-center gap-2 mb-8">
                        <img src="/logo.png" alt="29 Management" className="h-10 w-auto" />
                    </Link>

                    {(title || subtitle) && (
                        <div className="mb-8">
                            {title && <h2 className="text-2xl font-bold tracking-tight text-white">{title}</h2>}
                            {subtitle && <p className="mt-1.5 text-sm text-neutral-400">{subtitle}</p>}
                        </div>
                    )}

                    {children}
                </div>
            </div>
        </div>
    );
}
