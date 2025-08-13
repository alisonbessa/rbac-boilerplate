import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/apiClient';
import { useParams } from '@tanstack/react-router';
import { Helmet, HelmetProvider } from 'react-helmet-async';

type Post = { id: number; title: string; slug: string; html: string; createdAt: string };

export default function BlogPostPage() {
  const { slug } = useParams({ strict: false }) as { slug: string };
  const [post, setPost] = useState<Post | null>(null);
  useEffect(() => {
    (async () => {
      const res = await apiFetch(`/api/v1/blog/${encodeURIComponent(slug)}`);
      if (res.ok) {
        const json = (await res.json()) as { post: Post };
        setPost(json.post);
      }
    })();
  }, [slug]);
  if (!post) return <p className="p-4">Loading...</p>;
  const title = `${post.title} — RBAC Boilerplate`;
  const desc = post.html.replace(/<[^>]+>/g, '').slice(0, 160);
  const url = `/blog/${post.slug}`;
  return (
    <HelmetProvider>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={desc} />
        <link rel="canonical" href={url} />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={desc} />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: post.title,
            datePublished: post.createdAt,
            url,
          })}
        </script>
      </Helmet>
      <article className="prose dark:prose-invert mx-auto max-w-3xl px-4 py-6">
        <h1>{post.title}</h1>
        <div dangerouslySetInnerHTML={{ __html: post.html }} />
      </article>
    </HelmetProvider>
  );
}
