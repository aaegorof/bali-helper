export async function loginUser(email: string) {
  const response = await fetch('/api/auth/login', {
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
  const response = await fetch(`/api/transactions?userId=${userId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch transactions');
  }
  return response.json();
}

export async function saveTransactions(transactions: any[], userId: number) {
  const response = await fetch('/api/transactions', {
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