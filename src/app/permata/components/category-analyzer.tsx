'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { cn, formatNumberToKMil } from '@/lib/utils';
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip,
} from 'chart.js';
import React, { useEffect, useState } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import { transactionCategories } from '../categories';
import { useTransactionsContext } from './transactions-context';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

type ChartType = 'bar' | 'doughnut';

interface CategoryData {
  category: string;
  amount: number;
  count: number;
  percentage: number;
}

const getCategoryColor = (index: number) => {
  const cssVar = `--chart-${index + 1}`;
  const hslValue = getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim();
  return `hsl(${hslValue})`;
};

const CategorySpendingChart: React.FC = () => {
  const { filteredTransactions } = useTransactionsContext();
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [chartType, setChartType] = useState<ChartType>('doughnut');
  const [showTopCategories, setShowTopCategories] = useState(10);

  const maxCategories = transactionCategories.length;

  useEffect(() => {
    // Группируем транзакции по категориям (только дебетовые)
    const categoryMap = new Map<string, { amount: number; count: number }>();

    filteredTransactions
      .filter((transaction) => transaction.credit_debit === 'Debit')
      .forEach((transaction) => {
        const category = transaction.category || 'Uncategorized';
        const amount = Number(transaction.amount) || 0;

        if (categoryMap.has(category)) {
          const existing = categoryMap.get(category)!;
          categoryMap.set(category, {
            amount: existing.amount + amount,
            count: existing.count + 1,
          });
        } else {
          categoryMap.set(category, { amount, count: 1 });
        }
      });

    // Преобразуем в массив и сортируем по сумме
    const totalAmount = Array.from(categoryMap.values()).reduce(
      (sum, item) => sum + item.amount,
      0
    );

    const sortedCategories = Array.from(categoryMap.entries())
      .map(([category, data]) => ({
        category,
        amount: data.amount,
        count: data.count,
        percentage: totalAmount > 0 ? (data.amount / totalAmount) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
    console.log(sortedCategories);
    setCategoryData(sortedCategories);
  }, [filteredTransactions]);

  const topCategories = categoryData.slice(0, showTopCategories);
  const otherCategories = categoryData.slice(showTopCategories);

  // Объединяем остальные категории в "Other"
  const chartData = topCategories;
  if (otherCategories.length > 0) {
    const otherAmount = otherCategories.reduce((sum, cat) => sum + cat.amount, 0);
    const otherCount = otherCategories.reduce((sum, cat) => sum + cat.count, 0);
    const otherPercentage = otherCategories.reduce((sum, cat) => sum + cat.percentage, 0);

    chartData.push({
      category: `Other (${otherCategories.length} categories)`,
      amount: otherAmount,
      count: otherCount,
      percentage: otherPercentage,
    });
  }

  const chartConfig = {
    labels: chartData.map((item) => item.category),
    datasets: [
      {
        data: chartData.map((item) => item.amount),
        backgroundColor: chartData.map((_, index) => {
          return getCategoryColor(index);
        }),
        borderColor: chartData.map((_, index) => {
          return getCategoryColor(index);
        }),
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        align: 'center' as const,
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 20,
          font: {
            size: 12,
          },
        },
      },
      title: {
        display: true,
        text: `Spending by Category (Top ${showTopCategories})`,
        font: {
          size: 16,
          weight: 'bold' as const,
        },
      },
      tooltip: {
        callbacks: {
          label: function (context: { dataIndex: number }) {
            const item = chartData[context.dataIndex];
            const label = item.category;
            const amount = formatNumberToKMil(item.amount);
            const percentage = item.percentage.toFixed(1);
            const count = item.count;
            return [
              `${label}: ${amount}`,
              `${percentage}% of total spending`,
              `${count} transactions`,
            ];
          },
        },
      },
    },
  };

  const barOptions = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      title: {
        ...chartOptions.plugins.title,
        text: `Spending by Category (Top ${showTopCategories})`,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function (value: number | string) {
            return formatNumberToKMil(Number(value));
          },
        },
      },
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 0,
        },
      },
    },
  };

  const totalSpending = categoryData.reduce((sum, cat) => sum + cat.amount, 0);

  return (
    <div>
      {categoryData.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">No spending data available</div>
      ) : (
        <>
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                Total Spending:{' '}
                <span className="font-semibold text-foreground">
                  {formatNumberToKMil(totalSpending)}
                </span>
              </span>
              <div className="flex items-center gap-2">
                <div className="flex gap-2">
                  <Button
                    variant={chartType === 'doughnut' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setChartType('doughnut')}
                  >
                    Pie
                  </Button>
                  <Button
                    variant={chartType === 'bar' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setChartType('bar')}
                  >
                    Bar
                  </Button>
                </div>
                <span className="text-sm text-muted-foreground">Show top:</span>
                <select
                  value={showTopCategories}
                  onChange={(e) => setShowTopCategories(Number(e.target.value))}
                  className="text-sm border rounded px-2 py-1"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={15}>15</option>
                  <option value={maxCategories}>All</option>
                </select>
              </div>
            </div>
          </div>

          <div className="h-80">
            {chartType === 'doughnut' ? (
              <Doughnut data={chartConfig} options={chartOptions} />
            ) : (
              <Bar data={chartConfig} options={barOptions} />
            )}
          </div>

          {/* Детальная таблица */}
          <div className="mt-6">
            <Accordion type="single" collapsible>
              <AccordionItem value="item-1">
                <AccordionTrigger>Category Details</AccordionTrigger>
                <AccordionContent>
                  {/* <h4 className="text-sm font-semibold mb-3">Category Details</h4> */}
                  <div className="max-h-60 overflow-y-auto">
                    {categoryData.map((item, index) => {
                      const bgColor = getCategoryColor(index);
                      return (
                        <div
                          key={item.category}
                          className="flex items-center justify-between p-1 rounded"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={cn('w-3 h-3 rounded-full')}
                              style={{ backgroundColor: bgColor }}
                            />
                            <span className="text-sm font-medium">{item.category}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold">
                              {formatNumberToKMil(item.amount)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {item.percentage.toFixed(1)}% • {item.count} txns
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </>
      )}
    </div>
  );
};

export default CategorySpendingChart;
