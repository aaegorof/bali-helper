"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input, InputLabel } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { TRADING_SYMBOLS } from '@/lib/constants';
import { Trade, getUserTrades } from '@/services/api';

export default function TradeHistory() {
  const [symbol, setSymbol] = useState(TRADING_SYMBOLS[0]);
  const [limit, setLimit] = useState(50);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTrades();
  }, []);

  const fetchTrades = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await getUserTrades(symbol, limit);
      setTrades(data);
    } catch (err) {
      console.error('Error fetching trades:', err);
      setError('Failed to fetch trades. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Trade History</CardTitle>
        <div className="flex gap-2">
          <select
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            {TRADING_SYMBOLS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <Input
            type="number"
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="w-20"
            min={1}
            max={1000}
          />
          <Button 
            onClick={fetchTrades} 
            disabled={loading}
            variant="outline"
            size="sm"
          >
            {loading ? 'Loading...' : 'Fetch'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && <p className="text-destructive mb-4">{error}</p>}
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Symbol</TableHead>
              <TableHead>Side</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Order ID</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trades.map((trade) => (
              <TableRow key={trade.orderId}>
                <TableCell>{trade.symbol}</TableCell>
                <TableCell className={trade.side === 'BUY' ? 'text-green-500' : 'text-red-500'}>
                  {trade.side}
                </TableCell>
                <TableCell>{trade.price.toFixed(2)}</TableCell>
                <TableCell>{trade.qty.toFixed(8)}</TableCell>
                <TableCell>{formatTimestamp(trade.timestamp)}</TableCell>
                <TableCell className="font-mono text-xs">{trade.orderId}</TableCell>
              </TableRow>
            ))}
            {trades.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">
                  No trade history available. Click Fetch to retrieve data.
                </TableCell>
              </TableRow>
            )}
            {loading && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">
                  Loading trade history...
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
} 