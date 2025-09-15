import { getDb } from '@/app/lib/db';
import { ensureDatabaseInitialized } from '@/app/lib/init';
import {
  createTransactionHash,
  parseTimeFromDescription,
} from '@/app/permata/lib/TransactionParseResult';
import { createEmbedding, determineCategory, saveEmbedding } from '@/app/permata/lib/vectorDb';
import { ApiResponse } from '@/app/types/api';
import { NextResponse } from 'next/server';

// Типы
export interface PermataRawTransaction {
  [key: string]: string; // Allow any string key
  'Posted Date (mm/dd/yyyy)': string;
  Description: string;
  'Credit/Debit': string;
  Amount: string;
}

export interface TransactionDb {
  id?: number;
  posted_date?: string;
  description?: string;
  credit_debit?: string;
  amount: number;
  category?: string;
  time?: string;
  transaction_hash?: string;
  user_id?: number;
  created_at?: string;
}

// GET /api/transactions
export async function GET(request: Request) {
  await ensureDatabaseInitialized();

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const creditDebit = searchParams.get('creditDebit');

  let query = `SELECT * FROM transactions`;
  const params: any[] = [];
  const conditions: string[] = [];

  if (userId) {
    conditions.push('user_id = ?');
    params.push(userId);
  }

  if (startDate) {
    conditions.push('posted_date >= ?');
    params.push(startDate);
  }

  if (endDate) {
    conditions.push('posted_date <= ?');
    params.push(endDate);
  }

  if (creditDebit) {
    conditions.push('credit_debit = ?');
    params.push(creditDebit);
  }

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(' AND ')}`;
  }

  query += ` ORDER BY posted_date DESC`;

  return new Promise((resolve) => {
    getDb().all(query, params, (err: Error | null, rows: TransactionDb[]) => {
      if (err) {
        console.error('Error fetching transactions:', err);
        resolve(NextResponse.json({ error: err.message }, { status: 500 }));
        return;
      }
      resolve(NextResponse.json(rows));
    });
  });
}

export type ReqTransactions = {
  transactions: PermataRawTransaction[];
  userId: number;
};

export type RespPostTransactions = ApiResponse<{ message: string; transactions: TransactionDb[] }>;

async function prepareTransactions(
  transactions: PermataRawTransaction[]
): Promise<TransactionDb[]> {
  const cleanTransactions = await Promise.all(
    transactions.map(async (tr) => {
      const { time, cleanDescription } = parseTimeFromDescription(tr.Description || '');
      const category = await determineCategory(cleanDescription);
      return {
        posted_date: tr['Posted Date (mm/dd/yyyy)'] ?? '',
        description: cleanDescription,
        credit_debit: tr['Credit/Debit'],
        category,
        time: time ?? '',
        amount: parseFloat(
          tr.Amount.replace(/[^0-9.-]+/g, '')
            ?.split('.')
            ?.at(0) ?? '0'
        ),
      };
    })
  );

  return cleanTransactions.map((cleanTr) => {
    const transactionHash = createTransactionHash(cleanTr);
    return {
      ...cleanTr,
      transaction_hash: transactionHash,
    };
  });
}

// POST /api/transactions
export async function POST(request: Request): Promise<NextResponse<RespPostTransactions>> {
  await ensureDatabaseInitialized();

  try {
    const body = (await request.json()) as ReqTransactions;
    const { transactions, userId } = body;

    if (!userId) {
      return NextResponse.json<RespPostTransactions>({
        success: false,
        error: 'User ID is required',
      });
    }

    const query = `INSERT OR REPLACE INTO transactions 
            (posted_date, description, credit_debit, amount, time, transaction_hash, category, user_id) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

    const preparedTransactions = await prepareTransactions(transactions);

    const results = await Promise.all<TransactionDb>(
      preparedTransactions.map((transaction) => {
        return new Promise((resolve, reject) => {
          getDb().run(
            query,
            [
              transaction.posted_date,
              transaction.description,
              transaction.credit_debit,
              transaction.amount,
              transaction.time,
              transaction.transaction_hash,
              transaction.category,
              userId,
            ],
            function (err: Error | null) {
              if (err) {
                reject(err);
              } else {
                resolve({ id: this.lastID, ...transaction });
              }
            }
          );
        });
      })
    );

    const embeddingPromises = results.map(async (transaction) => {
      if (transaction.description && transaction.category) {
        const embedding = await createEmbedding(transaction.description);
        await saveEmbedding(transaction.description, transaction.category, embedding);
      }
    });

    await Promise.all(embeddingPromises);

    return NextResponse.json<RespPostTransactions>({
      success: true,
      data: {
        message: 'Transactions saved successfully',
        transactions: results,
      },
    });
  } catch (error: any) {
    console.error('Error saving transactions:', error);
    return NextResponse.json<RespPostTransactions>({
      success: false,
      error: 'Error saving transactions',
      details: error.message,
    });
  }
}

// DELETE /api/transactions
export async function DELETE(request: Request) {
  await ensureDatabaseInitialized();

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

    const placeholders = ids.map(() => '?').join(',');
    const query = `DELETE FROM transactions WHERE id IN (${placeholders})`;

    return new Promise((resolve) => {
      getDb().run(query, ids, (err: Error | null) => {
        if (err) {
          console.error('Error deleting transactions:', err);
          resolve(
            NextResponse.json(
              {
                error: 'Error deleting transactions',
                details: err.message,
              },
              { status: 500 }
            )
          );
          return;
        }
        resolve(
          NextResponse.json({
            success: true,
            data: { message: 'Transactions deleted successfully' },
          })
        );
      });
    });
  } catch (error: any) {
    console.error('Error deleting transactions:', error);
    return NextResponse.json(
      {
        error: 'Error deleting transactions',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
