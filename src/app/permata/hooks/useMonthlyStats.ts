import { useAuth } from '@/app/lib/auth';
import { useEffect, useState } from 'react';
import { MonthlyTransactionStats } from '../api/transactions/aggregate/route';

export function useMonthlyStats() {
  const [monthlyStats, setMonthlyStats] = useState<MonthlyTransactionStats[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchMonthlyStats = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/permata/api/transactions/aggregate?userId=${user.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch monthly stats');
      }

      const data = await response.json();
      setMonthlyStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching monthly stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMonthlyStats();
  }, [user?.id]);

  return {
    monthlyStats,
    isLoading,
    error,
    refetch: fetchMonthlyStats,
  };
}
