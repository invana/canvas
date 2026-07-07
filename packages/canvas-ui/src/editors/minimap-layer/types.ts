/**
 * Types for the MiniMapLayer editor.
 *
 * Engine-agnostic: `@invana/graph` (home of `MiniMapLayer` and its options) is
 * **not** imported for its runtime — the editable option shape is mirrored here
 * as {@link MiniMapLayerOptions}, a serialisable patch the consumer applies via
 * `setOptions`. Keep it in sync with the engine `MiniMapLayerOptions` by hand.
 *
 * The engine encodes each chrome colour as `MiniMapColor = number (0xRRGGBB) |
 * { light, dark }`. This editor edits the scalar form only: `number` seeds
 * round-trip through `#rrggbb`; a `{ light, dark }` pair is out of scope and is
 * left untouched (see `mapping.ts`).
 */

/** Anchor corner inside the canvas viewport. */
export type MiniMapPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

/** How `{ light, dark }` colour variants resolve. */
export type MiniMapMode = 'auto' | 'light' | 'dark';

/**
 * The subset of `MiniMapLayerOptions` this editor produces — a serialisable
 * patch. The identity field `graphLayerId` and the cross-layer reference
 * `backgroundLayerId` are out of scope (not user-tunable state). Colours are
 * emitted as hex strings; `margin` is emitted as a scalar number (the engine's
 * `{ x, y }` object form is out of scope and round-trips untouched).
 */
export interface MiniMapLayerOptions {
  /** Minimap width in screen px. Default `200`. */
  width?: number;
  /** Minimap height in screen px. Default `150`. */
  height?: number;
  /** Background fill as `0xRRGGBB`. Default `0x1a1a2e`. */
  backgroundColor?: number;
  /** Border colour as `0xRRGGBB`. Default `0x444444`. */
  borderColor?: number;
  /** Border stroke width. Default `1`. */
  borderWidth?: number;
  /** Viewport indicator fill as `0xRRGGBB`. Default `0x4a90d9`. */
  viewportFill?: number;
  /** Viewport indicator stroke as `0xRRGGBB`. Default `0x2a70b9`. */
  viewportStroke?: number;
  /** Viewport indicator fill alpha 0–1. Default `0.3`. */
  viewportFillAlpha?: number;
  /** Viewport indicator stroke width. Default `2`. */
  viewportStrokeWidth?: number;
  /** World-space padding around node bounds. Default `20`. */
  padding?: number;
  /** Whether dragging the minimap pans the main camera. Default `true`. */
  enableDrag?: boolean;
  /** Anchor corner. Default `'bottom-right'`. */
  position?: MiniMapPosition;
  /** How `{ light, dark }` colour variants resolve. Default `'auto'`. */
  mode?: MiniMapMode;
  /** Symmetric inset from the chosen corner, in screen px. Default `10`. */
  margin?: number;
}

/**
 * Flat form-field shape the `@invana/forms` generator renders. Identical to
 * {@link MiniMapLayerOptions} except the four chrome colours are `#rrggbb`
 * strings (what the colour swatch emits); `mapping.ts` bridges them to/from the
 * engine's `0xRRGGBB` numbers.
 */
export interface MiniMapLayerFields
  extends Omit<
    MiniMapLayerOptions,
    'backgroundColor' | 'borderColor' | 'viewportFill' | 'viewportStroke'
  > {
  /** Background fill as `#rrggbb`. */
  backgroundColor?: string;
  /** Border colour as `#rrggbb`. */
  borderColor?: string;
  /** Viewport indicator fill as `#rrggbb`. */
  viewportFill?: string;
  /** Viewport indicator stroke as `#rrggbb`. */
  viewportStroke?: string;
}

/**
 * react-hook-form state shape. `<ObjectField name="options" …>` registers each
 * leaf under `options.<field>`, so the form's values nest under an `options` key.
 */
export interface MiniMapLayerFormState {
  options: MiniMapLayerFields;
}
