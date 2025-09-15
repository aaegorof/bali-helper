import { NextRequest, NextResponse } from 'next/server';
import { SpotTradeDbService } from '../../services/db-service';

/**
 * Gets all trading pairs (symbols) for a user from the database
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 });
    }

    const symbols = await SpotTradeDbService.getUserSymbols(Number(userId));

    return NextResponse.json({ symbols });
  } catch (error) {
    console.error('Error fetching user trading pairs:', error);
    return NextResponse.json({ error: 'Failed to fetch user trading pairs' }, { status: 500 });
  }
}
