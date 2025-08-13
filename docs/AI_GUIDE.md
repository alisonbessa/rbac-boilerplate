### AI Coding Guide — RBAC Boilerplate

This document describes the codebase to help AI assistants (and humans) follow patterns and maintain consistency.

### Monorepo conventions

- Workspace layout:
  - `apps/*`: runtime apps (API and Web)
  - `packages/*`: shared libs/providers/config
  - `scripts/*`: generators
- Keep code in English; docs in English.
- ENV at repo root (`.env`), validated by `@rbac-boilerplate/config`.

### API (Fastify) patterns

- App entry: `apps/api/src/server.ts` and `app.ts` (plugin registration, metrics, hooks).
- Plugins in `apps/api/src/plugins/` (auth, csrf, flags, email, storage).
- Modules in `apps/api/src/modules/<feature>/routes.ts`.
- DB schema single file: `apps/api/src/db/schema.ts`; client: `db/client.ts`.
- Auth:
  - `app.authenticate` guard from `plugins/auth.ts`
  - Authorization via `middleware/authorize.ts` (`authorize('permission')`)
- JSON errors: throw `Error` with `statusCode` (avoid httpErrors in Fastify v5).
- Types: prefer Drizzle `$inferSelect/$inferInsert` and Zod for request validation.

### Web (React) patterns

- Router: `apps/web/src/router.tsx` with root layout + routes (`/`, `/login`, `/app`, `/admin`, `/blog`, `/blog/$slug`, `/demo`).
- Providers: global `QueryClientProvider` in `src/main.tsx`.
- SEO: `react-helmet-async` on landing and blog posts.
- API access: `src/lib/apiClient.ts` (deviceId header, CSRF, refresh handling).
- Auth state: `features/auth/AuthContext.tsx`.
- Forms: React Hook Form + Zod; Lists/Tables: TanStack Query/Table.

### Flags & Emails

- Feature flags: `packages/flags` (Flagsmith SDK + REST fallback + cache). Use `app.flags.getFlag(key)`.
- Emails: `packages/emails` (Resend/SMTP). Use `app.emails.sendEmail({ to, template, variables })`.

### Storage

- `packages/storage` with AWS SDK v3 presigners.
- API endpoints: `/api/v1/storage/presign-upload` and `/presign-download`.

### Observability

- Metrics with prom-client at `/metrics`.
- Tracing optional via `apps/api/src/tracing.ts` (OTEL). Load only when `OTEL_TRACES_ENABLED=true`.

### Generators

- Backend resource: `pnpm gen:resource --name users --fields "name:string,email:string"`
  - Generates `modules/<name>/{schema.ts,routes.ts}` and auto-registers in `app.ts`.
  - Protects write routes with `authorize('user.write')` and requires auth for reads.
- Frontend feature: `pnpm gen:feature --name profile`
  - Generates page with RHF + Zod, Query (list/create), Table; auto-routes under `/app/<name>` and navbar link.

### Coding standards

- TypeScript strict; avoid `any`. Use `$inferSelect/$inferInsert` and explicit types.
- Handle errors explicitly; return 400 with issue details for Zod validation failures.
- Avoid comments inside code unless necessary; keep them concise and in English.
- Keep modules small; prefer pure functions and clear naming.

### Do/Don’t for AI assistants

- Do: Use existing helpers (apiClient, authorize, env loader).
- Do: Update docs when introducing new features.
- Do: Add types and adjust generators to enforce patterns.
- Don’t: Introduce breaking API changes without updating routes/docs/clients.
- Don’t: Bypass security middleware; always include `authenticate` and `authorize` where relevant.
