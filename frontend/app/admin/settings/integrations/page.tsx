"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import { Copy, Check, Code, Globe, Plus, Store as StoreIcon, ExternalLink, Monitor } from "lucide-react";

export default function IntegrationsPage() {
    const [stores, setStores] = useState<any[]>([]);
    const [selectedStore, setSelectedStore] = useState<any>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newStoreName, setNewStoreName] = useState("");
    const [newStoreUrl, setNewStoreUrl] = useState("");
    const [loading, setLoading] = useState(true);
    const [copiedTracking, setCopiedTracking] = useState(false);
    const [copiedOptIn, setCopiedOptIn] = useState(false);

    useEffect(() => {
        loadStores();
    }, []);

    const loadStores = async () => {
        try {
            const data = await apiClient.getStores();
            setStores(data.stores);
            if (data.stores.length > 0) {
                setSelectedStore(data.stores[0]);
            }
            setLoading(false);
        } catch (error) {
            console.error("Failed to load stores", error);
            setLoading(false);
        }
    };

    const handleAddStore = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const newStore = await apiClient.createStore({
                name: newStoreName,
                url: newStoreUrl
            });
            setStores([...stores, newStore]);
            setSelectedStore(newStore);
            setShowAddModal(false);
            setNewStoreName("");
            setNewStoreUrl("");
        } catch (error) {
            alert("Failed to create store");
        }
    };

    const trackingScript = selectedStore ? `
<script type="text/javascript">
  var thriveWidgetCode = '${selectedStore.id}';
  var ztUserData = {};
</script>
<script id="thrive_script" src="http://localhost:8000/static/widget.js" data-store-id="${selectedStore.id}" data-api-url="http://localhost:8000"></script>
    `.trim() : "Select a store to view script...";

    const optInScript = `
<script type="text/javascript">
  var ztUserData = {};
  ztUserData['za_email_id'] = '{{Email Address of Customer}}';
  ztUserData['user_unique_id'] = '{{Unique Identifiable System ID}}';
  ztUserData['phone'] = '{{Phone Number}}'; // Optional but recommended
  ztUserData['dob'] = '{{Date of Birth YYYY-MM-DD}}'; // Optional but recommended
  
  // Identify user to the loyalty platform
  if (window.Thrive) {
    window.Thrive.identify(ztUserData);
  }
</script>
    `.trim();

    const copyTracking = () => {
        navigator.clipboard.writeText(trackingScript);
        setCopiedTracking(true);
        setTimeout(() => setCopiedTracking(false), 2000);
    };

    const copyOptIn = () => {
        navigator.clipboard.writeText(optInScript);
        setCopiedOptIn(true);
        setTimeout(() => setCopiedOptIn(false), 2000);
    };

    if (loading) return <div className="p-8">Loading...</div>;

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Store Management</h1>
                    <p className="text-gray-500">Manage your websites and get unique tracking scripts for each.</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors"
                >
                    <Plus className="h-5 w-5" />
                    Add Website
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Store List */}
                <div className="lg:col-span-1 space-y-4">
                    <h3 className="font-bold text-gray-700 uppercase text-xs tracking-wider mb-2">Your Websites</h3>
                    {stores.map(store => (
                        <button
                            key={store.id}
                            onClick={() => setSelectedStore(store)}
                            className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center gap-3 ${selectedStore?.id === store.id ? "border-blue-600 bg-blue-50/50 ring-2 ring-blue-50" : "border-gray-100 bg-white hover:border-gray-200"}`}
                        >
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${selectedStore?.id === store.id ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500"}`}>
                                <Monitor className="h-5 w-5" />
                            </div>
                            <div className="overflow-hidden">
                                <h4 className={`font-bold truncate ${selectedStore?.id === store.id ? "text-blue-900" : "text-gray-900"}`}>{store.name}</h4>
                                <p className="text-xs text-gray-500 truncate">{store.company_url || "No URL"}</p>
                            </div>
                        </button>
                    ))}

                    {stores.length === 0 && (
                        <div className="text-center p-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                            <p className="text-gray-500 text-sm">No websites added yet.</p>
                        </div>
                    )}
                </div>

                {/* Script Details */}
                <div className="lg:col-span-2">
                    {selectedStore ? (
                        <div className="space-y-8">
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                <div className="p-6 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                                            <Code className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h2 className="font-bold text-gray-900">Tracking Script for {selectedStore.name}</h2>
                                            <p className="text-xs text-gray-500">Embed this unique code on <strong>{selectedStore.company_url}</strong></p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={copyTracking}
                                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                                    >
                                        {copiedTracking ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                        {copiedTracking ? "Copied" : "Copy"}
                                    </button>
                                </div>
                                <div className="p-6">
                                    <pre className="bg-gray-900 text-gray-100 p-6 rounded-xl text-sm overflow-x-auto font-mono leading-relaxed">
                                        {trackingScript}
                                    </pre>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                <div className="p-6 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
                                            <Globe className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h2 className="font-bold text-gray-900">Member Identification Script</h2>
                                            <p className="text-xs text-gray-500">Use this to identify logged-in users across all your websites.</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={copyOptIn}
                                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                                    >
                                        {copiedOptIn ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                        {copiedOptIn ? "Copied" : "Copy"}
                                    </button>
                                </div>
                                <div className="p-6">
                                    <pre className="bg-gray-900 text-gray-100 p-6 rounded-xl text-sm overflow-x-auto font-mono leading-relaxed">
                                        {optInScript}
                                    </pre>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex items-center justify-center bg-gray-50 rounded-2xl border border-dashed border-gray-200 p-12 text-center">
                            <div>
                                <StoreIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-bold text-gray-900">Select a Website</h3>
                                <p className="text-gray-500">Select a website from the list to view its integration details.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Add Store Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Add New Website</h2>
                        <form onSubmit={handleAddStore}>
                            <div className="space-y-4 mb-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Website Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={newStoreName}
                                        onChange={e => setNewStoreName(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="e.g. My Fashion Store"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Website URL</label>
                                    <input
                                        type="url"
                                        required
                                        value={newStoreUrl}
                                        onChange={e => setNewStoreUrl(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="https://example.com"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Add Website
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
