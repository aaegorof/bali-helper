import { BlockObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import RichText from './rich-text';

interface QuoteBlockProps {
  block: Extract<BlockObjectResponse, { type: 'quote' }>;
}

export default function QuoteBlock({ block }: QuoteBlockProps) {
  return (
    <blockquote className="pl-4 border-l-4 border-gray-300 my-4 italic text-gray-700">
      <RichText richText={block.quote.rich_text} />
    </blockquote>
  );
}
