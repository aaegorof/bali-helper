import type { EnumAppRole } from '@/app/types/supabase-extended';

export type MenuItem = {
  title: string;
  description: string;
  href: string;
  authMatcher?: string;
  requiredRoles?: readonly EnumAppRole[];
};

export const menuItems = [
  { title: 'Home', description: 'Home', href: '/' },
  {
    title: 'Backfilling',
    description: 'Backfill transaction embeddings',
    href: '/permata/backfilling',
    requiredRoles: ['admin'],
  },
  {
    title: 'Permata',
    description: 'Manage and categorize your financial transactions',
    href: '/permata',
    authMatcher: '/permata/:path*',
  },
  // { title: 'APY Calculation', description: 'Calculate and forecast investment returns based on APY', href: '/apy-calculation' },
  // { title: 'Trading Analyser', description: 'Analyze your trading history and performance', href: '/trading-analyser', authMatcher: "/trading-analyser/:path*" },
] satisfies MenuItem[];
