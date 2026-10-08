import { EventMap, Layer, LayerOptions, CanvasContext } from '@invana/canvas';
import maplibregl from 'maplibre-gl';

/**
 * `@invana/graph-layer-maplibre` — public types.
 *
 * The MapLayer owns a MapLibre GL JS map mounted as a sibling DOM element
 * underneath the Pixi canvas, and keeps the canvas camera mirrored to the
 * map's transform every time the user pans / zooms the map. Domain layers
 * (typically `GraphLayer` from `@invana/graph`) pin their content to
 * geographic coordinates via {@link MapLayer.project}.
 */

/** Geographic coordinate as `[longitude, latitude]` in degrees. */
type LngLat = readonly [number, number];
/** A world-coordinate point (mercator pixels at the layer's reference zoom). */
interface WorldPoint {
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
interface MapLayerOptions {
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
interface MapLayerState {
    /** True after the MapLibre `load` event has fired (style + first tiles in). */
    ready: boolean;
}
/** Event payloads emitted by {@link MapLayer}. */
interface MapLayerEvents extends EventMap {
    /** Fired once after MapLibre's `load` event — style + initial tiles ready. */
    'map:ready': {
        center: [number, number];
        zoom: number;
    };
    /** Fired each time the map transform changes (move / zoom / resize). */
    'map:move': {
        center: [number, number];
        zoom: number;
    };
}

/**
 * `MapLayer` — hosts a MapLibre GL JS basemap underneath the Pixi canvas
 * and mirrors its camera transform into `canvas.camera` every frame the map
 * moves. Domain layers (graph, contours, anything drawing in world coords)
 * pin their content to geographic positions via {@link MapLayer.project}.
 *
 * ## Why a Layer at all
 *
 * MapLibre owns its own canvas, camera, and input handling — none of which
 * compose with PixiJS directly. We model the integration as a two-stack
 * overlay:
 *
 * ```
 *   ┌─ host element (the user's container) ─────────────────────────────┐
 *   │  ┌─ MapLibre <div> ────────────────────────────────────────────┐  │
 *   │  │  basemap tiles  (MapLibre's own webgl canvas)               │  │
 *   │  └─────────────────────────────────────────────────────────────┘  │
 *   │  ┌─ Pixi <canvas> (this engine, transparent) ──────────────────┐  │
 *   │  │  graph nodes / edges / overlays                             │  │
 *   │  └─────────────────────────────────────────────────────────────┘  │
 *   └────────────────────────────────────────────────────────────────────┘
 * ```
 *
 * MapLibre drives all pan / zoom — the Pixi canvas is pointer-event-
 * transparent by default so the map receives clicks and drags natively.
 * The MapLayer subscribes to `map.on('move', ...)` and rewrites the
 * `pixi-viewport` transform so the two canvases stay pixel-aligned. Result:
 * a node at world `(x, y)` (= the mercator-pixel projection of some
 * `[lng, lat]`) always lands on the same screen pixel as MapLibre's own
 * `map.project([lng, lat])`.
 *
 * ## Coordinate model
 *
 * The MapLayer projects `[lng, lat]` to **web-mercator pixel coordinates at
 * zoom 0**, where the entire world is a 512×512 px square (MapLibre's tile
 * convention). Two consequences worth understanding:
 *
 * 1. **World positions are stable.** A node's world `(x, y)` doesn't change
 *    when the user zooms the map — only the camera transform does. That
 *    means downstream layers (graph, contours, layouts) don't need to be
 *    re-fed on zoom; they just keep their cached positions.
 * 2. **Canvas scale = `2^zoom`.** The mirrored transform is
 *    `viewport.scale = 2^map.getZoom()`, and `viewport.position` is solved
 *    so the reference point `(lng=0, lat=0)` lands where MapLibre projects
 *    it. Bearing and pitch are locked to 0 because the canvas camera is
 *    affine + uniform-scale; map rotation/tilt would desync the two stacks.
 *
 * ## Constraints
 *
 * - Requires `canvas.init(...)` — the headless `initWithStage` path has no
 *   DOM, so there's nowhere to mount the map. The layer throws on mount
 *   in that case.
 * - Don't register `DragPanBehaviour` / `WheelZoomBehaviour` /
 *   `PinchZoomBehaviour` alongside this layer. They'd fight the map for
 *   the camera, and on a pointer-events-none canvas they'd never see input
 *   anyway.
 * - Cross-layer dependencies (e.g. a graph layer needing the projection)
 *   declare their dep with an explicit `mapLayerId` option and resolve it
 *   via `ctx.layers.get<MapLayer>(...)`. Don't reach for the layer by
 *   guessing — see `architecture-proposal.md` §2.4.
 */

declare class MapLayer extends Layer<MapLayerOptions, MapLayerState, MapLayerEvents> {
    readonly kind = "map-layer";
    private map;
    private mapContainer;
    private ownsMapContainer;
    private originalCanvasPointerEvents;
    private originalCanvasPosition;
    private originalCanvasZIndex;
    private readonly handleMapMove;
    constructor(opts: LayerOptions<MapLayerOptions>);
    /** The underlying MapLibre Map. `null` before mount / after unmount. */
    get maplibre(): maplibregl.Map | null;
    protected createState(): MapLayerState;
    /**
     * Project a geographic coordinate to canvas world coordinates.
     *
     * Returns mercator pixels at zoom 0 (a 512×512 square for the whole
     * earth). Stable across map zoom — pin nodes once at setup and let the
     * camera handle the rest.
     *
     * @example
     *   const { x, y } = mapLayer.project([airport.lng, airport.lat]);
     *   graphLayer.setData({ nodes: [{ id, position: { x, y }, ... }], ... });
     */
    project(lngLat: LngLat): WorldPoint;
    /**
     * Inverse of {@link project} — world coords back to `[lng, lat]`. Useful
     * for hit-testing or reporting the geographic location under a cursor.
     */
    unproject(world: WorldPoint): [number, number];
    /**
     * Apply a config patch — the seam `canvas.update({ layers: { [id]: … } })`
     * (and therefore the settings editors + the React wrapper) drives. Merges
     * over the current options, then pushes the live-changeable ones to MapLibre:
     * `styleUrl` swaps the basemap, `center` / `zoom` jump the view, `minZoom` /
     * `maxZoom` re-clamp it.
     *
     * Mount-time-only fields (`mountTarget`, `passInputToMap`) are stored but not
     * re-applied — remove and re-add the layer to change those.
     */
    setOptions(patch: Partial<MapLayerOptions>): void;
    /** Pan/zoom the basemap to a new view. Camera follows automatically via `move`. */
    flyTo(opts: {
        center?: LngLat;
        zoom?: number;
        duration?: number;
    }): void;
    protected onMount(ctx: CanvasContext): void;
    protected onUnmount(ctx: CanvasContext): void;
    /**
     * Solve for the pixi-viewport transform that lines our world axes up with
     * MapLibre's screen pixels.
     *
     * Pixi viewport projects `world -> screen` as `s = w * scale + position`.
     * We pick a fixed reference point (`lng=0, lat=0` — the mercator equator
     * meridian intersection, world coord `(256, 256)` at our reference zoom)
     * and solve:
     *
     *   screen_of_lat0lng0  =  worldRef * (2 ** map.zoom)  +  viewport.position
     *
     * `screen_of_lat0lng0` comes straight from `map.project([0, 0])` —
     * MapLibre handles all the map's internal padding / world-wrap / pixel
     * ratio for us. We then rewrite `viewport.position` to match.
     */
    private syncCameraFromMap;
}

/**
 * Standalone web-mercator projection — the same math `MapLayer.project` /
 * `MapLayer.unproject` use, exported as free functions so callers can pin data
 * to world coordinates **without holding a layer instance**.
 *
 * That matters for declarative hosts: a React tree builds its `data` before any
 * layer exists (the `<MapLayer>` wrapper constructs the engine layer inside its
 * own effect), so `map.project(...)` isn't reachable at data-shaping time. The
 * projection is pure and camera-independent, so it needs no instance.
 */

/**
 * Edge of the mercator world in canvas world units: mercator pixels at zoom 0,
 * i.e. a 512×512 square for the whole earth (MapLibre's tile convention).
 */
declare const WORLD_SIZE = 512;
/**
 * Project a geographic coordinate to canvas world coordinates (mercator pixels
 * at zoom 0). Stable across map zoom — pin nodes once at setup and let the
 * camera handle the rest.
 *
 * @example
 *   const { x, y } = projectLngLat([airport.lng, airport.lat]);
 *   nodes.push({ id, position: { x, y }, data: { … } });
 */
declare function projectLngLat(lngLat: LngLat): WorldPoint;
/** Inverse of {@link projectLngLat} — world coords back to `[lng, lat]`. */
declare function unprojectWorld(world: WorldPoint): [number, number];

/**
 * Spherical interpolation between two `[lng, lat]` points along the
 * great-circle (shortest path on the sphere). Returns `n` evenly-spaced
 * samples *including* both endpoints.
 *
 * Used by stories drawing flight routes / airline arcs: the projected
 * polyline of these samples reads as a smooth curve on a mercator basemap.
 * Pure function, no engine dependency — exposed from
 * `@invana/graph-layer-maplibre` because it pairs with {@link MapLayer.project},
 * but works fine without the layer too.
 *
 * Algorithm: classic Slerp on unit-sphere 3-vectors derived from
 * `(lng, lat)`. Falls back to linear interpolation when the two points are
 * effectively coincident (angle ≈ 0), which keeps tiny self-loops from
 * dividing by zero in `sin(0)`.
 */
type LngLatTuple = readonly [number, number];
/**
 * Sample `n` points (`n >= 2`) along the great circle from `from` to `to`.
 *
 * - `n = 2` returns just the endpoints.
 * - `n = 32` (the typical default for flight arcs) gives a visually-smooth
 *   curve at most map zooms; bump to 64+ for long transoceanic routes.
 */
declare function greatCircleSamples(from: LngLatTuple, to: LngLatTuple, n: number): [number, number][];

export { type LngLat, type LngLatTuple, MapLayer, type MapLayerEvents, type MapLayerOptions, type MapLayerState, WORLD_SIZE, type WorldPoint, greatCircleSamples, projectLngLat, unprojectWorld };
