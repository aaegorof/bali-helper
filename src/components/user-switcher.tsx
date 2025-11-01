'use client';

import { useAuth } from '@/app/lib/auth';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { signout } from './auth/signout-action';
import { Button } from './ui/button';

export function UserSwitcher() {
  const { user } = useAuth();
  const router = useRouter();
  const handleLogin = () => {
    router.push('/login');
  };

  const handleSignOut = async () => {
    try {
      await signout();
      toast('Successfully logged out');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (!user?.email) {
    return (
      <Button variant="outline" size="sm" onClick={handleLogin}>
        Login
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm">{user.email}</span>
      <Button variant="outline" size="sm" onClick={handleSignOut}>
        Sign out
      </Button>
    </div>
  );
}
