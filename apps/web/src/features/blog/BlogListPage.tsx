import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/apiClient';

type Post = { id: number; title: string; slug: string; createdAt: string };

export default function BlogListPage() {
  const [items, setItems] = useState<Post[]>([]);
  useEffect(() => {
    (async () => {
      const res = await apiFetch('/api/v1/blog');
      if (res.ok) {
        const json = (await res.json()) as { items: Post[] };
        setItems(json.items);
      }
    })();
  }, []);
  return (
    <section className="mx-auto max-w-4xl px-4 py-6 space-y-3">
      <h2 className="text-xl font-semibold">Blog</h2>
      <ul className="list-disc ml-6">
        {items.map((p) => (
          <li key={p.id}>
            <a href={`/blog/${p.slug}`} className="underline">
              {p.title} — {new Date(p.createdAt).toLocaleString()}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
