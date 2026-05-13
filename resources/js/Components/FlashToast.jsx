import { useEffect, useState } from 'react';
import { Transition } from '@headlessui/react';
import { X, ShieldAlert } from 'lucide-react';

export default function FlashToast({ flash }) {
    const [visible, setVisible] = useState(false);
    const [message, setMessage] = useState('');
    const [type, setType] = useState('error');

    useEffect(() => {
        if (flash?.error) {
            setMessage(flash.error);
            setType('error');
            setVisible(true);

            const timer = setTimeout(() => {
                setVisible(false);
            }, 5000);

            return () => clearTimeout(timer);
        }

        if (flash?.success) {
            setMessage(flash.success);
            setType('success');
            setVisible(true);

            const timer = setTimeout(() => {
                setVisible(false);
            }, 3000);

            return () => clearTimeout(timer);
        }
    }, [flash]);

    if (!visible) return null;

    const isError = type === 'error';

    return (
        <div className="fixed bottom-6 right-6 z-50">
            <Transition
                show={visible}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-2"
                enterTo="opacity-100 translate-y-0"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0"
                leaveTo="opacity-0 translate-y-2"
            >
                <div
                    className={`flex items-center gap-3 rounded-lg px-5 py-4 shadow-lg ${
                        isError
                            ? 'bg-white border-l-4 border-red-500'
                            : 'bg-white border-l-4 border-green-500'
                    }`}
                    style={{ minWidth: '320px', maxWidth: '400px' }}
                >
                    <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                            isError ? 'bg-red-100' : 'bg-green-100'
                        }`}
                    >
                        {isError ? (
                            <ShieldAlert className="h-5 w-5 text-red-600" />
                        ) : (
                            <svg
                                className="h-5 w-5 text-green-600"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                />
                            </svg>
                        )}
                    </div>

                    <div className="flex-1">
                        <p
                            className={`text-sm font-medium ${
                                isError ? 'text-red-800' : 'text-green-800'
                            }`}
                        >
                            {isError ? 'Access Denied' : 'Success'}
                        </p>
                        <p className="mt-0.5 text-sm text-gray-600">{message}</p>
                    </div>

                    <button
                        onClick={() => setVisible(false)}
                        className="shrink-0 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </Transition>
        </div>
    );
}
