'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useState } from 'react';
import { SocialButtons } from './social-buttons';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/permata';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // 1. Сначала проверяем/создаем пользователя
      const userResponse = await fetch('/api/auth/user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!userResponse.ok) {
        const errorData = await userResponse.json();
        console.error('User API error:', errorData);
        throw new Error(errorData.error || 'Failed to check/create user');
      }

      const userData = await userResponse.json();

      // 2. Затем логиним пользователя через NextAuth
      const result = await signIn('credentials', {
        email: email,
        password: password,
        callbackUrl,
        redirect: false,
      });

      if (result?.error) {
        console.error('Login error:', result.error);
        setError('Failed to sign in. Please check your email.');
      } else if (result?.url) {
        router.push(result.url);
        router.refresh();
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Войти</CardTitle>
        <CardDescription>Введите email для входа в систему</CardDescription>
      </CardHeader>
      <CardContent>
        <SocialButtons callbackUrl={callbackUrl} />
        <form onSubmit={handleSubmit}>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Загрузка...' : 'Войти через Email'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
