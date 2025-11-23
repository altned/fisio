# Changelog

## 2024-03-XX
- Ubah flow pembayaran ke transfer bank & QRIS statis (hilangkan Midtrans).
- Env baru: `COMPANY_BANK_NAME`, `COMPANY_BANK_ACCOUNT`, `COMPANY_BANK_ACCOUNT_NAME`, `QRIS_IMAGE_URL`.
- Endpoint payment:
  - `POST /payment/initiate` (pilih metode BANK_TRANSFER/QRIS, kembalikan instruksi).
  - `POST /payment/proof` (unggah URL bukti bayar ke booking).
  - `POST /payment/confirm` (admin menandai PAID).
- Skema booking: tambah `payment_method`, `payment_proof_url`; migrasi `1710000001000-add-payment-columns.ts`.
- Hapus webhook Midtrans dan DTO terkait.
