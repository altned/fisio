'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from '../components/Sidebar';

export default function ClientLayout({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const isLoginPage = pathname === '/login';

    if (isLoginPage) {
        // Login page without sidebar
        return (
            <main className="app-main" style={{ marginLeft: 0 }}>
                <div className="app-content" style={{ maxWidth: 600, margin: '80px auto' }}>
                    {children}
                </div>
            </main>
        );
    }

    // Regular pages with sidebar
    return (
        <div className="app-layout">
            <Sidebar />
            <main className="app-main">
                <div className="app-content">{children}</div>
            </main>
        </div>
    );
}
