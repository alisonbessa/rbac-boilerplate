# RBAC Boilerplate Monorepo

Monorepo with pnpm + Turborepo, Fastify API with Drizzle ORM (Postgres), and a shared config package for environment validation. Frontend scaffold lives under `apps/web` and will be initialized in Milestone M3.

## Requirements

- Node 20+
- pnpm 9+
- Docker + Docker Compose

## Project structure

- `apps/api` — Fastify + Drizzle ORM (Postgres), Auth, RBAC, CSRF, metrics/health endpoints
- `apps/web` — Frontend scaffold (Vite to be added on M3)
- `packages/config` — Shared ESLint/Prettier/TS config and ENV validation (Zod)
- `infra/docker-compose.yml` — Postgres, Redis, Mailpit, MinIO

## Getting started

1. Install dependencies

```bash
pnpm install
```

2. Configure environment variables

```bash
cp .env.example .env
# Edit .env as needed (APP_URL, API_URL, DATABASE_URL, ADMIN_EMAILS, etc.)
```

3. Start local services (Postgres, Redis, Mailpit, MinIO)

```bash
docker compose -f infra/docker-compose.yml up -d
```

4. Apply database schema and seed (roles, permissions, allowlisted admins, demo users)

```bash
pnpm --filter @rbac-boilerplate/api db:push
pnpm --filter @rbac-boilerplate/api db:seed
```

5. Run the API

```bash
pnpm --filter @rbac-boilerplate/api dev
```

## Quick checks

- Health and metrics:
  - `GET http://localhost:3000/healthz` → `{ "status": "ok" }`
  - `GET http://localhost:3000/readyz` → `{ "status": "ready" }`
  - `GET http://localhost:3000/metrics` → Prometheus metrics

- Auth (curl examples):

```bash
# Register user (roleInit can be "professional" | "client")
curl -i -X POST http://localhost:3000/api/v1/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"user@example.com","password":"password123","name":"User","roleInit":"client"}'

# Login (sets access_token / refresh_token cookies)
curl -i -X POST http://localhost:3000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"pro@example.com","password":"password123","deviceId":"device-1"}'

# Current user (requires cookies returned by login)
curl -i http://localhost:3000/api/v1/auth/me \
  -H 'Cookie: access_token=...; refresh_token=...'

# Admin ping (requires ADMIN_EMAILS allowlist + permission admin.panel)
curl -i http://localhost:3000/api/v1/admin/ping \
  -H 'Cookie: access_token=...'
```

## Useful scripts

- `pnpm dev:all` — run dev tasks in parallel (once web is configured)
- `pnpm lint` — lint
- `pnpm typecheck` — type checking
- `pnpm build` — build all packages
- `pnpm --filter @rbac-boilerplate/api db:push` — apply schema
- `pnpm --filter @rbac-boilerplate/api db:seed` — seed base data

## Notes

- Frontend (`apps/web`) will be initialized in M3.
- ENV validation is done via `packages/config` (Zod). The API consumes `COOKIE_DOMAIN`, `AUTH_PEPPER`, `ACCESS_TOKEN_TTL`, `REFRESH_TOKEN_TTL`, `WEB_ORIGIN`, etc.
