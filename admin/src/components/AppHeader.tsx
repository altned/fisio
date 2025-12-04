'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSettingsStore } from '../store/settings';

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { loggedIn, logout } = useSettingsStore();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="app-header">
      <div className="brand">
        <Link href="/">Fisioku Admin</Link>
      </div>
      <nav>
        <Link href="/">Home</Link>
        <Link href="/bookings">Bookings</Link>
        <Link href="/payment">Payment</Link>
        <Link href="/login">{loggedIn ? 'Switch account' : 'Login'}</Link>
        {loggedIn && pathname !== '/login' && (
          <button style={{ marginLeft: 12 }} onClick={handleLogout}>
            Logout
          </button>
        )}
      </nav>
    </header>
  );
}
