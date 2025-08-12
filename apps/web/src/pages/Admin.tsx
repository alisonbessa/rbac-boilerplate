import React from 'react';
import { useAuth } from '../features/auth/AuthContext';

export default function AdminPage() {
  const { user, loading } = useAuth();

  if (loading) return <p className="px-4 py-10">Loading...</p>;
  if (!user) return <p className="px-4 py-10">Not authenticated.</p>;
  const isAllowed = user.permissions?.includes('admin.panel');
  if (!isAllowed) return <p className="px-4 py-10">Forbidden (missing admin.panel)</p>;

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <h2 className="text-2xl font-semibold">Admin</h2>
      <p className="mt-2">Administrative area.</p>
    </section>
  );
}
