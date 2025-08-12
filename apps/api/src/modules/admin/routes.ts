import type { FastifyInstance } from 'fastify';
import { authorize } from '../../middleware/authorize';
import { env } from '../../env';

export async function registerAdminRoutes(app: FastifyInstance) {
  const allowlist = new Set(
    (env.ADMIN_EMAILS || '')
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  );

  const requireAllowlist = async (req: any) => {
    const email = req.user?.email?.toLowerCase();
    if (!email || !allowlist.has(email)) {
      const err = new Error('Not in admin allowlist');
      // @ts-expect-error attach statusCode for Fastify
      err.statusCode = 403;
      throw err;
    }
  };

  app.get(
    '/api/v1/admin/ping',
    { preHandler: [app.authenticate, requireAllowlist, authorize('admin.panel')] },
    async () => {
      return { pong: true };
    },
  );
}
