'use server';

import { createClient } from '@/app/lib/supabase/server';
import { ColumnFiltersState } from '@tanstack/react-table';
import { TransactionDb } from '../api/transactions/route';

export interface MonthlyTransactionStats {
  month: Date;
  credit_debit: TransactionDb['credit_debit'];
  sum: number;
  count: number;
}

export interface CategoryTransactionStats {
  category: TransactionDb['category'];
  sum: number;
  count: number;
}

export interface TransactionStats {
  monthly: MonthlyTransactionStats[];
  category: CategoryTransactionStats[];
}

export const filterQuery = async <
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  T extends { gte: any; lte: any; like: any; ilike: any; in: any; is: any; or: any; filter: any },
>(
  query: T,
  filters?: ColumnFiltersState
) => {
  if (filters) {
    filters.forEach((filter) => {
      if (filter.value) {
        if (filter.id === 'posted_date') {
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
        if (typeof filter.value === 'string') {
          query.ilike(filter.id, `%${filter.value}%`);
        }
      }
    });
  }
  return query;
};

export async function fetchAggregatedData(options: {
  userId?: string;
  filters?: ColumnFiltersState;
}): Promise<TransactionStats> {
  const { filters } = options;
  const supabase = await createClient();

  try {
    const query = supabase
      .from('transactions')
      .select('month, credit_debit, amount.sum(), count:id.count()')
      .order('month', { ascending: false });
    // const query = supabase.from('transactions_monthly').select('*');

    // Apply filters if provided
    // if (filters) {
    //   filters.forEach((filter) => {
    //     if (filter.value) {
    //       if (filter.id === 'posted_date') {
    //         const [start, end] = filter.value as [string?, string?];
    //         if (start) query.gte(filter.id, start);
    //         if (end) query.lte(filter.id, end);
    //       }
    //       if (filter.id === 'credit_debit') {
    //         query.like(filter.id, filter.value as string);
    //       }
    //       if (filter.id === 'amount') {
    //         const [min, max] = filter.value as [number?, number?];
    //         if (min) query.gte(filter.id, min);
    //         if (max) query.lte(filter.id, max);
    //       }
    //       if (filter.id === 'category' && filter.value.length > 0) {
    //         const hasUncategorized = filter.value.includes('Uncategorized');
    //         const categories = filter.value.filter((c) => c !== 'Uncategorized') as string[];

    //         if (hasUncategorized && categories.length > 0) {
    //           // If Uncategorized is selected along with other categories
    //           query.or(`category.is.null,category.in.(${categories.join(',')})`);
    //         } else if (hasUncategorized) {
    //           // If only Uncategorized is selected
    //           query.is('category', null);
    //         } else if (categories.length > 0) {
    //           // If only specific categories are selected
    //           query.in('category', categories);
    //         }
    //       }
    //       if (typeof filter.value === 'string') {
    //         query.ilike(filter.id, `%${filter.value}%`);
    //       }
    //     }
    //   });
    // }

    const queryCats = supabase
      .from('transactions')
      .select('category, amount.sum(), count:id.count()')
      .filter('credit_debit', 'eq', 'Debit');

    const filteredQuery = await filterQuery(query, filters);
    const filteredQueryCats = await filterQuery(queryCats, filters);

    const { data, error } = await filteredQuery;
    const { data: dataCats, error: errorCats } = await filteredQueryCats;

    if (error || errorCats) {
      console.error('Error fetching transactions:', error, errorCats);
    }

    return {
      monthly:
        data?.map((item) => ({
          month: new Date(item.month!),
          credit_debit: item.credit_debit,
          sum: item.sum,
          count: item.count,
        })) || [],
      category:
        dataCats
          ?.sort((a, b) => (b.sum ?? 0) - (a.sum ?? 0))
          .map((item) => ({
            category: item.category ?? 'Uncategorized',
            sum: item.sum,
            count: item.count,
          })) || [],
    };
  } catch (error) {
    console.error('Error processing request:', error);
    return {
      monthly: [],
      category: [],
    };
  }
}
