import { defineConfig } from 'drizzle-kit';
import dotenv from 'dotenv';
import path from 'node:path';

// Load .env from repo root so CLI has DATABASE_URL
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgres://app:app@localhost:5432/app',
  },
});
