# Security Review Checklist
- [ ] Auth & Roles: semua endpoint finansial (withdraw, payout enqueue, refund, swap) terlindungi role admin/terapis/pasien sesuai.
- [ ] Input Validation: DTO memvalidasi nilai (amount > 0, rating 1-5, required admin_note).
- [ ] Secret Handling: service account, bank account, JWT secret, WA webhook disimpan di env dan tidak di-commit.
- [ ] Rate Limit / Abuse: tambahkan rate limit untuk booking create/payment confirm/review submit.
- [ ] Data Exposure: endpoint rating/therapist tidak bocorkan data sensitif; chat room metadata tidak memuat info pribadi.
- [ ] Audit Logging: aksi admin (refund, withdraw, swap) tercatat (admin_id, reference, note).
- [ ] Transport: pastikan HTTPS di staging/production, CORS konfigurasi aman.
- [ ] Dependency: jalankan npm audit & update paket jika ada vulnerability.
