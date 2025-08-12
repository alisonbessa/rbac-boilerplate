import React from 'react';
import { Link } from '@tanstack/react-router';

export default function NotFoundPage() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-10">
      <h2 className="text-2xl font-semibold">Page not found</h2>
      <p className="mt-2 text-gray-600 dark:text-gray-300">
        The page you requested does not exist.
      </p>
      <div className="mt-6">
        <Link to="/" className="underline">
          Go back home
        </Link>
      </div>
    </section>
  );
}
