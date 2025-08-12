import fp from 'fastify-plugin';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import createError from '@fastify/error';
import crypto from 'node:crypto';

function createToken() {
  return crypto.randomBytes(24).toString('hex');
}

function needsCsrfCheck(req: FastifyRequest): boolean {
  const m = req.method.toUpperCase();
  if (m === 'GET' || m === 'HEAD' || m === 'OPTIONS') return false;
  // Skip CSRF for metrics/health endpoints
  if (
    req.url.startsWith('/metrics') ||
    req.url.startsWith('/healthz') ||
    req.url.startsWith('/readyz')
  ) {
    return false;
  }
  return true;
}

export default fp(async function csrfPlugin(app: FastifyInstance) {
  app.get('/api/v1/auth/csrf', async (req, reply) => {
    const token = createToken();
    reply.setCookie('csrf', token, {
      httpOnly: false,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });
    return { token };
  });

  app.addHook('preHandler', async (req) => {
    if (!needsCsrfCheck(req)) return;
    const header = req.headers['x-csrf-token'];
    const cookie = (req.cookies as any)?.csrf;
    if (!header || !cookie || header !== cookie) {
      throw new (createError('APP_FORBIDDEN', 'Invalid CSRF token', 403))();
    }
  });
});
