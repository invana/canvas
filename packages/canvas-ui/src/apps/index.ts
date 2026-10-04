// App (batteries-included composition) — `GraphCanvasApp`, one composable graph
// app. The header / main / footer regions are an internal detail; configure them
// through the `header` / `main` / `footer` option bags (+ slots) on
// `GraphCanvasAppProps` — never by rendering the regions yourself, so the
// orchestrator's runtime wiring stays private.
export { GraphCanvasApp } from './GraphCanvasApp';
// The bundle's opinionated default `CanvasConfig` — reuse it as shared defaults
// across `<GraphCanvasApp>` instances (`deepMerge(graphCanvasAppBaseConfig, {…})`).
export { BASE_CONFIG as graphCanvasAppBaseConfig } from './GraphCanvasAppRoot';
// Reusable host-theme → engine-`ThemeBehaviour` bridge; drop inside any canvas
// (incl. nested) whose rendered theme should follow the app's light/dark toggle.
export type {
  GraphCanvasAppProps,
  GraphCanvasAppSectionOptions,
  RegionSlot,
  BottomSpan,
} from './GraphCanvasApp';
// The engine half on its own — for hosts that lay the canvas out themselves (a
// board, a split view). `GraphCanvasApp` is these two plus `AppLayoutV2`.
export { GraphCanvasAppRoot, GraphCanvasAppSurface, useGraphCanvasApp } from './GraphCanvasAppRoot';
export type {
  GraphCanvasAppRootProps,
  GraphCanvasAppSurfaceProps,
  GraphCanvasAppControlContext,
  ThemeKind,
} from './GraphCanvasAppRoot';
export type { GraphCanvasAppHeaderOptions } from './GraphCanvasAppHeader';
export type { GraphCanvasAppFooterOptions } from './GraphCanvasAppFooter';

/**
 * @deprecated Import from `@invana/canvas-react` instead — `CanvasThemeSync`
 * renders no UI, so it belongs with the headless bindings. Re-exported here so
 * existing `@invana/canvas-ui` consumers keep working.
 */
export { CanvasThemeSync } from '@invana/canvas-react';
export type { CanvasThemeSyncProps } from '@invana/canvas-react';
