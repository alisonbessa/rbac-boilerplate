import { db } from '../db/client';
import { users, roles, permissions, rolePermissions, userRoles } from '../db/schema';
import { eq, inArray, and } from 'drizzle-orm';

export async function getUserWithAccess(userId: number) {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) throw new Error('User not found');
  const userRoleRows = await db
    .select({ roleId: userRoles.roleId })
    .from(userRoles)
    .where(eq(userRoles.userId, userId));
  const roleIds = userRoleRows.map((r) => r.roleId);
  const roleRows = roleIds.length
    ? await db.select().from(roles).where(inArray(roles.id, roleIds))
    : [];
  const rpRows = roleIds.length
    ? await db
        .select({ permissionId: rolePermissions.permissionId })
        .from(rolePermissions)
        .where(inArray(rolePermissions.roleId, roleIds))
    : [];
  const permIds = rpRows.map((r) => r.permissionId);
  const permRows = permIds.length
    ? await db.select().from(permissions).where(inArray(permissions.id, permIds))
    : [];
  return {
    user,
    roles: roleRows.map((r) => r.name),
    permissions: permRows.map((p) => p.name),
  };
}

export async function userHasPermission(userId: number, permission: string): Promise<boolean> {
  const rp = await db
    .select({ id: permissions.id })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .innerJoin(rolePermissions, eq(rolePermissions.roleId, roles.id))
    .innerJoin(permissions, eq(permissions.id, rolePermissions.permissionId))
    .where(and(eq(userRoles.userId, userId), eq(permissions.name, permission)))
    .limit(1);
  return rp.length > 0;
}
