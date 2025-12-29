'use server';

import { createClient } from '@/app/lib/supabase/server';
import { createEmbedding, saveEmbedding } from '../lib/vectorDb';

export async function updateCategory(ids: number[], category: string) {
  const supabase = await createClient();

  if (!Array.isArray(ids) || !category) {
    throw new Error('Invalid input - ids must be an array and category must be specified');
  }
  try {
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
      throw fetchError.details ?? 'Unknown error occurred';
    }

    // Обновляем embeddings для измененных транзакций
    const embeddingPromises = updatedTransactions.map(async (transaction) => {
      try {
        if (transaction.description && transaction.id !== undefined) {
          const embedding = await createEmbedding(transaction.description);
          await saveEmbedding(transaction.description, category, embedding);
        }
      } catch (error) {
        console.error('Error updating embedding:', error);
        throw error;
      }
    });

    await Promise.all(embeddingPromises);

    return {
      success: true,
      data: {
        updatedCount: updatedTransactions.length,
      },
    };
  } catch (err) {
    console.error('Error in update-category:', err);
    return {
      success: false,
      error: 'Error updating categories',
      details: err ?? 'Unknown error occurred',
    };
  }
}
