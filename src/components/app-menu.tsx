'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { ModeToggle } from './mode-toggle';
import { UserSwitcher } from './user-switcher';

const menuItems = [
  { href: '/', label: 'Home' },
  { href: '/funding-rates', label: 'Funding Rates' },
  { href: '/apy-calculation', label: 'APY Calculation' },
  { href: '/trading-analyser', label: 'Trading Analyser' },
  { href: '/permata', label: 'Permata' },
  { href: '/notion', label: 'Notion' },
  { href: '/hexagons', label: 'Hexagons' },
  { href: '/mantlescanner', label: 'Mantle Scanner' },
];

const AppMenu = () => {
  const { data: session, status } = useSession();

  return (
    <nav className="bg-accent text-accent-foreground mb-4 p-4">
      <div className="container mx-auto flex items-center justify-center gap-8">
        {menuItems.map((link) => (
          <Link key={link.href} href={link.href} className="hover:text-gray-300">
            {link.label}
          </Link>
        ))}
        <div className="ml-auto flex gap-2">
          <UserSwitcher session={session} status={status} />
          <ModeToggle />
        </div>
      </div>
    </nav>
  );
};

export default AppMenu;
