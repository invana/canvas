/**
 * Types for the NodeResizeBehaviour editor.
 *
 * Engine-agnostic: the editable option shape is mirrored **structurally** here
 * as {@link NodeResizeOptions}, a plain serialisable patch the consumer applies
 * via `setOptions`. Colours are **numbers** (`0xRRGGBB`) in the engine and are
 * bridged to `#rrggbb` swatch strings by `mapping.ts`; the `dashArray` tuple is
 * split into two number fields.
 */

/**
 * The serialisable subset of `NodeResizeBehaviourOptions` this editor produces.
 * Colours stay as engine numbers (`handleFill`, `frameColor`); `dashArray` keeps
 * its `[dash, gap]` tuple shape.
 */
export interface NodeResizeOptions {
  handleRadius?: number;
  /** Handle fill colour as an engine `0xRRGGBB` number. */
  handleFill?: number;
  /** Frame border + handle outline colour as an engine `0xRRGGBB` number. */
  frameColor?: number;
  /** Dash pattern `[dashLength, gapLength]` in px. */
  dashArray?: readonly [number, number];
  framePadding?: number;
  minSize?: number;
}

/**
 * Flat form-field shape the `@invana/forms` generator renders. Colours become
 * `#rrggbb` strings; the `dashArray` tuple is flattened into `dashLength` +
 * `dashGap` number fields (see `mapping.ts`).
 */
export interface NodeResizeFields {
  handleRadius?: number;
  /** Handle fill as a `#rrggbb` swatch string. */
  handleFill?: string;
  /** Frame colour as a `#rrggbb` swatch string. */
  frameColor?: string;
  /** First tuple member of `dashArray` — the dash length in px. */
  dashLength?: number;
  /** Second tuple member of `dashArray` — the gap length in px. */
  dashGap?: number;
  framePadding?: number;
  minSize?: number;
}

/**
 * react-hook-form state shape. `<ObjectField name="options" …>` registers each
 * leaf under `options.<field>`, so the form's values nest under an `options` key.
 */
export interface NodeResizeFormState {
  options: NodeResizeFields;
}
