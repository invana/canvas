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

import { Layer, type CanvasContext, type LayerOptions } from '@invana/canvas';
import maplibregl from 'maplibre-gl';

import type {
  LngLat,
  MapLayerEvents,
  MapLayerOptions,
  MapLayerState,
  WorldPoint,
} from './types';

/** Width/height in world units of the whole earth at our reference zoom (= MapLibre tile size at zoom 0). */
const WORLD_SIZE = 512;

const DEFAULT_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';

export class MapLayer extends Layer<MapLayerOptions, MapLayerState, MapLayerEvents> {
  private map: maplibregl.Map | null = null;
  private mapContainer: HTMLDivElement | null = null;
  private ownsMapContainer = false;
  private originalCanvasPointerEvents: string | null = null;
  private originalCanvasPosition: string | null = null;
  private originalCanvasZIndex: string | null = null;
  /**
   * Last camera scale we pushed to the bus on a `camera:zoom` event.
   * `syncCameraFromMap` writes the viewport directly (it has to, to mirror
   * MapLibre's transform exactly), so the bus only learns about zoom
   * changes when we emit them. Skip the emit when scale is unchanged
   * (pan-only frames) so listeners like `ScreenSizeBehaviour` don't pay
   * the O(N) reflow cost on every pan tick.
   */
  private lastEmittedScale: number | null = null;
  private readonly handleMapMove = (): void => this.syncCameraFromMap();

  constructor(opts: LayerOptions<MapLayerOptions>) {
    super({
      ...opts,
      // The map is a basemap — clicks on empty map area should fall through
      // to the (non-existent) layer below, not be claimed here. Domain
      // layers above still hit-test normally.
      hittable: opts.hittable ?? false,
      // Always render — the map fills the whole viewport regardless of
      // where graph content sits.
      cullable: opts.cullable ?? false,
    });
  }

  /** The underlying MapLibre Map. `null` before mount / after unmount. */
  get maplibre(): maplibregl.Map | null {
    return this.map;
  }

  protected createState(): MapLayerState {
    return { ready: false };
  }

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
  project(lngLat: LngLat): WorldPoint {
    const [lng, lat] = lngLat;
    const clampedLat = Math.max(-85.05112878, Math.min(85.05112878, lat));
    const sin = Math.sin((clampedLat * Math.PI) / 180);
    const x = ((lng + 180) / 360) * WORLD_SIZE;
    const y = (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * WORLD_SIZE;
    return { x, y };
  }

  /**
   * Inverse of {@link project} — world coords back to `[lng, lat]`. Useful
   * for hit-testing or reporting the geographic location under a cursor.
   */
  unproject(world: WorldPoint): [number, number] {
    const lng = (world.x / WORLD_SIZE) * 360 - 180;
    const n = Math.PI - 2 * Math.PI * (world.y / WORLD_SIZE);
    const lat = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
    return [lng, lat];
  }

  /** Pan/zoom the basemap to a new view. Camera follows automatically via `move`. */
  flyTo(opts: { center?: LngLat; zoom?: number; duration?: number }): void {
    if (!this.map) return;
    this.map.flyTo({
      center: opts.center ? [opts.center[0], opts.center[1]] : undefined,
      zoom: opts.zoom,
      duration: opts.duration ?? 1000,
    });
  }

  protected override onMount(ctx: CanvasContext): void {
    const canvasEl = ctx.canvasElement;
    if (!canvasEl) {
      throw new Error(
        `MapLayer "${this.id}" requires a DOM-mounted Canvas (canvas.init), ` +
          `not the headless initWithStage path — there's no element to mount the basemap into.`,
      );
    }

    const explicitTarget = this.options.mountTarget;
    if (explicitTarget) {
      this.mapContainer = explicitTarget as HTMLDivElement;
    } else {
      const host = canvasEl.parentElement;
      if (!host) {
        throw new Error(
          `MapLayer "${this.id}": Pixi canvas has no parent element to mount the basemap into.`,
        );
      }
      // Ensure absolute children stack correctly against the host.
      if (getComputedStyle(host).position === 'static') {
        host.style.position = 'relative';
      }
      const div = document.createElement('div');
      div.dataset.invanaMaplayerId = this.id;
      // `z-index: 0` keeps the map below the canvas (which we hoist to
      // `z-index: 1` below). DOM-order alone isn't enough: an absolutely-
      // positioned sibling stacks above a statically-positioned one
      // regardless of source order, which would put the basemap on top of
      // the Pixi canvas and hide everything drawn there.
      div.style.cssText =
        'position:absolute; inset:0; width:100%; height:100%; z-index:0; pointer-events:auto;';
      host.insertBefore(div, host.firstChild);
      this.mapContainer = div;
      this.ownsMapContainer = true;
    }

    // Hoist the Pixi canvas above the basemap. `z-index` is a no-op on a
    // statically-positioned element, so we also force `position: relative`
    // (preserves layout flow). Originals are stashed and restored on unmount.
    this.originalCanvasPosition = canvasEl.style.position;
    this.originalCanvasZIndex = canvasEl.style.zIndex;
    if (getComputedStyle(canvasEl).position === 'static') {
      canvasEl.style.position = 'relative';
    }
    canvasEl.style.zIndex = '1';

    // Pixi canvas → input-transparent so MapLibre's gestures reach the map.
    if (this.options.passInputToMap ?? true) {
      this.originalCanvasPointerEvents = canvasEl.style.pointerEvents;
      canvasEl.style.pointerEvents = 'none';
    }

    const styleUrl = this.options.styleUrl ?? DEFAULT_STYLE_URL;
    const center = this.options.center ?? [0, 20];
    const zoom = this.options.zoom ?? 1.5;

    this.map = new maplibregl.Map({
      container: this.mapContainer,
      // MapLibre's typings accept `string | StyleSpecification`; we widen to
      // `object` in our public types and cast here.
      style: styleUrl as string,
      center: [center[0], center[1]],
      zoom,
      minZoom: this.options.minZoom ?? 0,
      maxZoom: this.options.maxZoom ?? 22,
      // Lock orientation: our pixi camera is uniform-scale, no rotation/tilt.
      bearing: 0,
      pitch: 0,
      dragRotate: false,
      pitchWithRotate: false,
      touchPitch: false,
      attributionControl: { compact: true },
    });

    this.map.on('move', this.handleMapMove);
    this.map.on('load', () => {
      this.state.setState((s) => {
        s.ready = true;
      });
      this.events.emit('map:ready', {
        center: [this.map!.getCenter().lng, this.map!.getCenter().lat],
        zoom: this.map!.getZoom(),
      });
      this.syncCameraFromMap();
    });

    // Sync once up front so the canvas transform is in the right place
    // before tiles finish loading.
    this.syncCameraFromMap();
  }

  protected override onUnmount(ctx: CanvasContext): void {
    if (this.map) {
      this.map.off('move', this.handleMapMove);
      this.map.remove();
      this.map = null;
    }
    if (this.ownsMapContainer && this.mapContainer?.parentElement) {
      this.mapContainer.parentElement.removeChild(this.mapContainer);
    }
    this.mapContainer = null;
    this.ownsMapContainer = false;

    if (ctx.canvasElement) {
      const el = ctx.canvasElement;
      if (this.originalCanvasPointerEvents !== null) {
        el.style.pointerEvents = this.originalCanvasPointerEvents;
      }
      if (this.originalCanvasPosition !== null) {
        el.style.position = this.originalCanvasPosition;
      }
      if (this.originalCanvasZIndex !== null) {
        el.style.zIndex = this.originalCanvasZIndex;
      }
    }
    this.originalCanvasPointerEvents = null;
    this.originalCanvasPosition = null;
    this.originalCanvasZIndex = null;
    this.lastEmittedScale = null;
  }

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
  private syncCameraFromMap(): void {
    const map = this.map;
    const ctx = this.ctx;
    if (!map || !ctx) return;

    const zoom = map.getZoom();
    const scale = Math.pow(2, zoom);

    const ref: LngLat = [0, 0];
    const screenRef = map.project([ref[0], ref[1]]);
    const worldRef = this.project(ref);

    const tx = screenRef.x - worldRef.x * scale;
    const ty = screenRef.y - worldRef.y * scale;

    // Direct viewport writes — `camera.setZoom` / `setPosition` would
    // re-anchor at the viewport centre (their own math), which doesn't
    // match MapLibre's exact transform. We mirror the transform raw, then
    // bridge the resulting camera change onto the canvas event bus below
    // so behaviours subscribed to `input:camera:zoom` / `input:camera:pan` (e.g.
    // `ScreenSizeBehaviour`, `LabelResolutionLODBehaviour`) react to
    // MapLibre-driven pan/zoom too. Without this bridge those listeners
    // are silently never called when the map drives the camera.
    ctx.camera.viewport.scale.set(scale);
    ctx.camera.viewport.position.set(tx, ty);

    // `input:camera:zoom` only when scale actually changes — most map gestures
    // are pan-only and the reflow listeners are O(N) over their tracked
    // entities, so we don't want to fire on every move tick during a
    // long pan.
    if (this.lastEmittedScale === null || this.lastEmittedScale !== scale) {
      ctx.events.emit('input:camera:zoom', {
        scale,
        centerX: ctx.camera.screenWidth / 2,
        centerY: ctx.camera.screenHeight / 2,
      });
      this.lastEmittedScale = scale;
    }
    ctx.events.emit('input:camera:pan', { x: tx, y: ty });

    this.events.emit('map:move', {
      center: [map.getCenter().lng, map.getCenter().lat],
      zoom,
    });
  }
}
