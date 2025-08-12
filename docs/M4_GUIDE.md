### M4 Guide — Feature Flags & Emails

This guide explains how to configure and test feature flags (Flagsmith) and emails (Resend or SMTP/Mailpit) in this boilerplate.

### Prerequisites

- You have the monorepo running (see README).
- Docker services from `infra/docker-compose.yml` are up (for Postgres; Mailpit optional for dev emails).

### Environment Variables

Set these in your `.env` (see `.env.example` and `docs/ENV.md` for full list):

- Flags
  - `FLAGS_PROVIDER=flagsmith`
  - `FLAGSMITH_ENV_KEY=...` (required for remote evaluation)
- Emails
  - Option A (Resend): `RESEND_API_KEY=...`, `MAIL_FROM=no-reply@example.com`
  - Option B (SMTP/Mailpit): `SMTP_HOST=localhost`, `SMTP_PORT=1025`, `MAIL_FROM=no-reply@example.com`

### How it works

- Flags
  - Package `@rbac-boilerplate/flags` provides `FlagProvider` with a `FlagsmithProvider` implementation.
  - Simple in-memory cache (TTL 60s) to avoid excessive remote calls.
  - Fastify plugin exposes `app.flags`.
- Emails
  - Package `@rbac-boilerplate/emails` exposes `createEmailProvider()` returning either Resend or SMTP (Mailpit) provider, based on ENV.
  - Fastify plugin exposes `app.emails`.

### Test endpoints

- Check a flag:
  - `GET /api/v1/flags/:key` → `{ key, on: boolean }`
  - Example: `curl "$API_URL/api/v1/flags/sample-flag"`
- Send a test email:
  - `POST /api/v1/test-email` with JSON body `{ "to": "you@example.com", "template": "new-device-login" }`
  - Example:
    - `curl -X POST -H 'Content-Type: application/json' -d '{"to":"you@example.com","template":"new-device-login"}' "$API_URL/api/v1/test-email"`

### Frontend demo page

- Open `http://localhost:5173/demo`
  - Top card: enter a flag key (e.g., `sample-flag`) and click "Check".
  - Bottom card: enter an email (e.g., your Mailpit inbox `you@example.com`) and click "Send".
  - Mailpit UI (if using Mailpit) is at `http://localhost:8025`.

### Production notes

- Configure real providers only in production:
  - Set `FLAGSMITH_ENV_KEY` for Flagsmith.
  - Prefer Resend in production and SMTP/Mailpit only for local development.
- Keep `MAIL_FROM` consistent with your domain and provider requirements.
