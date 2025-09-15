import { BlockObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import { useState } from 'react';
import RichText from './rich-text';

interface ToggleBlockProps {
  block: Extract<BlockObjectResponse, { type: 'toggle' }>;
}

export default function ToggleBlock({ block }: ToggleBlockProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { rich_text } = block.toggle;

  return (
    <div className="my-3">
      <div className="flex items-center cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
        <div className="mr-2 text-gray-500">{isOpen ? '▼' : '►'}</div>
        <div className="font-medium">
          <RichText richText={rich_text} />
        </div>
      </div>

      {isOpen && block.has_children && (
        <div className="pl-6 mt-2 border-l-2 border-gray-200">
          <p className="text-sm text-gray-500 italic">(Child blocks not rendered)</p>
        </div>
      )}
    </div>
  );
}
