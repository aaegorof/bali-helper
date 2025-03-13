'use client';
import { LoginForm } from '@/components/auth/login-form';
import { ModeToggle } from '@/components/mode-toggle';
import TestStyles from '@/components/test-styles';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function Home() {
  const { data: session } = useSession();
  if (!session) {
    return (
      <div className="flex justify-center items-center">
        <LoginForm />
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Bybit Tools</h1>
        <ModeToggle />
      </div>

      <TestStyles />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
        <ModuleCard
          title="Funding Rates"
          description="Monitor and analyze funding rates for Bybit perpetual contracts"
          href="/funding-rates"
        />

        <ModuleCard
          title="APY Calculation"
          description="Calculate and forecast investment returns based on APY"
          href="/apy-calculation"
        />

        <ModuleCard
          title="Trading Analyser"
          description="Analyze your trading history and performance"
          href="/trading-analyser"
        />

        <ModuleCard
          title="Permata"
          description="Manage and categorize your financial transactions"
          href="/permata"
        />
      </div>
    </main>
  );
}

function ModuleCard({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">{/* Content can be added here if needed */}</CardContent>
      <CardFooter>
        <Link href={href} className="w-full">
          <button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-2 rounded-md">
            Open
          </button>
        </Link>
      </CardFooter>
    </Card>
  );
}
