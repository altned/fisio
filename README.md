# Fisioku Prime Care

## Struktur
- `PROJECT_BLUEPRINT.md` — aturan bisnis dan desain sistem.
- `DEVELOPMENT_CHECKLIST.md` — tahapan pengembangan.
- `backend/` — layanan backend NestJS (scaffold Phase 0).

## Menjalankan Backend (Dev)
1. Masuk ke folder backend: `cd backend`.
2. Salin env contoh: `cp .env.example .env` lalu sesuaikan.
3. Instal dependensi: `npm install` (atau `pnpm install`/`yarn install`).
4. Jalankan dev server: `npm run start:dev`.
5. Cek health endpoint: `GET http://localhost:3000/health`.

> Catatan: Butuh PostgreSQL & Redis sesuai konfigurasi env sebelum melanjutkan fase berikutnya.

## Migrations (Phase 1)
- Jalankan migrasi: `npm run migration:run`
- Revert migrasi terakhir: `npm run migration:revert`
- File data source: `src/config/data-source.ts`

## Seed Data
- Jalankan: `npm run seed`
- Isi contoh:
  - Admin: `admin@example.com`
  - Pasien: `patient@example.com`
  - Terapis: `therapist@example.com` + wallet
  - Paket: Single Session (1), 4-Session Package (4)
- Buat JWT dummy: `npm run token:issue -- --role=ADMIN --sub=<userId>` (butuh `JWT_SECRET` di env)

## Docker Compose (PostgreSQL & Redis)
1. Dari root repo: `docker compose up -d`
2. Pastikan `.env` backend menggunakan URL:
   - `DATABASE_URL=postgresql://fisio:fisio@localhost:5432/fisio`
   - `REDIS_URL=redis://localhost:6379`
3. Jalankan migrasi, lalu start dev server seperti langkah di atas.

## Payment (Midtrans Core API)
- Konfigurasi env:
  - `MIDTRANS_SERVER_KEY=...`
  - `MIDTRANS_CLIENT_KEY=...`
  - `MIDTRANS_IS_PRODUCTION=false|true`
- Flow: Backend membuat transaksi via Midtrans Core (`order_id = booking.id`, `gross_amount = totalPrice`), mengembalikan instruksi channel (VA/QR/e-wallet) ke klien. Status `PAID` hanya di-set melalui webhook Midtrans dengan verifikasi signature.
- Endpoint (target):
  - `POST /payment/initiate` — buat charge Midtrans, kembalikan instruksi/token/expiry.
  - `POST /webhooks/midtrans` — terima notifikasi Midtrans, verifikasi signature, set status booking (settlement/capture → PAID; expire/cancel/deny → CANCELLED + refund_status PENDING).
- Upload bukti & confirm manual tidak dipakai lagi (legacy).

## Acceptance & Refund
- Acceptance/decline terapis:
  - `POST /bookings/accept` (therapistId, bookingId) — SLA respon: 5 menit (instant), 30 menit (regular).
  - `POST /bookings/decline` — booking di-set CANCELLED + refund_status PENDING.
- Admin menyelesaikan refund:
  - `POST /admin/bookings/refund` (bookingId, adminId, refundReference?, refundNote?) → set refund_status=COMPLETED, catat reference/note.

## Admin Ops
- Swap terapis: `PATCH /admin/bookings/:id/swap-therapist` (body: newTherapistId) — update booking + sesi pending/scheduled.
- Withdraw manual ke terapis: `POST /admin/wallets/:id/withdraw` (amount, adminNote wajib, catat transaksi DEBIT kategori WITHDRAWAL).

## Notifikasi
- Siapkan FCM:
  - Letakkan service account JSON di `backend/firebase-service-account.json` (jangan di-commit).
  - Env: `FIREBASE_CREDENTIALS_PATH=./firebase-service-account.json`
  - Opsional: `FIREBASE_CHAT_COLLECTION=chats`
- Event hooks tersedia (instant booking, accept/decline/timeout, payout, swap therapist). Jika device token diberikan di payload, FCM akan dikirim; jika tidak, fallback ke WA webhook (jika `WA_WEBHOOK_URL` di-set) atau log.
- ChatService terintegrasi Firestore: openRoom/closeRoom menyimpan status room berdasarkan bookingId.

## Cron / Jobs
- Menggunakan BullMQ (Redis): pastikan `REDIS_URL` sudah diset.
- Queue & processor:
  - `booking-expiry`: set sesi PENDING_SCHEDULING → EXPIRED jika booking >30 hari.
  - `chat-lock`: set `is_chat_active=false` jika `chat_locked_at` lewat.
  - `therapist-timeout`: batalkan booking PAID yang melewati therapistRespondBy (refund pending).
- Scheduler: repeatable jobs diset otomatis saat modul job init:
  - booking-expiry: daily 00:00
  - chat-lock: setiap 15 menit
  - therapist-timeout: setiap 5 menit

## Testing
- Jalankan unit test: `npm test`
- Test yang tersedia: validasi slot/lead time, utilitas respond SLA dan chat lock time. Tambahkan test lanjutan untuk payout idempotency, forfeit/expiry, monthly stats sesuai kebutuhan.

## Therapist Rating
- Endpoint:
  - `GET /therapists` — daftar terapis beserta rating cached.
  - `GET /therapists/:id` — detail terapis beserta rating cached.
