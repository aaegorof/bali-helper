import { BlockObjectResponse } from '@notionhq/client/build/src/api-endpoints';

// Import all block components
import BookmarkBlock from './bookmark';
import CalloutBlock from './callout';
import CodeBlock from './code';
import ColumnListBlock from './column-list';
import DividerBlock from './divider';
import HeadingBlock from './heading';
import ImageBlock from './image';
import ListItemBlock from './list-item';
import ParagraphBlock from './paragraph';
import QuoteBlock from './quote';
import TableBlock from './table';
import TodoBlock from './todo';
import ToggleBlock from './toggle';

interface BlockProps {
  block: BlockObjectResponse;
}

export default function Block({ block }: BlockProps) {
  // Render the appropriate block component based on the block type
  switch (block.type) {
    case 'paragraph':
      return <ParagraphBlock block={block} />;
    case 'heading_1':
    case 'heading_2':
    case 'heading_3':
      return <HeadingBlock block={block} />;
    case 'bulleted_list_item':
    case 'numbered_list_item':
      return <ListItemBlock block={block} />;
    case 'to_do':
      return <TodoBlock block={block} />;
    case 'code':
      return <CodeBlock block={block} />;
    case 'image':
      return <ImageBlock block={block} />;
    case 'quote':
      return <QuoteBlock block={block} />;
    case 'divider':
      return <DividerBlock block={block} />;
    case 'callout':
      return <CalloutBlock block={block} />;
    case 'bookmark':
      return <BookmarkBlock block={block} />;
    case 'toggle':
      return <ToggleBlock block={block} />;
    case 'table':
      return <TableBlock block={block} />;
    case 'column_list':
      return <ColumnListBlock block={block} />;
    default:
      // For unsupported block types, render a placeholder
      return (
        <div className="p-2 border border-gray-300 rounded my-2 bg-gray-50">
          <p className="text-sm text-gray-500">Unsupported block type: {block.type}</p>
        </div>
      );
  }
}
