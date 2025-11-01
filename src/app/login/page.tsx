import { LoginForm } from '@/components/auth/login-form';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    [key: string]: string | string[] | undefined;
  }>;
}) {
  const sp = await searchParams;
  const callbackUrl = (sp?.['callbackUrl'] as string) || '/';
  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <LoginForm callbackUrl={callbackUrl} />
    </div>
  );
}
