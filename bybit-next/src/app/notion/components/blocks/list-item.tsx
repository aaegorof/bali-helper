import { BlockObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import RichText from './rich-text';

interface ListItemBlockProps {
  block: Extract<BlockObjectResponse, { type: 'bulleted_list_item' | 'numbered_list_item' }>;
}

export default function ListItemBlock({ block }: ListItemBlockProps) {
  const isNumbered = block.type === 'numbered_list_item';
  const richText = isNumbered
    ? block.numbered_list_item.rich_text
    : block.bulleted_list_item.rich_text;

  // For numbered lists, we'll use CSS counters for proper numbering
  // For bulleted lists, we'll use list-disc style
  return (
    <li className={`my-1 ml-6 ${isNumbered ? 'list-decimal' : 'list-disc'}`}>
      <RichText richText={richText} />

      {/* Render child blocks if they exist */}
      {block.has_children && (
        <div className="ml-4 mt-2">
          <p className="text-sm text-gray-500 italic">(Child blocks not rendered)</p>
        </div>
      )}
    </li>
  );
}
