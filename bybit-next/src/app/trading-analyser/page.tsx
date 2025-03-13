"use client"

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import WalletBalance from './components/wallet-balance';
import TradeHistory from './components/trade-history';
import UpdateDataForm from './components/update-data-form';

export default function TradingAnalyser() {
  return (
    <main className="container mx-auto">
      <div className="flex justify-between items-center">
        <h1>Trading Analyser</h1>
        <Link href="/">
          <Button variant="outline">Back to Home</Button>
        </Link>
      </div>
      
      <WalletBalance />
      
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-[1fr_2fr] mt-6">
        <UpdateDataForm />
        <TradeHistory />
      </div>
    </main>
  );
} 