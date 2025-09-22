import {
  FormattedTransaction,
  MantleApiResponse,
  MantleTransaction,
  SingleTransactionParams,
  TransactionListParams,
} from './types';

export class MantleClient {
  private readonly apiKey: string;
  private readonly apiUrl: string;
  private readonly defaultChainId: number;

  constructor(config: { apiKey: string; apiUrl: string; defaultChainId?: number }) {
    this.apiKey = config.apiKey;
    this.apiUrl = config.apiUrl;
    this.defaultChainId = config.defaultChainId || 5000; // Default to Mantle mainnet
  }

  private formatTransaction(tx: MantleTransaction, userAddress?: string): FormattedTransaction {
    const formattedTx: FormattedTransaction = {
      hash: tx.hash,
      from: tx.from,
      to: tx.to,
      amount: tx.value,
      timestamp: tx.timeStamp,
      gasUsed: tx.gasUsed,
      gasPrice: tx.gasPrice,
      contractAddress: tx.contractAddress,
      functionName: tx.functionName,
      status: tx.isError === '0' ? 'success' : 'error',
      blockNumber: parseInt(tx.blockNumber),
      nonce: parseInt(tx.nonce),
    };

    // Определяем тип транзакции относительно пользователя
    if (userAddress) {
      if (tx.from.toLowerCase() === userAddress.toLowerCase()) {
        formattedTx.type = 'sent';
      } else if (tx.to.toLowerCase() === userAddress.toLowerCase()) {
        formattedTx.type = 'received';
      }
    }

    return formattedTx;
  }

  private async makeRequest<T>(params: URLSearchParams): Promise<MantleApiResponse<T>> {
    const url = `${this.apiUrl}?${params.toString()}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Mantle API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data as MantleApiResponse<T>;
  }

  async getTransactions(params: TransactionListParams): Promise<FormattedTransaction[]> {
    const queryParams = new URLSearchParams({
      module: 'account',
      action: 'txlist',
      address: params.fromAddress.toLowerCase(),
      startblock: '0',
      endblock: '99999999',
      page: '1',
      offset: '100',
      sort: 'desc',
      apikey: this.apiKey,
      chainid: (params.chainId || this.defaultChainId).toString(),
    });

    const response = await this.makeRequest<MantleTransaction[]>(queryParams);
    console.log(response);
    if (response.status === '0') {
      throw new Error(response.message || 'Failed to fetch transactions');
    }

    let transactions = response.result.map((tx) => this.formatTransaction(tx, params.fromAddress));

    // Применяем дополнительные фильтры
    if (params.toAddress) {
      transactions = transactions.filter(
        (tx) => tx.to.toLowerCase() === params.toAddress!.toLowerCase()
      );
    }

    if (params.dateFrom) {
      const fromDate = new Date(params.dateFrom).getTime();
      transactions = transactions.filter((tx) => new Date(tx.timestamp).getTime() >= fromDate);
    }

    if (params.dateTo) {
      const toDate = new Date(params.dateTo).getTime();
      transactions = transactions.filter((tx) => new Date(tx.timestamp).getTime() <= toDate);
    }

    if (params.minAmount) {
      transactions = transactions.filter(
        (tx) => parseFloat(tx.amount) >= parseFloat(params.minAmount!)
      );
    }

    if (params.maxAmount) {
      transactions = transactions.filter(
        (tx) => parseFloat(tx.amount) <= parseFloat(params.maxAmount!)
      );
    }

    if (params.transactionType && params.transactionType !== 'all') {
      transactions = transactions.filter((tx) => tx.type === params.transactionType);
    }

    return transactions;
  }

  async getTransaction(params: SingleTransactionParams): Promise<FormattedTransaction> {
    const queryParams = new URLSearchParams({
      module: 'transaction',
      action: 'gettxinfo',
      txhash: params.txHash,
      apikey: this.apiKey,
      chainid: (params.chainId || this.defaultChainId).toString(),
    });

    const response = await this.makeRequest<MantleTransaction>(queryParams);
    console.log(response);
    if (response.status === '0') {
      throw new Error(response.message || 'Failed to fetch transaction');
    }

    return this.formatTransaction(response.result);
  }
}
