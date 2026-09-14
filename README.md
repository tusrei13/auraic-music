# Auraic

![Node.js](https://img.shields.io/badge/Node.js-22.x-339933?logo=node.js&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-16.x-000000?logo=next.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-7-DC382D?logo=redis&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)
![License](https://img.shields.io/badge/License-Proprietary-red)

Auraic is a full-stack music streaming and discovery platform built around a modular monolith backend and a modern Next.js frontend. The project is designed to support a polished listening experience, transparent licensing, explainable recommendations, and production-oriented observability for real-world deployment.

## Overview

Auraic combines:

- A music catalog experience powered by Jamendo metadata and audio sources
- A modern web application for browsing, searching, playing, and organizing music
- A strong backend foundation with Prisma, PostgreSQL, Redis, and structured observability
- Security, rate limiting, health checks, and infrastructure tooling for deployment readiness

This repository is organized as a monorepo with separate frontend, backend, infrastructure, monitoring, and operational documentation.

## Key Features

- Personalized music discovery and recommendations
- Full-text and semantic catalog search
- Player experience with queue, likes, playlists, and listening history
- Mood-based discovery and curated mixes
- Track and artist details with license transparency
- Admin tools for moderation and operational management
- Health checks, Prometheus metrics, and Grafana dashboards
- Docker-based local development and production-like orchestration

## Architecture

```text
┌─────────────────────┐      ┌─────────────────────┐      ┌─────────────────────┐
│                     │      │                     │      │                     │
│ Frontend            │────▶ │ Backend API         │────▶ │ PostgreSQL          │
│ Next.js 16          │      │ Express + TypeScript│      │ Prisma + Postgres    │
│ Port: 3001          │      │ Port: 5000          │      │ Port: 5432          │
│                     │      │                     │      │                     │
└─────────────────────┘      └──────────┬──────────┘      └─────────────────────┘
                                          │
                                          │
                                  ┌───────▼────────┐
                                  │ Redis          │
                                  │ Port: 6379     │
                                  └────────────────┘

                                          │
                                          ▼
                                ┌─────────────────────┐
                                │ Jamendo Catalog API │
                                └─────────────────────┘

                                          │
                                          ▼
                                ┌─────────────────────┐
                                │ Prometheus / Grafana│
                                │ Monitoring stack    │
                                └─────────────────────┘
```

## Tech Stack

### Frontend

- Next.js 16
- React 19
- TypeScript 5
- Tailwind CSS
- Zustand for client-side state
- TanStack Query for server state
- Playwright + Vitest for testing

### Backend

- Node.js 22
- Express 4
- TypeScript 5
- Prisma ORM
- PostgreSQL 16
- Redis 7
- Supabase Auth integration
- Zod validation
- OpenTelemetry tracing and Prometheus metrics

### Infrastructure and Operations

- Docker Compose for development and production-like stacks
- Terraform for infrastructure definitions
- Prometheus and Grafana for monitoring
- Health checks and graceful shutdown handling
- Structured logging and request correlation

## Repository Structure

```text
.
├── backend/
│   ├── prisma/
│   ├── src/
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   ├── public/
│   ├── Dockerfile
│   ├── package.json
│   ├── next.config.ts
│   └── playwright.config.ts
├── infra/
│   └── terraform/
├── monitoring/
│   ├── prometheus/
│   └── grafana/
├── docs/
│   └── runbooks/
├── docker-compose.yml
├── docker-compose.dev.yml
├── README.md
├── AGENTS.md
├── CLAUDE.md
└── scripts/
```

## Core Domain Modules

The backend is organized around a modular architecture with routes and services covering:

- Auth
- Songs / catalog
- Artists / genres
- Playlists and likes
- Search
- Recommendations
- Lyrics
- Analytics
- Admin
- User data management
- Charts and moods

The server exposes both legacy unversioned APIs and versioned APIs under `/api/v1`.

## Prerequisites

Before starting development, make sure you have:

- Node.js 22+
- npm 10+
- PostgreSQL 16
- Redis 7
- Docker and Docker Compose
- A Supabase project for authentication
- A Jamendo developer account if you want to use the full catalog flow

## Getting Started

### 1) Clone the repository

```bash
git clone <https://github.com/tusrei13/auraic-music.git>
cd auraic
```

### 2) Install dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 3) Configure environment variables

Create a `backend/.env` file with the following variables:

```env
PORT=5000
DATABASE_URL=postgresql://auraic:auraic_secret@localhost:5432/auraic_db?schema=public
DIRECT_URL=postgresql://auraic:auraic_secret@localhost:5432/auraic_db
REDIS_URL=redis://localhost:6379
FRONTEND_URL=http://localhost:3001
SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

Create a `frontend/.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

> Keep secrets out of source control. Use local environment files only.

### 4) Initialize the database

```bash
cd backend
npm run prisma:generate
npm run prisma:push
```

Optional seed data:

```bash
npm run prisma:seed
```

### 5) Run the application

Terminal 1 — Backend

```bash
cd backend
npm run dev
```

Terminal 2 — Frontend

```bash
cd frontend
npm run dev
```

The application will be available at:

- Frontend: [http://localhost:3001](http://localhost:3001)
- Backend: [http://localhost:5000](http://localhost:5000)
- Health check: [http://localhost:5000/healthz](http://localhost:5000/healthz)
- Metrics: [http://localhost:5000/metrics](http://localhost:5000/metrics)

## Running with Docker

### Full stack

```bash
docker compose -f docker-compose.yml up --build
```

This stack includes:

- Frontend
- Backend
- PostgreSQL
- Redis
- Prometheus
- Grafana

### Development infrastructure only

```bash
docker compose -f docker-compose.dev.yml up
```

This development stack includes shared infrastructure services such as PostgreSQL, Redis, Prometheus, and Grafana without building the application containers.

## Testing

### Backend test suite

```bash
cd backend
npm test
```

### Frontend test suite

```bash
cd frontend
npm test
npm run test:e2e
```

### Quality checks

```bash
cd frontend
npm run lint
npx tsc --noEmit
npm run build
```

## API Overview

The backend exposes the following major route groups:

- `/api/auth`
- `/api/songs`
- `/api/artists`
- `/api/genres`
- `/api/playlists`
- `/api/likes`
- `/api/search`
- `/api/catalog`
- `/api/lyrics`
- `/api/admin`
- `/api/analytics`
- `/api/moods`
- `/api/recommendations`
- `/api/charts`
- `/api/user`

Versioned APIs are also exposed under `/api/v1` for modern clients.

Common health and monitoring endpoints:

- `GET /healthz`
- `GET /readyz`
- `GET /livez`
- `GET /metrics`

## Observability and Monitoring

The platform includes:

- Structured logging with request correlation
- Prometheus metrics exposure
- Grafana dashboards for visualization
- OpenTelemetry tracing setup
- Health checks for liveness and readiness

Monitoring assets are located in:

- `monitoring/prometheus/`
- `monitoring/grafana/`
- `docs/runbooks/`

## Security Notes

The implementation includes several production-oriented safeguards:

- Helmet-based security headers
- CORS configuration based on allowed frontend origins
- Request rate limiting for sensitive and high-traffic endpoints
- Input validation via Zod
- Auth checks on protected routes
- Audit logging for admin operations

## Database and Backup

Database migrations are managed through Prisma.

Generate client and apply schema changes:

```bash
cd backend
npm run prisma:generate
npm run prisma:push
```

Operational scripts included in the backend package:

- `npm run db:backup`
- `npm run db:restore`
- `npm run admin:grant`
- `npm run songs:purge-local`
- `npm run analytics:daily`

## Infrastructure

Terraform definitions live in:

- `infra/terraform/`

These files provide a scalable foundation for infrastructure provisioning, environment configuration, and reusable modules.

## Roadmap

The current project direction includes:

- Completed MVP listening and catalog experience
- Production-ready deployment support with Docker and monitoring
- Recommendation, mood, search, and analytics capabilities
- Further scale, cache, and service-splitting experiments as usage grows

## Contributing

Contributions are welcome. To keep the codebase maintainable:

1. Create a feature branch from `main`
2. Keep changes scoped and well-documented
3. Add or update tests for behavior changes
4. Validate typechecking, linting, and relevant tests
5. Open a pull request with a clear summary and verification notes

## License

This project is currently distributed under a proprietary license. Jamendo content remains subject to the original licensing terms and attribution requirements.

## Additional Documentation

- `docs/runbooks/` — operational playbooks for production incidents
- `monitoring/` — Prometheus and Grafana configuration
