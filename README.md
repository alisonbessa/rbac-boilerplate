# RBAC Boilerplate Monorepo

Monorepo with pnpm + Turborepo, Fastify API with Drizzle ORM (Postgres), and a shared config package for environment validation. Web app lives under `apps/web` (React + Vite + Tailwind).

## Requirements

- Node 20+
- pnpm 9+
- Docker + Docker Compose

## Project structure

- `apps/api` — Fastify + Drizzle ORM (Postgres), Auth, RBAC, CSRF, metrics/health endpoints
- `apps/web` — React + Vite + TypeScript (router, blog demo, forms), Tailwind
- `packages/config` — Shared ESLint/Prettier/TS config and ENV validation (Zod)
- `infra/docker-compose.yml` — Postgres, Redis, Mailpit, MinIO

## Getting started

1. Install dependencies

```bash
pnpm install
```

2. Configure environment variables (create a `.env` at the repo root)

Minimal local example:

```
# Core
APP_URL=http://localhost:5173
API_URL=http://localhost:3000
WEB_ORIGIN=http://localhost:5173
NODE_ENV=development

# Auth/Security
AUTH_PEPPER=dev-secret-change-me
ACCESS_TOKEN_TTL=900
REFRESH_TOKEN_TTL=1209600
COOKIE_DOMAIN=localhost

# Database
DATABASE_URL=postgres://app:app@localhost:5432/app
DB_SCHEMA=public

# Optional (admin allowlist, emails, storage)
ADMIN_EMAILS=admin@example.com
MAIL_FROM=rbac@example.com
SMTP_HOST=localhost
SMTP_PORT=1025
S3_ENDPOINT=http://localhost:9000
S3_FORCE_PATH_STYLE=true
S3_BUCKET_PRIVATE=dev-private
S3_BUCKET_PUBLIC=dev-public
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

6. Run the Web (optional)

```bash
pnpm --filter @rbac-boilerplate/web dev
```

## Quick checks

- Health and metrics:
  - `GET http://localhost:3000/healthz` → `{ "status": "ok" }`
  - `GET http://localhost:3000/readyz` → `{ "status": "ready" }`
  - `GET http://localhost:3000/metrics` → Prometheus metrics
  - `GET http://localhost:3000/api/v1/auth/csrf` → returns `{ token }` and sets `csrf` cookie (required for state-changing requests)

- Auth (curl examples):

```bash
# Get CSRF token (saves cookie). Copy the `token` value from the JSON response
curl -i -c cookies.txt http://localhost:3000/api/v1/auth/csrf
CSRF=PASTE_TOKEN_HERE

# Register user (roleInit can be "professional" | "client")
curl -i -b cookies.txt -c cookies.txt -X POST http://localhost:3000/api/v1/auth/register \
  -H 'Content-Type: application/json' \
  -H "x-csrf-token: $CSRF" \
  -d '{"email":"user@example.com","password":"password123","name":"User","roleInit":"client"}'

# Login (sets access_token / refresh_token cookies)
curl -i -b cookies.txt -c cookies.txt -X POST http://localhost:3000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -H "x-csrf-token: $CSRF" \
  -d '{"email":"pro@example.com","password":"password123","deviceId":"device-1"}'

# Current user (requires cookies returned by login)
curl -i -b cookies.txt http://localhost:3000/api/v1/auth/me \
  -H 'Cookie: access_token=...; refresh_token=...'

# Admin ping (requires ADMIN_EMAILS allowlist + permission admin.panel)
curl -i -b cookies.txt http://localhost:3000/api/v1/admin/ping
```

## Useful scripts

- `pnpm dev:all` — run API and Web dev servers in parallel
- `pnpm lint` — lint
- `pnpm typecheck` — type checking
- `pnpm build` — build all packages
- `pnpm --filter @rbac-boilerplate/api db:push` — apply schema
- `pnpm --filter @rbac-boilerplate/api db:seed` — seed base data

## Notes

- Frontend (`apps/web`) is available (Vite/Tailwind). Default dev ports: API `:3000`, Web `:5173`.
- ENV validation is done via `packages/config` (Zod). The API consumes `APP_URL`, `API_URL`, `WEB_ORIGIN`, `DATABASE_URL`, `COOKIE_DOMAIN`, `AUTH_PEPPER`, `ACCESS_TOKEN_TTL`, `REFRESH_TOKEN_TTL`, etc. See `docs/GETTING_STARTED.md` for the full list.
