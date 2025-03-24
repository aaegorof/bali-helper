import { BlockObjectResponse } from '@notionhq/client/build/src/api-endpoints';

interface DividerBlockProps {
  block: Extract<BlockObjectResponse, { type: 'divider' }>;
}

export default function DividerBlock({ block }: DividerBlockProps) {
  return <hr className="my-6 border-t border-gray-300" />;
}
