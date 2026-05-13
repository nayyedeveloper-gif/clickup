import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { Mail, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function ForgotPassword({ status }) {
    const { data, setData, post, processing, errors } = useForm({ email: '' });

    const submit = (e) => {
        e.preventDefault();
        post(route('password.email'));
    };

    return (
        <GuestLayout
            title="Reset your password"
            subtitle="Enter your email and we'll send you a secure link to set a new password."
        >
            <Head title="Forgot Password" />

            {status && (
                <div className="mb-5 flex items-start gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
                    <CheckCircle2 size={15} className="mt-0.5 shrink-0" />
                    <span>{status}</span>
                </div>
            )}

            <form onSubmit={submit} className="space-y-4">
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
                            autoFocus required
                            placeholder="you@company.com"
                            className="bare-input placeholder:text-neutral-600"
                        />
                    </div>
                    {errors.email && <p className="mt-1.5 text-xs text-red-400">{errors.email}</p>}
                </div>

                <button
                    type="submit"
                    disabled={processing}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-500/20 transition hover:from-purple-500 hover:to-pink-500 disabled:opacity-60"
                >
                    {processing ? 'Sending...' : 'Send reset link'}
                    {!processing && <ArrowRight size={15} />}
                </button>

                <Link
                    href={route('login')}
                    className="flex items-center justify-center gap-1.5 text-sm text-neutral-400 hover:text-neutral-200"
                >
                    <ArrowLeft size={13} /> Back to log in
                </Link>
            </form>
        </GuestLayout>
    );
}
