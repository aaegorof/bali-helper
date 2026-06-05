'use server';

import { CurrencyCode } from '@/app/lib/currencies';
import { createClient } from '@/app/lib/supabase/server';
import { TransactionDb } from '@/app/permata/lib/transactions-service';
import { ColumnFiltersState } from '@tanstack/react-table';

// export type MonthlyTransactionStats = Database['public']['Views']['transactions_by_month']['Row']
export interface MonthlyTransactionStats {
  month: Date;
  credit_debit: TransactionDb['credit_debit'];
  currency: CurrencyCode | null;
  sum: number;
  count: number;
}

export interface CategoryTransactionStats {
  category: TransactionDb['category'];
  currency: CurrencyCode | null;
  sum: number;
  count: number;
}

export interface TransactionStats {
  monthly: MonthlyTransactionStats[];
  category: CategoryTransactionStats[];
}

export const filterQuery = async <
  T extends {
    gte: any;
    lte: any;
    like: any;
    ilike: any;
    in: any;
    is: any;
    or: any;
    filter: any;
    eq: any;
  },
>(
  query: T,
  filters?: ColumnFiltersState
) => {
  if (filters) {
    filters.forEach((filter) => {
      if (filter.value) {
        if (filter.id === 'date') {
          const [start, end] = filter.value as [string?, string?];
          if (start) query.gte(filter.id, start);
          if (end) query.lte(filter.id, end);
        }
        if (filter.id === 'credit_debit') {
          query.like(filter.id, filter.value as string);
        }
        if (filter.id === 'amount') {
          const [min, max] = filter.value as [number?, number?];
          if (min) query.gte(filter.id, min);
          if (max) query.lte(filter.id, max);
        }
        if (filter.id === 'category' && Array.isArray(filter.value) && filter.value.length > 0) {
          const hasUncategorized = filter.value.includes('Uncategorized');
          const categories = filter.value.filter((c) => c !== 'Uncategorized') as string[];

          if (hasUncategorized && categories.length > 0) {
            // If Uncategorized is selected along with other categories
            query.or(`category.is.null,category.in.(${categories.join(',')})`);
          } else if (hasUncategorized) {
            // If only Uncategorized is selected
            query.is('category', null);
          } else if (categories.length > 0) {
            // If only specific categories are selected
            query.in('category', categories);
          }
        }
        if (filter.id === 'currency') {
          query.eq('currency', filter.value as CurrencyCode);
        }
        if (filter.id === 'source' && Array.isArray(filter.value) && filter.value.length > 0) {
          query.in('source', filter.value);
        }
        if (typeof filter.value === 'string' && filter.id !== 'currency') {
          query.ilike(filter.id, `%${filter.value}%`);
        }
      }
    });
  }
  return query;
};

export async function fetchAggregatedData(options: {
  userId: string;
  filters?: ColumnFiltersState;
}): Promise<TransactionStats> {
  const { filters } = options;
  const supabase = await createClient();

  try {
    const query = supabase
      .from('transactions')
      .select('month, credit_debit, currency, amount.sum(), count:id.count()')
      .order('month', { ascending: false });

    const queryCats = supabase
      .from('transactions')
      .select('category, currency, amount.sum(), count:id.count()')
      .filter('credit_debit', 'eq', 'Debit');

    const filteredQuery = await filterQuery(query, filters);
    const filteredQueryCats = await filterQuery(queryCats, filters);

    const { data, error } = await filteredQuery;
    const { data: dataCats, error: errorCats } = await filteredQueryCats;

    if (error || errorCats) {
      console.error('Error fetching transactions:', error, errorCats);
    }

    return {
      monthly: data?.map((i) => ({ ...i, month: new Date(i.month ?? '') })) || [],
      category: dataCats?.sort((a, b) => (b.sum ?? 0) - (a.sum ?? 0)) || [],
    };
  } catch (error) {
    console.error('Error processing request:', error);
    return {
      monthly: [],
      category: [],
    };
  }
}
