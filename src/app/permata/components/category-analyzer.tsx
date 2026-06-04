'use client';

import { CurrencyCode, getCurrencySymbol } from '@/app/lib/currencies';
import { cn, formatNumberToKMil } from '@/app/lib/utils';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import React, { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { transactionCategories } from '../categories';
import { useTransactionsContext } from './transactions-context';

type ChartType = 'bar' | 'doughnut';

interface CategoryData {
  category: string;
  currency: CurrencyCode | null;
  sum: number;
  count: number;
  percentage: number;
}

const getCategoryColor = (index: number) => {
  const cssVar = `--chart-${index + 1}`;
  const hslValue = getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim();
  return `hsl(${hslValue})`;
};

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: CategoryData;
  }>;
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-background border rounded p-2 shadow-lg">
        <p className="font-medium">{data.category}</p>
        <p>
          {formatNumberToKMil(data.sum)} {data.currency ? getCurrencySymbol(data.currency) : ''}
        </p>
        <p>{data.percentage.toFixed(1)}% of total spending</p>
        <p>{data.count} transactions</p>
      </div>
    );
  }
  return null;
};

const CategorySpendingChart: React.FC = () => {
  const { categoryStats, filters } = useTransactionsContext();
  const [chartType, setChartType] = useState<ChartType>('doughnut');
  const [showTopCategories, setShowTopCategories] = useState(10);

  const maxCategories = transactionCategories.length;

  // Get selected currency from filters
  const selectedCurrency = useMemo(() => {
    const currencyFilter = filters.find((f) => f.id === 'currency');
    return currencyFilter?.value as CurrencyCode | undefined;
  }, [filters]);

  // Group by currency and category
  const groupedStats = useMemo(() => {
    if (selectedCurrency) {
      // Filter by selected currency
      return categoryStats.filter((stat) => stat.currency === selectedCurrency);
    }

    // Group by category, combining different currencies
    const grouped = categoryStats.reduce(
      (acc, stat) => {
        const key = stat.category || 'Uncategorized';
        const existing = acc.find(
          (item) => item.category === key && item.currency === stat.currency
        );

        if (existing) {
          existing.sum += stat.sum;
          existing.count += stat.count;
        } else {
          acc.push({ ...stat, category: key });
        }

        return acc;
      },
      [] as typeof categoryStats
    );

    return grouped.sort((a, b) => b.sum - a.sum);
  }, [categoryStats, selectedCurrency]);

  // Calculate totals per currency
  const totalsPerCurrency = useMemo(() => {
    return groupedStats.reduce(
      (acc, stat) => {
        const curr = stat.currency || 'USD';
        if (!acc[curr]) acc[curr] = 0;
        acc[curr] += stat.sum;
        return acc;
      },
      {} as Record<CurrencyCode, number>
    );
  }, [groupedStats]);

  const topCategories = groupedStats.slice(0, showTopCategories);
  const otherCategories = groupedStats.slice(showTopCategories);

  const preparedData = useMemo((): CategoryData[] => {
    const arr: CategoryData[] = topCategories.map((cat) => {
      const totalForCurrency = totalsPerCurrency[cat.currency] || 1;
      return {
        category: cat.category || 'Uncategorized',
        currency: cat.currency,
        sum: cat.sum,
        count: cat.count,
        percentage: totalForCurrency > 0 ? (cat.sum / totalForCurrency) * 100 : 0,
      };
    });

    if (otherCategories.length > 0) {
      // Group "Other" by currency
      const otherByCurrency = otherCategories.reduce(
        (acc, cat) => {
          const curr = cat.currency;
          if (!acc[curr]) {
            acc[curr] = { sum: 0, count: 0, currency: curr };
          }
          acc[curr].sum += cat.sum;
          acc[curr].count += cat.count;
          return acc;
        },
        {} as Record<string, { sum: number; count: number; currency: CurrencyCode }>
      );

      Object.values(otherByCurrency).forEach((other) => {
        const totalForCurrency = totalsPerCurrency[other.currency] || 1;
        arr.push({
          category: `Other (${otherCategories.filter((c) => c.currency === other.currency).length} categories)`,
          currency: other.currency,
          sum: other.sum,
          count: other.count,
          percentage: totalForCurrency > 0 ? (other.sum / totalForCurrency) * 100 : 0,
        });
      });
    }
    return arr;
  }, [topCategories, otherCategories, totalsPerCurrency]);

  return (
    <div>
      {preparedData.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">No spending data available</div>
      ) : (
        <>
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-muted-foreground">
                <span>Total Spending:</span>
                {Object.entries(totalsPerCurrency).map(([currency, amount]) => (
                  <div key={currency} className="font-semibold text-foreground">
                    {formatNumberToKMil(amount)} {getCurrencySymbol(currency as CurrencyCode)}
                  </div>
                ))}
                {!selectedCurrency && Object.keys(totalsPerCurrency).length > 1 && (
                  <div className="text-xs mt-1">Select currency filter for combined view</div>
                )}
              </div>
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
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'doughnut' ? (
                <PieChart>
                  <Pie
                    data={preparedData}
                    dataKey="sum"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    innerRadius="60%"
                    outerRadius="80%"
                    paddingAngle={2}
                  >
                    {preparedData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={getCategoryColor(index)} />
                    ))}
                  </Pie>
                  <Tooltip
                    cursor={{ fill: 'hsl(var(--muted-foreground) / 0.1)' }}
                    content={<CustomTooltip />}
                  />
                  <Legend
                    layout="vertical"
                    align="right"
                    iconSize={12}
                    verticalAlign="middle"
                    formatter={(value: string) => <span className="text-xs">{value}</span>}
                  />
                </PieChart>
              ) : (
                <BarChart data={preparedData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="category"
                    angle={45}
                    textAnchor="start"
                    height={100}
                    interval={0}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    tickFormatter={(value) => formatNumberToKMil(value)}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    cursor={{ fill: 'hsl(var(--muted-foreground) / 0.1)' }}
                    content={<CustomTooltip />}
                  />
                  <Bar dataKey="sum">
                    {preparedData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={getCategoryColor(index)} />
                    ))}
                  </Bar>
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* Детальная таблица */}
          <div className="mt-6">
            <Accordion type="single" collapsible>
              <AccordionItem value="item-1">
                <AccordionTrigger>Category Details</AccordionTrigger>
                <AccordionContent>
                  <div className="max-h-60 overflow-y-auto">
                    {preparedData.map((item, index) => {
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
                              {formatNumberToKMil(item.sum)}{' '}
                              {item.currency ? getCurrencySymbol(item.currency) : ''}
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
