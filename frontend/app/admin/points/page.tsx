"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import { Plus, Users, ShoppingBag, Coins, Calendar, X, Trash2 } from "lucide-react";

export default function PointsPage() {
    const [activeTab, setActiveTab] = useState<"campaigns" | "rewards">("campaigns");
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [rewards, setRewards] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [showCampaignModal, setShowCampaignModal] = useState(false);
    const [showRewardModal, setShowRewardModal] = useState(false);

    const [campaignForm, setCampaignForm] = useState({
        name: "",
        description: "",
        trigger_type: "SIGNUP",
        points_type: "FIXED",
        points_value: 100
    });

    const [rewardForm, setRewardForm] = useState({
        name: "",
        description: "",
        cost: 500,
        stock: 100
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [campaignsData, rewardsData] = await Promise.all([
                apiClient.getCampaigns(),
                apiClient.getRewards()
            ]);
            setCampaigns(campaignsData);
            setRewards(rewardsData);
            setLoading(false);
        } catch (error) {
            console.error("Failed to load data:", error);
            setLoading(false);
        }
    };

    const handleAddCampaign = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await apiClient.createCampaign(campaignForm);
            setShowCampaignModal(false);
            setCampaignForm({ name: "", description: "", trigger_type: "SIGNUP", points_type: "FIXED", points_value: 100 });
            loadData();
        } catch (error) {
            alert("Failed to add campaign");
        }
    };

    const handleAddReward = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await apiClient.createReward(rewardForm);
            setShowRewardModal(false);
            setRewardForm({ name: "", description: "", cost: 500, stock: 100 });
            loadData();
        } catch (error) {
            alert("Failed to add reward");
        }
    };

    const handleDeleteCampaign = async (id: string) => {
        if (!confirm("Are you sure you want to delete this campaign?")) return;
        try {
            await apiClient.deleteCampaign(id);
            loadData();
        } catch (error) {
            alert("Failed to delete campaign");
        }
    };

    const handleDeleteReward = async (id: string) => {
        if (!confirm("Are you sure you want to delete this reward?")) return;
        try {
            await apiClient.deleteReward(id);
            loadData();
        } catch (error) {
            alert("Failed to delete reward");
        }
    };

    if (loading) {
        return <div className="p-8">Loading...</div>;
    }

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-gray-900">Points Program</h1>
                    <div className="w-12 h-6 bg-green-500 rounded-full relative cursor-pointer">
                        <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                    </div>
                </div>
                <button
                    onClick={() => activeTab === "campaigns" ? setShowCampaignModal(true) : setShowRewardModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-[#00c853] text-white rounded-lg font-medium hover:bg-[#00b24a] transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    {activeTab === "campaigns" ? "Add Campaign" : "Add Reward"}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Campaigns Card */}
                <div
                    onClick={() => setActiveTab("campaigns")}
                    className={`cursor-pointer bg-white rounded-xl border p-6 flex gap-4 shadow-sm transition-all ${activeTab === "campaigns" ? "border-green-500 ring-1 ring-green-500" : "border-gray-100 opacity-60"
                        }`}
                >
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <div className="w-6 h-6 bg-green-500 rounded"></div>
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 mb-1">Campaigns</h3>
                        <p className="text-sm text-gray-500 leading-relaxed">
                            Define rules for how customers earn points. Campaigns are triggered by specific customer activities.
                        </p>
                    </div>
                </div>

                {/* Rewards Card */}
                <div
                    onClick={() => setActiveTab("rewards")}
                    className={`cursor-pointer bg-white rounded-xl border p-6 flex gap-4 shadow-sm transition-all ${activeTab === "rewards" ? "border-yellow-500 ring-1 ring-yellow-500" : "border-gray-100 opacity-60"
                        }`}
                >
                    <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                        <div className="w-6 h-6 bg-yellow-500 rounded"></div>
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 mb-1">Rewards</h3>
                        <p className="text-sm text-gray-500 leading-relaxed">
                            Recognize your customers' loyalty to your brand. Reward them with exclusive coupons in return for the points they redeem.
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50/50 border-b border-gray-100">
                        {activeTab === "campaigns" ? (
                            <tr>
                                <th className="px-8 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Campaign Name</th>
                                <th className="px-8 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Trigger</th>
                                <th className="px-8 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Points</th>
                                <th className="px-8 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        ) : (
                            <tr>
                                <th className="px-8 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Reward Name</th>
                                <th className="px-8 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Cost</th>
                                <th className="px-8 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Stock</th>
                                <th className="px-8 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        )}
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {activeTab === "campaigns" ? (
                            campaigns.map((campaign) => (
                                <tr key={campaign.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-8 py-6 text-sm font-medium text-gray-900">{campaign.name}</td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Users className="h-4 w-4" />
                                            {campaign.trigger_type}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-sm font-semibold text-gray-900">{campaign.points_value} Points</td>
                                    <td className="px-8 py-6 text-right">
                                        <button onClick={() => handleDeleteCampaign(campaign.id)} className="text-red-500 hover:text-red-700">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            rewards.map((reward) => (
                                <tr key={reward.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-8 py-6 text-sm font-medium text-gray-900">{reward.name}</td>
                                    <td className="px-8 py-6 text-sm font-semibold text-gray-900">{reward.cost} Points</td>
                                    <td className="px-8 py-6 text-sm text-gray-500">{reward.stock || "Unlimited"}</td>
                                    <td className="px-8 py-6 text-right">
                                        <button onClick={() => handleDeleteReward(reward.id)} className="text-red-500 hover:text-red-700">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                        {(activeTab === "campaigns" ? campaigns : rewards).length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-8 py-12 text-center text-gray-500">
                                    No {activeTab} found. Click "Add {activeTab === "campaigns" ? "Campaign" : "Reward"}" to get started.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Campaign Modal */}
            {showCampaignModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-8 w-full max-w-md">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold">Add New Campaign</h2>
                            <button onClick={() => setShowCampaignModal(false)}><X className="h-6 w-6" /></button>
                        </div>
                        <form onSubmit={handleAddCampaign} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Name</label>
                                <input
                                    type="text"
                                    required
                                    value={campaignForm.name}
                                    onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                                    placeholder="e.g. Welcome Bonus"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    required
                                    value={campaignForm.description}
                                    onChange={(e) => setCampaignForm({ ...campaignForm, description: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                                    rows={3}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Trigger Type</label>
                                    <select
                                        value={["SIGNUP", "PURCHASE", "REFERRAL", "REVIEW"].includes(campaignForm.trigger_type) ? campaignForm.trigger_type : "CUSTOM"}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (val === "CUSTOM") {
                                                setCampaignForm({ ...campaignForm, trigger_type: "" });
                                            } else {
                                                setCampaignForm({ ...campaignForm, trigger_type: val });
                                            }
                                        }}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                                    >
                                        <option value="SIGNUP">Signup</option>
                                        <option value="PURCHASE">Purchase</option>
                                        <option value="REFERRAL">Referral</option>
                                        <option value="REVIEW">Review</option>
                                        <option value="CUSTOM">Custom API Event</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Points</label>
                                    <input
                                        type="number"
                                        required
                                        value={campaignForm.points_value}
                                        onChange={(e) => setCampaignForm({ ...campaignForm, points_value: parseFloat(e.target.value) })}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                                    />
                                </div>
                            </div>

                            {/* Custom Event Name Input */}
                            {!["SIGNUP", "PURCHASE", "REFERRAL", "REVIEW"].includes(campaignForm.trigger_type) && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Event Name (API Key)
                                        <span className="ml-2 text-xs text-gray-500 font-normal">
                                            Trigger this via API using this exact name (e.g. "form_submit")
                                        </span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={campaignForm.trigger_type}
                                        onChange={(e) => setCampaignForm({ ...campaignForm, trigger_type: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 font-mono text-sm"
                                        placeholder="e.g. newsletter_signup"
                                    />
                                </div>
                            )}

                            <button
                                type="submit"
                                className="w-full py-3 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600 transition-colors"
                            >
                                Create Campaign
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Reward Modal */}
            {showRewardModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-8 w-full max-w-md">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold">Add New Reward</h2>
                            <button onClick={() => setShowRewardModal(false)}><X className="h-6 w-6" /></button>
                        </div>
                        <form onSubmit={handleAddReward} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Reward Name</label>
                                <input
                                    type="text"
                                    required
                                    value={rewardForm.name}
                                    onChange={(e) => setRewardForm({ ...rewardForm, name: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500"
                                    placeholder="e.g. 10% Discount Coupon"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    required
                                    value={rewardForm.description}
                                    onChange={(e) => setRewardForm({ ...rewardForm, description: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500"
                                    rows={3}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Cost (Points)</label>
                                    <input
                                        type="number"
                                        required
                                        value={rewardForm.cost}
                                        onChange={(e) => setRewardForm({ ...rewardForm, cost: parseInt(e.target.value) })}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                                    <input
                                        type="number"
                                        required
                                        value={rewardForm.stock}
                                        onChange={(e) => setRewardForm({ ...rewardForm, stock: parseInt(e.target.value) })}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500"
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                className="w-full py-3 bg-yellow-500 text-white rounded-lg font-bold hover:bg-yellow-600 transition-colors"
                            >
                                Create Reward
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
