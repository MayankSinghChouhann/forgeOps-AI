import http from 'k6/http'
import { check, fail, sleep } from 'k6'

const baseUrl = __ENV.BASE_URL || 'http://localhost:8080'

export const options = {
  scenarios: {
    non_ai: {
      executor: 'constant-vus',
      exec: 'nonAi',
      vus: 450,
      duration: __ENV.DURATION || '2m',
    },
    ai: {
      executor: 'constant-vus',
      exec: 'ai',
      vus: 50,
      duration: __ENV.DURATION || '2m',
    },
  },
  thresholds: {
    'http_req_failed{endpoint:non_ai}': ['rate<0.01'],
    'http_req_duration{endpoint:non_ai}': ['p(95)<2000'],
    'http_req_failed{endpoint:ai}': ['rate<0.05'],
    'http_req_duration{endpoint:ai}': ['p(95)<8000'],
  },
}

export function setup() {
  if (!__ENV.TEST_EMAIL || !__ENV.TEST_PASSWORD) {
    fail('TEST_EMAIL and TEST_PASSWORD are required')
  }

  const response = http.post(`${baseUrl}/api/auth/login`, JSON.stringify({
    email: __ENV.TEST_EMAIL,
    password: __ENV.TEST_PASSWORD,
  }), { headers: { 'Content-Type': 'application/json' } })

  check(response, { 'load-test login succeeds': (result) => result.status === 200 })
  if (response.status !== 200) fail(`Login failed with HTTP ${response.status}`)
  return { accessToken: response.json('accessToken') }
}

export function nonAi(data) {
  const response = http.get(`${baseUrl}/api/dashboard/metrics`, {
    headers: { Authorization: `Bearer ${data.accessToken}` },
    tags: { endpoint: 'non_ai' },
  })
  check(response, { 'dashboard responds': (result) => result.status === 200 })
  sleep(1)
}

export function ai(data) {
  const response = http.post(`${baseUrl}/api/terminal/explain`, JSON.stringify({
    command: 'kubectl get pods --all-namespaces',
  }), {
    headers: {
      Authorization: `Bearer ${data.accessToken}`,
      'Content-Type': 'application/json',
    },
    tags: { endpoint: 'ai' },
  })
  check(response, { 'AI safety endpoint responds': (result) => result.status === 200 })
  sleep(1)
}
