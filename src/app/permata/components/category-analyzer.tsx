'use client';

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
        <p>{formatNumberToKMil(data.sum)}</p>
        <p>{data.percentage.toFixed(1)}% of total spending</p>
        <p>{data.count} transactions</p>
      </div>
    );
  }
  return null;
};

const CategorySpendingChart: React.FC = () => {
  const { categoryStats } = useTransactionsContext();
  const [chartType, setChartType] = useState<ChartType>('doughnut');
  const [showTopCategories, setShowTopCategories] = useState(10);

  const maxCategories = transactionCategories.length;

  const totalAmount = categoryStats.reduce((sum, cat) => sum + cat.sum, 0);
  const topCategories = categoryStats.slice(0, showTopCategories);
  const otherCategories = categoryStats.slice(showTopCategories);
  const otherAmount = otherCategories.reduce((sum, cat) => sum + cat.sum, 0);

  const preparedData = useMemo(() => {
    const arr = topCategories.map((cat) => ({
      category: cat.category,
      sum: cat.sum,
      count: cat.count,
      percentage: totalAmount > 0 ? (cat.sum / totalAmount) * 100 : 0,
    }));
    if (otherCategories.length > 0) {
      arr.push({
        category: `Other (${otherCategories.length} categories)`,
        sum: otherAmount,
        count: otherCategories.reduce((sum, cat) => sum + cat.count, 0),
        percentage: totalAmount > 0 ? (otherAmount / totalAmount) * 100 : 0,
      });
    }
    return arr;
  }, [topCategories, otherCategories, totalAmount, otherAmount]);


  return (
    <div>
      {preparedData.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">No spending data available</div>
      ) : (
        <>
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                Total Spending:{' '}
                <span className="font-semibold text-foreground">
                  {formatNumberToKMil(totalAmount)}
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
                  <Tooltip cursor={{ fill: 'hsl(var(--muted-foreground) / 0.1)' }} content={<CustomTooltip />} />
                  <Legend
                    layout="vertical"
                    align="right"
                    verticalAlign="middle"
                    formatter={(value: string) => <span className="text-sm">{value}</span>}
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
                  <Tooltip cursor={{ fill: 'hsl(var(--muted-foreground) / 0.1)' }} content={<CustomTooltip />} />
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
                              {formatNumberToKMil(item.sum)}
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
