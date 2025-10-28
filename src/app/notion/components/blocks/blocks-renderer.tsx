import { BlockObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import React from 'react';
import Block from './block';

interface BlocksRendererProps {
  blocks: BlockObjectResponse[];
}

export default function BlocksRenderer({ blocks }: BlocksRendererProps) {
  if (!blocks || blocks.length === 0) {
    return <div className="text-gray-500">No content available</div>;
  }

  // Group list items to render them in proper list containers
  const renderedBlocks: React.JSX.Element[] = [];
  let currentListType: null | 'bulleted' | 'numbered' = null;
  let currentListItems: React.JSX.Element[] = [];

  const flushCurrentList = () => {
    if (currentListItems.length > 0) {
      renderedBlocks.push(
        <ol
          key={`list-${renderedBlocks.length}`}
          className={currentListType === 'numbered' ? 'list-decimal' : 'list-disc'}
        >
          {currentListItems}
        </ol>
      );
      currentListItems = [];
      currentListType = null;
    }
  };

  blocks.forEach((block, index) => {
    // Handle list items specially to group them
    if (block.type === 'bulleted_list_item' || block.type === 'numbered_list_item') {
      const newListType = block.type === 'bulleted_list_item' ? 'bulleted' : 'numbered';

      // If we're switching list types, flush the current list
      if (currentListType && currentListType !== newListType) {
        flushCurrentList();
      }

      currentListType = newListType;
      currentListItems.push(<Block key={block.id} block={block} />);
    } else {
      // For non-list blocks, flush any current list and render the block
      flushCurrentList();
      renderedBlocks.push(<Block key={block.id} block={block} />);
    }
  });

  // Flush any remaining list items
  flushCurrentList();

  return <div className="notion-blocks">{renderedBlocks}</div>;
}
