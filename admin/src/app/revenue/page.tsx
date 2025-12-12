'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSettingsStore, API_BASE_URL } from '../../store/settings';
import { apiFetch } from '../../lib/api';
import { useRequireAuth } from '../../lib/useRequireAuth';

type RevenueStats = {
    totalCommission: string;
    monthCommission: string;
    totalGrossRevenue: string;
    totalBookings: number;
    monthlyBreakdown: Array<{
        month: string;
        commission: string;
        gross: string;
        count: string;
    }>;
};

export default function RevenuePage() {
    const { adminToken, hydrate } = useSettingsStore();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [stats, setStats] = useState<RevenueStats | null>(null);
    const { ready } = useRequireAuth();

    useEffect(() => { hydrate(); }, [hydrate]);

    const loadStats = useCallback(async () => {
        if (!API_BASE_URL || !adminToken) return;
        setLoading(true);
        setError(null);

        try {
            const res = await apiFetch<RevenueStats>(
                API_BASE_URL,
                '/admin/stats/revenue',
                { tokenOverride: adminToken }
            );
            setStats(res);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    }, [adminToken]);

    useEffect(() => {
        if (API_BASE_URL && adminToken) loadStats();
    }, [adminToken, loadStats]);

    const formatCurrency = (value: string) => {
        return `Rp ${parseFloat(value || '0').toLocaleString('id-ID')}`;
    };

    if (!ready) return null;

    return (
        <>
            <header className="page-header">
                <h1>💰 Revenue Dashboard</h1>
                <p>Pantau pendapatan platform dari komisi booking</p>
            </header>

            {error && <div className="alert alert-error">{error}</div>}

            <div className="flex gap-md mb-md">
                <button className="btn btn-primary" onClick={loadStats} disabled={loading}>
                    {loading ? 'Loading...' : '🔄 Refresh'}
                </button>
            </div>

            {/* Summary Cards */}
            <div className="card-grid">
                <div className="stat-card" style={{ background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' }}>
                    <div className="stat-label" style={{ color: 'rgba(255,255,255,0.9)' }}>Total Komisi Platform</div>
                    <div className="stat-value" style={{ color: 'white', WebkitTextFillColor: 'white', background: 'none', fontSize: '1.75rem' }}>
                        {formatCurrency(stats?.totalCommission || '0')}
                    </div>
                    <div className="text-sm" style={{ color: 'rgba(255,255,255,0.8)', marginTop: '8px' }}>
                        Sepanjang waktu
                    </div>
                </div>

                <div className="stat-card" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }}>
                    <div className="stat-label" style={{ color: 'rgba(255,255,255,0.9)' }}>Komisi Bulan Ini</div>
                    <div className="stat-value" style={{ color: 'white', WebkitTextFillColor: 'white', background: 'none', fontSize: '1.75rem' }}>
                        {formatCurrency(stats?.monthCommission || '0')}
                    </div>
                    <div className="text-sm" style={{ color: 'rgba(255,255,255,0.8)', marginTop: '8px' }}>
                        {new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                    </div>
                </div>

                <div className="stat-card" style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' }}>
                    <div className="stat-label" style={{ color: 'rgba(255,255,255,0.9)' }}>Total Gross Revenue</div>
                    <div className="stat-value" style={{ color: 'white', WebkitTextFillColor: 'white', background: 'none', fontSize: '1.75rem' }}>
                        {formatCurrency(stats?.totalGrossRevenue || '0')}
                    </div>
                    <div className="text-sm" style={{ color: 'rgba(255,255,255,0.8)', marginTop: '8px' }}>
                        Total nilai semua booking
                    </div>
                </div>

                <div className="stat-card" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
                    <div className="stat-label" style={{ color: 'rgba(255,255,255,0.9)' }}>Total Booking Sukses</div>
                    <div className="stat-value" style={{ color: 'white', WebkitTextFillColor: 'white', background: 'none', fontSize: '1.75rem' }}>
                        {stats?.totalBookings || 0}
                    </div>
                    <div className="text-sm" style={{ color: 'rgba(255,255,255,0.8)', marginTop: '8px' }}>
                        Booking dengan status PAID
                    </div>
                </div>
            </div>

            {/* Monthly Breakdown Table */}
            <div className="card mt-lg">
                <div className="card-header">
                    <h3 className="card-title">📊 Breakdown Bulanan (6 Bulan Terakhir)</h3>
                </div>
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Bulan</th>
                                <th>Jumlah Booking</th>
                                <th>Gross Revenue</th>
                                <th>Komisi Platform</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats?.monthlyBreakdown?.length ? (
                                stats.monthlyBreakdown.map((row) => (
                                    <tr key={row.month}>
                                        <td>{row.month}</td>
                                        <td>{row.count}</td>
                                        <td>{formatCurrency(row.gross)}</td>
                                        <td style={{ color: '#16a34a', fontWeight: 600 }}>
                                            {formatCurrency(row.commission)}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="text-center text-muted">
                                        Belum ada data booking
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}
