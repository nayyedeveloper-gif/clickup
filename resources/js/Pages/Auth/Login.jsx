import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function Login({ status, canResetPassword }) {
    const [showPassword, setShowPassword] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('login'), { onFinish: () => reset('password') });
    };

    return (
        <GuestLayout
            title="Welcome back"
            subtitle="Log in to continue managing your team's work."
        >
            <Head title="Log in" />

            {status && (
                <div className="mb-5 flex items-start gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
                    <CheckCircle2 size={15} className="mt-0.5 shrink-0" />
                    <span>{status}</span>
                </div>
            )}

            <form onSubmit={submit} className="space-y-4">
                {/* Email */}
                <div>
                    <label htmlFor="email" className="text-xs font-medium text-neutral-400">Email</label>
                    <div className={`mt-1.5 flex items-center gap-2 rounded-lg border bg-neutral-900 px-3 py-2.5 transition focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-500/20 ${
                        errors.email ? 'border-red-500/60' : 'border-neutral-800'
                    }`}>
                        <Mail size={15} className="text-neutral-500 shrink-0" />
                        <input
                            id="email"
                            type="email"
                            name="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            autoComplete="username"
                            autoFocus
                            required
                            placeholder="you@company.com"
                            className="bare-input placeholder:text-neutral-600"
                        />
                    </div>
                    {errors.email && <p className="mt-1.5 text-xs text-red-400">{errors.email}</p>}
                </div>

                {/* Password */}
                <div>
                    <div className="flex items-center justify-between">
                        <label htmlFor="password" className="text-xs font-medium text-neutral-400">Password</label>
                        {canResetPassword && (
                            <Link
                                href={route('password.request')}
                                className="text-xs text-purple-400 hover:text-purple-300"
                            >
                                Forgot password?
                            </Link>
                        )}
                    </div>
                    <div className={`mt-1.5 flex items-center gap-2 rounded-lg border bg-neutral-900 px-3 py-2.5 transition focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-500/20 ${
                        errors.password ? 'border-red-500/60' : 'border-neutral-800'
                    }`}>
                        <Lock size={15} className="text-neutral-500 shrink-0" />
                        <input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            autoComplete="current-password"
                            required
                            placeholder="••••••••"
                            className="bare-input placeholder:text-neutral-600"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword((v) => !v)}
                            className="text-neutral-500 hover:text-neutral-200"
                            tabIndex={-1}
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                    </div>
                    {errors.password && <p className="mt-1.5 text-xs text-red-400">{errors.password}</p>}
                </div>

                {/* Remember */}
                <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                        type="checkbox"
                        name="remember"
                        checked={data.remember}
                        onChange={(e) => setData('remember', e.target.checked)}
                        className="rounded border-neutral-700 bg-neutral-900 text-purple-500 focus:ring-2 focus:ring-purple-500/40 focus:ring-offset-0"
                    />
                    <span className="text-sm text-neutral-300">Remember me for 30 days</span>
                </label>

                <button
                    type="submit"
                    disabled={processing}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-500/20 transition hover:from-purple-500 hover:to-pink-500 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {processing ? 'Signing in...' : 'Log in'}
                    {!processing && <ArrowRight size={15} />}
                </button>

                <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-neutral-800" />
                    </div>
                    <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
                        <span className="bg-neutral-950 px-2 text-neutral-500">or continue with</span>
                    </div>
                </div>

                <a
                    href="/api/auth/google"
                    className="w-full inline-flex items-center justify-center gap-3 rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800 hover:border-neutral-600"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Google
                </a>

                <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-neutral-800" />
                    </div>
                    <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
                        <span className="bg-neutral-950 px-2 text-neutral-500">or</span>
                    </div>
                </div>

                <p className="text-center text-sm text-neutral-400">
                    Don't have an account?{' '}
                    <Link href={route('register')} className="font-semibold text-purple-400 hover:text-purple-300">
                        Sign up
                    </Link>
                </p>
            </form>
        </GuestLayout>
    );
}
