"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, LogOut, BookOpen, HelpCircle, FileText, ChevronDown, Copy } from "lucide-react";
import { apiClient } from "@/lib/api-client";

export default function ProfilePopover() {
    const [isOpen, setIsOpen] = useState(false);
    const [user, setUser] = useState<any>(null);
    const router = useRouter();
    const popoverRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Close on click outside
        function handleClickOutside(event: MouseEvent) {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);

        // Load user data
        loadUserData();

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const loadUserData = async () => {
        try {
            const data = await apiClient.getCompanyDetails();
            setUser(data);
        } catch (error) {
            console.error("Failed to load user data", error);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_logged_in');
        router.push('/login');
    };

    return (
        <div className="relative" ref={popoverRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors"
            >
                <User className="h-5 w-5 text-gray-500" />
            </button>

            {isOpen && (
                <div className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
                    {/* Header with Close Button */}
                    <div className="flex justify-end p-2">
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-gray-400 hover:text-gray-600 p-1"
                        >
                            ×
                        </button>
                    </div>

                    {/* User Profile Info */}
                    <div className="px-6 pb-6 flex flex-col items-center text-center border-b border-gray-100">
                        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-3">
                            <User className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="font-bold text-gray-900 text-lg">Apoorva</h3>
                        <p className="text-sm text-gray-500 mb-2">apoorva.sm@spatial.guide</p>

                        <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 px-3 py-1 rounded-full">
                            <span>User Id : 60044709059</span>
                            <Copy className="w-3 h-3 cursor-pointer hover:text-gray-700" />
                        </div>

                        <button className="mt-3 text-blue-600 text-sm font-medium hover:underline">
                            My Account
                        </button>

                        <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
                            <span>My Organization:</span>
                            <span className="font-medium text-gray-900 flex items-center gap-1">
                                Company 2 <ChevronDown className="w-3 h-3" />
                            </span>
                        </div>
                    </div>

                    {/* Subscription */}
                    <div className="p-6 border-b border-gray-100">
                        <div className="flex items-center justify-between mb-1">
                            <h4 className="font-semibold text-gray-900">Subscription</h4>
                            <button className="text-blue-600 text-xs font-medium border border-blue-600 rounded px-2 py-1 hover:bg-blue-50">
                                Manage plan
                            </button>
                        </div>
                        <p className="text-sm text-gray-600">Trial</p>
                    </div>

                    {/* Resources */}
                    <div className="p-6 grid grid-cols-2 gap-4">
                        <h4 className="col-span-2 font-semibold text-gray-900 mb-1">Resources</h4>

                        <a href="#" className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
                            <Code className="w-4 h-4" />
                            <span>Developer Guide</span>
                        </a>

                        <a href="#" className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
                            <BookOpen className="w-4 h-4" />
                            <span>Knowledge Base</span>
                        </a>

                        <a href="#" className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
                            <HelpCircle className="w-4 h-4" />
                            <span>FAQs</span>
                        </a>

                        <a href="#" className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
                            <FileText className="w-4 h-4" />
                            <span>Book a Demo</span>
                        </a>
                    </div>

                    {/* Logout */}
                    <div className="p-4 border-t border-gray-100">
                        <button
                            onClick={handleLogout}
                            className="w-full py-2 text-red-600 font-medium hover:bg-red-50 rounded-lg transition-colors text-sm"
                        >
                            SIGN OUT
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// Helper icon component
function Code({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
        </svg>
    );
}
