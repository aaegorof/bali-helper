'use client';

import Link from 'next/link';
import { menuItems } from './menuItems';
import { ModeToggle } from './mode-toggle';
import { UserSwitcher } from './user-switcher';

const AppMenu = () => {
  return (
    <nav className="bg-accent text-accent-foreground mb-4 p-4">
      <div className="container mx-auto flex items-center justify-center gap-8">
        {menuItems.map((item) => (
          <Link key={item.href} href={item.href} className="hover:text-gray-300">
            {item.title}
          </Link>
        ))}
        <div className="ml-auto flex gap-2">
          <UserSwitcher />
          <ModeToggle />
        </div>
      </div>
    </nav>
  );
};

export default AppMenu;
