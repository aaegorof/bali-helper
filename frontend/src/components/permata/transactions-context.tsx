import React, { createContext, useContext, useState, useEffect } from 'react';
import { TransactionDb } from '@/pages/permata';
import { getUserTransactions } from '@/services/api';
import { useAuth } from '@/contexts/auth-context';

interface TransactionsContextType {
  transactions: TransactionDb[];
  setTransactions: (transactions: TransactionDb[]) => void;
  fetchTransactions: () => Promise<TransactionDb[]>;
  filteredTransactions: TransactionDb[];
  setFilteredTransactions: (transactions: TransactionDb[]) => void;
}

const TransactionsContext = createContext<TransactionsContextType | undefined>(undefined);

export function TransactionsProvider({ children }: { children: React.ReactNode }) {
  const [transactions, setTransactions] = useState<TransactionDb[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<TransactionDb[]>(transactions);
  const { currentUser } = useAuth();

  const fetchTransactions = async () => {
    try {
      const response = await getUserTransactions(currentUser?.id);
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
  }, [currentUser]);

  return (
    <TransactionsContext.Provider
      value={{
        transactions,
        setTransactions,
        fetchTransactions,
        filteredTransactions,
        setFilteredTransactions,
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