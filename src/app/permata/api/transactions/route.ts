import { createClient } from '@/app/lib/supabase/server';
import {
  createTransactionHash,
  parseTimeFromDescription,
} from '@/app/permata/lib/TransactionParseResult';
import { createEmbedding, determineCategory, saveEmbedding } from '@/app/permata/lib/vectorDb';
import { ApiResponse } from '@/app/types/api';
import { InsertUniqueTransactionsResult, Transaction } from '@/app/types/supabase-extended';
import { NextRequest, NextResponse } from 'next/server';

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

export type ReqPostTransactions = {
  transactions: PermataRawTransaction[];
  userId: string;
};

export type RespGetTransactions = ApiResponse<{
  message: string;
  transactions: TransactionDb[];
  count: number;
}>;

export type RespPostTransactions = ApiResponse<
  InsertUniqueTransactionsResult & { message: string }
>;

  // return new Promise((resolve) => {
  //   getDb().all(query, params, (err: Error | null, rows: TransactionDb[]) => {
  //     if (err) {
  //       console.error('Error fetching transactions:', err);
  //       resolve(NextResponse.json({ error: err.message }, { status: 500 }));
  //       return;
  //     }
  //     resolve(NextResponse.json(rows));
  //   });
  // });


async function prepareTransactions(
  transactions: PermataRawTransaction[]
): Promise<Omit<TransactionDb, 'user_id' | 'id' | 'created_at'>[]> {
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

// POST /api/transactions
export async function POST(request: NextRequest): Promise<NextResponse<RespPostTransactions>> {
  // await ensureDatabaseInitialized();

  try {
    const body = (await request.json()) as ReqPostTransactions;
    const { transactions, userId } = body;

    if (!userId) {
      return NextResponse.json<RespPostTransactions>({
        success: false,
        error: 'User ID is required',
      });
    }

    const preparedTransactions = await prepareTransactions(transactions);

    const supabase = await createClient();

    const transactionsWithUserId = preparedTransactions.map((transaction) => ({
      ...transaction,
      user_id: userId,
    }));

    // const { data, error } = await supabase
    //   .from('transactions')
    //   .insert<TransactionInsert>(transactionsWithUserId)
    //   .select();

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

    return NextResponse.json<RespPostTransactions>({
      success: true,
      data: {
        message: `${data.inserted_count} transactions saved successfully, ${data.duplicate_count} duplicates found`,
        ...data,
      },
    });
  } catch (error) {
    console.error('Error saving transactions:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json<RespPostTransactions>({
      success: false,
      error: 'Error saving transactions',
      details: errorMessage,
    });
  }
}

// DELETE /api/transactions
export async function DELETE(request: NextRequest) {
  // await ensureDatabaseInitialized();
  const supabase = await createClient();
  try {
    const body = await request.json();
    const { ids } = body;

    if (!Array.isArray(ids)) {
      return NextResponse.json(
        {
          error: 'Invalid input - ids must be an array',
        },
        { status: 400 }
      );
    }

    const { error } = await supabase.from('transactions').delete().in('id', ids);

    if (error) {
      console.error('Error deleting transactions:', error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: { message: `${ids.length} transactions deleted successfully` },
    });
  } catch (error) {
    console.error('Error deleting transactions:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        error: 'Error deleting transactions',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
