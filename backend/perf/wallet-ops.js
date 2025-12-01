import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const ADMIN_TOKEN = __ENV.ADMIN_TOKEN;
const WALLET_ID = __ENV.WALLET_ID;
const MIN_AMOUNT = Number(__ENV.MIN_AMOUNT || '1');
const MAX_AMOUNT = Number(__ENV.MAX_AMOUNT || '5');

if (!ADMIN_TOKEN) {
  throw new Error('ADMIN_TOKEN env wajib diisi (Bearer token ADMIN)');
}
if (!WALLET_ID) {
  throw new Error('WALLET_ID env wajib diisi (gunakan wallet khusus perf/staging)');
}

export const options = {
  scenarios: {
    topup_constant: {
      executor: 'constant-arrival-rate',
      rate: 2,
      timeUnit: '1s',
      duration: '2m',
      preAllocatedVUs: 20,
    },
  },
};

function randomAmount() {
  const min = Math.max(MIN_AMOUNT, 0.01);
  const max = Math.max(MAX_AMOUNT, min);
  const value = Math.random() * (max - min) + min;
  return value.toFixed(2);
}

export default function () {
  const amount = randomAmount();
  const payload = JSON.stringify({
    amount,
    adminNote: `perf-topup-${Date.now()}`,
  });
  const res = http.post(`${BASE_URL}/admin/wallets/${WALLET_ID}/topup`, payload, {
    headers: {
      Authorization: `Bearer ${ADMIN_TOKEN}`,
      'Content-Type': 'application/json',
    },
  });
  check(res, {
    'status 2xx': (r) => r.status >= 200 && r.status < 300,
  });
  sleep(1);
}
