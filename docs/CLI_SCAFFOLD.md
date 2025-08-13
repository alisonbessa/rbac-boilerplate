### CLI Scaffolding

This template includes basic generators to speed up development.

### Backend resource generator

Command:

```
pnpm gen:resource --name users --fields "name:string,email:string:unique,active:boolean"
```

What it does:

- Creates `apps/api/src/modules/<name>/{schema.ts,routes.ts}` with CRUD stubs and a Drizzle table draft.
- Protects write routes with `authorize('user.write')` and requires auth on reads.
- Auto-injects route import/registration into `apps/api/src/app.ts`.

Notes:

- Extend to generate migrations and Zod schemas as needed.

### Frontend feature generator

Command:

```
pnpm gen:feature --name profile
```

What it does:

- Creates `apps/web/src/features/<name>/<PascalName>Page.tsx` with a simple page component.

Next steps:

- Extend to also add route registration and common patterns (forms/tables) using TanStack Router/Query and RHF.
