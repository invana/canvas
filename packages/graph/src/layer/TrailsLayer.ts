/**
 * `TrailsLayer` — where tracked objects have just been. A `WorldLayer` that
 * listens to a {@link TrackingBehaviour}'s **accepted fixes** and publishes each
 * object's recent track as a fading line, plus (for the ids you name) its whole
 * track.
 *
 * - **Recent trail.** The last `maxPoints` fixes no older than `maxAgeMs`
 *   (measured from that object's newest fix), drawn as `fadeBands` consecutive
 *   segments whose alpha rises toward the newest — `PathSpec` has one stroke
 *   alpha, so banding is how a fade is expressed without a renderer change.
 * - **Full track.** For each id in `fullTrackIds` the whole buffer, up to
 *   `fullTrackMaxPoints`, in one solid line. Change it with
 *   {@link setFullTrackIds} — e.g. from a click handler.
 * - **Width in pixels.** The stroke is `strokeWidthPx / camera.scale` in world
 *   units, refreshed when a zoom settles, so a trail is one thickness on screen.
 *
 * The trail is drawn through **fixes**, not the interpolated position: it is the
 * honest history, and the head of the line runs **ahead** of the marker by about
 * the behaviour's `renderDelayMs` (the marker is drawn in the past, the newest
 * fix is not). Geometry is published as `path` specs (rule 5: a layer never
 * builds a display object) and rebuilt only for ids that received a fix.
 *
 * Wiring is by explicit id (`trackingBehaviourId`); the behaviour may be
 * registered after the layer.
 */

import { SpecProjector, WorldLayer } from '@invana/canvas';
import type { BaseShapeSpec, CanvasContext, LayerOptions, PathSpec, SpecStore, WorldLayerHit } from '@invana/canvas';

import type { TrackingBehaviour } from '../behaviours/TrackingBehaviour';
import type { Fix } from '../behaviours/tracking/motion';

/** Options for {@link TrailsLayer}. */
export interface TrailsLayerOptions {
  /** Required — id of the `TrackingBehaviour` whose accepted fixes are drawn. */
  trackingBehaviourId: string;
  /** Which objects get a recent trail: the listed ids, or `'all'`. Default `'all'`. */
  ids?: readonly string[] | 'all';
  /** Most points in a recent trail. Default `30`. */
  maxPoints?: number;
  /** Drop points older than this, measured from the object's newest fix. Default `600000` (10 min). */
  maxAgeMs?: number;
  /** How many segments the recent trail fades over. Default `5`. */
  fadeBands?: number;
  /** Stroke colour. Default `0x64748b`. */
  color?: number;
  /** Alpha of the newest band; older bands fall off linearly. Default `0.85`. */
  alpha?: number;
  /** Stroke width in **screen pixels**. Default `2`. */
  strokeWidthPx?: number;
  /** Ids that also draw their whole track. Default none. */
  fullTrackIds?: readonly string[];
  /** Most points kept for a full track. Default `2000`. */
  fullTrackMaxPoints?: number;
  /** Debounce for republishing after fixes / a zoom. Default `100` ms. */
  publishDebounceMs?: number;
}

/** Defaults for {@link TrailsLayerOptions}. */
export const TRAILS_LAYER_DEFAULTS = {
  maxPoints: 30,
  maxAgeMs: 600_000,
  fadeBands: 5,
  color: 0x64748b,
  alpha: 0.85,
  strokeWidthPx: 2,
  fullTrackMaxPoints: 2000,
  publishDebounceMs: 100,
} as const;

/** One remembered fix position. */
interface Pt {
  x: number;
  y: number;
  t: number;
}

export class TrailsLayer extends WorldLayer<TrailsLayerOptions, object, Record<string, never>, never, WorldLayerHit> {
  override readonly kind = 'trails-layer';

  /** Every accepted fix, per id — capped at `fullTrackMaxPoints`. */
  private readonly points = new Map<string, Pt[]>();
  /** Ids whose trail must be republished. */
  private readonly stale = new Set<string>();
  private specs: SpecStore<BaseShapeSpec> | null = null;
  private projector: SpecProjector<BaseShapeSpec> | null = null;
  /** Spec ids currently published, per object id. */
  private readonly published = new Map<string, string[]>();
  private readonly subs: Array<() => void> = [];
  private offFix: (() => void) | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private repaintAll = false;

  constructor(opts: LayerOptions<TrailsLayerOptions>) {
    super({
      ...opts,
      // Trails run far from any node box; culling against it would clip them.
      cullable: opts.cullable ?? false,
      hittable: opts.hittable ?? false,
    });
  }

  protected createState(): object {
    return {};
  }

  // ─── Public API ─────────────────────────────────────────────────────────

  /** Apply a config patch — the seam `canvas.update({ layers: { [id]: … } })` drives. `trackingBehaviourId` is wiring and is read once on mount. */
  setOptions(patch: Partial<TrailsLayerOptions>): void {
    Object.assign(this.options, patch, { trackingBehaviourId: this.options.trackingBehaviourId });
    this.repaintAll = true;
    this.schedule();
  }

  /** Replace the ids that draw their whole track. */
  setFullTrackIds(ids: readonly string[]): void {
    const was = new Set(this.options.fullTrackIds ?? []);
    Object.assign(this.options, { fullTrackIds: [...ids] });
    for (const id of new Set([...was, ...ids])) this.stale.add(id);
    this.schedule();
  }

  /** Forget an object's trail and take it off the map. */
  clear(id: string): void {
    this.points.delete(id);
    this.stale.delete(id);
    this.retire(id);
  }

  // ─── Lifecycle ──────────────────────────────────────────────────────────

  protected override onMount(ctx: CanvasContext): void {
    this.specs = ctx.store.specsFor<BaseShapeSpec>(this.id);
    this.projector = new SpecProjector(this.specs, this.surface.primitives);

    const attach = (): void => {
      const tracking = ctx.behaviours.get(this.options.trackingBehaviourId) as TrackingBehaviour | undefined;
      if (!tracking || this.offFix) return;
      this.offFix = tracking.onFix((fix) => this.record(fix));
    };
    attach();
    this.subs.push(
      ctx.events.on('scene:behaviour:register', ({ id }) => {
        if (id === this.options.trackingBehaviourId) attach();
      }),
      // The stroke is a world width derived from the zoom, so it follows the zoom.
      ctx.events.on('input:camera:zoom', () => {
        if (this.points.size === 0) return;
        this.repaintAll = true;
        this.schedule();
      }),
    );
  }

  protected override onUnmount(): void {
    for (const off of this.subs) off();
    this.subs.length = 0;
    this.offFix?.();
    this.offFix = null;
    if (this.timer !== null) clearTimeout(this.timer);
    this.timer = null;
    this.projector?.destroy();
    this.projector = null;
    this.specs?.clear();
    this.specs = null;
    this.published.clear();
    this.points.clear();
    this.stale.clear();
  }

  hitTest(): WorldLayerHit | null {
    return null;
  }

  // ─── Internals ──────────────────────────────────────────────────────────

  private record(fix: Fix): void {
    let list = this.points.get(fix.id);
    if (!list) this.points.set(fix.id, (list = []));
    list.push({ x: fix.x, y: fix.y, t: fix.t });
    const cap = this.options.fullTrackMaxPoints ?? TRAILS_LAYER_DEFAULTS.fullTrackMaxPoints;
    if (list.length > cap) list.splice(0, list.length - cap);
    this.stale.add(fix.id);
    this.schedule();
  }

  private schedule(): void {
    if (!this.specs || this.timer !== null) return;
    this.timer = setTimeout(() => {
      this.timer = null;
      this.publish();
    }, this.options.publishDebounceMs ?? TRAILS_LAYER_DEFAULTS.publishDebounceMs);
  }

  /** Does this object get a recent trail? */
  private wants(id: string): boolean {
    const ids = this.options.ids ?? 'all';
    return ids === 'all' || ids.includes(id);
  }

  private publish(): void {
    if (!this.specs) return;
    const targets = this.repaintAll ? new Set(this.points.keys()) : new Set(this.stale);
    this.repaintAll = false;
    this.stale.clear();

    const scale = this.ctx?.camera.scale ?? 1;
    const px = this.options.strokeWidthPx ?? TRAILS_LAYER_DEFAULTS.strokeWidthPx;
    const width = px / scale;
    const color = this.options.color ?? TRAILS_LAYER_DEFAULTS.color;
    const alpha = this.options.alpha ?? TRAILS_LAYER_DEFAULTS.alpha;
    const bands = Math.max(1, Math.floor(this.options.fadeBands ?? TRAILS_LAYER_DEFAULTS.fadeBands));
    const maxPoints = this.options.maxPoints ?? TRAILS_LAYER_DEFAULTS.maxPoints;
    const maxAge = this.options.maxAgeMs ?? TRAILS_LAYER_DEFAULTS.maxAgeMs;
    const full = new Set(this.options.fullTrackIds ?? []);

    for (const id of targets) {
      this.retire(id);
      const all = this.points.get(id);
      if (!all || all.length < 2) continue;
      const ids: string[] = [];
      const put = (key: string, pts: readonly Pt[], a: number): void => {
        if (pts.length < 2) return;
        const spec: PathSpec = {
          kind: 'path',
          x: 0,
          y: 0,
          points: pts.map((p) => ({ x: p.x, y: p.y })),
          stroke: { color, alpha: a, width, join: 'round', cap: 'round' },
        };
        const specId = `${this.id}:${key}:${id}`;
        this.specs!.set(specId, spec);
        this.projector?.project(specId);
        ids.push(specId);
      };

      if (full.has(id)) put('full', all, alpha);
      if (this.wants(id)) {
        const newest = all[all.length - 1]!.t;
        let recent = all.filter((p) => newest - p.t <= maxAge);
        if (recent.length > maxPoints) recent = recent.slice(recent.length - maxPoints);
        // `bands` segments that share their end points, alpha rising toward the newest.
        const segs = Math.min(bands, recent.length - 1);
        for (let b = 0; b < segs; b++) {
          const from = Math.floor((b * (recent.length - 1)) / segs);
          const to = Math.floor(((b + 1) * (recent.length - 1)) / segs);
          put(`band${b}`, recent.slice(from, to + 1), (alpha * (b + 1)) / segs);
        }
      }
      if (ids.length > 0) this.published.set(id, ids);
    }
  }

  /** Take every spec published for an object off the map. */
  private retire(id: string): void {
    const ids = this.published.get(id);
    if (!ids) return;
    for (const specId of ids) {
      this.specs?.delete(specId);
      this.projector?.unproject(specId);
    }
    this.published.delete(id);
  }

  /** Number of spec paths currently published — for tests and diagnostics. */
  get publishedCount(): number {
    let n = 0;
    for (const ids of this.published.values()) n += ids.length;
    return n;
  }
}
