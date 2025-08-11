import { z } from 'zod';
export const ClientEnvSchema = z.object({
  VITE_APP_URL: z.string().url(),
  VITE_API_URL: z.string().url(),
  VITE_FLAGS_PROVIDER: z.enum(['flagsmith', 'statsig', 'unleash']).default('flagsmith'),
  VITE_FLAGSMITH_ENV_KEY: z.string().optional(),
});
export function loadClientEnv(raw) {
  const fromGlobal = globalThis?.__ENV__;
  const fromImportMeta = import.meta?.env;
  const source = raw ?? fromGlobal ?? fromImportMeta ?? {};
  const parsed = ClientEnvSchema.safeParse(source);
  if (!parsed.success) {
    throw new Error('Invalid client environment variables');
  }
  return parsed.data;
}
