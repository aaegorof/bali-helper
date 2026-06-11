import { getUserRolesFromClient } from '@/app/lib/route-access-server';
import { getRouteAccessConfig, isPublicRoute } from '@/app/lib/route-access';
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: DO NOT add code between createServerClient and getUser().
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  const isUnprotected =
    pathname.includes('_next/static') ||
    pathname.includes('_next/image') ||
    /\.(svg|png|jpg|jpeg|gif|webp)$/.test(pathname) ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/error') ||
    isPublicRoute(pathname);

  if (!user && !isUnprotected) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Role-based route enforcement
  if (user) {
    const routeConfig = getRouteAccessConfig(pathname);
    if (routeConfig?.requiredRoles && routeConfig.requiredRoles.length > 0) {
      const userRoles = await getUserRolesFromClient(supabase);
      const userRoleSet = new Set(userRoles);
      const hasAccess = routeConfig.requiredRoles.some((role) => userRoleSet.has(role));

      if (!hasAccess) {
        const url = request.nextUrl.clone();
        url.pathname = '/';
        return NextResponse.redirect(url);
      }
    }
  }

  // IMPORTANT: return supabaseResponse as-is to keep cookies in sync.
  return supabaseResponse;
}
