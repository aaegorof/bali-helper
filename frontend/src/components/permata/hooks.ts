import { useState } from 'react';
import { TransactionDb } from '@/pages/permata';

export function useTransactions() { 
  const [transactions, setTransactions] = useState<TransactionDb[]>([]);

  const fetchTransactions = async () => {
    try {
      const response = await fetch(`http://localhost:5500/api/transactions`);
      const data: TransactionDb[] = await response.json();
      setTransactions(data);
      return data;
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }
  };
  console.log(transactions);
  return {
    transactions,
    setTransactions,
    fetchTransactions,
  };
}