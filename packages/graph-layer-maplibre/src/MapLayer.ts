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

import { computeTint } from './basemapTint';
import { projectLngLat, unprojectWorld } from './mercator';
import type {
  LngLat,
  MapCameraDriver,
  MapLayerEvents,
  MapLayerOptions,
  MapLayerState,
  WorldPoint,
} from './types';

/**
 * The style a `MapLayer` loads when it is not given one: a plain background, no
 * tiles, no sources — so a canvas makes **no outside request** unless the app
 * asks for a basemap with `styleUrl`.
 */
export const BLANK_STYLE = {
  version: 8,
  name: 'invana-blank',
  sources: {},
  layers: [{ id: 'background', type: 'background', paint: { 'background-color': '#eef0f3' } }],
} as const;

/** {@link BLANK_STYLE} on a dark surface: what `basemap: 'none'` draws while the canvas theme is dark. */
export const BLANK_STYLE_DARK = {
  ...BLANK_STYLE,
  name: 'invana-blank-dark',
  layers: [{ id: 'background', type: 'background', paint: { 'background-color': '#1a1c20' } }],
} as const;

/**
 * The built-in basemaps behind `MapLayerOptions.basemap` — free, keyless
 * [OpenFreeMap](https://openfreemap.org) styles. Exported so an app can name them
 * (a basemap picker's list) instead of repeating the URLs.
 */
export const OPENFREEMAP_STYLES = {
  light: 'https://tiles.openfreemap.org/styles/positron',
  dark: 'https://tiles.openfreemap.org/styles/dark',
  liberty: 'https://tiles.openfreemap.org/styles/liberty',
} as const;

export class MapLayer extends Layer<MapLayerOptions, MapLayerState, MapLayerEvents> {
  override readonly kind = 'map-layer';
  private map: maplibregl.Map | null = null;
  private mapContainer: HTMLDivElement | null = null;
  private ownsMapContainer = false;
  private originalCanvasPointerEvents: string | null = null;
  private originalCanvasPosition: string | null = null;
  private originalCanvasZIndex: string | null = null;
  /** Callbacks for a user drag of the map — see {@link cameraDriver}. */
  private readonly gestureListeners = new Set<() => void>();
  /** How many tools currently hold the map's drag / double-click-zoom / box-zoom. */
  private gestureHolds = 0;
  private readonly handleMapMove = (): void => this.syncCameraFromMap();
  /** Unsubscribe from `theme:change` — set on mount, cleared on unmount. */
  private offTheme: (() => void) | null = null;
  /** The style last handed to MapLibre, so a no-op re-resolve skips `setStyle`. */
  private appliedStyle: string | object | undefined;
  /** Whether the live style carries our `'themed'` paint overrides (so turning it off can reload a clean one). */
  private tinted = false;
  /** The tint found no layer to dress — warned once, not per theme change. */
  private warnedNoTint = false;

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
    // Delegates to the free function so callers without a layer instance (a
    // React tree shaping `data` before the layer mounts) get identical results.
    return projectLngLat(lngLat);
  }

  /**
   * Inverse of {@link project} — world coords back to `[lng, lat]`. Useful
   * for hit-testing or reporting the geographic location under a cursor.
   */
  unproject(world: WorldPoint): [number, number] {
    return unprojectWorld(world);
  }

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
  setOptions(patch: Partial<MapLayerOptions>): void {
    // `options` is declared readonly on the base `Layer` (construction-time
    // config); mutate in place so every reader sees one object.
    Object.assign(this.options, patch);
    const map = this.map;
    if (!map) return;

    if (patch.styleUrl !== undefined || patch.styleUrlDark !== undefined || patch.basemap !== undefined) {
      // Leaving `'themed'` must drop the overrides: the style may resolve to the
      // same URL, which `applyThemedStyle` would skip — so reload it clean.
      const leavingTint = this.tinted && patch.basemap !== undefined && patch.basemap !== 'themed';
      this.applyThemedStyle(leavingTint);
      this.applyTint();
    }
    if (patch.minZoom !== undefined) map.setMinZoom(patch.minZoom);
    if (patch.maxZoom !== undefined) map.setMaxZoom(patch.maxZoom);
    // One `jumpTo` for the view so a combined centre + zoom patch is a single
    // move (and a single camera sync), not two.
    if (patch.center !== undefined || patch.zoom !== undefined) {
      map.jumpTo({
        ...(patch.center ? { center: [patch.center[0], patch.center[1]] } : {}),
        ...(patch.zoom !== undefined ? { zoom: patch.zoom } : {}),
      });
    }
  }

  /**
   * The style for the canvas's current theme. An explicit style wins —
   * `styleUrlDark` while dark (when set), otherwise `styleUrl` — then the
   * {@link MapLayerOptions.basemap} built-in, then the blank style.
   */
  private resolveStyle(): string | object {
    const dark = this.ctx?.theme.current()?.kind === 'dark';
    const o = this.options;
    const explicit = (dark ? o.styleUrlDark : undefined) ?? o.styleUrl;
    if (explicit != null) return explicit;
    const b = o.basemap;
    if (b === 'light' || b === 'dark') return OPENFREEMAP_STYLES[b];
    if (b === 'auto' || b === 'themed') return dark ? OPENFREEMAP_STYLES.dark : OPENFREEMAP_STYLES.light;
    return dark ? BLANK_STYLE_DARK : BLANK_STYLE;
  }

  /** Whether the resolved style is a blank one: it takes the theme's surface like a themed basemap does. */
  private isBlank(): boolean {
    const s = this.resolveStyle();
    return s === BLANK_STYLE || s === BLANK_STYLE_DARK;
  }

  /**
   * `setStyle` only when the theme-resolved style actually changed (or `force`).
   * A swap drops the tint with the old style; the `style.load` handler re-applies it.
   */
  private applyThemedStyle(force = false): void {
    const next = this.resolveStyle();
    if (!this.map || (!force && next === this.appliedStyle)) return;
    this.appliedStyle = next;
    this.tinted = false;
    this.map.setStyle(next as string);
  }

  /**
   * Dress the loaded style in the published palette — `basemap: 'themed'` only.
   * Safe to call at any time: before the style is parsed, with no theme yet, or
   * under an empty palette it does nothing. Idempotent, so every `theme:change`
   * (including a family switch that leaves the style URL alone) can call it.
   */
  private applyTint(): void {
    const map = this.map;
    const theme = this.ctx?.theme.current();
    if (!map || !theme || (this.options.basemap !== 'themed' && !this.isBlank())) return;
    let layers: { id: string; type: string }[];
    try {
      layers = map.getStyle()?.layers ?? [];
    } catch {
      return; // style not parsed yet — `style.load` will call again
    }
    const ops = computeTint(layers, theme);
    if (ops.length === 0) {
      if (layers.length > 0 && Object.keys(theme.palette).length > 0 && !this.warnedNoTint) {
        this.warnedNoTint = true;
        console.warn(
          `[MapLayer] basemap 'themed': no layer of the loaded style matched the tint (layer ids it knows: background, water, landcover/landuse fills, building, road lines, boundary, symbols).`,
        );
      }
      return;
    }
    for (const { layer, prop, value } of ops) {
      try {
        map.setPaintProperty(layer, prop, value);
      } catch {
        /* a layer the style swapped out mid-flight — the next load re-applies */
      }
    }
    this.tinted = true;
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

  /**
   * Stop the map panning, double-click-zooming and box-zooming under a drawing
   * tool, and start reporting its raw pointer as `map:pointer` events. Returns the
   * **release** function. It is refcounted: two tools can hold the map, and it is
   * handed back only when the last lets go. Releasing twice is harmless, and an
   * unmounted layer restores everything itself.
   *
   * The wheel still zooms and the keyboard still works — a tool does not need
   * them off, and an analyst can zoom while drawing.
   *
   * ```ts
   * const release = map.suspendGestures();
   * // … draw …
   * release(); // always: on Escape, on tool exit, on unmount
   * ```
   */
  suspendGestures(): () => void {
    this.gestureHolds++;
    this.applyGestureHolds();
    let released = false;
    return () => {
      if (released) return;
      released = true;
      this.gestureHolds = Math.max(0, this.gestureHolds - 1);
      this.applyGestureHolds();
    };
  }

  /** Whether any tool currently holds the map's gestures. */
  get gesturesSuspended(): boolean {
    return this.gestureHolds > 0;
  }

  /** Disable or re-enable the three handlers to match the current holds. */
  private applyGestureHolds(): void {
    const map = this.map;
    if (!map) return;
    const hold = this.gestureHolds > 0;
    for (const handler of [map.dragPan, map.doubleClickZoom, map.boxZoom]) {
      if (hold) handler.disable();
      else handler.enable();
    }
  }

  /**
   * A camera driver for `@invana/graph`'s `TrackingBehaviour` follow mode. Under
   * a `MapLayer` the canvas camera is a mirror of the map, so following means
   * moving the **map**; the canvas camera then follows through `move`.
   *
   * ```ts
   * new TrackingBehaviour({ id: 'tracking', targetLayerId: 'vessels', cameraDriver: map.cameraDriver() });
   * ```
   *
   * `centerOn` takes world coordinates and keeps the zoom; `onUserGesture` fires
   * when the user **presses on the map** (a wheel zoom keeps the follow). It is a
   * press, not a drag: a follow camera re-centres every frame, which would stop a
   * drag from ever starting.
   */
  cameraDriver(): MapCameraDriver {
    return {
      centerOn: (x, y) => {
        this.map?.jumpTo({ center: unprojectWorld({ x, y }) });
      },
      onUserGesture: (cb) => {
        // The map may not exist yet (a behaviour registered right after the layer
        // is added), so callbacks are kept here and fired by the one `dragstart`
        // listener `onMount` installs.
        this.gestureListeners.add(cb);
        return () => {
          this.gestureListeners.delete(cb);
        };
      },
    };
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

    // Theme-resolved: a dark canvas loads the dark basemap straight away (no light flash).
    const styleUrl = this.resolveStyle();
    this.appliedStyle = styleUrl;
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
    this.offTheme = ctx.events.on('theme:change', () => {
      this.applyThemedStyle();
      // A family switch changes the palette without changing the style URL.
      this.applyTint();
    });
    // A (re)loaded style comes back unthemed — dress it again.
    this.map.on('style.load', () => this.applyTint());
    // The user taking the map: pressing on it. Not `dragstart` — a follow camera
    // re-centres the map every frame, and `jumpTo` resets MapLibre's drag handler
    // before a drag can start, so the drag would never be seen. A press is seen at once.
    const taken = (): void => {
      for (const cb of [...this.gestureListeners]) cb();
    };
    this.map.on('mousedown', taken);
    this.map.on('click', (e) => this.events.emit('map:click', { lngLat: [e.lngLat.lng, e.lngLat.lat], world: projectLngLat([e.lngLat.lng, e.lngLat.lat]) }));
    // Hover is one event per frame at most: a pointer can move far faster than anything reacts.
    let hoverFrame = 0;
    this.map.on('mousemove', (e) => {
      if (hoverFrame) return;
      const { lng, lat } = e.lngLat;
      hoverFrame = requestAnimationFrame(() => {
        hoverFrame = 0;
        this.events.emit('map:hover', { lngLat: [lng, lat], world: projectLngLat([lng, lat]) });
      });
    });
    // The raw pointer, for drawing tools (see `suspendGestures`). `move` at most once per frame.
    const pointer = (phase: 'down' | 'up' | 'dblclick') => (e: { lngLat: { lng: number; lat: number }; originalEvent?: MouseEvent }): void =>
      this.events.emit('map:pointer', {
        phase,
        lngLat: [e.lngLat.lng, e.lngLat.lat],
        world: projectLngLat([e.lngLat.lng, e.lngLat.lat]),
        button: e.originalEvent?.button ?? 0,
      });
    this.map.on('mousedown', pointer('down'));
    this.map.on('mouseup', pointer('up'));
    this.map.on('dblclick', pointer('dblclick'));
    let moveFrame = 0;
    this.map.on('mousemove', (e) => {
      if (moveFrame) return;
      const { lng, lat } = e.lngLat;
      const button = e.originalEvent?.buttons ?? 0;
      moveFrame = requestAnimationFrame(() => {
        moveFrame = 0;
        this.events.emit('map:pointer', { phase: 'move', lngLat: [lng, lat], world: projectLngLat([lng, lat]), button });
      });
    });
    // A tool that was already holding the map when it came up.
    this.applyGestureHolds();
    this.map.on('touchstart', taken);
    this.map.on('load', () => {
      this.state.update((s) => {
        s.ready = true;
      }, 'map:ready');
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
    this.gestureHolds = 0;
    this.offTheme?.();
    this.offTheme = null;
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

    // `setTransform` is the mirror-an-external-camera seam: it writes the
    // transform exactly as solved above (`setZoom` / `setPosition` would
    // re-anchor at the viewport centre with their own math, which doesn't match
    // MapLibre's), and emits `input:camera:zoom` / `input:camera:pan` on the
    // canvas bus so behaviours like `ScreenSizeBehaviour` and
    // `TextResolutionLODBehaviour` react to MapLibre-driven pan/zoom too.
    // Zoom is emitted only when the scale actually changed — most map gestures
    // are pan-only and those listeners are O(N) over their tracked entities.
    //
    // `clamp: false` because the camera's default zoom ceiling (100) sits far
    // below web mercator's scale range (2 ** 22 at max zoom); clamping would
    // peg the canvas away from the basemap.
    ctx.camera.setTransform({ x: tx, y: ty, zoom: scale }, { clamp: false });

    this.events.emit('map:move', {
      center: [map.getCenter().lng, map.getCenter().lat],
      zoom,
    });
  }
}
