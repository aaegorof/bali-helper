import { Client } from '@notionhq/client';
import { NextRequest, NextResponse } from 'next/server';

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const databaseId = searchParams.get('id');

  if (!databaseId) {
    return NextResponse.json(
      { error: 'Database ID is required', status: 'error' },
      { status: 400 }
    );
  }

  try {
    // Fetch the database by ID
    const database = await notion.databases.retrieve({ database_id: databaseId });

    // Fetch database content (rows)
    const databaseContent = await notion.databases.query({
      database_id: databaseId,
      page_size: 100,
    });

    return NextResponse.json({
      database,
      content: databaseContent.results,
      status: 'success',
    });
  } catch (error) {
    console.error('Error fetching Notion database:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Notion database', status: 'error' },
      { status: 500 }
    );
  }
}
