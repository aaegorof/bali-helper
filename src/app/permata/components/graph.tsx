import { TRANSACTION_COLORS } from '@/app/lib/constants';
import { CurrencyCode } from '@/app/lib/currencies';
import { formatNumberToKMil } from '@/app/lib/utils';
import { useMemo } from 'react';
import { Bar, BarChart, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useTransactionsContext } from './transactions-context';

type Props = {
  className?: string;
};

const GraphPermata = ({ className }: Props) => {
  const { monthlyStats, filters } = useTransactionsContext();

  // Get selected currency from filters or use 'all' as default
  const selectedCurrency = useMemo(() => {
    const currencyFilter = filters.find((f) => f.id === 'currency');
    return currencyFilter?.value as CurrencyCode | undefined;
  }, [filters]);

  const chartData = useMemo(() => {
    if (!monthlyStats?.length) return [];

    // Filter by currency if selected
    const filteredStats = selectedCurrency
      ? monthlyStats.filter((stat) => stat.currency === selectedCurrency)
      : monthlyStats;

    // Group data by month and currency
    const groupedData = filteredStats.reduce(
      (acc, stat) => {
        const date = new Date(stat.month);
        const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        const currency = stat.currency || 'USD';

        if (!acc[monthKey]) {
          acc[monthKey] = {
            month: monthKey,
          };
        }

        if (stat.credit_debit === 'Debit' || stat.credit_debit === 'Credit') {
          const key = selectedCurrency ? stat.credit_debit : `${stat.credit_debit} (${currency})`;

          if (!acc[monthKey][key]) {
            acc[monthKey][key] = 0;
          }
          acc[monthKey][key] = (acc[monthKey][key] as number) + Math.abs(stat.sum);
        }

        return acc;
      },
      {} as Record<string, Record<string, string | number>>
    );

    return Object.values(groupedData).sort((a, b) => {
      const dateA = new Date(a.month as string);
      const dateB = new Date(b.month as string);
      return dateA.getTime() - dateB.getTime();
    });
  }, [monthlyStats, selectedCurrency]);

  // Get all unique keys (currencies) for bars
  const barKeys = useMemo(() => {
    if (!chartData.length) return []; 
    const keys = new Set<string>();
    chartData.forEach((item) => {
      Object.keys(item).forEach((key) => {
        if (key !== 'month') keys.add(key);
      });
    });
    return Array.from(keys).sort();
  }, [chartData]);

  // Generate colors for bars
  const getBarColor = (key: string) => {
    if (key.includes('Debit')) return TRANSACTION_COLORS.debit.background;
    if (key.includes('Credit')) return TRANSACTION_COLORS.credit.background;
    return TRANSACTION_COLORS.debit.background;
  };

  return (
    <div className={className}>
      {chartData.length > 0 ? (
        <div className="w-full">
          {!selectedCurrency && (
            <div className="mb-2 text-sm text-muted-foreground">
              Showing all currencies. Select a currency filter to see more clear view.
            </div>
          )}
          <div className="w-full h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                {/* <CartesianGrid strokeDasharray="1 1" /> */}
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={formatNumberToKMil} tick={{ fontSize: 12 }} />
                <Tooltip
                  cursor={{ fill: 'hsl(var(--muted-foreground) / 0.1)' }}
                  formatter={(value: number) => formatNumberToKMil(value)}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                  }}
                />
                <Legend />
                {barKeys.map((key) => (
                  <Bar key={key} dataKey={key} fill={getBarColor(key)} name={key} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="text-center text-muted-foreground py-8">No data available</div>
      )}
    </div>
  );
};

export default GraphPermata;
