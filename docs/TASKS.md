### Plano de Tarefas — RBAC Monorepo

> Objetivo: concluir o boilerplate conforme as especificações. As tarefas estão ordenadas por marcos (M0..M6) e incluem entregáveis, scripts e critérios de aceite.

### Ordem e dependências

- M0 → M1 → M2 → M3 → M4 → M5 → M6 (opcional)
- M1 (Backend Auth/RBAC) depende de M0 (base/infra/CI).
- M2 (Fingerprint & Sessões) depende de M1 (auth/sessões básicas).
- M3 (Frontend) depende de M1 e M2 para integrar login/refresh/sessões. Evitar iniciar integrações do M3 antes de M1+M2 estarem mínimas.
- M4 (Flags & Email) depende de M1 (auth) e do pacote de config do M0 (ENV).
- M5 (Storage) depende de M1 (API) e do compose do M0.
- M6 (Observabilidade opcional) pode vir após M5.

### Regras de execução

- Commits por tarefa maior (mensagens em inglês, Conventional Commits).
- Ao concluir uma tarefa/subtarefa, marcar como concluída.
- Não antecipar tarefas de marcos posteriores; apenas scaffolding mínimo quando comprovadamente necessário.

## M0 — Base, Estrutura e DX

- [x] Configurar monorepo com pnpm workspaces + Turborepo
  - [x] `package.json` raiz com workspaces e scripts (`dev:all`, `lint`, `typecheck`, `build`, `test`, `e2e`)
  - [x] `turbo.json` com pipelines (lint, typecheck, build, test)
  - [x] Estrutura de pastas exata conforme `docs/REQUIREMENTS.md` (diretórios `apps/web`, `apps/api`, `packages/*`, `infra`, `.github`)
- [x] Configurações compartilhadas em `packages/config`
  - [x] ESLint + Prettier + tsconfig base
  - [x] Commitlint + Husky (pre-commit: lint+typecheck; commit-msg: commitlint)
- [x] CI inicial (GitHub Actions)
  - [x] Workflow com jobs: `lint`, `typecheck`, `build`, `test`
- [x] `.env.example` completo (front e back) e validação de ENV com Zod no start
- [x] Infra local
  - [x] `infra/docker-compose.yml` com Postgres, Redis, Mailpit, MinIO (opcional)
  - [x] Volumes, portas e credenciais default

## M1 — Banco, Auth & RBAC (Backend `apps/api`)

Dependências: M0

- [x] Configurar Fastify (Node 20+, Pino, CORS restrito, headers de segurança)
- [x] Drizzle ORM + Postgres
  - [x] Schemas e migrations: `users`, `roles`, `permissions`, `role_permissions`, `user_roles`, `sessions`, `audit_logs`, `user_credentials`
  - [x] Seeds: roles (`admin`, `professional`, `client`), permissions (`user.read`, `user.write`, `profile.read`, `profile.write`, `admin.panel`), `ADMIN_EMAILS` para admins
- [x] Segurança
  - [x] Senha Argon2id (memoryCost=128MiB, timeCost=3, parallelism=1, salt=16, hash=32) + pepper (`AUTH_PEPPER`)
  - [x] Cookies httpOnly, Secure, SameSite=strict; domínio por ENV
  - [x] CSRF (double submit) para métodos state-changing
  - [x] Rate limit (login e refresh)
  - [x] Mascarar PII em logs sensíveis
- [x] RBAC
  - [x] Middleware `authorize("permission")` e helper `authorizeAny([...])`
  - [x] Guard para `/api/v1/admin/*` exigindo `admin.panel` + allowlist `ADMIN_EMAILS`
- [x] Rotas de Auth
  - [x] `POST /api/v1/auth/register` `{ email, password, name, roleInit }`
  - [x] `POST /api/v1/auth/login` `{ email, password, deviceId }`
  - [x] `POST /api/v1/auth/refresh` `{ deviceId }`
  - [x] `POST /api/v1/auth/logout` `{ deviceId }`
  - [x] `GET /api/v1/auth/me`
  - [x] `GET /api/v1/auth/sessions`
  - [x] `POST /api/v1/auth/revoke-session` `{ sessionId }`
- [x] Observabilidade mínima
  - [x] Endpoints `/healthz`, `/readyz`, `/metrics` com métricas HTTP básicas

## M2 — Fingerprint de Dispositivo & Sessões

Dependências: M1

- [x] Vincular refresh a `(userId + deviceId)`
- [x] Cookie httpOnly assinado `did` no login
- [x] Validar `X-Device-Id` vs cookie `did` e sessão (negar se divergente ou revogada)
- [x] Listar e revogar sessões por usuário

## M3 — Frontend `apps/web`

Dependências: M1 e M2

- [x] Vite + React + TypeScript (strict), TanStack Router
- [ ] TanStack Query (a ser integrado no M3.1)
- [ ] UI base: shadcn/ui (Button, Input, Label, Card, Tabs, Dialog, DropdownMenu, Toast, Skeleton, DataTable)
- [ ] Form kit com RHF + ZodResolver (`<Form>`, `<FormField>`, `<FormMessage>`)
- [x] Rotas/Páginas
  - [x] `/` Landing (mock)
  - [x] `/login` com Login e Register
  - [x] `/app` (área autenticada)
  - [x] `/admin` (guard: permissão `admin.panel` + allowlist via backend)
  - [x] `*` NotFound
- [x] `apiClient.ts`
  - [x] Interceptor: injeta `X-Device-Id`, trata 401/419 e executa refresh seguro
  - [x] `useAuth()` com estado e permissões

## M4 — Feature Flags & E-mails

Dependências: M1

- [x] Adapter de flags (interface comum `getFlag(key, ctx?)`)
  - [x] Provider default: stub de Flagsmith
  - [x] Cache curto (60s) + fallback default
- [x] E-mails (esqueleto)
  - [x] Adapter `sendEmail({ to, template, variables })` (dev: Mailpit stub)
  - [x] Templates em `packages/emails` (ex.: reset de senha; login de novo dispositivo) — pendente conteúdo real
  - [x] Wiring no Fastify (`app.emails`)
  - [x] Wiring no Fastify (`app.flags`)
- [ ] Integração real com provider (Flagsmith/Resend) via ENV

## M5 — Storage S3-compatível

Dependências: M1

- [ ] Adapter S3 com funções:
  - [ ] `getPresignedUploadUrl(bucket, key, contentType)`
  - [ ] `getPresignedDownloadUrl(bucket, key, expiresSec)`
- [ ] MinIO no `docker-compose` (dev); ENV `S3_*`
- [ ] Endpoints `/api/v1/storage/presign-upload` e `/api/v1/storage/presign-download`
- [ ] Exemplo simples de upload no front

## M6 — Observabilidade Intermediária (Opcional)

Dependências: M0 (base) — recomendado após M5

- [ ] OpenTelemetry (Fastify auto-instrumentation) + exporter OTLP
- [ ] Stack local opcional (Prometheus, Loki, Tempo, Grafana) comentada no compose

## CLI de Scaffold (Backend) e Geradores (Frontend)

Dependências: M1 (para gerar resources sobre o backend já configurado)

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
