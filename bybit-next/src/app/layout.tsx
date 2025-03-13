import { Providers } from '@/components/providers';
import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { Inter } from 'next/font/google';
import localFont from 'next/font/local';
import { Toaster } from 'sonner';
import './globals.css';
import { ensureDatabaseInitialized } from './lib/init';
import AppMenu from '@/components/app-menu';

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
          <AppMenu />
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
