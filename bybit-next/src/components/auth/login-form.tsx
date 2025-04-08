'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useState } from 'react';

export function LoginForm() {
  const [email, setEmail] = useState('');
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
        body: JSON.stringify({ email }),
      });

      if (!userResponse.ok) {
        const errorData = await userResponse.json();
        console.error('User API error:', errorData);
        throw new Error(errorData.error || 'Failed to check/create user');
      }

      const userData = await userResponse.json();
      console.log('User data before signIn:', userData);

      // 2. Затем логиним пользователя через NextAuth
      const result = await signIn('credentials', {
        email: email,
        userId: String(userData.id),
        callbackUrl,
        redirect: false,
      });

      if (result?.error) {
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
        <form onSubmit={handleSubmit}>
          <div className="grid w-full items-center gap-4">
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
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Загрузка...' : 'Войти'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
