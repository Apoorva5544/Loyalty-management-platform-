"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import {
    Type,
    Bold,
    Italic,
    Underline,
    Palette,
    Link2,
    AlignLeft,
    ChevronDown,
    Loader2,
    Save,
    Eye
} from "lucide-react";

export default function NotificationsPage() {
    const [activeTemplate, setActiveTemplate] = useState("welcome");
    const [settings, setSettings] = useState<any>(null);
    const [templates, setTemplates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [previewData, setPreviewData] = useState<any>(null);
    const [previewLoading, setPreviewLoading] = useState(false);

    // Editor state
    const [subject, setSubject] = useState("");
    const [content, setContent] = useState("");
    const [fromEmail, setFromEmail] = useState("noreply@notification.loyaltyplatform.in");

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (templates.length > 0) {
            const template = templates.find(t => t.template_type === activeTemplate);
            if (template) {
                setSubject(template.subject);
                setContent(template.content);
                setFromEmail(template.from_email);
            }
        }
    }, [activeTemplate, templates]);

    const loadData = async () => {
        try {
            const [settingsData, templatesData] = await Promise.all([
                apiClient.getNotificationSettings(),
                apiClient.getEmailTemplates()
            ]);
            setSettings(settingsData);
            setTemplates(templatesData);
            setLoading(false);
        } catch (error) {
            console.error("Failed to load notification data", error);
            setLoading(false);
        }
    };

    const handleToggle = async (type: string, enabled: boolean) => {
        // Optimistic update
        const newSettings = { ...settings, [`${type}_enabled`]: enabled };
        setSettings(newSettings);

        try {
            await apiClient.updateNotificationSettings({ [`${type}_enabled`]: enabled });
        } catch (error) {
            console.error("Failed to update settings", error);
            // Revert on failure
            setSettings(settings);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const updatedTemplate = await apiClient.updateEmailTemplate(activeTemplate, {
                template_type: activeTemplate,
                subject,
                content,
                from_email: fromEmail,
                enabled: true
            });

            // Update local state
            setTemplates(templates.map(t =>
                t.template_type === activeTemplate ? updatedTemplate : t
            ));

            alert("Template saved successfully!");
        } catch (error) {
            console.error("Failed to save template", error);
            alert("Failed to save template");
        } finally {
            setSaving(false);
        }
    };

    const handlePreview = async () => {
        setPreviewLoading(true);
        try {
            const preview = await apiClient.previewEmailTemplate({
                template_type: activeTemplate,
                subject,
                content,
                from_email: fromEmail
            });
            setPreviewData(preview);
            setShowPreview(true);
        } catch (error) {
            console.error("Failed to generate preview", error);
            alert("Failed to generate preview");
        } finally {
            setPreviewLoading(false);
        }
    };

    const getTemplateName = (type: string) => {
        switch (type) {
            case "welcome": return "Customer Welcome";
            case "reward": return "Reward Earned";
            case "birthday": return "Birthday Reward";
            case "anniversary": return "Anniversary Reward";
            case "invite": return "Invite Non-Members";
            default: return type;
        }
    };

    const getTemplateDesc = (type: string) => {
        switch (type) {
            case "welcome": return "Send a welcome email to your customers upon successful opt-in to the program.";
            case "reward": return "Send your customers their reward details via email when they redeem/earn one";
            case "birthday": return "Send your customers a birthday surprise with bonus loyalty points to make their day extra special.";
            case "anniversary": return "Send warm wishes and bonus loyalty points to celebrate your customer's wedding anniversary.";
            case "invite": return "Send an invitation email to all customers who haven't joined the loyalty program yet.";
            default: return "";
        }
    };

    const handleSendInvites = async () => {
        if (!confirm("Send invitation emails to all non-members?")) return;
        setSaving(true);
        try {
            const res = await apiClient.notifyNonMembers();
            alert(res.message);
        } catch (error) {
            alert("Failed to send invitations.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="h-[calc(100vh-64px)] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col">
            {/* Header */}
            <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8">
                <h1 className="text-lg font-bold text-gray-900">Notifications</h1>
                <div className="flex gap-4">
                    <button 
                        onClick={handlePreview}
                        disabled={previewLoading}
                        className="px-6 py-2 bg-gray-50 text-gray-600 rounded-lg font-medium border border-gray-200 flex items-center gap-2 hover:bg-gray-100 transition-colors disabled:opacity-50"
                    >
                        {previewLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                        Preview
                    </button>
                    {activeTemplate === "invite" && (
                        <button
                            onClick={handleSendInvites}
                            disabled={saving}
                            className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Palette className="w-4 h-4" />}
                            Send Invites
                        </button>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save
                    </button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar */}
                <div className="w-80 bg-white border-r border-gray-200 flex flex-col overflow-y-auto">
                    <div className="p-4 border-b border-gray-100">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Customer Emails</h3>
                    </div>
                    <div className="flex-1">
                        {["welcome", "reward", "birthday", "anniversary"].map((type) => (
                            <div
                                key={type}
                                onClick={() => setActiveTemplate(type)}
                                className={`w-full text-left p-6 border-l-4 transition-all cursor-pointer ${activeTemplate === type
                                    ? "bg-blue-50/50 border-green-500"
                                    : "border-transparent hover:bg-gray-50"
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-bold text-gray-900 text-sm">{getTemplateName(type)}</span>
                                    <div
                                        className={`w-10 h-5 rounded-full relative transition-colors cursor-pointer ${settings[`${type}_enabled`] ? 'bg-green-500' : 'bg-gray-300'}`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleToggle(type, !settings[`${type}_enabled`]);
                                        }}
                                    >
                                        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${settings[`${type}_enabled`] ? 'right-0.5' : 'left-0.5'}`}></div>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 leading-relaxed">{getTemplateDesc(type)}</p>
                            </div>
                        ))}

                        <div className="p-4 border-b border-t border-gray-100 bg-gray-50/50">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Campaigns</h3>
                        </div>
                        {["invite"].map((type) => (
                            <div
                                key={type}
                                onClick={() => setActiveTemplate(type)}
                                className={`w-full text-left p-6 border-l-4 transition-all cursor-pointer ${activeTemplate === type
                                    ? "bg-blue-50/50 border-green-500"
                                    : "border-transparent hover:bg-gray-50"
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-bold text-gray-900 text-sm">{getTemplateName(type)}</span>
                                    <div
                                        className={`w-10 h-5 rounded-full relative transition-colors cursor-pointer ${settings[`${type}_enabled`] ? 'bg-green-500' : 'bg-gray-300'}`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleToggle(type, !settings[`${type}_enabled`]);
                                        }}
                                    >
                                        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${settings[`${type}_enabled`] ? 'right-0.5' : 'left-0.5'}`}></div>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 leading-relaxed">{getTemplateDesc(type)}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Editor Area */}
                <div className="flex-1 bg-white p-12 overflow-y-auto">
                    <div className="max-w-3xl mx-auto space-y-8">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-sm">
                                <span className="font-bold text-gray-900 w-20">From :</span>
                                <input
                                    type="text"
                                    value={fromEmail}
                                    onChange={(e) => setFromEmail(e.target.value)}
                                    className="flex-1 border-none focus:ring-0 text-gray-600 p-0"
                                />
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <span className="font-bold text-gray-900 w-20">Subject :</span>
                                <input
                                    type="text"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    className="flex-1 border border-gray-200 rounded px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Toolbar */}
                        <div className="flex items-center gap-1 p-2 bg-gray-50 rounded-lg border border-gray-200">
                            <button className="p-2 text-gray-600 hover:bg-white rounded"><Bold className="h-4 w-4" /></button>
                            <button className="p-2 text-gray-600 hover:bg-white rounded"><Italic className="h-4 w-4" /></button>
                            <button className="p-2 text-gray-600 hover:bg-white rounded"><Underline className="h-4 w-4" /></button>
                            <div className="w-px h-4 bg-gray-300 mx-2"></div>
                            <button className="p-2 text-gray-600 hover:bg-white rounded"><Link2 className="h-4 w-4" /></button>
                            <button className="p-2 text-gray-600 hover:bg-white rounded"><AlignLeft className="h-4 w-4" /></button>
                            <div className="w-px h-4 bg-gray-300 mx-2"></div>
                            <div className="relative group">
                                <button className="px-3 py-1 text-xs font-bold text-gray-600 hover:bg-white rounded border border-transparent hover:border-gray-200">
                                    Merge Tags
                                </button>
                                <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-100 hidden group-hover:block z-10">
                                    <div className="p-2 text-xs text-gray-500">
                                        <div className="p-2 hover:bg-gray-50 cursor-pointer" onClick={() => setContent(c => c + "{{MEMBER_FIRST_NAME}}")}>Member Name</div>
                                        <div className="p-2 hover:bg-gray-50 cursor-pointer" onClick={() => setContent(c => c + "{{COMPANY_NAME}}")}>Company Name</div>
                                        <div className="p-2 hover:bg-gray-50 cursor-pointer" onClick={() => setContent(c => c + "{{REWARD_NAME}}")}>Reward Name</div>
                                        <div className="p-2 hover:bg-gray-50 cursor-pointer" onClick={() => setContent(c => c + "{{POINTS_BALANCE}}")}>Points Balance</div>
                                        <div className="p-2 hover:bg-gray-50 cursor-pointer" onClick={() => setContent(c => c + "{{BONUS_POINTS}}")}>Bonus Points</div>
                                        <div className="p-2 hover:bg-gray-50 cursor-pointer" onClick={() => setContent(c => c + "{{JOIN_LINK}}")}>Join Link</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Content Area */}
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="w-full h-[400px] p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm leading-relaxed resize-none"
                        />
                    </div>
                </div>
            </div>

            {/* Preview Modal */}
            {showPreview && previewData && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <h2 className="text-xl font-bold text-gray-900">Email Preview</h2>
                            <button
                                onClick={() => setShowPreview(false)}
                                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                            >
                                ×
                            </button>
                        </div>
                        <div className="flex-1 overflow-auto">
                            <iframe
                                srcDoc={previewData.preview_html}
                                className="w-full h-full min-h-[500px]"
                                title="Email Preview"
                            />
                        </div>
                        <div className="p-6 border-t border-gray-200 bg-gray-50">
                            <div className="text-sm text-gray-600">
                                <p><strong>Subject:</strong> {previewData.subject}</p>
                                <p><strong>From:</strong> {previewData.from_email}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
