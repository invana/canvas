/**
 * Types for `GeoFeaturesLayer` — GeoJSON (RFC 7946) features plus the few
 * properties the layer reads. Declared here rather than taken from
 * `@types/geojson`: the layer needs seven shapes and no dependency.
 */

/** `[longitude, latitude]` in degrees. */
export type Position = readonly [number, number];

export interface PointGeometry {
  type: 'Point';
  coordinates: Position;
}
export interface LineStringGeometry {
  type: 'LineString';
  coordinates: readonly Position[];
}
export interface MultiLineStringGeometry {
  type: 'MultiLineString';
  coordinates: readonly (readonly Position[])[];
}
/** `coordinates[0]` is the outer ring, the rest are holes. Rings are closed (first = last). */
export interface PolygonGeometry {
  type: 'Polygon';
  coordinates: readonly (readonly Position[])[];
}
export interface MultiPolygonGeometry {
  type: 'MultiPolygon';
  coordinates: readonly (readonly (readonly Position[])[])[];
}

/** The geometry kinds the layer draws. */
export type GeoGeometry =
  | PointGeometry
  | LineStringGeometry
  | MultiLineStringGeometry
  | PolygonGeometry
  | MultiPolygonGeometry;

/**
 * Properties the layer reads. Anything else rides along untouched and comes back
 * out of `toGeoJSON()`.
 *
 * **Style** follows [simplestyle-spec](https://github.com/mapbox/simplestyle-spec):
 * `stroke`, `stroke-width`, `stroke-opacity`, `fill`, `fill-opacity`. A colour is
 * `'#rrggbb'` (or a `0xRRGGBB` number). `stroke-width` is **screen pixels**.
 *
 * **Provenance** (all optional): where a feature came from and how far to trust it.
 */
export interface GeoFeatureProperties {
  [key: string]: unknown;

  // ── style (simplestyle) ──
  stroke?: string | number;
  'stroke-width'?: number;
  'stroke-opacity'?: number;
  fill?: string | number;
  'fill-opacity'?: number;

  // ── geometry helpers ──
  /** A `Point` with this is drawn as a circle of this ground radius. */
  radiusKm?: number;
  /** A `Point` with this also draws a translucent ring of this radius: "somewhere within". */
  uncertaintyKm?: number;

  // ── provenance ──
  /** Where it came from — a sensor, a report, a person. */
  source?: string;
  /** When it was reported, ISO 8601. */
  reportedAt?: string;
  /** Who recorded it. */
  author?: string;
  /** 0–1. Below the layer's `unconfirmed.below` the feature draws dashed and faded. */
  confidence?: number;
  /** Admiralty code: source grade A–F then information grade 1–6, e.g. `'B2'`. */
  reliability?: string;
  /** Free text (a banner such as `'RESTRICTED'`); the app decides what it means. */
  classification?: string;
  /** `false` forces the unconfirmed look regardless of `confidence`. */
  confirmed?: boolean;
}

/** One feature. `id` is required (unlike plain GeoJSON): the layer addresses features by it. */
export interface GeoFeature {
  type: 'Feature';
  id: string | number;
  geometry: GeoGeometry;
  properties?: GeoFeatureProperties | null;
}

/** A feature collection, as `toGeoJSON()` returns it. */
export interface GeoFeatureCollection {
  type: 'FeatureCollection';
  features: GeoFeature[];
}

/** How one kind of feature looks by default. Every field is optional. */
export interface GeoFeatureStyle {
  /** `'#rrggbb'` or `0xRRGGBB`. */
  stroke?: string | number;
  /** Stroke width in screen pixels. */
  strokeWidthPx?: number;
  strokeOpacity?: number;
  /** `'#rrggbb'` or `0xRRGGBB`. Lines have no fill. */
  fill?: string | number;
  fillOpacity?: number;
  /** `[dash, gap]` in screen pixels. */
  dash?: readonly [number, number];
  /** Radius of a `Point` with no `radiusKm`, in screen pixels. */
  pointRadiusPx?: number;
}
