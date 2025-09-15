import { NextRequest, NextResponse } from 'next/server';

// Типы для транзакций
export interface Transaction {
  hash: string;
  from: string;
  to: string;
  amount: string;
  timestamp: string;
  gasUsed: string;
  gasPrice: string;
  contractAddress: string;
  functionName: string;
  type?: 'sent' | 'received';
}

// Типы для ответа MantleScan API
export interface MantleScanTransaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  timeStamp: string;
  gasUsed: string;
  gasPrice: string;
  contractAddress: string;
  functionName: string;
}

interface MantleScanResponse {
  status: string;
  result: MantleScanTransaction[];
}
export type GetTransactionsParams = {
  searchParams: {
    fromAddress: string;
    toAddress: string;
    dateFrom?: string;
    dateTo?: string;
    minAmount?: string;
    maxAmount?: string;
    transactionType?: 'all' | 'sent' | 'received';
    chainid?: number;
  };
};

export async function GET(request: NextRequest) {
  // Убедитесь, что переменные окружения доступны
  const searchParamsRaw = request.nextUrl.searchParams;
  const searchParams = Object.fromEntries(searchParamsRaw.entries());
  console.log('Search params as JSON:', searchParams);

  const MANTLESCAN_API_KEY = process.env.MANTLESCAN_API_KEY;
  const MANTLESCAN_API_URL = process.env.ETHER_API;

  if (!MANTLESCAN_API_KEY || !MANTLESCAN_API_URL) {
    return NextResponse.json({ error: 'API key or URL not configured' }, { status: 500 });
  }

  try {
    // Получаем все транзакции для адреса
    const params = new URLSearchParams({
      module: 'account',
      action: 'txlist',
      address: searchParams.fromAddress.toLocaleLowerCase(),
      startblock: '0',
      endblock: '99999999',
      page: '1',
      offset: '100',
      sort: 'desc',
      apikey: MANTLESCAN_API_KEY,
      chainid: searchParams.chainid ? searchParams.chainid.toString() : '5000',
    });

    const url = `${MANTLESCAN_API_URL}?${params.toString()}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch from MantleScan API: ${response.statusText}`);
    }

    const data: MantleScanResponse = await response.json();

    if (data.status === '0') {
      return NextResponse.json({ result: data.result }, { status: 200 });
    }

    // Фильтруем транзакции на основе параметров
    const filteredTransactions =
      data.result.filter(
        (tx: MantleScanTransaction) => tx.to.toLowerCase() === searchParams.toAddress!.toLowerCase()
      ) || [];

    const preparedResults: Transaction[] = filteredTransactions.map((tx) => ({
      ...tx,
      amount: tx.value,
      timestamp:
        typeof tx.timeStamp === 'string'
          ? tx.timeStamp
          : new Date(tx.timeStamp * 1000).toISOString(),
    }));

    console.log(
      {
        ...data,
        result: [data.result[0], data.result[1], data.result[2]],
      },
      preparedResults.length
    );

    return NextResponse.json(
      {
        result: preparedResults,
        total: data.result.length,
        filters: searchParams,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('API call failed:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching transactions.' },
      { status: 500 }
    );
  }
}
