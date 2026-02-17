"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import { Plus, Edit2, Trash2 } from "lucide-react";

export default function RewardsPage() {
    const [rewards, setRewards] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadRewards();
    }, []);

    const loadRewards = async () => {
        try {
            const data = await apiClient.getRewards();
            setRewards(data);
            setLoading(false);
        } catch (error) {
            console.error("Failed to load rewards:", error);
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this reward?")) {
            try {
                await apiClient.deleteReward(id);
                loadRewards();
            } catch (error) {
                alert("Failed to delete reward");
            }
        }
    };

    if (loading) {
        return <div className="p-8">Loading...</div>;
    }

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Rewards</h1>
                    <p className="text-gray-500 mt-1">Manage your rewards catalog</p>
                </div>
                <button
                    className="flex items-center gap-2 px-6 py-2 text-white rounded-lg font-medium"
                    style={{ backgroundColor: '#007bff' }}
                >
                    <Plus className="h-4 w-4" />
                    Add Reward
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rewards.map((reward) => (
                    <div
                        key={reward.id}
                        className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-2xl">
                                🎁
                            </div>
                            <div className="flex gap-2">
                                <button className="p-2 text-gray-400 hover:text-blue-600">
                                    <Edit2 className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => handleDelete(reward.id)}
                                    className="p-2 text-gray-400 hover:text-red-600"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                        <h3 className="font-bold text-gray-900 mb-2">{reward.name}</h3>
                        <p className="text-sm text-gray-600 mb-4">{reward.description}</p>
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                            <span className="text-sm font-semibold" style={{ color: '#007bff' }}>
                                {reward.cost} Points
                            </span>
                            {reward.stock !== null && (
                                <span className="text-xs text-gray-500">Stock: {reward.stock}</span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
