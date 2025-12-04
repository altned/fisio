import 'dotenv/config';
import * as jwt from 'jsonwebtoken';

type Args = {
  role?: string;
  sub?: string;
  email?: string;
};

function parseArgs(argv: string[]): Args {
  const args: Args = {};
  argv.forEach((arg) => {
    const [k, v] = arg.replace(/^--/, '').split('=');
    if (!k || !v) return;
    if (k === 'role') args.role = v;
    if (k === 'sub') args.sub = v;
    if (k === 'email') args.email = v;
  });
  return args;
}

function main() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    // eslint-disable-next-line no-console
    console.error('JWT_SECRET belum diset. Isi di .env sebelum generate token.');
    process.exit(1);
  }
  const args = parseArgs(process.argv.slice(2));
  const role = (args.role || 'ADMIN').toUpperCase();
  const sub = args.sub || `demo-${role.toLowerCase()}`;
  const email = args.email;

  const payload: Record<string, string> = { sub, role };
  if (email) payload.email = email;

  const token = jwt.sign(payload, secret, { expiresIn: '7d' });
  // eslint-disable-next-line no-console
  console.log(token);
}

main();
