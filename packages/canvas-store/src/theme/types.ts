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
