'use client';

import { useSession } from 'next-auth/react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TransactionsProvider } from './components/transactions-context';

import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import CategorySpendingChart from './components/category-analyzer';
import Graph from './components/graph';
import TotalAmounts from './components/total-amounts';
import TransactionUploader from './components/transaction-uploader';
import Transactions from './components/transactions';

const ANALYSIS_TABS = [
  {
    id: 'monthly',
    label: 'Monthly Analysis',
    component: Graph,
  },
  {
    id: 'categories',
    label: 'Category Analysis',
    component: CategorySpendingChart,
  },
] as const;

export default function Permata() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(ANALYSIS_TABS[0].id);
  const { data: session } = useSession({
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
        <div className="mb-8 grid grid-cols-1 gap-4 xl:grid-cols-[1fr_2fr]">
          <div className="flex flex-col gap-4">
            <TransactionUploader />
            <Card>
              <CardHeader>
                <CardTitle>Total</CardTitle>
              </CardHeader>
              <CardContent>
                <TotalAmounts />
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader className="flex-row justify-between items-center">
              <CardTitle>Transaction Analysis</CardTitle>
              <Tabs
                defaultValue={activeTab}
                onValueChange={(v) => {
                  setActiveTab(v as (typeof ANALYSIS_TABS)[0]['id']);
                }}
              >
                <TabsList className="grid w-full grid-cols-2">
                  {ANALYSIS_TABS.map((tab) => (
                    <TabsTrigger key={tab.id} value={tab.id}>
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent>
              <div>
                <Tabs value={activeTab}>
                  {ANALYSIS_TABS.map((tab) => {
                    const Component = tab.component;
                    return (
                      <TabsContent key={tab.id} value={tab.id}>
                        <Component />
                      </TabsContent>
                    );
                  })}
                </Tabs>
              </div>
            </CardContent>
          </Card>
        </div>

        <h2 className="mb-2">Transactions</h2>
        <Transactions />
      </TransactionsProvider>
    </main>
  );
}
