'use client';

import { Button } from '@/components/ui/button';
import { signIn } from 'next-auth/react';
import Image from 'next/image';

export function SocialButtons({ callbackUrl }: { callbackUrl: string }) {
  const handleSocialSignIn = async (provider: string) => {
    await signIn(provider, { callbackUrl });
  };

  return (
    <div className="flex flex-col gap-2">
      <Button
        variant="outline"
        className="flex items-center gap-2"
        onClick={() => handleSocialSignIn('google')}
      >
        <Image src="/google.svg" alt="Google" width={20} height={20} />
        Войти через Google
      </Button>


      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Или</span>
        </div>
      </div>
    </div>
  );
}
