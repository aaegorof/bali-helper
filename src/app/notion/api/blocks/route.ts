import { Client } from '@notionhq/client';
import { NextRequest, NextResponse } from 'next/server';

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const pageId = searchParams.get('pageId');

  if (!pageId) {
    return NextResponse.json({ error: 'Page ID is required', status: 'error' }, { status: 400 });
  }

  try {
    // Fetch blocks for the specified page
    const response = await notion.blocks.children.list({
      block_id: pageId,
      page_size: 100,
    });

    return NextResponse.json({
      blocks: response.results,
      status: 'success',
    });
  } catch (error) {
    console.error('Error fetching Notion blocks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Notion blocks', status: 'error' },
      { status: 500 }
    );
  }
}
