'use client';

import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { loginwithGoogle } from './login-actions';
import { toast } from 'sonner';

export function SocialButtons({ callbackUrl }: { callbackUrl: string }) {
  const handleSocialSignIn = async (provider: 'google' | 'github') => {
    if (provider === 'google') {
      const { error } = await loginwithGoogle(callbackUrl);
      if (error) {
        toast.error(error);
      }
    }
    // if (provider === 'github') {
    //   const { error } = await loginwithGithub(callbackUrl);
    //   if (error) {
    //     toast.error(error);
    //   }
    // }
  };

  return (
    <div className="flex flex-col gap-2">
      <Button
        variant="outline"
        className="flex items-center gap-2"
        onClick={() => handleSocialSignIn('google')}
      >
        <Image src="/google.svg" alt="Google" width={20} height={20} />
        Sign in with Google
      </Button>

      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or</span>
        </div>
      </div>
    </div>
  );
}
