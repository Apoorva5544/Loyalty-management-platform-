"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import {
    Type,
    Palette,
    Move,
    ChevronRight,
    X,
    Plus,
    Save,
    MessageSquare
} from "lucide-react";

export default function WidgetPage() {
    const [activeTab, setActiveTab] = useState("Text");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [stores, setStores] = useState<any[]>([]);
    const [selectedStore, setSelectedStore] = useState<string>("");
    const [settings, setSettings] = useState({
        header_title: "Test Loyalty Program",
        header_subtitle: "Welcome to",
        join_button_text: "Join Now",
        guest_welcome_msg: "Join our loyalty program to earn points and unlock exclusive rewards.",
        member_welcome_msg: "Available Balance",

        primary_color: "#5c7cfa",
        text_color: "#ffffff",
        button_color: "#5c7cfa",
        button_text_color: "#ffffff",

        launcher_color: "#5c7cfa",
        panel_bg_color: "#ffffff",
        panel_text_color: "#333333",

        tab_active_color: "#5c7cfa",
        tab_inactive_color: "#999999",

        position: "right",
        side_padding: 20,
        bottom_padding: 20
    });

    useEffect(() => {
        loadStores();
    }, []);

    useEffect(() => {
        if (selectedStore) {
            loadSettings(selectedStore);
        }
    }, [selectedStore]);

    const loadStores = async () => {
        try {
            const data = await apiClient.getStores();
            if (data.stores && data.stores.length > 0) {
                setStores(data.stores);
                setSelectedStore(data.stores[0].id);
            }
        } catch (error) {
            console.error("Failed to load stores:", error);
        }
    };

    const loadSettings = async (storeId: string) => {
        setLoading(true);
        try {
            const data = await apiClient.getWidgetSettings(storeId);
            setSettings(data);
        } catch (error) {
            console.error("Failed to load widget settings:", error);
            // If 404, we might want to reset to defaults, but for now keep defaults
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await apiClient.updateWidgetSettings({ ...settings, store_id: selectedStore });
            alert("Settings saved successfully!");
        } catch (error) {
            alert("Failed to save settings");
        } finally {
            setSaving(false);
        }
    };

    const menuItems = [
        { name: "Text", icon: Type },
        { name: "Theme", icon: Palette },
        { name: "Placement", icon: Move },
    ];

    if (loading && !settings) return <div className="p-8">Loading...</div>;

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col">
            {/* Header */}
            <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8">
                <div className="flex items-center gap-4">
                    <h1 className="text-lg font-bold text-gray-900">Widget Builder</h1>
                    <div className="h-6 w-px bg-gray-200"></div>
                    <select
                        value={selectedStore}
                        onChange={(e) => setSelectedStore(e.target.value)}
                        className="text-sm border-gray-200 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    >
                        {stores.map(store => (
                            <option key={store.id} value={store.id}>{store.name}</option>
                        ))}
                    </select>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className={`flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    <Save className="h-4 w-4" />
                    {saving ? "Saving..." : "Save Changes"}
                </button>
            </div>

            <div className="flex-1 flex">
                {/* Sidebar */}
                <div className="w-80 bg-white border-r border-gray-200 flex flex-col overflow-hidden">
                    <div className="p-4 space-y-2">
                        {menuItems.map((item) => (
                            <button
                                key={item.name}
                                onClick={() => setActiveTab(item.name)}
                                className={`w-full flex items-center justify-between p-4 rounded-xl transition-all ${activeTab === item.name
                                    ? "bg-blue-50 text-blue-600"
                                    : "text-gray-600 hover:bg-gray-50"
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <item.icon className="h-5 w-5" />
                                    <span className="font-medium">{item.name}</span>
                                </div>
                                <ChevronRight className="h-4 w-4 opacity-50" />
                            </button>
                        ))}
                    </div>

                    <div className="flex-1 p-6 border-t border-gray-100 overflow-y-auto">
                        {activeTab === "Text" && (
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Header Title</label>
                                    <input
                                        type="text"
                                        value={settings.header_title}
                                        onChange={(e) => setSettings({ ...settings, header_title: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Header Subtitle</label>
                                    <input
                                        type="text"
                                        value={settings.header_subtitle}
                                        onChange={(e) => setSettings({ ...settings, header_subtitle: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Join Button Text</label>
                                    <input
                                        type="text"
                                        value={settings.join_button_text}
                                        onChange={(e) => setSettings({ ...settings, join_button_text: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Guest Welcome Message</label>
                                    <textarea
                                        value={settings.guest_welcome_msg}
                                        onChange={(e) => setSettings({ ...settings, guest_welcome_msg: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 h-24"
                                    />
                                </div>
                            </div>
                        )}

                        {activeTab === "Theme" && (
                            <div className="space-y-6">
                                <h3 className="font-bold text-gray-900">Main Colors</h3>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Primary Color (Header)</label>
                                    <div className="flex gap-3">
                                        <input
                                            type="color"
                                            value={settings.primary_color}
                                            onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
                                            className="h-10 w-10 border-none rounded cursor-pointer"
                                        />
                                        <input
                                            type="text"
                                            value={settings.primary_color}
                                            onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
                                            className="flex-1 px-4 py-2 border rounded-lg"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Header Text Color</label>
                                    <div className="flex gap-3">
                                        <input
                                            type="color"
                                            value={settings.text_color}
                                            onChange={(e) => setSettings({ ...settings, text_color: e.target.value })}
                                            className="h-10 w-10 border-none rounded cursor-pointer"
                                        />
                                        <input
                                            type="text"
                                            value={settings.text_color}
                                            onChange={(e) => setSettings({ ...settings, text_color: e.target.value })}
                                            className="flex-1 px-4 py-2 border rounded-lg"
                                        />
                                    </div>
                                </div>

                                <h3 className="font-bold text-gray-900 pt-4 border-t">Buttons & Launcher</h3>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Button & Launcher Color</label>
                                    <div className="flex gap-3">
                                        <input
                                            type="color"
                                            value={settings.button_color}
                                            onChange={(e) => setSettings({ ...settings, button_color: e.target.value, launcher_color: e.target.value })}
                                            className="h-10 w-10 border-none rounded cursor-pointer"
                                        />
                                        <input
                                            type="text"
                                            value={settings.button_color}
                                            onChange={(e) => setSettings({ ...settings, button_color: e.target.value, launcher_color: e.target.value })}
                                            className="flex-1 px-4 py-2 border rounded-lg"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Button Text Color</label>
                                    <div className="flex gap-3">
                                        <input
                                            type="color"
                                            value={settings.button_text_color}
                                            onChange={(e) => setSettings({ ...settings, button_text_color: e.target.value })}
                                            className="h-10 w-10 border-none rounded cursor-pointer"
                                        />
                                        <input
                                            type="text"
                                            value={settings.button_text_color}
                                            onChange={(e) => setSettings({ ...settings, button_text_color: e.target.value })}
                                            className="flex-1 px-4 py-2 border rounded-lg"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "Placement" && (
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Position</label>
                                    <select
                                        value={settings.position}
                                        onChange={(e) => setSettings({ ...settings, position: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg"
                                    >
                                        <option value="left">Left</option>
                                        <option value="right">Right</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Side Padding (px)</label>
                                    <input
                                        type="number"
                                        value={settings.side_padding}
                                        onChange={(e) => setSettings({ ...settings, side_padding: parseInt(e.target.value) })}
                                        className="w-full px-4 py-2 border rounded-lg"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Bottom Padding (px)</label>
                                    <input
                                        type="number"
                                        value={settings.bottom_padding}
                                        onChange={(e) => setSettings({ ...settings, bottom_padding: parseInt(e.target.value) })}
                                        className="w-full px-4 py-2 border rounded-lg"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Preview Area */}
                <div className="flex-1 bg-[#f1f5f9] relative flex items-center justify-center overflow-hidden">
                    {/* Grid Background */}
                    <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

                    {/* Widget Preview Card */}
                    <div className="w-[380px] bg-white rounded-3xl shadow-2xl overflow-hidden relative z-10 animate-in fade-in zoom-in duration-500" style={{ backgroundColor: settings.panel_bg_color }}>
                        {/* Header */}
                        <div className="p-8 relative" style={{ backgroundColor: settings.primary_color, color: settings.text_color }}>
                            <p className="text-sm opacity-80 mb-1">{settings.header_subtitle}</p>
                            <h2 className="text-2xl font-bold">{settings.header_title}</h2>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-4 -mt-4">
                            {/* Join Card */}
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
                                <h3 className="font-bold text-gray-900 mb-2">Become a Member</h3>
                                <p className="text-sm text-gray-500 mb-6">
                                    {settings.guest_welcome_msg}
                                </p>
                                <div className="space-y-2 mb-4">
                                    <div className="h-10 bg-gray-50 rounded-lg border border-gray-200 w-full"></div>
                                    <div className="h-10 bg-gray-50 rounded-lg border border-gray-200 w-full"></div>
                                </div>
                                <button
                                    className="w-full py-3 rounded-xl font-bold text-sm shadow-lg"
                                    style={{ backgroundColor: settings.button_color, color: settings.button_text_color }}
                                >
                                    {settings.join_button_text}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Floating Toggle Button */}
                    <div className="absolute transition-all duration-300" style={{
                        bottom: `${settings.bottom_padding}px`,
                        [settings.position]: `${settings.side_padding}px`
                    }}>
                        <button
                            className="w-14 h-14 rounded-full shadow-xl flex items-center justify-center text-white transition-transform hover:scale-110"
                            style={{ backgroundColor: settings.launcher_color || settings.button_color }}
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
