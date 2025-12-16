'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSettingsStore, API_BASE_URL } from '../../store/settings';
import { apiFetch } from '../../lib/api';
import { useRequireAuth } from '../../lib/useRequireAuth';
import { Modal } from '../../components/Modal';

type BookingListItem = {
  id: string;
  status: string;
  paymentStatus: string;
  paymentProvider?: string;
  paymentOrderId?: string | null;
  refundStatus?: string;
  therapist?: { id: string; fullName?: string; user?: { fullName?: string } };
  user?: { id: string; fullName?: string };
  createdAt?: string;
  paymentExpiryTime?: string | null;
};

type BookingDetail = BookingListItem & {
  package?: { id: string; name: string } | null;
  paymentToken?: string | null;
  paymentRedirectUrl?: string | null;
  paymentInstruction?: Record<string, unknown> | null;
  therapistRespondBy?: string | null;
  chatLockedAt?: string | null;
  sessions?: Array<{ id: string; sequenceOrder: number; status: string; scheduledAt: string | null }>;
};

type Therapist = {
  id: string;
  user?: { fullName?: string };
  fullName?: string; // For compatibility
  averageRating?: string;
};

function formatDate(value?: string | null) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString('id-ID');
}

function formatCountdown(expiry?: string | null) {
  if (!expiry) return '';
  const diffMs = new Date(expiry).getTime() - Date.now();
  if (diffMs <= 0) return '(expired)';
  const mins = Math.floor(diffMs / 60000);
  const secs = Math.floor((diffMs % 60000) / 1000);
  return `(${mins}m ${secs}s)`;
}

function formatInstruction(instr: Record<string, unknown> | null | undefined): string {
  if (!instr) return '-';
  if (instr.type === 'VA') {
    return `VA ${(instr.bank as string)?.toUpperCase() ?? ''} • ${instr.account ?? '-'}`;
  }
  if (['qris', 'QRIS', 'gopay', 'GOPAY'].includes(instr.type as string)) {
    return 'QR/E-Wallet';
  }
  return JSON.stringify(instr);
}

export default function BookingListPage() {
  const { adminToken, hydrate } = useSettingsStore();
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [items, setItems] = useState<BookingListItem[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [detail, setDetail] = useState<BookingDetail | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Swap therapist modal
  const [swapModalOpen, setSwapModalOpen] = useState(false);
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [newTherapistId, setNewTherapistId] = useState('');

  // Refund modal
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [refundRef, setRefundRef] = useState('');
  const [refundNote, setRefundNote] = useState('');

  const { ready } = useRequireAuth();

  useEffect(() => { hydrate(); }, [hydrate]);

  const loadList = useCallback(async () => {
    if (!API_BASE_URL || !adminToken) {
      setError('Isi API Base URL dan Admin Token di Settings');
      return;
    }
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('limit', '20');
    if (statusFilter) params.set('status', statusFilter);
    if (paymentStatusFilter) params.set('paymentStatus', paymentStatusFilter);

    try {
      const res = await apiFetch<{ data: BookingListItem[] }>(
        API_BASE_URL,
        `/bookings?${params.toString()}`,
        { tokenOverride: adminToken }
      );
      setItems(res.data || []);
      setDetail(null);
      setActiveId(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [adminToken, API_BASE_URL, page, statusFilter, paymentStatusFilter]);

  const loadDetail = useCallback(async (id: string) => {
    if (!API_BASE_URL || !adminToken) return;
    setLoading(true);
    try {
      const data = await apiFetch<BookingDetail>(
        API_BASE_URL,
        `/bookings/${id}`,
        { tokenOverride: adminToken }
      );
      setDetail(data);
      setActiveId(id);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [adminToken, API_BASE_URL]);

  const loadTherapists = async () => {
    if (!API_BASE_URL || !adminToken) return;
    try {
      const res = await apiFetch<Therapist[]>(
        API_BASE_URL,
        '/therapists',
        { tokenOverride: adminToken }
      );
      setTherapists(res || []);
    } catch (err) {
      console.error(err);
    }
  };

  const openSwapModal = () => {
    loadTherapists();
    setSwapModalOpen(true);
  };

  const handleSwapTherapist = async () => {
    if (!detail || !newTherapistId) return;
    setLoading(true);
    setError(null);

    try {
      await apiFetch(
        API_BASE_URL,
        `/admin/bookings/${detail.id}/swap-therapist`,
        {
          method: 'PATCH',
          body: { newTherapistId },
          tokenOverride: adminToken,
        }
      );
      setSuccess('Therapist berhasil di-swap!');
      setSwapModalOpen(false);
      setNewTherapistId('');
      loadDetail(detail.id);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteRefund = async () => {
    if (!detail) return;
    setLoading(true);
    setError(null);

    try {
      await apiFetch(
        API_BASE_URL,
        '/admin/bookings/refund',
        {
          method: 'POST',
          body: {
            bookingId: detail.id,
            refundReference: refundRef || undefined,
            refundNote: refundNote || undefined,
          },
          tokenOverride: adminToken,
        }
      );
      setSuccess('Refund berhasil dicatat!');
      setRefundModalOpen(false);
      setRefundRef('');
      setRefundNote('');
      loadDetail(detail.id);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Force payment to PAID (for testing)
  const handleForcePaid = async () => {
    if (!detail) return;
    if (!confirm('⚠️ DEV ONLY: Apakah Anda yakin ingin bypass pembayaran untuk booking ini?')) return;

    setLoading(true);
    setError(null);

    try {
      await apiFetch(
        API_BASE_URL,
        `/payment/force-paid/${detail.id}`,
        {
          method: 'POST',
          tokenOverride: adminToken,
        }
      );
      setSuccess('✅ Pembayaran berhasil di-bypass! Booking sekarang PAID.');
      loadDetail(detail.id);
      loadList();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh for pending payment
  useEffect(() => {
    if (!detail || !activeId) return;
    if (detail.paymentStatus !== 'PENDING') return;
    const interval = setInterval(() => loadDetail(activeId), 5000);
    return () => clearInterval(interval);
  }, [detail, activeId, loadDetail]);

  if (!ready) return null;

  return (
    <>
      <header className="page-header">
        <h1>Bookings</h1>
        <p>Kelola booking, lihat status pembayaran, swap therapist, dan proses refund</p>
      </header>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Filters */}
      <div className="card">
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Booking Status</label>
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All</option>
              <option value="PENDING">PENDING</option>
              <option value="PAID">PAID</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Payment Status</label>
            <select
              className="form-select"
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
            >
              <option value="">All</option>
              <option value="PENDING">PENDING</option>
              <option value="PAID">PAID</option>
              <option value="EXPIRED">EXPIRED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>
          <button className="btn btn-primary" onClick={loadList} disabled={loading}>
            {loading ? 'Loading...' : '🔍 Search'}
          </button>
        </div>
      </div>

      {/* Table */}
      {items.length > 0 && (
        <div className="table-container">
          <table className="table table-clickable">
            <thead>
              <tr>
                <th>Booking</th>
                <th>Payment</th>
                <th>Refund</th>
                <th>Patient</th>
                <th>Therapist</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} onClick={() => loadDetail(item.id)}>
                  <td>
                    <span className={`badge ${item.status === 'PENDING' ? 'warning' : item.status === 'CANCELLED' ? 'danger' : ''}`}>
                      {item.status}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${item.paymentStatus === 'PENDING' ? 'warning' : item.paymentStatus === 'PAID' ? '' : 'danger'}`}>
                      {item.paymentStatus}
                    </span>
                  </td>
                  <td>
                    {item.refundStatus && item.refundStatus !== 'NONE' && (
                      <span className={`badge ${item.refundStatus === 'PENDING' ? 'warning' : ''}`}>
                        {item.refundStatus}
                      </span>
                    )}
                  </td>
                  <td>{item.user?.fullName || '-'}</td>
                  <td>{item.therapist?.user?.fullName || item.therapist?.fullName || '-'}</td>
                  <td className="text-sm text-muted">{formatDate(item.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {items.length === 0 && !loading && (
        <div className="empty-state">
          <p>No bookings found. Click Search to load data.</p>
        </div>
      )}

      {/* Pagination */}
      <div className="flex justify-between items-center mt-md">
        <button className="btn btn-ghost" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
          ← Previous
        </button>
        <span className="text-muted">Page {page}</span>
        <button className="btn btn-ghost" onClick={() => setPage((p) => p + 1)} disabled={items.length < 20}>
          Next →
        </button>
      </div>

      {/* Detail Panel */}
      {detail && (
        <div className="card mt-lg">
          <div className="card-header">
            <h3 className="card-title">Booking Detail</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => setDetail(null)}>
              ✕ Close
            </button>
          </div>

          <div className="card-grid mb-md">
            <div>
              <div className="text-sm text-muted">Booking ID</div>
              <div><code className="text-xs">{detail.id}</code></div>
            </div>
            <div>
              <div className="text-sm text-muted">Status</div>
              <div><span className={`badge ${detail.status === 'CANCELLED' ? 'danger' : ''}`}>{detail.status}</span></div>
            </div>
            <div>
              <div className="text-sm text-muted">Payment Status</div>
              <div><span className={`badge ${detail.paymentStatus === 'PENDING' ? 'warning' : detail.paymentStatus === 'PAID' ? '' : 'danger'}`}>{detail.paymentStatus}</span></div>
            </div>
            <div>
              <div className="text-sm text-muted">Order ID</div>
              <div>{detail.paymentOrderId || '-'}</div>
            </div>
            <div>
              <div className="text-sm text-muted">Patient</div>
              <div>{detail.user?.fullName || '-'}</div>
            </div>
            <div>
              <div className="text-sm text-muted">Therapist</div>
              <div>{detail.therapist?.user?.fullName || detail.therapist?.fullName || '-'}</div>
            </div>
            <div>
              <div className="text-sm text-muted">Payment Expiry</div>
              <div>
                {formatDate(detail.paymentExpiryTime)}
                <span className="text-muted text-sm"> {formatCountdown(detail.paymentExpiryTime)}</span>
              </div>
            </div>
            <div>
              <div className="text-sm text-muted">Instruction</div>
              <div>{formatInstruction(detail.paymentInstruction)}</div>
            </div>
          </div>

          {/* Sessions */}
          {detail.sessions && detail.sessions.length > 0 && (
            <div className="mb-md">
              <div className="text-sm text-muted mb-sm">Sessions</div>
              <div className="flex gap-sm flex-wrap">
                {detail.sessions.map((s) => (
                  <span key={s.id} className={`badge ${s.status === 'COMPLETED' ? '' : s.status === 'FORFEITED' || s.status === 'EXPIRED' ? 'danger' : 'neutral'}`}>
                    #{s.sequenceOrder} {s.status}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-md flex-wrap">
            {/* Force Paid button for PENDING payment (DEV ONLY) */}
            {detail.status === 'PENDING' && detail.paymentStatus === 'PENDING' && (
              <button
                className="btn btn-primary"
                onClick={handleForcePaid}
                disabled={loading}
                style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}
              >
                ⚡ Force Paid (DEV)
              </button>
            )}
            {/* Only show swap button for ongoing bookings (PENDING or PAID, not COMPLETED/CANCELLED) */}
            {(detail.status === 'PENDING' || detail.status === 'PAID') && (
              <button className="btn btn-secondary" onClick={openSwapModal}>
                🔄 Swap Therapist
              </button>
            )}
            {detail.refundStatus === 'PENDING' && (
              <button className="btn btn-primary" onClick={() => setRefundModalOpen(true)}>
                💸 Complete Refund
              </button>
            )}
            <button
              className="btn btn-ghost"
              onClick={() => activeId && loadDetail(activeId)}
              disabled={loading}
            >
              {loading ? 'Refreshing...' : '🔄 Refresh'}
            </button>
          </div>
        </div>
      )}

      {/* Swap Therapist Modal */}
      <Modal
        open={swapModalOpen}
        onClose={() => setSwapModalOpen(false)}
        title="Swap Therapist"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setSwapModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSwapTherapist} disabled={loading || !newTherapistId}>
              {loading ? 'Processing...' : 'Swap'}
            </button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Select New Therapist</label>
          <select
            className="form-select"
            value={newTherapistId}
            onChange={(e) => setNewTherapistId(e.target.value)}
          >
            <option value="">-- Select --</option>
            {therapists
              .filter((t) => t.id !== detail?.therapist?.id)
              .map((t) => (
                <option key={t.id} value={t.id}>
                  {t.user?.fullName || t.id} {t.averageRating ? `(⭐${t.averageRating})` : ''}
                </option>
              ))}
          </select>
        </div>
      </Modal>

      {/* Refund Modal */}
      <Modal
        open={refundModalOpen}
        onClose={() => setRefundModalOpen(false)}
        title="Complete Refund"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setRefundModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleCompleteRefund} disabled={loading}>
              {loading ? 'Processing...' : 'Complete Refund'}
            </button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Refund Reference (opsional)</label>
          <input
            className="form-input"
            value={refundRef}
            onChange={(e) => setRefundRef(e.target.value)}
            placeholder="e.g. TRX123456"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Note (opsional)</label>
          <textarea
            className="form-textarea"
            value={refundNote}
            onChange={(e) => setRefundNote(e.target.value)}
            placeholder="Catatan refund..."
            rows={3}
          />
        </div>
      </Modal>
    </>
  );
}
