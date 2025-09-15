'use client';

import { CoinAnalisys, Trade, WalletBalance } from '@/app/trading-analyser/api/types';
import { useSession } from 'next-auth/react';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

interface TradingContextType {
  // Wallet and Prices
  walletBalances: WalletBalance[];
  isLoadingBalances: boolean;
  refreshWalletBalances: () => Promise<void>;

  // Trading History
  tradingPairs: string[];
  selectedPair: string;
  setSelectedPair: (pair: string) => void;
  trades: Trade[];
  tradeAnalyze: Record<string, CoinAnalisys>;
  isLoadingTrades: boolean;
  fetchTrades: (symbol?: string, limit?: number) => Promise<void>;

  // General
  error: string | null;
}

const TradingContext = createContext<TradingContextType | undefined>(undefined);

export const TradingProvider = ({ children }: { children: ReactNode }) => {
  const { data: session, status } = useSession();

  // Более надежное преобразование ID, обрабатывающее строковые и числовые идентификаторы
  let userId: number | undefined = undefined;
  if (session?.user?.id) {
    try {
      // Пробуем преобразовать в число безопасно
      const parsed = parseInt(String(session.user.id), 10);
      userId = !isNaN(parsed) ? parsed : undefined;

      if (userId === undefined) {
        console.error('TradingContext: Failed to parse user ID:', session.user.id);
      }
    } catch (error) {
      console.error('TradingContext: Error parsing user ID:', error);
    }
  } else if (status === 'authenticated') {
    console.error('TradingContext: Session is authenticated but user ID is missing');
  }

  // Wallet and Prices State
  const [walletBalances, setWalletBalances] = useState<WalletBalance[]>([]);
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);

  // Trading History State
  const [tradingPairs, setTradingPairs] = useState<string[]>([]);
  const [selectedPair, setSelectedPair] = useState<string>('');
  const [trades, setTrades] = useState<Trade[]>([]);
  const [tradeAnalyze, setTradeAnalyze] = useState<Record<string, CoinAnalisys>>({});
  const [isLoadingTrades, setIsLoadingTrades] = useState(false);

  // General State
  const [error, setError] = useState<string | null>(null);

  // Fetch wallet balances and current prices
  const refreshWalletBalances = async () => {
    if (!userId || status !== 'authenticated') {
      console.log('Skipping wallet balances fetch: Not authenticated or missing userId');
      return;
    }

    setIsLoadingBalances(true);
    setError(null);

    try {
      const response = await fetch(`/trading-analyser/api/wallet/balance?userId=${userId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch wallet balance');
      }

      const data = await response.json();
      setWalletBalances(data);
    } catch (err: any) {
      console.error('Error fetching wallet balance:', err);
      setError(err.message || 'Failed to fetch wallet balance');
    } finally {
      setIsLoadingBalances(false);
    }
  };

  // Fetch trading pairs for the user
  const fetchTradingPairs = async () => {
    if (!userId || status !== 'authenticated') {
      console.log('Skipping trading pairs fetch: Not authenticated or missing userId');
      return;
    }

    try {
      const response = await fetch(`/trading-analyser/api/user/pairs?userId=${userId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch trading pairs');
      }

      const data = await response.json();
      setTradingPairs(data.symbols || []);

      // Set the first pair as selected if we don't have one already
      if (data.symbols?.length > 0 && !selectedPair) {
        setSelectedPair(data.symbols[0]);
      }
    } catch (err: any) {
      console.error('Error fetching trading pairs:', err);
      setError(err.message || 'Failed to fetch trading pairs');
    }
  };

  // Fetch trade history for a specific symbol
  const fetchTrades = async (symbol?: string, limit: number = 100) => {
    if (!userId || status !== 'authenticated') {
      console.log('Skipping trades fetch: Not authenticated or missing userId');
      return;
    }

    const pairToFetch = symbol || selectedPair;
    if (!pairToFetch) return;

    setIsLoadingTrades(true);
    setError(null);

    try {
      const response = await fetch(
        `/trading-analyser/api/user/trades/${pairToFetch}?limit=${limit}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch trades for ${pairToFetch}`);
      }
      const data = await response.json();

      setTrades(data.trades || []);
      setTradeAnalyze(data.analyze || {});
    } catch (err: any) {
      console.error('Error fetching trades:', err);
      setError(err.message || `Failed to fetch trades for ${pairToFetch}`);
    } finally {
      setIsLoadingTrades(false);
    }
  };

  // Initial data loading
  useEffect(() => {
    if (userId && status === 'authenticated') {
      refreshWalletBalances();
      fetchTradingPairs();
    }
  }, [userId, status]);

  // When selected pair changes, fetch trades for that pair
  useEffect(() => {
    if (selectedPair && userId && status === 'authenticated') {
      fetchTrades(selectedPair);
    }
  }, [selectedPair, userId, status]);

  const value = {
    // Wallet and Prices
    walletBalances,
    isLoadingBalances,
    refreshWalletBalances,

    // Trading History
    tradingPairs,
    selectedPair,
    setSelectedPair,
    trades,
    tradeAnalyze,
    isLoadingTrades,
    fetchTrades,

    // General
    error,
  };

  return <TradingContext.Provider value={value}>{children}</TradingContext.Provider>;
};

export const useTradingContext = () => {
  const context = useContext(TradingContext);
  if (context === undefined) {
    throw new Error('useTradingContext must be used within a TradingProvider');
  }
  return context;
};
