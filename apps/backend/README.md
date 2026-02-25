# Flash Flow Backend API (NestJS)

This is the high-throughput server-side component of the Flash Flow system. It handles atomic stock management, purchase validation, and rate limiting.

## Key Features

- **Standardized Response Layer**: Implements global `TransformInterceptor` and `HttpExceptionFilter` for a unified API contract.
- **Vertical Slice Architecture**: Features are organized by domain (e.g., `features/flash-sale`) to maximize modularity.
- **Testability-First**: Logic is separated into pure functions (`.logic.ts`) and I/O orchestration (`.service.ts`).
- **Rugged Error Handling**: Custom `ThrottlerGuard` returning semantic error codes.

## Getting Started

### Prerequisites

- Node.js ≥ 18
- Running PostgreSQL and Redis (see root `docker-compose.yml`)

### Installation & Scripts

```bash
npm install

# Database setup
npm run db:push
npm run seed

# Run server
npm run dev

# Testing
npm run test        # Unit tests
npm run test:e2e    # E2E tests (requires Docker)
```

## Documentation

For full system architecture, API specifications, and design trade-offs, refer to the core documentation:

- [Functional Specification Document (FSD)](../../docs/fsd.md)
- [Testing Strategy](../../docs/testing.md)
- [Root README](../../README.md)
