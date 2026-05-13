/**
 * `ThemedBackgroundLayer` — `BackgroundLayer` extended with named themes and
 * a light / dark / auto mode.
 *
 * Each theme bundles both a `light` and `dark` variant. The layer's `mode`
 * picks which variant renders: `'light'` and `'dark'` pin explicitly, while
 * `'auto'` follows the host's `prefers-color-scheme` media query.
 *
 * Theme switches and mode flips fire layer-scoped events so app-level UI
 * (theme picker, mode toggle) can react.
 *
 * @example
 * ```ts
 * canvas.layers.add(new ThemedBackgroundLayer({
 *   id: 'bg',
 *   options: {
 *     themes: [
 *       {
 *         id: 'graph-paper',
 *         light: { type: 'pattern', patternType: 'dots', backgroundColor: '#f8fafc', color: '#94a3b8' },
 *         dark:  { type: 'pattern', patternType: 'dots', backgroundColor: '#0f172a', color: '#475569' },
 *       },
 *     ],
 *     mode: 'auto',
 *   },
 * }));
 * ```
 */

import type { CanvasContext } from '../context/CanvasContext';
import type { LayerOptions } from './Layer';
import { BackgroundLayer, type BackgroundLayerOptions } from './BackgroundLayer';

/**
 * Mode selector. `'auto'` follows `prefers-color-scheme`; `'light'` / `'dark'`
 * pin explicitly.
 */
export type ThemedBackgroundMode = 'auto' | 'light' | 'dark';

/** The concrete variant currently being rendered after mode resolution. */
export type ThemedBackgroundKind = 'light' | 'dark';

/** A named look bundling both a light and dark variant. */
export interface ThemedBackgroundTheme {
  /** Stable identifier — referenced by `setTheme(id)` and `defaultTheme`. */
  id: string;
  /** Optional human-friendly label for UIs. */
  label?: string;
  /** Style applied when the resolved kind is `'light'`. */
  light: BackgroundLayerOptions;
  /** Style applied when the resolved kind is `'dark'`. */
  dark: BackgroundLayerOptions;
}

/** Construction-time options for `ThemedBackgroundLayer`. */
export interface ThemedBackgroundLayerOptions {
  /** Named themes. Must contain at least one entry. */
  themes: ThemedBackgroundTheme[];
  /** Id of the theme to start with. Defaults to `themes[0].id`. */
  defaultTheme?: string;
  /** Initial mode. Defaults to `'auto'`. */
  mode?: ThemedBackgroundMode;
}

/** Layer-event map fired by `ThemedBackgroundLayer.events`. */
export interface ThemedBackgroundLayerEvents {
  'theme:switched': {
    theme: ThemedBackgroundTheme;
    resolvedKind: ThemedBackgroundKind;
    source: 'initial' | 'manual';
  };
  'mode:updated': {
    mode: ThemedBackgroundMode;
    previousMode: ThemedBackgroundMode;
    resolvedKind: ThemedBackgroundKind;
    source: 'manual' | 'system';
  };
  [event: string]: unknown;
}

interface ThemedBackgroundLayerState {
  readonly _placeholder?: never;
}

export class ThemedBackgroundLayer extends BackgroundLayer {
  private readonly themes: ThemedBackgroundTheme[];
  private activeId: string;
  private currentMode: ThemedBackgroundMode;

  private mediaQuery: MediaQueryList | null = null;
  private mediaListener: ((e: MediaQueryListEvent) => void) | null = null;

  // We override the base typed-events surface with one that carries the
  // themed-specific names. The base ScreenLayer narrows EventMap = never;
  // we re-type via cast since EventEmitter is generic-erased at runtime.
  declare readonly events: import('../events/EventEmitter').EventEmitter<ThemedBackgroundLayerEvents> &
    BackgroundLayer['events'];

  constructor(opts: LayerOptions<ThemedBackgroundLayerOptions>) {
    const { themes, defaultTheme, mode } = opts.options;

    if (!themes || themes.length === 0) {
      throw new Error(
        `ThemedBackgroundLayer "${opts.id}": 'themes' must contain at least one entry.`,
      );
    }
    for (const t of themes) {
      if (!t.light || !t.dark) {
        throw new Error(
          `ThemedBackgroundLayer "${opts.id}": theme '${t.id}' must define both 'light' and 'dark' variants.`,
        );
      }
    }
    const startId = defaultTheme ?? themes[0]!.id;
    if (!themes.some((t) => t.id === startId)) {
      throw new Error(
        `ThemedBackgroundLayer "${opts.id}": unknown defaultTheme id '${startId}'.`,
      );
    }

    // Seed the base BackgroundLayer with the resolved variant so the very
    // first render matches the active theme + mode.
    const initialMode = mode ?? 'auto';
    const initialTheme = themes.find((t) => t.id === startId)!;
    const initialKind = resolveKind(initialMode);
    const initialVariant = initialKind === 'dark' ? initialTheme.dark : initialTheme.light;

    super({
      id: opts.id,
      options: initialVariant,
      visible: opts.visible,
      hittable: opts.hittable,
      zIndex: opts.zIndex,
      cullable: opts.cullable,
      devtoolsName: opts.devtoolsName,
    });

    this.themes = themes;
    this.activeId = startId;
    this.currentMode = initialMode;
  }

  protected override createState(): ThemedBackgroundLayerState {
    return {};
  }

  protected override onMount(ctx: CanvasContext): void {
    super.onMount(ctx);
    this.wireMediaQuery();
    this.emitThemeSwitched('initial');
  }

  protected override onUnmount(): void {
    this.detachMediaQuery();
    super.onUnmount();
  }

  // ─── Public API ─────────────────────────────────────────────────────────

  /**
   * Switch to a theme by id. Mode is preserved. Throws on unknown id.
   * Emits `'theme:switched'`.
   */
  setTheme(id: string): void {
    if (!this.themes.some((t) => t.id === id)) {
      throw new Error(`ThemedBackgroundLayer "${this.id}": unknown theme id '${id}'.`);
    }
    if (id === this.activeId) return;
    this.activeId = id;
    this.applyResolved();
    this.emitThemeSwitched('manual');
  }

  /**
   * Set the mode. `'auto'` re-arms the system listener; `'light'` / `'dark'`
   * pin explicitly. Emits `'mode:updated'` when the mode actually changes.
   */
  setMode(mode: ThemedBackgroundMode): void {
    if (mode === this.currentMode) return;
    const previous = this.currentMode;
    this.currentMode = mode;
    if (mode === 'auto') this.wireMediaQuery();
    else this.detachMediaQuery();
    this.applyResolved();
    this.emitModeUpdated(previous, 'manual');
  }

  /** Currently active theme. */
  getActiveTheme(): ThemedBackgroundTheme {
    return this.themes.find((t) => t.id === this.activeId)!;
  }

  /** Current mode setting. */
  getMode(): ThemedBackgroundMode {
    return this.currentMode;
  }

  /** Concrete kind currently being rendered. */
  getResolvedKind(): ThemedBackgroundKind {
    return resolveKind(this.currentMode);
  }

  /** Snapshot of the configured themes. */
  getThemes(): readonly ThemedBackgroundTheme[] {
    return this.themes;
  }

  // ─── Internals ──────────────────────────────────────────────────────────

  private applyResolved(): void {
    const theme = this.getActiveTheme();
    const variant = this.getResolvedKind() === 'dark' ? theme.dark : theme.light;
    this.setOptions(variant);
  }

  private emitThemeSwitched(source: 'initial' | 'manual'): void {
    this.events.emit('theme:switched', {
      theme: this.getActiveTheme(),
      resolvedKind: this.getResolvedKind(),
      source,
    });
  }

  private emitModeUpdated(
    previousMode: ThemedBackgroundMode,
    source: 'manual' | 'system',
  ): void {
    this.events.emit('mode:updated', {
      mode: this.currentMode,
      previousMode,
      resolvedKind: this.getResolvedKind(),
      source,
    });
  }

  private wireMediaQuery(): void {
    if (this.currentMode !== 'auto') {
      this.detachMediaQuery();
      return;
    }
    if (this.mediaQuery) return;
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;

    this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this.mediaListener = () => {
      if (this.currentMode !== 'auto') return;
      // System flip: rendered variant changes, `mode` itself is unchanged.
      // Still emit so listeners that watch `resolvedKind` get the signal.
      this.applyResolved();
      this.emitModeUpdated(this.currentMode, 'system');
    };
    this.mediaQuery.addEventListener('change', this.mediaListener);
  }

  private detachMediaQuery(): void {
    if (this.mediaQuery && this.mediaListener) {
      this.mediaQuery.removeEventListener('change', this.mediaListener);
    }
    this.mediaQuery = null;
    this.mediaListener = null;
  }
}

/** Standalone kind resolver — shared between constructor seed + runtime. */
function resolveKind(mode: ThemedBackgroundMode): ThemedBackgroundKind {
  if (mode === 'light' || mode === 'dark') return mode;
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
