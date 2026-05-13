import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { CheckCircle2, Mail, LogOut, RefreshCw } from 'lucide-react';

export default function VerifyEmail({ status }) {
    const { post, processing } = useForm({});

    const submit = (e) => {
        e.preventDefault();
        post(route('verification.send'));
    };

    return (
        <GuestLayout
            title="Verify your email"
            subtitle="We've sent a verification link to your inbox. Click it to activate your account."
        >
            <Head title="Email Verification" />

            <div className="mb-5 flex items-start gap-3 rounded-lg border border-neutral-800 bg-neutral-900/60 p-4">
                <Mail size={18} className="text-purple-400 mt-0.5" />
                <p className="text-sm text-neutral-300 leading-relaxed">
                    Didn't get the email? Check your spam folder, or click the button below to send a new link.
                </p>
            </div>

            {status === 'verification-link-sent' && (
                <div className="mb-5 flex items-start gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
                    <CheckCircle2 size={15} className="mt-0.5 shrink-0" />
                    <span>A new verification link has been sent to your email address.</span>
                </div>
            )}

            <form onSubmit={submit} className="space-y-3">
                <button
                    type="submit"
                    disabled={processing}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-500/20 transition hover:from-purple-500 hover:to-pink-500 disabled:opacity-60"
                >
                    <RefreshCw size={15} />
                    {processing ? 'Sending...' : 'Resend verification email'}
                </button>

                <Link
                    href={route('logout')}
                    method="post"
                    as="button"
                    className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2.5 text-sm font-medium text-neutral-300 hover:text-white hover:bg-neutral-800"
                >
                    <LogOut size={14} />
                    Log out
                </Link>
            </form>
        </GuestLayout>
    );
}
