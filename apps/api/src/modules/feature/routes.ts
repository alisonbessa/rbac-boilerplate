import type { FastifyInstance } from 'fastify';

export async function registerFeatureRoutes(app: FastifyInstance) {
  app.get('/api/v1/flags/:key', async (req) => {
    const key = (req.params as { key: string }).key;
    const res = await app.flags.getFlag(key);
    const dbg = (app.flags as { __debug?: Record<string, unknown> }).__debug;
    if (process.env.FLAGS_DEBUG === 'true' && dbg) {
      app.log.info({ key, result: res, flagsmithDebug: dbg }, 'flagsmith debug snapshot');
    }
    return { key, enabled: res.enabled, value: res.value };
  });

  app.post('/api/v1/test-email', async (req) => {
    const body =
      (req.body as { to?: string; template?: 'reset-password' | 'new-device-login' }) || {};
    const to = body.to || 'test@example.com';
    const template = body.template || 'new-device-login';
    await app.emails.sendEmail({ to, template, variables: {} });
    return { ok: true };
  });
}
