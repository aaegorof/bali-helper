import { DatabaseObjectResponse } from '@notionhq/client/build/src/api-endpoints';

interface DatabaseProps {
  database: DatabaseObjectResponse;
}

export default function Database({ database }: DatabaseProps) {
  return (
    <div className="p-4 border rounded-lg shadow-md mb-4">
      <h2 className="text-2xl font-bold mb-2">
        {database.title?.[0]?.plain_text || 'Untitled Database'}
      </h2>
      <div className="text-sm text-gray-500 mb-2">Database ID: {database.id}</div>
      <div className="mb-4">
        <p className="text-gray-700">
          Last edited: {new Date(database.last_edited_time).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}
