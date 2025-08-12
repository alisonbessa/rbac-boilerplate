import React from 'react';
import { Link } from '@tanstack/react-router';

export default function LandingPage() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <div className="grid gap-8 md:grid-cols-2 md:items-center">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">RBAC Boilerplate</h1>
          <p className="mt-3 text-gray-600 dark:text-gray-300">
            Fast monorepo starter with authentication, authorization, and modern DX.
          </p>
          <ul className="mt-6 space-y-2 text-sm">
            <li>• Fastify v5 API with JWT + refresh rotation</li>
            <li>• RBAC with roles and permissions</li>
            <li>• Postgres + Drizzle ORM</li>
            <li>• React + TanStack Router + Tailwind</li>
          </ul>
          <div className="mt-6 flex gap-3">
            <Link
              to="/login"
              className="inline-flex items-center rounded bg-black text-white px-4 py-2 text-sm dark:bg-white dark:text-black"
            >
              Get Started
            </Link>
            <a
              href="https://github.com/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center rounded border px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-slate-800"
            >
              GitHub
            </a>
          </div>
        </div>
        <div className="rounded-lg border p-6">
          <h2 className="font-semibold mb-2">What you get</h2>
          <ul className="list-disc ml-5 text-sm space-y-1">
            <li>Secure cookie-based auth (httpOnly, SameSite=strict)</li>
            <li>CSRF protection with double-submit token</li>
            <li>Device-bound sessions</li>
            <li>CI-ready monorepo with pnpm + Turbo</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
