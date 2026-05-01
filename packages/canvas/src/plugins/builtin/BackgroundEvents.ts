import { CanvasEvent } from '../../events/base/CanvasEvent.js';
import type { BackgroundOptions, BackgroundTheme, ThemeKind, ThemeMode } from './BackgroundPlugin.js';

/** Origin of a theme switch — what triggered the change. */
export type ThemeSwitchSource = 'initial' | 'system' | 'manual';

// ── background:theme-switched ────────────────────────────────────────────────

/**
 * Fired by `BackgroundPlugin` when the active theme is resolved or changes.
 *
 * - `'initial'` — emitted once on plugin registration.
 * - `'system'`  — the OS / browser `prefers-color-scheme` media query changed
 *   while the plugin is in `'auto'` mode.
 * - `'manual'`  — `setTheme()` or `setMode()` was called from app code.
 *
 * `theme` is `null` when no theme matched the current system kind (or no
 * themes were configured at all). `kind` mirrors the active theme's kind.
 */
export class BackgroundThemeSwitchedEvent extends CanvasEvent {
  declare readonly type: 'background:theme-switched';
  /** The plugin id that owns this background (defaults to `'background'`). */
  readonly pluginId: string;
  /** The active theme after resolution, or `null` if none applied. */
  readonly theme: BackgroundTheme | null;
  /** Kind of the active theme, or `null` if no theme is active. */
  readonly kind: ThemeKind | null;
  /** What caused the change. */
  readonly source: ThemeSwitchSource;

  constructor(fields: {
    pluginId: string;
    theme: BackgroundTheme | null;
    kind: ThemeKind | null;
    source: ThemeSwitchSource;
  }) {
    super('background:theme-switched');
    this.pluginId = fields.pluginId;
    this.theme = fields.theme;
    this.kind = fields.kind;
    this.source = fields.source;
  }
}

// ── background:options-updated ───────────────────────────────────────────────

/**
 * Fired by `BackgroundPlugin` when `setOptions()` is called from app code.
 *
 * Use `changes` for cheap "did key X change?" checks; use `options` for the
 * full resolved base configuration after the update. Theme-driven changes
 * fire `background:theme-switched` instead — these two events are orthogonal.
 */
export class BackgroundOptionsUpdatedEvent extends CanvasEvent {
  declare readonly type: 'background:options-updated';
  /** The plugin id that owns this background. */
  readonly pluginId: string;
  /** Full base options after the update (themes still layer on top at render). */
  readonly options: Required<Omit<BackgroundOptions, 'themes' | 'mode'>>;
  /** The partial passed to `setOptions()` — only the keys the caller touched. */
  readonly changes: Partial<BackgroundOptions>;

  constructor(fields: {
    pluginId: string;
    options: Required<Omit<BackgroundOptions, 'themes' | 'mode'>>;
    changes: Partial<BackgroundOptions>;
  }) {
    super('background:options-updated');
    this.pluginId = fields.pluginId;
    this.options = fields.options;
    this.changes = fields.changes;
  }
}

// ── background:mode-updated ──────────────────────────────────────────────────

/**
 * Fired by `BackgroundPlugin` when its `ThemeMode` transitions between
 * `'auto'` and `'manual'`. Two paths trigger it:
 *
 * - Direct: `setMode('auto' | 'manual')` with a different value than current.
 * - Indirect: `setTheme(id)` while currently in `'auto'` flips the plugin
 *   into `'manual'` as a side effect.
 *
 * Not fired on register (initial mode is configured, not transitioned) nor
 * when `setMode()` is called with the current mode (no-op).
 */
export class BackgroundModeUpdatedEvent extends CanvasEvent {
  declare readonly type: 'background:mode-updated';
  /** The plugin id that owns this background. */
  readonly pluginId: string;
  /** The new mode. */
  readonly mode: ThemeMode;
  /** The mode that was active before the change. */
  readonly previousMode: ThemeMode;

  constructor(fields: { pluginId: string; mode: ThemeMode; previousMode: ThemeMode }) {
    super('background:mode-updated');
    this.pluginId = fields.pluginId;
    this.mode = fields.mode;
    this.previousMode = fields.previousMode;
  }
}

// ── CanvasEventMap augmentation ──────────────────────────────────────────────
// Plugin-owned events register themselves into the canvas event map via module
// augmentation, mirroring the convention used by external plugins (see
// `packages/plugins-shapes/src/events-augment.ts`).
declare module '../../types/events.js' {
  interface CanvasEventMap {
    /** Fired when BackgroundPlugin's active theme resolves or changes */
    'background:theme-switched': BackgroundThemeSwitchedEvent;
    /** Fired when BackgroundPlugin's base options are updated via setOptions() */
    'background:options-updated': BackgroundOptionsUpdatedEvent;
    /** Fired when BackgroundPlugin's ThemeMode transitions between 'auto' and 'manual' */
    'background:mode-updated': BackgroundModeUpdatedEvent;
  }
}
