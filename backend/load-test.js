import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
  scenarios: {
    // Ramp up from 0 to 100 users
    ramp_up: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 20 },   // Warm up
        { duration: '20s', target: 50 },   // Ramp to 50
        { duration: '20s', target: 100 },  // Ramp to 100
        { duration: '10s', target: 0 },    // Cool down
      ],
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],       // Less than 1% failure rate
    http_req_duration: ['p(95)<500'],     // 95% of requests under 500ms
  },
};

export default function () {
  // Test the health endpoint (public, no auth)
  const healthRes = http.get('http://localhost:5001/api/health');
  check(healthRes, {
    'health status is 200': (r) => r.status === 200,
  });

  // Test the farms endpoint (public for now, or use token)
  const farmsRes = http.get('http://localhost:5001/api/farms');
  check(farmsRes, {
    'farms status is 200 or 401': (r) => r.status === 200 || r.status === 401,
  });

  sleep(1);
}
