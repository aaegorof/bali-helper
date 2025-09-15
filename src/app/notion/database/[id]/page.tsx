'use client';

import {
  DatabaseObjectResponse,
  PageObjectResponse,
} from '@notionhq/client/build/src/api-endpoints';
import { useEffect, useState } from 'react';
import Database from '../../components/database';
import ListPage from '../../components/list-page';

interface DatabaseParams {
  params: {
    id: string;
  };
}

export default function NotionDatabaseDetail({ params }: DatabaseParams) {
  const [database, setDatabase] = useState<DatabaseObjectResponse | null>(null);
  const [databaseContent, setDatabaseContent] = useState<PageObjectResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPage, setSelectedPage] = useState<string | null>(null);
  const [pageBlocks, setPageBlocks] = useState<any[]>([]);
  const [loadingBlocks, setLoadingBlocks] = useState(false);

  useEffect(() => {
    const fetchDatabaseData = async () => {
      try {
        const response = await fetch(`/notion/api/database?id=${params.id}`);
        const data = await response.json();

        if (data.status === 'success') {
          setDatabase(data.database as DatabaseObjectResponse);
          setDatabaseContent(data.content as PageObjectResponse[]);
        } else {
          setError('Failed to fetch database data');
        }
      } catch (err) {
        setError('Error loading database data');
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDatabaseData();
  }, [params.id]);

  // Fetch blocks for a selected page
  useEffect(() => {
    if (!selectedPage) return;

    const fetchPageBlocks = async () => {
      setLoadingBlocks(true);
      try {
        const response = await fetch(`/notion/api/blocks?pageId=${selectedPage}`);
        const data = await response.json();

        if (data.status === 'success') {
          setPageBlocks(data.blocks);
        } else {
          console.error('Failed to fetch blocks');
        }
      } catch (error) {
        console.error('Error fetching blocks:', error);
      } finally {
        setLoadingBlocks(false);
      }
    };

    fetchPageBlocks();
  }, [selectedPage]);

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error || !database) {
    return (
      <div className="p-8">
        <div className="text-red-500">{error || 'Database not found'}</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <Database database={database} />

      {databaseContent.length === 0 ? (
        <p className="text-gray-500">No items in this database</p>
      ) : (
        <div className="grid gap-6">
          {databaseContent.map((page) => (
            <div key={page.id}>
              <ListPage page={page}>
                {selectedPage === page.id && (
                  <>
                    {loadingBlocks ? (
                      <div className="flex justify-center p-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                      </div>
                    ) : (
                      <div className="mt-4">
                        {pageBlocks.length > 0 ? (
                          <div className="text-sm text-gray-500 italic">
                            (Content available on page view)
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500">No content</div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </ListPage>

              <div className="mt-2">
                <button
                  onClick={() => setSelectedPage(selectedPage === page.id ? null : page.id)}
                  className="text-blue-500 hover:underline text-sm"
                >
                  {selectedPage === page.id ? 'Hide details' : 'Show details'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
