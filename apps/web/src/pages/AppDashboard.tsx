import React, { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useAuth } from '../features/auth/AuthContext';

export default function AppDashboard() {
  const { user, loading, refresh, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: '/login' });
    }
  }, [loading, user, navigate]);

  if (loading || !user) return <p className="px-4 py-10">Loading...</p>;

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <h2 className="text-2xl font-semibold">Dashboard</h2>
      <p className="mt-2">Welcome, {user.email}</p>
      <div className="mt-4 flex gap-2">
        <button className="bg-black text-white px-3 py-1 rounded" onClick={() => refresh()}>
          Refresh
        </button>
        <button
          className="border px-3 py-1 rounded"
          onClick={async () => {
            await logout();
            navigate({ to: '/login' });
          }}
        >
          Logout
        </button>
      </div>
    </section>
  );
}
