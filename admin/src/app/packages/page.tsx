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
    promoImageUrl: string | null;
    showOnDashboard: boolean;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
};

type FormData = {
    name: string;
    sessionCount: string;
    totalPrice: string;
    commissionRate: string;
    promoImageUrl: string;
    showOnDashboard: boolean;
};

const initialFormData: FormData = {
    name: '',
    sessionCount: '1',
    totalPrice: '',
    commissionRate: '30',
    promoImageUrl: '',
    showOnDashboard: false,
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
            console.log('[DEBUG] Packages data:', JSON.stringify(data, null, 2));
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
            promoImageUrl: pkg.promoImageUrl || '',
            showOnDashboard: pkg.showOnDashboard || false,
        });
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setEditingId(null);
        setFormData(initialFormData);
    };

    const handleInputChange = (field: keyof FormData, value: string | boolean) => {
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
                promoImageUrl: formData.promoImageUrl.trim() || undefined,
                showOnDashboard: formData.showOnDashboard,
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

    const handleToggleActive = async (id: string, currentStatus: boolean) => {
        if (!adminToken) return;

        try {
            await apiFetch(
                API_BASE_URL,
                `/admin/packages/${id}/toggle-active`,
                { method: 'PATCH', tokenOverride: adminToken }
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
                                <th>Status</th>
                                <th>Promo</th>
                                <th>Dibuat</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {packages.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className={styles.emptyRow}>
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
                                        <td>
                                            {pkg.isActive !== false ? (
                                                <span className="badge" style={{ background: '#10b981', color: 'white' }}>✓ Aktif</span>
                                            ) : (
                                                <span className="badge" style={{ background: '#ef4444', color: 'white' }}>✗ Nonaktif</span>
                                            )}
                                        </td>
                                        <td>
                                            {pkg.showOnDashboard ? (
                                                <span className="badge" style={{ background: '#3b82f6', color: 'white' }}>✓ Promo</span>
                                            ) : (
                                                <span className="badge" style={{ background: '#94a3b8', color: 'white' }}>-</span>
                                            )}
                                        </td>
                                        <td className="text-muted text-sm">
                                            {new Date(pkg.createdAt).toLocaleDateString('id-ID')}
                                        </td>
                                        <td className={styles.tableActions}>
                                            <button
                                                className={`btn btn-sm ${pkg.isActive !== false ? 'btn-ghost' : 'btn-success'}`}
                                                onClick={() => handleToggleActive(pkg.id, pkg.isActive !== false)}
                                                title={pkg.isActive !== false ? 'Nonaktifkan package' : 'Aktifkan package'}
                                            >
                                                {pkg.isActive !== false ? '🔒 Nonaktifkan' : '🔓 Aktifkan'}
                                            </button>
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

                    <hr style={{ margin: '1rem 0', borderColor: 'var(--color-border)' }} />
                    <h4 style={{ marginBottom: '1rem', color: 'var(--color-text-secondary)' }}>🎯 Promo Banner (Dashboard Patient)</h4>

                    <div className={styles.formGroup}>
                        <label htmlFor="promoImage">Upload Gambar Promo</label>
                        <input
                            id="promoImage"
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;

                                // Validate file size (max 5MB)
                                if (file.size > 5 * 1024 * 1024) {
                                    setError('Ukuran file maksimal 5MB');
                                    return;
                                }

                                // Upload file
                                try {
                                    setError(null);
                                    const formDataUpload = new FormData();
                                    formDataUpload.append('image', file);

                                    const response = await fetch(`${API_BASE_URL}/upload/promo`, {
                                        method: 'POST',
                                        headers: {
                                            'Authorization': `Bearer ${adminToken}`,
                                        },
                                        body: formDataUpload,
                                    });

                                    if (!response.ok) {
                                        throw new Error('Upload gagal');
                                    }

                                    const result = await response.json();
                                    handleInputChange('promoImageUrl', result.url);
                                } catch (err) {
                                    setError('Gagal upload gambar: ' + (err as Error).message);
                                }
                            }}
                            style={{ padding: '0.5rem' }}
                        />
                        <small className="text-muted">
                            Format: JPG, PNG, WebP | Ukuran: max 5MB | Dimensi ideal: <strong>1200 x 675 px</strong> (16:9)
                        </small>

                        {/* Preview current image */}
                        {formData.promoImageUrl && (
                            <div style={{ marginTop: '0.75rem' }}>
                                <img
                                    src={formData.promoImageUrl}
                                    alt="Preview"
                                    style={{
                                        maxWidth: '100%',
                                        maxHeight: '150px',
                                        borderRadius: '8px',
                                        border: '1px solid var(--color-border)'
                                    }}
                                />
                                <button
                                    type="button"
                                    className="btn btn-ghost btn-sm"
                                    onClick={() => handleInputChange('promoImageUrl', '')}
                                    style={{ marginLeft: '0.5rem' }}
                                >
                                    🗑️ Hapus
                                </button>
                            </div>
                        )}
                    </div>

                    <div className={styles.formGroup}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={formData.showOnDashboard}
                                onChange={(e) => handleInputChange('showOnDashboard', e.target.checked)}
                                style={{ width: 'auto' }}
                            />
                            Tampilkan di Dashboard Patient
                        </label>
                        <small className="text-muted">Jika aktif, paket ini akan muncul di carousel promo dashboard patient</small>
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
