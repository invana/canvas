// Shared "app shell" for canvas-react stories. Import `<StoryGraphApp>` to wrap a
// graph in the explorer-like chrome (header toolbar + footer stats/message +
// context menus + inspector) every full-featured story needs.

// Generic, use-case-agnostic host — the universal core every preset/story builds
// on (visualiser, modeller, streaming, dynamic-data).
export { StoryCanvasShell } from './StoryCanvasShell';
export type { StoryCanvasShellProps, ShellSlot } from './StoryCanvasShell';

// Batteries-included visualiser preset, built on the core above.
export { StoryGraphApp } from './StoryGraphApp';
export type { StoryGraphAppProps, ShellBehaviours, BehaviourSetting } from './StoryGraphApp';
export type { ToolbarSections } from './shell-toolbar';

// Lower-level pieces, in case a story wants to assemble its own variant.
export {
  defaultBackgroundItems,
  defaultEdgeItems,
  defaultNodeItems,
} from './shell-menus';
export { HeaderThemeToggle, HeaderToolbar } from './shell-toolbar';
export type { HeaderToolbarProps } from './shell-toolbar';
export {
  AutoLayoutBridge,
  CanvasBridge,
  SystemTheme,
  applyChromeTheme,
  osPrefersDark,
} from './shell-bridges';
export {
  ACTIVE_LAYOUT_ID,
  APP_DARK,
  APP_LIGHT,
  APP_OPTIONS,
  type CanvasBackend,
  FORCE_OPTS,
  PALETTE,
} from './shell-config';
