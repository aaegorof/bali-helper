import { useState } from 'react';
import { TransactionDb } from '@/pages/permata';
import { getUserTransactions } from '@/services/api';
import { useAuth } from '@/contexts/auth-context';

export function useTransactions() { 
  const [transactions, setTransactions] = useState<TransactionDb[]>([]);
  const { currentUser } = useAuth();

  const fetchTransactions = async () => {
    try {
      const response = await getUserTransactions(currentUser?.id);
      setTransactions(response);
      return response;
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }
  };
  
  return {
    transactions,
    setTransactions,
    fetchTransactions,
  };
}