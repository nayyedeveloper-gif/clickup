import { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';
import { X } from 'lucide-react';

// Vector Shield Icon with Lock
function ShieldLockIcon() {
    return (
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Animated circles */}
            <circle cx="40" cy="40" r="38" fill="url(#shieldGradient)" fillOpacity="0.1" className="animate-pulse" />
            <circle cx="40" cy="40" r="32" fill="url(#shieldGradient)" fillOpacity="0.15" />
            
            {/* Shield shape */}
            <path 
                d="M40 8L12 20V36C12 54 40 68 40 68C40 68 68 54 68 36V20L40 8Z" 
                fill="url(#shieldGradient)" 
                stroke="#DC2626" 
                strokeWidth="2"
                className="drop-shadow-lg"
            />
            
            {/* Lock body */}
            <rect x="28" y="34" width="24" height="20" rx="4" fill="#7C2D12" />
            
            {/* Lock shackle */}
            <path 
                d="M32 34V28C32 23.58 35.58 20 40 20C44.42 20 48 23.58 48 28V34" 
                stroke="#7C2D12" 
                strokeWidth="4" 
                strokeLinecap="round"
                fill="none"
            />
            
            {/* Keyhole */}
            <circle cx="40" cy="42" r="4" fill="#FCA5A5" />
            <path d="M40 46L40 52" stroke="#FCA5A5" strokeWidth="3" strokeLinecap="round" />
            
            {/* Definitions for gradients */}
            <defs>
                <linearGradient id="shieldGradient" x1="12" y1="8" x2="68" y2="68" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#FECACA" />
                    <stop offset="1" stopColor="#DC2626" />
                </linearGradient>
            </defs>
        </svg>
    );
}

export default function AccessDeniedModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [isVisible, setIsVisible] = useState(false);

    const showModal = (errorMsg) => {
        setMessage(errorMsg);
        setIsOpen(true);
        setTimeout(() => setIsVisible(true), 10);
    };

    useEffect(() => {
        // Check initial page props from Inertia
        const initialPage = router.page || window?.__INERTIA_PAGE__;
        const initialError = initialPage?.props?.flash?.error;
        if (initialError) {
            showModal(initialError);
        }

        // Listen to navigation events to catch flash messages
        const removeNavigateListener = router.on('navigate', (event) => {
            const flash = event.detail.page?.props?.flash;
            if (flash?.error) {
                showModal(flash.error);
            }
        });

        return () => {
            removeNavigateListener();
        };
    }, []);

    const closeModal = () => {
        setIsVisible(false);
        setTimeout(() => setIsOpen(false), 300);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop with blur */}
            <div 
                className={`fixed inset-0 bg-gray-900/70 backdrop-blur-sm transition-all duration-300 ${
                    isVisible ? 'opacity-100' : 'opacity-0'
                }`}
                onClick={closeModal}
            />

            {/* Modal Container */}
            <div className="flex min-h-full items-center justify-center p-4">
                <div 
                    className={`relative transform transition-all duration-300 ${
                        isVisible 
                            ? 'opacity-100 scale-100 translate-y-0' 
                            : 'opacity-0 scale-95 translate-y-8'
                    }`}
                >
                    {/* Modal Card */}
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                        {/* Top decorative gradient bar */}
                        <div className="h-2 bg-gradient-to-r from-red-400 via-red-500 to-red-600" />
                        
                        {/* Close button */}
                        <button
                            onClick={closeModal}
                            className="absolute right-4 top-6 rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all duration-200 hover:rotate-90"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        {/* Content */}
                        <div className="px-8 pb-8 pt-6">
                            {/* Animated Vector Icon */}
                            <div className="mx-auto flex items-center justify-center mb-6 animate-bounce-slow">
                                <ShieldLockIcon />
                            </div>

                            {/* Title with animation */}
                            <h3 className="text-center text-2xl font-bold text-gray-900 mb-3">
                                Access Denied
                            </h3>
                            
                            {/* Divider */}
                            <div className="flex items-center justify-center gap-2 mb-4">
                                <div className="h-px w-12 bg-gradient-to-r from-transparent via-red-400 to-transparent" />
                            </div>
                            
                            {/* Message */}
                            <p className="text-center text-gray-600 mb-2 leading-relaxed">
                                {message || "You don't have permission to access this resource."}
                            </p>
                            
                            {/* Burmese text */}
                            <p className="text-center text-sm text-red-500 font-medium">
                                ခွင့်ပြုချက် မရှိပါ။
                            </p>

                            {/* Action Button */}
                            <div className="mt-8">
                                <button
                                    onClick={closeModal}
                                    className="w-full rounded-xl bg-gradient-to-r from-red-500 to-red-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-red-500/30 hover:from-red-600 hover:to-red-700 hover:shadow-xl hover:shadow-red-500/40 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                        
                        {/* Bottom decorative elements */}
                        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-red-100 rounded-full blur-3xl opacity-50" />
                        <div className="absolute -top-20 -right-20 w-40 h-40 bg-pink-100 rounded-full blur-3xl opacity-50" />
                    </div>
                </div>
            </div>
            
            {/* CSS for custom animations */}
            <style>{`
                @keyframes bounce-slow {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
                .animate-bounce-slow {
                    animation: bounce-slow 3s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
}
