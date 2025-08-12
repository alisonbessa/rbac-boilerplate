import React from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useAuth } from '../features/auth/AuthContext';

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="border-b bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/50 dark:bg-slate-900/70">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="font-semibold">
            RBAC Boilerplate
          </Link>
          <nav className="hidden md:flex items-center gap-4 text-sm">
            <Link to="/" className="hover:underline">
              Home
            </Link>
            <Link to="/app" className="hover:underline">
              App
            </Link>
            <Link to="/admin" className="hover:underline">
              Admin
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          {!user && (
            <Link
              to="/login"
              className="inline-flex items-center rounded border px-3 py-1 text-sm hover:bg-gray-50 dark:hover:bg-slate-800"
            >
              Login / Register
            </Link>
          )}
          {user && (
            <>
              <span className="hidden sm:inline text-sm text-gray-600 dark:text-gray-300">
                {user.email}
              </span>
              <button
                className="inline-flex items-center rounded bg-black text-white px-3 py-1 text-sm dark:bg-white dark:text-black"
                onClick={async () => {
                  await logout();
                  navigate({ to: '/login' });
                }}
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
