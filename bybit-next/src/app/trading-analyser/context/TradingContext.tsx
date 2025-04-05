'use client';

import { AveragePrice, Trade, WalletBalance } from '@/app/types/api';
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
  tradeAverages: Record<string, AveragePrice>;
  isLoadingTrades: boolean;
  fetchTrades: (symbol?: string, limit?: number) => Promise<void>;

  // General
  error: string | null;
}

const TradingContext = createContext<TradingContextType | undefined>(undefined);

export const TradingProvider = ({ children }: { children: ReactNode }) => {
  const { data: session } = useSession();
  const userId = Number(session?.user?.id);
  // Wallet and Prices State
  const [walletBalances, setWalletBalances] = useState<WalletBalance[]>([]);
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);

  // Trading History State
  const [tradingPairs, setTradingPairs] = useState<string[]>([]);
  const [selectedPair, setSelectedPair] = useState<string>('');
  const [trades, setTrades] = useState<Trade[]>([]);
  const [tradeAverages, setTradeAverages] = useState<Record<string, AveragePrice>>({});
  const [isLoadingTrades, setIsLoadingTrades] = useState(false);

  // General State
  const [error, setError] = useState<string | null>(null);

  // Fetch wallet balances and current prices
  const refreshWalletBalances = async () => {
    if (!userId) return;

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
    if (!userId) return;

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
    if (!userId) return;

    const pairToFetch = symbol || selectedPair;
    if (!pairToFetch) return;

    setIsLoadingTrades(true);
    setError(null);

    try {
      const response = await fetch(
        `/trading-analyser/api/user/trades/${pairToFetch}?limit=${limit}&userId=${userId}`,
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
      setTradeAverages(data.averages || {});
    } catch (err: any) {
      console.error('Error fetching trades:', err);
      setError(err.message || `Failed to fetch trades for ${pairToFetch}`);
    } finally {
      setIsLoadingTrades(false);
    }
  };

  // Initial data loading
  useEffect(() => {
    if (userId) {
      refreshWalletBalances();
      fetchTradingPairs();
    }
  }, [userId]);

  // When selected pair changes, fetch trades for that pair
  useEffect(() => {
    if (selectedPair && userId) {
      fetchTrades(selectedPair);
    }
  }, [selectedPair, userId]);

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
    tradeAverages,
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
