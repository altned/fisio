"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./bookings.module.css";
import { SettingsBar } from "../../components/SettingsBar";
import { useSettingsStore } from "../../store/settings";
import { apiFetch } from "../../lib/api";
import type { Booking, Paginated } from "../../types/booking";

const statusOptions = ["", "PENDING", "PAID", "COMPLETED", "CANCELLED"];

export default function BookingsPage() {
  const { apiBaseUrl } = useSettingsStore();
  const [status, setStatus] = useState<string>("");
  const [therapistId, setTherapistId] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Paginated<Booking> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (therapistId) params.set("therapistId", therapistId);
    if (userId) params.set("userId", userId);
    params.set("page", String(page));
    params.set("limit", "20");
    return params.toString();
  }, [status, therapistId, userId, page]);

  useEffect(() => {
    if (!apiBaseUrl) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);
    apiFetch<Paginated<Booking>>(apiBaseUrl, `/bookings?${queryString}`)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Gagal memuat booking");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [apiBaseUrl, queryString]);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Bookings</p>
          <h1>Daftar Booking</h1>
          <p className={styles.subtitle}>Filter berdasarkan status/therapist/user. Aksi lain menyusul.</p>
        </div>
      </div>

      <SettingsBar />

      <section className={styles.filters}>
        <div>
          <label>Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            {statusOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt || "Semua"}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>Therapist ID</label>
          <input value={therapistId} onChange={(e) => setTherapistId(e.target.value)} placeholder="uuid" />
        </div>
        <div>
          <label>User ID</label>
          <input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="uuid" />
        </div>
      </section>

      {loading && <div className={styles.notice}>Memuat...</div>}
      {error && <div className={styles.error}>{error}</div>}
      {!loading && !error && data && (
        <>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Status</th>
                  <th>Terapis</th>
                  <th>Pasien</th>
                  <th>Dibuat</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((b) => (
                  <tr key={b.id}>
                    <td className={styles.mono}>{b.id}</td>
                    <td>{b.status}</td>
                    <td className={styles.mono}>{b.therapist?.id}</td>
                    <td className={styles.mono}>{b.user?.id}</td>
                    <td>{b.createdAt ? new Date(b.createdAt).toLocaleString() : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className={styles.pagination}>
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
              Prev
            </button>
            <span>
              Page {page} / {Math.max(1, Math.ceil(data.total / data.limit))}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={data.total <= data.limit * page}
            >
              Next
            </button>
          </div>
        </>
      )}
      {!loading && !error && !data && <div className={styles.notice}>Set API base URL & token untuk memulai.</div>}
    </div>
  );
}
