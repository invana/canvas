/**
 * `ThemeBehaviour` — the **single source of truth** for the canvas theme.
 *
 * It is the *only* place in the codebase that reads the host's appearance —
 * `prefers-color-scheme` in `'system'` mode, the document's `data-theme` in
 * `'document'` mode — and the *only* publisher of the engine's theme signal.
 * On enable (and on every relevant change) it resolves the active {@link Theme} +
 * {@link ThemeMode} down to the engine's `ResolvedTheme` and calls
 * `ctx.theme.set(...)`, which stores it and emits `'theme:change'`. Theme-aware layers — `BackgroundLayer`,
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
 * `mode: 'document'` is the third way in: instead of a host pushing patches, the
 * behaviour *reads* the page's own theme — the `data-theme` attribute (or a
 * `light`/`dark` class) on `<html>`, which is what the design-kit switchers and
 * `@invana/styling`'s `applyTheme()` write — and re-publishes on every change.
 * Both halves travel: the kind from the variant's suffix and the family from its
 * prefix (when that family is a registered theme). Prefer `CanvasThemeSync` in a
 * React app, where the provider's context is the more direct signal; reach for
 * `'document'` in imperative hosts (a story, a plain-DOM embed) that have no
 * React context to read.
 *
 * @example Named theme, following the OS until the host drives it:
 * ```ts
 * canvas.behaviours.register(new ThemeBehaviour({ id: 'theme' }));
 * canvas.update({ behaviours: { theme: { enabled: true, mode: 'system', active: 'default' } } });
 * // later, from a host theme switch:
 * canvas.update({ behaviours: { theme: { active: 'forest', mode: 'dark' } } });
 * ```
 *
 * @example Following the host page's theme picker (`<html data-theme="ocean-dark">`):
 * ```ts
 * canvas.behaviours.register(new ThemeBehaviour({ id: 'theme' }));
 * canvas.update({ behaviours: { theme: { enabled: true, mode: 'document', accent: 'css-var' } } });
 * // no further calls — family + kind track the attribute, accent tracks the CSS var
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
import { themeFamily } from '../theme/family';
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
  /**
   * `'system'` (default) follows `prefers-color-scheme`; `'document'` follows the
   * host page's `data-theme` / `light`-`dark` class on `<html>` (family **and**
   * kind); `'light'`/`'dark'` pin the kind.
   */
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

export class ThemeBehaviour extends Behaviour<ThemeBehaviourOptions> {
  override readonly kind = 'theme';
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
  /** Armed only in `'document'` mode — watches `<html>`'s theme attributes. */
  private documentObserver: MutationObserver | null = null;

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
    this.wireSources();
    this.apply();
  }

  protected override onDisable(): void {
    this.detachSources();
  }

  protected override onDestroy(): void {
    this.detachSources();
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
    this.wireSources();
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

  /**
   * The **pinned** theme name (the option), not the resolved one — in
   * `'document'` mode the page's family may win. Read the published
   * `ResolvedTheme.name` for what is actually on screen.
   */
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
    const activeName = this.resolveActiveName();

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
      ctx.theme.set({ kind, name: activeName, palette: {} });
      return;
    }

    // Named-theme mode: resolve the palette and publish it whole.
    const theme: Theme = this.themes[activeName] ?? this.themes[this.fallback] ?? DEFAULT_THEME;
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

  /**
   * SSR-safe kind resolution. `'system'` consults the media query, `'document'`
   * the host page, `'light'`/`'dark'` answer themselves.
   */
  private resolveKind(): ThemeKind {
    if (this.mode === 'light' || this.mode === 'dark') return this.mode;
    if (this.mode === 'document') return this.readDocumentVariant().kind;
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  /**
   * Read the host page's active theme variant off `<html>`. Two sources, in
   * order: the `data-theme` attribute (`"ocean-dark"` → family `ocean`, kind
   * `dark` — the shape `@invana/styling`'s `applyTheme()` writes), then a bare
   * `dark` class for hosts that only toggle that. SSR-safe: `'light'` with no
   * family when there's no document.
   *
   * The family is returned raw; {@link resolveActiveName} decides whether it's a
   * theme this engine knows.
   */
  private readDocumentVariant(): { kind: ThemeKind; family?: string } {
    if (typeof document === 'undefined' || !document.documentElement) return { kind: 'light' };
    const root = document.documentElement;
    const attr = root.getAttribute('data-theme');
    if (attr) {
      const kind: ThemeKind = /-dark$/.test(attr.trim().toLowerCase()) ? 'dark' : 'light';
      return { kind, family: themeFamily(attr) };
    }
    return { kind: root.classList.contains('dark') ? 'dark' : 'light' };
  }

  /**
   * The theme name to resolve the palette from. Normally the pinned `active`; in
   * `'document'` mode the page's own family wins **when this engine has a theme
   * by that name** — so a host on `ocean` recolours the canvas to `ocean`, while
   * a host family with no engine counterpart (`tailwind`, `vite`) leaves `active`
   * in charge rather than falling through to `fallback`.
   */
  private resolveActiveName(): string {
    if (this.mode !== 'document') return this.active;
    const { family } = this.readDocumentVariant();
    return family && this.themes[family] ? family : this.active;
  }

  /**
   * Arm exactly the listener the current {@link mode} needs and disarm the other:
   * the media query in `'system'`, the document observer in `'document'`, neither
   * when the kind is pinned. Idempotent — safe to call on every `setOptions`.
   */
  private wireSources(): void {
    this.wireMediaQuery();
    this.wireDocumentObserver();
  }

  /** Drop both listeners (disable / destroy). */
  private detachSources(): void {
    this.detachMediaQuery();
    this.detachDocumentObserver();
  }

  /**
   * Observe the host page's theme attributes while in `'document'` mode. Scoped
   * to `<html>`'s `class` + `data-theme` (`attributeFilter`) so an unrelated DOM
   * mutation can't cost a republish, and `subtree: false` — the variant lives on
   * the root element only.
   */
  private wireDocumentObserver(): void {
    if (this.mode !== 'document') {
      this.detachDocumentObserver();
      return;
    }
    if (this.documentObserver) return;
    if (typeof document === 'undefined' || typeof MutationObserver !== 'function') return;
    if (!document.documentElement) return;
    this.documentObserver = new MutationObserver(() => {
      if (this.mode === 'document' && this.isEnabled) this.apply();
    });
    this.documentObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-theme'],
      subtree: false,
    });
  }

  private detachDocumentObserver(): void {
    this.documentObserver?.disconnect();
    this.documentObserver = null;
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
