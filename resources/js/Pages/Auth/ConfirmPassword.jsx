import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';

export default function ConfirmPassword() {
    const [showPassword, setShowPassword] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({ password: '' });

    const submit = (e) => {
        e.preventDefault();
        post(route('password.confirm'), { onFinish: () => reset('password') });
    };

    return (
        <GuestLayout
            title="Confirm your password"
            subtitle="This is a secure area. Please re-enter your password to continue."
        >
            <Head title="Confirm Password" />

            <form onSubmit={submit} className="space-y-4">
                <div>
                    <label className="text-xs font-medium text-neutral-400">Password</label>
                    <div className={`mt-1.5 flex items-center gap-2 rounded-lg border bg-neutral-900 px-3 py-2.5 focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-500/20 ${
                        errors.password ? 'border-red-500/60' : 'border-neutral-800'
                    }`}>
                        <Lock size={15} className="text-neutral-500 shrink-0" />
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            autoFocus required
                            className="bare-input"
                            placeholder="••••••••"
                        />
                        <button type="button" onClick={() => setShowPassword((v) => !v)} className="text-neutral-500 hover:text-neutral-200" tabIndex={-1}>
                            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                    </div>
                    {errors.password && <p className="mt-1.5 text-xs text-red-400">{errors.password}</p>}
                </div>

                <button
                    type="submit"
                    disabled={processing}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-500/20 transition hover:from-purple-500 hover:to-pink-500 disabled:opacity-60"
                >
                    <ShieldCheck size={15} />
                    {processing ? 'Verifying...' : 'Confirm'}
                </button>
            </form>
        </GuestLayout>
    );
}
