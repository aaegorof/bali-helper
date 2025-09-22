// Base types for Mantle API responses
export interface MantleApiResponse<T> {
  status: string;
  message: string;
  result: T;
}

// Transaction types
export interface MantleTransaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  timeStamp: string;
  gasUsed: string;
  gasPrice: string;
  contractAddress: string;
  functionName: string;
  blockNumber: string;
  nonce: string;
  input: string;
  transactionIndex: string;
  txreceipt_status: string;
  isError: string;
}

export interface FormattedTransaction {
  hash: string;
  from: string;
  to: string;
  amount: string;
  timestamp: string;
  gasUsed: string;
  gasPrice: string;
  contractAddress: string;
  functionName: string;
  status: 'success' | 'error';
  blockNumber: number;
  nonce: number;
  type?: 'sent' | 'received';
}

// Parameters for API calls
export interface TransactionListParams {
  fromAddress: string;
  toAddress?: string;
  dateFrom?: string;
  dateTo?: string;
  minAmount?: string;
  maxAmount?: string;
  transactionType?: 'all' | 'sent' | 'received';
  chainId?: number;
}

export interface SingleTransactionParams {
  txHash: string;
  chainId?: number;
}
