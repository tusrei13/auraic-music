# Auraic

![Node](https://img.shields.io/badge/Node-%3E%3D22-brightgreen)
![Next.js](https://img.shields.io/badge/Next.js-16.x-black)
![Express](https://img.shields.io/badge/Express-4.x-black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue)
![Redis](https://img.shields.io/badge/Redis-7-red)
![Terraform](https://img.shields.io/badge/Terraform-1.x-purple)
![License](https://img.shields.io/badge/License-Proprietary-red)

Auraic is an independent music streaming and discovery platform with clear licensing, explainable AI recommendations, and production-grade observability. Built for a solo-developer context but architected to scale.

## Key Features

| Feature | Description |
|---------|-------------|
| **Home** | Featured track, mood mixes, resume listening |
| **Discover** | Jamendo catalog browsing by genre, artist, album |
| **Search** | Full-text and semantic search (Vietnamese + English) |
| **Player** | Persistent player with queue, shuffle, repeat, lyrics |
| **Library** | Likes, playlists, listening history |
| **AI Recommendations** | Hybrid explainable recommendations with confidence scores |
| **Mood Mixes** | Rule-based mood/tag mixing (6 moods: chill, focus, energetic, melancholic, night, workout) |
| **License Transparency** | Per-track license, attribution and source metadata |
| **Observability** | Prometheus metrics, OpenTelemetry traces, Grafana SLO dashboard |
| **CI/CD** | Automated typecheck, lint, unit tests, E2E smoke, Docker security scan |

## Tech Stack

### Frontend (`frontend/`)
- **Framework**: Next.js 16 (App Router), React 19
- **State**: Zustand (player + session UI), TanStack Query (server state)
- **Styling**: Tailwind CSS v4, Radix UI primitives
- **Audio**: Web Audio API, HLS.js (conditional)
- **Testing**: Vitest + Testing Library, Playwright (E2E smoke)

### Backend (`backend/`)
- **Runtime**: Node.js 22, Express 4.x, TypeScript 5.x
- **ORM**: Prisma 6.x (PostgreSQL 16)
- **Auth**: Supabase Auth (JWT + server-side authorization)
- **Cache**: Redis 7 (events, future cache layer)
- **Validation**: Zod
- **Observability**: Structured JSON logs, `prom-client` metrics, graceful shutdown

### Infrastructure (`infra/`)
- **IaC**: Terraform (PostgreSQL RDS, Cloudflare R2/S3 storage, CDN/WAF, compute runner)
- **Containers**: Multi-stage Dockerfiles, non-root users, health checks
- **Orchestration**: Docker Compose (prod + dev)
- **Monitoring**: Prometheus 2.51 + Grafana 10.4
- **CI/CD**: GitHub Actions

## Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Frontend   │────▶│   Backend    │────▶│  PostgreSQL  │
│ Next.js:3001 │     │ Express:5000 │     │     :5432    │
└──────────────┘     └──────┬───────┘     └──────────────┘
                            │
              ┌─────────────┼─────────────┐
              ▼             ▼             ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │   Redis  │ │  Jamendo │ │ Prometheus│
        │   :6379  │ │  Proxy   │ │  :9090    │
        └──────────┘ └──────────┘ └────┬─────┘
                                         ▼
                                   ┌──────────┐
                                   │  Grafana │
                                   │  :3030   │
                                   └──────────┘
```

- **Modular monolith** backend with domain modules: `auth`, `catalog`, `library`, `search`, `recommendation`, `mood`, `analytics`, `admin`, `observability`.
- API versioning: `/api/v1` (modern contract) + `/api` (legacy/unversioned).
- Standardized error envelope with `requestId`, error code, message and safe details.

## Prerequisites

- Node.js >= 22.x
- npm >= 10.x
- PostgreSQL 16 (local or via Docker)
- Redis 7 (optional for local; required for production event pipeline)
- Supabase project (for Auth)
- Jamendo Developer account (for catalog)

## Quick Start (Local Development)

### 1. Clone and install

```bash
git clone https://github.com/your-org/auraic.git
cd auraic

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure environment

**Backend** — create `backend/.env`:

```env
DATABASE_URL=postgresql://auraic:auraic_secret@localhost:5432/auraic_db?schema=public
DIRECT_URL=postgresql://auraic:auraic_secret@localhost:5432/auraic_db
SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
PORT=5000
REDIS_URL=redis://localhost:6379
FRONTEND_URL=http://localhost:3001
JAMENDO_CLIENT_ID=<your-jamendo-client-id>
```

**Frontend** — create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

> Use `backend/.env.example` and `frontend/.env.example` as templates. Never commit secrets.

### 3. Database setup

```bash
cd backend
npm run prisma:generate
npm run prisma:push   # apply schema to local DB
# npm run prisma:seed # optional seed data
```

### 4. Run services

**Terminal 1 — Backend:**

```bash
cd backend
npm run dev
# Server: http://localhost:5000
# Health:  http://localhost:5000/healthz
# Metrics: http://localhost:5000/metrics
```

**Terminal 2 — Frontend:**

```bash
cd frontend
npm run dev
# App: http://localhost:3001
```

## Running with Docker

### Production stack (PostgreSQL, Redis, Backend, Frontend, Prometheus, Grafana)

```bash
cp .env.example .env   # configure secrets
docker compose -f docker-compose.yml up --build
```

| Service | Port | URL |
|---------|------|-----|
| Frontend | 3001 | http://localhost:3001 |
| Backend API | 5000 | http://localhost:5000 |
| PostgreSQL | 5432 | localhost:5432 |
| Redis | 6379 | localhost:6379 |
| Prometheus | 9090 | http://localhost:9090 |
| Grafana | 3030 | http://localhost:3030 |

### Development stack

```bash
docker compose -f docker-compose.dev.yml up
```

## Testing

```bash
# Backend unit tests
cd backend && npm test

# Frontend unit tests
cd frontend && npm test

# Frontend E2E smoke
cd frontend && npm run test:e2e

# Full CI locally (requires Docker)
docker compose -f docker-compose.dev.yml up --build
```

### Test Coverage

- **Backend**: 32/32 unit tests (controller contracts, services, Zod validation)
- **Frontend**: 14/14 unit tests (stores, API client validation)
- **E2E**: Playwright smoke flows (login, search, play, seek, like, playlist, mobile 390px)

## API Reference

### Base URLs

| Environment | Base URL |
|-------------|----------|
| Local dev | `http://localhost:5000/api` |
| Local dev (v1) | `http://localhost:5000/api/v1` |
| Docker prod | `http://localhost:5000/api` |

### Key Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/songs` | No | Catalog songs (cursor pagination) |
| GET | `/api/v1/artists` | No | Artist listing |
| GET | `/api/v1/genres` | No | Genre listing |
| GET | `/api/v1/search?q=...` | No | Full-text + semantic search |
| GET | `/api/v1/moods` | No | Mood taxonomy |
| GET | `/api/v1/recommendations/personalized` | Yes | Hybrid recommendations |
| GET | `/api/v1/likes/my-likes` | Yes | User liked tracks |
| POST | `/api/v1/likes/toggle` | Yes | Toggle like `{ songId }` |
| GET | `/api/v1/playlists` | Yes | User playlists |
| POST | `/api/v1/playlists` | Yes | Create playlist |
| GET | `/api/v1/analytics/insights` | Yes | Personal listening insights |
| GET | `/healthz` | No | Liveness probe |
| GET | `/readyz` | No | Readiness probe |
| GET | `/metrics` | No | Prometheus metrics |

All authenticated endpoints require:

```
Authorization: Bearer <supabase-access-token>
```

### Error Envelope

```json
{
  "error": {
    "code": "ENDPOINT_NOT_FOUND",
    "message": "Không tìm thấy endpoint",
    "requestId": "abc-123",
    "details": {}
  }
}
```

## Observability

### Health Checks

```
GET /healthz   # Liveness
GET /readyz    # Readiness (DB pool, memory)
GET /livez     # Alias for liveness
```

### Metrics (Prometheus)

| Metric | Description |
|--------|-------------|
| `http_requests_total` | Request count by method, route, status |
| `http_request_duration_seconds` | Histogram (p50/p95/p99) |
| `http_active_requests` | Current in-flight requests |
| `db_query_duration_seconds` | Prisma query latency |
| `jamendo_api_duration_seconds` | Upstream Jamendo proxy latency |

### Grafana Dashboard

Provisioned at `monitoring/grafana/`. Targets:
- Availability: 99.9%
- p95 API latency: < 200ms
- Error budget tracking

### Alerting

Configured in `monitoring/prometheus/alert_rules.yml`:
- SLO latency breach
- High error rate
- Database connection pool exhaustion

## Security

- **Auth**: Supabase Auth + server-side authorization. Frontend role checks are not security boundaries.
- **Headers**: Helmet (XSS, HSTS, CORP)
- **Rate limiting**: Auth (30 req/min), search/catalog (60 req/min)
- **CORS**: Allowlist via `FRONTEND_URL`
- **Validation**: Zod on all API boundaries
- **SSRF Protection**: External URL proxy validation
- **Secrets**: Never committed. Rotate via environment secret manager.
- **Audit**: Admin actions logged with request context.

## Database

### Migrations

```bash
cd backend

# Generate Prisma client after schema changes
npm run prisma:generate

# Push schema (dev)
npm run prisma:push

# Studio
npm run prisma:studio
```

### Backup & Restore

```bash
# Backup
npm run db:backup

# Restore
npm run db:restore
```

Backups include gzip compression and SHA-256 checksum verification.

## CI/CD Pipeline

GitHub Actions (`.github/workflows/ci.yml`):

1. **Backend**: Install → Prisma generate → Build → Test
2. **Frontend**: Install → Typecheck → Lint → Build → Test → Playwright E2E
3. **Containers**: Docker build + security scan (needs both jobs)

Runs on every push to `main` and on pull requests.

## Contributing

### Branch Strategy

- `main` — production-ready, deployed
- Feature branches from `main`, PR required

### Definition of Done

A feature is complete when it has:
- [ ] Real UI, not a placeholder
- [ ] Real API with persistence
- [ ] Loading, error, and empty states
- [ ] Authorization checks
- [ ] Unit tests
- [ ] Structured logging
- [ ] Basic metrics
- [ ] Operational documentation (if applicable)

### Code Quality

```bash
# Backend
cd backend
npm run build      # TypeScript compile
npm run lint       # ESLint

# Frontend
cd frontend
npx tsc --noEmit   # TypeScript typecheck
npm run lint       # ESLint
npm run build      # Next.js build
```

## Roadmap

| Phase | Status | Focus |
|-------|--------|-------|
| Phase 0: Foundation | ✅ Complete | Canonical catalog model, CI, standardized API |
| Phase 1: Listening MVP | ✅ Complete | Home, Discover, Search, Player, Library, likes, history |
| Phase 2: Production Platform | ✅ Complete | Docker, IaC, observability, SLO, runbooks, backup/restore |
| Phase 3: Data & Intelligence | ✅ Complete | Event pipeline, mood mixes, semantic search, hybrid recommendations |
| Phase 4: Scale Experiments | 🔲 Not Started | BullMQ/Redis workers, Redis cache, HLS/transcoding, service split |

## Operational Runbooks

Located in `docs/runbooks/`:

1. `database-outage.md` — Connection pool exhaustion, failover, restore
2. `jamendo-api-outage.md` — Upstream degradation, degraded cache fallback
3. `high-latency-slo-breach.md` — p95 > 200ms, slow query analysis via `pg_stat_statements`
4. `security-incident.md` — Secret rotation, admin revocation, audit review
5. `disaster-recovery.md` — Full RTO < 30m, RPO < 1h recovery plan

## License

Proprietary. All rights reserved.

Auraic's public catalog is sourced from Jamendo. All tracks retain their original license and attribution. See individual track pages for license details.
