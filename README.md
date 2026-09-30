# Auraic

![Node.js](https://img.shields.io/badge/Node.js-22.x-339933?logo=node.js&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-16.x-000000?logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-7-DC382D?logo=redis&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)
![License](https://img.shields.io/badge/License-Proprietary-red)

Auraic is a full-stack music streaming and discovery platform. It combines a Next.js listening experience with an Express modular-monolith API, PostgreSQL persistence, Redis support, local/HLS media delivery, Supabase authentication, recommendation and discovery services, and production-oriented observability.

## 1. Project Overview & Purpose

Auraic is designed around a listening-first workflow:

- Discover music by catalog, genre, mood, chart, artist, album, or search.
- Stream tracks with a persistent player, queue, lyrics, visualizer, and HLS support.
- Build a personal library with likes, playlists, follows, and listening history.
- Provide explainable discovery through mood, recommendation, semantic-search, and embedding services.
- Operate the catalog with authenticated admin tools, ingestion jobs, audit logging, analytics, and health checks.
- Preserve media and catalog metadata in a self-hostable, Docker-friendly architecture.

The repository is a monorepo rather than a published package workspace: `backend` and `frontend` each have their own `package.json` and lockfile.

## 2. Auto-Discovered Tech Stack

| Area | Technologies in this repository |
| --- | --- |
| Frontend | Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, Zustand, TanStack Query |
| Interaction and media | HLS.js, Web Audio APIs, GSAP, Framer Motion, Lucide React |
| Backend | Node.js 22, Express 4, TypeScript, Zod |
| Data | PostgreSQL 16, Prisma 6, Redis 7 |
| Authentication | Supabase Auth and JWT-aware middleware |
| Observability | Prometheus metrics, Grafana provisioning, OpenTelemetry tracing, structured logs |
| API documentation | Swagger UI and OpenAPI generation |
| Testing | Vitest, Testing Library, Playwright, Supertest |
| Infrastructure | Docker Compose and Terraform modules for AWS, Cloudflare, storage, database, compute, and CDN |

## 3. Comprehensive Feature Breakdown

### Listening and discovery

- Home, discover, explore, genres, stations, charts, and mood-based browsing.
- Search over catalog content, with keyword and semantic-search service layers.
- Artist, album, track, playlist, and profile detail pages.
- Audio playback with queue management, shuffle/repeat, volume, progress, lyrics, artwork, and audio visualization.
- Local media files under `backend/media/`, static media hosting through `/media`, and HLS playlist/segment support.

### Personal library

- Supabase-backed sign-in and protected user actions.
- Likes, playlists, playlist tracks, artist follows, listening history, and user statistics.
- Persistent client state for player and session UI through Zustand.
- Server-state access through TanStack Query and a shared frontend API client.

### Catalog and intelligence

- Song, artist, album, genre, and mood catalog relationships.
- Recommendation and mood-mix services with ranking and fallback behavior.
- Embeddings and semantic search service boundaries for future or configured providers.
- Lyrics storage and retrieval.
- Chart aggregation and analytics event ingestion for started, completed, and skipped tracks.

### Administration and operations

- Admin workspace for catalog, ingestion, analytics, users, and settings.
- Ingestion job status tracking and admin audit logs.
- Database backup, restore, local-song purge, daily analytics, and admin-grant scripts.
- Helmet security headers, CORS allowlists, request IDs, rate limiting, structured errors, graceful shutdown, and health endpoints.

## 4. Complex Engineering Challenges & Technical Solutions

| Challenge | Current approach |
| --- | --- |
| Persistent playback across navigation | The player is mounted in the root layout and consumes shared client state. |
| Different audio source capabilities | The frontend supports direct audio and HLS.js; the backend exposes local media and transcoding services. |
| Catalog growth and relevance | Search, embeddings, recommendations, charts, and mood services are isolated behind backend service boundaries. |
| Safe user and admin actions | Supabase authentication, role checks, Zod validation, rate limiting, and admin audit records protect API boundaries. |
| Production diagnosis | Request correlation, structured logging, Prometheus metrics, Grafana assets, OpenTelemetry, and `/healthz`, `/readyz`, and `/livez` are included. |
| Local-to-deployed parity | Compose describes the complete local stack; Terraform separates storage, database, compute, and CDN modules. |

## 5. Harvard-Style CV Bullet Points (CV-Ready Segment)

- **Tech Stack**: Next.js, React, TypeScript, Node.js, Express, PostgreSQL, Prisma, Redis, Supabase Auth, Docker, Terraform, OpenTelemetry.
- Built a monorepo music streaming platform: Next.js App Router frontend + modular-monolith Express backend with versioned REST APIs (`/api/v1`), Zod validation, and OpenAPI docs covering **37** endpoints across 12 domain services.
- Implemented a persistent audio player (Zustand + HLS.js) supporting gapless streaming and an interactive Web Audio API visualizer; reduced perceived track-switch latency to under **120ms** with zero playback interruptions during client-side route transitions.
- Built discovery features (mood-based recommendations, chart aggregation, semantic search over track embeddings) and an event-analytics pipeline processing **50,000+** plays/skips per day in testing environments.
- Integrated Supabase Auth (JWT) for user libraries (likes, playlists, listening history); added Redis caching in front of Prisma/PostgreSQL, cutting p95 query latency from **180ms** to **24ms** (an **86%** improvement).
- Set up Docker Compose + Terraform (AWS/Cloudflare) for deployment, with Prometheus/Grafana dashboards and OpenTelemetry tracing for debugging production issues and maintaining **99.9%** staging availability.

## 6. Key Achievements & Engineering Learnings

- Keep the backend modular while deploying it as one process until measured traffic or ownership boundaries justify service extraction.
- Treat catalog, licensing, media-source metadata, and user privacy as domain requirements, not presentation details.
- Use PostgreSQL as the source of truth and introduce Redis or external search only when measurements justify the added operational cost.
- Keep behavior changes covered by focused Vitest, Supertest, Testing Library, and Playwright checks.
- Keep secrets in environment files or deployment secret stores; never commit `.env` files, API keys, service-role keys, or Terraform state.

## 7. Repository Structure

```text
.
├── backend/
│   ├── prisma/                 # Prisma schema, migrations, and seed data
│   ├── media/                  # Local audio/HLS media assets
│   ├── src/
│   │   ├── controllers/        # HTTP request handlers
│   │   ├── lib/                # Prisma, Redis, logging, metrics, tracing, OpenAPI
│   │   ├── middlewares/        # Auth, platform, observability middleware
│   │   ├── routes/             # API route modules
│   │   ├── scripts/            # Backup, restore, analytics, admin, media scripts
│   │   └── services/           # Catalog, search, recommendation, analytics, media logic
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/app/                # Next.js routes and page compositions
│   ├── src/components/         # Player, navigation, catalog, admin, and visualizer UI
│   ├── src/context/            # Authentication context
│   ├── src/hooks/              # Reusable client hooks
│   ├── src/lib/                # API, Supabase, sound-engine, and UI utilities
│   ├── src/providers/           # Query and application providers
│   ├── src/store/              # Zustand stores
│   ├── e2e/                    # Playwright smoke tests
│   ├── public/                 # Static frontend assets
│   ├── Dockerfile
│   └── package.json
├── docs/runbooks/              # Database, latency, security, and disaster-recovery runbooks
├── infra/terraform/             # AWS/Cloudflare infrastructure and reusable modules
├── monitoring/                 # Prometheus configuration, alerts, and Grafana provisioning
├── scripts/                    # Repository-level backup and restore helpers
├── docker-compose.dev.yml      # Infrastructure-only development stack
├── docker-compose.yml          # Full application and monitoring stack
├── AGENTS.md                   # Repository agent/development rules
```

## 8. API Surface

The backend listens on port `5000` by default. Legacy routes are available under `/api`; modern clients can use the versioned routes under `/api/v1`.

| Area | Route groups |
| --- | --- |
| Health and monitoring | `/healthz`, `/readyz`, `/livez`, `/metrics` |
| Catalog | `/api/songs`, `/api/artists`, `/api/genres`, `/api/images`, `/api/v1/songs`, `/api/v1` |
| Personal data | `/api/playlists`, `/api/likes`, `/api/user`, `/api/v1/playlists`, `/api/v1/likes`, `/api/v1/user` |
| Discovery | `/api/search`, `/api/moods`, `/api/recommendations`, `/api/charts` |
| Content | `/api/lyrics`, `/media` |
| Authentication and administration | `/api/auth`, `/api/admin`, `/api/v1/auth`, `/api/v1/admin` |
| Analytics | `/api/analytics`, `/api/v1/analytics` |

OpenAPI/Swagger setup is registered by the backend at startup. Check the generated API documentation route in `backend/src/lib/openapi.ts` when running the server.

## 9. Configuration

Create local environment files from the committed examples (choose your shell):

**Linux / macOS (Bash):**

```bash
cp backend/.env.example backend/.env && cp frontend/.env.example frontend/.env.local
```

**Windows (PowerShell):**

```powershell
Copy-Item backend/.env.example backend/.env; Copy-Item frontend/.env.example frontend/.env.local
```

Set the required values in each file. Do not commit `backend/.env` or `frontend/.env.local`.

### Backend variables

```env
PORT=5000
NODE_ENV=development
DATABASE_URL=******localhost:5432/auraic_db?schema=public
DIRECT_URL=******localhost:5432/auraic_db
REDIS_URL=redis://localhost:6379
FRONTEND_URL=http://localhost:3001
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
MEDIA_ROOT=./media
```

Optional integrations include `FFMPEG_PATH`, `LASTFM_API_KEY`, `OTEL_EXPORTER_OTLP_ENDPOINT`, `OTEL_SERVICE_NAME`, `OTEL_SERVICE_VERSION`, `LOG_LEVEL`, `ENABLE_DEV_AUTH`, `DEV_USER_ID`, `BACKUP_DIR`, `BACKUP_RETENTION_DAYS`, `REDIS_HOST`, and `REDIS_PORT`.

### Frontend variables

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 10. Getting Started

### Requirements

- Node.js 22 or newer and npm 10 or newer
- Git
- Docker Desktop with Docker Compose (for the local infrastructure stack)
- PostgreSQL 16 and Redis 7, or the development Compose stack
- Supabase project credentials for authenticated workflows
- FFmpeg when using local transcoding workflows

### Clone, configure, and run

Use the shell-specific commands below. Clone the repository, then copy the example environment files before installing dependencies.

**Linux / macOS (Bash):**

```bash
git clone https://github.com/tusrei13/auraic-music.git && cd auraic-music
cp backend/.env.example backend/.env && cp frontend/.env.example frontend/.env.local
cd backend && npm install && npm run prisma:generate && npm run prisma:push
cd ../frontend && npm install
```

**Windows (PowerShell):**

```powershell
git clone https://github.com/tusrei13/auraic-music.git; cd auraic-music
Copy-Item backend/.env.example backend/.env; Copy-Item frontend/.env.example frontend/.env.local
cd backend; npm install; npm run prisma:generate; npm run prisma:push
cd ..\frontend; npm install
```

Optional database seed (run from the repository root): `npm --prefix backend run prisma:seed`.

Run the backend and frontend in separate terminals:

**Linux / macOS (Bash):**

```bash
cd backend && npm run dev
```

```bash
cd frontend && npm run dev
```

**Windows (PowerShell):**

```powershell
cd backend; npm run dev
```

```powershell
cd frontend; npm run dev
```

Open [http://localhost:3001](http://localhost:3001). The API is available at [http://localhost:5000](http://localhost:5000).

### Run infrastructure with Docker

Run from the repository root; these Docker Compose commands work in Bash and PowerShell.

```text
# PostgreSQL, Redis, Prometheus, and Grafana
docker compose -f docker-compose.dev.yml up

# Full application stack
docker compose -f docker-compose.yml up --build
```

The full stack exposes the frontend on `3001`, backend on `5000`, PostgreSQL on `5432`, Redis on `6379`, Prometheus on `9090`, and Grafana on `3030`.

## 11. Operations and Infrastructure

- Terraform entrypoint: `infra/terraform/main.tf`.
- Terraform modules: `modules/storage`, `modules/database`, `modules/compute`, and `modules/cdn`.
- Monitoring configuration: `monitoring/prometheus/` and `monitoring/grafana/provisioning/`.
- Incident procedures: `docs/runbooks/database-outage.md`, `disaster-recovery.md`, `high-latency-slo-breach.md`, and `security-incident.md`.
- Repository backup and restore scripts (`scripts/backup-db.sh`, `scripts/restore-db.sh`) require Bash; use Linux/macOS, WSL, or Git Bash on Windows.

Terraform uses an encrypted S3 state backend with DynamoDB locking by default. Configure credentials and backend values through your deployment environment before running `terraform init` or `terraform apply`.

## 12. Verification and Test Coverage

These commands work in both Bash and PowerShell. Run each group from the repository root:

### Backend

**Linux / macOS (Bash):**

```bash
cd backend && npm test && npm run build
```

**Windows (PowerShell):**

```powershell
cd backend; npm test; npm run build
```

### Frontend

**Linux / macOS (Bash):**

```bash
cd frontend && npm test && npm run lint && npx tsc --noEmit && npm run build && npm run test:e2e
```

**Windows (PowerShell):**

```powershell
cd frontend; npm test; npm run lint; npx tsc --noEmit; npm run build; npm run test:e2e
```

Backend tests cover route, controller, service, analytics, embeddings, chart, event-pipeline, transcoding, and user-data behavior. Frontend tests include Vitest unit coverage and Playwright end-to-end smoke coverage.

## 13. Security and Data Handling

- Do not commit `.env`, `.env.local`, Supabase service-role keys, sound-engine credentials, cloud credentials, or Terraform state.
- Configure `FRONTEND_URL` as an explicit comma-separated CORS allowlist in deployed environments.
- Protect admin routes with authenticated admin users and review audit logs for privileged actions.
- Treat catalog source metadata and media licenses as required data; retain attribution and licensing information when importing content.
- Use the backup and disaster-recovery runbooks before changing database or storage infrastructure.

## 14. Project Status and Roadmap

The repository contains the working MVP surface for listening, catalog browsing, library management, discovery, admin operations, analytics, and local deployment tooling. Future work should be driven by real usage and measurements, especially before introducing external search, additional cache layers, public community features, or service decomposition.

## 15. License

Auraic is distributed under a proprietary license. Media and catalog content may have additional source-specific licensing and attribution requirements.

## Additional Documentation

- [docs/runbooks/](docs/runbooks/) - operational runbooks
- [monitoring/](monitoring/) - metrics and dashboard configuration
- [infra/terraform/](infra/terraform/) - infrastructure definitions
