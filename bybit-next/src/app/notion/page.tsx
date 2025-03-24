'use client';

import { SearchResponse } from '@notionhq/client/build/src/api-endpoints';
import { useEffect, useState } from 'react';
import NotionRenderer from './components/notion-renderer';

export default function NotionPage() {
  const [searchResults, setSearchResults] = useState<SearchResponse['results']>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNotionData = async () => {
      try {
        const response = await fetch('/notion/api');
        const data = await response.json();

        if (data.status === 'success') {
          setSearchResults(data.pages);
        } else {
          setError('Failed to fetch Notion data');
        }
      } catch (err) {
        setError('Error loading Notion data');
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotionData();
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return <NotionRenderer searchResults={searchResults} />;
}
