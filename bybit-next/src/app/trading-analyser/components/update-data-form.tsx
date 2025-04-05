'use client';

import { useTradingContext } from '@/app/trading-analyser/context/TradingContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input, InputLabel } from '@/components/ui/input';
import { TRADING_SYMBOLS } from '@/lib/constants';
import { useSession } from 'next-auth/react';
import React, { useState } from 'react';

export default function UpdateDataForm() {
  const [symbol, setSymbol] = useState(TRADING_SYMBOLS[0]);
  const [limit, setLimit] = useState(100);
  const [startTime, setStartTime] = useState('2023-09-01T00:00');
  const [endTime, setEndTime] = useState('2025-02-05T00:00');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { data: session } = useSession();
  const userId = Number(session?.user?.id);

  const { refreshWalletBalances, fetchTrades } = useTradingContext();

  const fetchAndSaveSpotTrades = async (
    symbol: string,
    userId: number,
    startDate: string,
    endDate: string,
    limit: number
  ) => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`/trading-analyser/api/user/trades/${symbol}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate,
          endDate,
          userId,
          limit,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch spot trades');
      }

      setSuccessMessage(data.message || `Successfully processed spot trades for ${symbol}`);

      // Refresh data in context after successful fetch
      refreshWalletBalances();
      fetchTrades(symbol);
    } catch (err: any) {
      setError(err.message || 'Error loading data');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSymbolChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSymbol(e.target.value);
  };

  const handleLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLimit(Number(e.target.value));
  };

  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStartTime(e.target.value);
  };

  const handleEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEndTime(e.target.value);
  };

  const handleSpotTradesSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAndSaveSpotTrades(symbol, userId, startTime, endTime, limit);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Get data from Bybit API</CardTitle>
        <p className="text-xs text-gray-500">
          Fetch historical spot trades from Bybit and save them to the database. This will allow you
          to analyze your trading data later.
        </p>
      </CardHeader>
      <CardContent>
        {isLoading && <div className="mb-4 text-blue-500 font-medium">Loading data...</div>}
        {error && <div className="mb-4 text-red-500 font-medium">{error}</div>}
        {successMessage && <div className="mb-4 text-green-500 font-medium">{successMessage}</div>}

        <form onSubmit={handleSpotTradesSubmit} className="space-y-4">
          <InputLabel label="Symbol">
            <Input
              type="text"
              value={symbol}
              onChange={handleSymbolChange}
              placeholder="Enter symbol"
            />
            <div className="flex gap-2 flex-wrap mt-2">
              {TRADING_SYMBOLS.map((ticker) => (
                <button
                  key={ticker}
                  type="button"
                  onClick={() => setSymbol(ticker)}
                  className={`px-2 py-1 text-xs rounded-md transition-colors ${
                    symbol === ticker
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  }`}
                >
                  {ticker}
                </button>
              ))}
            </div>
          </InputLabel>

          <InputLabel label="Start Time">
            <Input type="datetime-local" value={startTime} onChange={handleStartTimeChange} />
          </InputLabel>

          <InputLabel label="End Time">
            <Input type="datetime-local" value={endTime} onChange={handleEndTimeChange} />
          </InputLabel>

          <InputLabel label="Limit per request">
            <Input
              type="number"
              value={limit}
              onChange={handleLimitChange}
              placeholder="Enter limit"
              min={1}
              max={1000}
            />
            <p className="text-xs text-gray-500 mt-1">
              Note: Bybit API allows max 1000 records per request. The data will be fetched in
              weekly chunks.
            </p>
          </InputLabel>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Fetching Data...' : 'Fetch & Save Spot Trades'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
