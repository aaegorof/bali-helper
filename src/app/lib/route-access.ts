import type { EnumAppRole } from '@/app/types/supabase-extended';

export type RouteAccessConfig = {
  requiredRoles?: readonly EnumAppRole[];
};

/**
 * Routes accessible without authentication.
 * Prefix-based: '/about' also covers '/about/team'.
 */
export const publicRoutes: readonly string[] = ['/'];

export function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(route === '/' ? '\0' : route + '/')
  );
}

/**
 * Single source of truth for route-level role requirements.
 * Used by both the middleware (edge enforcement) and the menu (visibility).
 *
 * Matching is prefix-based: a config entry for '/transactions' also covers
 * '/transactions/backfilling' unless a more-specific entry overrides it.
 */
export const routeAccessConfig = {
  '/transactions': {
    requiredRoles: ['editor', 'admin'] as const,
  },
  '/transactions/backfilling': {
    requiredRoles: ['admin'] as const,
  },
} as const satisfies Record<string, RouteAccessConfig>;

/**
 * Returns the most-specific matching config for a pathname.
 * Tries exact match first, then walks up path segments.
 */
export function getRouteAccessConfig(pathname: string): RouteAccessConfig | undefined {
  // Exact match
  if (pathname in routeAccessConfig) {
    return routeAccessConfig[pathname as keyof typeof routeAccessConfig];
  }
  // Prefix match — find the longest matching prefix
  const segments = pathname.split('/').filter(Boolean);
  for (let i = segments.length - 1; i >= 0; i--) {
    const prefix = '/' + segments.slice(0, i + 1).join('/');
    if (prefix in routeAccessConfig) {
      return routeAccessConfig[prefix as keyof typeof routeAccessConfig];
    }
  }
  return undefined;
}
