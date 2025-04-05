import React from 'react';
interface TransactionParseResult {
  time: string | null;
  cleanDescription: string;
}

export interface Transaction {
  id?: number;
  posted_date?: string;
  description?: string;
  credit_debit?: string;
  amount?: number;
  category?: string;
  time?: string | null;
  transaction_hash?: string;
  user_id?: number;
  created_at?: string;
  cleanDescription?: string;
}

export const parseTimeFromDescription = (description: string): TransactionParseResult => {
  if (!description) return { time: null, cleanDescription: '' };

  const timeRegex = /(\d{2}:\d{2}:\d{2})/;
  const match = description.match(timeRegex);
  if (match) {
    return {
      time: match[1],
      cleanDescription: description.replace(timeRegex, '').trim(),
    };
  }
  return {
    time: null,
    cleanDescription: description,
  };
};

// Вспомогательная функция для создания хеша транзакции
export const createTransactionHash = (transaction: Transaction): string => {
  if (!transaction.posted_date || !transaction.description || transaction.amount === undefined) {
    console.error('Invalid transaction data:', transaction);
    return '';
  }
  // Create a unique hash based on transaction properties
  return Buffer.from(
    `${transaction.posted_date}_${transaction.description}_${transaction.amount}`
  ).toString('base64');
};

/**
 * Formats numbers with leading zeros by showing zero count as superscript
 * Example: 0.00123 will be displayed as 0.0<sup>2</sup>123
 */
export const formatNumberWithLeadingZeros = (
  value: number | string | null | undefined
): React.ReactNode => {
  if (value === null || value === undefined) return 'N/A';

  const priceStr = value.toString();
  const match = priceStr.match(/^0\.0+/);

  if (match) {
    const zeroCount = match[0].length - 2; // -2 for "0."
    return (
      <span>
        0.0<sup>{zeroCount}</sup>
        {priceStr.substring(match[0].length)}
      </span>
    );
  }

  // If it's a number, format with 2 decimal places
  if (typeof value === 'number') {
    return value.toFixed(2);
  }
  // If it's a string that can be parsed as a number, format with 2 decimal places
  if (typeof value === 'string' && !isNaN(parseFloat(value))) {
    return parseFloat(value).toFixed(2);
  }
  // Otherwise return as is
  return priceStr;
};
