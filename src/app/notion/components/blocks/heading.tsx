import { BlockObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import RichText from './rich-text';

interface HeadingBlockProps {
  block: Extract<BlockObjectResponse, { type: 'heading_1' | 'heading_2' | 'heading_3' }>;
}

export default function HeadingBlock({ block }: HeadingBlockProps) {
  // Get the heading level and content based on the block type
  const level = block.type.split('_')[1];
  const richText =
    block.type === 'heading_1'
      ? block.heading_1.rich_text
      : block.type === 'heading_2'
        ? block.heading_2.rich_text
        : block.heading_3.rich_text;

  // Render the appropriate heading element based on the level
  switch (level) {
    case '1':
      return (
        <h1 className="text-3xl font-bold mt-6 mb-4">
          <RichText richText={richText} />
        </h1>
      );
    case '2':
      return (
        <h2 className="text-2xl font-bold mt-5 mb-3">
          <RichText richText={richText} />
        </h2>
      );
    case '3':
      return (
        <h3 className="text-xl font-bold mt-4 mb-2">
          <RichText richText={richText} />
        </h3>
      );
    default:
      return null;
  }
}
