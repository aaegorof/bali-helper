'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { createClient } from '@/app/lib/supabase/server';

export async function login(formData: FormData, callbackUrl?: string) {
  const supabase = await createClient();
  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  };

  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/', 'layout');
  redirect(callbackUrl || '/');
}

export async function loginwithGoogle(callbackUrl?: string) {
  const supabase = await createClient();

  // Используем правильный базовый URL для разработки и продакшена
  const baseUrl =
    process.env.NODE_ENV === 'development'
      ? 'http://localhost:3000'
      : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  const redirectLink = callbackUrl
    ? `${baseUrl}/auth/callback?next=${callbackUrl}`
    : `${baseUrl}/auth/callback`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectLink,
    },
  });


  if (data.url) {
    redirect(data.url); // use the redirect API for your server framework
  }
  if (error) {
    return { error: error.message };
  }
  revalidatePath('/', 'layout');
  return { success: true, url: data.url };
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  };

  const { error, data: responseData } = await supabase.auth.signUp(data);

  if (error) {
    console.error(error);
    return { error: error.message };
  }
  revalidatePath('/', 'layout');
  return { success: true, user: responseData.user };
}
