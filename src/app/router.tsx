import { createRootRoute, createRoute, createRouter } from '@tanstack/react-router';
import { AppLayout } from './AppLayout';
import { LintPage } from '../pages/lint/LintPage';
import { RulesPage } from '../pages/rules/RulesPage';

const rootRoute = createRootRoute({
  component: AppLayout,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: LintPage,
});

const rulesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/rules',
  component: RulesPage,
});

const routeTree = rootRoute.addChildren([indexRoute, rulesRoute]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
