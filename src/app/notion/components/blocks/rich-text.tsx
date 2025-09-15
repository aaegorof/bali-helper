import { RichTextItemResponse } from '@notionhq/client/build/src/api-endpoints';
import React from 'react';

interface RichTextProps {
  richText: RichTextItemResponse[];
}

export default function RichText({ richText }: RichTextProps) {
  if (!richText || richText.length === 0) {
    return null;
  }

  return (
    <>
      {richText.map((text, index) => {
        // Apply text annotations (bold, italic, etc.)
        const {
          annotations: { bold, italic, strikethrough, underline, code, color },
          plain_text,
          href,
        } = text;

        // Build the style object based on annotations
        const textStyles: React.CSSProperties = {};

        if (color !== 'default') {
          if (color.includes('_background')) {
            // Handle background colors
            const bgColor = color.replace('_background', '');
            textStyles.backgroundColor = bgColor;
          } else {
            // Handle text colors
            textStyles.color = color;
          }
        }

        // Create the text element with appropriate styling
        let textElement = (
          <span
            key={index}
            style={textStyles}
            className={`
              ${bold ? 'font-bold' : ''}
              ${italic ? 'italic' : ''}
              ${strikethrough ? 'line-through' : ''}
              ${underline ? 'underline' : ''}
              ${code ? 'font-mono bg-gray-100 px-1 rounded' : ''}
            `}
          >
            {plain_text}
          </span>
        );

        // Wrap with link if href is present
        if (href) {
          textElement = (
            <a
              key={index}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              {textElement}
            </a>
          );
        }

        return textElement;
      })}
    </>
  );
}
