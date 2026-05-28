import type { Preview } from '@storybook/react-vite';

// @invana/design-kit stylesheets — tokens first, components second.
// Imported as JS so Vite resolves the bare specifiers via Node resolution
// (PostCSS's @import doesn't understand package names).
import '@invana/themes/styles.css';
import '@invana/ui/styles.css';
// The base stylesheets above ship only the *light* `:root` tokens. This adds
// the `default` theme's dark/light variant tokens (scoped to
// `[data-theme="default-*"]`). It's unlayered, so it wins over the `@layer
// theme` `:root` defaults — see `bootstrapOsTheme` below, which flips the
// attribute from `prefers-color-scheme`.
import '@invana/styling/themes/default.css';

import './global.css';

/**
 * Make the `@invana/ui` chrome follow the OS colour scheme. The design-kit
 * has no `prefers-color-scheme` wiring of its own — it switches themes by
 * attribute — so we set `data-theme` on `<html>` from the media query and keep
 * it in sync. CSS custom properties inherit into Radix portals, so popovers /
 * dropdown menus pick up the dark tokens too. App-level (not per-story); the
 * listener lives for the iframe session.
 */
function bootstrapOsTheme(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  const root = document.documentElement;
  const apply = (dark: boolean): void => {
    const variant = dark ? 'default-dark' : 'default-light';
    root.setAttribute('data-theme', variant);
    root.classList.remove('theme-default-light', 'theme-default-dark', 'light', 'dark');
    root.classList.add(`theme-${variant}`, dark ? 'dark' : 'light');
  };
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  apply(mq.matches);
  mq.addEventListener('change', (e) => apply(e.matches));
}
bootstrapOsTheme();

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
