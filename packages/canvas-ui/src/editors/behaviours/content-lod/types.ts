/**
 * Types for the content-LOD editors (`NodeLabelLODBehaviour` /
 * `EdgeLabelLODBehaviour` / `IconLODBehaviour` / `ImageLODBehaviour`). They
 * share one option shape — a `{ minZoom, maxZoom }` zoom band, plus the label
 * behaviours' size knobs — so one editor serves all four; each passes its own
 * field schema.
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
  /** Show content at/below this camera scale. Blank / `null` = no upper bound. */
  maxZoom?: number | null;
  /**
   * Node labels only — keep labels shown for the top fraction of nodes by degree
   * centrality even below the band (e.g. `0.05` = top 5%).
   */
  alwaysShowTop?: number;
  /**
   * Labels only — how on-screen size follows zoom (`1` = with the world,
   * `0.5` = √zoom, `0` = fixed). `null` = leave label size alone.
   */
  zoomGrowth?: number | null;
  /** Labels only — smallest on-screen font size (CSS px). `null` = no floor. */
  minFontPx?: number | null;
  /** Labels only — largest on-screen font size (CSS px). `null` = no cap. */
  maxFontPx?: number | null;
}

/**
 * Flat form-field shape. The `@invana/forms` number field shows an unset value
 * as `0` and emits `0` when cleared, so the form can't say "blank": every field
 * is a plain number here, and the mapping turns a meaningless `0` back into
 * `null` (unset). `zoomGrowth` is the exception — `0` there means "fixed size" —
 * so the label editors carry the form-only {@link ContentLODFields.sizeLabels}
 * switch instead.
 */
export interface ContentLODFields {
  minZoom?: number;
  maxZoom?: number;
  alwaysShowTop?: number;
  zoomGrowth?: number;
  minFontPx?: number;
  maxFontPx?: number;
  /**
   * Label editors only, form-only — whether label sizing is on. Off sends
   * `zoomGrowth` / `minFontPx` / `maxFontPx` as `null` (no policy: labels keep
   * the size their host gives them); on sends them as edited.
   */
  sizeLabels?: boolean;
}

/**
 * react-hook-form state shape. `<ObjectField name="options" …>` registers each
 * leaf under `options.<field>`, so the form's values nest under an `options` key.
 */
export interface ContentLODFormState {
  options: ContentLODFields;
}
