import { useState, useEffect } from 'react';
import { TransactionDb } from '@/pages/permata';
import { getUserTransactions } from '@/services/api';
import { useAuth } from '@/contexts/auth-context';

export function useTransactions() { 
  const [transactions, setTransactions] = useState<TransactionDb[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<TransactionDb[]>(transactions);
  const { currentUser } = useAuth();
  console.log(filteredTransactions)
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
  
  return {
    transactions,
    setTransactions,
    fetchTransactions,
    filteredTransactions,
    setFilteredTransactions,
  };
}