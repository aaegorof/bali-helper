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
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/callback?next=${callbackUrl}`,
    },
  })
  console.log('actions back url', `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/callback?next=${callbackUrl}`)

  if (data.url) {
    redirect(data.url) // use the redirect API for your server framework
  }
  if (error) {
    return { error: error.message };
  }

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

  return { success: true, 
    user : responseData.user };
}
