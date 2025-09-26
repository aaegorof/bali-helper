import { updateSession } from '@/app/lib/supabase/middleware';
import { type NextRequest } from 'next/server';

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

export const config = {
  matcher: ['/permata/:path*', '/trading-analyser/:path*'],
};
