/**
 * `@invana/graph-layer-maplibre` — public types.
 *
 * The MapLayer owns a MapLibre GL JS map mounted as a sibling DOM element
 * underneath the Pixi canvas, and keeps the canvas camera mirrored to the
 * map's transform every time the user pans / zooms the map. Domain layers
 * (typically `GraphLayer` from `@invana/graph`) pin their content to
 * geographic coordinates via {@link MapLayer.project}.
 */

import type { EventMap } from '@invana/canvas';

/** Geographic coordinate as `[longitude, latitude]` in degrees. */
export type LngLat = readonly [number, number];

/** A world-coordinate point (mercator pixels at the layer's reference zoom). */
export interface WorldPoint {
  x: number;
  y: number;
}

/**
 * Construction-time options for {@link MapLayer}.
 *
 * The layer is intentionally thin: it hosts a MapLibre map, projects
 * `[lng, lat]` to stable world coords (web-mercator pixels at zoom 0), and
 * syncs the canvas camera so anything drawn at those world coords lines up
 * pixel-accurately with the basemap as the user pans / zooms.
 */
export interface MapLayerOptions {
  /**
   * MapLibre style URL. Defaults to the OpenFreeMap "liberty" style
   * (https://openfreemap.org) — free, no-key, OSM-based vector tiles. Pass a
   * different URL or a full StyleSpecification object to swap basemaps.
   */
  styleUrl?: string | object;

  /** Initial map centre as `[lng, lat]`. Default `[0, 20]`. */
  center?: LngLat;

  /** Initial MapLibre zoom level (0..22). Default `1.5`. */
  zoom?: number;

  /**
   * Minimum / maximum allowed MapLibre zoom. Defaults `0` / `22`. The canvas
   * camera mirrors `2^zoom` as its scale, so these implicitly clamp how far
   * the user can zoom the engine view too.
   */
  minZoom?: number;
  maxZoom?: number;

  /**
   * Optional DOM element the map is mounted into. If omitted, the layer
   * inserts a new `<div>` as the first child of the Pixi canvas's parent
   * element (so the basemap renders *behind* the Pixi canvas).
   */
  mountTarget?: HTMLElement;

  /**
   * Make the Pixi canvas pointer-event-transparent so MapLibre receives all
   * mouse / touch input (pan, zoom, click). Default `true`. Set `false` if
   * you want Pixi-layer behaviours (hover, click-select) to take input
   * priority — you'll then have to drive map pan/zoom by other means.
   */
  passInputToMap?: boolean;
}

/** {@link MapLayer} state — exposed via `layer.state.getState()`. */
export interface MapLayerState {
  /** True after the MapLibre `load` event has fired (style + first tiles in). */
  ready: boolean;
}

/** Event payloads emitted by {@link MapLayer}. */
export interface MapLayerEvents extends EventMap {
  /** Fired once after MapLibre's `load` event — style + initial tiles ready. */
  'map:ready': { center: [number, number]; zoom: number };
  /** Fired each time the map transform changes (move / zoom / resize). */
  'map:move': { center: [number, number]; zoom: number };
}
