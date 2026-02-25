import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Trend } from 'k6/metrics';

// ─── Custom Metrics ───────────────────────────────────────────────────
const purchaseSuccess = new Counter('purchase_success');
const purchaseDuplicate = new Counter('purchase_duplicate');
const purchaseSoldOut = new Counter('purchase_sold_out');
const purchaseRateLimited = new Counter('purchase_rate_limited');
const purchaseErrors = new Counter('purchase_errors');
const purchaseDuration = new Trend('purchase_duration', true);

// ─── Test Configuration ──────────────────────────────────────────────
//
// Simulates a realistic flash sale scenario:
//   1. Ramp-up   — 50 users arrive over 10s
//   2. Sustained — 200 concurrent users for 30s (peak load)
//   3. Cool-down — ramp back to 0 over 10s
//
export const options = {
    stages: [
        { duration: '10s', target: 50 },   // Ramp-up
        { duration: '30s', target: 200 },  // Sustained peak
        { duration: '10s', target: 0 },    // Cool-down
    ],
    thresholds: {
        http_req_duration: ['p(95)<1000'],         // p95 latency < 1s
        purchase_success: ['count>0'],             // At least some succeed
    },
};

// Default to host.docker.internal for macOS Docker,
// or localhost for native k6 installs
const BASE_URL = __ENV.BASE_URL || 'http://host.docker.internal:3001';

// ─── Test Execution ──────────────────────────────────────────────────
export default function () {
    // Each virtual user + iteration = unique userId
    const userId = `k6-user-${__VU}-${__ITER}`;

    const payload = JSON.stringify({ userId });
    const params = {
        headers: { 'Content-Type': 'application/json' },
    };

    const res = http.post(
        `${BASE_URL}/api/v1/flash-sales/current/purchase`,
        payload,
        params,
    );

    purchaseDuration.add(res.timings.duration);

    // Categorize response
    if (res.status === 201) {
        purchaseSuccess.add(1);
    } else if (res.status === 429) {
        purchaseRateLimited.add(1);
    } else if (res.status === 409 || res.status === 400 || res.status === 404) {
        let errorCode = '';
        try {
            const body = JSON.parse(res.body);
            errorCode = body.error?.code || '';
        } catch (e) {
            // Not JSON
        }

        if (errorCode === 'ALREADY_PURCHASED') {
            purchaseDuplicate.add(1);
        } else if (errorCode === 'SOLD_OUT') {
            purchaseSoldOut.add(1);
        } else if (res.status === 400) {
            // Other validation errors
            purchaseErrors.add(1);
        } else {
            purchaseErrors.add(1);
        }
    } else {
        purchaseErrors.add(1);
    }

    check(res, {
        'status is expected': (r) =>
            [201, 409, 400, 429].includes(r.status),
        'response has body': (r) => r.body && r.body.length > 0,
    });

    // Respect rate limiting — back off when throttled
    if (res.status === 429) {
        sleep(1);
    } else {
        sleep(0.1);
    }
}

// ─── Summary ─────────────────────────────────────────────────────────
export function handleSummary(data) {
    const success = data.metrics.purchase_success
        ? data.metrics.purchase_success.values.count
        : 0;
    const duplicate = data.metrics.purchase_duplicate
        ? data.metrics.purchase_duplicate.values.count
        : 0;
    const soldOut = data.metrics.purchase_sold_out
        ? data.metrics.purchase_sold_out.values.count
        : 0;
    const rateLimited = data.metrics.purchase_rate_limited
        ? data.metrics.purchase_rate_limited.values.count
        : 0;
    const errors = data.metrics.purchase_errors
        ? data.metrics.purchase_errors.values.count
        : 0;
    const total = success + duplicate + soldOut + rateLimited + errors;

    const p95 = data.metrics.http_req_duration?.values['p(95)'];
    const p99 = data.metrics.http_req_duration?.values['p(99)'];
    const avg = data.metrics.http_req_duration?.values.avg;

    const fmt = (v) => (v != null && !isNaN(v) ? String(Math.round(v)) : 'N/A');

    const summary = `
╔══════════════════════════════════════════════════╗
║         Flash Flow — Stress Test Results          ║
╠══════════════════════════════════════════════════╣
║  Total Requests:     ${String(total).padStart(8)}                   ║
║  ✅ Purchased:       ${String(success).padStart(8)}                   ║
║  🔁 Duplicate (409): ${String(duplicate).padStart(8)}                   ║
║  🚫 Sold Out (400):  ${String(soldOut).padStart(8)}                   ║
║  ⏳ Rate Limited:    ${String(rateLimited).padStart(8)}                   ║
║  ❌ Errors:          ${String(errors).padStart(8)}                   ║
║                                                  ║
║  p95 Latency:  ${fmt(p95).padStart(6)}ms                       ║
║  p99 Latency:  ${fmt(p99).padStart(6)}ms                       ║
║  Avg Latency:  ${fmt(avg).padStart(6)}ms                       ║
╚══════════════════════════════════════════════════╝
`;

    return {
        stdout: summary,
    };
}
