'use client';

import { useAuth } from '@/app/lib/auth';
import { useRouter } from 'next/navigation';
import { Button } from './ui/button';

export function UserSwitcher() {
  const { user } = useAuth();
  const router = useRouter();

  const handleLogin = () => {
    router.push('/login');
  };
  // Не показываем ничего, если сессия загружается или пользователь не аутентифицирован
  if (!user?.email) {
    return (
      <Button variant="outline" size="sm" onClick={() => handleLogin()}>
        Login
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm">{user.email}</span>
      <form action="/auth/signout" method="post">
        <Button variant="outline" size="sm" type="submit">
          Выйти
        </Button>
      </form>
    </div>
  );
}
