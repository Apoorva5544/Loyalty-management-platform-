"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import { Edit2, Info } from "lucide-react";

export default function VIPPage() {
    const [tiers, setTiers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // In a real app, we'd fetch tiers from the API
        // For now, using the seeded data structure
        setTiers([
            { id: 'bronze', name: 'Bronze', min_points: 0, multiplier: 1.0, benefits: ["Basic Rewards", "Email Support"], count: 0 },
            { id: 'silver', name: 'Silver', min_points: 1000, multiplier: 1.2, benefits: ["1.2x Points", "Priority Support", "Exclusive Offers"], count: 0 },
            { id: 'gold', name: 'Gold', min_points: 5000, multiplier: 1.5, benefits: ["1.5x Points", "VIP Events", "Personal Account Manager"], count: 0 },
        ]);
        setLoading(false);
    }, []);

    if (loading) {
        return <div className="p-8">Loading...</div>;
    }

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-2xl font-bold text-gray-900">VIP Tiers</h1>
                <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-4 py-2 rounded-lg">
                    <Info className="h-4 w-4" />
                    How VIP tiers work
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                {tiers.map((tier) => (
                    <div key={tier.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                        <div className={`h-2 ${tier.id === 'bronze' ? 'bg-orange-400' :
                                tier.id === 'silver' ? 'bg-gray-400' : 'bg-yellow-400'
                            }`}></div>
                        <div className="p-8 flex-1">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-gray-900">{tier.name}</h3>
                                <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                                    <Edit2 className="h-4 w-4" />
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Requirement</p>
                                    <p className="text-lg font-bold text-gray-900">{tier.min_points} Points</p>
                                </div>

                                <div>
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Point Multiplier</p>
                                    <p className="text-lg font-bold text-blue-600">{tier.multiplier}x</p>
                                </div>

                                <div>
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Benefits</p>
                                    <ul className="space-y-2">
                                        {tier.benefits.map((benefit: string) => (
                                            <li key={benefit} className="text-sm text-gray-600 flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                                {benefit}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                        <div className="bg-gray-50 px-8 py-4 border-t border-gray-100">
                            <p className="text-sm text-gray-500">
                                <span className="font-bold text-gray-900">{tier.count}</span> members in this tier
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-blue-600 rounded-2xl p-8 text-white">
                <div className="max-w-2xl">
                    <h2 className="text-xl font-bold mb-4">Automate your customer loyalty</h2>
                    <p className="text-blue-100 mb-6">
                        VIP tiers allow you to reward your most loyal customers with exclusive benefits and higher point earning rates.
                        Customers are automatically moved between tiers as they reach point milestones.
                    </p>
                    <button className="px-6 py-2 bg-white text-blue-600 rounded-lg font-bold hover:bg-blue-50 transition-colors">
                        Configure Tier Rules
                    </button>
                </div>
            </div>
        </div>
    );
}
