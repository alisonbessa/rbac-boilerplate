import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import { createEmailProvider, type EmailProvider } from '@rbac-boilerplate/emails';

declare module 'fastify' {
  interface FastifyInstance {
    emails: EmailProvider;
  }
}

export default fp(async function emailPlugin(app: FastifyInstance) {
  app.decorate('emails', createEmailProvider());
});
