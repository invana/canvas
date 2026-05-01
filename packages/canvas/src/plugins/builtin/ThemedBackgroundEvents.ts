import { CanvasEvent } from '../../events/base/CanvasEvent.js';
import type { ThemedBackgroundTheme, ThemedBackgroundMode, ThemedBackgroundKind } from './ThemedBackgroundPlugin.js';

/** Origin of a theme switch — what triggered the change. */
export type ThemeSwitchSource = 'initial' | 'manual';

/** Origin of a mode change — what triggered the transition. */
export type ModeUpdateSource = 'manual' | 'system';

// ── themed-background:theme-switched ─────────────────────────────────────────

/**
 * Fired by `ThemedBackgroundPlugin` when the active theme is resolved or changes.
 *
 * - `'initial'` — emitted once on plugin registration.
 * - `'manual'`  — `setTheme()` was called from app code.
 *
 * `resolvedKind` is what's actually painted right now (light or dark) after
 * mode resolution — useful for cross-plugin coordination (e.g. graph node
 * styles flipping with the background).
 */
export class ThemedBackgroundThemeSwitchedEvent extends CanvasEvent {
  declare readonly type: 'themed-background:theme-switched';
  /** The plugin id that owns this themed background. */
  readonly pluginId: string;
  /** The active theme after resolution. */
  readonly theme: ThemedBackgroundTheme;
  /** Currently rendered variant (`'light'` or `'dark'`) after mode resolution. */
  readonly resolvedKind: ThemedBackgroundKind;
  /** What caused the change. */
  readonly source: ThemeSwitchSource;

  constructor(fields: {
    pluginId: string;
    theme: ThemedBackgroundTheme;
    resolvedKind: ThemedBackgroundKind;
    source: ThemeSwitchSource;
  }) {
    super('themed-background:theme-switched');
    this.pluginId = fields.pluginId;
    this.theme = fields.theme;
    this.resolvedKind = fields.resolvedKind;
    this.source = fields.source;
  }
}

// ── themed-background:mode-updated ───────────────────────────────────────────

/**
 * Fired by `ThemedBackgroundPlugin` when its mode transitions (`auto` ↔
 * `light` ↔ `dark`) or when the system preference flips while in `'auto'`
 * mode (which changes `resolvedKind` without changing `mode`).
 *
 * - `'manual'` — `setMode()` was called from app code.
 * - `'system'` — the OS / browser `prefers-color-scheme` media query flipped
 *   while the plugin is in `'auto'` mode.
 */
export class ThemedBackgroundModeUpdatedEvent extends CanvasEvent {
  declare readonly type: 'themed-background:mode-updated';
  /** The plugin id that owns this themed background. */
  readonly pluginId: string;
  /** The new mode. */
  readonly mode: ThemedBackgroundMode;
  /** The mode that was active before the change. */
  readonly previousMode: ThemedBackgroundMode;
  /** Currently rendered variant after this change. */
  readonly resolvedKind: ThemedBackgroundKind;
  /** What caused the change. */
  readonly source: ModeUpdateSource;

  constructor(fields: {
    pluginId: string;
    mode: ThemedBackgroundMode;
    previousMode: ThemedBackgroundMode;
    resolvedKind: ThemedBackgroundKind;
    source: ModeUpdateSource;
  }) {
    super('themed-background:mode-updated');
    this.pluginId = fields.pluginId;
    this.mode = fields.mode;
    this.previousMode = fields.previousMode;
    this.resolvedKind = fields.resolvedKind;
    this.source = fields.source;
  }
}

// ── CanvasEventMap augmentation ──────────────────────────────────────────────
declare module '../../types/events.js' {
  interface CanvasEventMap {
    /** Fired when ThemedBackgroundPlugin's active theme resolves or changes. */
    'themed-background:theme-switched': ThemedBackgroundThemeSwitchedEvent;
    /** Fired when ThemedBackgroundPlugin's mode or resolved kind changes. */
    'themed-background:mode-updated': ThemedBackgroundModeUpdatedEvent;
  }
}
