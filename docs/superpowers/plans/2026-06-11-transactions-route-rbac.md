# Transactions Route RBAC & Path Rename Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename the `permata` route to `transactions`, add role-based access control driven by the `user_roles` Supabase table, restrict `/transactions` to `editor`+`admin` roles and `/transactions/backfilling` to `admin` only — enforced both in the middleware and in the menu.

**Architecture:** A single `routeAccessConfig` in `src/app/lib/route-access.ts` acts as the one source of truth for route→role mappings. The Next.js middleware reads this config to redirect unauthorized users at the edge. The menu reads the same config (via `requiredRoles` on `MenuItem`) to hide links. User roles are fetched from the `user_roles` Supabase table.

**Tech Stack:** Next.js 15 App Router, Supabase SSR (`@supabase/ssr`), TypeScript, `EnumAppRole` from generated types.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/app/lib/route-access.ts` | **Modify** | Central route→roles config; add `/transactions` and `/transactions/backfilling` entries |
| `src/app/lib/route-access-server.ts` | **Modify** | `getCurrentUserRoles()` already queries `user_roles` — no change needed to logic; expose a middleware-compatible variant that works with a raw Supabase client |
| `src/app/lib/supabase/middleware.ts` | **Modify** | After auth check, fetch user roles and enforce route access config |
| `src/middleware.ts` | **Modify** | Update matcher to `/transactions/:path*` |
| `src/components/menuItems.tsx` | **Modify** | Rename hrefs `/permata` → `/transactions`, add `requiredRoles: ['editor', 'admin']` to the Transactions menu item |
| `src/app/permata/` directory | **Rename** | Move entire folder to `src/app/transactions/` |
| `src/app/transactions/**` (all files) | **Modify** | Update all internal `@/app/permata/` import paths to `@/app/transactions/` |
| `src/app/transactions/backfilling/actions.ts` | **Modify** | Update `revalidatePath` from `/permata/backfilling` to `/transactions/backfilling` |
| `src/app/transactions/page.tsx` | **Modify** | Update heading from "Permata" to "Transactions" |
| `docs/PROJECT_OVERVIEW.md` | **Modify** | Update path references from `/permata` to `/transactions` |

---

## Task 1: Update `routeAccessConfig` — add `transactions` routes

**Files:**
- Modify: `src/app/lib/route-access.ts`

- [ ] **Step 1: Read the current file**

```
src/app/lib/route-access.ts
```

Current content:
```typescript
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
```

- [ ] **Step 2: Replace with the new config**

Replace the file content with:
```typescript
import type { EnumAppRole } from '@/app/types/supabase-extended';

export type RouteAccessConfig = {
  requiredRoles?: readonly EnumAppRole[];
};

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
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | head -40`
Expected: no errors from `route-access.ts`

- [ ] **Step 4: Commit**

```bash
git add src/app/lib/route-access.ts
git commit -m "feat(rbac): add prefix-based routeAccessConfig for transactions routes"
```

---

## Task 2: Expose `getUserRolesForMiddleware` in `route-access-server.ts`

The existing `getCurrentUserRoles()` uses `createClient()` (server-side helper). The middleware needs to pass its own Supabase client. We add an overloaded helper that accepts a client.

**Files:**
- Modify: `src/app/lib/route-access-server.ts`

- [ ] **Step 1: Read the current file**

```
src/app/lib/route-access-server.ts
```

- [ ] **Step 2: Add a client-accepting variant**

Replace the file content with:
```typescript
import { createClient } from '@/app/lib/supabase/server';
import { getRouteAccessConfig } from '@/app/lib/route-access';
import type { EnumAppRole } from '@/app/types/supabase-extended';
import type { SupabaseClient } from '@supabase/supabase-js';

type RoleProtectedItem = {
  requiredRoles?: readonly EnumAppRole[];
};

export async function getCurrentUserRoles(): Promise<EnumAppRole[]> {
  const supabase = await createClient();
  return getUserRolesFromClient(supabase);
}

/**
 * Fetch roles using a pre-existing Supabase client.
 * Used by the middleware which constructs its own client.
 */
export async function getUserRolesFromClient(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>
): Promise<EnumAppRole[]> {
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

  return (data ?? []).map(({ role }: { role: EnumAppRole }) => role);
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
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | head -40`
Expected: no errors from `route-access-server.ts`

- [ ] **Step 4: Commit**

```bash
git add src/app/lib/route-access-server.ts
git commit -m "feat(rbac): expose getUserRolesFromClient for middleware use"
```

---

## Task 3: Enforce route access in middleware

**Files:**
- Modify: `src/app/lib/supabase/middleware.ts`
- Modify: `src/middleware.ts`

- [ ] **Step 1: Update `src/app/lib/supabase/middleware.ts`**

Replace the file content with:
```typescript
import { getUserRolesFromClient } from '@/app/lib/route-access-server';
import { getRouteAccessConfig } from '@/app/lib/route-access';
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

  const isStaticOrAuth =
    pathname.includes('_next/static') ||
    pathname.includes('_next/image') ||
    /\.(svg|png|jpg|jpeg|gif|webp)$/.test(pathname) ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/error');

  if (!user && !isStaticOrAuth) {
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
```

- [ ] **Step 2: Update `src/middleware.ts` matcher**

Replace the file content with:
```typescript
import { updateSession } from '@/app/lib/supabase/middleware';
import { type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.[^/]+$).*)',
    '/transactions/:path*',
    '/api/:path*',
  ],
};
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | head -40`
Expected: no errors from `middleware.ts` or `supabase/middleware.ts`

- [ ] **Step 4: Commit**

```bash
git add src/app/lib/supabase/middleware.ts src/middleware.ts
git commit -m "feat(rbac): enforce role-based route access in Next.js middleware"
```

---

## Task 4: Update `menuItems.tsx` — rename paths and add roles

**Files:**
- Modify: `src/components/menuItems.tsx`

- [ ] **Step 1: Replace the file content**

```typescript
import type { EnumAppRole } from '@/app/types/supabase-extended';

export type MenuItem = {
  title: string;
  description: string;
  href: string;
  authMatcher?: string;
  requiredRoles?: readonly EnumAppRole[];
};

export const menuItems = [
  { title: 'Home', description: 'Home', href: '/' },
  {
    title: 'Backfilling',
    description: 'Backfill transaction embeddings',
    href: '/transactions/backfilling',
    requiredRoles: ['admin'] as const,
  },
  {
    title: 'Transactions',
    description: 'Manage and categorize your financial transactions',
    href: '/transactions',
    authMatcher: '/transactions/:path*',
    requiredRoles: ['editor', 'admin'] as const,
  },
] satisfies MenuItem[];
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | head -40`
Expected: no errors from `menuItems.tsx`

- [ ] **Step 3: Commit**

```bash
git add src/components/menuItems.tsx
git commit -m "feat(rbac): update menu items — rename permata→transactions, add role guards"
```

---

## Task 5: Rename directory `src/app/permata/` → `src/app/transactions/`

This is a filesystem move. All internal imports (`@/app/permata/...`) must then be updated.

**Files:**
- Rename: `src/app/permata/` → `src/app/transactions/`
- Modify: every file inside that now references `@/app/permata/`

- [ ] **Step 1: Move the directory**

```bash
mv src/app/permata src/app/transactions
```

- [ ] **Step 2: Update all internal import paths in one shot**

```bash
find src/app/transactions -type f \( -name "*.ts" -o -name "*.tsx" \) \
  -exec sed -i '' 's|@/app/permata/|@/app/transactions/|g' {} +
```

Also update the adapter quick-start doc:
```bash
sed -i '' 's|src/app/permata/|src/app/transactions/|g' src/app/transactions/adapters/QUICK_START.md
sed -i '' 's|src/app/permata/|src/app/transactions/|g' src/app/transactions/adapters/examples/DEEL_README.md 2>/dev/null || true
```

- [ ] **Step 3: Update `revalidatePath` in backfilling actions**

In `src/app/transactions/backfilling/actions.ts`, change:
```typescript
revalidatePath('/permata/backfilling');
```
to:
```typescript
revalidatePath('/transactions/backfilling');
```

- [ ] **Step 4: Update the page heading in `src/app/transactions/page.tsx`**

Change `<h1>Permata</h1>` to `<h1>Transactions</h1>`.

- [ ] **Step 5: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | head -60`
Expected: no errors. Fix any stray `permata` import paths if they show up.

- [ ] **Step 6: Verify no remaining `/permata` references in `src/app/transactions/`**

```bash
grep -r "permata" src/app/transactions --include="*.ts" --include="*.tsx" -l
```
Expected: empty output (only the adapter file `permata-adapter.tsx` is OK since it refers to the Permata *bank* adapter name, not the route).

- [ ] **Step 7: Commit**

```bash
git add -A src/app/transactions src/app/permata
git commit -m "refactor: rename app/permata → app/transactions, update all internal imports"
```

---

## Task 6: Update remaining references to `/permata` outside the renamed folder

**Files:**
- Modify: `src/app/lib/route-access.ts` — already done in Task 1 (only `/transactions` entries exist)
- Modify: `docs/PROJECT_OVERVIEW.md`

- [ ] **Step 1: Check for any remaining `/permata` path references**

```bash
grep -r "/permata" src --include="*.ts" --include="*.tsx" -n
```
Expected: zero hits (the adapter filename `permata-adapter` is fine — that's a bank name).

- [ ] **Step 2: Update `docs/PROJECT_OVERVIEW.md`**

Replace all occurrences of `/permata` with `/transactions` and update the detailed structure section heading:

```bash
sed -i '' 's|/permata|/transactions|g' docs/PROJECT_OVERVIEW.md
sed -i '' 's|## `/permata`|## `/transactions`|g' docs/PROJECT_OVERVIEW.md
sed -i '' 's|src/app/permata/|src/app/transactions/|g' docs/PROJECT_OVERVIEW.md
```

- [ ] **Step 3: Commit**

```bash
git add docs/PROJECT_OVERVIEW.md
git commit -m "docs: update PROJECT_OVERVIEW — permata renamed to transactions"
```

---

## Task 7: Final verification

- [ ] **Step 1: Full TypeScript check**

```bash
npx tsc --noEmit 2>&1
```
Expected: exit code 0, no errors.

- [ ] **Step 2: Confirm route-access config covers both routes**

Open `src/app/lib/route-access.ts` and verify:
- `/transactions` → `['editor', 'admin']`
- `/transactions/backfilling` → `['admin']`

- [ ] **Step 3: Confirm middleware imports are correct**

Open `src/app/lib/supabase/middleware.ts` and verify it imports:
- `getUserRolesFromClient` from `@/app/lib/route-access-server`
- `getRouteAccessConfig` from `@/app/lib/route-access`

- [ ] **Step 4: Smoke test manually (if dev server available)**

```bash
npm run dev
```
- Log in as a user with no roles → visiting `/transactions` should redirect to `/`
- Log in as `editor` → `/transactions` accessible, `/transactions/backfilling` redirects to `/`
- Log in as `admin` → both routes accessible
- Menu only shows "Transactions" card for `editor`/`admin`, "Backfilling" only for `admin`
