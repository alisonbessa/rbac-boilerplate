import { db } from './client';
import { roles, permissions, rolePermissions, users, userRoles } from './schema';
import { eq, inArray } from 'drizzle-orm';
import { hashPassword } from '../utils/password';

async function ensureRoles() {
  const names = ['admin', 'professional', 'client'] as const;
  const existing = await db
    .select()
    .from(roles)
    .where(inArray(roles.name, names as unknown as string[]));
  const missing = names.filter((n) => !existing.find((r) => r.name === n));
  if (missing.length) {
    const insertRoles: Array<typeof roles.$inferInsert> = missing.map((name) => ({ name }));
    await db.insert(roles).values(insertRoles);
  }
  const all = await db
    .select()
    .from(roles)
    .where(inArray(roles.name, names as unknown as string[]));
  return Object.fromEntries(all.map((r) => [r.name, r.id])) as Record<
    (typeof names)[number],
    number
  >;
}

async function ensurePermissions() {
  const names = [
    'user.read',
    'user.write',
    'profile.read',
    'profile.write',
    'admin.panel',
  ] as const;
  const existing = await db
    .select()
    .from(permissions)
    .where(inArray(permissions.name, names as unknown as string[]));
  const missing = names.filter((n) => !existing.find((p) => p.name === n));
  if (missing.length) {
    const insertPerms: Array<typeof permissions.$inferInsert> = missing.map((name) => ({ name }));
    await db.insert(permissions).values(insertPerms);
  }
  const all = await db
    .select()
    .from(permissions)
    .where(inArray(permissions.name, names as unknown as string[]));
  return Object.fromEntries(all.map((p) => [p.name, p.id])) as Record<
    (typeof names)[number],
    number
  >;
}

async function ensureRolePermissions(
  roleIds: Record<'admin' | 'professional' | 'client', number>,
  permIds: Record<string, number>,
) {
  const adminPerms = Object.values(permIds);
  const professionalPerms = [
    permIds['user.read']!,
    permIds['user.write']!,
    permIds['profile.read']!,
    permIds['profile.write']!,
  ];
  const clientPerms = [permIds['user.read']!, permIds['profile.read']!];
  const entries: Array<{ roleId: number; permissionId: number }> = [
    ...adminPerms.map((p) => ({ roleId: roleIds.admin, permissionId: p })),
    ...professionalPerms.map((p) => ({ roleId: roleIds.professional, permissionId: p })),
    ...clientPerms.map((p) => ({ roleId: roleIds.client, permissionId: p })),
  ];
  const existing = await db
    .select()
    .from(rolePermissions)
    .where(inArray(rolePermissions.roleId, [roleIds.admin, roleIds.professional, roleIds.client]));
  const existingKey = new Set(existing.map((r) => `${r.roleId}:${r.permissionId}`));
  const toInsert = entries.filter((e) => !existingKey.has(`${e.roleId}:${e.permissionId}`));
  if (toInsert.length) {
    const insertRolePerms: Array<typeof rolePermissions.$inferInsert> = toInsert;
    await db.insert(rolePermissions).values(insertRolePerms);
  }
}

async function ensureUsers(roleIds: Record<'admin' | 'professional' | 'client', number>) {
  // Default admin for local/dev testing
  const defaultAdminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@example.com';
  const defaultAdminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'password123';
  const [existingDefaultAdmin] = await db
    .select()
    .from(users)
    .where(eq(users.email, defaultAdminEmail))
    .limit(1);
  if (!existingDefaultAdmin) {
    const adminHash = await hashPassword(defaultAdminPassword);
    const ins = await db
      .insert(users)
      .values({ email: defaultAdminEmail, passwordHash: adminHash, name: 'Admin User' })
      .returning({ id: users.id });
    await db.insert(userRoles).values({ userId: ins[0]!.id, roleId: roleIds.admin });
  } else {
    const [ur] = await db
      .select()
      .from(userRoles)
      .where(eq(userRoles.userId, existingDefaultAdmin.id))
      .limit(1);
    if (!ur) {
      await db.insert(userRoles).values({ userId: existingDefaultAdmin.id, roleId: roleIds.admin });
    }
  }

  const adminEmails = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  for (const email of adminEmails) {
    const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!existing) {
      const inserted = await db
        .insert(users)
        .values({ email, passwordHash: null, name: 'Admin' })
        .returning({ id: users.id });
      const userId = inserted[0]!.id;
      await db.insert(userRoles).values({ userId, roleId: roleIds.admin });
    } else {
      const [ur] = await db
        .select()
        .from(userRoles)
        .where(eq(userRoles.userId, existing.id))
        .limit(1);
      if (!ur) {
        await db.insert(userRoles).values({ userId: existing.id, roleId: roleIds.admin });
      }
    }
  }

  const [prof] = await db.select().from(users).where(eq(users.email, 'pro@example.com')).limit(1);
  if (!prof) {
    const passwordHash = await hashPassword('password123');
    const ins = await db
      .insert(users)
      .values({ email: 'pro@example.com', passwordHash, name: 'Pro User' })
      .returning({ id: users.id });
    await db.insert(userRoles).values({ userId: ins[0]!.id, roleId: roleIds.professional });
  }

  const [client] = await db
    .select()
    .from(users)
    .where(eq(users.email, 'client@example.com'))
    .limit(1);
  if (!client) {
    const passwordHash = await hashPassword('password123');
    const ins = await db
      .insert(users)
      .values({ email: 'client@example.com', passwordHash, name: 'Client User' })
      .returning({ id: users.id });
    await db.insert(userRoles).values({ userId: ins[0]!.id, roleId: roleIds.client });
  }
}

async function seed() {
  const roleIds = await ensureRoles();
  const permIds = await ensurePermissions();
  await ensureRolePermissions(roleIds, permIds);
  await ensureUsers(roleIds);
}

seed()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
