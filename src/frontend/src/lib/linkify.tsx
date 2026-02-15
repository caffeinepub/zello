import React from 'react';

const URL_REGEX = /(https?:\/\/[^\s]+)/g;

export function linkify(text: string): React.ReactNode[] {
  const parts = text.split(URL_REGEX);
  
  return parts.map((part, index) => {
    if (part.match(URL_REGEX)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline break-all"
        >
          {part}
        </a>
      );
    }
    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
}
