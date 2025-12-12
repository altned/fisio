'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar, SidebarProvider, useSidebar } from '../components/Sidebar';

function MainContent({ children }: { children: ReactNode }) {
    const { collapsed } = useSidebar();

    return (
        <main className={`app-main ${collapsed ? 'sidebar-collapsed' : ''}`}>
            <div className="app-content">{children}</div>
        </main>
    );
}

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
        <SidebarProvider>
            <div className="app-layout">
                <Sidebar />
                <MainContent>{children}</MainContent>
            </div>
        </SidebarProvider>
    );
}
