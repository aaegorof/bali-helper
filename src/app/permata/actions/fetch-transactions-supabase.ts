'use server';

import { createClient } from '@/app/lib/supabase/server';
import { ColumnFiltersState, PaginationState, SortingState } from '@tanstack/react-table';
import { filterQuery } from './aggregated-data';

export async function fetchDataForTableView(options: {
  userId: string;
  pagination: PaginationState;
  filters?: ColumnFiltersState;
  sorting?: SortingState;
}) {
  const { filters, pagination, sorting, userId } = options;

  const supabase = await createClient();

  try {
    const query = supabase
      .from('transactions')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .range(
        pagination.pageIndex * pagination.pageSize,
        (pagination.pageIndex + 1) * pagination.pageSize - 1
      );

    // Apply sorting if provided
    if (sorting?.[0]) {
      query.order(sorting[0].id, { ascending: !sorting[0].desc });
    }

    const filteredQuery = await filterQuery<typeof query>(query, filters);
    
    const { data: rows, error, count } = await filteredQuery;

    if (error) {
      console.error('Error fetching transactions:', error);
      return { transactions: [], count: 0 };
    }

    return {
      transactions: rows || [],
      count: count || 0,
    };
  } catch (error) {
    console.error('Error processing request:', error);
    return { transactions: [], count: 0 };
  }
}

export async function fetchTotalCount() {
  const supabase = await createClient();

  const query = supabase.from('transactions').select('*', { count: 'exact', head: true });

  const { error, count } = await query;

  if (error) {
    console.error('Error fetching transactions:', error);
    return 0;
  }
  return count || 0;
}
