import { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import Link from 'next/link';

interface PageProps {
  page: PageObjectResponse;
  children?: React.ReactNode;
}

export default function ListPage({ page, children }: PageProps) {
  // Helper function to extract title from page properties
  const getPageTitle = () => {
    // Look for a title property
    for (const [key, value] of Object.entries(page.properties)) {
      if (value.type === 'title' && value.title?.length > 0) {
        return value.title[0].plain_text;
      }
    }
    return 'Untitled Page';
  };

  return (
    <div>
      <h3 className="text-3xl font-bold mb-2">
        <Link href={`/notion/page/${page.id}`} className="text-blue-500 hover:underline block mb-2">
          {getPageTitle()}
        </Link>
      </h3>
      <div className="text-xs flex gap-4 text-slate-500">
        <div>Created: {new Date(page.created_time).toLocaleDateString()}</div>
        <div>Last edited: {new Date(page.last_edited_time).toLocaleDateString()}</div>
      </div>

      {/* Properties section */}
      <div className="mb-4">
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(page.properties).map(([key, property]) => (
            <div key={key} className="p-2 border rounded">
              <span className="font-medium">{key}:</span> {property.type}
            </div>
          ))}
        </div>
      </div>

      {/* Page content (blocks) will be rendered here */}
      {children && (
        <div className="mt-6 border-t pt-4">
          <h3 className="text-xl font-semibold mb-4">Content</h3>
          {children}
        </div>
      )}
    </div>
  );
}
