/**
 * Theme vocabulary for `@invana/graph` — the **named-palette** layer that sits
 * above the engine's graph-agnostic `ResolvedTheme` signal.
 *
 * A {@link Theme} is a named palette family (`default` / `forest` / `ocean` …)
 * with full **light + dark** variants. Each variant maps every {@link ColorRole}
 * to a concrete `0xRRGGBB` number. The {@link ThemeBehaviour} resolves the
 * active theme + mode down to the engine's `ResolvedTheme` and publishes it;
 * theme-aware layers recolour from the palette. Roles are resolved to numbers
 * before anything reaches the renderer — Pixi never sees a role.
 */

/**
 * Semantic colour variables — the canvas analogue of CSS custom properties.
 * Styling templates reference a role (`title → heading`); the active
 * {@link Theme} defines what that role resolves to per light/dark variant.
 */
export type ColorRole =
  | 'surface' // page / canvas backdrop
  | 'cardBg' // card / group-frame body fill
  | 'foreground' // primary body text (labels)
  | 'heading' // emphasised text (card titles)
  | 'muted' // secondary text, edges
  | 'accent' // primary / brand accent (driven by --color-primary when live)
  | 'divider' // hairlines, card dividers, grid
  | 'stroke' // node / shape borders
  | 'selectionRing' // selected-state ring
  | 'hoverRing'; // hovered-state ring

/** Concrete colour values for one light/dark variant of a {@link Theme}. */
export interface ThemePalette extends Record<ColorRole, number> {
  /** Fill-by-category ramp consumed by `ColorByBehaviour` / minimap. */
  categorical: number[];
}

/** A named palette family with full light + dark variants. */
export interface Theme {
  /** Stable name used to match against the host app's active theme family. */
  name: string;
  /** Optional human label for pickers. */
  label?: string;
  light: ThemePalette;
  dark: ThemePalette;
}

/** A registry of {@link Theme}s keyed by name. */
export type ThemeRegistry = Record<string, Theme>;

/** Mode selector. `'system'` follows `prefers-color-scheme`; the rest pin. */
export type ThemeMode = 'system' | 'light' | 'dark';

/** The concrete kind a {@link ThemeMode} resolves to. */
export type ThemeKind = 'light' | 'dark';
