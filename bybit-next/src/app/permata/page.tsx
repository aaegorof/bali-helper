'use client';

import React from 'react';

import { useSession } from 'next-auth/react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TransactionsProvider } from './components/transactions-context';

import Transactions from './components/transactions';
import Graph from './components/graph';
import { useRouter } from 'next/navigation';
import TransactionUploader from './components/transaction-uploader';
import TotalAmounts from './components/total-amounts';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Permata() {
  const router = useRouter();

  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      router.push('/?callbackUrl=/permata');
    },
  });

  if (!session) {
    return null;
  }

  // if (status === "loading") {
  //   return (
  //     <div className="container mx-auto p-4 flex items-center justify-center min-h-screen">
  //       <p>Loading...</p>
  //     </div>
  //   );
  // }

  return (
    <main className="container mx-auto">
      <div className="flex justify-between items-center">
        <h1>Permata</h1>
        <Link href="/">
          <Button variant="outline">Back to Home</Button>
        </Link>
      </div>

      <TransactionsProvider>
        <div className="mb-8 grid grid-cols-1 gap-4 xl:grid-cols-[1fr_2fr_1fr]">
          <TransactionUploader />

          <Card>
            <CardHeader>
              <CardTitle>Transaction Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <Graph className="max-h-[400px]" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Total</CardTitle>
            </CardHeader>
            <CardContent>
              <TotalAmounts />
            </CardContent>
          </Card>
        </div>

        <h2 className="mb-2">Transactions</h2>
        <Transactions />
      </TransactionsProvider>
    </main>
  );
}
