/**
 * `DegreeSizeBehaviour` — sizes nodes by their connection count.
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
 *   new DegreeSizeBehaviour({
 *     id: 'degree-size',
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
import type { EdgeDirection } from '../store/types';

/** Scaling curve used to map raw degree → output size. */
export type DegreeSizeScale = 'linear' | 'sqrt' | 'log';

/** Constructor options for `DegreeSizeBehaviour`. */
export interface DegreeSizeBehaviourOptions extends BehaviourOptions {
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
  scale?: DegreeSizeScale;

  /**
   * Optional override. When provided, supersedes `minSize` / `maxSize` /
   * `scale` and is called per-node with that node's degree plus the max
   * degree across the layer. Returns the literal `style.size` to write.
   */
  sizeFn?: (degree: number, maxDegree: number) => number;
}

interface ResolvedOptions {
  direction: EdgeDirection;
  minSize: number;
  maxSize: number;
  scale: DegreeSizeScale;
  sizeFn: ((degree: number, maxDegree: number) => number) | undefined;
}

function resolveOptions(
  prev: ResolvedOptions | null,
  patch: Partial<DegreeSizeBehaviourOptions>,
): ResolvedOptions {
  const base: ResolvedOptions = prev ?? {
    direction: 'both',
    minSize: 8,
    maxSize: 32,
    scale: 'sqrt',
    sizeFn: undefined,
  };
  return {
    direction: patch.direction ?? base.direction,
    minSize: patch.minSize ?? base.minSize,
    maxSize: patch.maxSize ?? base.maxSize,
    scale: patch.scale ?? base.scale,
    sizeFn: 'sizeFn' in patch ? patch.sizeFn : base.sizeFn,
  };
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

export class DegreeSizeBehaviour extends Behaviour {
  /** Bound target layer — resolved in `onRegister`. */
  private layer: GraphLayer | null = null;

  private opts: ResolvedOptions;

  /** Subscription disposers, called in `onDestroy`. */
  private readonly subs: Array<() => void> = [];

  /**
   * Snapshot of each touched node's prior `style.size`, captured on the
   * first write to that node. `undefined` means the node had no `size`
   * field before — restore by writing `undefined`. Cleared on `disable` /
   * `destroy`.
   */
  private readonly prior = new Map<string, number | undefined>();

  /** Microtask debounce flag — coalesces bursts of store events. */
  private recomputeScheduled = false;

  /** Re-entrancy guard — set while writing patches so our own emits no-op. */
  private patching = false;

  constructor(opts: DegreeSizeBehaviourOptions) {
    super({ ...opts, shortcuts: opts.shortcuts ?? [] });
    this.opts = resolveOptions(null, opts);
  }

  // ─── Lifecycle ──────────────────────────────────────────────────────────

  protected override onRegister(ctx: CanvasContext): void {
    const layer = ctx.layers.get<GraphLayer>(this.targetLayerId!);
    if (!layer) {
      throw new Error(
        `DegreeSizeBehaviour "${this.id}": layer "${this.targetLayerId}" not found. ` +
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
  setOptions(patch: Partial<DegreeSizeBehaviourOptions>): void {
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
    const degrees: Array<{ id: string; degree: number; style: NodeStyle | undefined }> = [];
    let maxDegree = 0;
    for (const node of store.nodes()) {
      const degree =
        direction === 'in'
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
    this.patching = true;
    try {
      for (const { id, degree, style } of degrees) {
        const size = mapDegreeToSize(degree, maxDegree, this.opts);
        if (!this.prior.has(id)) {
          this.prior.set(id, style?.size);
        }
        const prevStyle: NodeStyle = (style ?? {}) as NodeStyle;
        store.updateNode(id, {
          style: { ...prevStyle, size },
        });
      }
    } finally {
      this.patching = false;
    }
  }

  /** Restore each touched node's prior `style.size` and clear the snapshot. */
  private revertAll(): void {
    const layer = this.layer;
    if (!layer || this.prior.size === 0) {
      this.prior.clear();
      return;
    }
    const store = layer.store;
    this.patching = true;
    try {
      for (const [id, prevSize] of this.prior) {
        const node = store.getNode(id);
        if (!node) continue;
        const prevStyle: NodeStyle = (node.style ?? {}) as NodeStyle;
        // Build a fresh style object that omits `size` when prevSize was
        // undefined; otherwise restore the prior numeric value.
        const { size: _drop, ...rest } = prevStyle as NodeStyle & { size?: number };
        const restored: NodeStyle =
          prevSize === undefined ? (rest as NodeStyle) : ({ ...rest, size: prevSize } as NodeStyle);
        store.updateNode(id, { style: restored });
      }
    } finally {
      this.patching = false;
    }
    this.prior.clear();
  }
}
