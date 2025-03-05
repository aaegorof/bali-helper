import { TransactionDb } from "@/pages/permata";

const API_BASE_URL = 'http://localhost:5500';

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
    body: JSON.stringify({ ids }),
  })
  
  if (!response.ok) {
    throw new Error('Failed to remove transactions');
  }

  return response.json();
}   

export type RespSuggestCategory = {
  success: Boolean
            category: string,
            keywordCategory?: string,
            aiCategory?: string
}

export async function suggestCategory({description}: TransactionDb): Promise<RespSuggestCategory> {
  const response = await fetch(`${API_BASE_URL}/api/transactions/suggest-category`, {
    method: 'POST',
    headers: {
     'Content-Type': 'application/json',
    },
    body: JSON.stringify({ description }),
  })
  if (!response.ok) {
    throw new Error('Failed to suggest category');
  }

  return response.json();
}

export type RespUpdateCategories = {
  success: boolean,
  error?: string
}

export async function updateCategories(ids: number[], category: string): Promise<RespUpdateCategories> {
  const response = await fetch(`${API_BASE_URL}/api/transactions/update-categories`, {
    method: 'POST',
    headers: {
     'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ids, category }),
  })
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