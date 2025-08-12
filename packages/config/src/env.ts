import { z } from 'zod';

export const ServerEnvSchema = z.object({
  APP_URL: z.string().url(),
  API_URL: z.string().url(),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  WEB_ORIGIN: z.string().url(),

  AUTH_PEPPER: z.string().min(1),
  ACCESS_TOKEN_TTL: z.coerce.number().int().positive(),
  REFRESH_TOKEN_TTL: z.coerce.number().int().positive(),
  COOKIE_DOMAIN: z.string().min(1),
  ADMIN_EMAILS: z.string().optional().default(''),

  AUTH_GOOGLE_ENABLED: z.coerce.boolean().optional(),
  OAUTH_GOOGLE_CLIENT_ID: z.string().optional(),
  OAUTH_GOOGLE_CLIENT_SECRET: z.string().optional(),
  AUTH_GITHUB_ENABLED: z.coerce.boolean().optional(),
  OAUTH_GITHUB_CLIENT_ID: z.string().optional(),
  OAUTH_GITHUB_CLIENT_SECRET: z.string().optional(),
  AUTH_APPLE_ENABLED: z.coerce.boolean().optional(),
  OAUTH_APPLE_CLIENT_ID: z.string().optional(),
  OAUTH_APPLE_TEAM_ID: z.string().optional(),
  OAUTH_APPLE_KEY_ID: z.string().optional(),
  OAUTH_APPLE_PRIVATE_KEY: z.string().optional(),

  DATABASE_URL: z
    .string()
    .regex(/^(postgres:\/\/|postgresql:\/\/).+/, 'DATABASE_URL must be a Postgres URL'),
  DB_SCHEMA: z.string().default('public'),
  REDIS_URL: z
    .string()
    .regex(/^(redis:\/\/|rediss:\/\/).+/, 'Invalid redis URL')
    .optional(),

  FLAGS_PROVIDER: z.enum(['flagsmith', 'statsig', 'unleash']).default('flagsmith'),
  FLAGSMITH_ENV_KEY: z.string().optional(),
  STATSIG_SERVER_SDK_KEY: z.string().optional(),
  UNLEASH_URL: z.string().optional(),
  UNLEASH_API_KEY: z.string().optional(),

  RESEND_API_KEY: z.string().optional(),
  MAIL_FROM: z.string().email().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().optional(),

  S3_ENDPOINT: z.string().optional(),
  S3_REGION: z.string().optional(),
  S3_ACCESS_KEY: z.string().optional(),
  S3_SECRET_KEY: z.string().optional(),
  S3_BUCKET_PUBLIC: z.string().optional(),
  S3_BUCKET_PRIVATE: z.string().optional(),
  S3_FORCE_PATH_STYLE: z.coerce.boolean().optional(),
});

export type ServerEnv = z.infer<typeof ServerEnvSchema>;

export function loadServerEnv(
  raw: Record<string, unknown> = process.env as Record<string, unknown>,
): ServerEnv {
  const parsed = ServerEnvSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.flatten().fieldErrors;
    const details = Object.entries(issues)
      .map(([k, v]) => `${k}: ${v?.join(', ') ?? 'invalid'}`)
      .join('; ');
    throw new Error(`Invalid server environment variables: ${details}`);
  }
  return parsed.data;
}
