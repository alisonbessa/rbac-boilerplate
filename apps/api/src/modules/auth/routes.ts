import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../../db/client';
import { users, sessions } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword, verifyPassword } from '../../utils/password';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env, cookieDefaults } from '../../env';

const registerBody = z.object({
  email: z.string().email(),
  passwordHashClient: z.string().min(64).max(128),
  name: z.string().min(1),
  roleInit: z.enum(['professional', 'client']).optional(),
});

const loginBody = z
  .object({
    email: z.string().email(),
    passwordHashClient: z.string().min(64).max(128).optional(),
    password: z.string().min(1).optional(),
    deviceId: z.string().optional(),
  })
  .refine((v) => Boolean(v.passwordHashClient || v.password), {
    message: 'passwordHashClient or password is required',
    path: ['passwordHashClient'],
  });
const refreshBody = z.object({ deviceId: z.string().optional() });
const revokeBody = z.object({ sessionId: z.number() });

type UserRow = typeof users.$inferSelect;
type SessionRow = typeof sessions.$inferSelect;

function signAccessToken(userId: number, email: string) {
  return jwt.sign({ sub: userId, email }, env.AUTH_PEPPER, {
    expiresIn: Math.max(60, Number(env.ACCESS_TOKEN_TTL || 900)),
  });
}

function createRefreshToken() {
  return crypto.randomBytes(48).toString('hex');
}

export async function registerAuthRoutes(app: FastifyInstance) {
  app.post('/api/v1/auth/register', async (req, reply) => {
    const body = registerBody.parse(req.body);
    // Store Argon2id(pepper + clientPreHash)
    const passwordHash = await hashPassword(body.passwordHashClient);
    const inserted = await db
      .insert(users)
      .values({ email: body.email, passwordHash, name: body.name })
      .returning({ id: users.id });
    const userId = inserted[0]!.id;
    const accessToken = signAccessToken(userId, body.email);
    reply.setCookie('access_token', accessToken, cookieDefaults);
    return { ok: true };
  });

  app.post('/api/v1/auth/login', async (req, reply) => {
    const body = loginBody.parse(req.body);
    const headerDeviceId = (req.headers['x-device-id'] as string | undefined) ?? body.deviceId;
    if (!headerDeviceId) {
      const err: Error & { statusCode?: number } = new Error(
        'Missing deviceId (X-Device-Id header)',
      );
      err.statusCode = 400;
      throw err;
    }
    // Accept either client-provided pre-hash, or plaintext (DEV fallback only)
    let clientPreHash: string | undefined = body.passwordHashClient;
    if (!clientPreHash && body.password && env.NODE_ENV !== 'production') {
      clientPreHash = crypto.createHash('sha256').update(body.password, 'utf8').digest('hex');
    }
    if (!clientPreHash) {
      const err: Error & { statusCode?: number } = new Error('passwordHashClient is required');
      err.statusCode = 400;
      throw err;
    }
    const foundUsers: UserRow[] = await db
      .select()
      .from(users)
      .where(eq(users.email, body.email))
      .limit(1);
    const user = foundUsers[0];
    if (!user) {
      const err = new Error('Unauthorized') as Error & { statusCode?: number };
      err.statusCode = 401;
      throw err;
    }
    const storedArgonHash = user.passwordHash;
    if (!storedArgonHash) {
      const err = new Error('Unauthorized') as Error & { statusCode?: number };
      err.statusCode = 401;
      throw err;
    }
    // Server treats client pre-hash as the secret input to Argon2id+pepper
    const ok = await verifyPassword(clientPreHash, storedArgonHash);
    if (!ok) {
      const err = new Error('Unauthorized') as Error & { statusCode?: number };
      err.statusCode = 401;
      throw err;
    }
    const refresh = createRefreshToken();
    await db.insert(sessions).values({
      userId: user.id,
      deviceId: headerDeviceId,
      refreshTokenHash: await hashPassword(refresh),
      userAgent: (req.headers['user-agent'] as string) || null,
      ip: (req.ip as string) || null,
    });
    const accessToken = signAccessToken(user.id, user.email);
    reply.setCookie('access_token', accessToken, cookieDefaults);
    reply.setCookie('refresh_token', refresh, { ...cookieDefaults, httpOnly: true });
    reply.setCookie('did', headerDeviceId, { ...cookieDefaults, signed: true });
    return { ok: true };
  });

  app.post('/api/v1/auth/refresh', async (req, reply) => {
    refreshBody.parse(req.body);
    const refresh = (req.cookies as Record<string, string | undefined>)?.refresh_token;
    if (!refresh) {
      const err: Error & { statusCode?: number } = new Error('Unauthorized');
      err.statusCode = 401;
      throw err;
    }
    const headerDeviceId = req.headers['x-device-id'] as string | undefined;
    const didCookie = (req.cookies as Record<string, string | undefined>)?.did;
    if (!headerDeviceId || !didCookie) {
      const err: Error & { statusCode?: number } = new Error('Unauthorized');
      err.statusCode = 401;
      throw err;
    }
    const unsign = req.unsignCookie(didCookie);
    if (!unsign.valid || unsign.value !== headerDeviceId) {
      const err: Error & { statusCode?: number } = new Error('Unauthorized');
      err.statusCode = 401;
      throw err;
    }
    // find matching session by deviceId and refresh
    const sessionsByDevice: SessionRow[] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.deviceId, headerDeviceId));
    let matched: SessionRow | undefined;
    for (const s of sessionsByDevice) {
      if (await verifyPassword(refresh, s.refreshTokenHash)) {
        matched = s;
        break;
      }
    }
    if (!matched) {
      const err: Error & { statusCode?: number } = new Error('Unauthorized');
      err.statusCode = 401;
      throw err;
    }
    // rotate refresh
    const newRefresh = createRefreshToken();
    await db
      .update(sessions)
      .set({ refreshTokenHash: await hashPassword(newRefresh) })
      .where(eq(sessions.id, matched.id));
    const accessToken = signAccessToken(matched.userId, '');
    reply.setCookie('access_token', accessToken, cookieDefaults);
    reply.setCookie('refresh_token', newRefresh, { ...cookieDefaults, httpOnly: true });
    return { ok: true };
  });

  app.post('/api/v1/auth/logout', async (req, reply) => {
    reply.clearCookie('access_token', cookieDefaults);
    reply.clearCookie('refresh_token', cookieDefaults);
    return { ok: true };
  });

  app.get('/api/v1/auth/me', { preHandler: app.authenticate }, async (req) => {
    return { user: req.user };
  });

  app.get('/api/v1/auth/sessions', { preHandler: app.authenticate }, async (req) => {
    const rows: SessionRow[] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.userId, req.user!.id));
    return { sessions: rows };
  });

  app.post('/api/v1/auth/revoke-session', { preHandler: app.authenticate }, async (req) => {
    const body = revokeBody.parse(req.body);
    await db.delete(sessions).where(eq(sessions.id, body.sessionId));
    return { ok: true };
  });
}
