'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSettingsStore } from '../store/settings';
import { useState, useEffect, createContext, useContext } from 'react';

const navItems = [
    { href: '/', label: 'Dashboard', icon: '📊' },
    { href: '/bookings', label: 'Bookings', icon: '📋' },
    { href: '/therapists', label: 'Therapists', icon: '👨‍⚕️' },
    { href: '/packages', label: 'Packages', icon: '📦' },
    { href: '/wallets', label: 'Wallets', icon: '💰' },
    { href: '/revenue', label: 'Revenue', icon: '💵' },
    { href: '/logs', label: 'Admin Logs', icon: '📝' },
    { href: '/ops', label: 'Operations', icon: '⚙️' },
];

// Create context for sidebar state
export const SidebarContext = createContext<{
    collapsed: boolean;
    setCollapsed: (value: boolean) => void;
}>({
    collapsed: false,
    setCollapsed: () => { },
});

export function useSidebar() {
    return useContext(SidebarContext);
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
    const [collapsed, setCollapsed] = useState(false);

    // Persist sidebar state
    useEffect(() => {
        const saved = localStorage.getItem('sidebar-collapsed');
        if (saved) setCollapsed(saved === 'true');
    }, []);

    const handleSetCollapsed = (value: boolean) => {
        setCollapsed(value);
        localStorage.setItem('sidebar-collapsed', String(value));
    };

    return (
        <SidebarContext.Provider value={{ collapsed, setCollapsed: handleSetCollapsed }}>
            {children}
        </SidebarContext.Provider>
    );
}

export function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { loggedIn, logout } = useSettingsStore();
    const { collapsed, setCollapsed } = useSidebar();

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    const isActive = (href: string) => {
        if (href === '/') return pathname === '/';
        return pathname.startsWith(href);
    };

    return (
        <aside className={`app-sidebar ${collapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-brand">
                {!collapsed && <h1>Fisioku Admin</h1>}
                <button
                    className="sidebar-toggle"
                    onClick={() => setCollapsed(!collapsed)}
                    title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    {collapsed ? '→' : '←'}
                </button>
            </div>

            <nav className="sidebar-nav">
                {navItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`sidebar-link ${isActive(item.href) ? 'active' : ''}`}
                        title={collapsed ? item.label : undefined}
                    >
                        <span>{item.icon}</span>
                        <span>{item.label}</span>
                    </Link>
                ))}
            </nav>

            <div className="sidebar-footer">
                {loggedIn ? (
                    <button className="btn btn-ghost w-full" onClick={handleLogout}>
                        {collapsed ? '🔐' : '🔐 Logout'}
                    </button>
                ) : (
                    <Link href="/login" className="btn btn-secondary w-full">
                        {collapsed ? '🔐' : '🔐 Login'}
                    </Link>
                )}
            </div>
        </aside>
    );
}
