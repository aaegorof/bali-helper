import { NextResponse } from 'next/server';
import { BybitService } from '../services/bybit';

export async function GET() {
  try {
    const bybit = new BybitService();
    const symbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'];
    const rates = await bybit.getFundingRates(symbols);

    return NextResponse.json(rates);
  } catch (error) {
    console.error('Error fetching funding rates:', error);
    return NextResponse.json({ error: 'Failed to fetch funding rates' }, { status: 500 });
  }
}
