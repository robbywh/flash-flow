# Testing Documentation

> **Total: 74 tests** (47 backend + 27 frontend)

## Quick Reference

```bash
# Run all backend tests (unit + E2E)
cd apps/backend && npm run test

# Run only backend E2E (requires Docker for Testcontainers)
cd apps/backend && npm run test:e2e

# Run all frontend tests
cd apps/web && npm run test

# Run everything via CI
# Triggered automatically on push/PR to main
```

---

## Backend Tests (`apps/backend`) — 47 tests

### Unit Tests — 34 tests

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
| **validateUserId** | should accept valid userId | Valid email format |
| | should accept alphanumeric username | Valid username format |
| | should reject empty string | Empty input guard |
| | should reject non-string input | Type guard |
| | should reject too short userId | Min length (3 chars) |
| | should reject too long userId | Max length guard |
| | should reject whitespace-only userId | Whitespace guard |

#### `flash-sale.service.spec.ts` — Service Orchestration (16 tests)

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
| | should throw validation error for empty userId | Input validation |
| | should throw validation error for short userId | Input validation |
| | should decrement stock for each purchase | Stock accounting |
| **checkUserPurchase** | should return purchased: true when user has purchased | Lookup hit |
| | should return purchased: false when user has not purchased | Lookup miss |
| | should throw SaleNotFoundError when no sale | Missing sale guard |
| | should throw validation error for invalid userId | Input validation |

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

## Frontend Tests (`apps/web`) — 27 tests

All frontend tests use **Vitest** + **React Testing Library** + **jsdom**. No browser or backend server required.

### Unit Tests — Components (22 tests)

#### `PurchaseButton.spec.tsx` — Purchase Button States (8 tests)

| Test | What it verifies |
|------|------------------|
| shows "Buy Now" when sale is active and userId is valid | Happy path: enabled button |
| shows "Enter your User ID" when userId is empty | Disabled state + label |
| shows "User ID too short" when userId < 3 chars | Validation feedback |
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
| shows success banner with purchase ID | Green success banner + Order ID |
| shows success banner without purchase ID | Success without optional field |
| shows failure banner with error message | Red error banner + message |

#### `SaleStatus.spec.tsx` — Sale Status Display (9 tests)

| Test | What it verifies |
|------|------------------|
| shows loading spinner when loading | Loading state indicator |
| shows error message | Error state rendering |
| renders nothing when sale is null and not loading | Empty state |
| shows "LIVE NOW" badge for active sale | Active status badge + product info |
| shows "Coming Soon" badge for upcoming sale | Upcoming status badge |
| shows "Sale Ended" badge for ended sale | Ended status badge |
| stock bar is green when >50% | Visual threshold: healthy stock |
| stock bar is amber when 20-50% | Visual threshold: low stock |
| stock bar is red when <20% | Visual threshold: critical stock |

### Integration Tests — API Adapter (5 tests)

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
4. Run Backend Unit Tests (34 tests)
5. Run Web Unit Tests (27 tests)
6. Run Backend E2E Tests (13 tests, via Testcontainers)
```
