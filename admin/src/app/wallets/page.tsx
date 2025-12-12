'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSettingsStore, API_BASE_URL } from '../../store/settings';
import { apiFetch } from '../../lib/api';
import { useRequireAuth } from '../../lib/useRequireAuth';
import { Modal } from '../../components/Modal';

type Therapist = {
    id: string;
    averageRating?: string;
    user?: { fullName?: string };
};

type Wallet = {
    id: string;
    balance: string;
    therapist?: { id: string };
};

type WalletStats = {
    monthIncome: string;
};

export default function WalletsPage() {
    const { adminToken, hydrate } = useSettingsStore();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [therapists, setTherapists] = useState<Therapist[]>([]);
    const [selectedTherapist, setSelectedTherapist] = useState<Therapist | null>(null);
    const [wallet, setWallet] = useState<Wallet | null>(null);
    const [stats, setStats] = useState<WalletStats | null>(null);
    const [modalType, setModalType] = useState<'topup' | 'withdraw' | null>(null);
    const [amount, setAmount] = useState('');
    const [adminNote, setAdminNote] = useState('');
    const { ready } = useRequireAuth();

    useEffect(() => { hydrate(); }, [hydrate]);

    const loadTherapists = useCallback(async () => {
        if (!API_BASE_URL || !adminToken) return;
        setLoading(true);
        setError(null);

        try {
            const res = await apiFetch<Therapist[]>(
                API_BASE_URL,
                '/therapists',
                { tokenOverride: adminToken }
            );
            setTherapists(res || []);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    }, [API_BASE_URL, adminToken]);

    const loadWalletDetails = useCallback(async (therapistId: string) => {
        if (!API_BASE_URL || !adminToken) return;
        setLoading(true);

        try {
            // Get wallet by therapist ID
            const walletRes = await apiFetch<Wallet>(
                API_BASE_URL,
                `/wallets/by-therapist/${therapistId}`,
                { tokenOverride: adminToken }
            );
            setWallet(walletRes);

            // Then get monthly stats using wallet ID
            if (walletRes?.id) {
                const statsRes = await apiFetch<WalletStats>(
                    API_BASE_URL,
                    `/wallets/${walletRes.id}/stats/monthly`,
                    { tokenOverride: adminToken }
                );
                setStats(statsRes);
            }
        } catch (err) {
            setWallet(null);
            setStats(null);
        } finally {
            setLoading(false);
        }
    }, [API_BASE_URL, adminToken]);

    const handleTopup = async () => {
        if (!selectedTherapist || !amount || !adminNote) {
            setError('Amount dan Admin Note wajib diisi');
            return;
        }
        setLoading(true);
        setError(null);

        try {
            await apiFetch(
                API_BASE_URL,
                `/admin/wallets/${selectedTherapist.id}/topup`,
                {
                    method: 'POST',
                    body: { amount: parseFloat(amount), adminNote },
                    tokenOverride: adminToken,
                }
            );
            setSuccess('Topup berhasil!');
            setModalType(null);
            setAmount('');
            setAdminNote('');
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    const handleWithdraw = async () => {
        if (!selectedTherapist || !amount || !adminNote) {
            setError('Amount dan Admin Note wajib diisi');
            return;
        }
        setLoading(true);
        setError(null);

        try {
            await apiFetch(
                API_BASE_URL,
                `/admin/wallets/${selectedTherapist.id}/withdraw`,
                {
                    method: 'POST',
                    body: { amount: parseFloat(amount), adminNote },
                    tokenOverride: adminToken,
                }
            );
            setSuccess('Withdraw berhasil!');
            setModalType(null);
            setAmount('');
            setAdminNote('');
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (API_BASE_URL && adminToken) loadTherapists();
    }, [API_BASE_URL, adminToken, loadTherapists]);

    if (!ready) return null;

    return (
        <>
            <header className="page-header">
                <h1>Wallets</h1>
                <p>Kelola wallet terapis: topup dan withdraw</p>
            </header>

            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            <div className="flex gap-md mb-md">
                <button className="btn btn-primary" onClick={loadTherapists} disabled={loading}>
                    {loading ? 'Loading...' : '🔄 Refresh'}
                </button>
            </div>

            {/* Therapists Grid */}
            <div className="card-grid">
                {therapists.map((t) => (
                    <div
                        key={t.id}
                        className="stat-card"
                        style={{ cursor: 'pointer' }}
                        onClick={() => {
                            setSelectedTherapist(t);
                            loadWalletDetails(t.id);
                        }}
                    >
                        <div className="stat-label">
                            {t.user?.fullName || 'Unknown Therapist'}
                        </div>
                        <div className="stat-value text-sm">
                            ID: {t.id.slice(0, 8)}...
                        </div>
                        {t.averageRating && (
                            <div className="text-sm text-muted mt-sm">
                                ⭐ {t.averageRating}
                            </div>
                        )}
                    </div>
                ))}

                {therapists.length === 0 && !loading && (
                    <div className="empty-state">
                        <p>No therapists found. Click Refresh to load.</p>
                    </div>
                )}
            </div>

            {/* Selected Therapist Detail */}
            {selectedTherapist && (
                <div className="card mt-lg">
                    <div className="card-header">
                        <h3 className="card-title">
                            Wallet: {selectedTherapist.user?.fullName || selectedTherapist.id}
                        </h3>
                        <button className="btn btn-ghost btn-sm" onClick={() => setSelectedTherapist(null)}>
                            ✕ Close
                        </button>
                    </div>

                    {wallet && (
                        <div className="mb-md">
                            <div className="text-sm text-muted">Saldo Aktif</div>
                            <div className="stat-value" style={{ color: '#16a34a' }}>
                                Rp {parseFloat(wallet.balance || '0').toLocaleString('id-ID')}
                            </div>
                        </div>
                    )}

                    {stats && (
                        <div className="mb-md">
                            <div className="text-sm text-muted">Pendapatan Bulan Ini</div>
                            <div className="stat-value">
                                Rp {parseFloat(stats.monthIncome || '0').toLocaleString('id-ID')}
                            </div>
                        </div>
                    )}

                    <div className="flex gap-md">
                        <button className="btn btn-primary" onClick={() => setModalType('topup')}>
                            ➕ Topup
                        </button>
                        <button className="btn btn-danger" onClick={() => setModalType('withdraw')}>
                            ➖ Withdraw
                        </button>
                    </div>
                </div>
            )}

            {/* Topup/Withdraw Modal */}
            <Modal
                open={modalType !== null}
                onClose={() => { setModalType(null); setAmount(''); setAdminNote(''); }}
                title={modalType === 'topup' ? 'Topup Wallet' : 'Withdraw from Wallet'}
                footer={
                    <>
                        <button className="btn btn-ghost" onClick={() => setModalType(null)}>
                            Cancel
                        </button>
                        <button
                            className={`btn ${modalType === 'topup' ? 'btn-primary' : 'btn-danger'}`}
                            onClick={modalType === 'topup' ? handleTopup : handleWithdraw}
                            disabled={loading || !amount || !adminNote}
                        >
                            {loading ? 'Processing...' : modalType === 'topup' ? 'Topup' : 'Withdraw'}
                        </button>
                    </>
                }
            >
                <div className="form-group">
                    <label className="form-label">Amount (Rp)</label>
                    <input
                        type="number"
                        className="form-input"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="100000"
                    />
                </div>
                <div className="form-group">
                    <label className="form-label">Admin Note (wajib)</label>
                    <textarea
                        className="form-textarea"
                        value={adminNote}
                        onChange={(e) => setAdminNote(e.target.value)}
                        placeholder="Alasan topup/withdraw..."
                        rows={3}
                    />
                </div>
            </Modal>
        </>
    );
}
