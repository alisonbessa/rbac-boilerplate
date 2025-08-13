import React, { useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { apiFetch } from '../../lib/apiClient';

export default function AdminBlogPage() {
  const [title, setTitle] = useState('');
  const [html, setHtml] = useState('');
  const [msg, setMsg] = useState('');
  return (
    <section className="mx-auto max-w-4xl px-4 py-6 space-y-4">
      <h2 className="text-xl font-semibold">New Post</h2>
      <input
        className="border px-2 py-1 w-full"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <ReactQuill theme="snow" value={html} onChange={setHtml} />
      <button
        className="bg-black text-white px-3 py-1 rounded"
        onClick={async () => {
          const res = await apiFetch('/api/v1/admin/blog', {
            method: 'POST',
            body: JSON.stringify({ title, html }),
          });
          setMsg(res.ok ? 'Saved' : `Error ${res.status}`);
        }}
      >
        Publish
      </button>
      {msg && <p className="text-sm">{msg}</p>}
    </section>
  );
}
