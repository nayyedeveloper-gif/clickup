import { Head, router, usePage } from '@inertiajs/react';
import { useRef, useState } from 'react';
import Sidebar from '@/Components/Sidebar';
import MobileAppBar from '@/Components/Mobile/MobileAppBar';
import { User as UserIcon, Lock, Trash2, ChevronRight, Camera, X, Bell } from 'lucide-react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';
import NotificationsSection from '@/Components/Profile/NotificationsSection';

export default function Edit({ mustVerifyEmail, status }) {
    const { auth } = usePage().props;
    const user = auth?.user;
    const initial = user?.name?.charAt(0).toUpperCase() || '?';
    const fileInputRef = useRef(null);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');

    const handleAvatarSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadError('');

        // Client-side validation
        if (!['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(file.type)) {
            setUploadError('Only JPG, PNG, or WEBP images are allowed.');
            return;
        }
        if (file.size > 4 * 1024 * 1024) {
            setUploadError('File must be 4MB or smaller.');
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('avatar', file);

        router.post(route('profile.avatar.update'), formData, {
            forceFormData: true,
            preserveScroll: true,
            onFinish: () => {
                setUploading(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
            },
            onError: (errors) => {
                setUploadError(errors.avatar || 'Upload failed.');
            },
        });
    };

    const handleRemoveAvatar = () => {
        if (!confirm('Remove your profile picture?')) return;
        router.delete(route('profile.avatar.destroy'), { preserveScroll: true });
    };

    return (
        <div className="flex h-screen bg-neutral-950 text-neutral-100">
            <Sidebar />
            <Head title="Profile Settings" />

            <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                <div className="shrink-0 lg:hidden">
                    <MobileAppBar title="Profile" subtitle="Settings & notifications" backHref={route('inbox.index')} />
                </div>
                {/* Header */}
                <div className="hidden border-b border-neutral-800 px-8 py-5 pr-20 lg:block">
                    <div className="mb-1 flex items-center gap-2 text-xs text-neutral-500">
                        <span>Workspace</span>
                        <ChevronRight size={12} />
                        <span className="text-neutral-300">Profile Settings</span>
                    </div>
                    <h1 className="text-2xl font-semibold">Profile Settings</h1>
                </div>

                {/* Content */}
                <div className="min-h-0 flex-1 overflow-y-auto">
                    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-8 sm:py-8">
                        {/* Profile Card Header with Avatar upload */}
                        <div className="bg-gradient-to-br from-purple-600/20 via-pink-600/10 to-transparent border border-neutral-800 rounded-xl p-6 flex items-center gap-5">
                            <div className="relative group">
                                {user?.avatar_url ? (
                                    <img
                                        src={user.avatar_url}
                                        alt={user?.name}
                                        className="w-20 h-20 rounded-full object-cover shadow-lg ring-2 ring-neutral-800"
                                    />
                                ) : (
                                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-2xl shadow-lg ring-2 ring-neutral-800">
                                        {initial}
                                    </div>
                                )}
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading}
                                    className="absolute inset-0 w-20 h-20 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white disabled:opacity-80"
                                    title="Change profile picture"
                                >
                                    <Camera size={22} />
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/jpg,image/webp"
                                    onChange={handleAvatarSelect}
                                    className="hidden"
                                />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-lg font-semibold text-white truncate">{user?.name}</div>
                                <div className="text-sm text-neutral-400 truncate">{user?.email}</div>
                                <div className="mt-2 flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={uploading}
                                        className="px-3 py-1.5 text-xs rounded-md bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 disabled:opacity-60"
                                    >
                                        {uploading ? 'Uploading...' : (user?.avatar_url ? 'Change photo' : 'Upload photo')}
                                    </button>
                                    {user?.avatar_url && (
                                        <button
                                            type="button"
                                            onClick={handleRemoveAvatar}
                                            className="px-3 py-1.5 text-xs rounded-md border border-red-900/50 text-red-300 hover:bg-red-500/10 flex items-center gap-1"
                                        >
                                            <X size={12} /> Remove
                                        </button>
                                    )}
                                </div>
                                {uploadError && (
                                    <div className="mt-2 text-xs text-red-400">{uploadError}</div>
                                )}
                            </div>
                        </div>

                        {/* Profile Information */}
                        <Section
                            icon={UserIcon}
                            title="Profile Information"
                            description="Update your account's profile information and email address."
                            hideDescriptionOnMobile
                        >
                            <UpdateProfileInformationForm
                                mustVerifyEmail={mustVerifyEmail}
                                status={status}
                                className="max-w-xl"
                                hideIntro
                            />
                        </Section>

                        {/* Notifications */}
                        <Section icon={Bell} title="Notifications" description="Realtime sound, browser alerts while the tab is in the background, and push when you are away — for messages and tasks.">
                            <NotificationsSection />
                        </Section>

                        {/* Update Password */}
                        <Section icon={Lock} title="Update Password" description="Ensure your account is using a long, random password to stay secure.">
                            <UpdatePasswordForm className="max-w-xl" />
                        </Section>

                        {/* Delete Account */}
                        <Section icon={Trash2} title="Delete Account" description="Permanently delete your account. This action cannot be undone." danger>
                            <DeleteUserForm className="max-w-xl" />
                        </Section>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Section({ icon: Icon, title, description, children, danger = false, hideDescriptionOnMobile = false }) {
    return (
        <div className={`bg-neutral-900 border rounded-xl overflow-hidden ${danger ? 'border-red-900/40' : 'border-neutral-800'}`}>
            <div className={`px-6 py-4 border-b ${danger ? 'border-red-900/40 bg-red-950/10' : 'border-neutral-800'}`}>
                <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${danger ? 'bg-red-500/15 text-red-400' : 'bg-purple-500/15 text-purple-300'}`}>
                        <Icon size={15} />
                    </div>
                    <div>
                        <h2 className={`text-sm font-semibold ${danger ? 'text-red-300' : 'text-white'}`}>{title}</h2>
                        {description ? (
                            <p
                                className={`text-xs text-neutral-400 mt-0.5 ${hideDescriptionOnMobile ? 'hidden md:block' : ''}`}
                            >
                                {description}
                            </p>
                        ) : null}
                    </div>
                </div>
            </div>
            <div className="p-6">
                {children}
            </div>
        </div>
    );
}
