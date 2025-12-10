'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSettingsStore, API_BASE_URL } from '../store/settings';
import { apiFetch } from '../lib/api';
import { useRequireAuth } from '../lib/useRequireAuth';
import Link from 'next/link';

type BookingStats = {
  pending: number;
  paid: number;
  completed: number;
  cancelled: number;
};

type DashboardData = {
  bookings: BookingStats;
  recentBookings: Array<{
    id: string;
    status: string;
    paymentStatus: string;
    createdAt: string;
    user?: { fullName?: string };
    therapist?: { fullName?: string };
  }>;
};

export default function DashboardPage() {
  const { adminToken, hydrate } = useSettingsStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<BookingStats>({ pending: 0, paid: 0, completed: 0, cancelled: 0 });
  const [recentBookings, setRecentBookings] = useState<DashboardData['recentBookings']>([]);
  const { ready } = useRequireAuth();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const loadDashboard = useCallback(async () => {
    if (!adminToken) return;
    setLoading(true);
    setError(null);

    try {
      // Load recent bookings
      const res = await apiFetch<{ data: DashboardData['recentBookings']; total: number }>(
        API_BASE_URL,
        '/bookings?limit=5',
        { tokenOverride: adminToken }
      );
      setRecentBookings(res.data || []);

      // Calculate stats from bookings (simplified)
      const allBookings = await apiFetch<{ data: Array<{ status: string; paymentStatus: string }> }>(
        API_BASE_URL,
        '/bookings?limit=100',
        { tokenOverride: adminToken }
      );

      const newStats: BookingStats = { pending: 0, paid: 0, completed: 0, cancelled: 0 };
      (allBookings.data || []).forEach((b) => {
        if (b.status === 'PENDING') newStats.pending++;
        else if (b.status === 'PAID') newStats.paid++;
        else if (b.status === 'COMPLETED') newStats.completed++;
        else if (b.status === 'CANCELLED') newStats.cancelled++;
      });
      setStats(newStats);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [adminToken]);

  useEffect(() => {
    if (adminToken) {
      loadDashboard();
    }
  }, [adminToken, loadDashboard]);

  if (!ready) return null;

  return (
    <>
      <header className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Overview operasional Fisioku Prime Care</p>
        </div>
      </header>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Stats Grid */}
      <div className="card-grid mb-lg">
        <div className="stat-card">
          <div className="stat-label">Pending Bookings</div>
          <div className="stat-value">{stats.pending}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Paid (Waiting Accept)</div>
          <div className="stat-value">{stats.paid}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Completed</div>
          <div className="stat-value">{stats.completed}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Cancelled</div>
          <div className="stat-value">{stats.cancelled}</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Quick Actions</h3>
        </div>
        <div className="flex gap-md">
          <Link href="/bookings" className="btn btn-primary">
            📋 View All Bookings
          </Link>
          <Link href="/wallets" className="btn btn-secondary">
            💰 Manage Wallets
          </Link>
          <Link href="/ops" className="btn btn-secondary">
            ⚙️ Run Jobs
          </Link>
          <button className="btn btn-ghost" onClick={loadDashboard} disabled={loading}>
            {loading ? 'Loading...' : '🔄 Refresh'}
          </button>
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Recent Bookings</h3>
          <Link href="/bookings" className="btn btn-ghost btn-sm">
            View All →
          </Link>
        </div>

        {recentBookings.length === 0 ? (
          <div className="empty-state">
            <p>No bookings found. Configure API settings above.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table table-clickable">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Payment</th>
                  <th>Patient</th>
                  <th>Therapist</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((b) => (
                  <tr key={b.id} onClick={() => window.location.href = `/bookings?id=${b.id}`}>
                    <td>
                      <span className={`badge ${b.status === 'PENDING' ? 'warning' : b.status === 'CANCELLED' ? 'danger' : ''}`}>
                        {b.status}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${b.paymentStatus === 'PENDING' ? 'warning' : b.paymentStatus === 'PAID' ? '' : 'danger'}`}>
                        {b.paymentStatus}
                      </span>
                    </td>
                    <td>{b.user?.fullName || '-'}</td>
                    <td>{b.therapist?.fullName || '-'}</td>
                    <td className="text-muted text-sm">
                      {b.createdAt ? new Date(b.createdAt).toLocaleDateString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
