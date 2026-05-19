/**
 * `ParallelEdgeBehaviour` — fans edges that share the same `(source, target)`
 * pair so they don't overlap. Cross-edge coordination that belongs above the
 * per-edge connector pipeline (anchor → router → pathStyle), since each
 * pipeline stage sees only one edge in isolation.
 *
 * Layer-scoped: constructed with a target `layerId` referencing a
 * {@link GraphLayer}. Watches the store for edge add/remove and node
 * position changes, groups edges by `groupBy(edge)` (default
 * `${source}::${target}`), and rewrites each group's `style.shape` so its
 * members fan out symmetrically. Two dimensions are written, depending on
 * which anchor each edge uses:
 *
 *  1. **`sourceAnchorOpts.offset` / `targetAnchorOpts.offset`** — for edges
 *     using `'edge-port'` or `'silhouette-port'` anchors, the endpoints are
 *     pushed along the host's face by `rank × spacing`. Combined with the
 *     port anchor's `side: 'auto'` mode, this fans the endpoints across the
 *     shape silhouette without the caller having to derive sides manually.
 *  2. **A single midpoint `waypoint`** — bows the path's middle by
 *     `rank × spacing`. The bow axis is chosen per edge from its
 *     `pathType`: axis-aligned routers (`manhattan` / `orth` / `rounded`)
 *     get an axis-aligned offset along the non-dominant axis;
 *     curve-through-control-point styles (`straight` / `smooth` / `bundle`)
 *     get a perpendicular offset. Override via `basis`.
 *
 * Default `enabled: false` — register, then explicitly enable. Matches the
 * project rule that no behaviour auto-activates.
 *
 * `onDisable` does **not** undo prior patches — edges keep whatever waypoint
 * / anchor opts they had at the moment of disable. Re-enabling resumes
 * patching on the next store mutation. Callers that need a clean slate must
 * clear edge styles themselves.
 *
 * @example
 * ```ts
 * canvas.behaviours.register(
 *   new ParallelEdgeBehaviour({
 *     id: 'parallel-edges',
 *     layerId: 'graph',
 *     enabled: true,
 *     spacing: 12,
 *   }),
 * );
 * ```
 */

import { Behaviour, type BehaviourOptions, type CanvasContext } from '@invana/canvas';

import { GraphLayer } from '../layer/GraphLayer';
import type {
  EdgeAnchor,
  EdgePathType,
  EdgeShapeOptions,
  EdgeStyle,
} from '../layer/types';
import type { GraphEdge, Vec2 } from '../store/types';

/**
 * Axis along which a group of parallel edges spreads.
 *
 * - `'auto'` — derive from each edge's `pathType`. Axis-aligned routers
 *   (`manhattan`, `orth`, `rounded`) use `'axis-aligned'`; all others use
 *   `'perpendicular'`.
 * - `'perpendicular'` — offset along the unit vector perpendicular to
 *   `target - source`. Suitable for curve-through-midpoint styles
 *   (`straight`, `smooth`, `bundle`).
 * - `'axis-aligned'` — offset along the non-dominant axis between source and
 *   target. Suitable for axis-aligned routers (`manhattan`, `orth`,
 *   `rounded`) where the bow control point should sit on a horizontal or
 *   vertical mid-corridor.
 */
export type ParallelEdgeBasis = 'auto' | 'perpendicular' | 'axis-aligned';

/** A bucket of edges that share endpoints and should be fanned together. */
export interface ParallelEdgeGroup {
  /** Source node id shared by every edge in this group. */
  readonly sourceId: string;
  /** Target node id shared by every edge in this group. */
  readonly targetId: string;
  /** Geometric centre of the source node (renderer ref or store position). */
  readonly sourceCenter: Vec2;
  /** Geometric centre of the target node. */
  readonly targetCenter: Vec2;
  /**
   * Edges in this group, in store iteration order. Distribution policies
   * decide which edge gets which rank — the default centres the group so
   * `edges[i]` receives rank `k = i - (N-1)/2`.
   */
  readonly edges: ReadonlyArray<GraphEdge>;
}

/** Patch a distribution policy emits for one edge in the group. */
export interface ParallelEdgePatch {
  /** Edge id this patch applies to. */
  readonly edgeId: string;
  /** New `sourceAnchorOpts`. Merged onto the edge's existing shape. */
  readonly sourceAnchorOpts?: Readonly<Record<string, unknown>>;
  /** New `targetAnchorOpts`. */
  readonly targetAnchorOpts?: Readonly<Record<string, unknown>>;
  /** New `waypoints`. Pass an empty array to clear. */
  readonly waypoints?: ReadonlyArray<{ readonly x: number; readonly y: number }>;
}

/** Settings the behaviour passes through to a distribution policy. */
export interface ParallelEdgeDistributeContext {
  readonly spacing: number;
  readonly basis: ParallelEdgeBasis;
  readonly anchorOffset: boolean;
}

/**
 * Pluggable distribution policy. Receives a group of co-located edges plus
 * the behaviour's settings and returns one patch per edge it wants to update.
 *
 * The default policy {@link centeredRanksPolicy} fans edges symmetrically
 * around rank zero — pass a custom function to implement one-sided fanout,
 * data-driven offsets, weighted spacing, etc.
 */
export type ParallelEdgeDistribute = (
  group: ParallelEdgeGroup,
  ctx: ParallelEdgeDistributeContext,
) => ReadonlyArray<ParallelEdgePatch>;

/** Constructor options for {@link ParallelEdgeBehaviour}. */
export interface ParallelEdgeBehaviourOptions extends BehaviourOptions {
  /** Required — the `GraphLayer` id this behaviour drives. */
  layerId: string;

  /** Spacing between adjacent ranks in world units. Default `12`. */
  spacing?: number;

  /**
   * Basis the default distribution policy uses to translate a rank into a
   * waypoint / anchor-offset direction. Default `'auto'`.
   */
  basis?: ParallelEdgeBasis;

  /**
   * When `true` and an edge uses a port anchor (`'edge-port'` or
   * `'silhouette-port'`), the default policy writes
   * `sourceAnchorOpts: { side: 'auto', offset }` and the matching target
   * opts so endpoints fan along the host face. When `false`, the policy
   * only writes waypoints. Default `true`.
   */
  anchorOffset?: boolean;

  /**
   * Group key for an edge. Edges that produce the same key are bundled and
   * distributed together. Return `null` to exclude an edge. Default groups
   * by directed pair `${source}::${target}`.
   */
  groupBy?: (edge: GraphEdge) => string | null;

  /**
   * Distribution policy. Default {@link centeredRanksPolicy}.
   */
  distribute?: ParallelEdgeDistribute;
}

interface ResolvedOptions {
  spacing: number;
  basis: ParallelEdgeBasis;
  anchorOffset: boolean;
  groupBy: (edge: GraphEdge) => string | null;
  distribute: ParallelEdgeDistribute;
}

const defaultGroupBy = (edge: GraphEdge): string => `${edge.source}::${edge.target}`;

function resolveOptions(
  prev: ResolvedOptions | null,
  patch: Partial<ParallelEdgeBehaviourOptions>,
): ResolvedOptions {
  const base: ResolvedOptions = prev ?? {
    spacing: 12,
    basis: 'auto',
    anchorOffset: true,
    groupBy: defaultGroupBy,
    distribute: centeredRanksPolicy,
  };
  return {
    spacing: patch.spacing ?? base.spacing,
    basis: patch.basis ?? base.basis,
    anchorOffset: patch.anchorOffset ?? base.anchorOffset,
    groupBy: patch.groupBy ?? base.groupBy,
    distribute: patch.distribute ?? base.distribute,
  };
}

const PORT_ANCHORS: ReadonlySet<EdgeAnchor> = new Set([
  'edge-port',
  'silhouette-port',
] as readonly EdgeAnchor[]);

const AXIS_ALIGNED_PATH_TYPES: ReadonlySet<EdgePathType> = new Set<EdgePathType>([
  'manhattan',
  'orth',
  'rounded',
]);

/**
 * Default distribution policy — centres `N` ranks around zero, then for each
 * edge writes one midpoint waypoint plus (optionally) port-anchor offsets.
 *
 * Exported so callers can compose it (e.g. wrap with a filter) or call
 * directly when implementing a custom variant that wants to reuse the
 * default geometry for some edges.
 */
export const centeredRanksPolicy: ParallelEdgeDistribute = (group, ctx) => {
  const { sourceCenter: src, targetCenter: tgt, edges } = group;
  const dx = tgt.x - src.x;
  const dy = tgt.y - src.y;
  const len = Math.hypot(dx, dy) || 1;
  const horizontal = Math.abs(dx) >= Math.abs(dy);
  // Perpendicular unit vector: rotate (dx, dy) by 90°.
  const nx = -dy / len;
  const ny =  dx / len;
  const mx = (src.x + tgt.x) / 2;
  const my = (src.y + tgt.y) / 2;
  const half = (edges.length - 1) / 2;

  const patches: ParallelEdgePatch[] = [];
  for (let i = 0; i < edges.length; i++) {
    const edge = edges[i]!;
    const k = i - half;
    const off = k * ctx.spacing;

    const shape = (edge.style as EdgeStyle | undefined)?.shape;
    const pathType = shape?.pathType;
    const effectiveBasis =
      ctx.basis === 'auto'
        ? (pathType !== undefined && AXIS_ALIGNED_PATH_TYPES.has(pathType)
            ? 'axis-aligned'
            : 'perpendicular')
        : ctx.basis;

    // For axis-aligned routers (manhattan / orth / rounded), each edge needs
    // its OWN mid-corridor — if every waypoint shared the same dominant-axis
    // coordinate, all of their mid-segments would collapse onto a single
    // line. So when the chord is horizontal-dominant, each edge gets a
    // different `x` (its vertical run is at a unique column); when the
    // chord is vertical-dominant, each gets a different `y` (its horizontal
    // run is at a unique row).
    const waypoint =
      effectiveBasis === 'axis-aligned'
        ? horizontal
          ? { x: mx + off, y: my       }
          : { x: mx,       y: my + off }
        : { x: mx + nx * off, y: my + ny * off };

    const patch: ParallelEdgePatch = {
      edgeId: edge.id,
      waypoints: [waypoint],
    };

    if (ctx.anchorOffset) {
      const sourceAnchor = shape?.sourceAnchor;
      const targetAnchor = shape?.targetAnchor;
      if (sourceAnchor !== undefined && PORT_ANCHORS.has(sourceAnchor)) {
        (patch as { sourceAnchorOpts: Record<string, unknown> }).sourceAnchorOpts = {
          side: 'auto',
          offset: off,
        };
      }
      if (targetAnchor !== undefined && PORT_ANCHORS.has(targetAnchor)) {
        (patch as { targetAnchorOpts: Record<string, unknown> }).targetAnchorOpts = {
          side: 'auto',
          offset: off,
        };
      }
    }

    patches.push(patch);
  }
  return patches;
};

export class ParallelEdgeBehaviour extends Behaviour {
  /** Bound target layer — resolved in `onRegister`. */
  private layer: GraphLayer | null = null;

  private opts: ResolvedOptions;

  /** Subscription disposers, called in `onDestroy`. */
  private subs: Array<() => void> = [];

  /** Re-entrancy guard: `true` while writing patches to the store. */
  private patching = false;

  constructor(opts: ParallelEdgeBehaviourOptions) {
    super({ ...opts, shortcuts: opts.shortcuts ?? [] });
    this.opts = resolveOptions(null, opts);
  }

  // ─── Lifecycle ──────────────────────────────────────────────────────────

  protected override onRegister(ctx: CanvasContext): void {
    const layer = ctx.layers.get<GraphLayer>(this.layerId!);
    if (!layer) {
      throw new Error(
        `ParallelEdgeBehaviour "${this.id}": layer "${this.layerId}" not found. ` +
          `Add the GraphLayer before registering this behaviour.`,
      );
    }
    this.layer = layer;

    // Subscribe to events that can change group composition or endpoint
    // positions. We deliberately skip `'edge:update'` and `'flush'` — the
    // behaviour writes `edge:update`s of its own, and listening to either
    // would loop.
    const onChange = (): void => {
      if (!this.isEnabled) return;
      this.recompute();
    };
    this.subs.push(
      layer.store.events.on('edge:add', onChange),
      layer.store.events.on('edge:remove', onChange),
      layer.store.events.on('node:update', onChange),
      layer.store.events.on('node:remove', onChange),
    );
  }

  protected override onDestroy(): void {
    for (const off of this.subs) off();
    this.subs.length = 0;
    this.layer = null;
  }

  protected override onEnable(): void {
    // Apply a pass immediately so the first frame already shows distributed
    // edges (the events that would otherwise drive `recompute` may have
    // fired before the behaviour was enabled).
    this.recompute();
  }

  // ─── Public API ─────────────────────────────────────────────────────────

  /** Read-only snapshot of resolved options. */
  get options(): Readonly<ResolvedOptions> {
    return this.opts;
  }

  /** Runtime option update. Re-runs the distribution immediately if enabled. */
  setOptions(patch: Partial<ParallelEdgeBehaviourOptions>): void {
    this.opts = resolveOptions(this.opts, patch);
    if (this.isEnabled) this.recompute();
  }

  /**
   * Force a recompute pass. Useful after bulk mutations performed inside a
   * `store.batch()` that callers want to flush through the behaviour
   * immediately.
   */
  recompute(): void {
    const layer = this.layer;
    if (!layer || this.patching) return;
    const store = layer.store;
    const renderer = layer.getRenderer();

    // Bucket edges by group key. A single pass over `store.edges()` — no
    // adjacency index needed because we visit every edge once and group by
    // a derived string key.
    const groups = new Map<string, GraphEdge[]>();
    for (const edge of store.edges()) {
      const key = this.opts.groupBy(edge);
      if (key === null) continue;
      let bucket = groups.get(key);
      if (bucket === undefined) {
        bucket = [];
        groups.set(key, bucket);
      }
      bucket.push(edge);
    }

    this.patching = true;
    try {
      for (const edges of groups.values()) {
        if (edges.length < 2) continue;
        const first = edges[0]!;
        const sourceCenter = resolveCenter(layer, renderer, first.source);
        const targetCenter = resolveCenter(layer, renderer, first.target);
        if (!sourceCenter || !targetCenter) continue;

        const patches = this.opts.distribute(
          {
            sourceId: first.source,
            targetId: first.target,
            sourceCenter,
            targetCenter,
            edges,
          },
          {
            spacing: this.opts.spacing,
            basis: this.opts.basis,
            anchorOffset: this.opts.anchorOffset,
          },
        );

        for (const patch of patches) {
          applyPatch(store, patch);
        }
      }
    } finally {
      this.patching = false;
    }
  }
}

/**
 * Prefer the renderer's geometric centre (which already accounts for
 * shapes whose local origin is top-left, e.g. `rect`); fall back to the
 * store's raw position before the renderer has mounted.
 */
function resolveCenter(
  layer: GraphLayer,
  renderer: ReturnType<GraphLayer['getRenderer']>,
  nodeId: string,
): Vec2 | null {
  const c = renderer?.getShapeCenter(nodeId);
  if (c) return { x: c.x, y: c.y };
  return layer.store.getPosition(nodeId) ?? null;
}

/**
 * Merge a patch into an edge's existing `style.shape` and write it back
 * via `updateEdge`. `updateEdge` replaces `style` wholesale, so we spread
 * the full prior style + shape before overlaying.
 */
function applyPatch(
  store: GraphLayer['store'],
  patch: ParallelEdgePatch,
): void {
  const edge = store.getEdge(patch.edgeId);
  if (!edge) return;
  const priorStyle = (edge.style as EdgeStyle | undefined) ?? {};
  const priorShape = priorStyle.shape ?? {};
  const nextShape: EdgeShapeOptions = { ...priorShape };
  if (patch.waypoints !== undefined) {
    (nextShape as { waypoints: ParallelEdgePatch['waypoints'] }).waypoints =
      patch.waypoints;
  }
  if (patch.sourceAnchorOpts !== undefined) {
    (nextShape as { sourceAnchorOpts: Record<string, unknown> }).sourceAnchorOpts =
      patch.sourceAnchorOpts;
  }
  if (patch.targetAnchorOpts !== undefined) {
    (nextShape as { targetAnchorOpts: Record<string, unknown> }).targetAnchorOpts =
      patch.targetAnchorOpts;
  }
  store.updateEdge(patch.edgeId, {
    style: { ...priorStyle, shape: nextShape },
  });
}
