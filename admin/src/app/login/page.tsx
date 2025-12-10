'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSettingsStore, API_BASE_URL } from '../../store/settings';
import { apiFetch } from '../../lib/api';

export default function LoginPage() {
  const router = useRouter();
  const { hydrate, loggedIn, setLoggedIn, setAdminToken } = useSettingsStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (loggedIn) {
      router.push('/');
    }
  }, [loggedIn, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Call login endpoint
      const res = await apiFetch<{ accessToken: string; user: { role: string } }>(
        API_BASE_URL,
        '/auth/login',
        {
          method: 'POST',
          body: { email, password },
        }
      );

      // Verify admin role
      if (res.user?.role !== 'ADMIN') {
        setError('Akun ini bukan admin. Gunakan akun dengan role ADMIN.');
        setLoading(false);
        return;
      }

      // Set token and redirect
      setAdminToken(res.accessToken);
      setLoggedIn(true);
      router.push('/');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <header className="page-header">
        <div>
          <h1>Login Admin</h1>
          <p>Masuk dengan akun admin untuk mengakses dashboard</p>
        </div>
      </header>

      <div className="card" style={{ maxWidth: 400 }}>
        <form onSubmit={handleSubmit}>
          {error && <div className="alert alert-error mb-md">{error}</div>}

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              className="form-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button className="btn btn-primary w-full" type="submit" disabled={loading}>
            {loading ? 'Masuk...' : 'Login'}
          </button>
        </form>
      </div>

      <div className="card mt-md" style={{ maxWidth: 400 }}>
        <div className="text-sm text-muted">
          <strong>💡 Default credentials:</strong>
          <ul style={{ marginLeft: '1rem', marginTop: '0.5rem' }}>
            <li>Email: admin@example.com</li>
            <li>Password: admin123</li>
          </ul>
        </div>
      </div>
    </>
  );
}

