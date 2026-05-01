import type { CanvasPlugin, PluginContext } from '../types.js';
import { BackgroundPlugin, type BackgroundOptions } from './BackgroundPlugin.js';
import {
  ThemedBackgroundThemeSwitchedEvent,
  ThemedBackgroundModeUpdatedEvent,
  type ThemeSwitchSource,
  type ModeUpdateSource,
} from './ThemedBackgroundEvents.js';

/**
 * `'auto'` follows the host's `prefers-color-scheme` media query.
 * `'light'` / `'dark'` pin to that variant.
 */
export type ThemedBackgroundMode = 'auto' | 'light' | 'dark';

/** Concrete variant currently being rendered after mode resolution. */
export type ThemedBackgroundKind = 'light' | 'dark';

/**
 * A named look. Each theme bundles both a `light` and `dark` variant; the
 * plugin's mode picks which one renders.
 */
export interface ThemedBackgroundTheme {
  /** Stable identifier — referenced by `setTheme(id)` and `defaultTheme`. */
  id: string;
  /** Optional human-friendly label for UIs. */
  label?: string;
  /** Style options applied when the resolved kind is `'light'`. */
  light: BackgroundOptions;
  /** Style options applied when the resolved kind is `'dark'`. */
  dark: BackgroundOptions;
}

export interface ThemedBackgroundOptions {
  /**
   * Free-form list of named themes. Must contain at least one entry — the
   * constructor throws otherwise. Optional only so the type matches the
   * generic plugin registration signature.
   */
  themes?: ThemedBackgroundTheme[];
  /** Id of the theme to start with. Defaults to `themes[0].id`. */
  defaultTheme?: string;
  /** Initial mode. Defaults to `'auto'`. */
  mode?: ThemedBackgroundMode;
}

/**
 * ThemedBackgroundPlugin — composes a `BackgroundPlugin` with a list of named
 * themes and a light/dark/auto mode.
 *
 * Each theme bundles both a `light` and `dark` variant. The plugin's `mode`
 * picks which variant renders: `'light'` and `'dark'` pin explicitly, while
 * `'auto'` follows the host's `prefers-color-scheme` media query.
 *
 * **Two-event API.** `'themed-background:theme-switched'` fires whenever the
 * active theme changes (initial registration or via `setTheme()`).
 * `'themed-background:mode-updated'` fires when the mode changes via
 * `setMode()`, or when the system preference flips while in `'auto'`. The
 * inner `BackgroundPlugin` independently emits `'background:updated'` every
 * time the resolved options are pushed into it.
 */
export class ThemedBackgroundPlugin implements CanvasPlugin {
  readonly id: string;

  private _themes: ThemedBackgroundTheme[];
  private _activeId: string;
  private _mode: ThemedBackgroundMode;

  /** Inner renderer — receives resolved options via `setOptions()`. */
  private _inner: BackgroundPlugin;
  private _ctx: PluginContext | null = null;

  // System theme listener — only attached while `_mode === 'auto'`.
  private _mediaQuery: MediaQueryList | null = null;
  private _mediaListener: ((e: MediaQueryListEvent) => void) | null = null;

  constructor(options?: ThemedBackgroundOptions & { key?: string }) {
    const key = options?.key;
    const themes = options?.themes;
    const defaultTheme = options?.defaultTheme;
    const mode = options?.mode;
    this.id = key ?? 'themed-background';

    if (!themes || themes.length === 0) {
      throw new Error(`[ThemedBackgroundPlugin:${this.id}] 'themes' must contain at least one entry.`);
    }
    for (const t of themes) {
      if (!t.light || !t.dark) {
        throw new Error(
          `[ThemedBackgroundPlugin:${this.id}] Theme '${t.id}' must define both 'light' and 'dark' variants.`,
        );
      }
    }

    const startId = defaultTheme ?? themes[0]!.id;
    if (!themes.some(t => t.id === startId)) {
      throw new Error(`[ThemedBackgroundPlugin:${this.id}] Unknown defaultTheme id: '${startId}'.`);
    }

    this._themes = themes;
    this._activeId = startId;
    this._mode = mode ?? 'auto';

    // Inner plugin gets the resolved options up-front so its first render
    // matches the active theme/mode without an extra setOptions cycle.
    this._inner = new BackgroundPlugin({ key: `${this.id}__inner`, ...this._resolveOptions() });
  }

  register(ctx: PluginContext): void {
    this._ctx = ctx;
    this._inner.register(ctx);
    this._wireMediaQuery();
    this._emitThemeSwitched('initial');
  }

  destroy(): void {
    this._detachMediaQuery();
    this._inner.destroy();
    this._ctx = null;
  }

  // ── Public API ────────────────────────────────────────────────────────────

  /**
   * Switch to a specific theme by id. Mode is preserved. Throws when the id
   * is unknown. Emits `'themed-background:theme-switched'`.
   */
  setTheme(id: string): void {
    if (!this._themes.some(t => t.id === id)) {
      throw new Error(`[ThemedBackgroundPlugin:${this.id}] Unknown theme id: '${id}'.`);
    }
    if (id === this._activeId) return;
    this._activeId = id;
    this._inner.setOptions(this._resolveOptions());
    this._emitThemeSwitched('manual');
  }

  /**
   * Set the mode. `'auto'` re-arms system following; `'light'` / `'dark'`
   * pin explicitly. Emits `'themed-background:mode-updated'` when the mode
   * actually changes (and re-resolves the rendered variant).
   */
  setMode(mode: ThemedBackgroundMode): void {
    if (mode === this._mode) return;
    const previous = this._mode;
    this._mode = mode;
    if (mode === 'auto') this._wireMediaQuery();
    else this._detachMediaQuery();
    this._inner.setOptions(this._resolveOptions());
    this._emitModeUpdated(previous, 'manual');
  }

  /** Currently active theme. */
  getActiveTheme(): ThemedBackgroundTheme {
    return this._themes.find(t => t.id === this._activeId)!;
  }

  /** Current mode (`'auto'`, `'light'`, or `'dark'`). */
  getMode(): ThemedBackgroundMode {
    return this._mode;
  }

  /** Concrete variant currently being rendered. */
  getResolvedKind(): ThemedBackgroundKind {
    return this._resolveKind();
  }

  /** Snapshot of the configured theme list. */
  getThemes(): readonly ThemedBackgroundTheme[] {
    return this._themes;
  }

  // ── Internal: resolution ─────────────────────────────────────────────────

  private _resolveKind(): ThemedBackgroundKind {
    if (this._mode === 'light' || this._mode === 'dark') return this._mode;
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  private _resolveOptions(): BackgroundOptions {
    const theme = this.getActiveTheme();
    return this._resolveKind() === 'dark' ? theme.dark : theme.light;
  }

  private _emitThemeSwitched(source: ThemeSwitchSource): void {
    if (!this._ctx) return;
    this._ctx.events.emit(
      'themed-background:theme-switched',
      new ThemedBackgroundThemeSwitchedEvent({
        pluginId: this.id,
        theme: this.getActiveTheme(),
        resolvedKind: this._resolveKind(),
        source,
      }),
    );
  }

  private _emitModeUpdated(previousMode: ThemedBackgroundMode, source: ModeUpdateSource): void {
    if (!this._ctx) return;
    this._ctx.events.emit(
      'themed-background:mode-updated',
      new ThemedBackgroundModeUpdatedEvent({
        pluginId: this.id,
        mode: this._mode,
        previousMode,
        resolvedKind: this._resolveKind(),
        source,
      }),
    );
  }

  // ── Internal: system theme listener ──────────────────────────────────────

  private _wireMediaQuery(): void {
    if (this._mode !== 'auto') {
      this._detachMediaQuery();
      return;
    }
    if (this._mediaQuery) return;
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;

    this._mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this._mediaListener = () => {
      if (this._mode !== 'auto') return;
      // System flip: rendered variant changed, but `mode` itself is unchanged.
      // We still emit mode-updated (with same previous/current mode) so
      // listeners that watch resolvedKind get notified — that's the signal
      // they actually care about.
      this._inner.setOptions(this._resolveOptions());
      this._emitModeUpdated(this._mode, 'system');
    };
    this._mediaQuery.addEventListener('change', this._mediaListener);
  }

  private _detachMediaQuery(): void {
    if (this._mediaQuery && this._mediaListener) {
      this._mediaQuery.removeEventListener('change', this._mediaListener);
    }
    this._mediaQuery = null;
    this._mediaListener = null;
  }
}
