### SEO & Blog in the Boilerplate

### SEO basics

- We use `react-helmet-async` to manage per-page `<title>` and meta tags.
- Example in `apps/web/src/pages/Landing.tsx`.
- Recommendations:
  - Set unique titles per page.
  - Provide descriptions and canonical URLs.
  - Consider adding JSON-LD for blog posts (can be generated from API data).

### Blog

- Public endpoints (in-memory sample):
  - `GET /api/v1/blog` — list posts
  - `GET /api/v1/blog/:slug` — view post
- Admin endpoint:
  - `POST /api/v1/admin/blog` — create post (protected via `admin.panel`)
- Frontend pages:
  - `/blog` (list) and `/blog/$slug` (detail)
  - `/admin/blog` (WYSIWYG editor with React Quill)

### Production considerations

- Persist posts in DB and add migrations (Drizzle) — replace in-memory array.
- Add slugs uniqueness and drafts/publish workflow.
- Generate OpenGraph/Twitter image URLs for richer previews.
- Add sitemap and RSS feed endpoints for SEO.
- Implement caching for list/detail responses.
