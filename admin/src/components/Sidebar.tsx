'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSettingsStore } from '../store/settings';

const navItems = [
    { href: '/', label: 'Dashboard', icon: '📊' },
    { href: '/bookings', label: 'Bookings', icon: '📋' },
    { href: '/wallets', label: 'Wallets', icon: '💰' },
    { href: '/logs', label: 'Admin Logs', icon: '📝' },
    { href: '/ops', label: 'Operations', icon: '⚙️' },
];

export function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { loggedIn, logout } = useSettingsStore();

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    const isActive = (href: string) => {
        if (href === '/') return pathname === '/';
        return pathname.startsWith(href);
    };

    return (
        <aside className="app-sidebar">
            <div className="sidebar-brand">
                <h1>Fisioku Admin</h1>
            </div>

            <nav className="sidebar-nav">
                {navItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`sidebar-link ${isActive(item.href) ? 'active' : ''}`}
                    >
                        <span>{item.icon}</span>
                        <span>{item.label}</span>
                    </Link>
                ))}
            </nav>

            <div className="sidebar-footer">
                {loggedIn ? (
                    <button className="btn btn-ghost w-full" onClick={handleLogout}>
                        🔐 Logout
                    </button>
                ) : (
                    <Link href="/login" className="btn btn-secondary w-full">
                        🔐 Login
                    </Link>
                )}
            </div>
        </aside>
    );
}
