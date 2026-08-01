/**
 * `air-routes` — world airports + land outline geo data.
 *
 * Companion dataset for the maplibre stories. Mirrors the data referenced
 * by Observable's
 * [`@d3/world-airports`](https://observablehq.com/@d3/world-airports) —
 * `airports.csv` (Natural Earth airports point set) and a 1:50m
 * land-only TopoJSON for the basemap stroke.
 *
 * See `air-routes/README.md` for sources, licensing, and the exact files
 * the JSON in this folder was derived from.
 *
 * @example
 * ```ts
 * import { airports, landTopology } from '@invana/graph-datasets';
 *
 * for (const a of airports) {
 *   const { x, y } = mapLayer.project([a.lng, a.lat]);
 *   // ...
 * }
 * ```
 */

import airportsData from './airports.json';
import type { GraphData } from '@invana/graph';

import landData from './land-50m.json';

/** A single airport point. */
export interface Airport {
  /** Airport name from the source CSV (e.g. `"London Heathrow Airport"`). */
  name: string;
  /** Longitude in degrees, WGS-84. */
  lng: number;
  /** Latitude in degrees, WGS-84. */
  lat: number;
}

/**
 * Loose TopoJSON shape — the world-50m land outline used by the d3
 * notebook. Typed structurally (no `topojson-specification` dep) since
 * consumers either pass this straight to `topojson-client.feature(...)`
 * or pluck `.objects.land` directly.
 */
export interface LandTopology {
  type: 'Topology';
  bbox?: [number, number, number, number];
  transform?: { scale: [number, number]; translate: [number, number] };
  arcs: number[][][];
  objects: {
    land: {
      type: 'MultiPolygon' | 'GeometryCollection';
      arcs?: unknown;
      geometries?: unknown[];
    };
  };
}

/**
 * All `2980` airport points from `airports.csv`. Order matches the source
 * CSV; ids are not assigned here because the source has no stable id
 * column — story code typically synthesizes ids from the array index
 * (`'ap-' + i`).
 */
export const airports: Airport[] = airportsData as Airport[];

/**
 * 1:50m world land outline as TopoJSON. Pair with `topojson-client.feature`
 * to materialize the GeoJSON `MultiPolygon`, then sample with `d3-geo`'s
 * `geoPath` over a custom canvas projection.
 */
export const landTopology: LandTopology = landData as unknown as LandTopology;

/**
 * The airports as an engine-ready node set (no edges — the routes themselves
 * aren't in this dataset). Ids are stable and derived from the source order
 * (`ap-0`, `ap-1`, …), which is what the older "synthesize an id from the
 * index" note describes; baking them in means two consumers of this dataset
 * agree on the same ids.
 *
 * Positions are deliberately **absent**: an airport's `lng` / `lat` are on
 * `data`, and it's the consumer's map projection that turns them into world
 * coordinates.
 */
export const data: GraphData = {
  nodes: airports.map((airport, i) => ({ id: `ap-${i}`, type: 'airport', data: airport })),
  edges: [],
};
