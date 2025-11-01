'use client';

import { Button } from '@/components/ui/button';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function ModeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Предотвращаем ошибки гидрации, показывая компонент только после монтирования
  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  // Показываем заглушку до монтирования компонента
  if (!mounted) {
    return (
      <Button size="icon" variant="outline" className="relative" disabled>
        <div className="relative h-[1.2rem] w-[1.2rem]">
          <Sun className="absolute inset-0 h-full w-full" />
        </div>
        <span className="sr-only">Toggle theme</span>
      </Button>
    );
  }

  return (
    <Button size="icon" variant="outline" onClick={toggleTheme} className="relative">
      <div className="relative h-[1.2rem] w-[1.2rem]">
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
