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
 * The subset of `BackgroundLayerOptions` this editor produces. Colours are
 * emitted as scalar strings (hex / CSS) — the engine's `BackgroundColor` also
 * accepts a `{ light, dark }` pair, which is out of scope for the scalar form
 * (such values round-trip untouched; see `mapping.ts`).
 */
export interface BackgroundLayerOptions {
  type?: BackgroundType;
  patternType?: BackgroundPatternType;
  /** Pattern foreground colour. */
  color?: string;
  /** Solid backdrop colour painted behind the pattern. */
  backgroundColor?: string;
  size?: number;
  spacing?: number;
  alpha?: number;
  followCamera?: boolean;
  mode?: BackgroundMode;
  surfaceRole?: string;
  patternRole?: string;
}

/**
 * Flat form-field shape. Matches {@link BackgroundLayerOptions} 1:1 here —
 * colours are already scalar strings, so no re-encoding beyond the
 * `number ⇄ #rrggbb` bridge the mapping applies for seed values.
 */
export type BackgroundLayerFields = BackgroundLayerOptions;

/** react-hook-form state — leaves register under `options.<field>`. */
export interface BackgroundLayerFormState {
  options: BackgroundLayerFields;
}
