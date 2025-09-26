'use client';
import { createClient } from '@/app/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User } from '@supabase/supabase-js';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { login, signup } from './login-actions';
import { SocialButtons } from './social-buttons';

export function LoginForm() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const router = useRouter();
  const getUser = async () => {
    setIsLoading(true);
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      console.error(error);
    } else {
      setUser(data.user);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    getUser();
  }, []);

  if (user) {
    return (
      <div>
        You are already logged in as {user.email}{' '}
        <Button onClick={() => router.push('/')}>To the main page</Button>
      </div>
    );
  }

  return (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Войти</CardTitle>
        <CardDescription>Введите email для входа в систему</CardDescription>
      </CardHeader>
      <CardContent>
        <SocialButtons callbackUrl={callbackUrl} />
        <form>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" name="email" placeholder="your@email.com" required />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  name="password"
                  placeholder="Enter your password"
                  required
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Button formAction={signup} type="submit" disabled={isLoading}>
                  Sign up
                </Button>
              </div>
            </div>
            <Button formAction={login} type="submit" disabled={isLoading}>
              {isLoading ? 'Loading...' : 'Login'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
