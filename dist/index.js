import { Layer } from '@invana/canvas';
import maplibregl from 'maplibre-gl';

// src/MapLayer.ts

// src/mercator.ts
var WORLD_SIZE = 512;
var MAX_LATITUDE = 85.05112878;
function projectLngLat(lngLat) {
  const [lng, lat] = lngLat;
  const clampedLat = Math.max(-MAX_LATITUDE, Math.min(MAX_LATITUDE, lat));
  const sin = Math.sin(clampedLat * Math.PI / 180);
  const x = (lng + 180) / 360 * WORLD_SIZE;
  const y = (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * WORLD_SIZE;
  return { x, y };
}
function unprojectWorld(world) {
  const lng = world.x / WORLD_SIZE * 360 - 180;
  const n = Math.PI - 2 * Math.PI * (world.y / WORLD_SIZE);
  const lat = 180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
  return [lng, lat];
}

// src/MapLayer.ts
var DEFAULT_STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";
var MapLayer = class extends Layer {
  kind = "map-layer";
  map = null;
  mapContainer = null;
  ownsMapContainer = false;
  originalCanvasPointerEvents = null;
  originalCanvasPosition = null;
  originalCanvasZIndex = null;
  handleMapMove = () => this.syncCameraFromMap();
  constructor(opts) {
    super({
      ...opts,
      // The map is a basemap — clicks on empty map area should fall through
      // to the (non-existent) layer below, not be claimed here. Domain
      // layers above still hit-test normally.
      hittable: opts.hittable ?? false,
      // Always render — the map fills the whole viewport regardless of
      // where graph content sits.
      cullable: opts.cullable ?? false
    });
  }
  /** The underlying MapLibre Map. `null` before mount / after unmount. */
  get maplibre() {
    return this.map;
  }
  createState() {
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
  project(lngLat) {
    return projectLngLat(lngLat);
  }
  /**
   * Inverse of {@link project} — world coords back to `[lng, lat]`. Useful
   * for hit-testing or reporting the geographic location under a cursor.
   */
  unproject(world) {
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
  setOptions(patch) {
    Object.assign(this.options, patch);
    const map = this.map;
    if (!map) return;
    if (patch.styleUrl !== void 0) map.setStyle(patch.styleUrl);
    if (patch.minZoom !== void 0) map.setMinZoom(patch.minZoom);
    if (patch.maxZoom !== void 0) map.setMaxZoom(patch.maxZoom);
    if (patch.center !== void 0 || patch.zoom !== void 0) {
      map.jumpTo({
        ...patch.center ? { center: [patch.center[0], patch.center[1]] } : {},
        ...patch.zoom !== void 0 ? { zoom: patch.zoom } : {}
      });
    }
  }
  /** Pan/zoom the basemap to a new view. Camera follows automatically via `move`. */
  flyTo(opts) {
    if (!this.map) return;
    this.map.flyTo({
      center: opts.center ? [opts.center[0], opts.center[1]] : void 0,
      zoom: opts.zoom,
      duration: opts.duration ?? 1e3
    });
  }
  onMount(ctx) {
    const canvasEl = ctx.canvasElement;
    if (!canvasEl) {
      throw new Error(
        `MapLayer "${this.id}" requires a DOM-mounted Canvas (canvas.init), not the headless initWithStage path \u2014 there's no element to mount the basemap into.`
      );
    }
    const explicitTarget = this.options.mountTarget;
    if (explicitTarget) {
      this.mapContainer = explicitTarget;
    } else {
      const host = canvasEl.parentElement;
      if (!host) {
        throw new Error(
          `MapLayer "${this.id}": Pixi canvas has no parent element to mount the basemap into.`
        );
      }
      if (getComputedStyle(host).position === "static") {
        host.style.position = "relative";
      }
      const div = document.createElement("div");
      div.dataset.invanaMaplayerId = this.id;
      div.style.cssText = "position:absolute; inset:0; width:100%; height:100%; z-index:0; pointer-events:auto;";
      host.insertBefore(div, host.firstChild);
      this.mapContainer = div;
      this.ownsMapContainer = true;
    }
    this.originalCanvasPosition = canvasEl.style.position;
    this.originalCanvasZIndex = canvasEl.style.zIndex;
    if (getComputedStyle(canvasEl).position === "static") {
      canvasEl.style.position = "relative";
    }
    canvasEl.style.zIndex = "1";
    if (this.options.passInputToMap ?? true) {
      this.originalCanvasPointerEvents = canvasEl.style.pointerEvents;
      canvasEl.style.pointerEvents = "none";
    }
    const styleUrl = this.options.styleUrl ?? DEFAULT_STYLE_URL;
    const center = this.options.center ?? [0, 20];
    const zoom = this.options.zoom ?? 1.5;
    this.map = new maplibregl.Map({
      container: this.mapContainer,
      // MapLibre's typings accept `string | StyleSpecification`; we widen to
      // `object` in our public types and cast here.
      style: styleUrl,
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
      attributionControl: { compact: true }
    });
    this.map.on("move", this.handleMapMove);
    this.map.on("load", () => {
      this.state.update((s) => {
        s.ready = true;
      }, "map:ready");
      this.events.emit("map:ready", {
        center: [this.map.getCenter().lng, this.map.getCenter().lat],
        zoom: this.map.getZoom()
      });
      this.syncCameraFromMap();
    });
    this.syncCameraFromMap();
  }
  onUnmount(ctx) {
    if (this.map) {
      this.map.off("move", this.handleMapMove);
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
  syncCameraFromMap() {
    const map = this.map;
    const ctx = this.ctx;
    if (!map || !ctx) return;
    const zoom = map.getZoom();
    const scale = Math.pow(2, zoom);
    const ref = [0, 0];
    const screenRef = map.project([ref[0], ref[1]]);
    const worldRef = this.project(ref);
    const tx = screenRef.x - worldRef.x * scale;
    const ty = screenRef.y - worldRef.y * scale;
    ctx.camera.setTransform({ x: tx, y: ty, zoom: scale }, { clamp: false });
    this.events.emit("map:move", {
      center: [map.getCenter().lng, map.getCenter().lat],
      zoom
    });
  }
};

// src/greatCircle.ts
var DEG = Math.PI / 180;
var RAD = 180 / Math.PI;
function toCartesian(lng, lat) {
  const clng = Math.cos(lng * DEG);
  const slng = Math.sin(lng * DEG);
  const clat = Math.cos(lat * DEG);
  const slat = Math.sin(lat * DEG);
  return [clat * clng, clat * slng, slat];
}
function toLngLat(v) {
  const [x, y, z] = v;
  const lng = Math.atan2(y, x) * RAD;
  const lat = Math.atan2(z, Math.sqrt(x * x + y * y)) * RAD;
  return [lng, lat];
}
function greatCircleSamples(from, to, n) {
  if (n < 2) throw new Error(`greatCircleSamples: n must be >= 2 (got ${n})`);
  const a = toCartesian(from[0], from[1]);
  const b = toCartesian(to[0], to[1]);
  const dot = Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]));
  const omega = Math.acos(dot);
  const sinOmega = Math.sin(omega);
  const out = new Array(n);
  if (sinOmega < 1e-9) {
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      out[i] = [from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t];
    }
    return out;
  }
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const s1 = Math.sin((1 - t) * omega) / sinOmega;
    const s2 = Math.sin(t * omega) / sinOmega;
    const v = [
      s1 * a[0] + s2 * b[0],
      s1 * a[1] + s2 * b[1],
      s1 * a[2] + s2 * b[2]
    ];
    out[i] = toLngLat(v);
  }
  return out;
}

export { MapLayer, WORLD_SIZE, greatCircleSamples, projectLngLat, unprojectWorld };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map