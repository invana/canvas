import type { Preview } from '@storybook/html';

import './global.css';

/**
 * Extracts only the play() function body from a story source string.
 */
function extractPlayBody(src: string): string {
  const playIdx = src.indexOf('play: async () =>');
  if (playIdx === -1) return src;

  const braceStart = src.indexOf('{', playIdx);
  if (braceStart === -1) return src;

  let depth = 1;
  let i = braceStart + 1;
  while (i < src.length && depth > 0) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') depth--;
    i++;
  }

  const body = src.slice(braceStart + 1, i - 1);
  const lines = body.split('\n');
  const nonEmpty = lines.filter((l) => l.trim().length > 0);
  const minIndent =
    nonEmpty.length > 0
      ? nonEmpty.reduce(
          (min, l) => Math.min(min, l.match(/^(\s*)/)?.[1]?.length ?? 0),
          Infinity,
        )
      : 0;

  return lines
    .map((l) => l.slice(Math.max(0, minIndent)))
    .join('\n')
    .trim();
}

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    layout: 'fullscreen',
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'light', value: '#ffffff' },
        { name: 'dark', value: '#1a1a2e' },
        { name: 'gray', value: '#f5f5f5' },
      ],
    },
    docs: {
      codePanel: true,
      source: {
        type: 'auto',
        transform: (src: string) => extractPlayBody(src),
      },
    },
  },
};

export default preview;
