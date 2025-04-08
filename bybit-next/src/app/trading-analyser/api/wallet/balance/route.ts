import { NextRequest, NextResponse } from 'next/server';
import bybit from '../../services/bybit';
import { SpotTradeDbService } from '../../services/db-service';
import { WalletBalance } from '../../types';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const userIdParam = searchParams.get('userId');
  

    if (!userIdParam) {
      return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 });
    }

    // Безопасное преобразование в число
    const userId = parseInt(userIdParam, 10);
    if (isNaN(userId)) {
      console.error('Invalid userId format, could not parse to integer:', userIdParam);
      return NextResponse.json({ error: 'Invalid userId format' }, { status: 400 });
    }

    console.log('Using userId (after parsing):', userId);

    const pairs = await SpotTradeDbService.getUserSymbols(userId);
    const balances = await bybit.getWalletBalance(pairs);
    const currentPrices = await bybit.getCurrentPrices(
      pairs.map((pair) => pair.replace('USDT', ''))
    );
    // Convert Bybit API format to our WalletBalance interface format
    const formattedBalances: WalletBalance[] = balances
      .map((account) => {
        return account.coin.map((coin) => ({
          coin: coin.coin,
          total: parseFloat(coin.walletBalance),
          free: parseFloat(coin.free),
          locked: parseFloat(coin.locked),
          current_price: parseFloat(currentPrices.get(coin.coin) || '0'),
          usd_value: parseFloat(coin.usdValue),
        }));
      })
      .flat();

    console.log('Returning balances for user:', userId);
    return NextResponse.json(formattedBalances);
  } catch (error) {
    console.error('Error fetching wallet balance:', error);
    return NextResponse.json({ error: 'Failed to fetch wallet balance' }, { status: 500 });
  }
}
