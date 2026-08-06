/**
 * `BubbleSetsLayer` — `WorldLayer` that paints one smooth contour per
 * declared set of node ids over a source `GraphLayer`. Backed by
 * [`bubblesets-js`](https://github.com/upsetjs/bubblesets-js) (Collins's
 * IEEE InfoVis 2009 algorithm).
 *
 * The compute lives in world space so contours track the graph under
 * camera pan and zoom. Recompute is debounced (default 120 ms) and
 * triggered by the source `GraphLayer`'s `data:changed`. BubbleSets is
 * O(members · grid²); per-frame recompute during a live drag would tank
 * perf — set `recompute: 'manual'` and call `layer.recompute()` from a
 * drag behaviour for that case.
 *
 * Set membership is data the layer owns. Mutate it via {@link setSets} /
 * {@link addSet} / {@link removeSet} / {@link updateSet}; each mutation
 * schedules the same debounced recompute as `data:changed`.
 */

import { SpecProjector, WorldLayer } from '@invana/canvas';
import type { SpecStore } from '@invana/canvas';
import { PrimitivesRenderer } from '@invana/canvas/primitives';
import type { BaseShapeSpec, PathSpec, ShapeLabelStyle } from '@invana/canvas/specs';
import type { CanvasContext, LayerOptions, WorldLayerHit } from '@invana/canvas';
import { GraphLayer } from '@invana/graph';
import type { GraphNode } from '@invana/graph';
import {
  createOutline,
  PointPath,
  type IRectangle,
  type ILine,
} from 'bubblesets-js';

import {
  BUBBLE_SET_STYLE_DEFAULTS,
  BUBBLE_SETS_LAYER_DEFAULTS,
  type BubbleSet,
  type BubbleSetsLayerEvents,
  type BubbleSetsLayerOptions,
  type BubbleSetsLayerState,
} from './types';

export class BubbleSetsLayer extends WorldLayer<
  BubbleSetsLayerOptions,
  BubbleSetsLayerState,
  BubbleSetsLayerEvents,
  never,
  WorldLayerHit
> {
  override readonly kind = 'bubble-sets-layer';
  private readonly graphLayerId: string;
  private sets: BubbleSet[];

  private graph: GraphLayer | null = null;
  private renderer: PrimitivesRenderer | null = null;
  private specs: SpecStore<BaseShapeSpec> | null = null;
  private projector: SpecProjector<BaseShapeSpec> | null = null;
  /** Hull ids published last pass, so sets that vanish are retired. */
  private published: string[] = [];
  private readonly subs: Array<() => void> = [];

  // Browser `setTimeout` returns `number`; using `ReturnType<typeof setTimeout>`
  // would resolve to NodeJS.Timeout in dual-typed environments and break the
  // `window.clearTimeout(...)` call site.
  private debounceTimer: number | null = null;

  constructor(opts: LayerOptions<BubbleSetsLayerOptions>) {
    super({
      ...opts,
      // Contours extend past node centres by node-influence + morph buffer,
      // so viewport culling against the bare node AABB would clip them.
      cullable: opts.cullable ?? false,
      // Passive annotation — clicks fall through to the graph below.
      hittable: opts.hittable ?? false,
    });
    this.graphLayerId = opts.options.graphLayerId;
    // Defensive copy — caller may mutate the array they passed in.
    this.sets = [...opts.options.sets];
  }

  protected createState(): BubbleSetsLayerState {
    return {};
  }

  protected override onMount(ctx: CanvasContext): void {
    const graph = ctx.layers.get<GraphLayer>(this.graphLayerId);
    if (!graph) {
      throw new Error(
        `BubbleSetsLayer "${this.id}": graph layer "${this.graphLayerId}" not found. ` +
          `Add the GraphLayer before this annotation layer.`,
      );
    }
    this.graph = graph;
    // Hulls are durable, data-derived visuals — published as `path` specs and
    // projected like any other element (`docs/renderer-split-design.md` §3).
    this.renderer = new PrimitivesRenderer({ container: this.container, camera: ctx.camera });
    this.specs = ctx.store.specsFor<BaseShapeSpec>(this.id);
    this.projector = new SpecProjector(this.specs, this.renderer);

    const recompute = this.options.recompute ?? BUBBLE_SETS_LAYER_DEFAULTS.recompute;
    if (recompute === 'auto') {
      this.subs.push(graph.events.on('data:changed', () => this.scheduleRecompute()));
    }

    // Initial paint — the graph may already hold data when we mount.
    this.scheduleRecompute();
  }

  protected override onUnmount(): void {
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
    this.renderer?.destroy();
    this.renderer = null;
    this.graph = null;
  }

  hitTest(_worldX: number, _worldY: number): WorldLayerHit | null {
    return null;
  }

  // ─── Set mutators ─────────────────────────────────────────────────────────
  // Each mutation owns recompute-scheduling so callers never have to remember
  // to call `recompute()` themselves. Mirrors the resolver-based live-tweaking
  // pattern documented in [[feedback_live_edge_tweaking_via_resolvers]].

  /** Replace the full set list. */
  setSets(sets: readonly BubbleSet[]): void {
    this.sets = [...sets];
    this.scheduleRecompute();
  }

  /** Append a set. No-op (with warning) if the id already exists. */
  addSet(set: BubbleSet): void {
    if (this.sets.some((s) => s.id === set.id)) {
      console.warn(`BubbleSetsLayer "${this.id}": addSet — id "${set.id}" already present.`);
      return;
    }
    this.sets.push(set);
    this.scheduleRecompute();
  }

  /** Remove a set by id. Returns `true` if anything was removed. */
  removeSet(id: string): boolean {
    const i = this.sets.findIndex((s) => s.id === id);
    if (i === -1) return false;
    this.sets.splice(i, 1);
    this.scheduleRecompute();
    return true;
  }

  /**
   * Shallow-merge `patch` into the set with the given id. Nested `style` /
   * `label` are also shallow-merged so callers can supply partial style /
   * label patches without rebuilding the whole object. Returns `true` if
   * the id was found.
   */
  updateSet(id: string, patch: Partial<Omit<BubbleSet, 'id'>>): boolean {
    const i = this.sets.findIndex((s) => s.id === id);
    if (i === -1) return false;
    const prev = this.sets[i]!;
    this.sets[i] = {
      ...prev,
      ...patch,
      style: patch.style ? { ...prev.style, ...patch.style } : prev.style,
      label: patch.label ? { ...prev.label, ...patch.label } : prev.label,
    };
    this.scheduleRecompute();
    return true;
  }

  /** Read-only view of the current set list. */
  getSets(): readonly BubbleSet[] {
    return this.sets;
  }

  /**
   * Force an immediate recompute. Useful in `recompute: 'manual'` mode, or
   * to refresh the overlay after externally mutating options that don't
   * have setters yet.
   */
  recompute(): void {
    this.computeAndPaint();
  }

  // ─── Internals ────────────────────────────────────────────────────────────

  private scheduleRecompute(): void {
    // Pre-mount mutations are absorbed by the initial paint scheduled in
    // `onMount`; nothing to do until the spec store exists.
    if (!this.specs) return;
    if (this.debounceTimer !== null) window.clearTimeout(this.debounceTimer);
    const wait =
      this.options.recomputeDebounceMs ?? BUBBLE_SETS_LAYER_DEFAULTS.recomputeDebounceMs;
    this.debounceTimer = window.setTimeout(() => {
      this.debounceTimer = null;
      this.computeAndPaint();
    }, wait);
  }

  private computeAndPaint(): void {
    const specs = this.specs;
    const graph = this.graph;
    if (!specs || !graph) return;

    const t0 = performance.now();
    const painted: string[] = [];

    if (this.sets.length === 0) {
      this.retireHulls(painted);
      this.emitRecompute(0, t0);
      return;
    }

    // Bounds for every node in the source graph, keyed by id. Computed
    // once per recompute, then partitioned into member / non-member per
    // set. `boundsOfNode` returns `undefined` for nodes the renderer
    // hasn't mounted yet (rare during initial sync) — skip them.
    const nodeRects = new Map<string, IRectangle>();
    for (const node of graph.store.nodes()) {
      const r = this.rectForNode(graph, node);
      if (r) nodeRects.set(node.id, r);
    }

    const algoOpts = this.algorithmOptions();
    const smoothness = this.options.smoothness ?? BUBBLE_SETS_LAYER_DEFAULTS.smoothness;

    for (const set of this.sets) {
      if (set.members.length === 0) continue;

      const members: IRectangle[] = [];
      const nonMemberIds = new Set(nodeRects.keys());
      for (const id of set.members) {
        const r = nodeRects.get(id);
        if (!r) continue;
        members.push(r);
        nonMemberIds.delete(id);
      }
      if (members.length === 0) continue;

      const nonMembers: IRectangle[] = [];
      for (const id of nonMemberIds) nonMembers.push(nodeRects.get(id)!);

      const edges: ILine[] = [];
      if (set.edges) {
        for (const eid of set.edges) {
          const edge = graph.store.getEdge(eid);
          if (!edge) continue;
          const s = graph.store.getNode(edge.source)?.position;
          const t = graph.store.getNode(edge.target)?.position;
          if (!s || !t) continue;
          edges.push({ x1: s.x, y1: s.y, x2: t.x, y2: t.y });
        }
      }

      let path: PointPath = createOutline(members, nonMembers, edges, algoOpts);
      if (smoothness === 'bspline') {
        // Canonical bubblesets-js / G6 pipeline: sparsify first so the
        // b-spline has room to round, then interpolate.
        path = path.sample().bSplines();
      } else if (smoothness === 'chaikin') {
        path = chaikin(
          path.sample(),
          this.options.chaikinIterations ?? BUBBLE_SETS_LAYER_DEFAULTS.chaikinIterations,
        );
      }

      painted.push(...this.publishSet(set, path));
    }

    this.retireHulls(painted);
    this.emitRecompute(this.sets.length, t0);
  }

  /**
   * World-space AABB for a node. `GraphLayer.boundsOfNode` returns the
   * shape's local (centre-relative) rect — `node.position` is *not* baked
   * in — so we offset by the node's position to get world coords. Falls
   * back to a small box around the position when the renderer hasn't
   * mounted the node yet.
   */
  private rectForNode(graph: GraphLayer, node: GraphNode): IRectangle | null {
    const p = node.position;
    if (!p) return null;
    const b = graph.boundsOfNode(node);
    if (b) return { x: b.x + p.x, y: b.y + p.y, width: b.width, height: b.height };
    const r = 10;
    return { x: p.x - r, y: p.y - r, width: r * 2, height: r * 2 };
  }

  private algorithmOptions() {
    const o = this.options;
    return {
      pixelGroup: o.pixelGroup ?? BUBBLE_SETS_LAYER_DEFAULTS.pixelGroup,
      nodeR0: o.nodeR0 ?? BUBBLE_SETS_LAYER_DEFAULTS.nodeR0,
      nodeR1: o.nodeR1 ?? BUBBLE_SETS_LAYER_DEFAULTS.nodeR1,
      edgeR0: o.edgeR0 ?? BUBBLE_SETS_LAYER_DEFAULTS.edgeR0,
      edgeR1: o.edgeR1 ?? BUBBLE_SETS_LAYER_DEFAULTS.edgeR1,
      morphBuffer: o.morphBuffer ?? BUBBLE_SETS_LAYER_DEFAULTS.morphBuffer,
      maxRoutingIterations:
        o.maxRoutingIterations ?? BUBBLE_SETS_LAYER_DEFAULTS.maxRoutingIterations,
      maxMarchingIterations:
        o.maxMarchingIterations ?? BUBBLE_SETS_LAYER_DEFAULTS.maxMarchingIterations,
    };
  }

  /**
   * Describe one set's hull as a `path` spec and publish it. Returns the ids
   * used, so the caller can retire hulls that this pass no longer produces.
   *
   * The contour is a **closed quadratic spline** through segment midpoints —
   * `smooth: true` on the spec, so the shape does the tracing. That is what
   * turns marching-squares stair-stepping into a glassy contour, and it now
   * happens in the geometry rather than at draw time here.
   */
  private publishSet(set: BubbleSet, path: PointPath): string[] {
    const pts = path.points;
    const specs = this.specs;
    if (!specs || pts.length < 3) return [];

    const style = { ...BUBBLE_SET_STYLE_DEFAULTS, ...set.style };
    const stroke = set.style?.stroke ?? style.fill;
    const id = `${this.id}:hull:${set.id}`;

    const spec: PathSpec = {
      kind: 'path',
      x: 0,
      y: 0,
      smooth: true,
      points: pts.map((pt) => ({ x: pt.x, y: pt.y })),
      fill: [{ kind: 'solid', color: style.fill, alpha: style.fillOpacity }],
      stroke: {
        color: stroke,
        alpha: style.strokeOpacity,
        width: style.strokeWidth,
        join: 'round',
        cap: 'round',
      },
      ...(set.label ? { label: this.labelStyleFor(set, pts, stroke) } : {}),
    };

    specs.set(id, spec);
    this.projector?.project(id);
    this.events.emit('set:painted', { setId: set.id, vertices: pts.length });
    return [id];
  }

  /** Drop hulls published last pass that this pass no longer produced. */
  private retireHulls(current: string[]): void {
    const keep = new Set(current);
    for (const id of this.published) {
      if (keep.has(id)) continue;
      this.specs?.delete(id);
      this.projector?.unproject(id);
    }
    this.published = current;
  }


  /**
   * Label styling for a set's hull, as a `label` decoration on the hull spec.
   *
   * Placement is expressed as a screen-space offset from the hull's own centre,
   * because the decoration anchors to its host — so the anchor maths that used
   * to position a free-floating `Text` becomes an offset here. `contour-end`
   * keeps its tangent rotation; `centroid` sits at the middle with no rotation.
   */
  private labelStyleFor(
    set: BubbleSet,
    pts: ReadonlyArray<{ x: number; y: number }>,
    fallbackColor: number,
  ): ShapeLabelStyle {
    const label = set.label!;
    const placement = label.placement ?? 'contour-end';

    let cx = 0;
    let cy = 0;
    for (const p of pts) {
      cx += p.x;
      cy += p.y;
    }
    cx /= pts.length;
    cy /= pts.length;

    let anchorX = cx;
    let anchorY = cy;
    let rotation = 0;
    if (placement !== 'centroid') {
      // `contour-end` — last point, rotated along the local tangent.
      const end = pts[pts.length - 1]!;
      const prev = pts[Math.max(0, pts.length - 8)]!;
      anchorX = end.x;
      anchorY = end.y;
      rotation = Math.atan2(end.y - prev.y, end.x - prev.x);
    }

    return {
      content: {
        kind: 'text',
        text: label.text,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: label.fontSize ?? 11,
        fontWeight: '600',
        fill: label.color ?? 0xffffff,
      },
      background: {
        fill: set.style?.stroke ?? fallbackColor,
        fillAlpha: 0.95,
        radius: 6,
        padding: [2, 6],
      },
      placement: 'center',
      offset: { x: anchorX - cx, y: anchorY - cy },
      rotation,
    };
  }


  private emitRecompute(sets: number, t0: number): void {
    this.events.emit('recompute', { sets, durationMs: performance.now() - t0 });
  }
}

/**
 * Trace a closed polyline as a quadratic-Bezier spline through segment
 * midpoints. The standard polyline-midpoint trick: start at the midpoint
 * of the last→first segment, then for each input point `p_i` issue
 * `quadraticCurveTo(p_i, midpoint(p_i, p_{i+1}))`. Each input point acts
 * as an off-curve control; the rendered curve passes through every
 * midpoint and is C¹ continuous.
 *
 * Effect: any polyline — even one with marching-squares stair-steps —
 * draws as a smooth curve. The smoothing happens at the draw layer, so
 * we no longer pay for it in the smoothing pipeline.
 */

/**
 * Chaikin's corner-cutting subdivision. Each iteration replaces every
 * polyline corner with two new points at 1/4 and 3/4 of the way along
 * the adjacent edges, doubling the point count and rounding every corner.
 *
 * BubbleSets contours are always closed, so the algorithm wraps around
 * index `n-1 → 0` to keep the seam smooth.
 */
function chaikin(path: PointPath, iterations: number): PointPath {
  let pts: ReadonlyArray<{ x: number; y: number }> = path.points;
  for (let it = 0; it < iterations; it++) {
    const n = pts.length;
    if (n < 3) break;
    const next: Array<{ x: number; y: number }> = new Array(n * 2);
    for (let i = 0; i < n; i++) {
      const a = pts[i]!;
      const b = pts[(i + 1) % n]!;
      next[i * 2] = { x: 0.75 * a.x + 0.25 * b.x, y: 0.75 * a.y + 0.25 * b.y };
      next[i * 2 + 1] = { x: 0.25 * a.x + 0.75 * b.x, y: 0.25 * a.y + 0.75 * b.y };
    }
    pts = next;
  }
  return new PointPath(pts, path.closed);
}
