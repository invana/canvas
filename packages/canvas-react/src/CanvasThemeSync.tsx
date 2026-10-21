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
// **Two sources.** `source: 'library'` (the default) picks the canvas library's
// palette for the host's theme family. `source: 'tokens'` reads the palette off
// the host page's CSS tokens instead — every role and the categorical ramp — so
// a canvas wears exactly the app's colours, under any theme the app defines.
// The token names default to design-kit's (`--color-background`, `--color-data-1…8`,
// …) and a host renames any of them with `tokens`.
//
// It is one of three inputs to `ThemeBehaviour`, layered by host capability:
// this bridge (React + `<ThemeProvider>`) · `mode: 'document'` (any DOM) ·
// `mode: 'system'` (any).

import { useEffect } from 'react';
import { type ColorRole, readCssColor, type ThemePalette, themeFamily } from '@invana/graph';
import { useThemeOptional } from '@invana/themes';
import { useCanvas } from './CanvasContext';

/**
 * The CSS custom property each palette role is read from, the categorical
 * ramp's, and `extra` palette keys a template may name by key (`warning`).
 */
export type ThemeTokenMap = Record<ColorRole, string> & {
  categorical: readonly string[];
  extra?: Readonly<Record<string, string>>;
};

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
  categorical: [1, 2, 3, 4, 5, 6, 7, 8].map((n) => `--color-data-${n}`),
  // The status colours an annotation card wears.
  extra: {
    warning: '--color-warning',
    success: '--color-success',
    destructive: '--color-destructive',
    primary: '--color-primary',
  },
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
  // An extra key whose token does not resolve is left out — the graph's own fallback stands.
  const extra: Record<string, number> = {};
  for (const [key, token] of Object.entries(tokens.extra ?? {})) {
    const v = readCssColor(`var(${token})`);
    if (v !== undefined) extra[key] = v;
  }
  return { ...extra, ...roles, categorical: tokens.categorical.map((t) => read(t, FALLBACK.accent)) };
}

export interface CanvasThemeSyncProps {
  /** Id of the `ThemeBehaviour` on the target canvas to drive. Default `'theme'`. */
  behaviourId?: string;
  /**
   * Where the palette comes from: the canvas library's for the host's theme
   * family (`'library'`, default), or the host page's CSS tokens (`'tokens'`).
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
export function CanvasThemeSync({ behaviourId = 'theme', source = 'library', tokens }: CanvasThemeSyncProps) {
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
    // The tokens resolve once the theme's class is on `<html>` — the provider
    // applies it in its own effect, after this one — so the read waits a frame.
    const frame = requestAnimationFrame(() => {
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
    });
    return () => cancelAnimationFrame(frame);
    // `variant` is trigger-only: any theme or mode switch re-reads the tokens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
