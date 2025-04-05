'use client';

import { formatNumberWithLeadingZeros } from '@/app/lib/helpers';
import { useTradingContext } from '@/app/trading-analyser/context/TradingContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useMemo } from 'react';

export default function WalletBalance() {
  const { walletBalances, isLoadingBalances, refreshWalletBalances, error } = useTradingContext();

  const balances = useMemo(() => {
    return walletBalances.sort((a, b) => b.usd_value - a.usd_value);
  }, [walletBalances]);

  const totalUsdValue = useMemo(() => {
    return balances.reduce<number>((acc, balance) => acc + balance.usd_value, 0);
  }, [balances]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Wallet Balance</CardTitle>
        <Button
          onClick={refreshWalletBalances}
          disabled={isLoadingBalances}
          variant="outline"
          size="sm"
        >
          {isLoadingBalances ? 'Loading...' : 'Refresh'}
        </Button>
      </CardHeader>
      <CardContent>
        {error && <p className="text-destructive mb-4">{error}</p>}

        <div className="mb-4">
          <p className="text-lg font-medium">
            Total Balance: <span className="font-bold">${totalUsdValue.toFixed(2)}</span>
          </p>
        </div>

        {(() => {
          const columns = [
            {
              name: 'Coin',
              key: 'coin',
              className: 'text-left',
              value: (balance: any) => balance.coin,
            },
            {
              name: 'Total',
              key: 'total',
              className: 'text-right',
              value: (balance: any) => formatNumberWithLeadingZeros(balance.total),
            },
            {
              name: 'Price (USD)',
              key: 'price',
              className: 'text-right',
              value: (balance: any) => formatNumberWithLeadingZeros(balance.current_price),
            },
            {
              name: 'Value (USD)',
              key: 'value',
              className: 'text-right',
              value: (balance: any) => balance.usd_value.toFixed(2),
            },
          ];

          return (
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((column) => (
                    <TableHead key={column.key} className={column.className}>
                      {column.name}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {balances.map((balance) => (
                  <TableRow key={balance.coin}>
                    {columns.map((column) => (
                      <TableCell key={`${balance.coin}-${column.key}`} className={column.className}>
                        {column.value(balance)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
                {balances.length === 0 && !isLoadingBalances && (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="text-center py-4">
                      No balance data available. Click Refresh to fetch data.
                    </TableCell>
                  </TableRow>
                )}
                {isLoadingBalances && (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="text-center py-4">
                      Loading wallet balance...
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          );
        })()}
      </CardContent>
    </Card>
  );
}
