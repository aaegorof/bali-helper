import { Database } from '../types/supabase';

export type CurrencyCode = Database['public']['Enums']['currency_code'];

/**
 * ISO 4217 Currency codes with their display names
 */
export const CURRENCIES = {
  RUB: {
    code: 'RUB' as CurrencyCode,
    name: 'Russian Ruble',
    symbol: '₽',
    locale: 'ru-RU',
  },
  USD: {
    code: 'USD' as CurrencyCode,
    name: 'US Dollar',
    symbol: '$',
    locale: 'en-US',
  },
  AUD: {
    code: 'AUD' as CurrencyCode,
    name: 'Australian Dollar',
    symbol: 'A$',
    locale: 'en-AU',
  },
  GBP: {
    code: 'GBP' as CurrencyCode,
    name: 'British Pound',
    symbol: '£',
    locale: 'en-GB',
  },
  IDR: {
    code: 'IDR' as CurrencyCode,
    name: 'Indonesian Rupiah',
    symbol: 'Rp',
    locale: 'id-ID',
  },
  EUR: {
    code: 'EUR' as CurrencyCode,
    name: 'Euro',
    symbol: '€',
    locale: 'de-DE',
  },
  VND: {
    code: 'VND' as CurrencyCode,
    name: 'Vietnamese Dong',
    symbol: '₫',
    locale: 'vi-VN',
  },
  MYR: {
    code: 'MYR' as CurrencyCode,
    name: 'Malaysian Ringgit',
    symbol: 'RM',
    locale: 'ms-MY',
  },
  CNY: {
    code: 'CNY' as CurrencyCode,
    name: 'Chinese Yuan',
    symbol: '¥',
    locale: 'zh-CN',
  },
  THB: {
    code: 'THB' as CurrencyCode,
    name: 'Thai Baht',
    symbol: '฿',
    locale: 'th-TH',
  },
  AED: {
    code: 'AED' as CurrencyCode,
    name: 'UAE Dirham',
    symbol: 'د.إ',
    locale: 'ar-AE',
  },
} as const;

/**
 * Array of all currency codes for use in select/dropdown components
 */
export const CURRENCY_OPTIONS = Object.values(CURRENCIES);

/**
 * Format amount with currency symbol
 */
export function formatCurrency(amount: number, currency: CurrencyCode = 'RUB'): string {
  const currencyInfo = CURRENCIES[currency];
  return new Intl.NumberFormat(currencyInfo.locale, {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

/**
 * Get currency display name
 */
export function getCurrencyName(currency: CurrencyCode): string {
  return CURRENCIES[currency].name;
}

/**
 * Get currency symbol
 */
export function getCurrencySymbol(currency: CurrencyCode): string {
  return CURRENCIES[currency].symbol;
}
