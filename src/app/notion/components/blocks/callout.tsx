import { BlockObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import RichText from './rich-text';

interface CalloutBlockProps {
  block: Extract<BlockObjectResponse, { type: 'callout' }>;
}

export default function CalloutBlock({ block }: CalloutBlockProps) {
  const { rich_text, icon } = block.callout;

  // Determine the icon to display
  let iconElement;
  if (icon.type === 'emoji') {
    iconElement = <span className="mr-2 text-xl">{icon.emoji}</span>;
  } else if (icon.type === 'external') {
    iconElement = <img src={icon.external.url} alt="Icon" className="w-5 h-5 mr-2" />;
  } else if (icon.type === 'file') {
    iconElement = <img src={icon.file.url} alt="Icon" className="w-5 h-5 mr-2" />;
  }

  return (
    <div className="bg-gray-100 p-4 rounded-md my-4 flex">
      {iconElement}
      <div>
        <RichText richText={rich_text} />
      </div>
    </div>
  );
}
