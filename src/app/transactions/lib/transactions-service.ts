'use server';

import { createClient } from '@/app/lib/supabase/server';
import { NormalizedTransaction } from '@/app/transactions/adapters';

import { processEmbeddingsInBatches } from '@/app/transactions/lib/embedding-batch';
import { determineCategory } from '@/app/transactions/lib/vectorDb';
import { InsertUniqueTransactionsReq, Transaction } from '@/app/types/supabase-extended';

export interface TransactionDb extends Transaction {
  id: number;
}

export type EmbeddingBackfillItem = {
  description: string;
  date: NonNullable<Transaction['date']>;
  category: NonNullable<Transaction['category']>;
  source: NonNullable<Transaction['source']>;
};

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
  const result: InsertUniqueTransactionsReq[] = [];

  for (const tr of transactions) {
    if (!tr.category) {
      const category = await determineCategory(tr.description);
      result.push({ ...tr, category });
    } else {
      result.push(tr);
    }
  }

  return result;
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
      const embeddableRows = data.inserted_rows.filter(
        (t) => t.description && t.category
      ) as Array<{ description: string; category: string }>;

      try {
        await processEmbeddingsInBatches(embeddableRows);
      } catch (err) {
        console.error('Embedding batch failed (non-fatal):', err);
      }
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

export async function getMissingEmbeddings(): Promise<{
  success: boolean;
  error?: string;
  data: EmbeddingBackfillItem[];
}> {
  try {
    const supabase = await createClient();

    const { data: transactions, error: txError } = await supabase
      .from('transactions')
      .select('description, category, date, source')
      .not('description', 'is', null);

    if (txError) throw txError;

    const { data: existingEmbeddings, error: embError } = await supabase
      .from('transaction_embeddings')
      .select('description');

    if (embError) throw embError;

    const embeddedDescriptions = new Set((existingEmbeddings ?? []).map((e) => e.description));
 
    const seen = new Set<string>();
    const missing = (transactions ?? []).filter((t) => {
      if (!t.description || !t.category || embeddedDescriptions.has(t.description)) return false;
      if (seen.has(t.description)) return false;
      seen.add(t.description);
      return true;
    }) as EmbeddingBackfillItem[];

    return { success: true, data: missing };
  } catch (error) {
    console.error('Backfill embeddings error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage, data: [] };
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
