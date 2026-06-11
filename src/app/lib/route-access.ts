import type { EnumAppRole } from '@/app/types/supabase-extended';

export type RouteAccessConfig = {
  requiredRoles?: readonly EnumAppRole[];
};

export const routeAccessConfig = {
  '/permata/backfilling': {
    requiredRoles: ['admin'],
  },
} as const satisfies Record<string, RouteAccessConfig>;

export function getRouteAccessConfig(pathname: string): RouteAccessConfig | undefined {
  return routeAccessConfig[pathname as keyof typeof routeAccessConfig];
}
