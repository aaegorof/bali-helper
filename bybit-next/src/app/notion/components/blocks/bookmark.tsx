import { BlockObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import RichText from './rich-text';

interface BookmarkBlockProps {
  block: Extract<BlockObjectResponse, { type: 'bookmark' }>;
}

export default function BookmarkBlock({ block }: BookmarkBlockProps) {
  const { url, caption } = block.bookmark;

  return (
    <div className="my-4 border rounded-md overflow-hidden">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="block p-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center">
          <div className="mr-3">
            <img
              src={`https://www.google.com/s2/favicons?domain=${url}`}
              alt="Website favicon"
              className="w-4 h-4"
            />
          </div>
          <div className="overflow-hidden">
            <div className="text-blue-600 hover:underline truncate">{url}</div>
          </div>
        </div>
      </a>
      {caption.length > 0 && (
        <div className="px-4 py-2 bg-gray-50 text-sm text-gray-500 border-t">
          <RichText richText={caption} />
        </div>
      )}
    </div>
  );
}
