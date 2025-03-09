import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { TransactionDb } from '@/services/api';
import { getUserTransactions } from '@/services/api';
import { useSession } from 'next-auth/react';

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
  const { data: session } = useSession();

  const [totalDebit, totalCredit] = useMemo(() => {
    let totalD = 0;
    let totalC = 0;
    filteredTransactions.forEach((trs) => {
      if (trs.credit_debit === "Credit") {
        totalC += Number(trs.amount);
      }
      if (trs.credit_debit === "Debit") {
        totalD += Number(trs.amount);
      }
    });
    return [totalD, totalC];
  }, [filteredTransactions]);

  const fetchTransactions = async () => {
    try {
      const response = await getUserTransactions(Number(session?.user?.id));
      setTransactions(response);
      setFilteredTransactions(response);
      return response;
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [session?.user?.id]);

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