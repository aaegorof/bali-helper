'use client';

import { BlockObjectResponse, PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import { use, useEffect, useState } from 'react';
import BlocksRenderer from '../../components/blocks/blocks-renderer';
import ListPage from '../../components/list-page';

interface PageParams {
  params: Promise<{
    id: string;
  }>;
}

export default function NotionPageDetail({ params }: PageParams) {
  const { id } = use(params) as { id: string };
  const [page, setPage] = useState<PageObjectResponse | null>(null);
  const [blocks, setBlocks] = useState<BlockObjectResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPageData = async () => {
      try {
        const response = await fetch(`/notion/api/page?id=${id}`);
        const data = await response.json();

        if (data.status === 'success') {
          setPage(data.page as PageObjectResponse);
          setBlocks(data.blocks);
        } else {
          setError('Failed to fetch page data');
        }
      } catch (err) {
        setError('Error loading page data');
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPageData();
  }, [id]);

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="p-8">
        <div className="text-red-500">{error || 'Page not found'}</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <ListPage page={page}>
        <BlocksRenderer blocks={blocks} />
      </ListPage>
    </div>
  );
}
