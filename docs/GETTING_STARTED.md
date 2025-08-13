### RBAC Boilerplate — Getting Started

This guide explains the project structure, setup, and how to build on top of this boilerplate.

### Stack Overview

- Monorepo: pnpm workspaces + Turbo
- API: Node 20+, Fastify 5, Drizzle ORM (Postgres), Zod, JWT, Argon2id, CSRF, rate limit
- Web: React + Vite + TypeScript, TanStack Router, TanStack Query, Tailwind
- Shared: `@rbac-boilerplate/config` for ENV (Zod validation)
- Infra: Docker Compose (Postgres, Redis, Mailpit, MinIO)

### Directory Structure

- `apps/api` — Backend API
- `apps/web` — Frontend app
- `packages/config` — TS/ESLint/Prettier config + ENV loader (server/client)
- `packages/flags` — Feature-flag provider (Flagsmith + cache)
- `packages/emails` — Email providers (Resend/SMTP)
- `packages/storage` — S3-compatible storage utilities (presign)
- `scripts/` — Generators (resources/features)
- `infra/` — Docker compose services

### Setup

1. Install deps

```
pnpm -w install
```

2. ENV — copy `.env.example` to `.env` at repo root and adjust
3. Start infra as needed

```
docker compose -f infra/docker-compose.yml up -d postgres redis mailpit minio
```

4. DB (from API)

```
pnpm --filter @rbac-boilerplate/api db:push
pnpm --filter @rbac-boilerplate/api db:seed
```

5. Dev

```
pnpm run dev:all
```

### ENV (root .env)

- Core
  - `APP_URL`, `API_URL`, `WEB_ORIGIN`, `NODE_ENV`
- Auth/Security
  - `AUTH_PEPPER`, `ACCESS_TOKEN_TTL`, `REFRESH_TOKEN_TTL`, `COOKIE_DOMAIN`
- Database/Cache
  - `DATABASE_URL`, `DB_SCHEMA` (default public), `REDIS_URL` (optional)
- Flags
  - `FLAGS_PROVIDER=flagsmith`, `FLAGSMITH_ENV_KEY`
- Email
  - `RESEND_API_KEY`, `MAIL_FROM` or `SMTP_HOST`, `SMTP_PORT`
- Storage (MinIO/S3)
  - `S3_ENDPOINT`, `S3_REGION`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_FORCE_PATH_STYLE`, `S3_BUCKET_PRIVATE`, `S3_BUCKET_PUBLIC`
- Observability (optional)
  - `OTEL_TRACES_ENABLED`, `OTEL_EXPORTER_OTLP_ENDPOINT`
- Web (Vite)
  - `VITE_API_URL` (loaded from root thanks to `envDir`)

### Auth & Sessions

- Client pre-hash (SHA-256) + server Argon2id+pepper
- Access/refresh cookies (httpOnly, SameSite=strict)
- Device fingerprint via `X-Device-Id` + cookie `did`
- CSRF double submit for state-changing routes

### API Endpoints (highlights)

- Auth: `/api/v1/auth/*` (register, login, refresh, logout, me, sessions, revoke)
- Admin: `/api/v1/admin/*` (allowlist + `admin.panel`)
- Flags: `/api/v1/flags/:key`
- Storage: `/api/v1/storage/presign-upload`, `/presign-download`
- Blog: `/api/v1/blog`, `/api/v1/blog/:slug`, `/api/v1/admin/blog`
- Health/metrics: `/healthz`, `/readyz`, `/metrics`

### Frontend

- Router in `apps/web/src/router.tsx` — routes for `/`, `/login`, `/app`, `/admin`, `/blog`, `/blog/$slug`, `/demo`.
- SEO with `react-helmet-async` on the landing and blog posts.
- Global QueryClient (TanStack Query) for data fetching.

### Feature Flags

- Set `FLAGS_PROVIDER=flagsmith` and `FLAGSMITH_ENV_KEY`.
- Check `/demo` or `GET /api/v1/flags/<key>`.

### Emails

- Dev: Mailpit (`http://localhost:8025`) via SMTP.
- Prod: Resend via `RESEND_API_KEY`.

### Storage

- MinIO dev:
  - `S3_ENDPOINT=http://localhost:9000`, `S3_FORCE_PATH_STYLE=true`
  - Create bucket matching `S3_BUCKET_PRIVATE` (e.g., `dev-private`).
- Use `/demo` → Presign & upload sample file.

### Observability

- Metrics: `/metrics` (Prometheus)
- Tracing (optional): set `OTEL_TRACES_ENABLED=true` and exporter endpoint.

### Generators

- Backend resource:

```
pnpm gen:resource --name users --fields "name:string,email:string,age:integer"
```

- Frontend feature:

```
pnpm gen:feature --name profile
```

### Blog & SEO

- Admin editor at `/admin/blog` (requires admin).
- Public list `/blog` and detail `/blog/$slug`.
- SEO: dynamic meta + JSON-LD on post page.
- Feeds: `GET /sitemap.xml`, `GET /rss.xml`.
