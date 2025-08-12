import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL || 'postgres://app:app@localhost:5432/app';
export const pool = new Pool({ connectionString });
export const db = drizzle(pool);
