import { useAuth } from '@/app/lib/auth';
import { RespGetTransactions, TransactionDb } from '@/app/permata/api/transactions/route';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

interface TransactionsContextType {
  transactions: TransactionDb[];
  setTransactions: (transactions: TransactionDb[]) => void;
  fetchTransactions: () => Promise<TransactionDb[]>;
  filteredTransactions: TransactionDb[];
  setFilteredTransactions: (transactions: TransactionDb[]) => void;
  totalDebit: number;
  totalCredit: number;
}

const TransactionsContext = createContext<TransactionsContextType | undefined>(undefined);

export function TransactionsProvider({ children }: { children: React.ReactNode }) {
  const [transactions, setTransactions] = useState<TransactionDb[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<TransactionDb[]>(transactions);
  const { user } = useAuth();

  const [totalDebit, totalCredit] = useMemo(() => {
    let totalD = 0;
    let totalC = 0;
    filteredTransactions.forEach((trs) => {
      if (trs.credit_debit === 'Credit') {
        totalC += Number(trs.amount);
      }
      if (trs.credit_debit === 'Debit') {
        totalD += Number(trs.amount);
      }
    });
    return [totalD, totalC];
  }, [filteredTransactions]);

  const fetchTransactions = async () => {
    try {
      const response  = await fetch(`/permata/api/transactions?userId=${user?.id}`)
      const {data} = (await response.json()) as RespGetTransactions
      setTransactions(data?.transactions || []);
      setFilteredTransactions(data?.transactions || []);
      return data?.transactions || [];
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [user]);

  return (
    <TransactionsContext.Provider
      value={{
        transactions,
        setTransactions,
        fetchTransactions,
        filteredTransactions,
        setFilteredTransactions,
        totalDebit,
        totalCredit,
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
