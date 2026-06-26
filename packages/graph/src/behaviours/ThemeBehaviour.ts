/**
 * `ThemeBehaviour` — the **single source of truth** for the canvas theme.
 *
 * It is the *only* place in the codebase that reads `prefers-color-scheme`, and
 * the *only* publisher of the engine's theme signal. On enable (and on every
 * relevant change) it resolves the active {@link Theme} + {@link ThemeMode} down
 * to the engine's `ResolvedTheme` and calls `ctx.theme.set(...)`, which stores
 * it and emits `'theme:change'`. Theme-aware layers — `BackgroundLayer`,
 * `MiniMapLayer`, `GraphLayer` — subscribe and recolour themselves; this
 * behaviour paints nothing directly.
 *
 * Two ways to drive it:
 *
 * 1. **Named palette themes** (the rich path). Supply `mode` + `active`; the
 *    resolved palette recolours background, nodes, edges, labels and group
 *    frames across the whole canvas. The active name is matched (loosely) to the
 *    host app's theme family via {@link themeFamily}; an unknown name falls back
 *    to `fallback` (default `'default'`).
 *
 * 2. **Single-layer shorthand** (eases migration of imperative stories). Set
 *    `targetLayerId` + flat `light` / `dark` option patches; on each resolved
 *    kind the matching patch is pushed to that one layer via `setOptions`. The
 *    published `ResolvedTheme` carries an **empty palette** in this mode, so the
 *    shorthand colours win and no role-based recolour fights them.
 *
 * Behaviours never auto-enable — register **and** enable it explicitly.
 *
 * @example Named theme, following the OS until the host drives it:
 * ```ts
 * canvas.behaviours.register(new ThemeBehaviour({ id: 'theme' }));
 * canvas.update({ behaviours: { theme: { enabled: true, mode: 'system', active: 'default' } } });
 * // later, from a host theme switch:
 * canvas.update({ behaviours: { theme: { active: 'forest', mode: 'dark' } } });
 * ```
 *
 * @example Single-layer shorthand (background only), OS-following:
 * ```ts
 * canvas.behaviours.register(new ThemeBehaviour({ id: 'theme', targetLayerId: 'bg' }));
 * canvas.update({ behaviours: { theme: {
 *   enabled: true, mode: 'system',
 *   light: { backgroundColor: '#f8fafc', color: '#94a3b8' },
 *   dark:  { backgroundColor: '#0f172a', color: '#475569' },
 * } } });
 * ```
 */

import {
  Behaviour,
  type BehaviourOptions,
  type CanvasContext,
  type ResolvedTheme,
} from '@invana/canvas';

import { resolveAccentVar } from '../theme/accent';
import { BUILT_IN_THEMES, DEFAULT_THEME } from '../theme/themes';
import type { Theme, ThemeKind, ThemeMode, ThemeRegistry } from '../theme/types';

/** Construction options for {@link ThemeBehaviour}. */
export interface ThemeBehaviourOptions extends BehaviourOptions {
  /** Consumer themes, merged over the built-ins (`default/forest/ocean/gold/rose/minimal`). */
  themes?: ThemeRegistry;
  /** Active theme name. Default `fallback`. Matched to the host theme family. */
  active?: string;
  /** Theme used when `active` isn't found. Default `'default'`. */
  fallback?: string;
  /** `'system'` (default) follows `prefers-color-scheme`; `'light'`/`'dark'` pin. */
  mode?: ThemeMode;
  /**
   * Source for the `accent` role. `'css-var'` reads {@link accentVar} live off
   * the document root; a `number` pins it. Omit to use the theme's own accent.
   */
  accent?: 'css-var' | number;
  /** CSS custom property read when `accent: 'css-var'`. Default `'--color-primary'`. */
  accentVar?: string;
  /** Single-layer shorthand: patch pushed to {@link targetLayerId} in light mode. */
  light?: Record<string, unknown>;
  /** Single-layer shorthand: patch pushed to {@link targetLayerId} in dark mode. */
  dark?: Record<string, unknown>;
}

/** Subset of options that can be patched live via `setOptions`. */
type ThemePatch = Partial<
  Pick<
    ThemeBehaviourOptions,
    'themes' | 'active' | 'fallback' | 'mode' | 'accent' | 'accentVar' | 'light' | 'dark'
  >
>;

export class ThemeBehaviour extends Behaviour {
  private themes: ThemeRegistry;
  private active: string;
  private fallback: string;
  private mode: ThemeMode;
  private accent?: 'css-var' | number;
  private accentVar: string;
  private light?: Record<string, unknown>;
  private dark?: Record<string, unknown>;

  private mediaQuery: MediaQueryList | null = null;
  private mediaListener: (() => void) | null = null;

  constructor(opts: ThemeBehaviourOptions) {
    super({ ...opts, shortcuts: opts.shortcuts ?? [] });
    this.fallback = opts.fallback ?? 'default';
    this.themes = { ...BUILT_IN_THEMES, ...opts.themes };
    this.active = opts.active ?? this.fallback;
    this.mode = opts.mode ?? 'system';
    this.accent = opts.accent;
    this.accentVar = opts.accentVar ?? '--color-primary';
    this.light = opts.light;
    this.dark = opts.dark;
  }

  // ─── Lifecycle ────────────────────────────────────────────────────────────

  protected override onRegister(_ctx: CanvasContext): void {
    /* nothing to wire until enabled */
  }

  protected override onEnable(): void {
    this.wireMediaQuery();
    this.apply();
  }

  protected override onDisable(): void {
    this.detachMediaQuery();
  }

  protected override onDestroy(): void {
    this.detachMediaQuery();
  }

  // ─── Public API (driven by `canvas.update({ behaviours: { theme: … } })`) ──

  /** Patch options and re-publish (when enabled). */
  setOptions(patch: ThemePatch): void {
    if (patch.themes) this.themes = { ...BUILT_IN_THEMES, ...patch.themes };
    if (patch.fallback !== undefined) this.fallback = patch.fallback;
    if (patch.active !== undefined) this.active = patch.active;
    if (patch.mode !== undefined) this.mode = patch.mode;
    if ('accent' in patch) this.accent = patch.accent;
    if (patch.accentVar !== undefined) this.accentVar = patch.accentVar;
    if ('light' in patch) this.light = patch.light;
    if ('dark' in patch) this.dark = patch.dark;
    if (!this.isEnabled) return;
    this.wireMediaQuery();
    this.apply();
  }

  /** Switch mode. Re-publishes immediately when enabled. */
  setMode(mode: ThemeMode): void {
    this.setOptions({ mode });
  }

  /** Switch the active theme by name. Re-publishes immediately when enabled. */
  setTheme(name: string): void {
    this.setOptions({ active: name });
  }

  getMode(): ThemeMode {
    return this.mode;
  }

  getActiveName(): string {
    return this.active;
  }

  /** Concrete kind currently resolved from {@link mode}. */
  getResolvedKind(): ThemeKind {
    return this.resolveKind();
  }

  // ─── Internals ────────────────────────────────────────────────────────────

  /** Resolve + publish the theme onto `ctx.theme` (emits `'theme:change'`). */
  private apply(): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const kind = this.resolveKind();

    // Shorthand mode: push the flat patch to a single layer; publish an empty
    // palette so role-based recolour stands aside and the patch wins.
    if (this.light || this.dark) {
      const patch = kind === 'dark' ? this.dark : this.light;
      if (patch && this.targetLayerId) {
        const layer = ctx.layers.get(this.targetLayerId) as
          | { setOptions?: (o: unknown) => void }
          | undefined;
        layer?.setOptions?.(patch);
      }
      ctx.theme.set({ kind, name: this.active, palette: {} });
      return;
    }

    // Named-theme mode: resolve the palette and publish it whole.
    const theme: Theme = this.themes[this.active] ?? this.themes[this.fallback] ?? DEFAULT_THEME;
    const variant = kind === 'dark' ? theme.dark : theme.light;
    const { categorical, ...roles } = variant;
    const palette: Record<string, number> = { ...roles };

    const accent = this.resolveAccent();
    if (accent !== undefined) palette.accent = accent;

    const resolved: ResolvedTheme = { kind, name: theme.name, palette, categorical };
    ctx.theme.set(resolved);
  }

  /** Resolve the live accent colour, if configured. */
  private resolveAccent(): number | undefined {
    if (this.accent === undefined) return undefined;
    if (typeof this.accent === 'number') return this.accent;
    return resolveAccentVar(this.accentVar);
  }

  /** SSR-safe kind resolution. `'system'` consults the media query. */
  private resolveKind(): ThemeKind {
    if (this.mode === 'light' || this.mode === 'dark') return this.mode;
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  /** Arm the `prefers-color-scheme` listener while in `'system'` mode. */
  private wireMediaQuery(): void {
    if (this.mode !== 'system') {
      this.detachMediaQuery();
      return;
    }
    if (this.mediaQuery) return;
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this.mediaListener = () => {
      if (this.mode === 'system' && this.isEnabled) this.apply();
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
