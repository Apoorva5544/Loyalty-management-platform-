"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import { Search, FolderOpen, Plus, Bell, X, Loader2 } from "lucide-react";

export default function CustomersPage() {
    const [customers, setCustomers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [notifying, setNotifying] = useState(false);
    const [formData, setFormData] = useState({
        email: "",
        phone_number: "",
        name: "",
        dob: ""
    });

    useEffect(() => {
        loadCustomers();
    }, []);

    const loadCustomers = async () => {
        try {
            const data = await apiClient.getCustomers();
            setCustomers(data.customers || []);
            setLoading(false);
        } catch (error) {
            console.error("Failed to load customers:", error);
            setLoading(false);
        }
    };

    const handleCreateCustomer = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await apiClient.createCustomer(formData);
            setShowAddModal(false);
            setFormData({
                email: "", phone_number: "", name: "", dob: ""
            });
            loadCustomers();
        } catch (error) {
            alert("Failed to create customer. Email might already exist.");
        }
    };


    if (loading) {
        return <div className="p-8">Loading...</div>;
    }

    return (
        <div className="p-8 max-w-[1600px] mx-auto">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        Add Member
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 min-h-[600px] overflow-hidden">
                <div className="mb-8">
                    <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by Email Address"
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                    </div>
                </div>

                <div className="w-full overflow-x-auto">
                    <table className="w-full min-w-[1100px] table-fixed">
                        <thead>
                            <tr className="text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                                <th className="w-[100px] px-3 py-3 text-left">Status</th>
                                <th className="px-3 py-3 text-left">Name</th>
                                <th className="px-3 py-3 text-left bg-blue-50/30">Email</th>
                                <th className="px-3 py-3 text-left bg-blue-50/30">Phone</th>
                                <th className="px-3 py-3 text-left bg-blue-50/30">DOB</th>
                                <th className="w-[100px] px-3 py-3 text-left">Joined</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {customers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-24 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="relative mb-6">
                                                <div className="w-24 h-20 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center">
                                                    <FolderOpen className="h-10 w-10 text-gray-200" />
                                                </div>
                                            </div>
                                            <p className="text-gray-400 text-sm font-medium">No customers found</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                customers.map((customer) => {
                                    const isFullyRegistered = customer.email && customer.phone_number && customer.dob;
                                    return (
                                        <tr key={customer.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-3 py-3">
                                                <div className="flex flex-col gap-1">
                                                    <span className={`inline-flex w-fit items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${isFullyRegistered ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                                                        {isFullyRegistered ? "Member" : "Lead"}
                                                    </span>
                                                    <span className="text-[9px] text-gray-400 uppercase font-bold">
                                                        {customer.role}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-3 py-3">
                                                <span className="font-bold text-gray-900 text-xs truncate block">
                                                    {customer.name || (isFullyRegistered ? "Member" : "Lead")}
                                                </span>
                                            </td>
                                            <td className="px-3 py-3 bg-blue-50/5">
                                                <span className="text-[10px] text-gray-600 truncate block">
                                                    {customer.email || "-"}
                                                </span>
                                            </td>
                                            <td className="px-3 py-3 bg-blue-50/5">
                                                <span className="text-[10px] text-gray-600 truncate block">
                                                    {customer.phone_number || "-"}
                                                </span>
                                            </td>
                                            <td className="px-3 py-3 bg-blue-50/5">
                                                <span className="text-[10px] text-gray-600 truncate block">
                                                    {customer.dob || "-"}
                                                </span>
                                            </td>
                                            <td className="px-3 py-3 text-[10px] text-gray-500 font-medium">
                                                {new Date(customer.created_at).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Member Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white">
                            <h2 className="text-xl font-bold text-gray-900">Add New Member</h2>
                            <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateCustomer} className="p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Basic Information</h3>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                    <input type="text" className="w-full p-2 border rounded-lg" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input type="email" className="w-full p-2 border rounded-lg" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                    <input type="text" className="w-full p-2 border rounded-lg" value={formData.phone_number} onChange={e => setFormData({ ...formData, phone_number: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                                    <input type="date" className="w-full p-2 border rounded-lg" value={formData.dob} onChange={e => setFormData({ ...formData, dob: e.target.value })} />
                                </div>

                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Create Member</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
