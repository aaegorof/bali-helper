import { TRANSACTION_COLORS } from '@/app/lib/constants';
import { formatNumberToKMil } from '@/app/lib/utils';
import { useMemo } from 'react';
import { Bar, BarChart, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useTransactionsContext } from './transactions-context';

type Props = {
  className?: string;
};

const GraphPermata = ({ className }: Props) => {
  const { monthlyStats } = useTransactionsContext();

  const chartData = useMemo(() => {
    if (!monthlyStats?.length) return [];

    // Group data by month
    const groupedData = monthlyStats.reduce(
      (acc, stat) => {
        const date = new Date(stat.month);
        const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

        if (!acc[monthKey]) {
          acc[monthKey] = {
            month: monthKey,
            Debit: 0,
            Credit: 0,
          };
        }

        if (stat.credit_debit === 'Debit' || stat.credit_debit === 'Credit') {
          acc[monthKey][stat.credit_debit] = Math.abs(stat.sum);
        }

        return acc;
      },
      {} as Record<string, { month: string; Debit: number; Credit: number }>
    );

    return Object.values(groupedData).sort((a, b) => {
      const dateA = new Date(a.month);
      const dateB = new Date(b.month);
      return dateA.getTime() - dateB.getTime();
    });
  }, [monthlyStats]);

  return (
    <div className={className}>
      {chartData.length > 0 && (
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
              <Bar dataKey="Debit" fill={TRANSACTION_COLORS.debit.background} name="Debit" />
              <Bar dataKey="Credit" fill={TRANSACTION_COLORS.credit.background} name="Credit" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default GraphPermata;
