import type { Preview } from '@storybook/html-vite';

import './global.css';

/** Extracts only the play() function body from a story source string. */
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
  /**
   * Tear down the previous story before the next one mounts. Stories register
   * cleanups (canvas.destroy(), gui.destroy(), etc.) via `onStoryTeardown` in
   * `stories/div-util.ts`. The DOM sweep is belt-and-braces in case a story
   * created a lil-gui panel without registering one.
   */
  beforeEach: async () => {
    const fns = window.__storyCleanups ?? [];
    window.__storyCleanups = [];
    for (const fn of fns) {
      try {
        fn();
      } catch (err) {
        console.warn('[story cleanup]', err);
      }
    }
    document.querySelectorAll('.lil-gui').forEach((n) => n.remove());
  },

  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    layout: 'fullscreen',
    backgrounds: {
      options: {
        light: { name: 'light', value: '#ffffff' },
        dark: { name: 'dark', value: '#242426' },
        gray: { name: 'gray', value: '#f5f5f5' },
      },
    },
    docs: {
      codePanel: true,
      source: {
        type: 'auto',
        transform: (src: string) => extractPlayBody(src),
      },
    },
  },

  initialGlobals: {
    backgrounds: {
      value: 'dark',
    },
  },
};

export default preview;
