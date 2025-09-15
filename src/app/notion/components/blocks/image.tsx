import { BlockObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import RichText from './rich-text';

interface ImageBlockProps {
  block: Extract<BlockObjectResponse, { type: 'image' }>;
}

export default function ImageBlock({ block }: ImageBlockProps) {
  // Get the image URL based on the type (file, external)
  const imageSource =
    block.image.type === 'external' ? block.image.external.url : block.image.file.url;

  // Get the caption if available
  const caption = block.image.caption.length > 0 ? block.image.caption : null;

  return (
    <figure className="my-6">
      <img
        src={imageSource}
        alt={caption ? caption.map((text) => text.plain_text).join('') : 'Notion image'}
        className="max-w-full h-auto rounded-md"
      />
      {caption && (
        <figcaption className="mt-2 text-sm text-gray-500 text-center">
          <RichText richText={caption} />
        </figcaption>
      )}
    </figure>
  );
}
