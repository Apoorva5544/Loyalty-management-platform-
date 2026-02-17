"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/admin-sidebar";
import ProfilePopover from "@/components/profile-popover";
import { Settings } from "lucide-react";
import { apiClient } from "@/lib/api-client";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

    useEffect(() => {
        // Check if user has a token
        const token = apiClient.getToken();
        if (!token) {
            router.push("/login");
        } else {
            setIsAuthenticated(true);
        }
    }, [router]);

    if (isAuthenticated === null) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
                <div className="text-gray-500">Loading...</div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="flex min-h-screen bg-[#f8fafc]">
            <div className="flex-shrink-0">
                <AdminSidebar />
            </div>
            <div className="flex-1 flex flex-col">
                {/* Top Header */}
                <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-end px-8 gap-4">
                    <button
                        onClick={() => router.push('/admin/settings')}
                        className="p-2 text-gray-400 hover:text-gray-600"
                    >
                        <Settings className="h-5 w-5" />
                    </button>
                    <ProfilePopover />
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
