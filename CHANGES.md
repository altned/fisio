# Changelog

# Changelog

## 2024-04-XX (Rencana Migrasi Midtrans Core API)
- Pembayaran manual (transfer/QR statis + upload bukti/confirm admin) akan digantikan Midtrans Core API.
- Env baru: `MIDTRANS_SERVER_KEY`, `MIDTRANS_CLIENT_KEY`, `MIDTRANS_IS_PRODUCTION` (hapus kebutuhan `COMPANY_BANK_*`, `QRIS_IMAGE_URL`).
- Endpoint target:
  - `POST /payment/initiate` → create charge Midtrans (VA/QR/e-wallet), simpan token/instruksi/expiry.
  - `POST /webhooks/midtrans` → verifikasi signature, set booking PAID/EXPIRED/CANCELLED idempoten; tidak ada `payment/proof` atau `payment/confirm`.
- Booking acceptance/timeout tetap berjalan setelah status `PAID` dari webhook.

## 2024-03-XX
- Ubah flow pembayaran ke transfer bank & QRIS statis (hilangkan Midtrans).
- Env baru: `COMPANY_BANK_NAME`, `COMPANY_BANK_ACCOUNT`, `COMPANY_BANK_ACCOUNT_NAME`, `QRIS_IMAGE_URL`.
- Endpoint payment:
  - `POST /payment/initiate` (pilih metode BANK_TRANSFER/QRIS, kembalikan instruksi).
  - `POST /payment/proof` (unggah URL bukti bayar ke booking).
  - `POST /payment/confirm` (admin menandai PAID).
- Skema booking: tambah `payment_method`, `payment_proof_url`; migrasi `1710000001000-add-payment-columns.ts`.
- Hapus webhook Midtrans dan DTO terkait.

## 2024-03-XX (Refund & Acceptance)
- Tambah kolom refund di bookings: `refund_status` (NONE/PENDING/COMPLETED), `refund_reference`, `refund_note`, `refunded_at`; migrasi `1710000003000-add-refund-columns.ts`.
- Tambah kolom acceptance: `booking_type`, `therapist_respond_by`, `therapist_accepted_at`, status `CANCELLED`; migrasi `1710000002000-add-booking-acceptance.ts`.
- Terapis accept/decline:
  - `POST /bookings/accept`
  - `POST /bookings/decline` → set status CANCELLED + refund_status PENDING.
- Admin refund completion: `POST /admin/bookings/refund` (isi reference/note, set refund_status=COMPLETED).

## 2024-03-XX (Wallet & Admin Ops)
- Payout pro-rata per sesi COMPLETED/FORFEITED dengan idempotensi `is_payout_distributed`; kategori SESSION_FEE/FORFEIT_COMPENSATION.
- Wallet stats bulanan: `GET /wallets/:id/stats/monthly`.
- Admin withdraw manual: `POST /admin/wallets/:id/withdraw` (wajib admin_note).
- Swap therapist: `PATCH /admin/bookings/:id/swap-therapist` (update booking + sesi pending/scheduled).

## 2024-03-XX (Therapist Timeout)
- Endpoint `POST /bookings/timeout/run` untuk auto-timeout terapis (PAID & tidak respon sampai therapist_respond_by) → booking CANCELLED + refund_status PENDING.
