# Security Review Checklist
- [x] Auth & Roles: endpoint finansial (withdraw, payout manual, refund, swap, payment confirm) dilindungi JWT + role (ADMIN/THERAPIST/PATIENT sesuai).
- [x] Input Validation: DTO memvalidasi nilai (amount > 0, rating 1-5, required admin_note).
- [ ] Secret Handling: pastikan env (JWT_SECRET, COMPANY_BANK_*, QRIS_IMAGE_URL, WA_WEBHOOK_URL, FIREBASE_CREDENTIALS_PATH, ALLOWED_ORIGINS) diset via secret store, bukan di repo; verifikasi `.env` staging/prod tersimpan aman.
- [x] Rate Limit / Abuse: throttling di booking create/accept/decline, payment initiate/proof/confirm, review submit; global limiter 100 req/60s; CORS origin whitelist via `ALLOWED_ORIGINS`.
- [x] Data Exposure: endpoint therapist kini hanya expose id/fullName/rating/total_reviews (tanpa email/fcm_token); chat metadata perlu verifikasi manual.
- [x] Audit Logging: aksi admin (refund, withdraw, swap, manual payout, topup) tercatat (admin_action_logs).
- [ ] Transport: pastikan HTTPS di staging/production; CORS sudah diaktifkan, perlu verifikasi konfigurasi reverse proxy.
- [x] Dependency: npm audit high severity dibersihkan (node-forge).
- [x] Webhook Signature: guard HMAC-SHA256 tersedia (`WebhookSignatureGuard`) untuk endpoint inbound; gunakan `WEBHOOK_SECRET`, header `X-Signature` (opsional `X-Timestamp` ±5m); contoh di `/webhooks/test`.
