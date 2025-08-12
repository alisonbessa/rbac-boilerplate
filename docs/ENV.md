### Guia de Variáveis de Ambiente

Este arquivo documenta todas as variáveis de ambiente utilizadas no projeto, seus formatos e valores recomendados para desenvolvimento local. O `.env.example` já contém valores padrão válidos para rodar localmente.

## Gerais (Backend)

- **APP_URL**: URL pública do frontend (ex.: `http://localhost:5173`).
- **API_URL**: URL pública da API (ex.: `http://localhost:3000`).
- **NODE_ENV**: Ambiente (`development` | `test` | `production`).
- **WEB_ORIGIN**: Origin do frontend autorizado no CORS (ex.: `http://localhost:5173`).

## Autenticação e Sessões

- **AUTH_PEPPER**: Segredo adicional para hash de senhas e tokens. Obrigatório em produção (ex.: `dev-only-change-me-please`).
- **ACCESS_TOKEN_TTL**: Tempo de vida do access token em segundos (ex.: `900`).
- **REFRESH_TOKEN_TTL**: Tempo de vida do refresh token em segundos (ex.: `2592000`).
- **COOKIE_DOMAIN**: Domínio dos cookies (ex.: `localhost` em dev; `example.com` em prod).
- **ADMIN_EMAILS**: Lista de e-mails (separados por vírgula) permitidos no /admin (ex.: `admin@example.com`).

## OAuth (opcional por provedor)

- **AUTH_GOOGLE_ENABLED**: `true|false` para habilitar Google OAuth.
- **OAUTH_GOOGLE_CLIENT_ID**, **OAUTH_GOOGLE_CLIENT_SECRET**: credenciais do Google.
- **AUTH_GITHUB_ENABLED**, **OAUTH_GITHUB_CLIENT_ID**, **OAUTH_GITHUB_CLIENT_SECRET**.
- **AUTH_APPLE_ENABLED**, **OAUTH_APPLE_CLIENT_ID**, **OAUTH_APPLE_TEAM_ID**, **OAUTH_APPLE_KEY_ID**, **OAUTH_APPLE_PRIVATE_KEY**.

## Banco de Dados

- **DATABASE_URL**: URL Postgres (ex.: `postgres://app:app@localhost:5432/app`).
- **DB_SCHEMA**: Schema padrão (ex.: `public`).

## Redis (opcional)

- **REDIS_URL**: URL do Redis (ex.: `redis://localhost:6379`).

## Feature Flags

- **FLAGS_PROVIDER**: Provedor de flags (`flagsmith` | `statsig` | `unleash`).
- **FLAGSMITH_ENV_KEY**: Chave do ambiente Flagsmith (se usar Flagsmith).
- **STATSIG_SERVER_SDK_KEY**: Chave server do Statsig (se usar Statsig).
- **UNLEASH_URL**, **UNLEASH_API_KEY**: Config do Unleash (se usar Unleash).

## E-mail (Resend/Mailpit)

- **RESEND_API_KEY**: Chave da Resend (produção).
- **MAIL_FROM**: Remetente padrão (ex.: `noreply@example.com`).

## Storage (S3-compatível)

- **S3_ENDPOINT**: Endpoint S3 (ex.: `http://127.0.0.1:9000` para MinIO).
- **S3_REGION**: Região S3 (ex.: `us-east-1`).
- **S3_ACCESS_KEY**, **S3_SECRET_KEY**: Credenciais S3/MinIO.
- **S3_BUCKET_PUBLIC**, **S3_BUCKET_PRIVATE**: Buckets padrão.
- **S3_FORCE_PATH_STYLE**: `true` para MinIO/local.

## Frontend (Variáveis Vite)

- **VITE_APP_URL**: URL pública do app (ex.: `http://localhost:5173`).
- **VITE_API_URL**: URL pública da API (ex.: `http://localhost:3000`).
- **VITE_FLAGS_PROVIDER**: Provedor de flags no client (`flagsmith` | `statsig` | `unleash`).
- **VITE_FLAGSMITH_ENV_KEY**: Chave do ambiente Flagsmith no client (se aplicável).

## Valores recomendados (desenvolvimento)

Os seguintes valores já constam no `.env.example` e permitem subir o projeto localmente sem ajustes:

```env
APP_URL=http://localhost:5173
API_URL=http://localhost:3000
NODE_ENV=development
WEB_ORIGIN=http://localhost:5173

AUTH_PEPPER=dev-only-change-me-please
ACCESS_TOKEN_TTL=900
REFRESH_TOKEN_TTL=2592000
COOKIE_DOMAIN=localhost
ADMIN_EMAILS=admin@example.com

DATABASE_URL=postgres://app:app@localhost:5432/app
DB_SCHEMA=public
REDIS_URL=redis://localhost:6379

FLAGS_PROVIDER=flagsmith

S3_ENDPOINT=http://127.0.0.1:9000
S3_REGION=us-east-1
S3_ACCESS_KEY=minio
S3_SECRET_KEY=minio123
S3_BUCKET_PUBLIC=public
S3_BUCKET_PRIVATE=private
S3_FORCE_PATH_STYLE=true
```

Observações:

- Em produção, gere um valor forte e secreto para `AUTH_PEPPER`.
- Ajuste `COOKIE_DOMAIN` para o domínio real da aplicação.
- Ative e configure apenas um provedor de Feature Flags conforme necessidade.
- `MAIL_FROM`/`RESEND_API_KEY` só são necessários quando enviar emails em produção.
