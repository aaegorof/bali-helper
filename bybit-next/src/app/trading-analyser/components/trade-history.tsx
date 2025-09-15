'use client';

import { formatNumberWithLeadingZeros } from '@/app/lib/helpers';
import { useTradingContext } from '@/app/trading-analyser/context/TradingContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InputLabel } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const formatHelper = () => {
  // Get parts from a sample date using the current locale
  const parts = new Intl.DateTimeFormat(navigator.language, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).formatToParts(new Date());

  // Build the format string based on the parts order
  const formatParts = parts.map((part) => {
    switch (part.type) {
      case 'month':
        return 'MM';
      case 'day':
        return 'DD';
      case 'year':
        return 'YYYY';
      case 'hour':
        return 'HH';
      case 'minute':
        return 'mm';
      default:
        return part.value;
    }
  });

  return formatParts.join('');
};

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

        <InputLabel label="Select Trading Pair" className="max-w-[180px]">
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
              <TableHead>Total Value, $</TableHead>
              <TableHead>
                Timestamp <span className="text-xs text-muted-foreground">({formatHelper()})</span>
              </TableHead>
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
                <TableCell className="text-right">
                  {formatNumberWithLeadingZeros(trade.price, 2)}
                </TableCell>
                <TableCell className="text-right">
                  {formatNumberWithLeadingZeros(trade.qty, 3)}
                </TableCell>
                <TableCell className="text-right">
                  {formatNumberWithLeadingZeros(trade.price * trade.qty, 2)}
                </TableCell>
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
