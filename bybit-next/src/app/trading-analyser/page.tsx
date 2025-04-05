import { TradingProvider } from '@/app/trading-analyser/context/TradingContext';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Suspense } from 'react';
import TradeHistory from './components/trade-history';
import UpdateDataForm from './components/update-data-form';
import WalletBalance from './components/wallet-balance';

export default function TradingAnalyser() {
  return (
    <TradingProvider>
      <main className="container mx-auto">
        <div className="flex justify-between items-center">
          <h1>Trading Analyser</h1>
          <Link href="/">
            <Button variant="outline">Back to Home</Button>
          </Link>
        </div>

        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 mt-6">
          <Suspense fallback={<div>Loading wallet balance...</div>}>
            <WalletBalance />
          </Suspense>
          {/* <TradingSummary /> */}
        </div>
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-[1fr_2fr] mt-6">
          <UpdateDataForm />
          <Suspense fallback={<div>Loading trade history...</div>}>
            <TradeHistory />
          </Suspense>
        </div>
      </main>
    </TradingProvider>
  );
}
