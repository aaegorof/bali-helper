"use client"

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Input, InputLabel } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { calculateAPR } from './helpers';

const DEFAULT_VALUES = {
  initial: 3000,
  apy: 12,
  months: 18,
  monthly: 2000
};

export default function APYCalculation() {
  const [initial, setInitial] = useState(DEFAULT_VALUES.initial);
  const [monthly, setMonthly] = useState(DEFAULT_VALUES.monthly);
  const [apy, setApy] = useState(DEFAULT_VALUES.apy); 
  const [months, setMonths] = useState(DEFAULT_VALUES.months);

  const result = useMemo(
    () => calculateAPR(initial, monthly, apy, months),
    [initial, monthly, apy, months]
  );

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">APY Calculation</h1>
        <Link href="/">
          <Button variant="outline">Back to Home</Button>
        </Link>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>
            Forecasting Invest Plan APY calculation
          </CardTitle>
        </CardHeader>

        <CardContent className='grid gap-8 items-start grid-cols-1 md:grid-cols-[300px_1fr]'>
          <div className="grid gap-4 p-4 bg-muted rounded-lg">
            <InputLabel label='Initial Investment, $'>
              <Input
                onChange={(v) => setInitial(Number(v.target.value))}
                value={initial}
                type='number'
                step={100}
              />
            </InputLabel>
            <InputLabel label='Predicted APR, %'>
              <Input
                onChange={(v) => setApy(Number(v.target.value))}
                value={apy}
                type='number'
              />
            </InputLabel>
            <InputLabel label='Monthly Deposit, $'>
              <Input
                onChange={(v) => setMonthly(Number(v.target.value))}
                value={monthly}
                type='number'
                step={100}
              />
            </InputLabel>
            <InputLabel label='Number of Months'>
              <Input
                onChange={(v) => setMonths(Number(v.target.value))}
                value={months}
                type='number'
              />
            </InputLabel>
          </div>
        
          <Table>
            <TableHeader className='text-right'>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead>With Investment</TableHead>
                <TableHead>No Investment</TableHead>
                <TableHead>Monthly Income</TableHead>
                <TableHead>The difference</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className='text-right'>
              {result.map((val, ind) => (
                <TableRow key={val.balancesWithInvestment + ind}>
                  <TableCell>{ind + 1}</TableCell>
                  <TableCell>{val.balancesWithInvestment}</TableCell>
                  <TableCell>{val.balancesWithoutInvestment}</TableCell>
                  <TableCell>{val.monthIncome}</TableCell>
                  <TableCell>{val.diff}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
} 