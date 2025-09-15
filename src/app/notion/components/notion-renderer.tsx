import {
  DatabaseObjectResponse,
  PageObjectResponse,
  SearchResponse,
} from '@notionhq/client/build/src/api-endpoints';
import Database from './database';
import ListPage from './list-page';

interface NotionRendererProps {
  searchResults: SearchResponse['results'];
}

type NotionObject = DatabaseObjectResponse | PageObjectResponse | { id: string; object: string };

export default function NotionRenderer({ searchResults }: NotionRendererProps) {
  if (!searchResults || searchResults.length === 0) {
    return <div className="text-gray-500 p-4">No results found</div>;
  }

  return (
    <main className="container mx-auto">
      <h1 className="text-3xl font-bold mb-6">Notion</h1>

      <div className="grid gap-6">
        {searchResults.map((result) => {
          // Cast the result to our NotionObject type
          const notionObject = result as NotionObject;

          // Determine the type of the result and render the appropriate component
          switch (notionObject.object) {
            case 'database':
              const database = notionObject as DatabaseObjectResponse;
              return <Database database={database} key={database.id} />;

            case 'page':
              const page = notionObject as PageObjectResponse;
              return <ListPage page={page} key={page.id} />;

            default:
              // Handle other object types (like block)
              return (
                <div key={notionObject.id} className="p-4 border rounded-lg">
                  <p className="text-gray-500">Unsupported object type: {notionObject.object}</p>
                </div>
              );
          }
        })}
      </div>
    </main>
  );
}
