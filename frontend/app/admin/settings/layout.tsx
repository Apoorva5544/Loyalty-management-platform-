"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, Users, Mail, Plug, Code, Activity, Shield } from "lucide-react";

const settingsNav = [
    { name: "Company Details", href: "/admin/settings", icon: Building2 },
];

export default function SettingsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Settings Sidebar */}
            <div className="w-64 bg-white border-r border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Settings</h2>
                <nav className="space-y-1">
                    {settingsNav.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                                    ? "bg-gray-100 text-gray-900"
                                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                    }`}
                            >
                                <item.icon className="h-4 w-4" />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1">
                {children}
            </div>
        </div>
    );
}
