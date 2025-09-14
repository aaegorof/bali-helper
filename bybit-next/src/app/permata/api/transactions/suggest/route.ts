import { determineCategoryWithRAG, determineKeywordCategory } from '@/app/lib/vectorDb';
import { ApiResponse } from '@/app/types/api';
import { NextResponse } from 'next/server';
import { TransactionDb } from '../transactions/route';

interface SuggestCategoriesRequestBody {
  transactions: TransactionDb[];
}
export type RespSuggestCategories = {
  categories: {
    id: number;
    category: string;
    keywordCategory?: string;
    aiCategory?: string;
  }[];
};
export async function POST(
  req: Request
): Promise<NextResponse<ApiResponse<RespSuggestCategories>>> {
  const { transactions } = (await req.json()) as SuggestCategoriesRequestBody;

  if (!transactions) {
    return NextResponse.json<ApiResponse<RespSuggestCategories>>(
      {
        success: false,
        error: 'Transactions are required',
      },
      { status: 400 }
    );
  }

  try {
    const categories = await Promise.all(
      transactions.map(async (trans) => {
        const ragCategory = await determineCategoryWithRAG(trans.description || '');
        const keywordCategory = determineKeywordCategory(trans.description || '');

        return {
          id: trans.id,
          category: ragCategory,
          keywordCategory,
        };
      })
    );

    return NextResponse.json({
      success: true,
      categories,
    });
  } catch (err: any) {
    console.error('Error suggesting category:', err);
    return NextResponse.json<ApiResponse<RespSuggestCategories>>({
      success: false,
      error: 'Error suggesting category',
      details: err.message,
    });
  }
}
