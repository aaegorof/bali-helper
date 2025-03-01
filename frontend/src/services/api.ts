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