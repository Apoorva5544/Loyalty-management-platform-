"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import {
    TrendingUp,
    ShoppingBag,
    RefreshCcw,
    Coins,
    ChevronDown,
    Calendar
} from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    Cell
} from "recharts";

export default function PerformancePage() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [granularity, setGranularity] = useState("daily");
    const [activeChart, setActiveChart] = useState("points"); // "points" or "tasks"

    useEffect(() => {
        loadStats();
    }, [granularity]);

    const loadStats = async () => {
        try {
            const data = await apiClient.getPerformance({ granularity });
            setStats(data);
            setLoading(false);
        } catch (error) {
            console.error("Failed to load performance stats:", error);
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="p-8">Loading...</div>;
    }

    const metrics = [
        { label: "Revenue", value: `₹${stats?.revenue || 0}`, icon: TrendingUp, color: "bg-blue-600", textColor: "text-white" },
        { label: "Average Order Value", value: `₹${stats?.average_order_value || 0}`, icon: ShoppingBag, color: "bg-white", textColor: "text-gray-900" },
        { label: "Redemption Rate", value: `${stats?.redemption_rate || 0}%`, icon: RefreshCcw, color: "bg-white", textColor: "text-gray-900" },
        { label: "Points Earned", value: `${stats?.total_earned || 0}`, icon: Coins, color: "bg-white", textColor: "text-gray-900" },
    ];

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-8">Loyalty Program Performance</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {metrics.map((metric, i) => (
                    <div
                        key={metric.label}
                        className={`${metric.color} rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col items-center justify-center text-center relative`}
                    >
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${i === 0 ? "bg-white/20" : "bg-gray-50"}`}>
                            <metric.icon className={`h-6 w-6 ${i === 0 ? "text-white" : i === 1 ? "text-green-500" : i === 2 ? "text-purple-500" : "text-yellow-500"}`} />
                        </div>
                        <p className={`text-sm font-medium mb-1 ${metric.textColor === "text-white" ? "text-white/80" : "text-gray-500"}`}>
                            {metric.label}
                        </p>
                        <p className={`text-2xl font-bold ${metric.textColor}`}>
                            {metric.value}
                        </p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                {/* Top Performance */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 lg:col-span-1">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-lg font-bold text-gray-900">Top Performance</h2>
                    </div>

                    <div className="space-y-4">
                        {stats?.top_customers?.map((customer: any, i: number) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                                        {customer.email[0].toUpperCase()}
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="font-bold text-gray-900 truncate max-w-[120px]">{customer.email}</p>
                                        <p className="text-xs text-gray-500">Loyalty Member</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-blue-600">{customer.points}</p>
                                    <p className="text-[10px] text-gray-500 uppercase">Points</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Program Insights */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 lg:col-span-2">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <h2 className="text-lg font-bold text-gray-900">Program Insights</h2>
                            <div className="flex bg-gray-100 p-1 rounded-lg">
                                <button
                                    onClick={() => setActiveChart("points")}
                                    className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${activeChart === "points" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500"}`}
                                >
                                    Points
                                </button>
                                <button
                                    onClick={() => setActiveChart("tasks")}
                                    className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${activeChart === "tasks" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500"}`}
                                >
                                    Tasks
                                </button>
                            </div>
                        </div>
                        <div className="flex bg-gray-100 p-1 rounded-lg">
                            <button
                                onClick={() => setGranularity("daily")}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${granularity === "daily" ? "bg-green-500 text-white" : "text-gray-600"}`}
                            >
                                Daily
                            </button>
                            <button
                                onClick={() => setGranularity("monthly")}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${granularity === "monthly" ? "bg-green-500 text-white" : "text-gray-600"}`}
                            >
                                Monthly
                            </button>
                        </div>
                    </div>

                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            {activeChart === "points" ? (
                                <BarChart
                                    data={stats?.points_insights || []}
                                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                                    <Bar dataKey="earned" name="Points Earned" fill="#22c55e" radius={[4, 4, 0, 0]} barSize={20} />
                                    <Bar dataKey="redeemed" name="Points Redeemed" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} />
                                </BarChart>
                            ) : (
                                <BarChart
                                    data={stats?.task_insights || []}
                                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar dataKey="count" name="Tasks Completed" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={30} />
                                </BarChart>
                            )}
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
