import { BlockObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import { useEffect, useState } from 'react';

interface ColumnListBlockProps {
  block: Extract<BlockObjectResponse, { type: 'column_list' }>;
}

export default function ColumnListBlock({ block }: ColumnListBlockProps) {
  const [columns, setColumns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchColumns = async () => {
      try {
        const response = await fetch(`/notion/api/blocks?pageId=${block.id}`);
        const data = await response.json();

        if (data.status === 'success') {
          // Filter to only include column blocks
          const columnBlocks = data.blocks.filter((b: any) => b.type === 'column');
          setColumns(columnBlocks);
        }
      } catch (error) {
        console.error('Error fetching columns:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchColumns();
  }, [block.id]);

  if (loading) {
    return (
      <div className="my-4 p-4 border rounded-md">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  // If no columns were found
  if (columns.length === 0) {
    return (
      <div className="my-4 p-4 border rounded-md">
        <p className="text-gray-500">Empty column list</p>
      </div>
    );
  }

  return (
    <div className="my-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {columns.map((column) => (
        <div key={column.id} className="border rounded-md p-4">
          {column.has_children ? (
            <p className="text-sm text-gray-500 italic">(Column content not rendered)</p>
          ) : (
            <p className="text-sm text-gray-500">Empty column</p>
          )}
        </div>
      ))}
    </div>
  );
}
