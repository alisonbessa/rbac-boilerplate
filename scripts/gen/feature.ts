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
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ColumnDef, useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table';
import { z } from 'zod';
import { apiFetch } from '../../lib/apiClient';

const Schema = z.object({ name: z.string().min(1) });
type FormValues = z.infer<typeof Schema>;

function use${pascal}List() {
  return useQuery({
    queryKey: ['${kebab}'],
    queryFn: async () => {
      const res = await apiFetch('/api/v1/${kebab}');
      if (!res.ok) throw new Error('Failed to load');
      return (await res.json()) as { items: Array<{ id: number; name?: string }> };
    },
  });
}

function use${pascal}Create() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: FormValues) => {
      const res = await apiFetch('/api/v1/${kebab}', {
        method: 'POST',
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error('Create failed');
      return await res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['${kebab}'] }),
  });
}

export default function ${pascal}Page() {
  const { data } = use${pascal}List();
  const create = use${pascal}Create();
  const form = useForm<FormValues>({ resolver: zodResolver(Schema), defaultValues: { name: '' } });

  const cols: ColumnDef<{ id: number; name?: string }>[] = [
    { accessorKey: 'id', header: 'ID' },
    { accessorKey: 'name', header: 'Name' },
  ];
  const table = useReactTable({
    data: data?.items ?? [],
    columns: cols,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <section className="p-4 space-y-6">
      <h2 className="text-xl font-semibold">${pascal}</h2>
      <form
        className="flex gap-2"
        onSubmit={form.handleSubmit((v) => create.mutate(v))}
      >
        <input className="border px-2 py-1" placeholder="Name" {...form.register('name')} />
        <button className="bg-black text-white px-3 py-1 rounded" type="submit">Create</button>
      </form>

      <div className="overflow-x-auto">
        <table className="min-w-[400px] border">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => (
                  <th key={h.id} className="border px-2 py-1 text-left">{flexRender(h.column.columnDef.header, h.getContext())}</th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="border px-2 py-1">{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
`;

fs.writeFileSync(path.join(webDir, `${pascal}Page.tsx`), indexTsx);
console.log(`Scaffolded feature at ${webDir}`);

// Auto-register route in apps/web/src/router.tsx
const routerPath = path.resolve('apps/web/src/router.tsx');
try {
  const original = fs.readFileSync(routerPath, 'utf8');
  let updated = original;
  const importLine = `import ${pascal}Page from './features/${kebab}/${pascal}Page';\n`;
  if (!updated.includes(importLine)) {
    // insert import after NotFound import
    updated = updated.replace(
      /(import NotFoundPage from '\.\/pages\/NotFound';\n)/,
      `$1${importLine}`,
    );
  }
  const routeDecl = `const ${kebab}Route = createRoute({ getParentRoute: () => rootRoute, path: '/app/${kebab}', component: ${pascal}Page });\n`;
  if (!updated.includes(routeDecl)) {
    // insert after adminRoute or before notFoundRoute
    updated = updated.replace(/(const adminRoute =[\s\S]*?;\n)/, `$1${routeDecl}`);
  }
  if (!updated.includes(`${kebab}Route,`)) {
    updated = updated.replace(/(\s+)notFoundRoute,\n\])/, `$1${kebab}Route,\n$1notFoundRoute,\n]`);
  }
  if (updated !== original) {
    fs.writeFileSync(routerPath, updated);
    console.log('Updated router with new route');
  }
} catch {
  // no-op
}

// Auto-add link in navbar
const navbarPath = path.resolve('apps/web/src/components/Navbar.tsx');
try {
  const original = fs.readFileSync(navbarPath, 'utf8');
  let updated = original;
  const linkSnippet = `<Link to="/app/${kebab}" className="hover:underline">\n              ${pascal}\n            </Link>\n`;
  if (!updated.includes(linkSnippet)) {
    updated = updated.replace(
      /(\s*<Link to="\/demo"[\s\S]*?<\/Link>\n)/,
      `$1            ${linkSnippet}`,
    );
  }
  if (updated !== original) {
    fs.writeFileSync(navbarPath, updated);
    console.log('Updated navbar with new link');
  }
} catch {
  // no-op
}
