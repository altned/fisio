'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import styles from './page.module.css';
import { useSettingsStore, API_BASE_URL } from '../../store/settings';
import { apiFetch } from '../../lib/api';
import { useRequireAuth } from '../../lib/useRequireAuth';

type SessionLite = {
  id: string;
  status: string;
  sequenceOrder: number;
  scheduledAt: string | null;
};

type BookingDetail = {
  id: string;
  status: string;
  paymentStatus: string;
  paymentProvider?: string;
  paymentOrderId?: string | null;
  paymentToken?: string | null;
  paymentRedirectUrl?: string | null;
  paymentInstruction?: any | null;
  paymentExpiryTime?: string | null;
  therapistRespondBy?: string | null;
  chatLockedAt?: string | null;
  therapist?: { id: string; fullName?: string };
  user?: { id: string; fullName?: string };
  package?: { id: string; name: string } | null;
  sessions?: SessionLite[];
  createdAt?: string;
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

export default function PaymentStatusPage() {
  const { adminToken, hydrate } = useSettingsStore();
  const [bookingId, setBookingId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<BookingDetail | null>(null);
  const { ready } = useRequireAuth();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const fetchDetail = useCallback(async () => {
    if (!bookingId.trim()) {
      setError('Isi Booking ID terlebih dahulu');
      return;
    }
    if (!API_BASE_URL || !adminToken) {
      setError('Isi API Base URL dan Admin Token pada Settings Bar');
      return;
    }
    setLoading(true);
    setError(null);
    setDetail(null);
    try {
      const data = await apiFetch<BookingDetail>(API_BASE_URL, `/bookings/${bookingId.trim()}`, {
        tokenOverride: adminToken,
      });
      setDetail(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [adminToken, bookingId]);

  useEffect(() => {
    if (!detail || !bookingId.trim()) return;
    if (detail.paymentStatus !== 'PENDING') return;
    const interval = setInterval(() => fetchDetail(), 5000);
    return () => clearInterval(interval);
  }, [detail, bookingId, fetchDetail]);

  if (!ready) return null;

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.titleRow}>
          <h1>Payment Status</h1>
          <span className={styles.muted}>Midtrans Core API · read-only</span>
        </div>
        <p className={styles.muted}>
          Masukkan Booking ID untuk melihat status pembayaran, instruksi channel, dan expiry. Tidak ada
          upload bukti atau konfirmasi manual.
        </p>
      </header>

      <div className={styles.inputRow}>
        <div className={styles.field}>
          <label htmlFor="bookingId">Booking ID</label>
          <input
            id="bookingId"
            value={bookingId}
            onChange={(e) => setBookingId(e.target.value)}
            placeholder="booking UUID"
            onKeyDown={(e) => {
              if (e.key === 'Enter') fetchDetail();
            }}
          />
        </div>
        <button className={styles.button} onClick={fetchDetail} disabled={loading}>
          {loading ? 'Loading...' : 'Fetch Status'}
        </button>
      </div>

      {error && (
        <div className={styles.card}>
          <div className={styles.statusRow}>
            <span className={`${styles.badge} ${styles.danger}`}>Error</span>
            <span className={styles.value}>{error}</span>
          </div>
        </div>
      )}

      {detail && (
        <div className={styles.card}>
          <div className={styles.statusRow}>
            <span className={statusBadgeClass(detail.status)}>Booking: {detail.status}</span>
            <span className={statusBadgeClass(detail.paymentStatus)}>
              Payment: {detail.paymentStatus}
            </span>
            {detail.paymentProvider && <span className={styles.badge}>{detail.paymentProvider}</span>}
          </div>

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
              <div className={styles.label}>Therapist</div>
              <div className={styles.value}>
                {detail.therapist?.fullName ?? detail.therapist?.id ?? '-'}
              </div>
            </div>
            <div>
              <div className={styles.label}>Patient</div>
              <div className={styles.value}>{detail.user?.fullName ?? detail.user?.id ?? '-'}</div>
            </div>
            <div>
              <div className={styles.label}>Package</div>
              <div className={styles.value}>{detail.package?.name ?? '-'}</div>
            </div>
            <div>
              <div className={styles.label}>Created At</div>
              <div className={styles.value}>{formatDate(detail.createdAt)}</div>
            </div>
            <div>
              <div className={styles.label}>Therapist Respond By</div>
              <div className={styles.value}>{formatDate(detail.therapistRespondBy)}</div>
            </div>
            <div>
              <div className={styles.label}>Chat Locked At</div>
              <div className={styles.value}>{formatDate(detail.chatLockedAt)}</div>
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
              <div className={styles.label}>Payment Token</div>
              <div className={styles.value}>{detail.paymentToken ?? '-'}</div>
            </div>
            <div>
              <div className={styles.label}>Redirect URL</div>
              <div className={styles.value}>{detail.paymentRedirectUrl ?? '-'}</div>
            </div>
          </div>

          <div className={styles.instruction}>
            <div className={styles.label}>Instruction</div>
            <div className={styles.value}>{formatInstruction(detail.paymentInstruction)}</div>
          </div>
          <div className={styles.muted}>
            {detail.paymentStatus === 'PENDING'
              ? 'Auto-refresh setiap 5s untuk payment PENDING'
              : 'Status final (tidak auto-refresh)'}
            <button
              className={styles.button}
              style={{ marginLeft: 12 }}
              onClick={() => fetchDetail()}
              disabled={loading}
            >
              {loading ? 'Refreshing...' : 'Refresh status'}
            </button>
          </div>

          {detail.sessions && detail.sessions.length > 0 && (
            <div>
              <div className={styles.label}>Sessions</div>
              <div className={styles.grid}>
                {detail.sessions.map((s) => (
                  <div key={s.id} className={styles.instruction}>
                    <div className={styles.value}>
                      #{s.sequenceOrder} — {s.status}
                    </div>
                    <div className={styles.label}>Scheduled</div>
                    <div className={styles.value}>{s.scheduledAt ? formatDate(s.scheduledAt) : '-'}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
