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

## Docker Compose (PostgreSQL & Redis)
1. Dari root repo: `docker compose up -d`
2. Pastikan `.env` backend menggunakan URL:
   - `DATABASE_URL=postgresql://fisio:fisio@localhost:5432/fisio`
   - `REDIS_URL=redis://localhost:6379`
3. Jalankan migrasi, lalu start dev server seperti langkah di atas.

## Payment (Bank Transfer & QRIS Statis)
- Konfigurasi env:
  - `COMPANY_BANK_NAME=...`
  - `COMPANY_BANK_ACCOUNT=...`
  - `COMPANY_BANK_ACCOUNT_NAME=...`
  - `QRIS_IMAGE_URL=...` (link ke gambar QR statis)
- Flow: Backend memberikan instruksi pembayaran (rekening/QRIS) pada init; user dapat upload bukti bayar (URL gambar); admin menandai `PAID` setelah verifikasi manual.
- Endpoint:
  - `POST /payment/initiate` (pilih metode BANK_TRANSFER/QRIS, kembalikan instruksi rekening/QRIS)
  - `POST /payment/proof` (kirim URL bukti bayar)
  - `POST /payment/confirm` (admin menandai PAID setelah verifikasi)

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
- Event hooks tersedia (instant booking, accept/decline/timeout, payout, swap therapist). Jika device token diberikan di payload, FCM akan dikirim; jika tidak, fallback log.
