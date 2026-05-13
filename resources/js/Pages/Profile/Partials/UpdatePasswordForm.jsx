import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Transition } from '@headlessui/react';
import { useForm } from '@inertiajs/react';
import { useRef } from 'react';
import { Lock, Key, CheckCircle2 } from 'lucide-react';

export default function UpdatePasswordForm({ className = '' }) {
    const passwordInput = useRef();
    const currentPasswordInput = useRef();

    const {
        data,
        setData,
        errors,
        put,
        reset,
        processing,
        recentlySuccessful,
    } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const updatePassword = (e) => {
        e.preventDefault();

        put(route('password.update'), {
            preserveScroll: true,
            onSuccess: () => reset(),
            onError: (errors) => {
                if (errors.password) {
                    reset('password', 'password_confirmation');
                    passwordInput.current.focus();
                }

                if (errors.current_password) {
                    reset('current_password');
                    currentPasswordInput.current.focus();
                }
            },
        });
    };

    return (
        <section className={className}>
            <header className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                    <Key size={20} className="text-purple-400" />
                    <h2 className="text-lg font-semibold text-white">
                        Update Password
                    </h2>
                </div>
                <p className="text-sm text-neutral-400">
                    Ensure your account is using a long, random password to stay secure.
                </p>
            </header>

            <form onSubmit={updatePassword} className="space-y-6">
                <div>
                    <InputLabel
                        htmlFor="current_password"
                        value="Current Password"
                        className="text-neutral-300"
                    />

                    <div className="relative mt-1.5">
                        <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                        <TextInput
                            id="current_password"
                            ref={currentPasswordInput}
                            value={data.current_password}
                            onChange={(e) =>
                                setData('current_password', e.target.value)
                            }
                            type="password"
                            className="block w-full bg-neutral-800 border-neutral-700 text-white pl-10 focus:border-purple-500 focus:ring-purple-500/20"
                            autoComplete="current-password"
                            placeholder="Enter current password"
                        />
                    </div>

                    <InputError
                        message={errors.current_password}
                        className="mt-2 text-red-400"
                    />
                </div>

                <div>
                    <InputLabel htmlFor="password" value="New Password" className="text-neutral-300" />

                    <div className="relative mt-1.5">
                        <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                        <TextInput
                            id="password"
                            ref={passwordInput}
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            type="password"
                            className="block w-full bg-neutral-800 border-neutral-700 text-white pl-10 focus:border-purple-500 focus:ring-purple-500/20"
                            autoComplete="new-password"
                            placeholder="Enter new password"
                        />
                    </div>

                    <InputError message={errors.password} className="mt-2 text-red-400" />
                </div>

                <div>
                    <InputLabel
                        htmlFor="password_confirmation"
                        value="Confirm Password"
                        className="text-neutral-300"
                    />

                    <div className="relative mt-1.5">
                        <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                        <TextInput
                            id="password_confirmation"
                            value={data.password_confirmation}
                            onChange={(e) =>
                                setData('password_confirmation', e.target.value)
                            }
                            type="password"
                            className="block w-full bg-neutral-800 border-neutral-700 text-white pl-10 focus:border-purple-500 focus:ring-purple-500/20"
                            autoComplete="new-password"
                            placeholder="Confirm new password"
                        />
                    </div>

                    <InputError
                        message={errors.password_confirmation}
                        className="mt-2 text-red-400"
                    />
                </div>

                <div className="flex items-center gap-4 pt-2">
                    <PrimaryButton
                        disabled={processing}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500"
                    >
                        {processing ? 'Updating...' : 'Update Password'}
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
