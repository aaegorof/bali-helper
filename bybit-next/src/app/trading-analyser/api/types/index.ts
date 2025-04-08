export interface FundingRate {
  symbol: string;
  fundingRate: number;
  timestamp: number;
}

export interface Trade {
  symbol: string;
  side: string;
  price: number;
  qty: number;
  timestamp: number;
  orderId: string;
}

export interface CoinAnalisys {
  buyAvg: number;
  sellAvg: number;
  totalBuyVolume: number;
  totalSellVolume: number;
  totalBuy: number;
  totalSell: number;
  pnl: number;
  pnlPercentage: number;
  leftFromTrading: number;
}

export interface WalletBalance {
  coin: string;
  total: number;
  free: number;
  locked: number;
  current_price: number;
  usd_value: number;
}

export interface BybitResponse<T> {
  retCode: number;
  retMsg: string;
  result: T;
  retExtInfo?: Record<string, any>;
  time?: number;
}
