import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { Mail, Lock, ShieldCheck, Eye, EyeOff, ArrowRight } from 'lucide-react';

export default function ResetPassword({ token, email }) {
    const [showPassword, setShowPassword] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        token, email,
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('password.store'), { onFinish: () => reset('password', 'password_confirmation') });
    };

    return (
        <GuestLayout title="Set a new password" subtitle="Choose a strong password you don't use anywhere else.">
            <Head title="Reset Password" />

            <form onSubmit={submit} className="space-y-4">
                <div>
                    <label className="text-xs font-medium text-neutral-400">Email</label>
                    <div className={`mt-1.5 flex items-center gap-2 rounded-lg border bg-neutral-900 px-3 py-2.5 ${
                        errors.email ? 'border-red-500/60' : 'border-neutral-800'
                    }`}>
                        <Mail size={15} className="text-neutral-500 shrink-0" />
                        <input
                            type="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            autoComplete="username"
                            className="bare-input"
                            required
                        />
                    </div>
                    {errors.email && <p className="mt-1.5 text-xs text-red-400">{errors.email}</p>}
                </div>

                <div>
                    <label className="text-xs font-medium text-neutral-400">New password</label>
                    <div className={`mt-1.5 flex items-center gap-2 rounded-lg border bg-neutral-900 px-3 py-2.5 focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-500/20 ${
                        errors.password ? 'border-red-500/60' : 'border-neutral-800'
                    }`}>
                        <Lock size={15} className="text-neutral-500 shrink-0" />
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            autoComplete="new-password"
                            autoFocus required
                            className="bare-input"
                            placeholder="At least 8 characters"
                        />
                        <button type="button" onClick={() => setShowPassword((v) => !v)} className="text-neutral-500 hover:text-neutral-200" tabIndex={-1}>
                            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                    </div>
                    {errors.password && <p className="mt-1.5 text-xs text-red-400">{errors.password}</p>}
                </div>

                <div>
                    <label className="text-xs font-medium text-neutral-400">Confirm new password</label>
                    <div className={`mt-1.5 flex items-center gap-2 rounded-lg border bg-neutral-900 px-3 py-2.5 focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-500/20 ${
                        errors.password_confirmation ? 'border-red-500/60' : 'border-neutral-800'
                    }`}>
                        <ShieldCheck size={15} className="text-neutral-500 shrink-0" />
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={data.password_confirmation}
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                            autoComplete="new-password"
                            required
                            className="bare-input"
                            placeholder="Re-enter password"
                        />
                    </div>
                    {errors.password_confirmation && <p className="mt-1.5 text-xs text-red-400">{errors.password_confirmation}</p>}
                </div>

                <button
                    type="submit"
                    disabled={processing}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-500/20 transition hover:from-purple-500 hover:to-pink-500 disabled:opacity-60"
                >
                    {processing ? 'Saving...' : 'Reset password'}
                    {!processing && <ArrowRight size={15} />}
                </button>
            </form>
        </GuestLayout>
    );
}
