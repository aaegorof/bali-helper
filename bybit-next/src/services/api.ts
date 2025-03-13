// В Next.js переменные окружения с префиксом NEXT_PUBLIC_ доступны на клиенте
// Для API URL лучше использовать относительные пути или window.location.origin в клиентском коде
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

// Funding Rates API
export interface FundingRate {
  symbol: string;
  fundingRate: number;
  timestamp: number;
}

export async function getFundingRates(symbols: string[]): Promise<FundingRate[]> {
  const response = await fetch(`${API_BASE_URL}/funding-rates?symbols=${symbols.join(',')}`);
  if (!response.ok) {
    throw new Error('Failed to fetch funding rates');
  }
  return response.json();
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

export interface WalletBalance {
  coin: string;
  total: number;
  free: number;
  locked: number;
  current_price: number;
  usd_value: number;
}

export async function getUserTrades(symbol: string, limit: number = 50): Promise<Trade[]> {
  const response = await fetch(`${API_BASE_URL}/trades?symbol=${symbol}&limit=${limit}`);
  if (!response.ok) {
    throw new Error('Failed to fetch trades');
  }
  return response.json();
}

export async function getWalletBalance(): Promise<WalletBalance[]> {
  const response = await fetch(`${API_BASE_URL}/wallet-balance`);
  if (!response.ok) {
    throw new Error('Failed to fetch wallet balance');
  }
  return response.json();
} 