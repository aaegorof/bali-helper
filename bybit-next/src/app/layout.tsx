import { ModeToggle } from '@/components/mode-toggle';
import { Providers } from '@/components/providers';
import { UserSwitcher } from '@/components/user-switcher';
import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { Inter } from 'next/font/google';
import localFont from 'next/font/local';
import Link from 'next/link';
import { Toaster } from 'sonner';
import './globals.css';
import { ensureDatabaseInitialized } from './lib/init';

const satoshi = localFont({
  variable: '--font-satoshi',
  src: [
    { path: './satoshi/Satoshi-Variable.woff2', weight: '300', style: 'normal' },
    { path: './satoshi/Satoshi-VariableItalic.woff2', weight: '300', style: 'italic' },
    { path: './satoshi/Satoshi-Light.woff2', weight: '300', style: 'normal' },
    { path: './satoshi/Satoshi-LightItalic.woff2', weight: '300', style: 'italic' },
    { path: './satoshi/Satoshi-Regular.woff2', weight: '400', style: 'normal' },
    { path: './satoshi/Satoshi-Italic.woff2', weight: '400', style: 'italic' },
    { path: './satoshi/Satoshi-Medium.woff2', weight: '500', style: 'normal' },
    { path: './satoshi/Satoshi-MediumItalic.woff2', weight: '500', style: 'italic' },
    { path: './satoshi/Satoshi-Bold.woff2', weight: '700', style: 'bold' },
    { path: './satoshi/Satoshi-BoldItalic.woff2', weight: '700', style: 'italic' },
    { path: './satoshi/Satoshi-Black.woff2', weight: '900', style: 'black' },
  ],
});

const inter = Inter({ subsets: ['latin'] });

// Инициализируем базу данных при старте приложения
ensureDatabaseInitialized().catch(console.error);

export const metadata: Metadata = {
  title: 'Sandbox for financial analytic projects',
  description: 'Collection of independent tools for financial analytic projects',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${satoshi.variable} ${inter.className}`}>
        <Providers session={session}>
          <nav className="bg-accent text-accent-foreground mb-4 p-4">
            <div className="container mx-auto flex items-center justify-center gap-8">
              <Link href="/" className="hover:text-gray-300">
                Funding Rates
              </Link>
              <Link href="/apy-calculation" className="hover:text-gray-300">
                APY Calculation
              </Link>
              <Link href="/trading-analyser" className="hover:text-gray-300">
                Trading Analyser
              </Link>
              <Link href="/permata" className="hover:text-gray-300">
                Permata
              </Link>
              <div className="ml-auto flex gap-2">
                <UserSwitcher session={session} />
                <ModeToggle />
              </div>
            </div>
          </nav>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
