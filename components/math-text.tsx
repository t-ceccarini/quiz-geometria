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

function parseMath(text: string): Token[] {
  const tokens: Token[] = [];
  const regex = /(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: 'text', value: text.slice(lastIndex, match.index) });
    }

    const raw = match[0];
    const isDisplay = raw.startsWith('$$') || raw.startsWith('\\[');
    let value = raw;

    if (raw.startsWith('$$')) value = raw.slice(2, -2);
    else if (raw.startsWith('\\[')) value = raw.slice(2, -2);
    else if (raw.startsWith('\\(')) value = raw.slice(2, -2);

    tokens.push({ type: isDisplay ? 'display' : 'inline', value: value.trim() });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    tokens.push({ type: 'text', value: text.slice(lastIndex) });
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
