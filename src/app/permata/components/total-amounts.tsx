import { TRANSACTION_COLORS } from '@/app/lib/constants';
import { CurrencyCode, getCurrencySymbol } from '@/app/lib/currencies';
import { formatNumberToKMil } from '@/app/lib/utils';
import { useMemo } from 'react';
import { useTransactionsContext } from './transactions-context';

export default function TotalAmounts() {
  const { monthlyStats, count, totalCount } = useTransactionsContext();

  // Calculate totals per currency
  const totalsByCurrency = useMemo(() => {
    return monthlyStats.reduce(
      (acc, stat) => {
        const currency = stat.currency || 'USD';
        if (!acc[currency]) {
          acc[currency] = { debit: 0, credit: 0 };
        }
        if (stat.credit_debit === 'Debit') {
          acc[currency].debit += stat.sum || 0;
        } else if (stat.credit_debit === 'Credit') {
          acc[currency].credit += stat.sum || 0;
        }
        return acc;
      },
      {} as Record<CurrencyCode, { debit: number; credit: number }>
    );
  }, [monthlyStats]);

  return (
    <div className="space-y-2">
      <p className="text-xs">
        Calculated from{' '}
        {count !== totalCount && (
          <span>
            <span className="font-bold">{count}</span> filtered transactions out of
          </span>
        )}{' '}
        <span className="font-bold">{totalCount}</span> total transactions.
      </p>

      {Object.entries(totalsByCurrency).map(([currency, totals]) => (
        <div
          key={currency}
          className="border-l-2 pl-2"
          style={{ borderColor: 'hsl(var(--muted))' }}
        >
          <p className="text-xs font-semibold text-muted-foreground mb-1">
            {currency} {getCurrencySymbol(currency as CurrencyCode)}
          </p>
          <p className="text-sm">
            Debit:{' '}
            <span className="font-bold" style={{ color: TRANSACTION_COLORS.debit.text }}>
              {formatNumberToKMil(totals.debit)}
            </span>
          </p>
          <p className="text-sm">
            Credit:{' '}
            <span className="font-bold" style={{ color: TRANSACTION_COLORS.credit.text }}>
              {formatNumberToKMil(totals.credit)}
            </span>
          </p>
        </div>
      ))}

      {Object.keys(totalsByCurrency).length === 0 && (
        <p className="text-sm text-muted-foreground">No data available</p>
      )}
    </div>
  );
}
