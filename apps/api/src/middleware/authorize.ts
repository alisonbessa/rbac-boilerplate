import type { FastifyRequest } from 'fastify';
import createError from '@fastify/error';

const Unauthorized = createError('APP_UNAUTHORIZED', 'Unauthorized', 401);
const Forbidden = createError('APP_FORBIDDEN', 'Forbidden', 403);

export function authorize(requiredPermission: string) {
  return async function preHandler(req: FastifyRequest) {
    const user = req.user;
    if (!user) throw new Unauthorized();
    if (!user.permissions.includes(requiredPermission)) {
      throw new Forbidden('Missing permission');
    }
  };
}

export function authorizeAny(permissions: string[]) {
  return async function preHandler(req: FastifyRequest) {
    const user = req.user;
    if (!user) throw new Unauthorized();
    if (!permissions.some((p) => user.permissions.includes(p))) {
      throw new Forbidden('Missing permission');
    }
  };
}
