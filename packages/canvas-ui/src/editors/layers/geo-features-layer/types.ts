/**
 * Types for the GeoFeaturesLayer editor. Engine-agnostic: the editable shape is
 * mirrored as a serialisable patch the consumer applies via `setOptions`. Keep it
 * in sync with `GeoFeaturesLayerOptions` by hand. The features themselves
 * (`features`) and the wiring (`mapLayerId`) are data, not settings, and are not
 * edited here.
 */

/** How one kind of feature looks by default. A colour is `0xRRGGBB` or `'#rrggbb'`. */
export interface GeoFeatureKindStyle {
  stroke?: string | number;
  strokeWidthPx?: number;
  strokeOpacity?: number;
  fill?: string | number;
  fillOpacity?: number;
  pointRadiusPx?: number;
}

/** The subset of `GeoFeaturesLayerOptions` this editor produces. */
export interface GeoFeaturesLayerOptions {
  defaults?: { polygon?: GeoFeatureKindStyle; line?: GeoFeatureKindStyle; point?: GeoFeatureKindStyle };
  labelKey?: string;
  labelFontPx?: number;
  labelColor?: string | number;
  labelBackground?: boolean;
  labelMinZoom?: number;
  labelMaxZoom?: number;
  unconfirmed?: { below?: number; alpha?: number };
  uncertaintyFillOpacity?: number;
  hitTolerancePx?: number;
  republishDebounceMs?: number;
}

/** Flat form-field shape: the three kind styles flattened to `polygonStroke`, `lineStrokeWidthPx`, … */
export interface GeoFeaturesLayerFields {
  polygonStroke?: string;
  polygonStrokeWidthPx?: number;
  polygonStrokeOpacity?: number;
  polygonFill?: string;
  polygonFillOpacity?: number;
  lineStroke?: string;
  lineStrokeWidthPx?: number;
  lineStrokeOpacity?: number;
  pointStroke?: string;
  pointStrokeWidthPx?: number;
  pointFill?: string;
  pointFillOpacity?: number;
  pointRadiusPx?: number;
  labelKey?: string;
  labelFontPx?: number;
  labelColor?: string;
  labelBackground?: boolean;
  labelMinZoom?: number;
  labelMaxZoom?: number;
  unconfirmedBelow?: number;
  unconfirmedAlpha?: number;
  uncertaintyFillOpacity?: number;
  hitTolerancePx?: number;
  republishDebounceMs?: number;
}

/** Form state wrapper — the generator reads `options.<field>`. */
export interface GeoFeaturesLayerFormState {
  options: GeoFeaturesLayerFields;
}
