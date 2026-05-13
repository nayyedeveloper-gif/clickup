import { Link, router } from '@inertiajs/react';
import Sidebar from '@/Components/Sidebar';
import { useState } from 'react';

export default function ChannelEdit({ channel }) {
    const [formData, setFormData] = useState({
        name: channel.name,
        description: channel.description || '',
        is_private: channel.is_private,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        router.put(`/channels/${channel.id}`, formData);
    };

    return (
        <div className="flex">
            <Sidebar spaces={[]} />
            <div className="flex-1 p-8">
                <div className="mb-8">
                    <Link href={route('channels.show', channel)} className="text-purple-600 hover:text-purple-700 font-medium">
                        ← Back to Channel
                    </Link>
                </div>
                <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
                    <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Edit Channel</h1>
                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label className="block mb-2 text-sm font-semibold text-gray-700">Name</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                                required
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block mb-2 text-sm font-semibold text-gray-700">Description</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                                rows="3"
                            />
                        </div>
                        <div className="mb-6">
                            <label className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    checked={formData.is_private}
                                    onChange={(e) => setFormData({ ...formData, is_private: e.target.checked })}
                                    className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                                />
                                <span className="text-sm font-semibold text-gray-700">Private Channel</span>
                            </label>
                        </div>
                        <div className="flex space-x-3">
                            <button
                                type="submit"
                                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-200 font-semibold shadow-lg"
                            >
                                Update Channel
                            </button>
                            <Link
                                href={route('channels.show', channel)}
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
