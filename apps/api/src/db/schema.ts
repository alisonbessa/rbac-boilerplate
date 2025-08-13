import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  primaryKey,
  uniqueIndex,
  pgEnum,
} from 'drizzle-orm/pg-core';

export const users = pgTable(
  'users',
  {
    id: serial('id').primaryKey(),
    email: text('email').notNull(),
    passwordHash: text('password_hash'),
    name: text('name'),
    createdAt: timestamp('created_at', { withTimezone: false }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).defaultNow(),
  },
  (table) => ({ usersEmailUnique: uniqueIndex('users_email_unique').on(table.email) }),
);

export const roles = pgTable(
  'roles',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
  },
  (table) => ({ rolesNameUnique: uniqueIndex('roles_name_unique').on(table.name) }),
);

export const permissions = pgTable(
  'permissions',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
  },
  (table) => ({ permsNameUnique: uniqueIndex('permissions_name_unique').on(table.name) }),
);

export const rolePermissions = pgTable(
  'role_permissions',
  {
    roleId: integer('role_id').notNull(),
    permissionId: integer('permission_id').notNull(),
  },
  (t) => ({ pk: primaryKey({ columns: [t.roleId, t.permissionId] }) }),
);

export const userRoles = pgTable(
  'user_roles',
  {
    userId: integer('user_id').notNull(),
    roleId: integer('role_id').notNull(),
  },
  (t) => ({ pk: primaryKey({ columns: [t.userId, t.roleId] }) }),
);

export const sessions = pgTable('sessions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  deviceId: text('device_id').notNull(),
  refreshTokenHash: text('refresh_token_hash').notNull(),
  userAgent: text('user_agent'),
  ip: text('ip'),
  createdAt: timestamp('created_at', { withTimezone: false }).defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: false }),
  revokedAt: timestamp('revoked_at', { withTimezone: false }),
});

export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  action: text('action').notNull(),
  resource: text('resource').notNull(),
  resourceId: integer('resource_id'),
  meta: text('meta'),
  createdAt: timestamp('created_at', { withTimezone: false }).defaultNow(),
});

export const userCredentials = pgTable('user_credentials', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  type: text('type').notNull(),
  provider: text('provider'),
  providerUserId: text('provider_user_id'),
  emailVerified: integer('email_verified'),
  createdAt: timestamp('created_at', { withTimezone: false }).defaultNow(),
});

// Blog
export const postStatusEnum = pgEnum('post_status', ['draft', 'published']);

export const blogPosts = pgTable(
  'blog_posts',
  {
    id: serial('id').primaryKey(),
    slug: text('slug').notNull(),
    title: text('title').notNull(),
    html: text('html').notNull(),
    status: postStatusEnum('status').notNull(),
    createdAt: timestamp('created_at', { withTimezone: false }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).defaultNow(),
    publishedAt: timestamp('published_at', { withTimezone: false }),
  },
  (t) => ({ blogSlugUnique: uniqueIndex('blog_posts_slug_unique').on(t.slug) }),
);
