import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const ADMIN_TOKEN = __ENV.ADMIN_TOKEN;
const THERAPIST_ID = __ENV.THERAPIST_ID || '';

if (!ADMIN_TOKEN) {
  throw new Error('ADMIN_TOKEN env wajib diisi (Bearer token ADMIN)');
}

export const options = {
  scenarios: {
    search_ramp: {
      executor: 'ramping-arrival-rate',
      startRate: 1,
      timeUnit: '1s',
      preAllocatedVUs: 20,
      stages: [
        { target: 5, duration: '1m' },
        { target: 20, duration: '3m' },
        { target: 0, duration: '1m' },
      ],
    },
  },
};

function queryString() {
  const params = [];
  if (THERAPIST_ID) params.push(`therapistId=${encodeURIComponent(THERAPIST_ID)}`);
  params.push('status=PAID');
  return params.length ? `?${params.join('&')}` : '';
}

export default function () {
  const res = http.get(`${BASE_URL}/bookings${queryString()}`, {
    headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
  });
  check(res, {
    'status 200': (r) => r.status === 200,
    'has data': (r) => Array.isArray(r.json('data')),
  });
  sleep(1);
}
