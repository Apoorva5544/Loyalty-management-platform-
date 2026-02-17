"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";

export default function LeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  useEffect(() => {
    fetchLeads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/api/admin/leads?page=${page}&limit=${limit}`);
      setLeads(res.data || []);
      setTotal(res.total || 0);
    } catch (error) {
      console.error("Failed to fetch leads", error);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leads (Anonymous Visitors)</h1>
          <p className="text-gray-500">
            These are LUIDs with activity but not yet identified as a customer.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 font-semibold text-gray-700">Anonymous ID (LUID)</th>
                <th className="px-6 py-3 font-semibold text-gray-700">Last Seen</th>
                <th className="px-6 py-3 font-semibold text-gray-700">Events</th>
                <th className="px-6 py-3 font-semibold text-gray-700">First-touch Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading leads...
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    No leads found.
                  </td>
                </tr>
              ) : (
                leads.map((lead) => {
                  const source = lead.source || {};
                  const sourceText =
                    source.utm_source || source.referrer
                      ? `utm_source=${source.utm_source || "N/A"}, utm_medium=${source.utm_medium || "N/A"
                      }, utm_campaign=${source.utm_campaign || "N/A"}`
                      : "Direct";
                  return (
                    <tr key={lead.anonymous_id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-mono text-xs text-gray-800" title={lead.anonymous_id}>
                          {lead.anonymous_id}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                        {new Date(lead.last_seen).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-gray-600">{lead.activity_count}</td>
                      <td className="px-6 py-4 text-gray-600 max-w-md truncate" title={sourceText}>
                        {sourceText}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} results
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
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

