import { BlockObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import RichText from './rich-text';

interface ParagraphBlockProps {
  block: Extract<BlockObjectResponse, { type: 'paragraph' }>;
}

export default function ParagraphBlock({ block }: ParagraphBlockProps) {
  return (
    <p className="my-3 leading-relaxed">
      <RichText richText={block.paragraph.rich_text} />
    </p>
  );
}
