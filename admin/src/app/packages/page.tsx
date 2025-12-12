'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSettingsStore, API_BASE_URL } from '../../store/settings';
import { apiFetch } from '../../lib/api';
import { useRequireAuth } from '../../lib/useRequireAuth';
import { Modal } from '../../components/Modal';
import styles from './page.module.css';

type Package = {
    id: string;
    name: string;
    sessionCount: number;
    totalPrice: string;
    commissionRate: string;
    createdAt: string;
    updatedAt: string;
};

type FormData = {
    name: string;
    sessionCount: string;
    totalPrice: string;
    commissionRate: string;
};

const initialFormData: FormData = {
    name: '',
    sessionCount: '1',
    totalPrice: '',
    commissionRate: '30',
};

export default function PackagesPage() {
    const { adminToken, hydrate } = useSettingsStore();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [packages, setPackages] = useState<Package[]>([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<FormData>(initialFormData);
    const [saving, setSaving] = useState(false);
    const { ready } = useRequireAuth();

    useEffect(() => {
        hydrate();
    }, [hydrate]);

    const loadPackages = useCallback(async () => {
        if (!adminToken) return;
        setLoading(true);
        setError(null);

        try {
            const data = await apiFetch<Package[]>(
                API_BASE_URL,
                '/admin/packages',
                { tokenOverride: adminToken }
            );
            setPackages(data);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    }, [adminToken]);

    useEffect(() => {
        if (adminToken) {
            loadPackages();
        }
    }, [adminToken, loadPackages]);

    const openCreateModal = () => {
        setEditingId(null);
        setFormData(initialFormData);
        setModalOpen(true);
    };

    const openEditModal = (pkg: Package) => {
        setEditingId(pkg.id);
        setFormData({
            name: pkg.name,
            sessionCount: pkg.sessionCount.toString(),
            totalPrice: pkg.totalPrice,
            commissionRate: pkg.commissionRate || '30',
        });
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setEditingId(null);
        setFormData(initialFormData);
    };

    const handleInputChange = (field: keyof FormData, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!adminToken) return;

        setSaving(true);
        setError(null);

        try {
            const payload = {
                name: formData.name.trim(),
                sessionCount: parseInt(formData.sessionCount, 10),
                totalPrice: formData.totalPrice,
                commissionRate: formData.commissionRate,
            };

            if (editingId) {
                await apiFetch(
                    API_BASE_URL,
                    `/admin/packages/${editingId}`,
                    { method: 'PATCH', body: payload, tokenOverride: adminToken }
                );
            } else {
                await apiFetch(
                    API_BASE_URL,
                    '/admin/packages',
                    { method: 'POST', body: payload, tokenOverride: adminToken }
                );
            }

            closeModal();
            loadPackages();
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Hapus package "${name}"?`)) return;
        if (!adminToken) return;

        try {
            await apiFetch(
                API_BASE_URL,
                `/admin/packages/${id}`,
                { method: 'DELETE', tokenOverride: adminToken }
            );
            loadPackages();
        } catch (err) {
            setError((err as Error).message);
        }
    };

    const formatPrice = (price: string) => {
        const num = parseFloat(price);
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(num);
    };

    if (!ready) return null;

    return (
        <>
            <header className="page-header">
                <div>
                    <h1>Packages</h1>
                    <p>Kelola paket sesi terapi</p>
                </div>
                <div className={styles.headerActions}>
                    <button className="btn btn-primary" onClick={openCreateModal}>
                        + Tambah Package
                    </button>
                    <button className="btn btn-ghost" onClick={loadPackages} disabled={loading}>
                        {loading ? 'Loading...' : '🔄 Refresh'}
                    </button>
                </div>
            </header>

            {error && <div className="alert alert-error">{error}</div>}

            <div className="card">
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Nama Package</th>
                                <th>Jumlah Sesi</th>
                                <th>Harga</th>
                                <th>Komisi</th>
                                <th>Dibuat</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {packages.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className={styles.emptyRow}>
                                        {loading ? 'Loading...' : 'Belum ada package. Klik "Tambah Package" untuk membuat.'}
                                    </td>
                                </tr>
                            ) : (
                                packages.map((pkg) => (
                                    <tr key={pkg.id}>
                                        <td><strong>{pkg.name}</strong></td>
                                        <td>
                                            <span className={styles.sessionBadge}>
                                                {pkg.sessionCount} Sesi
                                            </span>
                                        </td>
                                        <td className={styles.priceCell}>{formatPrice(pkg.totalPrice)}</td>
                                        <td>
                                            <span className={styles.sessionBadge}>
                                                {pkg.commissionRate || 30}%
                                            </span>
                                        </td>
                                        <td className="text-muted text-sm">
                                            {new Date(pkg.createdAt).toLocaleDateString('id-ID')}
                                        </td>
                                        <td className={styles.tableActions}>
                                            <button
                                                className="btn btn-secondary btn-sm"
                                                onClick={() => openEditModal(pkg)}
                                            >
                                                ✏️ Edit
                                            </button>
                                            <button
                                                className="btn btn-danger btn-sm"
                                                onClick={() => handleDelete(pkg.id, pkg.name)}
                                            >
                                                🗑️ Hapus
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal open={modalOpen} onClose={closeModal} title={editingId ? 'Edit Package' : 'Tambah Package'}>
                <form onSubmit={handleSubmit}>
                    <div className={styles.formGroup}>
                        <label htmlFor="name">Nama Package</label>
                        <input
                            id="name"
                            type="text"
                            value={formData.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            placeholder="contoh: Reguler 1 Sesi"
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="sessionCount">Jumlah Sesi</label>
                        <input
                            id="sessionCount"
                            type="number"
                            min="1"
                            value={formData.sessionCount}
                            onChange={(e) => handleInputChange('sessionCount', e.target.value)}
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="totalPrice">Harga Total (Rupiah)</label>
                        <input
                            id="totalPrice"
                            type="number"
                            min="0"
                            step="1000"
                            value={formData.totalPrice}
                            onChange={(e) => handleInputChange('totalPrice', e.target.value)}
                            placeholder="contoh: 350000"
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="commissionRate">Komisi Platform (%)</label>
                        <input
                            id="commissionRate"
                            type="number"
                            min="0"
                            max="100"
                            step="1"
                            value={formData.commissionRate}
                            onChange={(e) => handleInputChange('commissionRate', e.target.value)}
                            placeholder="30"
                            required
                        />
                        <small className="text-muted">Persentase yang diterima platform (sisanya untuk therapist)</small>
                    </div>

                    <div className={styles.formActions}>
                        <button type="button" className="btn btn-ghost" onClick={closeModal}>
                            Batal
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={saving}>
                            {saving ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Tambah Package'}
                        </button>
                    </div>
                </form>
            </Modal>
        </>
    );
}
