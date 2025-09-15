'use client';

import { Button } from '@/components/ui/button';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

export function ModeToggle() {
  const { setTheme, resolvedTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <Button
      size="icon"
      variant="outline"
      onClick={toggleTheme}
      className="relative"
      suppressHydrationWarning
    >
      <div className="relative h-[1.2rem] w-[1.2rem]" suppressHydrationWarning>
        <Sun
          className={`absolute inset-0 h-full w-full transition-all duration-300 ease-in-out
            ${resolvedTheme === 'dark' ? 'rotate-[-180deg] scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'}`}
        />
        <Moon
          className={`absolute inset-0 h-full w-full transition-all duration-300 ease-in-out
            ${resolvedTheme === 'dark' ? 'rotate-0 scale-100 opacity-100' : 'rotate-180 scale-0 opacity-0'}`}
        />
      </div>
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
