# Development Checklist — Fisioku Prime Care

- [x] **Phase 0 — Foundation & Tooling**
  - [x] Set up monorepo/monolith structure (backend NestJS, RN apps, Next.js admin).
  - [x] Configure env management (.env.example) dan secret handling.
  - [x] Pasang lint/format/test runners + CI pipeline.
  - [x] Provision PostgreSQL + Redis (BullMQ) untuk dev/staging.
  - [x] Base auth (JWT), role/guard (patient/therapist/admin), profile completion flag.

- [x] **Phase 1 — Data Model & Migrations**
  - [x] Buat migrations untuk USERS, THERAPISTS (average_rating, total_reviews), PACKAGES, BOOKINGS, SESSIONS, WALLETS, WALLET_TRANSACTIONS, REVIEWS.
  - [x] Tambah kolom snapshot finansial: BOOKINGS.admin_fee_amount, BOOKINGS.therapist_net_total.
  - [x] Tambah kolom locking: BOOKINGS.locked_address, therapist_id (locked), SESSIONS.is_payout_distributed.
  - [x] Seed data awal: akun admin/pasien/terapis + wallet terapis + paket contoh.

- [x] **Phase 2 — Booking Core**
  - [x] Generator/validator slot 90 menit (:00/:30) dengan lead time >1h untuk instant.
  - [x] Implementasi createBooking (regular/instant) dalam DB transaction + pessimistic/serializable locking per slot/terapis.
  - [x] Lock alamat & therapist_id saat booking; enforce pada sesi berikutnya.
  - [x] Profile guard: tolak booking jika user.is_profile_complete = false.
  - [x] Hitung snapshot pricing (admin_fee_amount, therapist_net_total) pada booking create.

- [x] **Phase 3 — Payment & Acceptance**
  - [x] Pembayaran manual: instruksi rekening/QRIS, upload bukti bayar, konfirmasi admin set PAID.
  - [x] Terapis accept/timeout: 5m instant, 30m regular; decline/timeout → booking CANCELLED + refund_status PENDING.
  - [x] Aktivasi chat baseline: set chat_locked_at = scheduled_at + 24h pada payment confirm/accept.

- [ ] **Phase 4 — Session Lifecycle**
  - [x] Transisi status: SCHEDULED → COMPLETED; cancel window >1h; forfeit (<1h/no-show) → FORFEITED.
  - [x] Multi-sesi: sisa kuota jadi PENDING_SCHEDULING; enforce locked address/terapis.
  - [x] Expiry: booking usia >30 hari → sesi PENDING_SCHEDULING menjadi EXPIRED tanpa payout (endpoint expire).
  - [x] Chat lock otomatis 24h setelah sesi terakhir (update chat_locked_at).

- [ ] **Phase 5 — Wallet & Revenue Split**
  - [x] Payout pro-rata: unit = therapist_net_total / total_sessions; trigger pada COMPLETED/FORFEITED.
  - [x] Implement topUpWallet dalam 1 DB transaction: update WALLETS.balance + WALLET_TRANSACTIONS + set SESSIONS.is_payout_distributed (idempoten).
  - [x] Kategori transaksi: SESSION_FEE, FORFEIT_COMPENSATION, WITHDRAWAL; DEBIT wajib admin_note.
  - [x] Monthly stats query: SUM(amount) WHERE type='CREDIT' AND month(created_at)=current_month (tanpa reset tabel).

- [ ] **Phase 6 — Admin Ops**
  - [x] Endpoint PATCH /admin/bookings/:id/swap-therapist: update locked_therapist di BOOKINGS + therapist_id di SESSIONS (pending/scheduled).
  - [x] Admin withdraw/transfer manual: form dengan admin_note wajib; tampilkan admin_note di riwayat terapis.
  - [x] Refund flow untuk decline/timeout; audit log aksi finansial (data tersimpan via refund_status/reference/note).
  - [x] Notifikasi swap therapist (stub service, siap integrasi ke push/WA).
  - [x] Auto-timeout terapis (5m instant, 30m regular) → booking CANCELLED + refund_status PENDING.

- [ ] **Phase 7 — Review & Rating**
  - [x] Endpoint submitReview: transaksi insert REVIEWS + hitung ulang average_rating & total_reviews (atomik).
  - [x] Expose rating cached di list/detil terapis; mekanisme satu review per booking.

- [ ] **Phase 8 — Notification & Chat**
  - [x] Event hooks/stub notification (InstantRequest, BookingAccepted/Declined/Timeout, PayoutSuccess, SwapTherapist).
  - [x] Integrasi push (FCM) via service account; fallback log; siap pakai device token user.fcm_token.
  - [ ] Chat lifecycle: buka saat SCHEDULED, kunci saat chat_locked_at lewat (handler ada; integrasi chat provider pending).

- [ ] **Phase 9 — Automation (Cron/Jobs)**
  - [x] handlePackageExpiry: endpoint `/bookings/expire/run` set sessions PENDING_SCHEDULING → EXPIRED jika booking >30d; tanpa payout.
  - [x] handleChatLock: endpoint `/bookings/chat-lock/run` set is_chat_active=false jika chat_locked_at < now.
  - [x] Queue/processor BullMQ untuk expiry, chat lock, therapist timeout (booking-expiry, chat-lock, therapist-timeout).
  - [x] Scheduler repeat jobs: expiry (harian 00:00), chat lock (15m), therapist timeout (5m).
  - [ ] Job retry payout/webhook failure + monitoring/alerting.

- [ ] **Phase 10 — QA & Hardening**
  - [ ] Unit/integration tests: booking lock, payout idempotency, forfeit path, expiry, monthly stats query, webhook signature.
  - [x] Unit tests dasar: slot alignment/lead time, respond SLA, chat lock time.
  - [ ] Load/perf test slot search & wallet ops; security review authz terutama endpoint finansial.
  - [ ] Staging verification checklist: booking→payout happy path, forfeit payout, expiry no-payout, admin swap-therapist, admin withdraw with note.
