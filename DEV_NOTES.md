# 🚧 Development Notes - Fisioku

> [!CAUTION]
> **Dokumen ini berisi fitur-fitur development/testing yang HARUS dihapus atau dinonaktifkan sebelum release ke production!**

---

## Force Payment Endpoint

### Lokasi
- **Controller**: `backend/src/modules/payment/payment.controller.ts`
- **Service**: `backend/src/modules/payment/payment.service.ts`

### Endpoint
```
POST /payment/force-paid/:bookingId
Authorization: Bearer <jwt_token>
```

### Deskripsi
Endpoint ini memungkinkan skip pembayaran Midtrans dan langsung set booking ke status `PAID` untuk testing end-to-end.

### Cara Penggunaan
```bash
# Dapatkan token dari login
# Ganti BOOKING_ID dengan ID booking yang ingin di-force paid

curl -X POST http://localhost:3000/payment/force-paid/BOOKING_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Safety Measures
1. ✅ Endpoint hanya aktif jika `NODE_ENV !== 'production'`
2. ✅ Memerlukan JWT authentication
3. ✅ Log warning di console saat digunakan

---

## Checklist Sebelum Production Release

- [ ] **Hapus atau nonaktifkan endpoint `POST /payment/force-paid/:bookingId`**
  - File: `backend/src/modules/payment/payment.controller.ts`
  - Hapus method `forcePaid()`
  
- [ ] **Hapus method `forcePaymentPaid()` dari service**
  - File: `backend/src/modules/payment/payment.service.ts`
  
- [ ] **Pastikan `NODE_ENV=production`** di environment variable production

- [ ] **Setup Midtrans Production Keys**
  - Ganti `MIDTRANS_SERVER_KEY` dengan production server key
  - Ganti `MIDTRANS_CLIENT_KEY` dengan production client key
  - Set `MIDTRANS_IS_PRODUCTION=true`

- [ ] **Setup Webhook Midtrans Production**
  - Daftarkan webhook URL production di Midtrans Dashboard
  - URL: `https://your-domain.com/payment/webhook`

- [ ] **Hapus file ini (`DEV_NOTES.md`)** atau pindahkan ke `.gitignore`

---

## Midtrans Sandbox Testing (Alternatif)

Jika ingin test dengan Midtrans Sandbox tanpa force-paid:

1. Buka [Midtrans Sandbox Simulator](https://simulator.sandbox.midtrans.com/)
2. Pilih payment method yang digunakan (QRIS, VA, dll)
3. Masukkan Order ID atau VA Number
4. Klik "Pay" untuk simulasi pembayaran sukses

---

*Last updated: 2025-12-11*
