import { useEffect, useRef } from 'react';
import type { Preview } from '@storybook/react-vite';
import { themes, getThemeById, getThemeVariantById } from '@invana/styling/themes';
import { ThemeProvider, useTheme, type ThemeMode } from '@invana/themes';

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

// ─── Theme toolbar ────────────────────────────────────────────────────────────
//
// Two orthogonal globals — **Theme** (the family) × **Variant** (the mode) —
// mirroring the design-kit repo's own Storybook. Every family registered in
// `@invana/styling` (classic: Invana / Tailwind / Vite; colour presets: Gold /
// Ocean / Forest / Rose / Minimal) varies by light / dark / system, so a single
// flat list would be 24 unusable entries; composing `<theme>-<variant>` keeps
// both dropdowns short. All of those families are already compiled into the
// bundle by `./tailwind.css` (`presets-base.css` + `presets.css`) — before this
// toolbar existed they were shipped to the browser and unreachable.
//
// The selection reaches the stories through **one `<ThemeProvider>` mounted by
// the decorator** — never by mutating `document` from here. The provider's own
// effect calls `applyTheme()`, which owns the whole document mutation (it swaps
// every `theme-*` class, sets `data-theme`, adds `light`/`dark`, and arms or
// disarms its own `prefers-color-scheme` listener for `system` mode). One writer
// of `data-theme`, so nothing races on an OS appearance change. CSS custom
// properties inherit into Radix portals, so popovers / dropdown menus pick up the
// active theme too.
//
// **Stories must not mount their own `<ThemeProvider>`.** An inner provider
// shadows this one and is seeded only at mount, so the story would freeze on
// whatever was selected when it mounted — the defect that made every
// `GraphCanvasApp` story need a page refresh. The deliberate exception is a story
// that pins its own theme with `storageKey={null}`, which declares
// `parameters: { selfThemed: true }` and gets no provider from here at all.
//
// See `docs/rfcs/feat/2026-09-11-storybook-cannot-switch-theme-or-mode.md` and
// `docs/rfcs/fix/2026-09-11-toolbar-theme-never-reaches-mounted-providers.md`.

/**
 * Mode items for the Variant toolbar. Matches `ThemeVariant['mode']`. The icons
 * are pinned `as const` because Storybook's `ToolbarItem.icon` is a closed union
 * of its own icon set, which a widened `string` doesn't satisfy — but the array
 * itself stays mutable, since `items` is typed `(string | ToolbarItem)[]`.
 */
const variantItems = [
  { value: 'light', title: 'Light', icon: 'sun' as const },
  { value: 'dark', title: 'Dark', icon: 'moon' as const },
  { value: 'system', title: 'System', icon: 'circle' as const },
];

/** The first registered family (`default` — Invana) is the fallback everywhere. */
const DEFAULT_THEME_ID = themes[0]?.id ?? 'default';

/**
 * The `mode` to hand `<ThemeProvider>` for a toolbar selection.
 *
 * `system` always resolves — the provider maps it through `prefers-color-scheme`.
 * A concrete mode is passed through only when the family actually registers that
 * variant; otherwise we fall back to the family's **own** first variant, so a
 * single-mode family lands on its own palette rather than on the provider's
 * `default-light` last resort.
 */
function resolveMode(themeId: string, variant: string): ThemeMode {
  if (variant === 'system') return 'system';
  if (getThemeVariantById(`${themeId}-${variant}`)) return variant as ThemeMode;
  const fallback = getThemeById(themeId)?.variants[0]?.id?.slice(themeId.length + 1);
  return fallback === 'dark' ? 'dark' : 'light';
}

/**
 * Pushes the toolbar selection into the surrounding `<ThemeProvider>` through its
 * public `setTheme` / `setMode` — the same API a `<ThemeSelector>` drives. Renders
 * `null`.
 *
 * `<ThemeProvider>` is uncontrolled: `theme` / `mode` are seeded once in `useState`
 * initialisers, so `defaultTheme` / `defaultMode` are a **mount-time seed, not an
 * input**, and a later toolbar change can reach it only this way. A keyed remount
 * would also work and is deliberately not used: `beforeEach` drains
 * `onStoryTeardown` per *story*, not per remount, so every theme switch would leak
 * a live `Canvas` + pixi context.
 *
 * The last pushed selection is tracked in a ref rather than compared against the
 * provider's current value, so this bridge reacts to **toolbar** changes only — a
 * theme picked inside a story (a `<ThemeSelector>`) sticks instead of being
 * reverted on the bridge's next render.
 */
function ToolbarThemeBridge({ theme, mode }: { theme: string; mode: ThemeMode }) {
  const { setTheme, setMode } = useTheme();
  // Seeded with the mount-time selection, which `defaultTheme`/`defaultMode` have
  // already applied — so mounting pushes nothing and there is no first-frame flash.
  const pushed = useRef({ theme, mode });
  useEffect(() => {
    if (pushed.current.theme !== theme) {
      pushed.current.theme = theme;
      setTheme(theme);
    }
    if (pushed.current.mode !== mode) {
      pushed.current.mode = mode;
      setMode(mode);
    }
  }, [theme, mode, setTheme, setMode]);
  return null;
}

// Telemetry is wired per-consumer, not globally here — see
// `stories/canvas-ui/view-panels/LayersViewPanel.stories.tsx` for the canonical
// `otelTelemetry(...)` + `wireTelemetry(...)` wiring on a live canvas. (The
// `canvas-store/Playground` story wires its own tracer via `stories/canvas-store/otel.ts`.)

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
    // The active theme owns the backdrop — `global.css` paints `#storybook-root`
    // from `--color-background`. The `backgrounds` toolbar was a second, fully
    // independent appearance control whose hardcoded hexes could contradict the
    // theme (it defaulted to a `#242426` dark backdrop regardless of mode).
    backgrounds: {
      disable: true,
    },
    docs: {
      codePanel: true,
      source: {
        type: 'auto',
        transform: (src: string) => extractPlayBody(src),
      },
    },
  },

  globalTypes: {
    theme: {
      description: 'Design-kit theme family',
      defaultValue: DEFAULT_THEME_ID,
      toolbar: {
        title: 'Theme',
        icon: 'paintbrush',
        items: themes.map((theme) => ({
          value: theme.id,
          title: theme.name,
          icon: 'paintbrush' as const,
        })),
        dynamicTitle: true,
      },
    },
    variant: {
      description: 'Theme variant — mode (light/dark/system)',
      defaultValue: 'system',
      toolbar: {
        title: 'Variant',
        icon: 'circle',
        items: variantItems,
        dynamicTitle: true,
      },
    },
  },

  decorators: [
    (Story, context) => {
      // Stories that pin their own theme (they mount a `<ThemeProvider>` with
      // persistence disabled) opt out entirely, so the toolbar doesn't imply
      // control it doesn't have.
      if (context.parameters?.selfThemed) {
        return <Story />;
      }

      const themeId = (context.globals.theme as string | undefined) ?? DEFAULT_THEME_ID;
      const variant = (context.globals.variant as string | undefined) ?? 'system';
      const mode = resolveMode(themeId, variant);

      // `storageKey={null}`: the toolbar globals are the source of truth (Storybook
      // persists those itself), so nothing here reads or writes `invana-theme` — this
      // Storybook can't disagree with, or clobber, a design-kit app on the same origin.
      return (
        <ThemeProvider storageKey={null} defaultTheme={themeId} defaultMode={mode}>
          <ToolbarThemeBridge theme={themeId} mode={mode} />
          <Story />
        </ThemeProvider>
      );
    },
  ],
};

export default preview;
