import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { User, Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck } from 'lucide-react';

function passwordStrength(pw) {
    if (!pw) return { score: 0, label: '', color: 'bg-neutral-800' };
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
    if (/\d/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    const map = [
        { label: '', color: 'bg-neutral-800' },
        { label: 'Weak', color: 'bg-red-500' },
        { label: 'Fair', color: 'bg-amber-500' },
        { label: 'Good', color: 'bg-emerald-500' },
        { label: 'Strong', color: 'bg-emerald-400' },
    ];
    return { score, ...map[score] };
}

export default function Register({ email = '', token = '' }) {
    const [showPassword, setShowPassword] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: email || '',
        password: '',
        password_confirmation: '',
        token: token || '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    const strength = useMemo(() => passwordStrength(data.password), [data.password]);
    const matches = data.password_confirmation && data.password === data.password_confirmation;

    return (
        <GuestLayout
            title="Create your account"
            subtitle="Start collaborating with your team in minutes — no credit card required."
        >
            <Head title="Register" />

            <form onSubmit={submit} className="space-y-4">
                {/* Name */}
                <div>
                    <label htmlFor="name" className="text-xs font-medium text-neutral-400">Full name</label>
                    <div className={`mt-1.5 flex items-center gap-2 rounded-lg border bg-neutral-900 px-3 py-2.5 transition focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-500/20 ${
                        errors.name ? 'border-red-500/60' : 'border-neutral-800'
                    }`}>
                        <User size={15} className="text-neutral-500 shrink-0" />
                        <input
                            id="name"
                            name="name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            autoComplete="name"
                            autoFocus
                            required
                            placeholder="Jane Doe"
                            className="bare-input placeholder:text-neutral-600"
                        />
                    </div>
                    {errors.name && <p className="mt-1.5 text-xs text-red-400">{errors.name}</p>}
                </div>

                {/* Email */}
                <div>
                    <label htmlFor="email" className="text-xs font-medium text-neutral-400">Work email</label>
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
                            required
                            placeholder="you@company.com"
                            className="bare-input placeholder:text-neutral-600"
                        />
                    </div>
                    {errors.email && <p className="mt-1.5 text-xs text-red-400">{errors.email}</p>}
                </div>

                {/* Password */}
                <div>
                    <label htmlFor="password" className="text-xs font-medium text-neutral-400">Password</label>
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
                            autoComplete="new-password"
                            required
                            placeholder="At least 8 characters"
                            className="bare-input placeholder:text-neutral-600"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword((v) => !v)}
                            className="text-neutral-500 hover:text-neutral-200"
                            tabIndex={-1}
                        >
                            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                    </div>
                    {data.password && (
                        <div className="mt-2 flex items-center gap-2">
                            <div className="flex-1 grid grid-cols-4 gap-1">
                                {[1, 2, 3, 4].map((i) => (
                                    <div
                                        key={i}
                                        className={`h-1 rounded-full transition ${
                                            i <= strength.score ? strength.color : 'bg-neutral-800'
                                        }`}
                                    />
                                ))}
                            </div>
                            <span className="text-[11px] text-neutral-500 w-12 text-right">{strength.label}</span>
                        </div>
                    )}
                    {errors.password && <p className="mt-1.5 text-xs text-red-400">{errors.password}</p>}
                </div>

                {/* Confirm */}
                <div>
                    <label htmlFor="password_confirmation" className="text-xs font-medium text-neutral-400">Confirm password</label>
                    <div className={`mt-1.5 flex items-center gap-2 rounded-lg border bg-neutral-900 px-3 py-2.5 transition focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-500/20 ${
                        errors.password_confirmation
                            ? 'border-red-500/60'
                            : matches ? 'border-emerald-500/40' : 'border-neutral-800'
                    }`}>
                        <ShieldCheck size={15} className={matches ? 'text-emerald-400' : 'text-neutral-500'} />
                        <input
                            id="password_confirmation"
                            type={showPassword ? 'text' : 'password'}
                            name="password_confirmation"
                            value={data.password_confirmation}
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                            autoComplete="new-password"
                            required
                            placeholder="Re-enter password"
                            className="bare-input placeholder:text-neutral-600"
                        />
                    </div>
                    {errors.password_confirmation && (
                        <p className="mt-1.5 text-xs text-red-400">{errors.password_confirmation}</p>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={processing}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-500/20 transition hover:from-purple-500 hover:to-pink-500 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {processing ? 'Creating account...' : 'Create account'}
                    {!processing && <ArrowRight size={15} />}
                </button>

                <p className="text-[11px] text-neutral-500 text-center leading-relaxed">
                    By creating an account you agree to our{' '}
                    <a href="#" className="text-neutral-400 hover:text-neutral-200 underline-offset-2 hover:underline">Terms</a> and{' '}
                    <a href="#" className="text-neutral-400 hover:text-neutral-200 underline-offset-2 hover:underline">Privacy Policy</a>.
                </p>

                <div className="relative my-2">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-neutral-800" />
                    </div>
                    <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
                        <span className="bg-neutral-950 px-2 text-neutral-500">or</span>
                    </div>
                </div>

                <p className="text-center text-sm text-neutral-400">
                    Already have an account?{' '}
                    <Link href={route('login')} className="font-semibold text-purple-400 hover:text-purple-300">
                        Log in
                    </Link>
                </p>
            </form>
        </GuestLayout>
    );
}
