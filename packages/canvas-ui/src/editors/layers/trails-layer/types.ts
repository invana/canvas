/**
 * Types for the TrailsLayer editor. Engine-agnostic: the editable shape is
 * mirrored here as a serialisable patch the consumer applies via `setOptions`.
 * Keep it in sync with `TrailsLayerOptions` by hand; `trackingBehaviourId` is
 * wiring (read once on mount) and is not editable.
 */

/** The subset of `TrailsLayerOptions` this editor produces. */
export interface TrailsLayerOptions {
  /** Which objects get a recent trail: the listed ids, or `'all'`. */
  ids?: readonly string[] | 'all';
  maxPoints?: number;
  maxAgeMs?: number;
  fadeBands?: number;
  /** `0xRRGGBB`. */
  color?: number;
  alpha?: number;
  strokeWidthPx?: number;
  fullTrackIds?: readonly string[];
  fullTrackMaxPoints?: number;
  publishDebounceMs?: number;
}

/** Flat form-field shape. The id lists are edited as comma-separated text; colour as `#rrggbb`. */
export interface TrailsLayerFields {
  /** `all`, or comma-separated ids. */
  ids?: string;
  maxPoints?: number;
  maxAgeMs?: number;
  fadeBands?: number;
  color?: string;
  alpha?: number;
  strokeWidthPx?: number;
  /** Comma-separated ids. */
  fullTrackIds?: string;
  fullTrackMaxPoints?: number;
  publishDebounceMs?: number;
}

/** Form state wrapper — the generator reads `options.<field>`. */
export interface TrailsLayerFormState {
  options: TrailsLayerFields;
}
