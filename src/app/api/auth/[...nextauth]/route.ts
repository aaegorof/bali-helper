import { getDb } from '@/app/lib/db';
import bcrypt from 'bcryptjs';
import NextAuth, { AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { z } from 'zod';

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('NEXTAUTH_SECRET is not defined');
}

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
    };
  }
  interface User {
    id: string;
    email?: string | null;
    name?: string | null;
  }
}

// Иначе ищем пользователя в базе данных
export interface DbUser {
  id: number;
  email: string;
  name?: string | null;
  password_hash?: string;
}

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'Email',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'your@email.com' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const emailSchema = z.string().email();
        const validatedEmail = emailSchema.safeParse(credentials.email);

        if (!validatedEmail.success) return null;

        try {
          const user = await new Promise<DbUser | undefined>((resolve, reject) => {
            getDb().get(
              'SELECT id, email, password_hash FROM users WHERE email = ?',
              [credentials.email],
              (err: Error | null, row: DbUser | undefined) => {
                if (err) {
                  console.error('NextAuth DB error:', err);
                  reject(err);
                }
                resolve(row);
              }
            );
          });

          if (!user) {
            console.error('NextAuth: User not found for email', credentials.email);
            return null;
          }

          // Verify password
          if (!user.password_hash) {
            console.error('NextAuth: User has no password set', credentials.email);
            return null;
          }

          const isValidPassword = await bcrypt.compare(credentials.password, user.password_hash);
          if (!isValidPassword) {
            console.error('NextAuth: Invalid password for email', credentials.email);
            return null;
          }

          // Преобразуем id в строку, чтобы NextAuth правильно его обрабатывал
          const userId = String(user.id);

          return {
            id: userId,
            email: user.email,
          };
        } catch (error) {
          console.error('NextAuth authorize error:', error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: '/login', // Using our custom login page
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google' || account?.provider === 'github') {
        try {
          const response = await fetch(`${process.env.NEXTAUTH_URL}/api/auth/user`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: user.email,
              name: user.name,
            }),
          });

          if (!response.ok) {
            console.error('Failed to create/update user in database');
            return false;
          }

          const dbUser = await response.json();
          user.id = String(dbUser.id);
          return true;
        } catch (error) {
          console.error('Error in signIn callback:', error);
          return false;
        }
      }
      return true;
    },

    async jwt({ token, user }) {
      // При первоначальной аутентификации сохраняем ID пользователя
      if (user) {
        token.id = user.id;
      }

      // Проверяем, что ID всегда присутствует в токене
      if (!token.id) {
        console.error('NextAuth jwt: ID missing in token:', token);
      }

      return token;
    },

    async session({ session, token }) {
      // Проверяем, есть ли ID в токене
      if (!token.id) {
        console.error('NextAuth session: ID missing in token, cannot set session user ID');
      }

      // Всегда устанавливаем ID пользователя из токена в сессию
      if (session.user) {
        session.user.id = token.id as string;
      }

      return session;
    },
  },
  debug: true, // Включаем режим отладки для NextAuth
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
  },
};
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
