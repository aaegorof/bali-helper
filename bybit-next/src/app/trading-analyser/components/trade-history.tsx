'use client';

import { useTradingContext } from '@/app/trading-analyser/context/TradingContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InputLabel } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function TradeHistory() {
  const { tradingPairs, selectedPair, setSelectedPair, trades, isLoadingTrades, error } =
    useTradingContext();

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const handlePairChange = (value: string) => {
    setSelectedPair(value);
  };

  if (!tradingPairs.length && !isLoadingTrades) {
    return (
      <Card>
        <CardContent className="py-6">
          <p>No trading pairs available. Please fetch data first.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trade History</CardTitle>
      </CardHeader>
      <CardContent>
        {error && <p className="text-destructive mb-4">{error}</p>}

        <InputLabel label="Select Trading Pair">
          <Select value={selectedPair} onValueChange={handlePairChange} disabled={isLoadingTrades}>
            <SelectTrigger>
              <SelectValue placeholder="Select a pair" />
            </SelectTrigger>
            <SelectContent>

              {tradingPairs.map((pair) => (
                <SelectItem key={pair} value={pair}>
                  {pair}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </InputLabel>

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
            {trades?.map((trade) => (
              <TableRow key={trade.orderId}>
                <TableCell>{trade.symbol}</TableCell>
                <TableCell
                  className={trade.side.toUpperCase() === 'BUY' ? 'text-green-500' : 'text-red-500'}
                >
                  {trade.side}
                </TableCell>
                <TableCell>{trade.price.toFixed(2)}</TableCell>
                <TableCell>{trade.qty.toFixed(8)}</TableCell>
                <TableCell>{formatTimestamp(trade.timestamp)}</TableCell>
                <TableCell className="font-mono text-xs">{trade.orderId}</TableCell>
              </TableRow>
            ))}
            {trades.length === 0 && !isLoadingTrades && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">
                  No trade history available. Click Fetch to retrieve data.
                </TableCell>
              </TableRow>
            )}
            {isLoadingTrades && (
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
