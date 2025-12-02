Admin web untuk Fisioku Prime Care (Next.js App Router).

## Getting Started

1. Salin env:

```bash
cp .env.example .env.local
# set NEXT_PUBLIC_API_BASE_URL (backend) dan NEXT_PUBLIC_ADMIN_TOKEN (JWT role ADMIN, staging/dev)
```

2. Jalankan dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

Lihat `app/page.tsx` untuk landing awal admin dan `src/lib/api.ts` untuk helper fetcher.

## API access
- Base URL: `NEXT_PUBLIC_API_BASE_URL`
- Auth: `NEXT_PUBLIC_ADMIN_TOKEN` (sementara, gunakan token ADMIN staging/dev saja)
- Fetch helper: `src/lib/api.ts`, env helper `src/lib/env.ts`

## Next Steps
- Implement layout + auth shell (input base URL/token, simpan di localStorage).
- Bangun halaman Booking list/detail + aksi (confirm payment, swap, schedule sesi).
- Tambah Wallet (topup/withdraw/transaksi) dan Admin action logs.
