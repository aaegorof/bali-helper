import { getDb } from '@/app/lib/db';
import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { DbUser } from '../[...nextauth]/route';

// Валидация тела запроса
const userSchema = z.object({
  email: z.string().email('Недействительный email'),
  name: z.string().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();

    // Валидация входных данных
    const validationResult = userSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const { email, name, password } = validationResult.data;

    // Ищем пользователя в базе
    const user: DbUser | undefined = await new Promise((resolve, reject) => {
      getDb().get(
        'SELECT id, email, name FROM users WHERE email = ?',
        [email],
        async (err: Error | null, row: DbUser | undefined) => {
          if (err) reject(err);

          if (row) {
            // Пользователь найден
            resolve(row);
          } else {
            // Hash password if provided
            const password_hash = password ? await bcrypt.hash(password, 10) : null;

            // Создаем нового пользователя
            getDb().run(
              'INSERT INTO users (email, name, password_hash) VALUES (?, ?, ?)',
              [email, name, password_hash],
              function (err: Error | null) {
                if (err) reject(err);
                resolve({ id: this.lastID, email: email, name: name, password_hash });
              }
            );
          }
        }
      );
    });

    return NextResponse.json({
      id: user?.id,
      email: user?.email,
      name: user?.name,
    });
  } catch (error) {
    console.error('Error in user API:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
