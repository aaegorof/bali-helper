import { MantleClient } from '@/app/mantlescanner/lib/mantle';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const MANTLESCAN_API_KEY = process.env.MANTLESCAN_API_KEY;
  const MANTLESCAN_API_URL = process.env.ETHER_API;

  if (!MANTLESCAN_API_KEY || !MANTLESCAN_API_URL) {
    return NextResponse.json({ error: 'API key or URL not configured' }, { status: 500 });
  }

  const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries());
  const { fromAddress, chainId } = searchParams;

  if (!fromAddress) {
    return NextResponse.json({ error: 'From address is required' }, { status: 400 });
  }

  try {
    const client = new MantleClient({
      apiKey: MANTLESCAN_API_KEY,
      apiUrl: MANTLESCAN_API_URL,
      defaultChainId: chainId ? parseInt(chainId) : undefined,
    });

    const transactions = await client.getTransactions({
      fromAddress: fromAddress,
      chainId: chainId ? parseInt(chainId) : undefined,
    });

    // Filter by toAddress if provided
    const filteredTransactions = searchParams.toAddress
      ? transactions.filter((tx) => tx.to.toLowerCase() === searchParams.toAddress.toLowerCase())
      : transactions;

    return NextResponse.json(
      {
        result: filteredTransactions,
        total: filteredTransactions.length,
        filters: searchParams,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Failed to fetch transactions:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching transactions.' },
      { status: 500 }
    );
  }
}
