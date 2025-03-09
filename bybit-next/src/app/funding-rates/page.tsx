"use client"

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input, InputLabel } from '@/components/ui/input';
import { DEFAULT_SYMBOLS } from '@/lib/constants';
import { FundingRate, getFundingRates } from '@/services/api';

export default function FundingRates() {
  const [symbols, setSymbols] = useState<string[]>(DEFAULT_SYMBOLS);
  const [fundingRates, setFundingRates] = useState<FundingRate[]>([]);
  const [loading, setLoading] = useState(false);
  const [newSymbol, setNewSymbol] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFundingRates();
  }, []);

  const fetchFundingRates = async () => {
    if (symbols.length === 0) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const rates = await getFundingRates(symbols);
      setFundingRates(rates);
    } catch (err) {
      console.error('Error fetching funding rates:', err);
      setError('Failed to fetch funding rates. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const addSymbol = () => {
    if (!newSymbol) return;
    
    const formattedSymbol = newSymbol.toUpperCase();
    if (symbols.includes(formattedSymbol)) {
      setError('Symbol already exists in the list');
      return;
    }
    
    setSymbols([...symbols, formattedSymbol]);
    setNewSymbol('');
  };

  const removeSymbol = (symbolToRemove: string) => {
    setSymbols(symbols.filter(symbol => symbol !== symbolToRemove));
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Funding Rates</h1>
        <Link href="/">
          <Button variant="outline">Back to Home</Button>
        </Link>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Add Symbol</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              value={newSymbol}
              onChange={(e) => setNewSymbol(e.target.value)}
              placeholder="Enter symbol (e.g. BTCUSDT)"
              className="max-w-xs"
            />
            <Button onClick={addSymbol}>Add</Button>
            <Button onClick={fetchFundingRates} disabled={loading}>
              {loading ? 'Loading...' : 'Refresh Rates'}
            </Button>
          </div>
          {error && <p className="text-destructive mt-2">{error}</p>}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Current Funding Rates</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Symbol</TableHead>
                <TableHead>Funding Rate (%)</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fundingRates.map((rate) => (
                <TableRow key={rate.symbol}>
                  <TableCell>{rate.symbol}</TableCell>
                  <TableCell className={rate.fundingRate >= 0 ? 'text-green-500' : 'text-red-500'}>
                    {rate.fundingRate.toFixed(4)}%
                  </TableCell>
                  <TableCell>{formatTimestamp(rate.timestamp)}</TableCell>
                  <TableCell>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => removeSymbol(rate.symbol)}
                    >
                      Remove
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {fundingRates.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-4">
                    No funding rates available. Add symbols and click Refresh.
                  </TableCell>
                </TableRow>
              )}
              {loading && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-4">
                    Loading funding rates...
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
} 