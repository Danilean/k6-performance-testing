import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';
import http from 'k6/http';
import { check } from 'k6';
import { Trend, Rate } from 'k6/metrics';

export const getContinentsDuration = new Trend('get_continents', true);
export const RateContentOK = new Rate('content_OK');

export const options = {
  thresholds: {
    http_req_failed: ['rate<0.30'],
    get_continents: ['p(95)<5700'],
    content_OK: ['rate>0.95']
  },
  stages: [
    { duration: '1m', target: 10 },
    { duration: '1m', target: 50 },
    { duration: '1m', target: 150 },
    { duration: '1m', target: 250 },
    { duration: '1m', target: 300 }
  ]
};

export function handleSummary(data) {
  return {
    './src/output/index.html': htmlReport(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true })
  };
}

export default function () {
  const baseUrl = 'https://thronesapi.com/api/v2/';
  const params = {
    headers: {
      'Content-Type': 'application/json'
    }
  };
  const OK = 200;

  const resContinents = http.get(`${baseUrl}continents`, params);

  getContinentsDuration.add(resContinents.timings.duration);
  RateContentOK.add(resContinents.status === OK);

  check(resContinents, {
    'GET Continents - Status 200': () => resContinents.status === OK,
    'GET Continents - Content OK': () =>
      resContinents.status === OK && resContinents.json().length > 0
  });
}
