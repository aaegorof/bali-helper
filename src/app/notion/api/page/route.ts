import { Client } from '@notionhq/client';
import { NextRequest, NextResponse } from 'next/server';

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const pageId = searchParams.get('id');

  if (!pageId) {
    return NextResponse.json({ error: 'Page ID is required', status: 'error' }, { status: 400 });
  }

  try {
    // Fetch the page by ID
    const page = await notion.pages.retrieve({ page_id: pageId });

    // Fetch blocks for the page
    const blocks = await notion.blocks.children.list({
      block_id: pageId,
      page_size: 100,
    });

    return NextResponse.json({
      page,
      blocks: blocks.results,
      status: 'success',
    });
  } catch (error) {
    console.error('Error fetching Notion page:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Notion page', status: 'error' },
      { status: 500 }
    );
  }
}
