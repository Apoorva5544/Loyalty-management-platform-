"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from "recharts";
import {
    Users,
    Coins,
    ShoppingBag,
    TrendingUp,
    ArrowUpRight,
    ArrowDownRight
} from "lucide-react";

export default function AdminPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await apiClient.get("/api/admin/performance");
                setData(res);
            } catch (error) {
                console.error("Failed to fetch performance data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading dashboard...</div>;
    }

    if (!data) {
        return <div className="p-8 text-center text-red-500">Failed to load data</div>;
    }

    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-gray-500 mt-1">Overview of your loyalty program performance</p>
                </div>
                <div className="flex gap-2">
                    <select className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm">
                        <option>Last 30 Days</option>
                        <option>Last 7 Days</option>
                        <option>Today</option>
                    </select>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Revenue"
                    value={`₹${data.revenue.toLocaleString()}`}
                    icon={ShoppingBag}
                    trend="+12.5%"
                    trendUp={true}
                    color="blue"
                />
                <StatCard
                    title="Points Issued"
                    value={data.total_earned.toLocaleString()}
                    icon={Coins}
                    trend="+8.2%"
                    trendUp={true}
                    color="yellow"
                />
                <StatCard
                    title="Redemption Rate"
                    value={`${data.redemption_rate}%`}
                    icon={TrendingUp}
                    trend="-2.1%"
                    trendUp={false}
                    color="green"
                />
                <StatCard
                    title="Active Members"
                    value={data.top_customers.length.toString()} // Using top customers length as proxy for now or add total count to API
                    icon={Users}
                    trend="+5"
                    trendUp={true}
                    color="purple"
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Points Activity Chart */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 mb-6">Points Activity</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.points_insights}>
                                <defs>
                                    <linearGradient id="colorEarned" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorRedeemed" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#EF4444" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                />
                                <Area type="monotone" dataKey="earned" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorEarned)" name="Earned" />
                                <Area type="monotone" dataKey="redeemed" stroke="#EF4444" strokeWidth={2} fillOpacity={1} fill="url(#colorRedeemed)" name="Redeemed" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top Customers */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 mb-6">Top Customers</h3>
                    <div className="space-y-4">
                        {data.top_customers.map((customer: any, i: number) => (
                            <div key={i} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-500">
                                        {customer.email[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">{customer.email}</p>
                                        <p className="text-xs text-gray-500">Member since 2024</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-gray-900">{customer.points.toLocaleString()}</p>
                                    <p className="text-xs text-gray-500">points</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon: Icon, trend, trendUp, color }: any) {
    const colors: any = {
        blue: "bg-blue-50 text-blue-600",
        green: "bg-green-50 text-green-600",
        yellow: "bg-yellow-50 text-yellow-600",
        purple: "bg-purple-50 text-purple-600",
    };

    return (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-lg ${colors[color]}`}>
                    <Icon className="w-6 h-6" />
                </div>
                <div className={`flex items-center gap-1 text-sm font-medium ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
                    {trendUp ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    {trend}
                </div>
            </div>
            <h3 className="text-gray-500 text-sm font-medium mb-1">{title}</h3>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
    );
}
