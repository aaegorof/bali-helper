const API_BASE_URL = 'http://localhost:5500';

// Типы для транзакций Permata
export interface TransactionDb {
  id?: number;
  posted_date?: string;
  description?: string;
  credit_debit?: string;
  amount: number;
  category?: string;
  time?: string;
  transaction_hash?: string;
  user_id?: number;
  created_at?: string;
}

export interface Transaction {
  [key: string]: string; // Allow any string key
  "Posted Date (mm/dd/yyyy)": string;
  Description: string;
  "Credit/Debit": string;
  Amount: string;
}

// Аутентификация
export async function loginUser(email: string): Promise<{ id: number; email: string }> {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });
  
  if (!response.ok) {
    throw new Error('Login failed');
  }
  
  return response.json();
}

// Permata API
export async function getUserTransactions(userId: number) {
  const response = await fetch(`${API_BASE_URL}/api/transactions?userId=${userId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch transactions');
  }
  return response.json();
}

export async function saveTransactions(transactions: TransactionDb[], userId: number) {
  const response = await fetch(`${API_BASE_URL}/api/transactions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ transactions, userId }),
  });

  if (!response.ok) {
    throw new Error('Failed to save transactions');
  }

  return response.json();
} 

export const removeTransactions = async (ids: number[]) => {
  const response = await fetch(`${API_BASE_URL}/api/transactions`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ids }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to remove transactions');
  }

  return response.json();
}   

export type RespSuggestCategory = {
  success: boolean;
  category: string;
  keywordCategory?: string;
  aiCategory?: string;
}

export async function suggestCategory(description: string): Promise<RespSuggestCategory> {
  const response = await fetch(`${API_BASE_URL}/api/transactions/suggest-category`, {
    method: 'POST',
    headers: {
     'Content-Type': 'application/json',
    },
    body: JSON.stringify({ description }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to suggest category');
  }

  return response.json();
}

export type RespUpdateCategories = {
  success: boolean;
  error?: string;
}

export async function updateCategories(ids: number[], category: string): Promise<RespUpdateCategories> {
  const response = await fetch(`${API_BASE_URL}/api/transactions/update-categories`, {
    method: 'POST',
    headers: {
     'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ids, category }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to update categories');
  }

  return response.json();
}

export async function createEmbeddingsForUser(userId: number): Promise<{ success: boolean }> {
  const response = await fetch(`${API_BASE_URL}/api/transactions/create-embeddings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to create embeddings');
  }

  return response.json();
}

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