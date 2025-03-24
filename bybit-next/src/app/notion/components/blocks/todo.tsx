import { BlockObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import RichText from './rich-text';

interface TodoBlockProps {
  block: Extract<BlockObjectResponse, { type: 'to_do' }>;
}

export default function TodoBlock({ block }: TodoBlockProps) {
  const { checked, rich_text } = block.to_do;

  return (
    <div className="flex items-start my-2">
      <div className="flex-shrink-0 mt-1">
        <input
          type="checkbox"
          checked={checked}
          readOnly
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      </div>
      <div className={`ml-2 ${checked ? 'line-through text-gray-500' : ''}`}>
        <RichText richText={rich_text} />
      </div>
    </div>
  );
}
