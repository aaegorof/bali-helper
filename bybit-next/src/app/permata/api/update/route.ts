import { getDb } from '@/app/lib/db';
import { parseTimeFromDescription } from '@/app/lib/helpers';
import { createEmbedding, saveEmbedding } from '@/app/lib/vectorDb';
import { TransactionDb } from '@/app/permata/api/transactions/route';
import { ApiResponse } from '@/app/types/api';
import { NextResponse } from 'next/server';

// Интерфейс для SQLite колбэка с this
interface SQLiteRunResult {
  lastID: number;
  changes: number;
}

// Specific response types
export type UpdateCategoriesResponse = ApiResponse<{
  updatedCount: number;
}>;

// Request types
export type UpdateCategoryRequest = {
  ids: number[];
  category: string;
};

export async function POST(request: Request): Promise<NextResponse<UpdateCategoriesResponse>> {
  try {
    const { ids, category } = (await request.json()) as UpdateCategoryRequest;

    if (!Array.isArray(ids) || !category) {
      return NextResponse.json<UpdateCategoriesResponse>({
        success: false,
        error: 'Invalid input - ids must be an array and category must be specified',
      });
    }

    // Обновляем категорию в таблице транзакций
    const placeholders = ids.map(() => '?').join(',');
    const query = `UPDATE transactions SET category = ? WHERE id IN (${placeholders})`;
    const params = [category, ...ids];

    const changes = await new Promise<number>((resolve, reject) => {
      getDb().run(query, params, function (this: SQLiteRunResult, err: Error | null) {
        if (err) {
          console.error('Error updating categories:', err);
          return reject(err);
        }
        resolve(this.changes);
      });
    });

    // Получаем обновленные транзакции для создания новых embeddings
    const updatedTransactionsQuery = `SELECT id, description FROM transactions WHERE id IN (${placeholders})`;
    const updatedTransactions: TransactionDb[] = await new Promise((resolve, reject) => {
      getDb().all(updatedTransactionsQuery, ids, (err: Error | null, rows: TransactionDb[]) => {
        if (err) {
          console.error('Error fetching updated transactions:', err);
          return reject(err);
        }
        resolve(rows);
      });
    });

    // Обновляем embeddings для измененных транзакций
    const embeddingPromises = updatedTransactions.map(async (transaction) => {
      try {
        const { cleanDescription } = parseTimeFromDescription(transaction?.description || '');
        if (cleanDescription && transaction.id !== undefined) {
          const embedding = await createEmbedding(cleanDescription);
          await saveEmbedding(cleanDescription, category, embedding);
        }
      } catch (error) {
        console.error('Error updating embedding:', error);
      }
    });

    await Promise.all(embeddingPromises);

    return NextResponse.json<UpdateCategoriesResponse>({
      success: true,
      data: {
        updatedCount: updatedTransactions.length,
      },
    });
  } catch (err) {
    console.error('Error in update-category:', err);
    return NextResponse.json<UpdateCategoriesResponse>({
      success: false,
      error: 'Error updating categories',
      details: err instanceof Error ? err.message : 'Unknown error occurred',
    });
  }
}
