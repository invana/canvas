import { Graphics, Container, Texture, TilingSprite } from 'pixi.js';
import type { CanvasPlugin, PluginContext } from '../types.js';
import {
  BackgroundThemeSwitchedEvent,
  BackgroundOptionsUpdatedEvent,
  BackgroundModeUpdatedEvent,
  type ThemeSwitchSource,
} from './BackgroundEvents.js';

export type BackgroundType = 'solid' | 'pattern';
export type PatternType = 'dots' | 'grid' | 'lines';

/**
 * `'auto'` follows the host's `prefers-color-scheme` media query.
 * `'manual'` pins to whatever was last passed to `setTheme()` (or no theme).
 */
export type ThemeMode = 'auto' | 'manual';

/**
 * Bridge between a free-form theme id and the OS's binary
 * `prefers-color-scheme` signal. Every theme declares one.
 */
export type ThemeKind = 'light' | 'dark';

/**
 * A named, kinded style preset. The plugin keeps a list of these and picks
 * one at a time based on `mode` and (in `'auto'` mode) the system preference.
 */
export interface BackgroundTheme {
  /** Stable identifier — referenced by `setTheme(id)`. */
  id: string;
  /** Which `prefers-color-scheme` value this theme satisfies. */
  kind: ThemeKind;
  /** Optional human-friendly label for UIs. */
  label?: string;
  /** Style overrides layered on top of base options when this theme is active. */
  options: Partial<BackgroundOptions>;
}

export interface BackgroundOptions {
  type?: BackgroundType;
  patternType?: PatternType;
  color?: string | number;
  backgroundColor?: string | number;
  size?: number;
  spacing?: number;
  alpha?: number;
  /**
   * When true the tiling pattern shifts and scales with the camera so the
   * background feels like part of the world. When false (default) the pattern
   * is fixed to the screen.
   */
  followCamera?: boolean;
  /**
   * `'auto'` (default) tracks `prefers-color-scheme`; `'manual'` uses the
   * last `setTheme()` selection (or no theme if none was set). Only relevant
   * when `themes` is non-empty.
   */
  mode?: ThemeMode;
  /**
   * Free-form list of named themes. Auto-resolution picks the first theme
   * whose `kind` matches the system preference, so list order = precedence.
   * Leave empty (or unset) to disable theming entirely.
   */
  themes?: BackgroundTheme[];
}

/** Style-only options — what `setOptions()` accepts. Theme controls live elsewhere. */
type BackgroundStyleOptions = Omit<BackgroundOptions, 'themes' | 'mode'>;

const DEFAULT_OPTIONS: Required<BackgroundStyleOptions> = {
  type: 'solid',
  patternType: 'dots',
  color: '#595959',
  backgroundColor: '#1a1a2e',
  size: 1.5,
  spacing: 30,
  alpha: 0.6,
  followCamera: false,
};

/**
 * BackgroundPlugin — renders a solid color or tiled pattern background.
 *
 * Screen-space: unaffected by camera pan/zoom (unless `followCamera=true`).
 *
 * **Theme system.** Pass a `themes` list to make the background responsive
 * to the host's `prefers-color-scheme` signal. Each theme is `kind`-tagged
 * (`'light'` / `'dark'`); the first theme matching the current system kind
 * wins. Use `setTheme(id)` to override manually (which flips the plugin into
 * `'manual'` mode), and `setMode('auto')` to re-arm system following.
 *
 * **Two-event API.** `'background:theme-switched'` fires whenever the active
 * theme resolves or changes (initial, system, or manual). `'background:options-updated'`
 * fires only when `setOptions()` is called for explicit base-style changes.
 * The two are orthogonal so listeners can subscribe to whichever they care about.
 */
export class BackgroundPlugin implements CanvasPlugin {
  readonly id: string;

  /** Base style options. Theme overrides layer on top of these at render. */
  private _base: Required<BackgroundStyleOptions>;
  /** Configured themes, in declaration (= precedence) order. */
  private _themes: BackgroundTheme[];
  /** `'auto'` follows system; `'manual'` pins `_activeTheme`. */
  private _mode: ThemeMode;
  /** Currently applied theme, or `null` when no theme is in effect. */
  private _activeTheme: BackgroundTheme | null = null;
  /** Cached merge of `_base + _activeTheme.options` used by `_render()`. */
  private _resolved!: Required<BackgroundStyleOptions>;

  private _layer: Container | null = null;
  private _ctx: PluginContext | null = null;
  private _tilingSprite: TilingSprite | null = null;

  // Camera state for followCamera mode
  private _camX = 0;
  private _camY = 0;
  private _camScale = 1;

  // System theme listener — only attached while `_mode === 'auto'`.
  private _mediaQuery: MediaQueryList | null = null;
  private _mediaListener: ((e: MediaQueryListEvent) => void) | null = null;

  constructor(options: BackgroundOptions & { key?: string } = {}) {
    const { key, themes, mode, ...style } = options;
    this.id = key ?? 'background';
    this._base = { ...DEFAULT_OPTIONS, ...style };
    this._themes = themes ?? [];
    this._mode = mode ?? 'auto';
    this._activeTheme = this._mode === 'auto' ? this._resolveAuto() : null;
    this._resolved = this._mergeResolved();
  }

  register(ctx: PluginContext): void {
    this._ctx = ctx;
    this._layer = ctx.createScreenLayer({ id: `${this.id}-layer`, zIndex: -1000 });
    this._render();
    this._wireCamera(ctx);
    this._wireMediaQuery();
    this._emitThemeSwitched('initial');
  }

  // ── Public API ────────────────────────────────────────────────────────────

  /**
   * Update base style options (color, size, spacing, etc). Does **not**
   * affect themes or mode. Emits `'background:options-updated'`.
   */
  setOptions(changes: Partial<BackgroundStyleOptions>): void {
    this._base = { ...this._base, ...changes };
    this._resolved = this._mergeResolved();
    this._render();
    if (!this._ctx) return;
    this._ctx.events.emit(
      'background:options-updated',
      new BackgroundOptionsUpdatedEvent({
        pluginId: this.id,
        options: { ...this._base },
        changes: { ...changes },
      }),
    );
  }

  /**
   * Switch to a specific theme by id and flip into `'manual'` mode (so the
   * system listener stops driving the theme). Throws when the id is unknown.
   * Emits `'background:theme-switched'`, plus `'background:mode-updated'`
   * if this also caused a mode transition.
   */
  setTheme(id: string): void {
    const next = this._themes.find(t => t.id === id);
    if (!next) {
      throw new Error(`[BackgroundPlugin:${this.id}] Unknown theme id: '${id}'.`);
    }
    this._setMode('manual');
    this._applyTheme(next, 'manual');
  }

  /**
   * Toggle between `'auto'` (system-driven) and `'manual'` (pinned to the
   * last `setTheme()` selection). Emits `'background:mode-updated'` when the
   * mode actually changes, and `'background:theme-switched'` when switching
   * back to `'auto'` re-resolves a different theme.
   */
  setMode(mode: ThemeMode): void {
    if (mode === this._mode) return;
    this._setMode(mode);
    if (mode === 'auto') {
      this._applyTheme(this._resolveAuto(), 'manual');
    }
  }

  /** Currently active theme, or `null` when none is applied. */
  getActiveTheme(): BackgroundTheme | null {
    return this._activeTheme;
  }

  /** Current mode (`'auto'` or `'manual'`). */
  getMode(): ThemeMode {
    return this._mode;
  }

  /** Snapshot of the configured theme list. */
  getThemes(): readonly BackgroundTheme[] {
    return this._themes;
  }

  destroy(): void {
    this._detachMediaQuery();
    if (this._layer) this._layer.removeChildren();
    this._tilingSprite = null;
  }

  // ── Internal: theme resolution ───────────────────────────────────────────

  /** Pick the first theme whose `kind` matches the current system preference. */
  private _resolveAuto(): BackgroundTheme | null {
    if (this._themes.length === 0) return null;
    const systemKind: ThemeKind = this._detectSystemKind();
    return this._themes.find(t => t.kind === systemKind) ?? null;
  }

  private _detectSystemKind(): ThemeKind {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return 'light';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  private _mergeResolved(): Required<BackgroundStyleOptions> {
    if (!this._activeTheme) return { ...this._base };
    return { ...this._base, ...this._activeTheme.options };
  }

  private _applyTheme(next: BackgroundTheme | null, source: ThemeSwitchSource): void {
    const changed = next?.id !== this._activeTheme?.id;
    this._activeTheme = next;
    this._resolved = this._mergeResolved();
    this._render();
    if (changed) this._emitThemeSwitched(source);
  }

  private _emitThemeSwitched(source: ThemeSwitchSource): void {
    if (!this._ctx) return;
    this._ctx.events.emit(
      'background:theme-switched',
      new BackgroundThemeSwitchedEvent({
        pluginId: this.id,
        theme: this._activeTheme,
        kind: this._activeTheme?.kind ?? null,
        source,
      }),
    );
  }

  /**
   * Single chokepoint for mode mutation. Updates internal state, attaches or
   * detaches the system listener as needed, and emits `'background:mode-updated'`
   * when the mode actually changes. No-op when the mode is already `next`.
   */
  private _setMode(next: ThemeMode): void {
    if (next === this._mode) return;
    const previous = this._mode;
    this._mode = next;
    if (next === 'auto') this._wireMediaQuery();
    else this._detachMediaQuery();
    if (this._ctx) {
      this._ctx.events.emit(
        'background:mode-updated',
        new BackgroundModeUpdatedEvent({ pluginId: this.id, mode: next, previousMode: previous }),
      );
    }
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
      this._applyTheme(this._resolveAuto(), 'system');
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

  // ── Internal: camera & rendering ─────────────────────────────────────────

  private _wireCamera(ctx: PluginContext): void {
    ctx.events.on('camera:pan', ({ x, y }) => {
      this._camX = x;
      this._camY = y;
      this._syncTileTransform();
    });
    ctx.events.on('camera:zoom', ({ scale, center }) => {
      this._camScale = scale;
      this._camX = center.x;
      this._camY = center.y;
      this._syncTileTransform();
    });
  }

  private _syncTileTransform(): void {
    if (!this._tilingSprite || !this._resolved.followCamera) return;
    const s = this._camScale;
    this._tilingSprite.tileScale.set(s, s);
    this._tilingSprite.tilePosition.set(this._camX % (this._resolved.spacing * s), this._camY % (this._resolved.spacing * s));
  }

  private _render(): void {
    if (!this._layer || !this._ctx) return;
    this._layer.removeChildren();
    this._tilingSprite = null;

    const canvas = this._ctx.canvasElement;
    const w = canvas.clientWidth || 800;
    const h = canvas.clientHeight || 600;

    const bg = new Graphics();
    bg.rect(0, 0, w, h).fill(this._resolved.backgroundColor);
    this._layer.addChild(bg);

    if (this._resolved.type === 'solid') return;

    const patternTexture = this._createPatternTexture();
    const tiling = new TilingSprite({ texture: patternTexture, width: w, height: h });
    tiling.alpha = this._resolved.alpha;
    this._tilingSprite = tiling;
    this._layer.addChild(tiling);
    this._syncTileTransform();
  }

  private _createPatternTexture(): Texture {
    const { patternType, color, size, spacing } = this._resolved;

    const offscreen = document.createElement('canvas');
    offscreen.width = spacing;
    offscreen.height = spacing;
    const ctx = offscreen.getContext('2d')!;

    const colorStr =
      typeof color === 'number'
        ? `#${color.toString(16).padStart(6, '0')}`
        : (color as string);

    ctx.fillStyle = colorStr;

    if (patternType === 'dots') {
      ctx.beginPath();
      ctx.arc(spacing / 2, spacing / 2, size, 0, Math.PI * 2);
      ctx.fill();
    } else if (patternType === 'grid') {
      ctx.fillRect(0, 0, spacing, 1);
      ctx.fillRect(0, 0, 1, spacing);
    } else {
      ctx.fillRect(0, 0, spacing, 1);
    }

    return Texture.from(offscreen);
  }
}
