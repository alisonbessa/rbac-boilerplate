# Boilerplate RBAC Monorepo — Especificação Base

> **Objetivo**: disponibilizar um monorepo pronto para iniciar projetos com autenticação, autorização por RBAC, login social, fingerprints de dispositivo, DX sólido e segurança pragmática (sem paranoias corporativas), mantendo facilidade de evolução.

---

## 1) Stack e decisões fixas

**Monorepo**: pnpm workspaces + Turborepo.

**Frontend**

- React + Vite + TypeScript (strict)
- shadcn/ui (Tailwind + Radix UI)
- TanStack Router + TanStack Query
- TanStack DB no client (cache offline/consultas locais) com fallback Dexie/IndexedDB mantendo API
- React Hook Form + Zod Resolver (validação com Zod)

**Backend**

- Node 20+ com Fastify
- Drizzle ORM (Postgres)
- Validação com Zod (fastify-type-provider-zod)
- Pino para logs estruturados
- Auth baseada em **access/refresh cookies httpOnly** + rotação de refresh
- Rotas versionadas em `/api/v1`

**Infra local**

- Docker Compose: `postgres`, `redis`, `mailpit`, `minio` (opcional), _observabilidade local_ (opcional): `prometheus`, `loki`, `tempo`, `grafana`
- Drizzle Kit (migrations/seeds)

**DX**

- ESLint + Prettier + Commitlint (Conventional Commits) + Husky
- Vitest (front e back) + RTL (front) + MSW (mocks) + Playwright (e2e)
- Changesets (versionamento) (opcional)
- GitHub Actions: lint, typecheck, build, test, e2e, db:migrate

---

## 2) Segurança pragmática (baseline)

- **Senha**: Argon2id
  - `memoryCost`: 128 MiB; `timeCost`: 3; `parallelism`: 1; `salt`: 16 bytes; `hash`: 32 bytes
  - **Pepper** global via ENV (ex.: `AUTH_PEPPER`), concatenado antes do hash
  - Re-hash automático quando parâmetros subirem
- **Cookies**: `httpOnly`, `Secure`, `SameSite=strict`; expiração curta do access, refresh rotacionado
- **CSRF**: double submit token para métodos state-changing
- **Rate-limit**: login/refresh/sensitive
- **RBAC**: checagem por permissão em middleware (rota e serviço)
- **Banco**: usuário de app sem privilégios de superuser; migrations com usuário separado; parâmetros de conexão via ENV; TLS em produção (se gerenciado pela plataforma, ok); consultas parametrizadas (Drizzle já cuida)
- **CORS** restrito a ORIGIN do ENV; **headers de segurança** (helmet/fastify-helmet-like)
- **Auditoria** mínima (auth events, mudanças de role)

> Meta: evitar portas abertas, manter complexidade baixa, e permitir “endurecer” depois sem quebra.

---

## 3) Autenticação, autorização e sessões

**Fluxos**

- Registro, login (senha ou social), refresh, logout, `me`
- Sessões por dispositivo: `deviceId` (UUID no client) + cookie `did` assinado no login; refresh vinculado ao par userId+deviceId
- Revogação por dispositivo (listar sessões ativas e revogar)

**RBAC** (tabelas)

- `users` (id, email, password_hash, name, ...)
- `roles` (id, name: `admin`, `professional`, `client`)
- `permissions` (id, `user.read`, `user.write`, `profile.read`, `profile.write`, `admin.panel`…)
- `role_permissions` (role_id, permission_id)
- `user_roles` (user_id, role_id)
- `sessions` (id, user_id, device_id, refresh_token_hash, user_agent, ip, created_at, expires_at, revoked_at)
- `audit_logs` (id, user_id, action, resource, resource_id, meta:jsonb, created_at)

**Rotas protegidas**

- Middleware `authorize("permission")`; helper `authorizeAny([...])`
- Exemplo: `/api/v1/admin/*` exige `admin.panel`

**Áreas**

- **/login** com abas “Professional” e “Client”; define role inicial
- **/app** (autenticado)
- **/admin** (layout isolado)
  - Gate 1: e-mail em `ADMIN_EMAILS` (allowlist)
  - Gate 2: permissão `admin.panel`

---

## 4) Login social (Google/GitHub/Apple opcional por ENV)

**Modelo de credenciais**

- `user_credentials`: `type` ("password" | "oauth"), `provider` ("google"|"github"|"apple"), `provider_user_id`, `email_verified`, `created_at`

**Fluxo**

- Authorization Code + PKCE
- Backend como cliente OAuth; frontend inicia o fluxo e recebe redirecionamento do backend
- No callback: localizar/associar usuário por `provider_user_id`; se e-mail bate mas não há vínculo, exigir prova (senha ou verificação) antes de linkar
- Em `/admin`, exigir allowlist + permissão

**ENV**

- `OAUTH_GOOGLE_CLIENT_ID/SECRET`, `OAUTH_GITHUB_*`, `OAUTH_APPLE_*`
- Flags por provedor: `AUTH_GOOGLE_ENABLED=true`, etc.

---

## 5) Fingerprint de dispositivo

- Client gera `deviceId` (UUID) e persiste (localStorage)
- Enviar header `X-Device-Id` em toda requisição
- No login, setar cookie httpOnly assinado `did`
- Refresh token vinculado ao par (userId + deviceId)
- Se header/cookie/registro não conferirem, negar refresh

---

## 6) Feature flags

**Abstração de adapter** (frontend e backend) com interface:

```ts
getFlag(key: string, context?: { userId?: string; email?: string; role?: string; [k: string]: unknown }): Promise<boolean>
```

**Opções**

- **Flagsmith** (SaaS ou self-hosted, simples, bom custo)
- **Statsig** (SaaS com foco em experimentação/guardrails)
- **Unleash** (open-source/self-hosted confiável; também tem cloud)
- (Opcional) GrowthBook (flags + experimentos open-source)

**Estratégia**

- Começar com **Flagsmith** por simplicidade
- Cache local curto (60s) e _fallback_ para valores default
- Contexto com `userId`, `role` e `deviceId` quando aplicável
- Kill switch para novas features arriscadas (ex.: novo fluxo de billing)

**ENV exemplo**

- `FLAGS_PROVIDER=flagsmith|statsig|unleash`
- `FLAGSMITH_ENV_KEY=...` / `STATSIG_SERVER_SDK_KEY=...` / `UNLEASH_URL/UNLEASH_API_KEY`

---

## 7) E-mails transacionais (Resend)

**Dev**: usar **Mailpit** (inspeção local) — adapter troca para Resend em prod.

**Adapter**

- `sendEmail({ to, template, variables })`
- Templates versionados em `packages/emails` (React Email opcional)

**ENV**

- `RESEND_API_KEY=...`
- `MAIL_FROM=noreply@dominio.com`

**Eventos comuns**

- Verificação de e-mail (se optar)
- Magic link (opcional)
- Notificação de login novo dispositivo
- Reset de senha

---

## 8) Storage de arquivos: MinIO e alternativas

**MinIO**

- Storage S3-compatível, self-hosted, leve e rápido — ótimo para **desenvolvimento local** e cenários on-prem
- Vantagem: programamos contra a **API S3** (put/get/presigned URLs) e trocamos por um provedor S3 real em produção sem reescrever a camada

**Alternativas**

- **LocalStack (S3)**: emula serviços AWS; mais pesado, mas útil se já usa outros serviços AWS em dev
- **SeaweedFS** com gateway S3 (self-hosted)
- **Ceph (RADOSGW)** (self-hosted, mais complexo)
- **Cloud S3-compatível**: AWS S3, Cloudflare R2, DigitalOcean Spaces, Wasabi, Backblaze B2

**Estratégia sugerida**

- **Dev**: MinIO no docker-compose
- **Prod**: AWS S3 (ou R2/Spaces/Wasabi) via a mesma interface de storage

**Adapter**

- `getPresignedUploadUrl(bucket, key, contentType)`
- `getPresignedDownloadUrl(bucket, key, expires)`
- Policies mínimas por bucket, tamanho máximo de upload, validação de content-type

**ENV**

- `S3_ENDPOINT`, `S3_REGION`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET_PUBLIC`, `S3_BUCKET_PRIVATE`

---

## 9) Observabilidade (sim, desde o dia 1)

**Nível Mínimo Viável (recomendado agora)**

- **Logs** com Pino (JSON) contendo `requestId`, `userId`, `deviceId`, `route`, `status`, `latencyMs`
- **Healthchecks**: `/healthz` (liveness), `/readyz` (readiness)
- **Métricas** HTTP básicas (contadores de 2xx/4xx/5xx, latência p50/p95)

**Nível Intermediário (opcional neste boilerplate)**

- **OpenTelemetry** (tracing + metrics):
  - Instrumentar Fastify (auto-instrumentation), exportar via OTLP
  - Propagar `traceparent` para o frontend
  - Frontend: web vitals + envio de `traceparent` em `fetch`
- **Stack local**: Prometheus (metrics), Tempo (traces), Loki (logs), Grafana (dashboards)
- Correlacionar logs ↔ traces com `traceId`

**SaaS alternativos**

- Sentry (errors + performance), Datadog, New Relic, Honeycomb, Grafana Cloud

**Alertas**

- Orçamentos simples: taxa de erro > X%, p95 latência > Y ms, falha de login acima do baseline

---

## 10) Estrutura de pastas (exata)

```
apps/
  web/
    src/
      routes/
      components/
      features/auth/
      features/admin/
      hooks/
      lib/
        apiClient.ts
        forms/
        flags/
        storage/
  api/
    src/
      modules/
        auth/
        admin/
        users/
      middleware/
      plugins/
      db/
      utils/
packages/
  contracts/   # Zod schemas request/response compartilhados
  ui/          # componentes shadcn (se fizer sentido compartilhar)
  emails/      # templates de e-mail
  config/      # eslint, tsconfig, tailwind base
infra/
  docker-compose.yml
  grafana/ prometheus/ loki/ tempo/  # (opcional)
.github/workflows/ci.yml
.husky/
```

---

## 11) Variáveis de ambiente

- **App**: `APP_URL`, `API_URL`, `NODE_ENV`
- **Auth**: `AUTH_PEPPER`, `ACCESS_TOKEN_TTL`, `REFRESH_TOKEN_TTL`, `COOKIE_DOMAIN`, `ADMIN_EMAILS`
- **OAuth**: `AUTH_GOOGLE_ENABLED`, `OAUTH_GOOGLE_CLIENT_ID`, `OAUTH_GOOGLE_CLIENT_SECRET` (idem GitHub/Apple)
- **DB**: `DATABASE_URL` (Postgres), `DB_SCHEMA` (opcional)
- **Redis**: `REDIS_URL` (rate-limit/sessões, se usar)
- **CORS**: `WEB_ORIGIN`
- **Flags**: `FLAGS_PROVIDER` + chaves do provider
- **Email**: `RESEND_API_KEY`, `MAIL_FROM`
- **Storage**: `S3_*` (endpoint, keys, buckets)

> Fornecer `.env.example` completo + validação com Zod no start (front e back).

---

## 12) Fluxos principais

**Login senha (Professional/Client)**

1. Usuário escolhe aba (define role inicial)
2. Envia email/senha → Argon2id verifica; em caso de sucesso, cria sessão (access+refresh cookies), seta `did`
3. Redireciona `/app`

**Login social**

1. Front chama `/auth/oauth/:provider` → redireciona
2. Callback resolve perfil, associa ou cria usuário; em `/admin` exige allowlist
3. Sessão criada; redirect

**/admin**

- Acesso só com e-mail na allowlist **e** permissão `admin.panel`
- Tela: listagem de usuários, atribuição de roles, auditoria básica

**Sessões**

- Listar sessões por device; permitir revogar

---

## 13) Tarefas/milestones

**M0 — Base e DX**

- Monorepo (pnpm + turbo), ESLint/Prettier/Commitlint/Husky, configs compartilhadas
- Docker Compose (postgres, redis, mailpit, minio [opcional])
- CI com lint/typecheck/test/build

**M1 — Auth & RBAC**

- Schemas Drizzle (users, roles, permissions, role_permissions, user_roles, sessions, audit_logs)
- Argon2id + pepper, cookies httpOnly, CSRF, rate-limit login
- RBAC middleware + helpers
- Seeds com `ADMIN_EMAILS`

**M2 — Fingerprint & Sessões**

- `deviceId` (header + cookie assinado), refresh vinculado, lista/revogação de sessões

**M3 — Frontend UI**

- /login com abas; /app (guard), /admin (double guard)
- shadcn base + Formularização com RHF + Zod

**M4 — Feature Flags & E-mail**

- Adapter de flags (Flagsmith default) no front/back
- Adapter de e-mail (Resend) com fallback Mailpit

**M5 — Storage**

- Adapter S3 (MinIO em dev; chaves por ENV)
- Endpoints de presigned URLs e upload simples no front (exemplo)

**M6 — Observabilidade (mínimo)**

- Pino com requestId/userId/deviceId
- Métricas HTTP básicas
- Health/Ready

**M7 — Observabilidade (intermediário opcional)**

- OTel (Fastify + fetch) → Loki/Tempo/Prometheus/Grafana no docker-compose opcional

---

## 14) Critérios de aceitação

1. Consigo criar usuários `professional` e `client`, logar e acessar `/app`; `/admin` bloqueia exceto allowlist+permissão
2. Refresh falha ao trocar `deviceId` ou se sessão for revogada
3. Flags funcionam com provider escolhido e fallback local
4. Envio de e-mail usa Mailpit em dev e Resend em prod
5. Upload/download via presigned URL funciona com MinIO em dev
6. Logs estruturados presentes; `/healthz` e `/readyz` respondem; métricas básicas expostas
7. `pnpm dev:all` sobe todo o ambiente em máquina limpa com Docker

---

## 15) APIs (contratos Zod — rascunho)

**Auth**

- `POST /api/v1/auth/register` `{ email, password, name, roleInit }`
- `POST /api/v1/auth/login` `{ email, password, deviceId }`
- `POST /api/v1/auth/refresh` `{ deviceId }`
- `POST /api/v1/auth/logout` `{ deviceId }`
- `GET /api/v1/auth/me`
- `GET /api/v1/auth/sessions`
- `POST /api/v1/auth/revoke-session` `{ sessionId }`
- `GET /api/v1/auth/oauth/:provider`
- `GET /api/v1/auth/oauth/:provider/callback`

**Admin**

- `GET /api/v1/admin/users`
- `POST /api/v1/admin/users/:id/roles` `{ roles: string[] }`
- `GET /api/v1/admin/audit`

**Storage**

- `POST /api/v1/storage/presign-upload` `{ bucket, key, contentType }`
- `POST /api/v1/storage/presign-download` `{ bucket, key, expires }`

---

## 16) Notas de implementação

- Interceptor de requisições no front injeta `X-Device-Id`, trata 401/419 e executa refresh
- Guards de rota no TanStack Router consultam `useAuth()` e permissões
- Schemas Zod compartilhados em `packages/contracts` (request/response)
- Validação de ENV com Zod tanto no `api` quanto no `web`
- Plop generators (opcional) para criar feature/route com testes e stories

---

## 17) Roadmap opcional

- 2FA TOTP (rotas, QR code, recuperação)
- WebAuthn (passkeys) com fallback de senha
- I18n (pt-BR/en-US) e tema dark/light
- Paginação server-side com TanStack Table
- SSO enterprise (OIDC/SAML) quando necessário
- Experimentos A/B (Statsig/GrowthBook) após consolidar flags

---

**Pronto.** Esta base prioriza segurança prática, DX e extensibilidade. A partir daqui, é adicionar domínios de negócio com o mesmo padrão de contratos Zod, RBAC e testes.
