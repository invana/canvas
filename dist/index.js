import { WorldLayer, SpecProjector } from '@invana/canvas';
import { contourDensity } from 'd3-contour';

// src/DensityContourLayerBase.ts
var DENSITY_CONTOUR_BASE_DEFAULTS = {
  bandwidth: 20,
  thresholds: 10,
  cellSize: 4,
  padding: 50,
  recompute: "auto",
  recomputeDebounceMs: 120
};
var DensityContourLayerBase = class extends WorldLayer {
  graphLayerId;
  graph = null;
  specs = null;
  projector = null;
  /** Ids published on the previous recompute, so stale bands are retired. */
  published = [];
  subs = [];
  // Browser `setTimeout` returns `number`; using `ReturnType<typeof setTimeout>`
  // would resolve to NodeJS.Timeout in dual-typed environments and break the
  // `window.clearTimeout(...)` call site.
  debounceTimer = null;
  constructor(opts) {
    super({
      ...opts,
      // Density bands extend past node centres by `bandwidth + padding`, so
      // viewport culling against the bare node AABB would clip them.
      cullable: opts.cullable ?? false,
      // Passive overlay — clicks fall through to the graph below.
      hittable: opts.hittable ?? false
    });
    this.graphLayerId = opts.options.graphLayerId;
  }
  createState() {
    return {};
  }
  onMount(ctx) {
    const graph = ctx.layers.get(this.graphLayerId);
    if (!graph) {
      throw new Error(
        `${this.constructor.name} "${this.id}": graph layer "${this.graphLayerId}" not found. Add the GraphLayer before this contour layer.`
      );
    }
    this.graph = graph;
    const renderer = this.surface.primitives;
    this.specs = ctx.store.specsFor(this.id);
    this.projector = new SpecProjector(this.specs, renderer);
    const recompute = this.options.recompute ?? DENSITY_CONTOUR_BASE_DEFAULTS.recompute;
    if (recompute === "auto") {
      this.subs.push(graph.events.on("data:changed", () => this.scheduleRecompute()));
    }
    this.scheduleRecompute();
  }
  onUnmount() {
    for (const off of this.subs) off();
    this.subs.length = 0;
    if (this.debounceTimer !== null) {
      window.clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    this.projector?.destroy();
    this.projector = null;
    this.specs?.clear();
    this.specs = null;
    this.published = [];
    this.graph = null;
  }
  /**
   * Apply a config patch — the seam `canvas.update({ layers: { [id]: … } })`
   * (and therefore the settings editors + the React wrapper) drives. Merges
   * over the current options and repaints, so appearance fields (`bandwidth`,
   * `thresholds`, `cellSize`, `padding`, the subclass's fill / stroke fields)
   * are live-editable.
   *
   * `graphLayerId` is identity, not appearance — it's read once on mount, so
   * patching it here has no effect; re-add the layer to retarget it.
   */
  setOptions(patch) {
    Object.assign(this.options, patch);
    this.scheduleRecompute();
  }
  /**
   * Force an immediate recompute — e.g. in `recompute: 'manual'` mode, or after
   * a layout moved node positions without changing the data.
   */
  recompute() {
    this.computeAndPaint();
  }
  hitTest(_worldX, _worldY) {
    return null;
  }
  // ─── Internals ─────────────────────────────────────────────────────────────
  scheduleRecompute() {
    if (this.debounceTimer !== null) window.clearTimeout(this.debounceTimer);
    const wait = this.options.recomputeDebounceMs ?? DENSITY_CONTOUR_BASE_DEFAULTS.recomputeDebounceMs;
    this.debounceTimer = window.setTimeout(() => {
      this.debounceTimer = null;
      this.computeAndPaint();
    }, wait);
  }
  computeAndPaint() {
    const specs = this.specs;
    const graph = this.graph;
    if (!specs || !graph) return;
    const t0 = performance.now();
    const points = [];
    for (const node of graph.store.nodes()) {
      const p = node.position;
      if (!p) continue;
      points.push({ x: p.x, y: p.y });
    }
    if (points.length === 0) {
      this.retireBands([]);
      return;
    }
    const pad = this.options.padding ?? DENSITY_CONTOUR_BASE_DEFAULTS.padding;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of points) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
    minX -= pad;
    minY -= pad;
    maxX += pad;
    maxY += pad;
    const width = Math.max(1, Math.ceil(maxX - minX));
    const height = Math.max(1, Math.ceil(maxY - minY));
    const density = contourDensity().x((d) => d.x - minX).y((d) => d.y - minY).size([width, height]).bandwidth(this.options.bandwidth ?? DENSITY_CONTOUR_BASE_DEFAULTS.bandwidth).thresholds(this.options.thresholds ?? DENSITY_CONTOUR_BASE_DEFAULTS.thresholds).cellSize(this.options.cellSize ?? DENSITY_CONTOUR_BASE_DEFAULTS.cellSize)(points);
    this.retireBands(this.publishBands(specs, this.buildBands(density, minX, minY)));
    this.events.emit(
      "recompute",
      {
        thresholds: density.length,
        points: points.length,
        durationMs: performance.now() - t0
      }
    );
  }
  /** Publish this pass's bands, returning the ids used. */
  publishBands(specs, bands) {
    const ids = [];
    bands.forEach((spec, i) => {
      const id = `${this.id}:band:${i}`;
      ids.push(id);
      specs.set(id, { ...spec, zIndex: i });
      this.projector?.project(id);
    });
    return ids;
  }
  /** Drop bands published last pass that this pass no longer produced. */
  retireBands(current) {
    const keep = new Set(current);
    for (const id of this.published) {
      if (keep.has(id)) continue;
      this.specs?.delete(id);
      this.projector?.unproject(id);
    }
    this.published = current;
  }
};

// src/palettes.ts
var DENSITY_CONTOUR_PALETTES = {
  blues: [
    16251903,
    14609399,
    13032431,
    10406625,
    7057110,
    4362950,
    2191797,
    545180,
    536683
  ],
  greens: [
    16252149,
    15070688,
    13101504,
    10607003,
    7652470,
    4303709,
    2329413,
    27948,
    17435
  ],
  oranges: [
    16774635,
    16705230,
    16634018,
    16625259,
    16616764,
    15821075,
    14239745,
    10892803,
    8333060
  ],
  purples: [
    16579581,
    15724021,
    14342891,
    12369372,
    10394312,
    8420794,
    6967715,
    5515151,
    4128893
  ],
  reds: [
    16774640,
    16703698,
    16563105,
    16552562,
    16476746,
    15678252,
    13309981,
    10817301,
    6750221
  ],
  viridis: [
    4456788,
    4728952,
    4082057,
    3238030,
    2523790,
    2072201,
    3520377,
    7261784,
    11918891,
    16639781
  ],
  plasma: [
    854151,
    4588447,
    7471528,
    10229662,
    12400518,
    14178155,
    15563091,
    16424507,
    16632358,
    15792417
  ],
  magma: [
    4,
    1576765,
    4460406,
    7479169,
    10366847,
    13451377,
    15818845,
    16619112,
    16697997,
    16580031
  ],
  inferno: [
    4,
    1772609,
    4852843,
    7871597,
    10824800,
    13583430,
    15558949,
    16488966,
    16240957,
    16580516
  ],
  warm: [16772512, 16701814, 16691788, 16616764, 16535082, 14883356, 11599910],
  cool: [14740724, 12571622, 10403034, 9213638, 9202609, 8929693, 7209323]
};
var DENSITY_CONTOUR_PALETTE_NAMES = Object.keys(
  DENSITY_CONTOUR_PALETTES
);
function lerpColor(a, b, t) {
  const u = t <= 0 ? 0 : t >= 1 ? 1 : t;
  const ar = a >> 16 & 255;
  const ag = a >> 8 & 255;
  const ab = a & 255;
  const br = b >> 16 & 255;
  const bg = b >> 8 & 255;
  const bb = b & 255;
  const r = Math.round(ar + (br - ar) * u);
  const g = Math.round(ag + (bg - ag) * u);
  const bl = Math.round(ab + (bb - ab) * u);
  return r << 16 | g << 8 | bl;
}
function sampleStops(stops, index, total) {
  if (stops.length === 0) return 0;
  if (total <= 1 || stops.length === 1) return stops[stops.length - 1];
  const t = index / (total - 1);
  const pos = Math.max(0, Math.min(1, t)) * (stops.length - 1);
  const lo = Math.floor(pos);
  const hi = Math.min(stops.length - 1, lo + 1);
  return lerpColor(stops[lo], stops[hi], pos - lo);
}

// src/DensityContourFillLayer.ts
var FILL_DEFAULTS = {
  fillOpacity: 0.4,
  palette: "blues"
};
function resolveStops(palette) {
  if (Array.isArray(palette)) return palette;
  const name = palette ?? FILL_DEFAULTS.palette;
  return DENSITY_CONTOUR_PALETTES[name] ?? DENSITY_CONTOUR_PALETTES[FILL_DEFAULTS.palette];
}
var DensityContourFillLayer = class extends DensityContourLayerBase {
  kind = "density-contour-fill-layer";
  buildBands(density, offsetX, offsetY) {
    const opacity = this.options.fillOpacity ?? FILL_DEFAULTS.fillOpacity;
    const total = density.length;
    const colorAt = this.resolveFillColor();
    const out = [];
    density.forEach((band, i) => {
      const fillColor = colorAt(band.value, i, total);
      for (const polygon of band.coordinates) {
        const outer = polygon[0];
        if (!outer || outer.length < 3) continue;
        out.push({
          kind: "path",
          x: 0,
          y: 0,
          closed: true,
          points: outer.map((pt) => ({ x: (pt[0] ?? 0) + offsetX, y: (pt[1] ?? 0) + offsetY })),
          fill: [{ kind: "solid", color: fillColor, alpha: opacity }]
        });
      }
    });
    return out;
  }
  /**
   * Resolve the palette chain into a per-band colour function. Order
   * (most specific wins): {@link DensityContourFillLayerOptions.fillColor}
   * > `paletteFn(t)` > `paletteRangeStart`/`paletteRangeEnd` (both set) >
   * `palette` > default `'blues'`.
   */
  resolveFillColor() {
    const o = this.options;
    if (o.fillColor) return o.fillColor;
    if (o.paletteFn) {
      const fn = o.paletteFn;
      return (_v, i, n) => fn(n > 1 ? i / (n - 1) : 0);
    }
    if (o.paletteRangeStart !== void 0 && o.paletteRangeEnd !== void 0) {
      const a = o.paletteRangeStart;
      const b = o.paletteRangeEnd;
      return (_v, i, n) => lerpColor(a, b, n > 1 ? i / (n - 1) : 0);
    }
    const stops = resolveStops(o.palette);
    return (_v, i, n) => sampleStops(stops, i, n);
  }
};

// src/DensityContourStrokeLayer.ts
var STROKE_DEFAULTS = {
  strokeColor: 4620980,
  // steelblue — Observable's default
  strokeWidth: 0.5,
  palette: "blues"
};
function resolveStops2(palette) {
  if (Array.isArray(palette)) return palette;
  const name = palette ?? STROKE_DEFAULTS.palette;
  return DENSITY_CONTOUR_PALETTES[name] ?? DENSITY_CONTOUR_PALETTES[STROKE_DEFAULTS.palette];
}
var DensityContourStrokeLayer = class extends DensityContourLayerBase {
  kind = "density-contour-stroke-layer";
  buildBands(density, offsetX, offsetY) {
    const total = density.length;
    const widthAt = this.resolveWidth();
    const strokeAt = this.resolveStrokeColor();
    const out = [];
    density.forEach((band, i) => {
      const w = widthAt(i, total, band.value);
      if (w <= 0) return;
      for (const polygon of band.coordinates) {
        const outer = polygon[0];
        if (!outer || outer.length < 3) continue;
        out.push({
          kind: "path",
          x: 0,
          y: 0,
          closed: true,
          points: outer.map((pt) => ({ x: (pt[0] ?? 0) + offsetX, y: (pt[1] ?? 0) + offsetY })),
          stroke: { color: strokeAt(band.value, i, total), width: w }
        });
      }
    });
    return out;
  }
  /**
   * Resolve the per-band stroke-width function. Precedence:
   *   1. `strokeWidth` is a function → use it directly.
   *   2. All three index-contour sugar fields set → build
   *      `(i) => i % every === 0 ? major : minor`.
   *   3. `strokeWidth` is a number → constant.
   *   4. Default {@link STROKE_DEFAULTS.strokeWidth}.
   */
  resolveWidth() {
    const o = this.options;
    if (typeof o.strokeWidth === "function") return o.strokeWidth;
    if (o.indexEvery !== void 0 && o.indexMajorWidth !== void 0 && o.indexMinorWidth !== void 0) {
      const every = o.indexEvery;
      const major = o.indexMajorWidth;
      const minor = o.indexMinorWidth;
      return (i) => i % every === 0 ? major : minor;
    }
    const w = typeof o.strokeWidth === "number" ? o.strokeWidth : STROKE_DEFAULTS.strokeWidth;
    return () => w;
  }
  /**
   * Resolve the per-band stroke-colour function. When `strokeColor` is
   * `'palette'`, walk the palette chain (`paletteFn` > range > `palette`);
   * otherwise return a constant colour function. Default is steelblue.
   */
  resolveStrokeColor() {
    const o = this.options;
    const sc = o.strokeColor;
    if (sc === "palette") {
      if (o.paletteFn) {
        const fn = o.paletteFn;
        return (_v, i, n) => fn(n > 1 ? i / (n - 1) : 0);
      }
      if (o.paletteRangeStart !== void 0 && o.paletteRangeEnd !== void 0) {
        const a = o.paletteRangeStart;
        const b = o.paletteRangeEnd;
        return (_v, i, n) => lerpColor(a, b, n > 1 ? i / (n - 1) : 0);
      }
      const stops = resolveStops2(o.palette);
      return (_v, i, n) => sampleStops(stops, i, n);
    }
    const c = typeof sc === "number" ? sc : STROKE_DEFAULTS.strokeColor;
    return () => c;
  }
};

export { DENSITY_CONTOUR_PALETTES, DENSITY_CONTOUR_PALETTE_NAMES, DensityContourFillLayer, DensityContourLayerBase, DensityContourStrokeLayer, lerpColor, sampleStops };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map