import Fastify, { FastifyInstance, type FastifyRequest } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import cookie from '@fastify/cookie';
import rateLimit from '@fastify/rate-limit';
import { Registry, collectDefaultMetrics, Counter, Histogram } from 'prom-client';
import { env } from './env';
import authPlugin from './plugins/auth';
import csrfPlugin from './plugins/csrf';
import flagsPlugin from './plugins/flags';
import emailPlugin from './plugins/email';
import { registerAuthRoutes } from './modules/auth/routes';
import { registerAdminRoutes } from './modules/admin/routes';
import { registerFeatureRoutes } from './modules/feature/routes';
import storagePlugin from './plugins/storage';
import { registerStorageRoutes } from './modules/storage/routes';
import { registerBlogRoutes } from './modules/blog/routes';

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      transport: undefined,
      redact: {
        paths: [
          'req.headers.authorization',
          'req.headers.cookie',
          'res.headers["set-cookie"]',
          'body.password',
        ],
        remove: true,
      },
    },
  });

  const requestStartTimes = new WeakMap<FastifyRequest, bigint>();

  await app.register(cors, { origin: env.WEB_ORIGIN, credentials: true });
  await app.register(helmet);
  await app.register(cookie, { secret: process.env.AUTH_PEPPER ?? undefined });
  await app.register(rateLimit, { max: 100, timeWindow: '1 minute' });
  await app.register(authPlugin);
  await app.register(csrfPlugin);
  await app.register(flagsPlugin);
  await app.register(emailPlugin);
  await app.register(storagePlugin);

  const registry = new Registry();
  collectDefaultMetrics({ register: registry, prefix: 'api_' });
  const httpRequestCounter = new Counter({
    name: 'http_requests_total',
    help: 'Total HTTP requests',
    labelNames: ['method', 'route', 'status'] as const,
    registers: [registry],
  });
  const httpLatency = new Histogram({
    name: 'http_request_duration_ms',
    help: 'HTTP request duration in ms',
    labelNames: ['method', 'route', 'status'] as const,
    buckets: [50, 100, 200, 400, 800, 1600, 5000],
    registers: [registry],
  });

  app.addHook('onRequest', async (req) => {
    requestStartTimes.set(req, process.hrtime.bigint());
  });

  app.addHook('onResponse', async (req, reply) => {
    const route = req.routeOptions?.url ?? req.url;
    const status = String(reply.statusCode);
    httpRequestCounter.labels(req.method, route, status).inc();
    const start = requestStartTimes.get(req);
    const diffNs = start ? Number(process.hrtime.bigint() - start) : 0;
    const latencyMs = diffNs / 1e6;
    httpLatency.labels(req.method, route, status).observe(latencyMs);
  });

  app.get('/healthz', async () => ({ status: 'ok' }));
  app.get('/readyz', async () => ({ status: 'ready' }));
  app.get('/metrics', async (_req, reply) => {
    reply.header('Content-Type', registry.contentType);
    return registry.metrics();
  });

  await registerAuthRoutes(app);
  await registerAdminRoutes(app);
  await registerFeatureRoutes(app);
  await registerStorageRoutes(app);
  await registerBlogRoutes(app);

  return app;
}
