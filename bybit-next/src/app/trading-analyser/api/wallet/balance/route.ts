import { NextRequest, NextResponse } from 'next/server';
import bybit from '../../services/bybit';
import { SpotTradeDbService } from '../../services/db-service';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 });
    }
    const pairs = await SpotTradeDbService.getUserSymbols(Number(userId));
    const balances = await bybit.getWalletBalance(pairs);
    const currentPrices = await bybit.getCurrentPrices(pairs.map((pair) => pair.replace('USDT', '')));
    // Convert Bybit API format to our WalletBalance interface format
    const formattedBalances = balances
      .map((account) => {
        return account.coin.map((coin) => ({
          coin: coin.coin,
          total: parseFloat(coin.walletBalance),
          free: parseFloat(coin.free),
          locked: parseFloat(coin.locked),
          current_price: currentPrices.get(coin.coin),
          usd_value: parseFloat(coin.usdValue),
        }));
      })
      .flat();

    console.log(formattedBalances);
    return NextResponse.json(formattedBalances);
  } catch (error) {
    console.error('Error fetching wallet balance:', error);
    return NextResponse.json({ error: 'Failed to fetch wallet balance' }, { status: 500 });
  }
}
