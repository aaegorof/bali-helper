import { Client } from '@notionhq/client';
import { NextResponse } from 'next/server';

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

export async function GET() {
  try {
    const response = await notion.search({
      page_size: 100,
    });

    return NextResponse.json({
      pages: response.results,
      status: 'success',
    });
  } catch (error) {
    console.error('Error fetching Notion pages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Notion pages', status: 'error' },
      { status: 500 }
    );
  }
}
