"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { WalletBalance as WalletBalanceType, getWalletBalance } from '@/services/api';

export default function WalletBalance() {
  const [balances, setBalances] = useState<WalletBalanceType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalUsdValue, setTotalUsdValue] = useState(0);

  useEffect(() => {
    fetchWalletBalance();
  }, []);

  const fetchWalletBalance = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await getWalletBalance();
      setBalances(data);
      
      // Calculate total USD value
      const total = data.reduce((sum, balance) => sum + balance.usd_value, 0);
      setTotalUsdValue(total);
    } catch (err) {
      console.error('Error fetching wallet balance:', err);
      setError('Failed to fetch wallet balance. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Wallet Balance</CardTitle>
        <Button 
          onClick={fetchWalletBalance} 
          disabled={loading}
          variant="outline"
          size="sm"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </Button>
      </CardHeader>
      <CardContent>
        {error && <p className="text-destructive mb-4">{error}</p>}
        
        <div className="mb-4">
          <p className="text-lg font-medium">
            Total Balance: <span className="font-bold">${totalUsdValue.toFixed(2)}</span>
          </p>
        </div>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Coin</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Free</TableHead>
              <TableHead>Locked</TableHead>
              <TableHead>Price (USD)</TableHead>
              <TableHead>Value (USD)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {balances.map((balance) => (
              <TableRow key={balance.coin}>
                <TableCell className="font-medium">{balance.coin}</TableCell>
                <TableCell>{balance.total.toFixed(8)}</TableCell>
                <TableCell>{balance.free.toFixed(8)}</TableCell>
                <TableCell>{balance.locked.toFixed(8)}</TableCell>
                <TableCell>${balance.current_price.toFixed(2)}</TableCell>
                <TableCell>${balance.usd_value.toFixed(2)}</TableCell>
              </TableRow>
            ))}
            {balances.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">
                  No balance data available. Click Refresh to fetch data.
                </TableCell>
              </TableRow>
            )}
            {loading && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">
                  Loading wallet balance...
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
} 