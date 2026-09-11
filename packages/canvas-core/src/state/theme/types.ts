/**
 * Renderer-free **theme state** for the kernel — the fully-**resolved** theme the
 * engine publishes and theme-aware layers recolour from. Relocated from the
 * engine (`@invana/canvas`); roles are plain `string` keys → colour numbers (the
 * named `ColorRole` vocabulary stays in `@invana/graph`).
 *
 * Two distinct things, don't conflate them:
 * - **Authored theme config** (registry / active family / mode / accent) lives in
 *   `view.definition.theme` (serialisable, synced).
 * - **The resolved theme** below is the *derived* output a `ThemeBehaviour`
 *   computes from that config + mode, and publishes via {@link ThemeState.set}.
 */

/** The concrete kind a theme mode resolves to. */
export type ThemeKind = 'light' | 'dark';

/** Mode selector. `'system'` follows the host `prefers-color-scheme`; the rest pin. */
export type ThemeMode = 'system' | 'light' | 'dark';

/** A fully-resolved theme — every role already a colour number. Plain JSON; no pixi. */
export interface ResolvedTheme {
  readonly kind: ThemeKind;
  /** Opaque family name (`'default'` | `'forest'` | …) — meaningful to the app, not the kernel. */
  readonly name: string;
  /** Role name → `0xRRGGBB`. The engine theme has no role *enum*; roles are strings. */
  readonly palette: Readonly<Record<string, number>>;
  /** Optional fill-by-category ramp (consumed by colour-by-label / minimap). */
  readonly categorical?: readonly number[];
}

/** The theme channel — read the current resolved theme, or set (and broadcast) a new one. */
export interface ThemeState {
  /** The current resolved theme, or `null` before the first {@link set}. */
  current(): ResolvedTheme | null;
  /** Store + broadcast a resolved theme (emits `theme:change`). */
  set(theme: ResolvedTheme): void;
}

// ─── The `inherit` sentinel ──────────────────────────────────────────────────

/**
 * The **inherit sentinel** — the value a themed colour option carries to mean
 * *"resolve me from the active theme's palette"* rather than pinning a colour.
 *
 * It exists because a single-tier option has no other way to say it. An option
 * that is simply absent falls back to a hardcoded default; an option holding a
 * colour pins that colour. `'inherit'` is the third state, and it is the one
 * that should usually be the *default*:
 *
 * | Value | Meaning |
 * |---|---|
 * | `'inherit'` | Follow the palette role the surface declares. Recolours on every `theme:change` |
 * | `0x0f172a` / `'#0f172a'` | Pinned by the author. The theme never touches it |
 *
 * **Config vocabulary, never spec vocabulary.** `'inherit'` is legal in a
 * serialisable *option* and is resolved — via {@link resolveThemed} — at the
 * moment a surface paints. It must never reach a renderer spec: the renderer
 * sees numbers, always.
 *
 * Cascading surfaces don't need it. Where a value already resolves through
 * tiers (a graph node's style: layer template → per-type binding → per-node →
 * state), **absence already means inherit**, exactly as in CSS, and the theme
 * belongs in a tier *below* the author rather than in a sentinel.
 *
 * @see rfc:feat-2026-09-11-a-colour-is-either-themed-or-manual-never-both
 */
export const INHERIT = 'inherit';

/** The literal type of {@link INHERIT}. */
export type Inherit = typeof INHERIT;

/**
 * A themed option: either a concrete value of `T` (pinned by the author) or
 * {@link INHERIT} (resolved from the palette). Resolve with
 * {@link resolveThemed}.
 */
export type Themed<T> = T | Inherit;

/** Narrow a themed option to the {@link INHERIT} sentinel. */
export function isInherit(value: unknown): value is Inherit {
  return value === INHERIT;
}

/**
 * Resolve a themed colour option against a published palette.
 *
 * A concrete value passes through untouched — an author-set colour always wins
 * over the theme, and keeps winning across theme switches. {@link INHERIT}
 * reads the first of `roles` the palette actually carries, falling back to
 * `fallback` when no theme has been published yet or the palette omits every
 * role (which is what the single-layer `ThemeBehaviour` shorthand's empty
 * palette does).
 *
 * @param value    The option as authored — a colour, or {@link INHERIT}.
 * @param palette  The active `ResolvedTheme.palette`, or `null` before the first publish.
 * @param roles    Role name, or names tried in order (e.g. `['divider', 'stroke']`).
 * @param fallback Used when `value` is `'inherit'` and no role resolves.
 *
 * @example
 * ```ts
 * // `backgroundColor` defaults to 'inherit' → follows the theme's `surface`
 * const fill = resolveThemed(opts.backgroundColor, theme?.palette, 'surface', '#f8fafc');
 * ```
 */
export function resolveThemed<T>(
  value: Themed<T>,
  palette: Readonly<Record<string, number>> | null | undefined,
  roles: string | readonly string[],
  fallback: T,
): T | number {
  if (!isInherit(value)) return value;
  if (palette) {
    for (const role of typeof roles === 'string' ? [roles] : roles) {
      const resolved = palette[role];
      if (resolved !== undefined) return resolved;
    }
  }
  return fallback;
}
