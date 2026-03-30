'use client';

import katex from 'katex';
import 'katex/dist/katex.min.css';

type MathTextProps = {
  text: string;
  className?: string;
};

type Token = {
  type: 'text' | 'inline' | 'display';
  value: string;
};

function findClosingDelimiter(text: string, start: number, delimiter: string): number {
  for (let index = start; index < text.length; index += 1) {
    if (text[index] === '\\') {
      index += 1;
      continue;
    }

    if (text.startsWith(delimiter, index)) {
      return index;
    }
  }

  return -1;
}

function parseMath(text: string): Token[] {
  const tokens: Token[] = [];
  let buffer = '';
  let index = 0;

  while (index < text.length) {
    if (text[index] === '\\' && index + 1 < text.length) {
      buffer += text.slice(index, index + 2);
      index += 2;
      continue;
    }

    let closingDelimiter = '';
    let openingLength = 0;
    let type: Token['type'] | null = null;

    if (text.startsWith('$$', index)) {
      closingDelimiter = '$$';
      openingLength = 2;
      type = 'display';
    } else if (text.startsWith('\\[', index)) {
      closingDelimiter = '\\]';
      openingLength = 2;
      type = 'display';
    } else if (text.startsWith('\\(', index)) {
      closingDelimiter = '\\)';
      openingLength = 2;
      type = 'inline';
    } else if (text[index] === '$' && text[index + 1] !== '$') {
      closingDelimiter = '$';
      openingLength = 1;
      type = 'inline';
    }

    if (!type) {
      buffer += text[index];
      index += 1;
      continue;
    }

    const closingIndex = findClosingDelimiter(text, index + openingLength, closingDelimiter);

    if (closingIndex === -1) {
      buffer += text[index];
      index += 1;
      continue;
    }

    if (buffer) {
      tokens.push({ type: 'text', value: buffer });
      buffer = '';
    }

    tokens.push({
      type,
      value: text.slice(index + openingLength, closingIndex).trim(),
    });

    index = closingIndex + closingDelimiter.length;
  }

  if (buffer) {
    tokens.push({ type: 'text', value: buffer });
  }

  return tokens;
}

function renderMath(value: string, displayMode: boolean) {
  return katex.renderToString(value, {
    throwOnError: false,
    displayMode,
    strict: 'ignore',
    trust: false,
  });
}

export function MathText({ text, className }: MathTextProps) {
  const tokens = parseMath(text);

  return (
    <span className={className}>
      {tokens.map((token, index) => {
        if (token.type === 'text') {
          return (
            <span key={`text-${index}`} className="whitespace-pre-wrap">
              {token.value}
            </span>
          );
        }

        if (token.type === 'inline') {
          return (
            <span
              key={`inline-${index}`}
              className="inline-block align-middle"
              dangerouslySetInnerHTML={{ __html: renderMath(token.value, false) }}
            />
          );
        }

        return (
          <span key={`display-${index}`} className="my-3 block overflow-x-auto overflow-y-hidden">
            <span
              className="inline-block min-w-full"
              dangerouslySetInnerHTML={{ __html: renderMath(token.value, true) }}
            />
          </span>
        );
      })}
    </span>
  );
}
