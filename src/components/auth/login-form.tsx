'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/app/lib/auth';
import { toast } from 'sonner';
import { login, signup } from './login-actions';
import { SocialButtons } from './social-buttons';
import { useState } from 'react';

type LoginFormProps = {
  callbackUrl?: string;
};

export function LoginForm({ callbackUrl }: LoginFormProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  if (user) {
    return (
      <div>
        You are already logged in as {user.email}{' '}
        <Button onClick={() => router.push('/')}>To the main page</Button>
      </div>
    );
  }

  const onLogin = async (formData: FormData) => {
    setIsLoading(true);
    const response = await login(formData, callbackUrl);
    if (response.error) {
      toast.error(response.error);
    } else {
      toast.success(`User logged in successfully`);
    }
    setIsLoading(false);
  };

  const onSignUp = async (formData: FormData) => {
    setIsLoading(true);
    const { error, user } = await signup(formData);
    if (error) {
      toast.error(error);
    } else {
      toast.success(`User created successfully: ${user?.email}`);
    }
    setIsLoading(false);
  };

  return (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Login</CardTitle>
        <CardDescription>Enter your email to login</CardDescription>
      </CardHeader>
      <CardContent>
        <SocialButtons callbackUrl={callbackUrl} />
        <form>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" name="email" placeholder="your@email.com" required disabled={isLoading} />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  name="password"
                  placeholder="Enter your password"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <Button formAction={onSignUp} type="submit" disabled={isLoading}>
                  Sign up
                </Button>
                <Button formAction={onLogin} type="submit" disabled={isLoading}>
                  {isLoading ? 'Loading...' : 'Login'}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
