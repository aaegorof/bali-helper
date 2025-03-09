"use client"

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import WalletBalance from './components/wallet-balance';
import TradeHistory from './components/trade-history';
import UpdateDataForm from './components/update-data-form';

export default function TradingAnalyser() {
  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Trading Analyser</h1>
        <Link href="/">
          <Button variant="outline">Back to Home</Button>
        </Link>
      </div>
      
      <WalletBalance />
      
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-[1fr_2fr] mt-6">
        <UpdateDataForm />
        <TradeHistory />
      </div>
    </div>
  );
} 