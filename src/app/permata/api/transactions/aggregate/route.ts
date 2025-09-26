import { createClient } from '@/app/lib/supabase/client';
import { NextResponse } from 'next/server';

export interface MonthlyTransactionStats {
  month: Date;
  total_credit: number;
  total_debit: number;
  transaction_count: number;
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  const query = `
    SELECT 
      DATE_TRUNC('month', posted_date::date) as month,
      SUM(CASE WHEN credit_debit = 'Credit' THEN amount::numeric ELSE 0 END) as total_credit,
      SUM(CASE WHEN credit_debit = 'Debit' THEN amount::numeric ELSE 0 END) as total_debit,
      COUNT(*) as transaction_count
    FROM transactions 
    WHERE user_id = $1
    GROUP BY DATE_TRUNC('month', posted_date::date)
    ORDER BY month DESC
  `;

  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .then(async (result) => {
        if (result.error) throw result.error;

        // Выполняем SQL запрос через rpc
        const { data: stats, error } = await supabase.rpc('get_monthly_stats', {
          user_id_param: userId,
        });

        return { data: stats, error };
      });

    if (error) {
      console.error('Error fetching monthly stats:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data as MonthlyTransactionStats[]);
  } catch (error) {
    console.error('Error in monthly aggregation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
