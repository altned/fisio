# Staging Verification Checklist — Fisioku Prime Care

- [ ] Booking → Payment → Accept → Session complete
  - [ ] Buat booking regular/instant, payment confirm, SLA respond terapis, sesi selesai.
  - [ ] Payout pro-rata masuk wallet (session_fee).
- [ ] Forfeit flow
  - [ ] Cancel <1h atau no-show → status FORFEITED, payout kompensasi masuk wallet (forfeit_compensation).
- [ ] Expiry flow
  - [ ] Booking >30 hari dengan sesi pending → sesi EXPIRED, tidak ada payout.
- [ ] Admin ops
  - [ ] Swap therapist (pending/scheduled) sukses; notifikasi terapis lama/baru & pasien terkirim.
  - [ ] Admin withdraw dengan admin_note tercatat di riwayat transaksi.
- [ ] Chat
  - [ ] Room terbuka saat booking create/accept; tertutup otomatis saat chat_locked_at terlewati (verifikasi di Firestore).
- [ ] Notification
  - [ ] Push/WA webhook terkirim untuk event utama (instant, accept/decline/timeout, payout, swap).
- [ ] Data integrity
  - [ ] Refund status pending/completed sesuai decline/timeout/refund action.
  - [ ] Review submit sekali per booking; rating cached terupdate.
