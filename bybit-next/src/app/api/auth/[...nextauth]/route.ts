import { getDb } from '@/app/lib/db';
import NextAuth, { AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { z } from 'zod';

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('NEXTAUTH_SECRET is not defined');
}

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email?: string | null;
    };
  }
  interface User {
    id: string;
    email?: string | null;
  }
}

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Email',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'your@email.com' },
        userId: { label: 'User ID', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;

        const emailSchema = z.string().email();
        const validatedEmail = emailSchema.safeParse(credentials.email);

        if (!validatedEmail.success) return null;

        try {
          // Используем userId из credentials, если он предоставлен
          if (credentials.userId) {
            return {
              id: credentials.userId,
              email: credentials.email,
            };
          }

          // Иначе ищем пользователя в базе данных
          const user: any = await new Promise((resolve, reject) => {
            getDb().get(
              'SELECT id, email FROM users WHERE email = ?',
              [credentials.email],
              (err: Error | null, row: any) => {
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
    async jwt({ token, user, account }) {
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
