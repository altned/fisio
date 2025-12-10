'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSettingsStore, API_BASE_URL } from '../../store/settings';
import { apiFetch } from '../../lib/api';
import { useRequireAuth } from '../../lib/useRequireAuth';
import { Modal } from '../../components/Modal';
import styles from './page.module.css';

const BIDANG_OPTIONS = [
    'Fisioterapi Muskuloskeletal',
    'Fisioterapi Neuromuskular',
    'Fisioterapi Kardiopulmoner',
    'Fisioterapi Pediatrik',
    'Fisioterapi Geriatrik',
    'Fisioterapi Olahraga',
];

type Therapist = {
    id: string;
    bidang: string | null;
    phone: string | null;
    address: string | null;
    photoUrl: string | null;
    strNumber: string | null;
    experienceYears: number;
    bio: string | null;
    isActive: boolean;
    averageRating: string;
    totalReviews: number;
    createdAt: string;
    user: { id: string; email: string; fullName: string };
};

type CreateFormData = {
    email: string;
    fullName: string;
    password: string;
    bidang: string;
    phone: string;
    address: string;
    strNumber: string;
    experienceYears: string;
    bio: string;
};

type EditFormData = {
    bidang: string;
    phone: string;
    address: string;
    strNumber: string;
    experienceYears: string;
    bio: string;
};

const initialCreateForm: CreateFormData = {
    email: '',
    fullName: '',
    password: '',
    bidang: '',
    phone: '',
    address: '',
    strNumber: '',
    experienceYears: '0',
    bio: '',
};

export default function TherapistsPage() {
    const { adminToken, hydrate } = useSettingsStore();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [therapists, setTherapists] = useState<Therapist[]>([]);
    const [filterBidang, setFilterBidang] = useState('');
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [createForm, setCreateForm] = useState<CreateFormData>(initialCreateForm);
    const [saving, setSaving] = useState(false);

    // Edit state
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingTherapist, setEditingTherapist] = useState<Therapist | null>(null);
    const [editForm, setEditForm] = useState<EditFormData>({
        bidang: '', phone: '', address: '', strNumber: '', experienceYears: '0', bio: ''
    });

    // Reset password state
    const [resetPasswordModalOpen, setResetPasswordModalOpen] = useState(false);
    const [resetPasswordTherapist, setResetPasswordTherapist] = useState<Therapist | null>(null);
    const [newPassword, setNewPassword] = useState('');

    const { ready } = useRequireAuth();

    useEffect(() => {
        hydrate();
    }, [hydrate]);

    const loadTherapists = useCallback(async () => {
        if (!adminToken) return;
        setLoading(true);
        setError(null);

        try {
            const data = await apiFetch<Therapist[]>(
                API_BASE_URL,
                '/admin/therapists',
                { tokenOverride: adminToken }
            );
            setTherapists(data);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    }, [adminToken]);

    useEffect(() => {
        if (adminToken) {
            loadTherapists();
        }
    }, [adminToken, loadTherapists]);

    const handleCreateFormChange = (field: keyof CreateFormData, value: string) => {
        setCreateForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleEditFormChange = (field: keyof EditFormData, value: string) => {
        setEditForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!adminToken) return;

        setSaving(true);
        setError(null);

        try {
            const payload = {
                email: createForm.email.trim(),
                fullName: createForm.fullName.trim(),
                password: createForm.password,
                bidang: createForm.bidang || undefined,
                phone: createForm.phone.trim() || undefined,
                address: createForm.address.trim() || undefined,
                strNumber: createForm.strNumber.trim() || undefined,
                experienceYears: parseInt(createForm.experienceYears, 10) || 0,
                bio: createForm.bio.trim() || undefined,
            };

            await apiFetch(
                API_BASE_URL,
                '/admin/therapists',
                { method: 'POST', body: payload, tokenOverride: adminToken }
            );

            setCreateModalOpen(false);
            setCreateForm(initialCreateForm);
            loadTherapists();
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setSaving(false);
        }
    };

    const openEditModal = (t: Therapist) => {
        setEditingTherapist(t);
        setEditForm({
            bidang: t.bidang || '',
            phone: t.phone || '',
            address: t.address || '',
            strNumber: t.strNumber || '',
            experienceYears: t.experienceYears.toString(),
            bio: t.bio || '',
        });
        setEditModalOpen(true);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!adminToken || !editingTherapist) return;

        setSaving(true);
        setError(null);

        try {
            const payload = {
                bidang: editForm.bidang || undefined,
                phone: editForm.phone.trim() || undefined,
                address: editForm.address.trim() || undefined,
                strNumber: editForm.strNumber.trim() || undefined,
                experienceYears: parseInt(editForm.experienceYears, 10) || 0,
                bio: editForm.bio.trim() || undefined,
            };

            await apiFetch(
                API_BASE_URL,
                `/admin/therapists/${editingTherapist.id}`,
                { method: 'PATCH', body: payload, tokenOverride: adminToken }
            );

            setEditModalOpen(false);
            setEditingTherapist(null);
            loadTherapists();
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setSaving(false);
        }
    };

    const openResetPasswordModal = (t: Therapist) => {
        setResetPasswordTherapist(t);
        setNewPassword('');
        setResetPasswordModalOpen(true);
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!adminToken || !resetPasswordTherapist || !newPassword) return;

        setSaving(true);
        setError(null);

        try {
            await apiFetch(
                API_BASE_URL,
                `/admin/therapists/${resetPasswordTherapist.id}/reset-password`,
                { method: 'PATCH', body: { newPassword }, tokenOverride: adminToken }
            );

            setResetPasswordModalOpen(false);
            setResetPasswordTherapist(null);
            setNewPassword('');
            setSuccess('Password berhasil direset!');
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setSaving(false);
        }
    };

    const handleToggleStatus = async (id: string) => {
        if (!adminToken) return;

        try {
            await apiFetch(
                API_BASE_URL,
                `/admin/therapists/${id}/status`,
                { method: 'PATCH', tokenOverride: adminToken }
            );
            loadTherapists();
        } catch (err) {
            setError((err as Error).message);
        }
    };

    const filteredTherapists = filterBidang
        ? therapists.filter((t) => t.bidang === filterBidang)
        : therapists;

    if (!ready) return null;

    return (
        <>
            <header className="page-header">
                <div>
                    <h1>Therapists</h1>
                    <p>Kelola fisioterapis terdaftar</p>
                </div>
                <div className={styles.headerActions}>
                    <button className="btn btn-primary" onClick={() => setCreateModalOpen(true)}>
                        + Tambah Therapist
                    </button>
                    <button className="btn btn-ghost" onClick={loadTherapists} disabled={loading}>
                        {loading ? 'Loading...' : '🔄 Refresh'}
                    </button>
                </div>
            </header>

            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            <div className={styles.filterBar}>
                <select value={filterBidang} onChange={(e) => setFilterBidang(e.target.value)}>
                    <option value="">Semua Bidang</option>
                    {BIDANG_OPTIONS.map((b) => (
                        <option key={b} value={b}>{b}</option>
                    ))}
                </select>
            </div>

            <div className="card">
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Nama</th>
                                <th>Bidang</th>
                                <th>Phone</th>
                                <th>Rating</th>
                                <th>Status</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTherapists.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className={styles.emptyRow}>
                                        {loading ? 'Loading...' : 'Belum ada therapist. Klik "Tambah Therapist" untuk registrasi.'}
                                    </td>
                                </tr>
                            ) : (
                                filteredTherapists.map((t) => (
                                    <tr key={t.id}>
                                        <td>
                                            <div className={styles.therapistInfo}>
                                                <span className={styles.therapistName}>{t.user.fullName}</span>
                                                <span className={styles.therapistEmail}>{t.user.email}</span>
                                            </div>
                                        </td>
                                        <td>
                                            {t.bidang ? (
                                                <span className={styles.bidangBadge}>{t.bidang.replace('Fisioterapi ', '')}</span>
                                            ) : '-'}
                                        </td>
                                        <td>{t.phone || '-'}</td>
                                        <td>
                                            <div className={styles.ratingCell}>
                                                ⭐ {parseFloat(t.averageRating).toFixed(1)} ({t.totalReviews})
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`${styles.statusBadge} ${t.isActive ? styles.active : styles.inactive}`}>
                                                {t.isActive ? 'Aktif' : 'Nonaktif'}
                                            </span>
                                        </td>
                                        <td className={styles.tableActions}>
                                            <button
                                                className="btn btn-secondary btn-sm"
                                                onClick={() => openEditModal(t)}
                                            >
                                                ✏️ Edit
                                            </button>
                                            <button
                                                className="btn btn-secondary btn-sm"
                                                onClick={() => openResetPasswordModal(t)}
                                            >
                                                🔑 Reset
                                            </button>
                                            <button
                                                className={`btn btn-sm ${t.isActive ? 'btn-danger' : 'btn-secondary'}`}
                                                onClick={() => handleToggleStatus(t.id)}
                                            >
                                                {t.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Modal */}
            <Modal open={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Tambah Therapist">
                <form onSubmit={handleCreateSubmit}>
                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label htmlFor="email">Email</label>
                            <input
                                id="email"
                                type="email"
                                value={createForm.email}
                                onChange={(e) => handleCreateFormChange('email', e.target.value)}
                                placeholder="therapist@example.com"
                                required
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label htmlFor="password">Password</label>
                            <input
                                id="password"
                                type="password"
                                value={createForm.password}
                                onChange={(e) => handleCreateFormChange('password', e.target.value)}
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="fullName">Nama Lengkap</label>
                        <input
                            id="fullName"
                            type="text"
                            value={createForm.fullName}
                            onChange={(e) => handleCreateFormChange('fullName', e.target.value)}
                            placeholder="Dr. John Doe, S.Ft"
                            required
                        />
                    </div>

                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label htmlFor="bidang">Bidang</label>
                            <select
                                id="bidang"
                                value={createForm.bidang}
                                onChange={(e) => handleCreateFormChange('bidang', e.target.value)}
                            >
                                <option value="">Pilih Bidang</option>
                                {BIDANG_OPTIONS.map((b) => (
                                    <option key={b} value={b}>{b}</option>
                                ))}
                            </select>
                        </div>
                        <div className={styles.formGroup}>
                            <label htmlFor="experienceYears">Pengalaman (tahun)</label>
                            <input
                                id="experienceYears"
                                type="number"
                                min="0"
                                value={createForm.experienceYears}
                                onChange={(e) => handleCreateFormChange('experienceYears', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label htmlFor="phone">Nomor Telepon</label>
                            <input
                                id="phone"
                                type="tel"
                                value={createForm.phone}
                                onChange={(e) => handleCreateFormChange('phone', e.target.value)}
                                placeholder="08123456789"
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label htmlFor="strNumber">Nomor STR</label>
                            <input
                                id="strNumber"
                                type="text"
                                value={createForm.strNumber}
                                onChange={(e) => handleCreateFormChange('strNumber', e.target.value)}
                                placeholder="STR-XXX-XXXXX"
                            />
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="address">Alamat</label>
                        <textarea
                            id="address"
                            value={createForm.address}
                            onChange={(e) => handleCreateFormChange('address', e.target.value)}
                            placeholder="Alamat lengkap therapist"
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="bio">Bio / Deskripsi</label>
                        <textarea
                            id="bio"
                            value={createForm.bio}
                            onChange={(e) => handleCreateFormChange('bio', e.target.value)}
                            placeholder="Deskripsi singkat tentang therapist"
                        />
                    </div>

                    <div className={styles.formActions}>
                        <button type="button" className="btn btn-ghost" onClick={() => setCreateModalOpen(false)}>
                            Batal
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={saving}>
                            {saving ? 'Menyimpan...' : 'Tambah Therapist'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Edit Modal */}
            <Modal open={editModalOpen} onClose={() => setEditModalOpen(false)} title={`Edit: ${editingTherapist?.user.fullName || ''}`}>
                <form onSubmit={handleEditSubmit}>
                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label htmlFor="editBidang">Bidang</label>
                            <select
                                id="editBidang"
                                value={editForm.bidang}
                                onChange={(e) => handleEditFormChange('bidang', e.target.value)}
                            >
                                <option value="">Pilih Bidang</option>
                                {BIDANG_OPTIONS.map((b) => (
                                    <option key={b} value={b}>{b}</option>
                                ))}
                            </select>
                        </div>
                        <div className={styles.formGroup}>
                            <label htmlFor="editExperience">Pengalaman (tahun)</label>
                            <input
                                id="editExperience"
                                type="number"
                                min="0"
                                value={editForm.experienceYears}
                                onChange={(e) => handleEditFormChange('experienceYears', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label htmlFor="editPhone">Nomor Telepon</label>
                            <input
                                id="editPhone"
                                type="tel"
                                value={editForm.phone}
                                onChange={(e) => handleEditFormChange('phone', e.target.value)}
                                placeholder="08123456789"
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label htmlFor="editStrNumber">Nomor STR</label>
                            <input
                                id="editStrNumber"
                                type="text"
                                value={editForm.strNumber}
                                onChange={(e) => handleEditFormChange('strNumber', e.target.value)}
                                placeholder="STR-XXX-XXXXX"
                            />
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="editAddress">Alamat</label>
                        <textarea
                            id="editAddress"
                            value={editForm.address}
                            onChange={(e) => handleEditFormChange('address', e.target.value)}
                            placeholder="Alamat lengkap therapist"
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="editBio">Bio / Deskripsi</label>
                        <textarea
                            id="editBio"
                            value={editForm.bio}
                            onChange={(e) => handleEditFormChange('bio', e.target.value)}
                            placeholder="Deskripsi singkat tentang therapist"
                        />
                    </div>

                    <div className={styles.formActions}>
                        <button type="button" className="btn btn-ghost" onClick={() => setEditModalOpen(false)}>
                            Batal
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={saving}>
                            {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Reset Password Modal */}
            <Modal open={resetPasswordModalOpen} onClose={() => setResetPasswordModalOpen(false)} title={`Reset Password: ${resetPasswordTherapist?.user.fullName || ''}`}>
                <form onSubmit={handleResetPassword}>
                    <div className={styles.formGroup}>
                        <label htmlFor="newPassword">Password Baru</label>
                        <input
                            id="newPassword"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Masukkan password baru"
                            required
                            minLength={6}
                        />
                    </div>

                    <div className={styles.formActions}>
                        <button type="button" className="btn btn-ghost" onClick={() => setResetPasswordModalOpen(false)}>
                            Batal
                        </button>
                        <button type="submit" className="btn btn-danger" disabled={saving || !newPassword}>
                            {saving ? 'Menyimpan...' : 'Reset Password'}
                        </button>
                    </div>
                </form>
            </Modal>
        </>
    );
}
