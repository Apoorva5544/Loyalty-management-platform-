"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    Coins,
    Crown,
    Layout,
    Bell,
    Settings,
    Users,
    Star,
    MessageSquare,
    BarChart3,
    ShoppingBag,
    Globe,
    LogOut
} from "lucide-react";

const menuItems = [
    {
        section: "PROGRAM",
        items: [
            { name: "Points", href: "/admin/points", icon: Coins },
            { name: "VIP", href: "/admin/vip", icon: Crown },
        ],
    },
    {
        section: "CONFIGURATION",
        items: [
            { name: "Widget", href: "/admin/widget", icon: Layout },
            { name: "Notifications", href: "/admin/notifications", icon: Bell },
            { name: "Integrations", href: "/admin/settings/integrations", icon: Globe },
            { name: "Program Settings", href: "/admin/settings", icon: Settings },
        ],
    },
    {
        section: "OVERVIEW",
        items: [
            { name: "Customers", href: "/admin/customers", icon: Users },
            { name: "Leads", href: "/admin/leads", icon: Users },
            { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
            { name: "Reviews", href: "/admin/reviews", icon: Star },
            { name: "Testimonials", href: "/admin/testimonials", icon: MessageSquare },
            { name: "Performance", href: "/admin/performance", icon: BarChart3 },
            { name: "Purchases", href: "/admin/purchases", icon: ShoppingBag },
        ],
    },
];

export default function AdminSidebar() {
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = () => {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_logged_in');
        router.push('/login');
    };

    return (
        <div className="w-64 bg-[#1e293b] text-white h-screen sticky top-0 flex flex-col overflow-y-auto">
            <div className="p-6 flex-1">
                <div className="flex items-center gap-2 mb-8">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold">
                        LP
                    </div>
                    <span className="text-xl font-bold tracking-tight">Loyalty Platform</span>
                </div>

                <nav className="space-y-8">
                    {menuItems.map((section) => (
                        <div key={section.section}>
                            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-2">
                                {section.section}
                            </h3>
                            <div className="space-y-1">
                                {section.items.map((item) => {
                                    const isActive = pathname === item.href;
                                    return (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${isActive
                                                ? "bg-blue-600/20 text-blue-400 border-l-4 border-blue-600 rounded-l-none"
                                                : "text-gray-300 hover:bg-white/5 hover:text-white"
                                                }`}
                                        >
                                            <item.icon className={`h-4 w-4 ${isActive ? "text-blue-400" : "text-gray-400"}`} />
                                            {item.name}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>
            </div>

            {/* Logout Button Removed - Moved to Profile Popover */}
        </div>
    );
}
