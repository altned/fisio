import 'dotenv/config';

type Args = {
  bookingId?: string;
  apiBaseUrl?: string;
  token?: string;
};

function parseArgs(argv: string[]): Args {
  const args: Args = {};
  argv.forEach((arg) => {
    const [k, v] = arg.replace(/^--/, '').split('=');
    if (!k || !v) return;
    if (k === 'bookingId') args.bookingId = v;
    if (k === 'api') args.apiBaseUrl = v;
    if (k === 'token') args.token = v;
  });
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const bookingId = args.bookingId;
  const apiBaseUrl = args.apiBaseUrl ?? process.env.API_BASE_URL;
  const token = args.token ?? process.env.ADMIN_TOKEN;

  if (!bookingId || !apiBaseUrl || !token) {
    console.error('Usage: npm run booking:status -- --bookingId=<id> --api=<base_url> --token=<admin_token>');
    process.exit(1);
  }

  const res = await fetch(`${apiBaseUrl}/bookings/${bookingId}`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  const body = await res.json();
  if (!res.ok) {
    console.error(`Error ${res.status}:`, body);
    process.exit(1);
  }
  console.log(JSON.stringify(body, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
