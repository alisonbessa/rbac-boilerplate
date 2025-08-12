import React, { useEffect } from 'react';
import {
  Link,
  Outlet,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
  useNavigate,
} from '@tanstack/react-router';

function RootLayout() {
  return (
    <div style={{ fontFamily: 'system-ui, Arial, sans-serif', padding: 24 }}>
      <nav style={{ marginBottom: 16, display: 'flex', gap: 12 }}>
        <Link to="/login">Login</Link>
        <Link to="/app">App</Link>
        <Link to="/admin">Admin</Link>
      </nav>
      <Outlet />
    </div>
  );
}

function HomePage() {
  return (
    <div>
      <h1>RBAC Web</h1>
      <p>Home. Use the navigation above to visit pages.</p>
    </div>
  );
}

import { LoginForm } from './features/auth/Login';
import { RegisterForm } from './features/auth/Register';
import { AuthProvider, useAuth } from './features/auth/AuthContext';

function LoginPage() {
  return (
    <div>
      <h2>Login</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <LoginForm />
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2">Create an account</h3>
          <RegisterForm />
        </div>
      </div>
    </div>
  );
}

function AppPage() {
  const { user, loading, refresh, logout } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: '/login' });
    }
  }, [loading, user, navigate]);
  if (loading || !user) return <p>Loading...</p>;
  return (
    <div>
      <h2>App</h2>
      <p>Welcome, {user.email}</p>
      <button className="bg-black text-white px-3 py-1 rounded" onClick={() => refresh()}>
        Refresh
      </button>
      <button
        className="ml-2 border px-3 py-1 rounded"
        onClick={async () => {
          await logout();
          navigate({ to: '/login' });
        }}
      >
        Logout
      </button>
    </div>
  );
}

function AdminPage() {
  const { user, loading } = useAuth();
  if (loading) return <p>Loading...</p>;
  if (!user) return <p>Not authenticated.</p>;
  const isAllowed = user.permissions?.includes('admin.panel');
  if (!isAllowed) return <p>Forbidden (missing admin.panel)</p>;
  return (
    <div>
      <h2>Admin</h2>
      <p>Administrative area.</p>
    </div>
  );
}

const rootRoute = createRootRoute({ component: RootLayout });
const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: HomePage });
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
});
const appRoute = createRoute({ getParentRoute: () => rootRoute, path: '/app', component: AppPage });
const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin',
  component: AdminPage,
});

const routeTree = rootRoute.addChildren([indexRoute, loginRoute, appRoute, adminRoute]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export function AppRouterProvider() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
