import styles from "./page.module.css";

const quickLinks = [
  {
    title: "Booking Ops",
    description: "Cari & kelola booking, konfirmasi pembayaran, swap terapis.",
    items: [
      { label: "Booking list", hint: "GET /bookings?status=PAID&therapistId=..." },
      { label: "Confirm payment", hint: "POST /payment/confirm" },
      { label: "Swap therapist", hint: "PATCH /admin/bookings/:id/swap-therapist" },
    ],
  },
  {
    title: "Wallet & Revenue",
    description: "Topup/withdraw manual, payout pro-rata, audit finansial.",
    items: [
      { label: "Wallet topup", hint: "POST /admin/wallets/:id/topup" },
      { label: "Withdraw", hint: "POST /admin/wallets/:id/withdraw" },
      { label: "Manual payout", hint: "POST /admin/sessions/:id/payout" },
    ],
  },
  {
    title: "Audit & Logs",
    description: "Pantau jejak aksi admin dan webhook inbound signature.",
    items: [
      { label: "Admin action logs", hint: "GET /admin/logs" },
      { label: "Webhook test", hint: "POST /webhooks/test (HMAC)" },
      { label: "Queue monitors", hint: "booking-expiry/chat-lock/timeout/payout" },
    ],
  },
];

export default function Home() {
  return (
    <main className={styles.shell}>
      <header className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Fisioku Prime Care · Admin</p>
          <h1>Operasional & Finansial</h1>
          <p className={styles.subtitle}>
            Halaman ini jadi landasan untuk dashboard admin. Mulai dengan mengatur base URL API dan token
            admin, lalu bangun halaman booking, pembayaran, wallet, dan audit.
          </p>
        </div>
        <div className={styles.meta}>
          <div className={styles.metaItem}>
            <span>Env</span>
            <code>NEXT_PUBLIC_API_BASE_URL</code>
            <code>NEXT_PUBLIC_ADMIN_TOKEN</code>
          </div>
          <div className={styles.metaItem}>
            <span>Perlu asap</span>
            <ul>
              <li>Booking list + aksi</li>
              <li>Wallet ops (topup/withdraw)</li>
              <li>Admin action logs</li>
            </ul>
          </div>
        </div>
      </header>

      <section className={styles.grid}>
        {quickLinks.map((section) => (
          <article key={section.title} className={styles.card}>
            <header>
              <h2>{section.title}</h2>
              <p>{section.description}</p>
            </header>
            <ul>
              {section.items.map((item) => (
                <li key={item.label}>
                  <span>{item.label}</span>
                  <code>{item.hint}</code>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section className={styles.nextSteps}>
        <div>
          <h3>Langkah berikutnya</h3>
          <ol>
            <li>Buat client fetcher (Bearer admin token, base URL API backend).</li>
            <li>Bangun halaman Booking List dengan filter & aksi (confirm/swap).</li>
            <li>Tambahkan Wallet detail + topup/withdraw + transaksi.</li>
            <li>Render admin_action_logs untuk audit.</li>
          </ol>
        </div>
        <div className={styles.callout}>
          <p>
            Gunakan endpoint staging dan token ADMIN saja. Hindari data produksi sebelum konfigurasi HTTPS &
            CORS final.
          </p>
        </div>
      </section>
    </main>
  );
}
