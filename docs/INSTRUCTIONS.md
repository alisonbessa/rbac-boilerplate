Quero que você atue como Staff Full-Stack Engineer e gere um monorepo pronto para iniciar projetos, baseado nas especificações abaixo. Não mude a stack e não troque libs. Entregue código funcional, scripts, docs e CI. Se algo ficar grande, entregue por diretórios em partes, mantendo a ordem definida.

0. Stack e decisões fixas
   Monorepo: pnpm workspaces + Turborepo

Frontend: React + Vite + TS strict; shadcn/ui (Tailwind + Radix); TanStack Router; TanStack Query; TanStack DB no client (fallback Dexie mantendo API); React Hook Form + Zod

Backend: Node 20+ + Fastify; Drizzle ORM + Postgres; Zod (fastify-type-provider-zod); Pino logs; rotas em /api/v1

Auth: access/refresh cookies httpOnly + rotação segura; CSRF (double submit) em métodos state-changing; rate limit no login/refresh

RBAC: roles (admin, professional, client) + permissions; middleware authorize("perm")

Login social: Google/GitHub/Apple (habilitar por ENV), fluxo Authorization Code + PKCE (backend cliente OAuth)

Fingerprint: deviceId (UUID no client + header X-Device-Id + cookie httpOnly did assinado); refresh atrelado a userId+deviceId

Infra local: Docker Compose com postgres, redis, mailpit, minio (opcional)

Email: adapter com Resend (prod) e Mailpit (dev)

Feature flags: adapter com Flagsmith por padrão, compatível com Statsig/Unleash via ENV

Observabilidade (mínimo): Pino c/ requestId/userId/deviceId, /healthz, /readyz, métricas HTTP básicas (expor /metrics)

1. Estrutura do repo (exata)
   bash
   Copy
   Edit
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
   contracts/ # Zod schemas request/response compartilhados
   ui/ # componentes (se compartilhar fizer sentido)
   emails/ # templates de e-mail (React Email opcional)
   config/ # eslint, tsconfig, tailwind base
   infra/
   docker-compose.yml
   .github/workflows/ci.yml
   .husky/
2. Banco, schemas e seeds (Drizzle)
   Crie as tabelas:

users(id, email unique, password_hash, name, created_at, updated_at)

roles(id, name) com seeds: admin, professional, client

permissions(id, name) com seeds: user.read, user.write, profile.read, profile.write, admin.panel

role_permissions(role_id, permission_id) (seedando o básico)

user_roles(user_id, role_id)

sessions(id, user_id, device_id, refresh_token_hash, user_agent, ip, created_at, expires_at, revoked_at)

audit_logs(id, user_id, action, resource, resource_id, meta jsonb, created_at)

user_credentials(id, user_id, type 'password'|'oauth', provider?, provider_user_id?, email_verified?, created_at)

Seeds:

Crie admin a partir de ADMIN_EMAILS (comma-separated).

Crie 1 usuário professional e 1 client de demo.

3. Segurança pragmática
   Senha: Argon2id com memoryCost=128 MiB, timeCost=3, parallelism=1, salt=16, hash=32 + pepper (ENV AUTH_PEPPER). Rehash quando parâmetros subirem.

Cookies: httpOnly, Secure, SameSite=strict. CORS restrito a WEB_ORIGIN do ENV.

CSRF: double submit token (gerar token e validar em POST/PUT/PATCH/DELETE).

Rate limit: login e refresh.

Logs: mascarar PII em eventos sensíveis.

4. Módulo de Auth (end-to-end)
   Rotas:

POST /api/v1/auth/register { email, password, name, roleInit }

POST /api/v1/auth/login { email, password, deviceId }

POST /api/v1/auth/refresh { deviceId }

POST /api/v1/auth/logout { deviceId }

GET /api/v1/auth/me

GET /api/v1/auth/sessions

POST /api/v1/auth/revoke-session { sessionId }

OAuth:

GET /api/v1/auth/oauth/:provider

GET /api/v1/auth/oauth/:provider/callback
Regras:

vincular refresh a userId+deviceId; negar se X-Device-Id ≠ cookie did ou sessão revogada.

/admin exige allowlist (ADMIN_EMAILS) + permissão admin.panel.

5. Frontend
   Páginas/rotas:

/login com Tabs “Professional” / “Client” (define roleInit).

/app área autenticada (exemplo de rota protegida).

/admin layout isolado com guard duplo (allowlist + permissão).
Infra de UI:

shadcn instalado com Button, Input, Label, Card, Tabs, Dialog, DropdownMenu, Toast, Skeleton, DataTable.

Form kit: abstração com RHF + ZodResolver (<Form>, <FormField>, <FormMessage>).

apiClient.ts com interceptor: injeta X-Device-Id, trata 401/419 e executa refresh seguro.

6. Adapter de Feature Flags
   Interface comum:

ts
Copy
Edit
getFlag(key: string, ctx?: { userId?: string; email?: string; role?: string; deviceId?: string }): Promise<boolean>
Implementar Flagsmith (default). Preparar adapters para Statsig/Unleash.

Cache curto (60s) e fallback para default.

ENV: FLAGS_PROVIDER=flagsmith|statsig|unleash + chaves do provedor.

7. E-mails (Resend)
   Adapter sendEmail({ to, template, variables }).

Templates em packages/emails (opcional React Email).

Dev: Mailpit; Prod: Resend.

ENV: RESEND_API_KEY, MAIL_FROM.

8. Storage (S3-compatível)
   MinIO no dev (docker-compose).

Adapter S3 com funções:

getPresignedUploadUrl(bucket, key, contentType)

getPresignedDownloadUrl(bucket, key, expiresSec)

ENV: S3_ENDPOINT, S3_REGION, S3_ACCESS_KEY, S3_SECRET_KEY, S3_BUCKET_PUBLIC, S3_BUCKET_PRIVATE, S3_FORCE_PATH_STYLE=true (p/ MinIO).

Em prod, usar provedor S3-compatível (ex.: AWS S3 / Cloudflare R2 / DO Spaces) sem trocar a interface.

9. Script de scaffold: gerar rotas e CRUD no back
   Crie um CLI pnpm gen:resource em scripts/gen/resource.ts (Node/TS) que:

Recebe --name users e opcional --fields "name:string,email:string:unique,active:boolean".

Gera:

apps/api/src/modules/<name>/{schema.ts, routes.ts, service.ts, controller.ts, tests.spec.ts}

schema Drizzle + migration (incluir db/migrations com arquivo).

Zod schemas (request/response) em packages/contracts.

Registro da rota no loader do Fastify e authorize se flag --protected.

CRUD padrão:

GET /api/v1/<name> (lista com paginação, filtro e ordenação padrão)

GET /api/v1/<name>/:id

POST /api/v1/<name>

PATCH /api/v1/<name>/:id

DELETE /api/v1/<name>/:id

Gera testes (Vitest) para rotas (incluindo 401/403) e service.

Atualiza índices de exports e contracts automaticamente.
Também crie Plop (opcional) com pnpm plop:feature para gerar feature no front (rota + hooks + form + tabela usando TanStack Table + Query).

10. Observabilidade
    Mínimo: Pino (JSON) com requestId, userId, deviceId, route, status, latencyMs; /healthz e /readyz; /metrics (HTTP counters + latency p50/p95).

(Opcional) OTel já configurado, com exporter OTLP; docker-compose com Prometheus+Loki+Tempo+Grafana comentado (ativável).

11. Docker/Dev UX
    docker-compose.yml: postgres, redis, mailpit, minio.

Scripts:

dev:all (sobe web, api e serviços)

db:generate, db:migrate, db:seed

lint, typecheck, test, e2e

.env.example completo e validação via Zod no start (front e back).

12. CI (GitHub Actions)
    Jobs: lint, typecheck, unit, e2e, build. Subir Postgres de serviço, rodar migrations e seeds, e publicar artefatos de build.

13. Deploy “hobby/free-friendly” — passo a passo
    Objetivo: minimizar custo inicial mantendo a stack.

Banco: criar instância Postgres gerenciada (ex.: Neon). Copiar DATABASE_URL.

Frontend e API: publicar no Vercel (Hobby) em monorepo:

apps/web como projeto estático (Vite).

apps/api como Serverless Functions Node no Vercel. Adicione um bridge para Fastify:

ts
Copy
Edit
// apps/api/api/[[...path]].ts (handler serverless Vercel)
import Fastify from 'fastify';
import buildApp from '../../src/app'; // função que registra plugins/rotas
const fastify = Fastify({ logger: false });
await buildApp(fastify);
export default async function handler(req: any, res: any) {
await fastify.ready();
fastify.server.emit('request', req, res);
}
Crie vercel.json com rewrites "/api/(.\*)" -> "apps/api/api/[...path].ts" e outputDirectory do web.

Env vars: configurar no Vercel todas as ENV do .env.example (WEB e API).

E-mails: criar projeto no Resend, setar RESEND_API_KEY e domínio/remetente (ou usar um sender verificado).

Storage: se precisar de arquivo em prod, configurar um S3-compatível (ex.: R2/Spaces/S3) com as ENV S3\_\*. Caso não precise no MVP, deixe o MinIO só para dev.

Domínio: configure DNS no Vercel; ative HTTPS out-of-the-box.

Smoke test: criar usuários professional e client, validar /app; testar allowlist e /admin; validar refresh + revogação por device; upload/download se storage ativo.

Observação: verifique limites atuais de cada provedor antes do go-live e ajuste as quotas/planos se necessário.

14. Documentação a entregar no repo
    README.md: subir local (1 comando), estrutura, scripts, fluxos auth, RBAC, flags, e2e, deploy.

DEPLOYMENT.md: guia detalhado do item 13.

SECURITY.md: decisões (Argon2id, cookies, CSRF, rate limit, logs).

CONTRIBUTING.md: padrão de branches, Conventional Commits, PR checks.

ADR/ (2~3 decisões): Auth & RBAC; Storage Adapter; Feature Flags.

15. Critérios de aceitação (testáveis)
    Login senha (Professional/Client) → /app ok; /admin bloqueado.

Ao adicionar meu e-mail em ADMIN_EMAILS, faço login no /admin.

Refresh falha se deviceId (header) ≠ cookie did ou sessão revogada.

RBAC nega rota sem permissão; admin.panel requerido no /api/v1/admin/\*.

Adapter de flags resolve getFlag (Flagsmith) e há fallback default.

sendEmail envia via Mailpit (dev) e Resend (prod).

Presigned upload/download funcional com MinIO em dev.

Logs estruturados, /healthz e /readyz ok; /metrics expõe métricas HTTP.

pnpm dev:all funciona em máquina limpa com Docker instalado; CI verde.

16. O que entregar agora (ordem)
    Estrutura de pastas + package.json raiz e workspaces, Turborepo config.

infra/docker-compose.yml com Postgres/Redis/Mailpit/MinIO.

.env.example completo (front e back) + validação Zod de ENV.

Backend apps/api: Drizzle config, schemas, migrations, seeds; módulo de Auth + RBAC + Sessions + OAuth; middleware CSRF; rate-limit; logs; /healthz, /readyz, /metrics.

Frontend apps/web: rotas /login, /app, /admin; guards; shadcn básicos; apiClient com interceptors; useAuth.

packages/contracts com Zod request/response; packages/emails com 2 templates (reset senha e login novo device).

Adapter Flagsmith (front/back) e Storage S3 (com MinIO em dev).

CLI pnpm gen:resource (scaffold CRUD completo) + (opcional) Plop para features no front.

CI (.github/workflows/ci.yml) rodando lint, typecheck, unit, e2e, build.

README.md, DEPLOYMENT.md, SECURITY.md, CONTRIBUTING.md e 2~3 ADRs.
