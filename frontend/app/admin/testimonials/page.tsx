"use client";

import { Sparkles } from "lucide-react";

export default function ComingSoonPage() {
    return (
        <div className="h-[calc(100vh-64px)] flex flex-col items-center justify-center p-8 text-center">
            <div className="w-20 h-20 bg-blue-100 rounded-3xl flex items-center justify-center text-blue-600 mb-6 animate-bounce">
                <Sparkles className="h-10 w-10" />
            </div>
            <h1 className="text-4xl font-black text-gray-900 mb-4">Coming Soon</h1>
            <p className="text-gray-500 max-w-md mx-auto text-lg">
                We're working hard to bring you this feature in <span className="text-blue-600 font-bold">Phase 2</span>.
                Stay tuned for advanced analytics and customer feedback tools!
            </p>
            <div className="mt-12 flex gap-2">
                <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse"></div>
                <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse delay-75"></div>
                <div className="w-3 h-3 bg-blue-200 rounded-full animate-pulse delay-150"></div>
            </div>
        </div>
    );
}
