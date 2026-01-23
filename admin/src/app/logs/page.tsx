'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSettingsStore, API_BASE_URL } from '../../store/settings';
import { apiFetch } from '../../lib/api';
import { useRequireAuth } from '../../lib/useRequireAuth';

type AdminLog = {
    id: string;
    adminId: string;
    action: string;
    targetType: string;
    targetId: string;
    meta?: Record<string, unknown>;
    createdAt: string;
};

export default function LogsPage() {
    const { adminToken, hydrate } = useSettingsStore();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [logs, setLogs] = useState<AdminLog[]>([]);
    const [page, setPage] = useState(1);
    const [actionFilter, setActionFilter] = useState('');
    const { ready } = useRequireAuth();

    useEffect(() => { hydrate(); }, [hydrate]);

    const loadLogs = useCallback(async () => {
        if (!API_BASE_URL || !adminToken) return;
        setLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams();
            params.set('page', page.toString());
            params.set('limit', '20');
            if (actionFilter) params.set('action', actionFilter);

            const res = await apiFetch<{ data: AdminLog[]; total: number }>(
                API_BASE_URL,
                `/admin/logs?${params.toString()}`,
                { tokenOverride: adminToken }
            );

            setLogs(res.data || []);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    }, [adminToken, page, actionFilter]);

    useEffect(() => {
        if (API_BASE_URL && adminToken) loadLogs();
    }, [adminToken, loadLogs]);

    if (!ready) return null;

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleString('id-ID');
    };

    return (
        <>
            <header className="page-header">
                <h1>Admin Logs</h1>
                <p>Audit trail semua aksi admin</p>
            </header>

            {error && <div className="alert alert-error">{error}</div>}

            <div className="flex gap-md mb-md items-center">
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <select
                        className="form-select"
                        value={actionFilter}
                        onChange={(e) => setActionFilter(e.target.value)}
                    >
                        <option value="">All Actions</option>
                        <option value="SWAP_THERAPIST">Swap Therapist</option>
                        <option value="REFUND">Refund</option>
                        <option value="TOPUP">Topup</option>
                        <option value="WITHDRAW">Withdraw</option>
                        <option value="MANUAL_PAYOUT">Manual Payout</option>
                    </select>
                </div>
                <button className="btn btn-primary" onClick={loadLogs} disabled={loading}>
                    {loading ? 'Loading...' : '🔄 Refresh'}
                </button>
            </div>

            <div className="table-container">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Timestamp</th>
                            <th>Action</th>
                            <th>Target</th>
                            <th>Admin ID</th>
                            <th>Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.map((log) => (
                            <tr key={log.id}>
                                <td className="text-sm">{formatDate(log.createdAt)}</td>
                                <td>
                                    <span className="badge info">{log.action}</span>
                                </td>
                                <td>
                                    <span className="text-sm text-muted">{log.targetType}</span>
                                    <br />
                                    <code className="text-xs">{log.targetId}</code>
                                </td>
                                <td>
                                    <code className="text-xs">{log.adminId || '-'}</code>
                                </td>
                                <td className="text-sm">
                                    {log.meta ? (
                                        <details>
                                            <summary style={{ cursor: 'pointer' }}>View</summary>
                                            <pre className="text-xs" style={{ whiteSpace: 'pre-wrap' }}>
                                                {JSON.stringify(log.meta, null, 2)}
                                            </pre>
                                        </details>
                                    ) : (
                                        '-'
                                    )}
                                </td>
                            </tr>
                        ))}

                        {logs.length === 0 && !loading && (
                            <tr>
                                <td colSpan={5} className="text-center text-muted">
                                    No logs found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="flex gap-sm mt-md justify-between">
                <button
                    className="btn btn-ghost"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                >
                    ← Previous
                </button>
                <span className="text-muted">Page {page}</span>
                <button
                    className="btn btn-ghost"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={logs.length < 20}
                >
                    Next →
                </button>
            </div>
        </>
    );
}
