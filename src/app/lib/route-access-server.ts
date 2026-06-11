import { createClient } from '@/app/lib/supabase/server';
import { getRouteAccessConfig } from '@/app/lib/route-access';
import type { EnumAppRole } from '@/app/types/supabase-extended';

type RoleProtectedItem = {
  requiredRoles?: readonly EnumAppRole[];
};

export async function getCurrentUserRoles(): Promise<EnumAppRole[]> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return [];
  }

  const { data, error } = await supabase.from('user_roles').select('role').eq('user_id', user.id);

  if (error) {
    console.error('Failed to load user roles:', error);
    return [];
  }

  return (data ?? []).map(({ role }) => role);
}

export async function hasRequiredRole(requiredRoles?: readonly EnumAppRole[]): Promise<boolean> {
  if (!requiredRoles || requiredRoles.length === 0) {
    return true;
  }

  const userRoles = await getCurrentUserRoles();
  const userRoleSet = new Set(userRoles);

  return requiredRoles.some((role) => userRoleSet.has(role));
}

export async function hasRouteAccess(pathname: string): Promise<boolean> {
  const config = getRouteAccessConfig(pathname);
  return hasRequiredRole(config?.requiredRoles);
}

export async function getAllowedRoleProtectedItems<T extends RoleProtectedItem>(
  items: readonly T[]
): Promise<T[]> {
  const protectedItems = items.filter((item) => item.requiredRoles?.length);

  if (protectedItems.length === 0) {
    return [...items];
  }

  const userRoles = await getCurrentUserRoles();
  const userRoleSet = new Set(userRoles);

  return items.filter((item) => {
    if (!item.requiredRoles || item.requiredRoles.length === 0) {
      return true;
    }

    return item.requiredRoles.some((role) => userRoleSet.has(role));
  });
}
