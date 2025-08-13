#!/usr/bin/env tsx
import fs from 'node:fs';
import path from 'node:path';

type Field = { name: string; type: string; modifiers: string[] };

function parseFields(arg: string | undefined): Field[] {
  if (!arg) return [];
  return arg.split(',').map((part) => {
    const [name, type, ...mods] = part.split(':');
    return { name, type: type || 'string', modifiers: mods };
  });
}

function usage(msg?: string) {
  if (msg) console.error(msg);
  console.error(
    'Usage: pnpm gen:resource --name users --fields "name:string,email:string,age:integer"',
  );
  process.exit(1);
}

const args = process.argv.slice(2);
const nameIdx = args.indexOf('--name');
const fieldsIdx = args.indexOf('--fields');
const name = nameIdx >= 0 ? args[nameIdx + 1] : undefined;
const fields = parseFields(fieldsIdx >= 0 ? args[fieldsIdx + 1] : undefined);
if (!name) usage('Missing --name');

const kebab = name!;
const pascal = kebab
  .split(/[-_]/)
  .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
  .join('');

const apiDir = path.resolve('apps/api/src/modules', kebab);
fs.mkdirSync(apiDir, { recursive: true });

const schemaTs = `import { pgTable, serial, text, integer } from 'drizzle-orm/pg-core';

export const ${kebab} = pgTable('${kebab}', {
  id: serial('id').primaryKey(),
  ${fields
    .map(
      (f) =>
        `${f.name}: ${f.type === 'integer' ? "integer('" + f.name + "')" : "text('" + f.name + "')"},`,
    )
    .join('\n  ')}
});
`;

const routesTs = `import type { FastifyInstance } from 'fastify';
import { authorize } from '../../middleware/authorize';
export async function register${pascal}Routes(app: FastifyInstance) {
  app.get('/api/v1/${kebab}', { preHandler: app.authenticate }, async () => ({ items: [] }));
  app.get('/api/v1/${kebab}/:id', { preHandler: app.authenticate }, async () => ({}));
  app.post('/api/v1/${kebab}', { preHandler: [app.authenticate, authorize('user.write')] }, async () => ({}));
  app.patch('/api/v1/${kebab}/:id', { preHandler: [app.authenticate, authorize('user.write')] }, async () => ({}));
  app.delete('/api/v1/${kebab}/:id', { preHandler: [app.authenticate, authorize('user.write')] }, async () => ({}));
}
`;

fs.writeFileSync(path.join(apiDir, 'schema.ts'), schemaTs);
fs.writeFileSync(path.join(apiDir, 'routes.ts'), routesTs);

console.log(`Scaffolded module at ${apiDir}`);

// Optional: auto-register route into app.ts
const appTs = path.resolve('apps/api/src/app.ts');
try {
  const original = fs.readFileSync(appTs, 'utf8');
  if (!original.includes(`register${pascal}Routes`)) {
    let updated = original;
    // add import
    updated = updated.replace(
      /(registerAdminRoutes.*?;\n)/s,
      (m) => `${m}import { register${pascal}Routes } from './modules/${kebab}/routes';\n`,
    );
    // add registration
    updated = updated.replace(
      /(await registerAdminRoutes\(app\);\n)/,
      (m) => `${m}  await register${pascal}Routes(app);\n`,
    );
    fs.writeFileSync(appTs, updated);
    console.log('Updated app.ts with route registration');
  }
} catch {
  // no-op if fails
}
