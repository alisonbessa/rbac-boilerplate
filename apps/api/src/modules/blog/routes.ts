import type { FastifyInstance } from 'fastify';
import { authorize } from '../../middleware/authorize';
import { blogPosts } from '../../db/schema';
import { db } from '../../db/client';
import { eq, desc } from 'drizzle-orm';
import { globalCache } from '../../utils/cache';

export async function registerBlogRoutes(app: FastifyInstance) {
  type BlogPostRow = typeof blogPosts.$inferSelect;
  app.get('/api/v1/blog', async () => {
    const cached =
      globalCache.get<{ id: number; slug: string; title: string; createdAt: Date }[]>('blog:list');
    if (cached) return { items: cached };
    const items = await db
      .select({
        id: blogPosts.id,
        slug: blogPosts.slug,
        title: blogPosts.title,
        createdAt: blogPosts.createdAt,
      })
      .from(blogPosts)
      .where(eq(blogPosts.status, 'published'))
      .orderBy(desc(blogPosts.publishedAt));
    globalCache.set('blog:list', items, 60_000);
    return { items };
  });
  app.get('/api/v1/blog/:slug', async (req) => {
    const slug = (req.params as { slug: string }).slug;
    const cacheKey = `blog:slug:${slug}`;
    const cached = globalCache.get<BlogPostRow>(cacheKey);
    if (cached) return { post: cached };
    const [post] = await db.select().from(blogPosts).where(eq(blogPosts.slug, slug)).limit(1);
    if (!post || post.status !== 'published') {
      const err: Error & { statusCode?: number } = new Error('Not found');
      err.statusCode = 404;
      throw err;
    }
    globalCache.set(cacheKey, post, 60_000);
    return { post };
  });
  app.post(
    '/api/v1/admin/blog',
    { preHandler: [app.authenticate, authorize('admin.panel')] },
    async (req) => {
      const body =
        (req.body as { title?: string; html?: string; status?: 'draft' | 'published' }) || {};
      if (!body.title || !body.html) {
        const err: Error & { statusCode?: number } = new Error('Invalid body');
        err.statusCode = 400;
        throw err;
      }
      const slug = body.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      const status = body.status || 'published';
      const [existing] = await db.select().from(blogPosts).where(eq(blogPosts.slug, slug)).limit(1);
      if (existing) {
        const [updated] = await db
          .update(blogPosts)
          .set({ title: body.title, html: body.html, status, updatedAt: new Date() })
          .where(eq(blogPosts.id, existing.id))
          .returning();
        globalCache.invalidate('blog:');
        return { post: updated };
      }
      const [created] = await db
        .insert(blogPosts)
        .values({
          title: body.title,
          slug,
          html: body.html,
          status,
          publishedAt: status === 'published' ? new Date() : null,
        })
        .returning();
      globalCache.invalidate('blog:');
      return { post: created };
    },
  );

  app.get('/sitemap.xml', async (_req, reply) => {
    const base = process.env.APP_URL || 'http://localhost:5173';
    const items = await db
      .select({ slug: blogPosts.slug, updatedAt: blogPosts.updatedAt })
      .from(blogPosts)
      .where(eq(blogPosts.status, 'published'))
      .orderBy(desc(blogPosts.publishedAt));
    const urls = items
      .map(
        (i) =>
          `  <url><loc>${base}/blog/${i.slug}</loc><lastmod>${new Date(
            i.updatedAt ?? new Date(),
          ).toISOString()}</lastmod></url>`,
      )
      .join('\n');
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
    reply.header('Content-Type', 'application/xml');
    return xml;
  });

  app.get('/rss.xml', async (_req, reply) => {
    const base = process.env.APP_URL || 'http://localhost:5173';
    const items = await db
      .select({ slug: blogPosts.slug, title: blogPosts.title, publishedAt: blogPosts.publishedAt })
      .from(blogPosts)
      .where(eq(blogPosts.status, 'published'))
      .orderBy(desc(blogPosts.publishedAt));
    const entries = items
      .map(
        (i) =>
          `  <item><title>${i.title}</title><link>${base}/blog/${i.slug}</link><pubDate>${new Date(
            i.publishedAt ?? new Date(),
          ).toUTCString()}</pubDate></item>`,
      )
      .join('\n');
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel><title>RBAC Boilerplate</title><link>${base}</link>${entries}</channel></rss>`;
    reply.header('Content-Type', 'application/rss+xml');
    return xml;
  });
}
