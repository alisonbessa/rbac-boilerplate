### Plano de Tarefas — RBAC Monorepo

> Objetivo: concluir o boilerplate conforme as especificações. As tarefas estão ordenadas por marcos (M0..M6) e incluem entregáveis, scripts e critérios de aceite.

## M0 — Base, Estrutura e DX

- [ ] Configurar monorepo com pnpm workspaces + Turborepo
  - [ ] `package.json` raiz com workspaces e scripts (`dev:all`, `lint`, `typecheck`, `build`, `test`, `e2e`)
  - [ ] `turbo.json` com pipelines (lint, typecheck, build, test)
  - [ ] Estrutura de pastas exata conforme `docs/REQUIREMENTS.md` (diretórios `apps/web`, `apps/api`, `packages/*`, `infra`, `.github`)
- [ ] Configurações compartilhadas em `packages/config`
  - [ ] ESLint + Prettier + tsconfig base
  - [ ] Commitlint + Husky (pre-commit: lint+typecheck; commit-msg: commitlint)
- [ ] CI inicial (GitHub Actions)
  - [ ] Workflow com jobs: `lint`, `typecheck`, `build`, `test`
- [ ] `.env.example` completo (front e back) e validação de ENV com Zod no start
- [ ] Infra local
  - [ ] `infra/docker-compose.yml` com Postgres, Redis, Mailpit, MinIO (opcional)
  - [ ] Volumes, portas e credenciais default

## M1 — Banco, Auth & RBAC (Backend `apps/api`)

- [ ] Configurar Fastify (Node 20+, Pino, CORS restrito, headers de segurança)
- [ ] Drizzle ORM + Postgres
  - [ ] Schemas e migrations: `users`, `roles`, `permissions`, `role_permissions`, `user_roles`, `sessions`, `audit_logs`, `user_credentials`
  - [ ] Seeds: roles (`admin`, `professional`, `client`), permissions (`user.read`, `user.write`, `profile.read`, `profile.write`, `admin.panel`), `ADMIN_EMAILS` para admins
- [ ] Segurança
  - [ ] Senha Argon2id (memoryCost=128MiB, timeCost=3, parallelism=1, salt=16, hash=32) + pepper (`AUTH_PEPPER`)
  - [ ] Cookies httpOnly, Secure, SameSite=strict; domínio por ENV
  - [ ] CSRF (double submit) para métodos state-changing
  - [ ] Rate limit (login e refresh)
  - [ ] Mascarar PII em logs sensíveis
- [ ] RBAC
  - [ ] Middleware `authorize("permission")` e helper `authorizeAny([...])`
  - [ ] Guard para `/api/v1/admin/*` exigindo `admin.panel` + allowlist `ADMIN_EMAILS`
- [ ] Rotas de Auth
  - [ ] `POST /api/v1/auth/register` `{ email, password, name, roleInit }`
  - [ ] `POST /api/v1/auth/login` `{ email, password, deviceId }`
  - [ ] `POST /api/v1/auth/refresh` `{ deviceId }`
  - [ ] `POST /api/v1/auth/logout` `{ deviceId }`
  - [ ] `GET /api/v1/auth/me`
  - [ ] `GET /api/v1/auth/sessions`
  - [ ] `POST /api/v1/auth/revoke-session` `{ sessionId }`
- [ ] Observabilidade mínima
  - [ ] Endpoints `/healthz`, `/readyz`, `/metrics` com métricas HTTP básicas

## M2 — Fingerprint de Dispositivo & Sessões

- [ ] Vincular refresh a `(userId + deviceId)`
- [ ] Cookie httpOnly assinado `did` no login
- [ ] Validar `X-Device-Id` vs cookie `did` e sessão (negar se divergente ou revogada)
- [ ] Listar e revogar sessões por usuário

## M3 — Frontend `apps/web`

- [ ] Vite + React + TypeScript (strict), TanStack Router + Query
- [ ] UI base: shadcn/ui (Button, Input, Label, Card, Tabs, Dialog, DropdownMenu, Toast, Skeleton, DataTable)
- [ ] Form kit com RHF + ZodResolver (`<Form>`, `<FormField>`, `<FormMessage>`)
- [ ] Rotas/Páginas
  - [ ] `/login` com Tabs “Professional” / “Client” (define `roleInit`)
  - [ ] `/app` (área autenticada)
  - [ ] `/admin` (layout isolado com guard duplo: allowlist + permissão)
- [ ] `apiClient.ts`
  - [ ] Interceptor: injeta `X-Device-Id`, trata 401/419 e executa refresh seguro
  - [ ] `useAuth()` com estado e permissões

## M4 — Feature Flags & E-mails

- [ ] Adapter de flags (interface comum `getFlag(key, ctx?)`)
  - [ ] Provider default: Flagsmith; preparar Statsig/Unleash via ENV
  - [ ] Cache curto (60s) + fallback default
- [ ] E-mails (Resend em prod, Mailpit em dev)
  - [ ] Adapter `sendEmail({ to, template, variables })`
  - [ ] Templates em `packages/emails` (ex.: reset de senha; login de novo dispositivo)

## M5 — Storage S3-compatível

- [ ] Adapter S3 com funções:
  - [ ] `getPresignedUploadUrl(bucket, key, contentType)`
  - [ ] `getPresignedDownloadUrl(bucket, key, expiresSec)`
- [ ] MinIO no `docker-compose` (dev); ENV `S3_*`
- [ ] Endpoints `/api/v1/storage/presign-upload` e `/api/v1/storage/presign-download`
- [ ] Exemplo simples de upload no front

## M6 — Observabilidade Intermediária (Opcional)

- [ ] OpenTelemetry (Fastify auto-instrumentation) + exporter OTLP
- [ ] Stack local opcional (Prometheus, Loki, Tempo, Grafana) comentada no compose

## CLI de Scaffold (Backend) e Geradores (Frontend)

- [ ] CLI `pnpm gen:resource` em `scripts/gen/resource.ts`
  - [ ] Parâmetros: `--name users` e `--fields "name:string,email:string:unique,active:boolean"`
  - [ ] Geração de: `apps/api/src/modules/<name>/{schema.ts,routes.ts,service.ts,controller.ts,tests.spec.ts}`
  - [ ] Schema Drizzle + migration; Zod (request/response) em `packages/contracts`
  - [ ] Registro da rota (loader Fastify) e `authorize` se `--protected`
  - [ ] CRUD completo (GET list/one, POST, PATCH, DELETE) com paginação/filtro/ordem padrão
  - [ ] Testes (Vitest) para rotas (incl. 401/403) e service
  - [ ] Atualizar índices de exports e contracts
- [ ] (Opcional) Plop `pnpm plop:feature` para features no front (rota + hooks + form + tabela TanStack Table + Query)

## CI/CD

- [ ] `.github/workflows/ci.yml`
  - [ ] Jobs: `lint`, `typecheck`, `unit`, `e2e`, `build`
  - [ ] Subir Postgres de serviço; rodar migrations e seeds
  - [ ] Publicar artefatos de build

## Deploy “Hobby/Free-friendly”

- [ ] Banco: criar Postgres gerenciado (ex.: Neon) e ajustar `DATABASE_URL`
- [ ] Vercel (monorepo):
  - [ ] `apps/web` como projeto estático (Vite)
  - [ ] `apps/api` como Serverless Functions com bridge Fastify (`api/[[...path]].ts`)
  - [ ] `vercel.json` com rewrites `"/api/(.*)" -> "apps/api/api/[...path].ts"` e `outputDirectory` do web
  - [ ] Configurar todas as ENV do `.env.example`
- [ ] E-mails: projeto Resend; `RESEND_API_KEY` e `MAIL_FROM`
- [ ] Storage: opcional em prod (S3/R2/Spaces) mantendo a mesma interface
- [ ] Domínio no Vercel e HTTPS
- [ ] Smoke tests pós-deploy (login, `/app`, `/admin`, refresh + revogação, upload/download)

## Documentação a Entregar

- [ ] `README.md` (subir local, estrutura, scripts, fluxos de auth, RBAC, flags, e2e, deploy)
- [ ] `DEPLOYMENT.md` (guia detalhado de deploy)
- [ ] `SECURITY.md` (decisões: Argon2id, cookies, CSRF, rate limit, logs)
- [ ] `CONTRIBUTING.md` (branches, Conventional Commits, PR checks)
- [ ] `ADR/` (2–3 decisões: Auth & RBAC; Storage Adapter; Feature Flags)

## Critérios de Aceitação (testáveis)

- [ ] Login senha (Professional/Client) → `/app` OK; `/admin` bloqueado sem allowlist+permissão
- [ ] Ao adicionar meu e-mail em `ADMIN_EMAILS`, acesso `/admin`
- [ ] Refresh falha se `X-Device-Id` ≠ cookie `did` ou sessão revogada
- [ ] RBAC nega rota sem permissão; `admin.panel` requerido em `/api/v1/admin/*`
- [ ] `getFlag` funcional (Flagsmith) com fallback
- [ ] `sendEmail` via Mailpit (dev) e Resend (prod)
- [ ] Presigned upload/download funcional com MinIO em dev
- [ ] Logs estruturados, `/healthz` e `/readyz` OK; `/metrics` expõe métricas HTTP
- [ ] `pnpm dev:all` funciona em máquina limpa com Docker; CI verde

## Scripts esperados (referência)

- [ ] `dev:all`, `dev:web`, `dev:api`
- [ ] `db:generate`, `db:migrate`, `db:seed`
- [ ] `lint`, `typecheck`, `test`, `e2e`, `build`
- [ ] `gen:resource`, `plop:feature` (opcional)
