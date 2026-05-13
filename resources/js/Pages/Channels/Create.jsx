import { Link, router, useForm } from '@inertiajs/react';
import Sidebar from '@/Components/Sidebar';

export default function ChannelCreate() {
    console.log('ChannelCreate component rendering');
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        description: '',
        space_id: null,
        is_private: false,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Submitting channel form:', data);
        post('/channels', {
            onError: (errors) => {
                console.error('Validation errors:', errors);
            },
            onSuccess: () => {
                console.log('Channel created successfully');
            },
        });
    };

    return (
        <div className="flex">
            <Sidebar spaces={[]} />
            <div className="flex-1 p-8">
                <div className="mb-8">
                    <Link href={route('channels.index')} className="text-purple-600 hover:text-purple-700 font-medium">
                        ← Back to Channels
                    </Link>
                </div>
                <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
                    <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Create Channel</h1>
                    {errors.name && <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">{errors.name}</div>}
                    {errors.space_id && <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">{errors.space_id}</div>}
                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label className="block mb-2 text-sm font-semibold text-gray-700">Name</label>
                            <input
                                type="text"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                                required
                            />
                            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                        </div>
                        <div className="mb-4">
                            <label className="block mb-2 text-sm font-semibold text-gray-700">Description</label>
                            <textarea
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                                rows="3"
                            />
                        </div>
                        <div className="mb-6">
                            <label className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    checked={data.is_private}
                                    onChange={(e) => setData('is_private', e.target.checked)}
                                    className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                                />
                                <span className="text-sm font-semibold text-gray-700">Private Channel</span>
                            </label>
                        </div>
                        <div className="flex space-x-3">
                            <button
                                type="submit"
                                disabled={processing}
                                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-200 font-semibold shadow-lg disabled:opacity-50"
                            >
                                {processing ? 'Creating...' : 'Create Channel'}
                            </button>
                            <Link
                                href={route('channels.index')}
                                className="bg-gray-200 px-6 py-3 rounded-xl hover:bg-gray-300 transition-all duration-200 font-semibold text-gray-700"
                            >
                                Cancel
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
