# Frontend Implementation Plan — Admin Web & Mobile Apps

## 1) Ringkasan Backend (yang sudah tersedia)
- **Auth**: JWT + role (ADMIN/THERAPIST/PATIENT) via Bearer token. Rate limit & CORS aktif. Webhook guard HMAC (`WEBHOOK_SECRET`).
- **Booking**:
  - `POST /bookings` (PATIENT) — create booking (slot align, lead time, serializable + pessimistic lock).
  - `POST /bookings/accept|decline` (THERAPIST) — SLA timeout auto-cancel.
  - `GET /bookings` (ADMIN) — search/filter + pagination.
  - `POST /sessions/:id/complete|cancel|schedule` — schedule pending session (PATIENT/ADMIN, ownership check).
  - Ops: `/bookings/timeout/run`, `/bookings/expire/run`, `/bookings/chat-lock/run` (ADMIN).
- **Payment**:
  - `POST /payment/initiate` (PATIENT) — buat transaksi Midtrans Core (VA/QR/e-wallet), kembalikan instruksi/token/expiry.
  - Webhook Midtrans (server) menandai `PAID`/`CANCELLED`/`EXPIRED`; tidak ada upload bukti atau konfirmasi manual.
- **Admin Ops**:
  - `PATCH /admin/bookings/:id/swap-therapist`
  - `POST /admin/bookings/refund`
  - `POST /admin/wallets/:id/withdraw`
  - `POST /admin/wallets/:id/topup`
  - `POST /admin/sessions/:id/payout`
  - `GET /admin/logs` — admin_action_logs.
- **Wallet/Revenue**:
  - Payout auto via queue pada session COMPLETED/FORFEITED.
  - Manual topup/withdraw/payout.
  - `GET /wallets/:id/stats/monthly`.
- **Therapist listing**:
  - `GET /therapists`, `GET /therapists/:id` — hanya expose id, fullName, averageRating, totalReviews.
- **Notification/Chat**: Hooks siap, chat Firestore; ChatService/NotificationService sudah stub/log/fcm/WA.

## 2) Admin Web (Next.js) — Roadmap
### Checklist (tandai saat selesai)
- [x] Setup env (`NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_ADMIN_TOKEN`), fetcher wrapper.
- [x] Layout + auth shell (input base URL/token, simpan di localStorage).
- [x] Booking list + filter/pagination + aksi (lihat status bayar, swap, detail, filter payment_status).
- [x] Booking detail/status pembayaran (read-only Midtrans, auto-refresh PENDING, instruksi channel + countdown).
- [ ] Payment status Midtrans (opsi override mark paid jika darurat).
- [ ] Wallet detail + topup/withdraw + transaksi list.
- [ ] Admin action logs list + filter.
- [ ] Ops utilities (run timeout/expire/chat-lock) + feedback.
- [ ] QA: lint + E2E smoke (booking → init payment → swap → topup → logs).

### Env & Config
- `NEXT_PUBLIC_API_BASE_URL` — base URL backend.
- `NEXT_PUBLIC_ADMIN_TOKEN` — JWT ADMIN untuk sesi dev/staging (sementara; nanti ganti auth proper).
- Fetcher: wrapper `fetch` dengan bearer token + error handling (401/403/429/5xx) + timeout.

### MVP Halaman & Fitur
1. **Auth Shell**
   - Layout dengan field base URL + token (disimpan di localStorage) + proteksi route sederhana.
2. **Booking List**
   - Tabel dengan filter: status, payment_status, therapistId, userId, date range; pagination.
   - Aksi row: lihat status pembayaran Midtrans (token/channel/expiry + countdown), swap therapist (modal pilih therapistId), buka detail.
3. **Booking Detail**
   - Data booking + sessions; aksi: schedule pending session (ADMIN), run accept/decline? (opsional), trigger manual payout (ADMIN) per session.
4. **Payment Ops**
   - Panel detail pembayaran Midtrans: status terbaru, channel instruksi, expiry + countdown, link/token Snap/Core (jika diperlukan), auto-refresh saat PENDING; opsi override mark paid (ADMIN) hanya untuk incident.
5. **Wallet Ops**
   - Wallet detail (balance, monthly stats), transaksi list.
   - Aksi: topup (amount, adminNote), withdraw (amount, adminNote).
6. **Admin Logs**
   - List `admin_action_logs` dengan paging; filter by action/target.
7. **Health/Jobs**
   - Tombol/manual trigger: timeout, expire, chat-lock (ADMIN). Tampilkan status sukses/error.

### UI/UX Catatan
- Loading/error states, debounce pencarian, toast untuk aksi.
- Konfirmasi modal untuk aksi finansial (topup/withdraw/refund/swap/payout).
- Tampilkan rate limit info bila 429.
- Jangan simpan token di repo; hanya di storage lokal/dev env.

### QA
- E2E smoke (Cypress/Playwright) untuk flow: booking list load, confirm payment, swap therapist, topup wallet, lihat logs.
- CORS/HTTPS: pastikan domain admin masuk `ALLOWED_ORIGINS`.

## 3) Mobile Apps (React Native) — Roadmap Ringkas
### Pasien
- Auth + profile completion flag.
- Booking create:
  - Slot selector 90 menit (:00/:30) dengan lead time > 1h untuk instant.
  - Locked address + therapist choice.
  - Payment Midtrans Core: panggil `/payment/initiate`, render instruksi channel (VA/QR/e-wallet) + expiry, tampilkan countdown & tombol copy/QR, polling status atau terima push dari webhook backend.
- Booking detail & sesi:
  - Lihat status booking/sesi; jadwalkan sesi pending (paket) via `/sessions/:id/schedule`.
  - Cancel (sementara belum ada endpoint khusus; gunakan session cancel jika < >1h?).
- Chat: buka/tutup status berdasarkan booking.chatLockedAt (via API), tampilkan info hanya jika Firestore ready.
- Review: submit rating 1–5 satu kali per booking (`/reviews`).
- Notifikasi: gunakan fcm_token untuk push (opsional WA fallback).

### Terapis
- Auth.
- Inbox booking:
  - List booking menunggu respon (PAID) + SLA timer; aksi accept/decline (`/bookings/accept|decline`).
  - Detail booking (locked address/therapist, jadwal).
- Sesi:
  - Mark complete (`/sessions/:id/complete`), lihat jadwal mendatang, lihat forfeit status.
- Wallet:
  - Lihat balance & monthly stats (`/wallets/:id/stats/monthly`), riwayat payout.
- Notifikasi: push instant booking, accept/decline/timeout, payout success.

### Shared Mobile Considerations
- Error handling untuk 401/403/429, retry jaringan.
- Cache ringan untuk list booking/session.
- Jangan simpan secret; token per-user dari backend auth.

## 4) Ops & Non-Fungsional
- Staging: gunakan Postgres/Redis/FCM/WA staging; jalankan `STAGING_CHECKLIST.md`.
- Perf: jalankan k6 skrip (slot-search, wallet-ops) setelah UI live; revisi indeks jika p95/p99 tinggi.
- Security: pastikan secrets via secret store; HTTPS di proxy; uji webhook guard dengan `WEBHOOK_SECRET`.
