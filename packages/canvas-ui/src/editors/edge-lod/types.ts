/**
 * Types for the EdgeLODBehaviour editor.
 *
 * Engine-agnostic: `@invana/graph` (home of `EdgeLODBehaviour`) is not imported
 * for its runtime — the editable option shape is mirrored here as
 * {@link EdgeLODOptions}, a serialisable patch applied via `setOptions`. Keep it
 * in sync with `EdgeLODBehaviourOptions` by hand.
 */

/** How the kept (never-thinned) edges are chosen (mirrors the engine enum). */
export type EdgeLODKeepBy = 'sample' | 'weight' | 'degree';

/**
 * The subset of `EdgeLODBehaviourOptions` this editor produces. The base
 * `id` / `targetLayerId` / `enabled` / `shortcuts` fields are out of scope.
 */
export interface EdgeLODOptions {
  /** Thin edges when `camera.scale` is below this. Default `0.5`. */
  minZoom?: number;
  /** Fraction of edges kept visible when thinned, in `(0, 1]`. Default `0.1`. */
  keepFraction?: number;
  /** Which edges survive: stable `'sample'`, highest `'weight'`, or `'degree'` backbone. */
  keepBy?: EdgeLODKeepBy;
  /** Numeric edge-`data` field used when `keepBy: 'weight'`. */
  weightKey?: string;
}

/** Flat form-field shape — matches {@link EdgeLODOptions} 1:1. */
export type EdgeLODFields = EdgeLODOptions;

/**
 * react-hook-form state shape. `<ObjectField name="options" …>` registers each
 * leaf under `options.<field>`, so the form's values nest under an `options` key.
 */
export interface EdgeLODFormState {
  options: EdgeLODFields;
}
