/**
 * `NodeCentralityBehaviour` — sizes nodes by their connection count.
 *
 * For each node, counts incident edges in the configured `direction`
 * (`'in'` / `'out'` / `'both'`), normalizes against the max observed degree,
 * and writes a `style.size` value scaled between `minSize` and `maxSize`.
 *
 * Because `style.size` flows through `GraphLayer.resolveNodeStyle` (which
 * rewrites the node's `shape` geometry before any consumer reads it), the
 * sizes are picked up uniformly by:
 *   - the renderer (visual radius / width grows),
 *   - `boundsOfNode` (ELK and other layouts that query bounds),
 *   - D3ForceLayout's collide.radius callback (reads `style.shape.radius`
 *     off the resolved style).
 *
 * The behaviour does NOT auto-rerun any layout — write sizes first, then
 * call `layout.apply(graph)` yourself. This matches the rest of the
 * behaviour catalogue: no behaviour runs layouts implicitly.
 *
 * Lifecycle:
 *   - `onEnable()`        — snapshot prior per-node `style.size`, compute,
 *                           apply.
 *   - on topology change  — recompute and reapply (microtask-debounced). Only
 *                           node/edge add/remove trigger this — never `flush`
 *                           (which fires on every render, incl. hover/drag).
 *   - `onDisable()`       — restore the snapshotted prior `style.size`
 *                           values, clear snapshot.
 *
 * Defaults are `direction: 'both'`, `minSize: 8`, `maxSize: 32`,
 * `scale: 'sqrt'` — the sqrt curve dampens the long-tail effect typical of
 * real graphs (a few super-hubs would otherwise blow past the slider) while
 * still giving visually distinct sizing.
 *
 * @example
 * ```ts
 * canvas.behaviours.register(
 *   new NodeCentralityBehaviour({
 *     id: 'node-centrality',
 *     targetLayerId: 'graph',
 *     enabled: true,
 *     direction: 'both',
 *     minSize: 6,
 *     maxSize: 40,
 *     scale: 'sqrt',
 *   }),
 * );
 * // ...after registering, run the layout:
 * void layout.apply(graph);
 * ```
 */

import { Behaviour, type BehaviourOptions, type CanvasContext } from '@invana/canvas';

import { GraphLayer } from '../layer/GraphLayer';
import type { NodeStyle } from '../layer/types';
import type { EdgeDirection, GraphEdge } from '../store/types';

/** Scaling curve used to map raw degree → output size. */
export type NodeCentralityScale = 'linear' | 'sqrt' | 'log';

/** Constructor options for `NodeCentralityBehaviour`. */
export interface NodeCentralityBehaviourOptions extends BehaviourOptions {
  /** Required — the `GraphLayer` id this behaviour drives. */
  targetLayerId: string;

  /**
   * Edges to count when computing each node's degree.
   *
   * - `'in'`   — only edges where the node is the target.
   * - `'out'`  — only edges where the node is the source.
   * - `'both'` — sum of in + out. Default.
   */
  direction?: EdgeDirection;

  /** Output `style.size` for a node with degree === 0. Default `8`. */
  minSize?: number;

  /**
   * Output `style.size` for the node with the maximum observed degree.
   * Default `32`. Anything smaller than `minSize` is allowed but pointless.
   */
  maxSize?: number;

  /**
   * Curve mapping normalized degree (0..1) to a size between `minSize` and
   * `maxSize`. Default `'sqrt'`.
   *
   * - `'linear'` — size = min + (max - min) * (degree / maxDegree)
   * - `'sqrt'`   — size = min + (max - min) * sqrt(degree / maxDegree)
   *                dampens the long tail typical of real graphs
   * - `'log'`    — size = min + (max - min) * log1p(degree) / log1p(maxDegree)
   *                aggressive dampening; better for power-law graphs
   */
  scale?: NodeCentralityScale;

  /**
   * Optional override. When provided, supersedes `minSize` / `maxSize` /
   * `scale` and is called per-node with that node's degree plus the max
   * degree across the layer. Returns the literal `style.size` to write.
   */
  sizeFn?: (degree: number, maxDegree: number) => number;

  /**
   * **Weighted degree.** Numeric field name in each edge's `data` to sum
   * instead of counting edges — e.g. `'weight'`, `'sharedScenes'`. A node's
   * "degree" becomes the SUM of that field over its incident edges (respecting
   * {@link direction}); a non-numeric / missing value counts as `0`. Omit for a
   * raw edge count (default). {@link weightBy} takes precedence when both are set.
   */
  weightKey?: string;

  /**
   * **Weighted degree — code escape hatch.** Per-edge weight accessor; when
   * provided the node's "degree" is the SUM of `weightBy(edge)` over its
   * incident edges (respecting {@link direction}). Supersedes {@link weightKey}.
   * Not editor-exposed (function). Omit for a raw edge count.
   */
  weightBy?: (edge: GraphEdge) => number;

  /**
   * Also scale the **label** with the node: when set (`> 0`), each node's
   * `labelFontSize` is written as `clamp(size × labelScale, labelMinSize,
   * labelMaxSize)`, so a bigger (more central) node gets a bigger label. Omit
   * or `0` to leave labels untouched. Simple-node labels only — composite
   * internal text is template-owned.
   */
  labelScale?: number;

  /** Lower clamp for the scaled label font. Default `8`. */
  labelMinSize?: number;

  /** Upper clamp for the scaled label font. Default `40`. */
  labelMaxSize?: number;
}

interface ResolvedOptions {
  direction: EdgeDirection;
  minSize: number;
  maxSize: number;
  scale: NodeCentralityScale;
  sizeFn: ((degree: number, maxDegree: number) => number) | undefined;
  weightKey: string | undefined;
  weightBy: ((edge: GraphEdge) => number) | undefined;
  labelScale: number;
  labelMinSize: number;
  labelMaxSize: number;
}

function resolveOptions(
  prev: ResolvedOptions | null,
  patch: Partial<NodeCentralityBehaviourOptions>,
): ResolvedOptions {
  const base: ResolvedOptions = prev ?? {
    direction: 'both',
    minSize: 8,
    maxSize: 32,
    scale: 'sqrt',
    sizeFn: undefined,
    weightKey: undefined,
    weightBy: undefined,
    labelScale: 0,
    labelMinSize: 8,
    labelMaxSize: 40,
  };
  return {
    direction: patch.direction ?? base.direction,
    minSize: patch.minSize ?? base.minSize,
    maxSize: patch.maxSize ?? base.maxSize,
    scale: patch.scale ?? base.scale,
    sizeFn: 'sizeFn' in patch ? patch.sizeFn : base.sizeFn,
    weightKey: 'weightKey' in patch ? patch.weightKey : base.weightKey,
    weightBy: 'weightBy' in patch ? patch.weightBy : base.weightBy,
    labelScale: patch.labelScale ?? base.labelScale,
    labelMinSize: patch.labelMinSize ?? base.labelMinSize,
    labelMaxSize: patch.labelMaxSize ?? base.labelMaxSize,
  };
}

/** Clamp `v` into `[min, max]`. */
function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

/**
 * Map a node's degree to a size value per the resolved options.
 * Pulled out as a free function so unit-style reasoning is easier and the
 * call site stays branch-light.
 */
function mapDegreeToSize(degree: number, maxDegree: number, opts: ResolvedOptions): number {
  if (opts.sizeFn) return opts.sizeFn(degree, maxDegree);
  if (maxDegree <= 0) return opts.minSize;
  const t = degree / maxDegree;
  let eased: number;
  switch (opts.scale) {
    case 'linear':
      eased = t;
      break;
    case 'log':
      eased = Math.log1p(degree) / Math.log1p(maxDegree);
      break;
    case 'sqrt':
    default:
      eased = Math.sqrt(t);
      break;
  }
  return opts.minSize + (opts.maxSize - opts.minSize) * eased;
}

export class NodeCentralityBehaviour extends Behaviour {
  /** Bound target layer — resolved in `onRegister`. */
  private layer: GraphLayer | null = null;

  private opts: ResolvedOptions;

  /** Subscription disposers, called in `onDestroy`. */
  private readonly subs: Array<() => void> = [];

  /**
   * Snapshot of each touched node's prior `style.size` **and**
   * `style.labelFontSize`, captured on the first write to that node. A field
   * being `undefined` means the node had none before — restore by writing
   * `undefined`. Cleared on `disable` / `destroy`.
   */
  private readonly prior = new Map<string, { size?: number; labelFontSize?: number }>();

  /** Microtask debounce flag — coalesces bursts of store events. */
  private recomputeScheduled = false;

  /** Re-entrancy guard — set while writing patches so our own emits no-op. */
  private patching = false;

  constructor(opts: NodeCentralityBehaviourOptions) {
    super({ ...opts, shortcuts: opts.shortcuts ?? [] });
    this.opts = resolveOptions(null, opts);
  }

  // ─── Lifecycle ──────────────────────────────────────────────────────────

  protected override onRegister(ctx: CanvasContext): void {
    const layer = ctx.layers.get<GraphLayer>(this.targetLayerId!);
    if (!layer) {
      throw new Error(
        `NodeCentralityBehaviour "${this.id}": layer "${this.targetLayerId}" not found. ` +
          `Add the GraphLayer before registering this behaviour.`,
      );
    }
    this.layer = layer;

    // Recompute only on genuine topology changes — degree depends on the
    // node/edge set, nothing else. We deliberately skip two event kinds:
    //   - `'node:update'` — our own `updateNode` size writes emit it; listening
    //     would feed back into us.
    //   - `'flush'` — it fires on *every* render projection, including hover /
    //     drag / camera state changes. Subscribing to it made an unrelated
    //     hover recompute + rewrite every node, and those writes flush again →
    //     a self-sustaining loop that freezes on a large graph.
    // The granular add/remove events already cover bulk `setData` (the store
    // emits them per id at flush time), and `onEnable` runs an initial
    // `applyAll` for data present before this behaviour subscribed — so nothing
    // relies on the broad `flush` signal.
    const schedule = (): void => this.scheduleRecompute();
    this.subs.push(
      layer.store.events.on('node:add', schedule),
      layer.store.events.on('node:remove', schedule),
      layer.store.events.on('edge:add', schedule),
      layer.store.events.on('edge:remove', schedule),
    );
  }

  protected override onEnable(): void {
    // Apply immediately so the first frame already reflects degree sizing.
    this.applyAll();
  }

  protected override onDisable(): void {
    this.revertAll();
  }

  protected override onDestroy(): void {
    // If destroyed while enabled, restore prior sizes before tearing down so
    // we don't leave the layer in a half-modified state.
    if (this.prior.size > 0) this.revertAll();
    for (const off of this.subs) off();
    this.subs.length = 0;
    this.layer = null;
  }

  // ─── Public API ─────────────────────────────────────────────────────────

  /** Read-only snapshot of resolved options. */
  get options(): Readonly<ResolvedOptions> {
    return this.opts;
  }

  /**
   * Runtime option update. Re-runs `applyAll()` immediately if enabled so
   * GUI slider changes are visible without an extra call.
   */
  setOptions(patch: Partial<NodeCentralityBehaviourOptions>): void {
    this.opts = resolveOptions(this.opts, patch);
    if (this.isEnabled) this.applyAll();
  }

  /**
   * Force a recompute + write pass. Useful after a bulk `store.batch()`
   * the caller wants reflected immediately (the microtask-debounced
   * subscription would otherwise fire on the next tick).
   */
  recompute(): void {
    if (this.isEnabled) this.applyAll();
  }

  // ─── Internals ──────────────────────────────────────────────────────────

  private scheduleRecompute(): void {
    if (!this.isEnabled || this.patching || this.recomputeScheduled) return;
    this.recomputeScheduled = true;
    queueMicrotask(() => {
      this.recomputeScheduled = false;
      if (!this.isEnabled) return;
      this.applyAll();
    });
  }

  /**
   * Compute degree for every node, map to size, and write back via
   * `store.updateNode` (merged with the prior `style` per the
   * `updateNode replaces style wholesale` contract).
   *
   * Nodes touched here have their original `style.size` captured into
   * `this.prior` on first write so `revertAll()` can restore them.
   */
  private applyAll(): void {
    const layer = this.layer;
    if (!layer) return;
    const store = layer.store;
    const { direction } = this.opts;

    // First pass — collect (id, degree) and find maxDegree. Single iteration
    // over store.nodes(); inDegree/outDegree are O(1) lookups on the
    // adjacency index.
    // Weighted degree (sum of an edge-weight field/fn) when configured; else the
    // O(1) raw incident-edge count off the adjacency index.
    const weighted = this.opts.weightBy !== undefined || this.opts.weightKey !== undefined;
    const degrees: Array<{ id: string; degree: number; style: NodeStyle | undefined }> = [];
    let maxDegree = 0;
    for (const node of store.nodes()) {
      const degree = weighted
        ? this.weightedDegree(store, node.id, direction)
        : direction === 'in'
          ? store.inDegree(node.id)
          : direction === 'out'
            ? store.outDegree(node.id)
            : store.inDegree(node.id) + store.outDegree(node.id);
      if (degree > maxDegree) maxDegree = degree;
      degrees.push({
        id: node.id,
        degree,
        style: node.style as NodeStyle | undefined,
      });
    }

    // Second pass — compute size and write. The re-entrancy guard prevents
    // our own `'node:update'` flushes from re-triggering `scheduleRecompute`
    // mid-batch (we don't listen to `'node:update'` anyway, but `'flush'`
    // does fire after a batched write).
    const { labelScale, labelMinSize, labelMaxSize } = this.opts;
    this.patching = true;
    try {
      for (const { id, degree, style } of degrees) {
        const size = mapDegreeToSize(degree, maxDegree, this.opts);
        if (!this.prior.has(id)) {
          this.prior.set(id, { size: style?.size, labelFontSize: style?.labelFontSize });
        }
        const prevStyle: NodeStyle = (style ?? {}) as NodeStyle;
        // Label font: scale with the node when `labelScale` is on; otherwise
        // restore whatever the node had before we first touched it (so toggling
        // the option off un-scales cleanly).
        const labelFontSize =
          labelScale > 0
            ? clamp(size * labelScale, labelMinSize, labelMaxSize)
            : this.prior.get(id)!.labelFontSize;
        store.updateNode(id, {
          style: { ...prevStyle, size, labelFontSize },
        });
      }
    } finally {
      this.patching = false;
    }
  }

  /**
   * Weighted degree — the SUM of the configured edge weight over a node's
   * incident edges in `direction`. O(edges-of-node); the whole pass is O(E).
   */
  private weightedDegree(
    store: GraphLayer['store'],
    id: string,
    direction: EdgeDirection,
  ): number {
    let sum = 0;
    for (const edge of store.edgesOf(id, direction)) sum += this.weightOf(edge);
    return sum;
  }

  /**
   * One edge's weight: `weightBy` fn wins; else `data[weightKey]` (a non-numeric
   * / missing value counts as `0`). Only called when weighting is configured.
   */
  private weightOf(edge: GraphEdge): number {
    const { weightBy, weightKey } = this.opts;
    if (weightBy) return weightBy(edge);
    if (weightKey !== undefined) {
      const v = (edge.data as Record<string, unknown> | undefined)?.[weightKey];
      return typeof v === 'number' && Number.isFinite(v) ? v : 0;
    }
    return 1;
  }

  /**
   * Restore each touched node's prior `style.size` + `style.labelFontSize` and
   * clear the snapshot. A field that was `undefined` before is dropped again.
   */
  private revertAll(): void {
    const layer = this.layer;
    if (!layer || this.prior.size === 0) {
      this.prior.clear();
      return;
    }
    const store = layer.store;
    this.patching = true;
    try {
      for (const [id, prev] of this.prior) {
        const node = store.getNode(id);
        if (!node) continue;
        const prevStyle: NodeStyle = (node.style ?? {}) as NodeStyle;
        // Strip both fields, then re-add whichever had a prior value — so a
        // field the node never had is left absent rather than pinned to a value.
        const { size: _dropSize, labelFontSize: _dropFont, ...rest } = prevStyle as NodeStyle & {
          size?: number;
          labelFontSize?: number;
        };
        const restored: NodeStyle = { ...(rest as NodeStyle) };
        if (prev.size !== undefined) (restored as NodeStyle & { size?: number }).size = prev.size;
        if (prev.labelFontSize !== undefined)
          (restored as NodeStyle & { labelFontSize?: number }).labelFontSize = prev.labelFontSize;
        store.updateNode(id, { style: restored });
      }
    } finally {
      this.patching = false;
    }
    this.prior.clear();
  }
}
