import 'dotenv/config';
import crypto from 'crypto';

type Args = {
  orderId?: string;
  amount?: string;
  status?: string;
  statusCode?: string;
  url?: string;
};

const DEFAULT_URL = 'http://localhost:3000/webhooks/midtrans';

function parseArgs(argv: string[]): Args {
  const args: Args = {};
  argv.forEach((arg) => {
    const [k, v] = arg.replace(/^--/, '').split('=');
    if (!k || !v) return;
    if (k === 'orderId') args.orderId = v;
    if (k === 'amount') args.amount = v;
    if (k === 'status') args.status = v;
    if (k === 'statusCode') args.statusCode = v;
    if (k === 'url') args.url = v;
  });
  return args;
}

async function main() {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  if (!serverKey) {
    // eslint-disable-next-line no-console
    console.error('MIDTRANS_SERVER_KEY belum diset');
    process.exit(1);
  }

  const args = parseArgs(process.argv.slice(2));
  const orderId = args.orderId ?? `TEST-ORDER-${Date.now()}`;
  const grossAmount = args.amount ?? '10000.00';
  const status = (args.status ?? 'settlement') as string;
  const statusCode = args.statusCode ?? '200';
  const url = args.url ?? DEFAULT_URL;

  const payload: Record<string, unknown> = {
    order_id: orderId,
    status_code: statusCode,
    gross_amount: grossAmount,
    transaction_status: status,
  };

  const signature = crypto
    .createHash('sha512')
    .update(`${orderId}${statusCode}${grossAmount}${serverKey}`)
    .digest('hex');
  payload.signature_key = signature;

  const fetchMod = await import('node-fetch');
  const res = await fetchMod.default(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await res.json();
  // eslint-disable-next-line no-console
  console.log(`-> ${res.status}`, body);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
