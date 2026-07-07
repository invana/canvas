import type { Preview } from '@storybook/react-vite';

// Design-kit styling via a real Tailwind v4 pass (`./tailwind.css` + the
// `@tailwindcss/vite` plugin in `main.ts`), instead of the prebuilt
// `@invana/ui/styles.css`. The kit is source-based and `@invana/forms` ships no
// CSS, so the utilities its components use (e.g. the Switch's `translate-x-5`
// and `data-[state]` backgrounds) only exist if we run Tailwind and scan the
// packages. `@invana/themes/styles.css` still supplies the concrete `:root`
// token values; `tailwind.css` pulls the `@invana/styling` theme variants and
// generates the utilities. Mirrors the design-kit repo's own Storybook.
import '@invana/themes/styles.css';
import './tailwind.css';

import './global.css';

import { createTapTracer, onCanvasStoreCreated } from '@invana/canvas-store';
import { getCanvasTracer, telemetryInfo } from '../stories/canvas-store/otel';

/**
 * Make the `@invana/ui` chrome follow the OS colour scheme. The design-kit
 * has no `prefers-color-scheme` wiring of its own — it switches themes by
 * attribute — so we set `data-theme` on `<html>` from the media query and keep
 * it in sync. CSS custom properties inherit into Radix portals, so popovers /
 * dropdown menus pick up the dark tokens too. App-level (not per-story); the
 * listener lives for the iframe session.
 *
 * Stories that mount `<GraphCanvasApp>` wrap themselves in their own
 * `<ThemeProvider>` (it reads the theme via `useTheme()`) — Storybook doesn't
 * provide one globally, so each story owns the real consumer wiring.
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

/**
 * Telemetry for **every** story. `onCanvasStoreCreated` (kernel) fires for every
 * `CanvasStore` at construction — the single chokepoint every `Canvas` funnels
 * through, whether a story hand-rolls `new Canvas()`/`new GraphCanvas()` or uses
 * `<Canvas>` / `<GraphCanvasApp>`. So this one registration traces all ~285
 * stories with no per-story edits.
 *
 * `createTapTracer` turns every bus event into a span — including the
 * `state:change` events that carry the mutation's `action` label + `durationMs` —
 * so the full flow (input · scene · data flush · view mutations · layout · render)
 * is captured. Spans print to the console and export over OTLP/HTTP → the
 * collector (→ HyperDX) when enabled (`VITE_INVANA_TELEMETRY_ENABLED !== 'false'`;
 * endpoint via `VITE_INVANA_TELEMETRY_OTLP_HTTP_ENDPOINT`). The tap is torn down
 * with the canvas (`destroy()` → `events.clearTaps()`), so it doesn't leak across
 * stories.
 *
 * NB: the `canvas-store/Playground` story wires its own tracer too, so its spans
 * are duplicated — harmless.
 */
const storyTracer = getCanvasTracer();
onCanvasStoreCreated((store) => {
  createTapTracer(store.events, storyTracer);
});
console.info(
  `[storybook telemetry] tracing every story's canvas → ${
    telemetryInfo.otlpEnabled ? telemetryInfo.endpoint : 'console only'
  }`,
);

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
