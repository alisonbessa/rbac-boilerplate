import fp from 'fastify-plugin';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import jwt from 'jsonwebtoken';
import createError from '@fastify/error';
import { env } from '../env';
import { getUserWithAccess } from '../services/access';

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: number;
      email: string;
      roles: string[];
      permissions: string[];
    };
  }
}

function verifyAccessToken(token: string): { sub: number; email: string } {
  const secret = env.AUTH_PEPPER;
  const decoded = jwt.verify(token, secret);
  if (typeof decoded !== 'object' || decoded === null || !('sub' in decoded)) {
    throw new Error('Invalid token');
  }
  const sub = Number((decoded as any).sub);
  const email = String((decoded as any).email ?? '');
  return { sub, email };
}

async function authenticate(req: FastifyRequest) {
  const token = req.cookies['access_token'];
  if (!token) throw new (createError('APP_UNAUTHORIZED', 'Unauthorized', 401))();
  let payload: { sub: number; email: string };
  try {
    payload = verifyAccessToken(token);
  } catch {
    throw new (createError('APP_UNAUTHORIZED', 'Unauthorized', 401))();
  }
  const access = await getUserWithAccess(payload.sub);
  req.user = {
    id: access.user.id,
    email: access.user.email,
    roles: access.roles,
    permissions: access.permissions,
  };
}

export default fp(async function authPlugin(app: FastifyInstance) {
  app.decorateRequest('user', undefined);
  app.decorate('authenticate', authenticate);
});

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (req: FastifyRequest) => Promise<void>;
  }
}
