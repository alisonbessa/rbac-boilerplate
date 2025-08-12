import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import { createFlagProvider, type FlagProvider } from '@rbac-boilerplate/flags';

declare module 'fastify' {
  interface FastifyInstance {
    flags: FlagProvider;
  }
}

export default fp(async function flagsPlugin(app: FastifyInstance) {
  app.decorate('flags', createFlagProvider());
});
