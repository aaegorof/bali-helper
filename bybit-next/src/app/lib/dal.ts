import { getServerSession } from 'next-auth';
import { cache } from 'react';
import 'server-only';
import { authOptions } from '../api/auth/[...nextauth]/route';
import { getDb } from './db';

interface DbUser {
  id: number;
  email: string;
  created_at?: string;
}

/**
 * Получить текущего пользователя из базы данных с использованием NextAuth сессии
 */
export const getUser = cache(async () => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  try {
    const userId = parseInt(session.user.id, 10); // Преобразуем ID в число для запроса в базу

    // Используем промис для работы с колбэком SQLite
    const user: DbUser | null = await new Promise((resolve, reject) => {
      getDb().get(
        `SELECT * FROM users WHERE id = ?`,
        [userId],
        (err: Error | null, row: DbUser | undefined) => {
          if (err) {
            console.error('Database error:', err);
            reject(err);
          }
          resolve(row || null);
        }
      );
    });

    console.log('getUser data:', user);
    return user;
  } catch (error) {
    console.error('Failed to fetch user:', error);
    return null;
  }
});
