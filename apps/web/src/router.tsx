import {
  Outlet,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { AuthProvider } from './features/auth/AuthContext';
import { Navbar } from './components/Navbar';
import LandingPage from './pages/Landing';
import LoginPage from './pages/Login';
import AppDashboard from './pages/AppDashboard';
import AdminPage from './pages/Admin';
import NotFoundPage from './pages/NotFound';

function RootLayout() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <Outlet />
      </main>
    </div>
  );
}

const rootRoute = createRootRoute({ component: RootLayout });
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: LandingPage,
});
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
});
const appRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/app',
  component: AppDashboard,
});
const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin',
  component: AdminPage,
});
const notFoundRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '*',
  component: NotFoundPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  appRoute,
  adminRoute,
  notFoundRoute,
]);

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
