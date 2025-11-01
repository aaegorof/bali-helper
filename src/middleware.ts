import { updateSession } from '@/app/lib/supabase/middleware';
import { type NextRequest } from 'next/server';
import { menuItems } from './components/menuItems';

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

// export default withAuth({
//   pages: {
//     signIn: "/login",
//   },
//   callbacks: {
//     authorized({ token }) {
//       return !!token
//     },
//   },
// })
const pagematcher = menuItems.map((item) => item.authMatcher).filter(Boolean)
const negativeMatcher = ['/((?!_next/static|_next/image|favicon.ico|.*\\.[^/]+$).*)'] 
const apiMatcher = ['/api/:path*']

export const config = {
  matcher: [
    ...negativeMatcher,
    '/(?!login|auth|error).*',
    ...pagematcher,
    ...apiMatcher,
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
  ]
};
