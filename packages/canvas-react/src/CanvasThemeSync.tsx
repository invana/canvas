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
// It is one of three inputs to `ThemeBehaviour`, layered by host capability:
// this bridge (React + `<ThemeProvider>`) · `mode: 'document'` (any DOM) ·
// `mode: 'system'` (any).

import { useEffect } from 'react';
import { themeFamily } from '@invana/graph';
import { useThemeOptional } from '@invana/themes';
import { useCanvas } from './CanvasContext';

export interface CanvasThemeSyncProps {
  /** Id of the `ThemeBehaviour` on the target canvas to drive. Default `'theme'`. */
  behaviourId?: string;
}

/**
 * Syncs the context canvas's `ThemeBehaviour` to the host `@invana/themes` theme
 * (resolved light/dark kind + theme family). Renders `null`. Place it inside the
 * canvas whose theme should follow the host toggle.
 */
export function CanvasThemeSync({ behaviourId = 'theme' }: CanvasThemeSyncProps) {
  const canvas = useCanvas();
  const theme = useThemeOptional();
  const mode = theme ? (theme.isDark ? 'dark' : 'light') : undefined;
  const active = theme ? themeFamily(theme.theme) : undefined;
  useEffect(() => {
    if (!mode) return;
    // Declarative store patch → `view.definition.behaviours[behaviourId]` → the
    // theme behaviour's `setOptions`, which republishes the palette.
    canvas.update({ behaviours: { [behaviourId]: { mode, active } } });
  }, [canvas, behaviourId, mode, active]);
  return null;
}
