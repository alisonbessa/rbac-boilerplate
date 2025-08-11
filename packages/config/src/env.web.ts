import { z } from 'zod';

export const ClientEnvSchema = z.object({
  VITE_APP_URL: z.string().url(),
  VITE_API_URL: z.string().url(),
  VITE_FLAGS_PROVIDER: z.enum(['flagsmith', 'statsig', 'unleash']).default('flagsmith'),
  VITE_FLAGSMITH_ENV_KEY: z.string().optional(),
});

export type ClientEnv = z.infer<typeof ClientEnvSchema>;

export function loadClientEnv(raw?: Record<string, unknown>): ClientEnv {
  const source: Record<string, unknown> =
    raw ?? (globalThis as Record<string, unknown>)?.__ENV__ ?? {};
  const parsed = ClientEnvSchema.safeParse(source);
  if (!parsed.success) {
    throw new Error('Invalid client environment variables');
  }
  return parsed.data;
}
