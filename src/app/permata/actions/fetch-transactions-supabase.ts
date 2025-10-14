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
