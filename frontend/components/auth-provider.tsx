'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // Check if user is authenticated
        const isLoggedIn = localStorage.getItem('admin_logged_in');
        const token = localStorage.getItem('admin_token');

        // If not logged in and not on login page, redirect to login
        if ((!isLoggedIn || !token) && pathname !== '/login') {
            router.push('/login');
        }

        // If logged in and on login page, redirect to admin
        if (isLoggedIn && token && pathname === '/login') {
            router.push('/admin');
        }
    }, [pathname, router]);

    return <>{children}</>;
}
