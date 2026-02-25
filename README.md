# Flash Flow

A high-throughput flash sale platform built with **Turborepo**, featuring a **NestJS** backend API and a **React 19** web application. Designed to handle thousands of concurrent purchase attempts with atomic stock management.

## Tech Stack

| Layer     | Technology                                                  |
| --------- | ----------------------------------------------------------- |
| Monorepo  | [Turborepo](https://turborepo.dev/) · npm workspaces        |
| Backend   | [NestJS 11](https://nestjs.com/) · Express · Node.js ≥ 18  |
| Frontend  | [React 19](https://react.dev/) · [TanStack Start](https://tanstack.com/start) · [Vite 7](https://vite.dev/) |
| Styling   | [Tailwind CSS v4](https://tailwindcss.com/)                 |
| Database  | [PostgreSQL 16](https://www.postgresql.org/) via [Prisma 7](https://www.prisma.io/) |
| Cache     | [Redis 7](https://redis.io/) (atomic stock counter)         |
| Language  | [TypeScript 5](https://www.typescriptlang.org/)             |
| Testing   | [Vitest](https://vitest.dev/) (both apps)                   |
| Linting   | [ESLint](https://eslint.org/) · [Prettier](https://prettier.io/) |

## Project Structure

```
flash-flow/
├── apps/
│   ├── backend/                # NestJS API (port 3001)
│   │   ├── prisma/
│   │   │   └── schema.prisma   # Database schema
│   │   └── src/
│   │       ├── platform/       # Database (Prisma), Redis, Throttler, Server Interceptors
│   │       ├── features/
│   │       │   └── flash-sale/ # Flash sale feature (vertical slice)
│   │       ├── main.ts         # Global Pipes/Interceptors setup
│   │       └── seed.ts         # DB seed script
│   └── web/                    # React 19 + TanStack Start (port 3000)
│       └── src/
│           ├── features/
│           │   └── flash-sale/ # Components, API, types
│           └── routes/
├── docs/
│   └── fsd.md                  # Functional Specification Document
├── docker-compose.yml          # PostgreSQL + Redis
├── turbo.json
└── package.json
```

## Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 11
- **Docker** & **Docker Compose** (for PostgreSQL and Redis)

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Application (Docker)

You can run the ENTIRE stack (PostgreSQL, Redis, Backend API, and React Web App) using Docker Compose:

```bash
docker compose up --build -d
```

This starts:
- **PostgreSQL 16** on `localhost:5433` (user: `flash`, password: `flash`, db: `flash_flow`)
- **Redis 7** on `localhost:6379`
- **Backend API** on [http://localhost:3001](http://localhost:3001)
- **Frontend App** on [http://localhost:3000](http://localhost:3000)

*(Note: The first build will take a few minutes as it creates the Turborepo multi-stage images).*

### 3. Push Database Schema

Apply the Prisma schema to your database:

```bash
cd apps/backend && npm run db:push
```

### 4. Seed the Database

Create a sample flash sale (100 items, active for 30 minutes):

```bash
cd apps/backend && npm run seed
```

### 5. Start Development Servers (without Docker)

> **Skip this step if you're using `docker compose up`.** Docker Compose already starts both the backend and frontend.

From the root of the project:

```bash
npm run dev
```

This starts both apps simultaneously:
- **Backend API:** [http://localhost:3001](http://localhost:3001)
- **Frontend:** [http://localhost:3000](http://localhost:3000)

Or run individually:

```bash
# Backend only
npx turbo dev --filter=backend

# Frontend only
npx turbo dev --filter=web
```

### 6. Stop Infrastructure

```bash
docker compose down        # Stop containers
```

## API Endpoints

| Method | Endpoint                               | Description            |
| ------ | -------------------------------------- | ---------------------- |
| GET    | `/api/v1/flash-sales/current`          | Get current sale status |
| POST   | `/api/v1/flash-sales/current/purchase` | Attempt a purchase      |
| GET    | `/api/v1/flash-sales/current/purchase` | Check user's purchase   |

## Testing

The project uses **Vitest** for all automated testing.

### 1. Unit Tests

Unit tests run extremely fast and do not require any external infrastructure. Business logic (`.logic.ts`) is tested purely, and services (`.service.ts`) are tested using mocks.

```bash
cd apps/backend

# Run unit tests
npm run test

# Run in watch mode (for development)
npm run test:watch

# Run with coverage report
npm run test:cov
```

### 2. End-to-End (E2E) Tests

E2E tests interact with actual endpoints and use **Testcontainers** to spin up ephemeral PostgreSQL and Redis Docker containers. **They will not touch your local development database.**

*Note: Ensure Docker is running before executing E2E tests.*

```bash
cd apps/backend

# Run E2E tests
npm run test:e2e
```

### 3. Stress Testing (k6)

Stress tests simulate hundreds of concurrent users competing for limited stock during a flash sale. This validates concurrency safety, Redis atomicity, and performance under load.

> **Rate Limiting:** The API uses a sliding window throttler (100 requests per minute per client). For stress testing, you may want to temporarily increase the `limit` in `apps/backend/src/app.module.ts`.

> **Rebuilding after code changes:** If you modify the source code while Docker is running, rebuild with `docker compose up --build -d`. Without `--build`, Docker reuses the cached image from the last build.

**Prerequisites:** Install [k6](https://grafana.com/docs/k6/latest/set-up/install-k6/) or use Docker.

```bash
# 1. Start infrastructure (add --build if code changed)
docker compose up --build -d

# 2. Push schema and seed (required after fresh docker compose up -v)
cd apps/backend && npm run db:push && npm run seed

# 3. Run the stress test
cd ../..
docker run --rm -i --add-host=host.docker.internal:host-gateway \
  grafana/k6 run - < e2e/stress/flash-sale.stress.js

# Or with k6 installed locally
k6 run -e BASE_URL=http://localhost:3001 e2e/stress/flash-sale.stress.js
```

The script simulates a 3-stage load pattern:
1. **Ramp-up** — 0→50 users over 10s
2. **Sustained peak** — 200 concurrent users for 30s
3. **Cool-down** — 200→0 users over 10s

See [docs/testing.md](docs/testing.md) for detailed test documentation.

## Database Management (Prisma)

```bash
cd apps/backend

npm run db:push      # Push schema changes to DB (dev)
npm run db:migrate   # Create migration (production)
npm run db:studio    # Open Prisma Studio (GUI)
```

## Architecture

The system uses a **two-layer concurrency strategy** for safe stock management:

1. **Redis** — atomic `DECR` as a fast stock gate (O(1) rejection when sold out)
2. **PostgreSQL** — advisory lock + transaction as source of truth (prevents overselling)

See [docs/fsd.md](docs/fsd.md) for the full Functional Specification Document, including architecture diagrams, ERD, API specs, and design trade-offs.

## Key Design Decisions

| Decision | Rationale |
| -------- | --------- |
| Redis stock gate | Protects DB from thundering herd — instant rejection at O(1) |
| PostgreSQL advisory lock | Serializes concurrent purchases without table locking |
| Standardized Response | Global Interceptor/Filter ensures unified `{status, data/error}` shape |
| Modal Error UI | High-impact modal popups for critical system failures (429, 500) |
| Feature-based modules | Each feature is a vertical slice with isolated business logic |
| Pure business logic | Side-effect free functions for testability |
