import { useAuth } from '@/app/lib/auth';
import { TransactionDb } from '@/app/permata/lib/transactions-service';
import {
  ColumnFiltersState,
  OnChangeFn,
  PaginationState,
  SortingState,
} from '@tanstack/react-table';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  CategoryTransactionStats,
  fetchAggregatedData,
  MonthlyTransactionStats,
} from '../actions/aggregated-data';
import { fetchDataForTableView, fetchTotalCount } from '../actions/fetch-transactions-supabase';

interface TransactionsContextType {
  transactions: TransactionDb[];
  setTransactions: (transactions: TransactionDb[]) => void;
  fetchTransactions: ({
    filters,
    pagination,
    sorting,
  }: {
    filters: ColumnFiltersState;
    pagination: PaginationState;
    sorting: SortingState;
  }) => Promise<TransactionDb[]>;
  filters: ColumnFiltersState;
  setFilters: (filters: ColumnFiltersState) => void;
  pagination: PaginationState;
  setPagination: OnChangeFn<PaginationState>;
  sorting: SortingState;
  setSorting: OnChangeFn<SortingState>;
  count: number;
  totalCount: number;
  monthlyStats: MonthlyTransactionStats[];
  categoryStats: CategoryTransactionStats[];
}

const TransactionsContext = createContext<TransactionsContextType | undefined>(undefined);

export const defaultFilters: TransactionsContextType['filters'] = [
  // { id: 'date', value: ['', ''] },
  // { id: 'amount', value: ['', ''] },
  // { id: 'category', value: null },
  { id: 'currency', value: null },
  { id: 'credit_debit', value: null },
  { id: 'source', value: null },
];

const defaultSorting: SortingState = [{ id: 'date', desc: true }];

export function TransactionsProvider({ children }: { children: React.ReactNode }) {
  const [transactions, setTransactions] = useState<TransactionsContextType['transactions']>([]);
  const [monthlyStats, setMonthlyStats] = useState<TransactionsContextType['monthlyStats']>([]);
  const [filters, _setFilters] = useState<TransactionsContextType['filters']>(defaultFilters);
  const [categoryStats, setCategoryStats] = useState<TransactionsContextType['categoryStats']>([]);
  const [sorting, setSorting] = useState<TransactionsContextType['sorting']>(defaultSorting);
  const [count, setCount] = useState<TransactionsContextType['count']>(0);
  const [totalCount, setTotalCount] = useState<TransactionsContextType['totalCount']>(0);
  const [pagination, setPagination] = useState<TransactionsContextType['pagination']>({
    pageIndex: 0,
    pageSize: 30,
  });

  const { user } = useAuth();

  const setFilters = (filters: ColumnFiltersState) => {
    _setFilters(filters);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  };

  const fetchTransactions = useCallback(
    async ({
      pagination,
      filters,
      sorting,
    }: {
      pagination: PaginationState;
      filters: ColumnFiltersState;
      sorting: SortingState;
    }) => {
      try {
        if (!user?.id) {
          return [];
        }

        const response = await fetchDataForTableView({
          userId: user?.id,
          pagination,
          filters,
          sorting,
        });
        const { transactions, count } = response;

        setTransactions(transactions || []);
        setCount(count || 0);
        return transactions || [];
      } catch (error) {
        console.error('Error fetching transactions:', error);
        return [];
      }
    },
    [user]
  );

  const fetchMonthlyStats = async (filters: ColumnFiltersState) => {
    if (!user?.id) return;

    try {
      const data = await fetchAggregatedData({ userId: user.id, filters });
      setMonthlyStats(data.monthly);
      setCategoryStats(data.category);
    } catch (err) {
      console.error('Error fetching monthly stats:', err);
    }
  };

  const fetchTotals = async () => {
    if (!user?.id) return;
    const data = await fetchTotalCount();
    setTotalCount(data);
  };

  useEffect(() => {
    fetchTransactions({ pagination, filters, sorting });
    fetchMonthlyStats(filters);
    fetchTotals();
  }, [pagination, filters, sorting]);

  return (
    <TransactionsContext.Provider
      value={{
        transactions,
        setTransactions,
        fetchTransactions,
        monthlyStats,
        categoryStats,
        filters,
        setFilters,
        pagination,
        setPagination,
        count,
        totalCount,
        sorting,
        setSorting,
      }}
    >
      {children}
    </TransactionsContext.Provider>
  );
}

export function useTransactionsContext() {
  const context = useContext(TransactionsContext);
  if (context === undefined) {
    throw new Error('useTransactionsContext must be used within a TransactionsProvider');
  }
  return context;
}
