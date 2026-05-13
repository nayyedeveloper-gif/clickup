import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Transition } from '@headlessui/react';
import { Link, useForm, usePage } from '@inertiajs/react';
import { User, Mail, CheckCircle2, AlertCircle } from 'lucide-react';

export default function UpdateProfileInformation({
    mustVerifyEmail,
    status,
    className = '',
    /** When nested in a card that already shows title/description, omit the duplicate header. */
    hideIntro = false,
}) {
    const user = usePage().props.auth.user;

    const { data, setData, patch, errors, processing, recentlySuccessful } =
        useForm({
            name: user.name,
            email: user.email,
        });

    const submit = (e) => {
        e.preventDefault();
        patch(route('profile.update'));
    };

    return (
        <section className={className}>
            {!hideIntro && (
                <header className="mb-6">
                    <div className="mb-2 flex items-center gap-2">
                        <User size={20} className="text-purple-400" />
                        <h2 className="text-lg font-semibold text-white">
                            Profile Information
                        </h2>
                    </div>
                    <p className="text-sm text-neutral-400">
                        Update your account's profile information and email address.
                    </p>
                </header>
            )}

            <form onSubmit={submit} className="space-y-6">
                <div>
                    <InputLabel htmlFor="name" value="Full Name" className="text-neutral-300" />

                    <TextInput
                        id="name"
                        className="mt-1.5 block w-full bg-neutral-800 border-neutral-700 text-white focus:border-purple-500 focus:ring-purple-500/20"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        required
                        isFocused
                        autoComplete="name"
                        placeholder="Enter your full name"
                    />

                    <InputError className="mt-2 text-red-400" message={errors.name} />
                </div>

                <div>
                    <InputLabel htmlFor="email" value="Email Address" className="text-neutral-300" />

                    <div className="relative mt-1.5">
                        <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                        <TextInput
                            id="email"
                            type="email"
                            className="block w-full bg-neutral-800 border-neutral-700 text-white pl-10 focus:border-purple-500 focus:ring-purple-500/20"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            required
                            autoComplete="username"
                            placeholder="you@example.com"
                        />
                    </div>

                    <InputError className="mt-2 text-red-400" message={errors.email} />
                </div>

                {mustVerifyEmail && user.email_verified_at === null && (
                    <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-4">
                        <div className="flex items-start gap-3">
                            <AlertCircle size={16} className="text-amber-400 mt-0.5 shrink-0" />
                            <div className="flex-1">
                                <p className="text-sm text-amber-200">
                                    Your email address is unverified.
                                </p>
                                <Link
                                    href={route('verification.send')}
                                    method="post"
                                    as="button"
                                    className="mt-2 inline-flex items-center gap-1 text-sm text-amber-300 hover:text-amber-200 underline"
                                >
                                    Click here to re-send the verification email.
                                </Link>

                                {status === 'verification-link-sent' && (
                                    <div className="mt-3 flex items-center gap-2 text-sm text-emerald-400">
                                        <CheckCircle2 size={14} />
                                        <span>A new verification link has been sent.</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center">
                    <PrimaryButton
                        disabled={processing}
                        className="w-full justify-center bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 sm:w-auto"
                    >
                        {processing ? 'Saving...' : 'Save Changes'}
                    </PrimaryButton>

                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <p className="text-sm text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 size={14} />
                            Saved.
                        </p>
                    </Transition>
                </div>
            </form>
        </section>
    );
}
