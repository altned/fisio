'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import styles from './page.module.css';
import { useSettingsStore } from '../../store/settings';

const DEMO_EMAIL = 'admin@demo.com';
const DEMO_PASSWORD = 'admin123';
const DEMO_API_BASE = 'https://api.staging.example.com';
const DEMO_TOKEN = 'demo-admin-token';

export default function LoginPage() {
  const router = useRouter();
  const { hydrate, loggedIn, setLoggedIn, setAdminToken, setApiBaseUrl } = useSettingsStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (loggedIn) {
      router.push('/bookings');
    }
  }, [loggedIn, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    setTimeout(() => {
      if (email === DEMO_EMAIL && password === DEMO_PASSWORD) {
        setApiBaseUrl(DEMO_API_BASE);
        setAdminToken(DEMO_TOKEN);
        setLoggedIn(true);
        router.push('/bookings');
      } else {
        setError('Credensial demo salah. Gunakan admin@demo.com / admin123');
      }
      setLoading(false);
    }, 500);
  };

  return (
    <div className={styles.page}>
      <form className={styles.card} onSubmit={handleSubmit}>
        <div>
          <h1 className={styles.title}>Login Admin</h1>
          <p className={styles.subtitle}>Gunakan akun demo untuk mengakses dashboard.</p>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.field}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={DEMO_EMAIL}
            required
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
        </div>

        <button className={styles.button} type="submit" disabled={loading}>
          {loading ? 'Masuk...' : 'Login'}
        </button>

        <p className={styles.hint}>Demo: {DEMO_EMAIL} / {DEMO_PASSWORD}</p>
      </form>
    </div>
  );
}
