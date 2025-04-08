import { getDb } from '@/app/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Валидация тела запроса
const userSchema = z.object({
  email: z.string().email('Недействительный email'),
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

    const { email } = validationResult.data;

    // Ищем пользователя в базе
    const user: any = await new Promise((resolve, reject) => {
      getDb().get(
        'SELECT id, email FROM users WHERE email = ?',
        [email],
        async (err: Error | null, row: any) => {
          if (err) reject(err);

          if (row) {
            // Пользователь найден
            resolve(row);
          } else {
            // Создаем нового пользователя
            getDb().run(
              'INSERT INTO users (email) VALUES (?)',
              [email],
              function (err: Error | null) {
                if (err) reject(err);
                resolve({ id: this.lastID, email: email });
              }
            );
          }
        }
      );
    });

    // Логирование найденного/созданного пользователя
    console.log('User lookup/create result:', user);

    return NextResponse.json({
      id: user.id,
      email: user.email,
    });
  } catch (error) {
    console.error('Error in user API:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
