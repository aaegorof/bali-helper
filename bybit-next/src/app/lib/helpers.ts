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
        cleanDescription: description.replace(timeRegex, '').trim()
      };
    }
    return {
      time: null,
      cleanDescription: description
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