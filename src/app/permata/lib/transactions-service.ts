'use server';

import { createClient } from '@/app/lib/supabase/server';
import {
  createTransactionHash,
  parseTimeFromDescription,
} from '@/app/permata/lib/TransactionParseResult';
import { createEmbedding, determineCategory, saveEmbedding } from '@/app/permata/lib/vectorDb';
import { Transaction } from '@/app/types/supabase-extended';

// Типы
export interface PermataRawTransaction {
  [key: string]: string; // Allow any string key
  'Posted Date (mm/dd/yyyy)': string;
  Description: string;
  'Credit/Debit': string;
  Amount: string;
}

export interface TransactionDb extends Transaction {
  id: number;
}

export type SaveTransactionsRequest = {
  transactions: PermataRawTransaction[];
  userId: string;
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
  transactions: PermataRawTransaction[]
): Promise<Omit<TransactionDb, 'user_id' | 'id' | 'created_at' | 'month'>[]> {
  const cleanTransactions = await Promise.all(
    transactions.map(async (tr) => {
      const { time, cleanDescription } = parseTimeFromDescription(tr.Description || '');

      const category = await determineCategory(cleanDescription);

      const cleanTr = {
        category,
        time: time ?? '',
        description: cleanDescription,
        posted_date: tr['Posted Date (mm/dd/yyyy)'] ?? '',
        credit_debit: tr['Credit/Debit'],
        amount: parseFloat(
          tr.Amount.replace(/[^0-9.-]+/g, '')
            ?.split('.')
            ?.at(0) ?? '0'
        ),
      };
      const transactionHash = createTransactionHash(cleanTr);
      return {
        ...cleanTr,
        transaction_hash: transactionHash,
      };
    })
  );
  return cleanTransactions;
}

export async function saveTransactions({ transactions, userId }: SaveTransactionsRequest) {
  try {
    if (!userId) {
      return {
        success: false,
        error: 'User ID is required',
      };
    }

    const preparedTransactions = await prepareTransactions(transactions);

    const supabase = await createClient();

    const transactionsWithUserId = preparedTransactions.map((transaction) => ({
      ...transaction,
      user_id: userId,
    }));

    const { data, error } = await supabase.rpc('insert_unique_transactions', {
      _txns: transactionsWithUserId,
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
