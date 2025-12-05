'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import styles from './page.module.css';
import { useSettingsStore } from '../../store/settings';
import { apiFetch } from '../../lib/api';
import { useRequireAuth } from '../../lib/useRequireAuth';

type BookingListItem = {
  id: string;
  status: string;
  paymentStatus: string;
  paymentProvider?: string;
  paymentOrderId?: string | null;
  therapist?: { id: string; fullName?: string };
  user?: { id: string; fullName?: string };
  createdAt?: string;
  paymentExpiryTime?: string | null;
};

type BookingListResponse = {
  data: BookingListItem[];
  page: number;
  limit: number;
  total: number;
};

type BookingDetail = BookingListItem & {
  package?: { id: string; name: string } | null;
  paymentToken?: string | null;
  paymentRedirectUrl?: string | null;
  paymentInstruction?: any | null;
  therapistRespondBy?: string | null;
  chatLockedAt?: string | null;
  sessions?: Array<{ id: string; sequenceOrder: number; status: string; scheduledAt: string | null }>;
};

function formatDate(value?: string | null) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

function statusBadgeClass(status: string) {
  if (status === 'PAID' || status === 'COMPLETED') return styles.badge;
  if (status === 'PENDING') return `${styles.badge} ${styles.warn}`;
  return `${styles.badge} ${styles.danger}`;
}

function formatInstruction(instr: any): string {
  if (!instr) return '-';
  if (instr.type === 'VA') {
    return `VA ${instr.bank?.toUpperCase?.() ?? ''} • ${instr.account ?? '-'}`;
  }
  if (instr.type === 'qris' || instr.type === 'QRIS' || instr.type === 'gopay' || instr.type === 'GOPAY') {
    const action = instr.actions?.[0]?.url ?? instr.actions?.[0]?.deeplink ?? null;
    return action ? `QR/E-Wallet • ${action}` : 'QR/E-Wallet';
  }
  return JSON.stringify(instr);
}

function formatCountdown(expiry?: string | null) {
  if (!expiry) return '';
  const diffMs = new Date(expiry).getTime() - Date.now();
  if (diffMs <= 0) return '(expired)';
  const mins = Math.floor(diffMs / 60000);
  const secs = Math.floor((diffMs % 60000) / 1000);
  return `(expires in ${mins}m ${secs}s)`;
}

export default function BookingListPage() {
  const { apiBaseUrl, adminToken, hydrate } = useSettingsStore();
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [items, setItems] = useState<BookingListItem[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<BookingDetail | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const { ready } = useRequireAuth();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const filterParams = useMemo(() => {
    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('limit', '20');
    if (statusFilter) params.set('status', statusFilter);
    if (paymentStatusFilter) params.set('paymentStatus', paymentStatusFilter);
    return params.toString();
  }, [page, statusFilter, paymentStatusFilter]);

  const loadList = useCallback(async () => {
    if (!apiBaseUrl || !adminToken) {
      setError('Isi API Base URL dan Admin Token di Settings Bar');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<BookingListResponse>(apiBaseUrl, `/bookings?${filterParams}`, {
        tokenOverride: adminToken,
      });
      setItems(res.data);
      setDetail(null);
      setActiveId(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [adminToken, apiBaseUrl, filterParams]);

  const loadDetail = useCallback(async (id: string) => {
    if (!apiBaseUrl || !adminToken) {
      setError('Isi API Base URL dan Admin Token di Settings Bar');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<BookingDetail>(apiBaseUrl, `/bookings/${id}`, {
        tokenOverride: adminToken,
      });
      setDetail(data);
      setActiveId(id);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [adminToken, apiBaseUrl]);

  useEffect(() => {
    if (!detail || !activeId) return;
    if (detail.paymentStatus !== 'PENDING') return;
    const interval = setInterval(() => loadDetail(activeId), 5000);
    return () => clearInterval(interval);
  }, [detail, activeId, loadDetail]);

  if (!ready) return null;

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1>Booking List</h1>
        <p className={styles.muted}>
          Tampilkan status booking dan pembayaran (Midtrans). Klik baris untuk melihat detail dan instruksi
          channel.
        </p>
      </header>

      <div className={styles.controls}>
        <div className={styles.field}>
          <label htmlFor="status">Booking Status</label>
          <select id="status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All</option>
            <option value="PENDING">PENDING</option>
            <option value="PAID">PAID</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>
        <div className={styles.field}>
          <label htmlFor="paymentStatus">Payment Status</label>
          <select
            id="paymentStatus"
            value={paymentStatusFilter}
            onChange={(e) => setPaymentStatusFilter(e.target.value)}
          >
            <option value="">All</option>
            <option value="PENDING">PENDING</option>
            <option value="PAID">PAID</option>
            <option value="EXPIRED">EXPIRED</option>
            <option value="CANCELLED">CANCELLED</option>
            <option value="FAILED">FAILED</option>
          </select>
        </div>
        <button className={styles.button} onClick={loadList} disabled={loading}>
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className={styles.card}>
          <div className={`${styles.badge} ${styles.danger}`}>Error</div>
          <div className={styles.value}>{error}</div>
        </div>
      )}

      {items.length > 0 && (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Booking</th>
              <th>Payment</th>
              <th>Channel</th>
              <th>Patient</th>
              <th>Therapist</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {items
              .filter((it) => !paymentStatusFilter || it.paymentStatus === paymentStatusFilter)
              .map((item) => (
                <tr key={item.id} onClick={() => loadDetail(item.id)} style={{ cursor: 'pointer' }}>
                  <td>
                    <div className={styles.badge}>{item.status}</div>
                  </td>
                  <td>
                    <div className={statusBadgeClass(item.paymentStatus)}>{item.paymentStatus}</div>
                  </td>
                  <td>
                    <div className={styles.value}>{item.paymentProvider ?? '-'}</div>
                    <div className={styles.muted}>{item.paymentOrderId ?? '-'}</div>
                  </td>
                  <td>{item.user?.fullName ?? item.user?.id ?? '-'}</td>
                  <td>{item.therapist?.fullName ?? item.therapist?.id ?? '-'}</td>
                  <td>{formatDate(item.createdAt)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      )}

      {detail && (
        <div className={styles.card}>
          <div className={styles.grid}>
            <div>
              <div className={styles.label}>Booking ID</div>
              <div className={styles.value}>{detail.id}</div>
            </div>
            <div>
              <div className={styles.label}>Order ID</div>
              <div className={styles.value}>{detail.paymentOrderId ?? '-'}</div>
            </div>
            <div>
              <div className={styles.label}>Payment Status</div>
              <div className={statusBadgeClass(detail.paymentStatus)}>{detail.paymentStatus}</div>
            </div>
            <div>
              <div className={styles.label}>Provider</div>
              <div className={styles.value}>{detail.paymentProvider ?? '-'}</div>
            </div>
            <div>
              <div className={styles.label}>Payment Token</div>
              <div className={styles.value}>{detail.paymentToken ?? '-'}</div>
            </div>
            <div>
              <div className={styles.label}>Redirect URL</div>
              <div className={styles.value}>{detail.paymentRedirectUrl ?? '-'}</div>
            </div>
            <div>
              <div className={styles.label}>Payment Expiry</div>
              <div className={styles.value}>
                {formatDate(detail.paymentExpiryTime)}
                {detail.paymentExpiryTime && (
                  <span className={styles.muted}> {formatCountdown(detail.paymentExpiryTime)}</span>
                )}
              </div>
            </div>
            <div>
              <div className={styles.label}>Therapist Respond By</div>
              <div className={styles.value}>{formatDate(detail.therapistRespondBy)}</div>
            </div>
            <div>
              <div className={styles.label}>Chat Locked At</div>
              <div className={styles.value}>{formatDate(detail.chatLockedAt)}</div>
            </div>
          </div>
          <div className={styles.label}>Instruction</div>
          <div className={styles.value}>{formatInstruction(detail.paymentInstruction)}</div>
          <div className={styles.muted}>
            {detail.paymentStatus === 'PENDING'
              ? 'Auto-refresh setiap 5s untuk payment PENDING'
              : 'Status final (tidak auto-refresh)'}
            <button
              className={styles.button}
              style={{ marginLeft: 12 }}
              onClick={() => activeId && loadDetail(activeId)}
              disabled={loading}
            >
              {loading ? 'Refreshing...' : 'Refresh status'}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
