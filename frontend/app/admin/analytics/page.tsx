"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import { Loader2, ArrowLeft, ArrowRight } from "lucide-react";

export default function AnalyticsPage() {
    const [activities, setActivities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 20;

    useEffect(() => {
        fetchActivities();
    }, [page]);

    const fetchActivities = async () => {
        setLoading(true);
        try {
            const res = await apiClient.get(`/api/admin/activities?page=${page}&limit=${limit}`);
            setActivities(res.data);
            setTotal(res.total);
        } catch (error) {
            console.error("Failed to fetch activities", error);
        } finally {
            setLoading(false);
        }
    };

    const totalPages = Math.ceil(total / limit);

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
                    <p className="text-gray-500">Track user activities and traffic sources.</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 font-semibold text-gray-700">Date</th>
                                <th className="px-6 py-3 font-semibold text-gray-700">User</th>
                                <th className="px-6 py-3 font-semibold text-gray-700">Event</th>
                                <th className="px-6 py-3 font-semibold text-gray-700">Source / Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                                        Loading data...
                                    </td>
                                </tr>
                            ) : activities.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                        No activities found.
                                    </td>
                                </tr>
                            ) : (
                                activities.map((activity) => {
                                    let sourceInfo = "Direct";
                                    try {
                                        if (activity.data) {
                                            const data = JSON.parse(activity.data);
                                            if (data.source) {
                                                sourceInfo = `Source: ${data.source.utm_source || 'N/A'} | Medium: ${data.source.utm_medium || 'N/A'}`;
                                            } else if (data.url) {
                                                sourceInfo = `Page: ${new URL(data.url).pathname}`;
                                            }
                                        }
                                    } catch (e) { }

                                    return (
                                        <tr key={activity.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                                                {new Date(activity.created_at).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900">{activity.user}</div>
                                                {activity.anonymous_id && (
                                                    <div className="text-xs text-gray-400 font-mono mt-0.5" title="Anonymous ID">
                                                        {activity.anonymous_id.substring(0, 12)}...
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${activity.type === 'PURCHASE' ? 'bg-green-100 text-green-800' :
                                                    activity.type === 'SIGNUP' ? 'bg-blue-100 text-blue-800' :
                                                        activity.type === 'PAGE_VIEW' ? 'bg-gray-100 text-gray-800' :
                                                            'bg-purple-100 text-purple-800'
                                                    }`}>
                                                    {activity.type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600 max-w-xs truncate" title={sourceInfo}>
                                                {sourceInfo}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                        Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} results
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1 || loading}
                            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages || loading}
                            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
