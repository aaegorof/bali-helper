import { createClient } from '@/app/lib/supabase/server';
import { parseTimeFromDescription } from '@/app/permata/lib/TransactionParseResult';
import { createEmbedding, saveEmbedding } from '@/app/permata/lib/vectorDb';
import { ApiResponse } from '@/app/types/api';
import { Transaction } from '@/app/types/supabase-extended';
import { NextResponse } from 'next/server';

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
    const supabase = await createClient();

    if (!Array.isArray(ids) || !category) {
      return NextResponse.json<UpdateCategoriesResponse>({
        success: false,
        error: 'Invalid input - ids must be an array and category must be specified',
      });
    }

    // Обновляем категорию в таблице транзакций
    const { error: updateError } = await supabase
      .from('transactions')
      .update({ category })
      .in('id', ids);

    if (updateError) {
      console.error('Error updating categories:', updateError);
      throw updateError;
    }

    // Получаем обновленные транзакции для создания новых embeddings
    const { data: updatedTransactions, error: fetchError } = await supabase
      .from('transactions')
      .select('id, description')
      .in('id', ids);

    if (fetchError) {
      console.error('Error fetching updated transactions:', fetchError);
      throw fetchError;
    }

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
