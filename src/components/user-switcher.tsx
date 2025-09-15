'use client';

import { Session } from 'next-auth';
import { signOut } from 'next-auth/react';
import { Button } from './ui/button';

export function UserSwitcher({
  session,
  status,
}: {
  session: Session | null;
  status: 'loading' | 'authenticated' | 'unauthenticated';
}) {
  // Не показываем ничего, если сессия загружается или пользователь не аутентифицирован
  if (status === 'loading' || status === 'unauthenticated' || !session?.user?.email) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm">{session.user.email}</span>
      <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: '/' })}>
        Выйти
      </Button>
    </div>
  );
}
