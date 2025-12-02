import { SettingsBar } from "../components/SettingsBar";
import styles from "./page.module.css";

const cards = [
  {
    title: "Booking Ops",
    description: "Cari & kelola booking, konfirmasi pembayaran, swap/jadwalkan sesi.",
    items: [
      { label: "Booking list", hint: "GET /bookings?status=..." },
      { label: "Confirm payment", hint: "POST /payment/confirm" },
      { label: "Swap therapist", hint: "PATCH /admin/bookings/:id/swap-therapist" },
    ],
  },
  {
    title: "Wallet & Revenue",
    description: "Topup/withdraw manual, manual payout per sesi, transaksi & stats.",
    items: [
      { label: "Topup/Withdraw", hint: "POST /admin/wallets/:id/topup|withdraw" },
      { label: "Manual payout", hint: "POST /admin/sessions/:id/payout" },
      { label: "Monthly stats", hint: "GET /wallets/:id/stats/monthly" },
    ],
  },
  {
    title: "Audit & Ops",
    description: "Jejak aksi admin, webhook HMAC, dan trigger job ops.",
    items: [
      { label: "Admin logs", hint: "GET /admin/logs" },
      { label: "Webhook test", hint: "POST /webhooks/test (HMAC)" },
      { label: "Jobs", hint: "/bookings/timeout|expire|chat-lock/run" },
    ],
  },
];

export default function Home() {
  return (
    <main className={styles.shell}>
      <div className={styles.toolbar}>
        <div className={styles.titleGroup}>
          <h1>Fisioku Admin</h1>
          <p>Set API & token untuk mulai mengelola booking, pembayaran, dan wallet.</p>
        </div>
      </div>

      <SettingsBar />

      <section className={styles.grid}>
        {cards.map((card) => (
          <article key={card.title} className={styles.card}>
            <h2>{card.title}</h2>
            <p>{card.description}</p>
            <ul>
              {card.items.map((item) => (
                <li key={item.label}>
                  <span>{item.label}</span>
                  <code>{item.hint}</code>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>
    </main>
  );
}
