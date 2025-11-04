import { updateSession } from '@/app/lib/supabase/middleware';
import { type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

// export const config = {
//   matcher: matcher,
// };
export const config = {
  matcher: [
    // Исключаем статические файлы
    '/((?!_next/static|_next/image|favicon.ico|.*\\.[^/]+$).*)',
    // Явно указанные маршруты из menuItems
    '/permata/:path*',
    // API маршруты
    '/api/:path*',
  ],
};
