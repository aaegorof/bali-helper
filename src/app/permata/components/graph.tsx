import { TRANSACTION_COLORS } from '@/app/lib/constants';
import { formatNumberToKMil } from '@/app/lib/utils';
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip,
} from 'chart.js';
import { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { useTransactionsContext } from './transactions-context';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

type Props = {
  className?: string;
};
type ChartData = {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string;
  }[];
};

const GraphPermata = ({ className }: Props) => {
  const [monthlyData, setMonthlyData] = useState<ChartData | null>(null);
  const { filteredTransactions: data } = useTransactionsContext();
  useEffect(() => {
    // Prepare Data for Chart
    const monthly: Record<string, { debit: number; credit: number }> = {};

    data.forEach((transaction) => {
      const date = new Date(transaction.posted_date!);
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM

      if (!monthly[monthYear]) {
        monthly[monthYear] = { debit: 0, credit: 0 };
      }

      const amount = transaction.amount;
      if (transaction.credit_debit === 'Debit') {
        monthly[monthYear].debit += amount;
      } else {
        monthly[monthYear].credit += amount;
      }
    });

    const labels = Object.keys(monthly).sort();
    const debitData = labels.map((month) => monthly[month].debit);
    const creditData = labels.map((month) => monthly[month].credit);

    setMonthlyData({
      labels,
      datasets: [
        {
          label: 'Debit',
          data: debitData,
          backgroundColor: TRANSACTION_COLORS.debit.background,
        },
        {
          label: 'Credit',
          data: creditData,
          backgroundColor: TRANSACTION_COLORS.credit.background,
        },
      ],
    });
  }, [data]);

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      title: {
        display: true,
        text: 'Monthly Debit and Credit',
      },
      tooltip: {
        callbacks: {
          label: function (context: { dataset: { label?: string }; parsed: { y: number | null } }) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += formatNumberToKMil(context.parsed.y);
            }
            return label;
          },
        },
      },
    },
  };
  return (
    <div className={className}>
      {monthlyData && (
        <div>
          <Bar options={chartOptions} data={monthlyData} />
        </div>
      )}
    </div>
  );
};

export default GraphPermata;
