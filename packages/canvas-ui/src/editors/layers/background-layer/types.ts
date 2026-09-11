/**
 * Types for the BackgroundLayer editor.
 *
 * Engine-agnostic: `@invana/canvas` (home of `BackgroundLayer` and its options)
 * is **not** imported — canvas-ui may only use `@invana/graph` types (package
 * CLAUDE.md). The editable option shape is mirrored here as
 * {@link BackgroundLayerOptions}, a serialisable patch the consumer applies via
 * `setOptions`. Keep the enums / fields in sync with the engine by hand.
 */

/** `'solid'` paints a flat fill; `'pattern'` overlays a tiled texture. */
export type BackgroundType = 'solid' | 'pattern';
/** Tile texture kind when `type === 'pattern'`. */
export type BackgroundPatternType = 'dots' | 'grid' | 'lines';
/** How `{ light, dark }` colour variants resolve. */
export type BackgroundMode = 'auto' | 'light' | 'dark';

/**
 * Where one colour comes from — the form-only half of the engine's `'inherit'`
 * sentinel. `'theme'` emits the literal string `'inherit'` (the layer then reads
 * its configured palette role); `'custom'` emits the swatch's colour, which the
 * theme will never override.
 *
 * Form-only: the engine has no `*Source` option, and `optionsToForm` /
 * `formToOptions` are what bridge the two representations.
 */
export type BackgroundColorSource = 'theme' | 'custom';

/**
 * The subset of `BackgroundLayerOptions` this editor produces. Colours are
 * emitted as scalar strings (hex / CSS) — the engine's `BackgroundColor` also
 * accepts a `{ light, dark }` pair, which is out of scope for the scalar form
 * (such values round-trip untouched; see `mapping.ts`).
 */
export interface BackgroundLayerOptions {
  type?: BackgroundType;
  patternType?: BackgroundPatternType;
  /** Pattern foreground colour, or `'inherit'` to follow the theme's pattern role. */
  color?: string;
  /** Solid backdrop colour, or `'inherit'` to follow the theme's surface role. */
  backgroundColor?: string;
  size?: number;
  spacing?: number;
  alpha?: number;
  followCamera?: boolean;
  /** Camera scale below which the pattern is hidden. `0` disables the cutoff. */
  hidePatternBelowZoom?: number;
  mode?: BackgroundMode;
  surfaceRole?: string;
  patternRole?: string;
}

/**
 * Flat form-field shape: {@link BackgroundLayerOptions} plus the two
 * form-only `*Source` selects that stand in for the `'inherit'` sentinel, which
 * a colour swatch cannot represent. `mapping.ts` folds them back.
 */
export interface BackgroundLayerFields extends BackgroundLayerOptions {
  /** Whether {@link BackgroundLayerOptions.backgroundColor} is themed or pinned. */
  backgroundColorSource?: BackgroundColorSource;
  /** Whether {@link BackgroundLayerOptions.color} is themed or pinned. */
  colorSource?: BackgroundColorSource;
}

/** react-hook-form state — leaves register under `options.<field>`. */
export interface BackgroundLayerFormState {
  options: BackgroundLayerFields;
}
