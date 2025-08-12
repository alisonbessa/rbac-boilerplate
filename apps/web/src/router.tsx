import React from 'react';
import {
  Link,
  Outlet,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
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
      <p>Home. Use a navegação acima para visitar as páginas.</p>
    </div>
  );
}

import { LoginForm } from './features/auth/Login';

function LoginPage() {
  return (
    <div>
      <h2>Login</h2>
      <LoginForm />
    </div>
  );
}

function AppPage() {
  return (
    <div>
      <h2>App</h2>
      <p>Área autenticada (placeholder).</p>
    </div>
  );
}

function AdminPage() {
  return (
    <div>
      <h2>Admin</h2>
      <p>Área administrativa (placeholder; acesso será protegido).</p>
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
  return <RouterProvider router={router} />;
}
