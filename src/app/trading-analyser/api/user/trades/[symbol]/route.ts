import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { analyzeCoinTrade } from '@/app/trading-analyser/helpers';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import bybitService from '../../../services/bybit';
import { SpotTradeDbService } from '../../../services/db-service';

/**
 * Fetches spot trades for a given symbol and date range and saves them to the database
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { symbol: string } }
): Promise<NextResponse> {
  try {
    const { symbol } = await params;
    const data = await request.json();
    const { startDate, endDate, userId, limit = 1000 } = data;
    console.log(symbol, startDate, endDate, userId, limit);
    if (!symbol || !startDate || !endDate || !userId) {
      return NextResponse.json(
        { error: 'Missing required parameters: symbol, startDate, endDate, userId' },
        { status: 400 }
      );
    }

    // Parse dates
    const startTime = new Date(startDate);
    const endTime = new Date(endDate);

    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format. Use ISO string format.' },
        { status: 400 }
      );
    }

    // Fetch trades from Bybit API
    const trades = await bybitService.getHistoricalSpotTrades(symbol, startTime, endTime, limit);

    if (trades.length === 0) {
      return NextResponse.json(
        { message: 'No trades found for the specified period', count: 0 },
        { status: 200 }
      );
    }

    // Save trades to database
    const insertedCount = await SpotTradeDbService.saveTrades(trades, userId);

    return NextResponse.json(
      {
        message: `Successfully processed ${trades.length} trades, inserted ${insertedCount} new records`,
        count: insertedCount,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error processing spot trades:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred while processing spot trades' },
      { status: 500 }
    );
  }
}

/**
 * Gets spot trades for a user from the database
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { symbol: string } }
): Promise<NextResponse> {
  try {
    const { symbol } = await params;
    const { searchParams } = new URL(request.url);

    // Получаем пользователя из сессии вместо параметра запроса
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized: User not authenticated' }, { status: 401 });
    }

    // Преобразуем ID пользователя из строки в число
    const userId = parseInt(session.user.id, 10);

    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID format' }, { status: 400 });
    }

    const startTime = searchParams.get('startTime');
    const endTime = searchParams.get('endTime');
    const limit = searchParams.get('limit');

    if (!symbol) {
      return NextResponse.json({ error: 'Missing required parameter: symbol' }, { status: 400 });
    }

    const trades = await SpotTradeDbService.getTradesBySymbol(
      userId,
      symbol,
      startTime ? Number(startTime) : undefined,
      endTime ? Number(endTime) : undefined,
      limit ? Number(limit) : 1000
    );

    const analyze = analyzeCoinTrade(trades);

    return NextResponse.json({ trades, analyze }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching spot trades:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred while fetching spot trades' },
      { status: 500 }
    );
  }
}
