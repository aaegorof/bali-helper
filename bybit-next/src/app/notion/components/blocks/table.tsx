import { BlockObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import { useEffect, useState } from 'react';
import RichText from './rich-text';

interface TableBlockProps {
  block: Extract<BlockObjectResponse, { type: 'table' }>;
}

export default function TableBlock({ block }: TableBlockProps) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTableRows = async () => {
      try {
        const response = await fetch(`/notion/api/blocks?pageId=${block.id}`);
        const data = await response.json();

        if (data.status === 'success') {
          setRows(data.blocks);
        }
      } catch (error) {
        console.error('Error fetching table rows:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTableRows();
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

  // If no rows were found
  if (rows.length === 0) {
    return (
      <div className="my-4 p-4 border rounded-md">
        <p className="text-gray-500">Empty table</p>
      </div>
    );
  }

  const { has_column_header, has_row_header } = block.table;

  return (
    <div className="my-4 overflow-x-auto">
      <table className="min-w-full border-collapse border border-gray-300">
        <tbody>
          {rows.map((row, rowIndex) => {
            if (row.type !== 'table_row') return null;

            return (
              <tr key={row.id}>
                {row.table_row.cells.map((cell: any[], cellIndex: number) => {
                  const isColHeader = has_column_header && rowIndex === 0;
                  const isRowHeader = has_row_header && cellIndex === 0;

                  if (isColHeader || isRowHeader) {
                    return (
                      <th
                        key={`${row.id}-${cellIndex}`}
                        className="border border-gray-300 px-4 py-2 bg-gray-100 font-medium"
                      >
                        <RichText richText={cell} />
                      </th>
                    );
                  }

                  return (
                    <td key={`${row.id}-${cellIndex}`} className="border border-gray-300 px-4 py-2">
                      <RichText richText={cell} />
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
