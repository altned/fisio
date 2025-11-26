# Performance Checklist
- [ ] Load test endpoint booking search/create; periksa slot availability query dengan indeks di sessions.booking_id, sessions.scheduled_at, therapist_id.
- [ ] Payout queue throughput: simulasi batch sesi completed/forfeit, pastikan BullMQ worker stabil.
- [ ] DB index review: bookings(therapist_id, status), sessions(booking_id, therapist_id, status), wallet_transactions(wallet_id, type, created_at).
- [ ] Redis/BullMQ resource: pantau memory/latency pada scheduler 5m/15m/harian.
- [ ] Chat/Firestore: pantau read/write saat lock/open room; set TTL jika perlu untuk logging.
- [ ] Profiling hot path: booking create (locking) dan payment confirm.
