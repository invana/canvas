/**
 * `GeoFeaturesLayer` — areas, routes and radii from GeoJSON. A `WorldLayer` that
 * owns a set of features (RFC 7946: `Polygon` with holes, `MultiPolygon`,
 * `LineString`, `MultiLineString`, `Point` with `radiusKm`) and publishes them as
 * specs. A feature is **not a node**: it never enters a layout, a legend count or
 * the unsaved tracker (the `GroupFramesLayer` pattern).
 *
 * - **Style** comes from a feature's simplestyle `properties`, else the per-kind
 *   `defaults` in config. Widths are **screen pixels**: the layer republishes on
 *   zoom *settle*, so a border is one thickness at every zoom.
 * - **Labels** sit at the visual centre of the largest polygon (holes respected),
 *   from `properties[labelKey]`, in a renderer label policy that keeps them one
 *   size on screen.
 * - **Trust.** Provenance fields ride on `properties`; a feature that is
 *   `confirmed: false` or has `confidence` under `unconfirmed.below` draws dashed
 *   and faded, and `uncertaintyKm` draws a translucent ring around a point.
 * - **Events.** `feature:click` / `feature:hover`. Under a `MapLayer` the map owns
 *   the pointer, so pass its id as `mapLayerId` and the layer listens to the map's
 *   forwarded `map:click` / `map:hover`; on a plain canvas it listens to the canvas.
 * - **Data.** Features live in this layer (not the kernel's annotation
 *   collection, which has no undo path), addressed by `id`. `toGeoJSON()` gives
 *   them back.
 *
 * Geometry is cached per feature, so a zoom changes paint only.
 */

import { SpecProjector, WorldLayer } from '@invana/canvas';
import type {
  BaseShapeSpec,
  CanvasContext,
  CircleSpec,
  EventMap,
  LayerOptions,
  PathSpec,
  ShapeLabelStyle,
  SpecStore,
  WorldLayerHit,
} from '@invana/canvas';
import polylabel from 'polylabel';

import { unprojectWorld } from '../mercator';
import type { MapLayer } from '../MapLayer';
import {
  boundsOf,
  centred,
  distanceToLine,
  keyholeRing,
  openRing,
  pointInPolygon,
  prepare,
  radiusKmToWorld,
  signedArea,
  validateGeometry,
  type Prepared,
  type Pt,
} from './geometry';
import { provenanceProblems } from './provenance';
import { resolveStyle, type ResolvedStyle, type StyleKind, type UnconfirmedRule } from './style';
import type { GeoFeature, GeoFeatureCollection, GeoFeatureStyle } from './types';

/** Options for {@link GeoFeaturesLayer}. Everything but `mapLayerId` is a setting (`config.layers.<id>`). */
export interface GeoFeaturesLayerOptions {
  /** Wiring: id of the `MapLayer` whose forwarded clicks / hovers pick features. Omit on a plain canvas. */
  mapLayerId?: string;
  /** The features to draw. Setting it again replaces them all. */
  features?: readonly GeoFeature[];
  /** How each kind of feature looks when its `properties` do not say. */
  defaults?: { polygon?: GeoFeatureStyle; line?: GeoFeatureStyle; point?: GeoFeatureStyle };
  /** The property a label reads. Default `'name'`. */
  labelKey?: string;
  /** Label size in screen pixels. Default `12`. */
  labelFontPx?: number;
  /** Label colour, `'#rrggbb'` or `0xRRGGBB`. Default near-black. */
  labelColor?: string | number;
  /** A white pill behind the label. Default `true`. */
  labelBackground?: boolean;
  /** Labels show from this camera scale (`2 ** mapZoom`). Default: always. */
  labelMinZoom?: number;
  /** Labels hide above this camera scale. Default: never. */
  labelMaxZoom?: number;
  /** The unconfirmed look. */
  unconfirmed?: UnconfirmedRule;
  /** Opacity of the `uncertaintyKm` ring's fill. Default `0.12`. */
  uncertaintyFillOpacity?: number;
  /** A click or hover within this many screen pixels of a line or point hits it. Default `6`. */
  hitTolerancePx?: number;
  /** Wait this long after a zoom or an edit before republishing. Default `100` ms. */
  republishDebounceMs?: number;
}

/** Events emitted by {@link GeoFeaturesLayer}. */
export interface GeoFeaturesLayerEvents extends EventMap {
  /** A feature was clicked. */
  'feature:click': { id: string; feature: GeoFeature; lngLat: [number, number]; world: Pt };
  /** The feature under the pointer changed (`null` id when it left every feature). */
  'feature:hover': { id: string | null; feature: GeoFeature | null; lngLat: [number, number]; world: Pt };
  /** A repaint finished — `features` repainted, `specs` published, and how long it took. For diagnostics and budgets. */
  publish: { features: number; specs: number; durationMs: number };
}

/** Defaults for {@link GeoFeaturesLayerOptions}. */
export const GEO_FEATURES_LAYER_DEFAULTS = {
  labelKey: 'name',
  labelFontPx: 12,
  labelColor: 0x111827,
  labelBackground: true,
  uncertaintyFillOpacity: 0.12,
  hitTolerancePx: 6,
  republishDebounceMs: 100,
} as const;

/** What the layer keeps per feature. */
interface Entry {
  feature: GeoFeature;
  prepared: Prepared;
  /** The visual-centre label point, in world units, when the feature has one. */
  labelAt: Pt | null;
  /** Spec ids published for it. */
  specIds: string[];
}

const kindOf = (p: Prepared): StyleKind => (p.kind === 'polygons' ? 'polygon' : p.kind === 'lines' ? 'line' : 'point');

export class GeoFeaturesLayer extends WorldLayer<GeoFeaturesLayerOptions, object, GeoFeaturesLayerEvents, never, WorldLayerHit> {
  override readonly kind = 'geo-features-layer';

  private readonly entries = new Map<string, Entry>();
  private specs: SpecStore<BaseShapeSpec> | null = null;
  private projector: SpecProjector<BaseShapeSpec> | null = null;
  private readonly subs: Array<() => void> = [];
  private timer: ReturnType<typeof setTimeout> | null = null;
  /** The camera scale the last publish was made at. */
  private paintedScale = 0;
  private labelTier = 0;
  private hovered: string | null = null;
  private readonly warned = new Set<string>();

  constructor(opts: LayerOptions<GeoFeaturesLayerOptions>) {
    super({ ...opts, cullable: opts.cullable ?? false });
    for (const f of opts.options.features ?? []) this.ingest(f);
  }

  protected createState(): object {
    return {};
  }

  // ─── Features ───────────────────────────────────────────────────────────

  /** Replace every feature. Bad ones are dropped with one warning per id. */
  setFeatures(features: readonly GeoFeature[]): void {
    for (const id of [...this.entries.keys()]) this.retire(id);
    this.entries.clear();
    for (const f of features) this.ingest(f);
    this.options.features = [...features];
    this.schedule(true);
  }

  /** Add a feature. `false` (with a warning) when the id exists or the geometry is unusable. */
  addFeature(feature: GeoFeature): boolean {
    if (this.entries.has(String(feature.id))) {
      this.warnOnce(`dup:${feature.id}`, `addFeature — id "${feature.id}" already present.`);
      return false;
    }
    const ok = this.ingest(feature);
    if (ok) this.schedule(false);
    return ok;
  }

  /** Replace a feature's geometry and/or properties. `false` when the id is unknown or the result is unusable. */
  updateFeature(id: string | number, patch: Partial<Omit<GeoFeature, 'id' | 'type'>>): boolean {
    const key = String(id);
    const prev = this.entries.get(key);
    if (!prev) return false;
    const next: GeoFeature = {
      ...prev.feature,
      ...patch,
      properties: patch.properties === undefined ? prev.feature.properties : { ...prev.feature.properties, ...patch.properties },
    };
    this.retire(key);
    this.entries.delete(key);
    if (!this.ingest(next)) {
      // Keep the old one rather than lose a feature to a bad edit.
      this.ingest(prev.feature);
      this.schedule(false);
      return false;
    }
    this.schedule(false);
    return true;
  }

  /** Remove a feature. `true` if it existed. */
  removeFeature(id: string | number): boolean {
    const key = String(id);
    if (!this.entries.has(key)) return false;
    this.retire(key);
    this.entries.delete(key);
    return true;
  }

  /** One feature by id. */
  getFeature(id: string | number): GeoFeature | undefined {
    return this.entries.get(String(id))?.feature;
  }

  /** Every feature, in the order they were added. */
  features(): GeoFeature[] {
    return [...this.entries.values()].map((e) => e.feature);
  }

  /** The features as a GeoJSON `FeatureCollection` — what was put in, `properties` and all. */
  toGeoJSON(): GeoFeatureCollection {
    return { type: 'FeatureCollection', features: this.features() };
  }

  /**
   * Apply a config patch — the seam `canvas.update({ layers: { [id]: … } })` and
   * the settings editor drive. `features`, when present, replaces them all;
   * `mapLayerId` is wiring, read once on mount. Everything else repaints.
   */
  setOptions(patch: Partial<GeoFeaturesLayerOptions>): void {
    const { features, ...rest } = patch;
    Object.assign(this.options, rest, { mapLayerId: this.options.mapLayerId });
    if (features) this.setFeatures(features);
    else this.schedule(true);
  }

  // ─── Lifecycle ──────────────────────────────────────────────────────────

  protected override onMount(ctx: CanvasContext): void {
    this.specs = ctx.store.specsFor<BaseShapeSpec>(this.id);
    this.projector = new SpecProjector(this.specs, this.surface.primitives);
    // Labels keep their authored pixel size at every zoom; this renderer is this layer's own.
    this.surface.primitives.setLabelSizePolicy('shape', { zoomGrowth: 0 });

    this.subs.push(
      ctx.events.on('input:camera:zoom', () => {
        if (this.entries.size > 0) this.schedule(false);
      }),
    );

    const mapId = this.options.mapLayerId;
    if (mapId) {
      const map = ctx.layers.get<MapLayer>(mapId);
      if (!map) {
        throw new Error(
          `GeoFeaturesLayer "${this.id}": map layer "${mapId}" not found. Add the MapLayer before this layer, ` +
            `or omit mapLayerId on a plain canvas.`,
        );
      }
      this.subs.push(
        map.events.on('map:click', ({ world, lngLat }) => this.click(world, lngLat)),
        map.events.on('map:hover', ({ world, lngLat }) => this.hover(world, lngLat)),
      );
    } else {
      this.subs.push(
        this.surface.primitives.events.on('shape:click', ({ worldX, worldY }: { worldX: number; worldY: number }) => {
          const world = { x: worldX, y: worldY };
          this.click(world, unprojectWorld(world));
        }),
      );
    }

    this.paintedScale = 0;
    this.schedule(true);
  }

  protected override onUnmount(): void {
    for (const off of this.subs) off();
    this.subs.length = 0;
    if (this.timer !== null) clearTimeout(this.timer);
    this.timer = null;
    this.projector?.destroy();
    this.projector = null;
    this.specs?.clear();
    this.specs = null;
    for (const e of this.entries.values()) e.specIds = [];
    this.hovered = null;
  }

  /** Called by the canvas every frame: keeps labels sharp as the zoom crosses a tier. */
  tickAnimations(dt: number): void {
    this.surface.primitives.tickAnimations?.(dt);
    const scale = this.ctx?.camera.scale ?? 1;
    const tier = Math.min(8, 2 ** Math.max(0, Math.ceil(Math.log2(scale))));
    if (tier === this.labelTier) return;
    this.labelTier = tier;
    const dpr = typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1;
    this.surface.primitives.setLabelsResolution(dpr * tier);
  }

  hitTest(worldX: number, worldY: number): WorldLayerHit | null {
    return this.featureAt(worldX, worldY) ? ({} as WorldLayerHit) : null;
  }

  /** The id of the feature at a world point, or `null`. Points beat lines beat areas; later beats earlier. */
  featureAt(worldX: number, worldY: number): string | null {
    const scale = this.ctx?.camera.scale ?? 1;
    const tol = (this.options.hitTolerancePx ?? GEO_FEATURES_LAYER_DEFAULTS.hitTolerancePx) / scale;
    let best: { id: string; rank: number; order: number } | null = null;
    let order = 0;
    for (const [id, e] of this.entries) {
      order++;
      const p = e.prepared;
      let rank = -1;
      if (p.kind === 'point') {
        const km = e.feature.properties?.radiusKm;
        const r = typeof km === 'number' ? radiusKmToWorld(km, p.lat) : 0;
        if (Math.hypot(worldX - p.at.x, worldY - p.at.y) <= Math.max(r, tol)) rank = 0;
      } else if (p.kind === 'lines') {
        if (p.lines.some((l) => distanceToLine(worldX, worldY, l) <= tol)) rank = 1;
      } else if (p.polygons.some((rings) => pointInPolygon(worldX, worldY, rings))) {
        rank = 2;
      }
      if (rank < 0) continue;
      if (!best || rank < best.rank || (rank === best.rank && order > best.order)) best = { id, rank, order };
    }
    return best?.id ?? null;
  }

  /** Number of specs currently published — for tests and diagnostics. */
  get publishedCount(): number {
    let n = 0;
    for (const e of this.entries.values()) n += e.specIds.length;
    return n;
  }

  // ─── Internals ──────────────────────────────────────────────────────────

  private warnOnce(key: string, message: string): void {
    if (this.warned.has(key)) return;
    this.warned.add(key);
    console.warn(`GeoFeaturesLayer "${this.id}": ${message}`);
  }

  /** Validate, project and store one feature. `false` when it is unusable. */
  private ingest(feature: GeoFeature): boolean {
    const id = String(feature.id);
    if (feature.id === undefined || feature.id === null || id === '') {
      this.warnOnce(`noid:${this.warned.size}`, 'a feature has no id and was dropped.');
      return false;
    }
    if (this.entries.has(id)) {
      this.warnOnce(`dup:${id}`, `id "${id}" appears twice; the later one was dropped.`);
      return false;
    }
    const why = validateGeometry(feature.geometry);
    if (why) {
      this.warnOnce(`geom:${id}`, `feature "${id}" dropped — ${why}.`);
      return false;
    }
    for (const problem of provenanceProblems(feature.properties)) this.warnOnce(`prov:${id}:${problem}`, `feature "${id}" — ${problem}.`);

    const prepared = prepare(feature.geometry);
    this.entries.set(id, { feature, prepared, labelAt: this.labelPoint(prepared), specIds: [] });
    if (this.specs) this.stale.add(id);
    return true;
  }

  /** Ids to republish on the next pass (when not repainting everything). */
  private readonly stale = new Set<string>();
  private repaintAll = false;

  private schedule(all: boolean): void {
    if (all) this.repaintAll = true;
    if (!this.specs || this.timer !== null) return;
    this.timer = setTimeout(() => {
      this.timer = null;
      this.publish();
    }, this.options.republishDebounceMs ?? GEO_FEATURES_LAYER_DEFAULTS.republishDebounceMs);
  }

  /** The visual-centre label point of a feature (pole of inaccessibility / line midpoint), or `null`. */
  private labelPoint(p: Prepared): Pt | null {
    if (p.kind === 'point') return p.at;
    if (p.kind === 'lines') {
      const line = p.lines.reduce((a, b) => (length(b) > length(a) ? b : a), p.lines[0] ?? []);
      return midpoint(line);
    }
    // The largest polygon by outer area carries the label.
    let largest: Pt[][] | null = null;
    let area = -1;
    for (const rings of p.polygons) {
      const a = Math.abs(signedArea(rings[0]!));
      if (a > area) {
        area = a;
        largest = rings;
      }
    }
    if (!largest) return null;
    const b = boundsOf(largest[0]!)!;
    const precision = Math.max(b.w, b.h) / 200 || 1e-9;
    const [x, y] = polylabel(
      largest.map((ring) => openRing(ring).map((q) => [q.x, q.y])).map((r) => [...r, r[0]!]),
      precision,
    );
    return { x: x!, y: y! };
  }

  /** Take every spec a feature published off the map. */
  private retire(id: string): void {
    const e = this.entries.get(id);
    if (!e) return;
    for (const specId of e.specIds) {
      this.specs?.delete(specId);
      this.projector?.unproject(specId);
    }
    e.specIds = [];
  }

  private publish(): void {
    if (!this.specs) return;
    const scale = this.ctx?.camera.scale ?? 1;
    const all = this.repaintAll || scale !== this.paintedScale;
    const ids = all ? [...this.entries.keys()] : [...this.stale];
    this.repaintAll = false;
    this.stale.clear();
    this.paintedScale = scale;
    const t0 = performance.now();
    for (const id of ids) {
      this.retire(id);
      const e = this.entries.get(id);
      if (e) this.paint(id, e, scale);
    }
    this.events.emit('publish', { features: ids.length, specs: this.publishedCount, durationMs: performance.now() - t0 });
  }

  /** Build and publish every spec for one feature at `scale`. */
  private paint(id: string, e: Entry, scale: number): void {
    const o = this.options;
    const u = 1 / scale; // one screen pixel, in world units
    const kind = kindOf(e.prepared);
    const style = resolveStyle(kind, e.feature.properties, o.defaults?.[kind], o.unconfirmed);
    const label = this.labelFor(e, scale);
    let labelled = false;
    /**
     * Publish a spec. When `centre` is given and the feature has a label not yet
     * placed, the label is attached to this spec as a `'label'` decoration — a spec
     * has no label field; the element must be mounted first, which `project` does.
     */
    const put = <T extends BaseShapeSpec>(suffix: string, spec: T, centre?: Pt): string => {
      const specId = `${this.id}:${id}:${suffix}`;
      this.specs!.set(specId, spec);
      this.projector?.project(specId);
      e.specIds.push(specId);
      if (centre && label && e.labelAt && !labelled) {
        labelled = true;
        this.surface.primitives.setDecoration(specId, 'label', {
          kind: 'label',
          // The label's `offset` is screen pixels, so the world gap is multiplied by the scale.
          style: { ...label, offset: { x: (e.labelAt.x - centre.x) * scale, y: (e.labelAt.y - centre.y) * scale } },
        });
      }
      return specId;
    };
    const stroke = (s: ResolvedStyle): PathSpec['stroke'] => ({
      color: s.stroke,
      alpha: s.strokeOpacity,
      width: s.strokeWidthPx * u,
      join: 'round',
      cap: 'round',
      ...(s.dash ? { dashArray: [s.dash[0] * u, s.dash[1] * u] as const } : {}),
    });
    const p = e.prepared;
    if (p.kind === 'polygons') {
      p.polygons.forEach((rings, j) => {
        if (style.fillOpacity > 0) {
          const ring = keyholeRing(rings[0]!, rings.slice(1));
          if (ring.length >= 3) {
            const c = centred(ring);
            put(
              `fill${j}`,
              {
                kind: 'path',
                x: c.cx,
                y: c.cy,
                closed: true,
                points: c.points,
                fill: [{ kind: 'solid', color: style.fill, alpha: style.fillOpacity }],
              } satisfies PathSpec,
              { x: c.cx, y: c.cy },
            );
          }
        }
        rings.forEach((ring, k) => {
          const c = centred(openRing(ring));
          put(
            `ring${j}.${k}`,
            { kind: 'path', x: c.cx, y: c.cy, closed: true, points: c.points, stroke: stroke(style) } satisfies PathSpec,
            { x: c.cx, y: c.cy },
          );
        });
      });
    } else if (p.kind === 'lines') {
      p.lines.forEach((line, j) => {
        const c = centred(line);
        put(`line${j}`, { kind: 'path', x: c.cx, y: c.cy, points: c.points, stroke: stroke(style) } satisfies PathSpec, { x: c.cx, y: c.cy });
      });
    } else {
      const props = e.feature.properties ?? {};
      const radius = typeof props.radiusKm === 'number' ? radiusKmToWorld(props.radiusKm, p.lat) : style.pointRadiusPx * u;
      const unc = typeof props.uncertaintyKm === 'number' ? radiusKmToWorld(props.uncertaintyKm, p.lat) : 0;
      if (unc > 0) {
        put('uncertainty', {
          kind: 'circle',
          x: p.at.x,
          y: p.at.y,
          radius: unc,
          fill: [{ kind: 'solid', color: style.fill, alpha: o.uncertaintyFillOpacity ?? GEO_FEATURES_LAYER_DEFAULTS.uncertaintyFillOpacity }],
          stroke: { color: style.fill, alpha: 0.6, width: 1.5 * u, dashArray: [5 * u, 4 * u] as const },
        } satisfies CircleSpec);
      }
      put(
        'point',
        {
          kind: 'circle',
          x: p.at.x,
          y: p.at.y,
          radius,
          fill: [{ kind: 'solid', color: style.fill, alpha: style.fillOpacity }],
          stroke: stroke(style),
        } satisfies CircleSpec,
        p.at,
      );
    }
  }

  /** The label style for a feature at `scale`, or `null` when it has no text or is out of its zoom band. */
  private labelFor(e: Entry, scale: number): ShapeLabelStyle | null {
    const o = this.options;
    const text = e.feature.properties?.[o.labelKey ?? GEO_FEATURES_LAYER_DEFAULTS.labelKey];
    if (text === undefined || text === null || String(text) === '') return null;
    if (o.labelMinZoom !== undefined && scale < o.labelMinZoom) return null;
    if (o.labelMaxZoom !== undefined && scale > o.labelMaxZoom) return null;
    const color = typeof o.labelColor === 'number' ? o.labelColor : (parseHex(o.labelColor) ?? GEO_FEATURES_LAYER_DEFAULTS.labelColor);
    return {
      content: {
        kind: 'text',
        text: String(text),
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: o.labelFontPx ?? GEO_FEATURES_LAYER_DEFAULTS.labelFontPx,
        fontWeight: '600',
        fill: color,
      },
      ...((o.labelBackground ?? GEO_FEATURES_LAYER_DEFAULTS.labelBackground)
        ? { background: { fill: 0xffffff, fillAlpha: 0.85, radius: 3, padding: [2, 5] as [number, number] } }
        : {}),
      placement: 'center',
    } as ShapeLabelStyle;
  }

  private click(world: Pt, lngLat: [number, number]): void {
    const id = this.featureAt(world.x, world.y);
    if (!id) return;
    this.events.emit('feature:click', { id, feature: this.entries.get(id)!.feature, lngLat, world });
  }

  private hover(world: Pt, lngLat: [number, number]): void {
    const id = this.featureAt(world.x, world.y);
    if (id === this.hovered) return;
    this.hovered = id;
    this.events.emit('feature:hover', { id, feature: id ? this.entries.get(id)!.feature : null, lngLat, world });
  }
}

function length(line: readonly Pt[]): number {
  let n = 0;
  for (let i = 0; i + 1 < line.length; i++) n += Math.hypot(line[i + 1]!.x - line[i]!.x, line[i + 1]!.y - line[i]!.y);
  return n;
}

/** The point halfway along a polyline's length. */
function midpoint(line: readonly Pt[]): Pt | null {
  if (line.length === 0) return null;
  let left = length(line) / 2;
  for (let i = 0; i + 1 < line.length; i++) {
    const a = line[i]!;
    const b = line[i + 1]!;
    const seg = Math.hypot(b.x - a.x, b.y - a.y);
    if (left <= seg && seg > 0) return { x: a.x + ((b.x - a.x) * left) / seg, y: a.y + ((b.y - a.y) * left) / seg };
    left -= seg;
  }
  return line[line.length - 1]!;
}

function parseHex(v: string | number | undefined): number | undefined {
  if (typeof v !== 'string') return undefined;
  const m = /^#?([0-9a-f]{6})$/i.exec(v.trim());
  return m ? parseInt(m[1]!, 16) : undefined;
}
