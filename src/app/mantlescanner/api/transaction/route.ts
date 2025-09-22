import { MantleClient } from '@/app/mantlescanner/lib/mantle';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const MANTLESCAN_API_KEY = process.env.MANTLESCAN_API_KEY;
  const MANTLESCAN_API_URL = process.env.ETHER_API;

  if (!MANTLESCAN_API_KEY || !MANTLESCAN_API_URL) {
    return NextResponse.json({ error: 'API key or URL not configured' }, { status: 500 });
  }

  const txHash = request.nextUrl.searchParams.get('txHash');
  const chainId = request.nextUrl.searchParams.get('chainId');

  if (!txHash) {
    return NextResponse.json({ error: 'Transaction hash is required' }, { status: 400 });
  }

  try {
    const client = new MantleClient({
      apiKey: MANTLESCAN_API_KEY,
      apiUrl: MANTLESCAN_API_URL,
      defaultChainId: chainId ? parseInt(chainId) : undefined,
    });

    const transaction = await client.getTransaction({ txHash });
    return NextResponse.json({ result: transaction }, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch transaction:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching the transaction.' },
      { status: 500 }
    );
  }
}
