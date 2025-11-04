import { updateSession } from '@/app/lib/supabase/middleware';
import { type NextRequest } from 'next/server';
import { menuItems } from './components/menuItems';

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

const pagematcher = menuItems.map((item) => item.authMatcher).filter(Boolean);
const negativeMatcher = ['/((?!_next/static|_next/image|favicon.ico|.*\\.[^/]+$).*)'];
const apiMatcher = ['/api/:path*'];

const matcher = [...negativeMatcher, '/(?!login|auth|error).*', ...pagematcher, ...apiMatcher];

export const config = {
  matcher: matcher,
};
