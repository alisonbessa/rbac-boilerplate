#!/usr/bin/env tsx
import fs from 'node:fs';
import path from 'node:path';

function usage(msg?: string) {
  if (msg) console.error(msg);
  console.error('Usage: pnpm gen:feature --name profile');
  process.exit(1);
}

const args = process.argv.slice(2);
const nameIdx = args.indexOf('--name');
const name = nameIdx >= 0 ? args[nameIdx + 1] : undefined;
if (!name) usage('Missing --name');

const kebab = name!;
const pascal = kebab
  .split(/[-_]/)
  .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
  .join('');

const webDir = path.resolve('apps/web/src/features', kebab);
fs.mkdirSync(webDir, { recursive: true });

const indexTsx = `import React from 'react';

export default function ${pascal}Page() {
  return (
    <section className="p-4">
      <h2 className="text-xl font-semibold">${pascal}</h2>
      <p>Generated feature scaffold.</p>
    </section>
  );
}
`;

fs.writeFileSync(path.join(webDir, `${pascal}Page.tsx`), indexTsx);
console.log(`Scaffolded feature at ${webDir}`);
