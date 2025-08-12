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
  password: z.string().min(8),
  name: z.string().min(1),
  roleInit: z.enum(['professional', 'client']).optional(),
});

const loginBody = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  deviceId: z.string(),
});
const refreshBody = z.object({ deviceId: z.string() });
const revokeBody = z.object({ sessionId: z.number() });

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
    const passwordHash = await hashPassword(body.password);
    const inserted = await db
      .insert(users)
      .values({ email: body.email, passwordHash, name: body.name })
      .returning({ id: users.id });
    const userId = inserted[0]!.id;
    const accessToken = signAccessToken(userId, body.email);
    reply.setCookie('access_token', accessToken, cookieDefaults as any);
    reply.setCookie('did', body.roleInit ?? '0', { ...cookieDefaults, httpOnly: true } as any);
    return { ok: true };
  });

  app.post('/api/v1/auth/login', async (req, reply) => {
    const body = loginBody.parse(req.body);
    const [user] = (await db
      .select()
      .from(users)
      .where(eq(users.email, body.email))
      .limit(1)) as any;
    if (!user) {
      const e: any = new Error('Unauthorized');
      e.statusCode = 401;
      throw e;
    }
    const ok = await verifyPassword(body.password, user.passwordHash);
    if (!ok) {
      const e: any = new Error('Unauthorized');
      e.statusCode = 401;
      throw e;
    }
    const refresh = createRefreshToken();
    await db.insert(sessions).values({
      userId: user.id,
      deviceId: body.deviceId,
      refreshTokenHash: await hashPassword(refresh),
    });
    const accessToken = signAccessToken(user.id, user.email);
    reply.setCookie('access_token', accessToken, cookieDefaults as any);
    reply.setCookie('refresh_token', refresh, { ...cookieDefaults, httpOnly: true } as any);
    return { ok: true };
  });

  app.post('/api/v1/auth/refresh', async (req, reply) => {
    const body = refreshBody.parse(req.body);
    const refresh = (req.cookies as any)?.refresh_token as string | undefined;
    if (!refresh) {
      const e: any = new Error('Unauthorized');
      e.statusCode = 401;
      throw e;
    }
    const [session] = (await db
      .select()
      .from(sessions)
      .where(eq(sessions.deviceId, body.deviceId))
      .limit(1)) as any;
    if (!session) {
      const e: any = new Error('Unauthorized');
      e.statusCode = 401;
      throw e;
    }
    const ok = await verifyPassword(refresh, session.refreshTokenHash);
    if (!ok) {
      const e: any = new Error('Unauthorized');
      e.statusCode = 401;
      throw e;
    }
    const accessToken = signAccessToken(session.userId, '');
    reply.setCookie('access_token', accessToken, cookieDefaults as any);
    return { ok: true };
  });

  app.post('/api/v1/auth/logout', async (req, reply) => {
    reply.clearCookie('access_token', cookieDefaults as any);
    reply.clearCookie('refresh_token', cookieDefaults as any);
    return { ok: true };
  });

  app.get('/api/v1/auth/me', { preHandler: app.authenticate }, async (req) => {
    return { user: req.user };
  });

  app.get('/api/v1/auth/sessions', { preHandler: app.authenticate }, async (req) => {
    const rows = (await db.select().from(sessions).where(eq(sessions.userId, req.user!.id))) as any;
    return { sessions: rows };
  });

  app.post('/api/v1/auth/revoke-session', { preHandler: app.authenticate }, async (req) => {
    const body = revokeBody.parse(req.body);
    await db.delete(sessions).where(eq(sessions.id, body.sessionId));
    return { ok: true };
  });
}
