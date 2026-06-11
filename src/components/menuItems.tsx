import type { EnumAppRole } from '@/app/types/supabase-extended';

export type MenuItem = {
  title: string;
  description: string;
  href: string;
  authMatcher?: string;
  requiredRoles?: readonly EnumAppRole[];
};

export const menuItems = [
  {
    title: 'Backfilling',
    description: 'Backfill transaction embeddings',
    href: '/transactions/backfilling',
    requiredRoles: ['admin'] as const,
  },
  {
    title: 'Transactions',
    description: 'Manage and categorize your financial transactions',
    href: '/transactions',
    authMatcher: '/transactions/:path*',
    requiredRoles: ['editor', 'admin'] as const,
  },
  // { title: 'APY Calculation', description: 'Calculate and forecast investment returns based on APY', href: '/apy-calculation' },
  // { title: 'Trading Analyser', description: 'Analyze your trading history and performance', href: '/trading-analyser', authMatcher: "/trading-analyser/:path*" },
] satisfies MenuItem[];
