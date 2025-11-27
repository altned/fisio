# Security Review Checklist
- [x] Auth & Roles: endpoint finansial (withdraw, payout manual, refund, swap, payment confirm) dilindungi JWT + role (ADMIN/THERAPIST/PATIENT sesuai).
- [x] Input Validation: DTO memvalidasi nilai (amount > 0, rating 1-5, required admin_note).
- [ ] Secret Handling: service account, bank account, JWT secret, WA webhook disimpan di env dan tidak di-commit (periksa `.env` deployment).
- [x] Rate Limit / Abuse: throttling di booking create/accept/decline, payment initiate/proof/confirm, review submit; global limiter 100 req/60s.
- [ ] Data Exposure: endpoint rating/therapist tidak bocorkan data sensitif; chat room metadata tidak memuat info pribadi (butuh verifikasi manual).
- [x] Audit Logging: aksi admin (refund, withdraw, swap, manual payout) tercatat (admin_action_logs).
- [ ] Transport: pastikan HTTPS di staging/production, CORS konfigurasi aman.
- [ ] Dependency: jalankan npm audit & update paket jika ada vulnerability.
- [ ] Webhook Signature: tambahkan/verifikasi signature untuk webhook (belum ada jika diaktifkan kembali).
