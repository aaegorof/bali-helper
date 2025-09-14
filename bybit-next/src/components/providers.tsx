'use client';

import { ThemeProvider } from '@/components/theme-provider';
import { SessionProvider } from 'next-auth/react';

export function Providers({ children, session }: { children: React.ReactNode; session: any }) {
  return (
    <SessionProvider
      session={session}
      refetchInterval={5 * 60} // Обновлять сессию каждые 5 минут (в секундах)
      refetchOnWindowFocus={true} // Обновлять сессию при фокусе окна
      refetchWhenOffline={false} // Не обновлять в режиме офлайн
    >
      <ThemeProvider>{children}</ThemeProvider>
    </SessionProvider>
  );
}
