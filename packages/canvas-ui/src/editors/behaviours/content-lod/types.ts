/**
 * Types for the content-LOD editors (`TextLODBehaviour` / `IconLODBehaviour` /
 * `ImageLODBehaviour`). The three behaviours share one option shape — a single
 * `{ minZoom, maxZoom }` zoom band — so one editor serves all three.
 *
 * Engine-agnostic: `@invana/graph` is not imported; the shape is mirrored here
 * as {@link ContentLODOptions}, a serialisable patch applied via `setOptions`.
 */

/**
 * The serialisable options a content-LOD behaviour takes — a zoom band. The base
 * `id` / `targetLayerId` / `enabled` / `shortcuts` fields are out of scope.
 */
export interface ContentLODOptions {
  /** Show content at/above this camera scale. Blank = no lower bound. */
  minZoom?: number;
  /** Show content at/below this camera scale. Blank = no upper bound. */
  maxZoom?: number;
  /**
   * Text only — keep labels shown for the top fraction of nodes by degree
   * centrality even below the band (e.g. `0.05` = top 5%). Ignored by the
   * icon / image behaviours.
   */
  alwaysShowTop?: number;
}

/** Flat form-field shape — matches {@link ContentLODOptions} 1:1 (both scalars). */
export type ContentLODFields = ContentLODOptions;

/**
 * react-hook-form state shape. `<ObjectField name="options" …>` registers each
 * leaf under `options.<field>`, so the form's values nest under an `options` key.
 */
export interface ContentLODFormState {
  options: ContentLODFields;
}
