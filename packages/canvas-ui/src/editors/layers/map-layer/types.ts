/**
 * Types for the MapLayer editor.
 *
 * Engine-agnostic: `@invana/graph-layer-maplibre` (home of `MapLayer` and its
 * options) is **not** imported — canvas-ui may only use `@invana/graph` types
 * (package CLAUDE.md). The editable option shape is mirrored here as
 * {@link MapLayerOptions}, a serialisable patch the consumer applies via
 * `setOptions`. Keep the fields in sync with the engine by hand.
 */

/**
 * The subset of `MapLayerOptions` this editor produces — a serialisable patch.
 * The `mountTarget` HTMLElement handle is out of scope (non-serialisable DOM
 * ref). `styleUrl` keeps only its scalar string form (a full StyleSpecification
 * object is out of scope and round-trips untouched). `center` keeps the
 * engine's `[lng, lat]` tuple encoding — the form flattens it (see `types` /
 * `mapping.ts`).
 */
export interface MapLayerOptions {
  /** MapLibre style URL (string form only). */
  styleUrl?: string;
  /** Initial map centre as `[lng, lat]` in degrees. */
  center?: [number, number];
  /** Initial MapLibre zoom level (0..22). */
  zoom?: number;
  /** Minimum allowed MapLibre zoom. */
  minZoom?: number;
  /** Maximum allowed MapLibre zoom. */
  maxZoom?: number;
  /**
   * Make the Pixi canvas pointer-transparent so MapLibre receives all input
   * (pan / zoom / click). Default `true`.
   */
  passInputToMap?: boolean;
}

/**
 * Flat form-field shape the `@invana/forms` generator renders. The engine's
 * `center: [lng, lat]` tuple is flattened to `centerLng` / `centerLat` scalars
 * (see `mapping.ts`), because a single field can't hold a tuple.
 */
export interface MapLayerFields {
  styleUrl?: string;
  /** Centre longitude in degrees. */
  centerLng?: number;
  /** Centre latitude in degrees. */
  centerLat?: number;
  zoom?: number;
  minZoom?: number;
  maxZoom?: number;
  passInputToMap?: boolean;
}

/** react-hook-form state — leaves register under `options.<field>`. */
export interface MapLayerFormState {
  options: MapLayerFields;
}
