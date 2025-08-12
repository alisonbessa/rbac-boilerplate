import { loadServerEnv } from '@rbac-boilerplate/config';
import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';

// Load .env from repo root when running from package subdir
const rootEnvPath = path.resolve(process.cwd(), '../../.env');
if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath });
} else {
  dotenv.config();
}

export const env = loadServerEnv();

export const cookieDefaults = {
  httpOnly: true as const,
  sameSite: 'strict' as const,
  secure: process.env.NODE_ENV === 'production',
  domain: env.COOKIE_DOMAIN,
  path: '/',
};
