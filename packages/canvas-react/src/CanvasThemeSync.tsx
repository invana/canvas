// CanvasThemeSync — the reusable bridge between the host `@invana/themes` theme
// and a canvas's engine `ThemeBehaviour`. It is the single glue point between two
// independent state systems: the app theme (React context, `@invana/themes`) and
// the canvas store (`view.definition.behaviours.theme`).
//
// It **listens to the theme hook** (`useThemeOptional`) — so React's own context
// subscription drives the update, no `MutationObserver` — and, on any change,
// writes the resolved light/dark mode + theme family into the context canvas via
// a declarative store patch (`canvas.update`). `ThemeBehaviour` then republishes
// the palette and every theme-aware layer recolours.
//
// Renders `null`. Drop it inside any `<Canvas>` / `<GraphCanvas>` whose rendered
// theme should follow the app toggle — including nested canvases (each binds to
// its *nearest* engine via context), which is why it's a shared component rather
// than per-view wiring. No-ops without a `<ThemeProvider>` ancestor.
//
// Lives in canvas-react, not canvas-ui: it renders no UI, it adapts a host signal
// to the engine. It is deliberately a **separate component** rather than a prop on
// `<ThemeBehaviour>` — every wrapper in this package holds `Props ≡ engine
// options`, and a React-only prop could neither round-trip through the
// serialisable `view.definition` nor be shown by the settings editor. It is also
// not an engine `Behaviour`: a registered class is not in the React tree and could
// never read `useThemeOptional()`.
//
// **Two sources.** `source: 'tokens'` (the default) reads the palette off the
// host page's CSS tokens — every role and the categorical ramp — so a canvas wears
// exactly the app's colours under **any** theme family the app defines, present or
// future, with nothing registered per family. The token names default to
// design-kit's (`--color-background`, `--color-data-<hue>`, …) and a host renames
// any of them with `tokens`. `source: 'library'` instead picks the canvas
// library's own palette for the host's family — it knows only the families
// `@invana/graph` ships (`default` · `forest` · `ocean` · `gold` · `rose` ·
// `minimal`); any other family falls back to the pinned `active`.
//
// It is one of three inputs to `ThemeBehaviour`, layered by host capability:
// this bridge (React + `<ThemeProvider>`) · `mode: 'document'` (any DOM) ·
// `mode: 'system'` (any).

import { useEffect } from 'react';
import { type ColorRole, readCssColor, type ThemePalette, themeFamily } from '@invana/graph';
import { useThemeOptional } from '@invana/themes';
import { useCanvas } from './CanvasContext';

/** The CSS custom property each palette role is read from, and the categorical ramp's. */
export type ThemeTokenMap = Record<ColorRole, string> & { categorical: readonly string[] };

/** Design-kit's token names. */
export const DESIGN_KIT_TOKENS: ThemeTokenMap = {
  surface: '--color-background',
  cardBg: '--color-card',
  foreground: '--color-foreground',
  heading: '--color-card-foreground',
  muted: '--color-muted-foreground',
  accent: '--color-primary',
  divider: '--color-border',
  stroke: '--color-input',
  selectionRing: '--color-ring',
  hoverRing: '--color-primary',
  categorical: ['blue', 'orange', 'aqua', 'yellow', 'magenta', 'green', 'violet', 'red'].map((h) => `--color-data-${h}`),
};

/** Fallbacks for a role whose token does not resolve (no DOM yet, an older theme). */
const FALLBACK: Record<ColorRole, number> = {
  surface: 0x181a1b,
  cardBg: 0x222425,
  foreground: 0xd9d9d9,
  heading: 0xd9d9d9,
  muted: 0x646b73,
  accent: 0x52e086,
  divider: 0x35383b,
  stroke: 0x35383b,
  selectionRing: 0x52e086,
  hoverRing: 0x52e086,
};

/** The host page's palette, read from its live CSS tokens. */
export function readTokenPalette(tokens: ThemeTokenMap = DESIGN_KIT_TOKENS): ThemePalette {
  const read = (name: string, fallback: number) => readCssColor(`var(${name})`) ?? fallback;
  const roles = Object.fromEntries(
    (Object.keys(FALLBACK) as ColorRole[]).map((role) => [role, read(tokens[role], FALLBACK[role])]),
  ) as Record<ColorRole, number>;
  return { ...roles, categorical: tokens.categorical.map((t) => read(t, FALLBACK.accent)) };
}

export interface CanvasThemeSyncProps {
  /** Id of the `ThemeBehaviour` on the target canvas to drive. Default `'theme'`. */
  behaviourId?: string;
  /**
   * Where the palette comes from: the host page's CSS tokens (`'tokens'`,
   * default — every family the design kit defines, now or later), or the canvas
   * library's built-in palette for the host's theme family (`'library'` — six
   * families only).
   */
  source?: 'library' | 'tokens';
  /** With `source: 'tokens'`: token names over {@link DESIGN_KIT_TOKENS}. */
  tokens?: Partial<ThemeTokenMap>;
}

/**
 * Syncs the context canvas's `ThemeBehaviour` to the host `@invana/themes` theme
 * (resolved light/dark kind + theme family). Renders `null`. Place it inside the
 * canvas whose theme should follow the host toggle.
 *
 * While a `<ThemeProvider>` is present it also registers the `theme.toggle`
 * command (active while dark), so a control panel can flip the host theme.
 */
export function CanvasThemeSync({ behaviourId = 'theme', source = 'tokens', tokens }: CanvasThemeSyncProps) {
  const canvas = useCanvas();
  const theme = useThemeOptional();
  const mode = theme ? (theme.isDark ? 'dark' : 'light') : undefined;
  const active = theme ? themeFamily(theme.theme) : undefined;
  const variant = theme?.variantId;
  const tokenKey = JSON.stringify(tokens ?? {});
  useEffect(() => {
    if (!mode) return;
    if (source === 'library') {
      // Declarative store patch → `view.definition.behaviours[behaviourId]` → the
      // theme behaviour's `setOptions`, which republishes the palette.
      canvas.update({ behaviours: { [behaviourId]: { mode, active } } });
      return;
    }
    const push = (): void => {
      const palette = readTokenPalette({ ...DESIGN_KIT_TOKENS, ...(JSON.parse(tokenKey) as Partial<ThemeTokenMap>) });
      canvas.update({
        behaviours: {
          [behaviourId]: {
            themes: { host: { name: 'host', light: palette, dark: palette } },
            active: 'host',
            mode,
          },
        },
      });
    };
    // The tokens resolve once the theme's class is on `<html>`. When something
    // already wrote it (a first-paint writer, or an earlier pass) the variant
    // matches and the read is correct *now* — no frame of the wrong palette.
    // Otherwise the provider writes it in its own effect, after this one, so the
    // read waits a frame.
    if (variant && document.documentElement.getAttribute('data-theme') === variant) {
      push();
      return;
    }
    const frame = requestAnimationFrame(push);
    return () => cancelAnimationFrame(frame);
    // `variant`: any theme or mode switch re-reads the tokens.
  }, [canvas, behaviourId, mode, active, source, tokenKey, variant]);

  // `theme.toggle` flips the **host** theme (the engine follows through the
  // effect above), so a saved control panel can carry the theme switch on any
  // root that mounts this bridge. Re-registered when the mode flips, so a bound
  // toggle re-reads `isActive`.
  const toggleMode = theme?.toggleMode;
  const isDark = theme?.isDark ?? false;
  useEffect(() => {
    if (!toggleMode) return;
    return canvas.commands.register('theme.toggle', {
      label: 'Toggle theme',
      run: () => toggleMode(),
      isActive: () => isDark,
    });
  }, [canvas, toggleMode, isDark]);
  return null;
}
