import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import { createStorageProvider, type StorageProvider } from '@rbac-boilerplate/storage';

declare module 'fastify' {
  interface FastifyInstance {
    storage: StorageProvider;
  }
}

export default fp(async function storagePlugin(app: FastifyInstance) {
  app.decorate('storage', createStorageProvider());
});
