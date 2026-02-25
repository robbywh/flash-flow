# Testing Documentation

> **Total: 98 tests** (61 backend + 37 frontend)

## Quick Reference

## Quick Reference

Please refer to the **[Root README](../README.md#🧪-testing)** for instructions on how to run automated tests and stress tests.

---

## Backend Tests (`apps/backend`) — 61 tests

### Unit Tests — 45 tests

All unit tests run in-memory using `MockFlashSaleStorage` and `MockFlashSaleRedisStorage`. No database or Redis required.

#### `flash-sale.logic.spec.ts` — Pure Business Logic (18 tests)

| Group | Test | What it verifies |
|-------|------|------------------|
| **computeSaleStatus** | should return upcoming when now is before start | Time-based status calculation |
| | should return active when now is between start and end | |
| | should return active when now equals start | Boundary: inclusive start |
| | should return active when now equals end | Boundary: inclusive end |
| | should return ended when now is after end | |
| **canAttemptPurchase** | should allow purchase when sale is active, stock available, no existing purchase | Happy path |
| | should deny when sale is upcoming | Pre-sale guard |
| | should deny when sale has ended | Post-sale guard |
| | should deny when stock is zero | Stock exhaustion |
| | should deny when user already purchased | Duplicate prevention |
| | should prioritize sale status over stock check | Error precedence |
| **validateUserId** | should accept valid userId | Identity format check |
| | should accept alphanumeric username | Alphanumeric support |
| | should reject empty string | Empty input guard |
| | should reject non-string input | Type guard |
| | should reject too short userId | Min length (3 chars) |
| | should reject too long userId | Max length guard |
| | should reject whitespace-only userId | Whitespace guard |

#### `flash-sale.service.spec.ts` — Service Orchestration (21 tests)

| Group | Test | What it verifies |
|-------|------|------------------|
| **getCurrentSale** | should return the current sale with computed status | Sale retrieval + status enrichment |
| | should throw SaleNotFoundError when no sale exists | 404 scenario |
| | should use Redis stock when available | Redis cache hit |
| | should initialize Redis stock from DB when Redis is empty | Cache miss → DB fallback |
| **attemptPurchase** | should successfully purchase when sale is active and stock available | Happy path (end-to-end service flow) |
| | should throw SaleNotFoundError when no sale | Missing sale guard |
| | should throw SaleNotActiveError when sale is upcoming | Pre-sale guard |
| | should throw AlreadyPurchasedError on duplicate purchase | Idempotency guard |
| | should throw SoldOutError when stock is exhausted | Stock guard |
| | should handle and re-throw storage errors | Error re-mapping (AlreadyPurchased/SoldOut) |
| | should handle and re-throw generic errors | UNHANDLED mapping |
| | should throw validation error for empty userId | Input validation |
| | should throw validation error for short userId | Input validation |
| | should decrement stock for each purchase | Stock accounting |
| **checkUserPurchase** | should return purchased: true when user has purchased | Lookup hit |
| | should return purchased: false when user has not purchased | Lookup miss |
| | should throw SaleNotFoundError when no sale | Missing sale guard |
| | should throw validation error for invalid userId | Input validation |

#### `http-exception.filter.spec.ts` — Global Error Handling (5 tests)

| Test | What it verifies |
|------|------------------|
| should handle FlashSaleError with custom codes | Standard error mapping |
| should handle BadRequestException from validation | Pipe error mapping |
| should handle generic Error (non-HttpException) | 500 mapping |
| should handle Error with .status property | Status code extraction |
| should use exception.message if response object message is missing | Message extraction |

#### `custom-throttler.guard.spec.ts` — Rate Limiting (1 test)

| Test | What it verifies |
|------|------------------|
| should throw FlashSaleError with 429 and RATE_LIMIT_EXCEEDED | Custom rate limit response |

### Integration Tests — 3 tests

#### `flash-sale.storage.pg.integration.spec.ts` — PostgreSQL Storage

Integration tests using **Testcontainers** for a real PostgreSQL instance.

| Test | What it verifies |
|------|------------------|
| should not allow duplicate purchase (UQ constraint) | Database integrity |
| should handle race conditions for last item | Atomic stock decrement |
| should return SOLD_OUT via updateMany check | Stock exhaustion guard |

### E2E Tests — 13 tests

E2E tests spin up a real NestJS app with **Testcontainers** (PostgreSQL + Redis). Each test hits actual HTTP endpoints via Supertest.

#### `flash-sale.e2e.spec.ts` — Full HTTP Integration

| Group | Test | What it verifies |
|-------|------|------------------|
| **GET /current** | should return 404 when no sale exists | Missing sale error |
| | should return the current active sale | Full HTTP → DB → Response pipeline |
| | should return upcoming status for future sale | Status computation through the stack |
| | should return ended status for past sale | End state rendering |
| **POST /current/purchase** | should successfully purchase when sale is active | Full purchase flow (HTTP → Redis → DB) |
| | should reject duplicate purchase from same user | Idempotency through the full stack |
| | should reject purchase when sale is not active | Pre-sale guard at HTTP layer |
| | should reject purchase when sold out | Stock exhaustion through Redis |
| | should reject invalid userId | Input validation at HTTP layer |
| | should decrement stock after purchase | Stock accounting through Redis |
| **GET /current/purchase** | should return purchased: true when user has purchased | Purchase check endpoint |
| | should return purchased: false when user has not purchased | Negative lookup |
| | should reject invalid userId | Validation at HTTP layer |

---

## Frontend Tests (`apps/web`) — 37 tests

All frontend tests use **Vitest** + **React Testing Library** + **jsdom**. No browser or backend server required.

### Unit Tests — 24 tests

#### `PurchaseButton.spec.tsx` — Purchase Button States (8 tests)

| Test | What it verifies |
|------|------------------|
| shows "Buy Now" when sale is active and userId is valid | Happy path: enabled button |
| shows "Buy Now" (disabled) when userId is empty | Disabled state when empty |
| shows "Buy Now" (disabled) when userId < 3 chars | Disabled state when too short |
| shows "Sale Not Started" when saleStatus is upcoming | Pre-sale disabled state |
| shows "Sale Ended" when saleStatus is ended | Post-sale disabled state |
| shows "Processing..." when loading is true | Loading spinner + disabled |
| calls onPurchase when clicked with valid state | Click handler invocation |
| does NOT call onPurchase when button is disabled | Click guard |

#### `PurchaseResult.spec.tsx` — Purchase Result Display (5 tests)

| Test | What it verifies |
|------|------------------|
| renders nothing when success is null | Null state → no DOM output |
| renders nothing when message is null | Partial null → no DOM output |
| shows success banner with purchase ID | Green success modal + Order ID |
| shows success banner without purchase ID | Success modal without optional field |
| shows failure banner with error message | Red error modal + message |

#### `SaleStatus.spec.tsx` — Sale Status Display (11 tests)

| Test | What it verifies |
|------|------------------|
| shows loading spinner when loading | Loading state indicator |
| renders nothing when sale is null and not loading | Empty state |
| shows "LIVE NOW" badge for active sale | Active status badge + product info |
| shows "Coming Soon" badge for upcoming sale | Upcoming status badge |
| shows "Sale Ended" badge for ended sale | Ended status badge |
| stock bar is green/amber/red based on stock | Visual thresholds |
| **Timer updates every second** | **Countdown logic (Fake Timers)** |
| **Shows 00:00:00 on expiry** | **Boundary logic** |
| **Countdown to start time** | **Upcoming sale logic** |

### Integration Tests — 13 tests

#### `index.spec.tsx` — Flash Sale Page (8 tests)

Verifies high-level orchestration, navigation, and modal state transitions.

| Group | Test | What it verifies |
|-------|------|------------------|
| **Core Flows** | loads and displays the sale status | Mount → API load → UI render |
| | executes successful purchase flow | Input → Click → Success Modal |
| | **handleReset clears the state** | **Reset button → UI return to neutral** |
| **Validation** | displays error modal when rate limited | 429 error mapping |
| | displays error modal when sold out | 409 error mapping |
| | **clears error on typing** | **Input change → State cleanup** |
| | **shows short userId warning** | **Live validation message** |
| **System** | shows system alert when initial load fails | Global failure state |

#### `flash-sale.api.backend.spec.ts` — HTTP Adapter (5 tests)

Tests the `FlashSaleApiBackend` class by mocking `global.fetch`. Verifies correct URL construction, request bodies, and response parsing.

| Group | Test | What it verifies |
|-------|------|------------------|
| **getCurrentSale** | fetches current sale and returns parsed data | GET URL + response unwrapping |
| | throws with error message on server error | Error body extraction |
| **attemptPurchase** | sends POST with userId and returns purchase result | POST method + JSON body + response |
| | throws with error message when already purchased | 409 error handling |
| **checkUserPurchase** | fetches purchase status with userId query param | Query param encoding |

---

## CI Pipeline

The [GitHub Actions workflow](../.github/workflows/test.yml) runs on every push/PR to `main`:

```
1. Install dependencies
2. Generate Prisma Client
3. Run Linting (Turborepo — all apps)
4. Run Backend Unit Tests (45 tests)
5. Run Web Unit Tests (24 tests)
6. Run Backend E2E Tests (13 tests, via Testcontainers)
7. Run Backend Integration Tests (3 tests, via Testcontainers)
```

---

## Code Coverage

We strive for deep coverage of core business logic and critical UI components. Coverage is tracked using the **v8** provider with refined exclusions to ensure "truthful" metrics (boilerplate, barrel files, and types are excluded).

### Current Statistics

| Scope | Stmts % | Branch % | Funcs % | Lines % |
|-------|---------|----------|----------|----------|
| **Backend** | ~98.36% | ~92.00% | 100% | ~99.43% |
| **Frontend** | ~97.56% | ~91.52% | 90.00% | ~97.56% |

### How to Run

Refer to the **[Root README](../README.md#🧪-testing)** for coverage run commands.

### Targets

- **Core Logic (`.logic.ts`, `.service.ts`)**: >98% (Excluding external drivers)
- **UI Components (`.tsx`)**: >95% (Excluding boilerplate/router)
- **Interceptors/Filters**: 100% (Critical system paths)

---

## Stress Testing (k6)

### Purpose

The flash sale system's core promise is **safe concurrent stock management** — hundreds of users competing for limited items without overselling, double-purchases, or data corruption. Stress testing validates this promise under realistic production-like load.

### What It Validates

| Concern | How the stress test proves it |
|---------|-------------------------------|
| **No overselling** | Total `201 Purchased` responses ≤ available stock |
| **No duplicate purchases** | Same userId never gets two `201`s — subsequent attempts get `409` |
| **Redis atomicity** | `DECR` correctly gates stock under concurrent writes |
| **PostgreSQL integrity** | Advisory lock + transaction prevents race conditions |
| **Latency under load** | p95 response time stays under 1 second |
| **Graceful degradation** | After stock runs out, all requests get `409 SOLD_OUT` instantly |

### Script Location

[`e2e/stress/flash-sale.stress.js`](../e2e/stress/flash-sale.stress.js)

### Load Profile

The script simulates a realistic flash sale traffic pattern with 3 stages:

```
Users
 200 ┤                 ┌──────────────────────┐
     │                /                        \
  50 ┤         ┌─────┘                          \
     │        /                                  \
   0 ┤───────┘                                    └──────
     └──────────┬──────────────┬──────────────┬──────────
              10s            20s            40s        50s
            Ramp-up      Sustained         Cool-down
```

| Stage | Duration | Virtual Users | Purpose |
|-------|----------|---------------|---------|
| Ramp-up | 10s | 0 → 50 | Gradual load increase |
| Sustained peak | 30s | 50 → 200 | Max concurrent buyers |
| Cool-down | 10s | 200 → 0 | Graceful wind-down |

### Custom Metrics

| Metric | Description |
|--------|-------------|
| `purchase_success` | Requests that returned `201 Created` |
| `purchase_duplicate` | Requests that returned `409 Already Purchased` |
| `purchase_sold_out` | Requests that returned `409 SOLD_OUT` |
| `purchase_rate_limited` | Requests that returned `429 Too Many Requests` |
| `purchase_errors` | Unexpected response codes |
| `purchase_duration` | End-to-end request timing |

### Pass/Fail Thresholds

| Threshold | Condition |
|-----------|-----------|
| `http_req_duration` | p95 < 1000ms |
| `http_req_failed` | Rate < 1% (network-level failures) |
| `purchase_success` | Count > 0 (at least some purchases succeed) |

### How to Run

Refer to the **[Root README](../README.md#2-stress-testing-k6)** for instructions on setting up and running stress tests.

### Sample Output

```
╔══════════════════════════════════════════════════╗
║         Flash Flow — Stress Test Results          ║
╠══════════════════════════════════════════════════╣
║  Total Requests:         4582                    ║
║  ✅ Purchased:            100                    ║
║  🔁 Duplicate (409):       15                    ║
║  🚫 Sold Out (409):      3200                    ║
║  ⏳ Rate Limited:        1267                    ║
║  ❌ Errors:                  0                    ║
║                                                  ║
║  p95 Latency:    45ms                            ║
║  p99 Latency:    82ms                            ║
║  Avg Latency:    12ms                            ║
╚══════════════════════════════════════════════════╝
```
