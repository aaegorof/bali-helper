'use server';

import { createClient } from '@/app/lib/supabase/server';
import { NormalizedTransaction } from '@/app/permata/adapters';

import { createEmbedding, determineCategory, saveEmbedding } from '@/app/permata/lib/vectorDb';
import { InsertUniqueTransactionsReq, Transaction } from '@/app/types/supabase-extended';

export interface TransactionDb extends Transaction {
  id: number;
}

export type SaveTransactionsRequest = {
  transactions: NormalizedTransaction[];
};

export type DeleteTransactionsRequest = {
  ids: number[];
};

export type DeleteTransactionsResult = {
  success: boolean;
  data?: { message: string };
  error?: string;
  details?: string;
};

async function prepareTransactions(
  transactions: NormalizedTransaction[]
): Promise<InsertUniqueTransactionsReq[]> {
  
  return await Promise.all(
    transactions.map(async (tr) => {
      if(!tr.category) {
      const category = await determineCategory(tr.description);
      return {
        ...tr,
        category,
      };
    }
      return tr
    })
  );
}

export async function saveTransactions({ transactions }: SaveTransactionsRequest) {
  try {

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        error: 'User is not authenticated',
      };
    }

    const preparedTransactions = await prepareTransactions(transactions);


// return {success: true, data: {message: 'Transactions prepared successfully', inserted_rows: []}}

    const { data, error } = await supabase.rpc('insert_unique_transactions', {
      _txns: preparedTransactions,
    });

    if (error) {
      console.log('errorData', data);
      throw error;
    }

    if (data.inserted_rows && data.inserted_rows.length > 0) {
      const embeddingPromises = data.inserted_rows.map(async (transaction) => {
        if (transaction.description && transaction.category) {
          const embedding = await createEmbedding(transaction.description);
          await saveEmbedding(transaction.description, transaction.category, embedding);
        }
      });

      await Promise.all(embeddingPromises);
    }

    return {
      success: true,
      data: {
        message: `${data.inserted_count} transactions saved successfully, ${data.duplicate_count} duplicates found`,
        ...data,
      },
    };
  } catch (error) {
    console.error('Error saving transactions:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: 'Error saving transactions',
      details: errorMessage,
    };
  }
}

export async function deleteTransactions({ ids }: DeleteTransactionsRequest) {
  try {
    if (!Array.isArray(ids) || ids.length === 0) {
      return {
        success: false,
        error: 'Invalid input - ids must be a non-empty array',
      };
    }

    const supabase = await createClient();

    const { error } = await supabase.from('transactions').delete().in('id', ids);

    if (error) {
      console.error('Error deleting transactions:', error);
      throw error;
    }

    return {
      success: true,
      data: { message: `${ids.length} transactions deleted successfully` },
    };
  } catch (error) {
    console.error('Error deleting transactions:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: 'Error deleting transactions',
      details: errorMessage,
    };
  }
}
