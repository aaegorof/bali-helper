import { BlockObjectResponse } from '@notionhq/client/build/src/api-endpoints';

interface CodeBlockProps {
  block: Extract<BlockObjectResponse, { type: 'code' }>;
}

export default function CodeBlock({ block }: CodeBlockProps) {
  const { language, rich_text } = block.code;

  // Extract plain text from rich_text
  const code = rich_text.map((text) => text.plain_text).join('');

  return (
    <div className="my-4">
      <div className="bg-gray-800 text-white px-4 py-2 text-sm rounded-t-md flex justify-between items-center">
        <span>{language}</span>
      </div>
      <pre className="bg-gray-100 p-4 overflow-x-auto rounded-b-md text-sm">
        <code>{code}</code>
      </pre>
    </div>
  );
}
