// В Next.js переменные окружения с префиксом NEXT_PUBLIC_ доступны на клиенте
// Для API URL лучше использовать относительные пути или window.location.origin в клиентском коде
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

// Base API Response type
export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  details?: string;
};

// Funding Rates API
export interface FundingRate {
  symbol: string;
  fundingRate: number;
  timestamp: number;
}

// Trading Analyser API
export interface Trade {
  symbol: string;
  side: string;
  price: number;
  qty: number;
  timestamp: number;
  orderId: string;
}

export interface AveragePrice {
  buyAvg: number;
  sellAvg: number;
  totalBuyVolume: number;
  totalSellVolume: number;
}

export interface WalletBalance {
  coin: string;
  total: number;
  free: number;
  locked: number;
  current_price: number;
  usd_value: number;
}
