/**
 * `GraphStore` — the domain primitive for `@invana/graph`.
 *
 * Composes two `ColumnStore`s (from `@invana/canvas`) for hot fields plus
 * `Map<id, payload>` for cold fields. Adjacency uses per-slot `Int32Array`
 * indices via {@link AdjacencyIndex}. Streaming feeds get RAF-coalesced
 * flushing via {@link FrameFlushScheduler} and out-of-order edge handling
 * via {@link PendingEdges}.
 *
 * See `apps/docs/graph/data-model.md` for the user-facing description and
 * `apps/docs/graph/store-plan.md` for the implementation rationale.
 */

import { ColumnStore, SourceEmitter } from '@invana/canvas';
import type { CanvasEventBus, DataSource, FlushMode, LayerFlush } from '@invana/canvas';

import { AdjacencyIndex } from './AdjacencyIndex';
import { FrameFlushScheduler } from './FrameFlushScheduler';
import { PendingEdges } from './PendingEdges';
import type {
  EdgeDirection,
  GraphEdge,
  GraphNode,
  GraphStoreEventMap,
  GraphStoreOptions,
  Vec2,
} from './types';

/** Bit layout for the `flags` column on the node ColumnStore. */
const FLAG_PINNED = 1 << 0;
const FLAG_TOMBSTONE = 1 << 1;
/**
 * Explicit per-element visibility. Set on the node **and** edge `flags` column.
 * `1 << 1` is the tombstone bit, so hidden takes `1 << 2`.
 */
const FLAG_HIDDEN = 1 << 2;

/** Node hot-field schema. */
const NODE_SCHEMA = {
  x: 'f32',
  y: 'f32',
  flags: 'u8',
} as const;

/** Edge hot-field schema. Stores source/target node *slot* indices for O(1) lookup. */
const EDGE_SCHEMA = {
  srcSlot: 'i32',
  dstSlot: 'i32',
  flags: 'u8',
} as const;

/** Mutable counters accumulated between flushes. */
interface FlushCounters {
  addedNodes: number;
  updatedNodes: number;
  removedNodes: number;
  addedEdges: number;
  updatedEdges: number;
  removedEdges: number;
}

function emptyCounters(): FlushCounters {
  return {
    addedNodes: 0,
    updatedNodes: 0,
    removedNodes: 0,
    addedEdges: 0,
    updatedEdges: 0,
    removedEdges: 0,
  };
}

export class GraphStore implements DataSource {
  // ─── Options ────────────────────────────────────────────────────────────
  private flushMode: 'sync' | 'frame' | 'manual';
  private readonly unknownEndpoint: 'throw' | 'buffer' | 'drop';
  private readonly pendingEdgeTTL: number;

  // ─── Hot storage (typed arrays via ColumnStore) ─────────────────────────
  private readonly nodeCols: ColumnStore<typeof NODE_SCHEMA>;
  private readonly edgeCols: ColumnStore<typeof EDGE_SCHEMA>;

  // ─── Cold storage (Map<id, payload>) ────────────────────────────────────
  private readonly nodeMap: Map<string, GraphNode> = new Map();
  private readonly edgeMap: Map<string, GraphEdge> = new Map();
  private readonly childrenIndex: Map<string, Set<string>> = new Map();

  // ─── Interaction state (presence compartment) ───────────────────────────
  // The *runtime* active-state sets — hover / selected / highlighted toggled by
  // behaviours and UI. Kept SEPARATE from the cold `states[]` field, which is
  // the *document* (data-driven) active-state list. The two compartments are
  // independent: runtime toggles never touch `states[]`, and a data-feed
  // `updateNode({ states })` never touches these sets (so a feed update can't
  // wipe a live hover/selection). The renderer reads the **union** of both via
  // {@link nodeStatesOf}. See `store-owns-state-plan.md` § 0 / § 5.
  private readonly nodeRuntimeStates: Map<string, Set<string>> = new Map();
  private readonly edgeRuntimeStates: Map<string, Set<string>> = new Map();

  // ─── Visibility (explicit-hidden indexes) ───────────────────────────────
  // Ids of elements whose explicit `hidden` flag is set. Kept in lockstep with
  // the `FLAG_HIDDEN` bit in the `flags` column (the flag is the storage the
  // renderer/compact read; these sets give O(1) `hiddenNodeCount()` and cheap
  // `hiddenNodes()` iteration without scanning every element). Effective edge
  // visibility (edge hidden if an endpoint is hidden) is derived lazily — no
  // set is maintained for it. See `docs/per-element-visibility-plan.md`.
  private readonly hiddenNodeIds: Set<string> = new Set();
  private readonly hiddenEdgeIds: Set<string> = new Set();

  // ─── Indices ────────────────────────────────────────────────────────────
  private readonly outAdj = new AdjacencyIndex();
  private readonly inAdj = new AdjacencyIndex();
  private readonly pending = new PendingEdges();

  // ─── Reactivity ─────────────────────────────────────────────────────────
  /**
   * Public event bus. Subscribe via `store.events.on('node:add', ...)`.
   *
   * A `SourceEmitter` (`{ kind: 'store' }`): once the owning layer calls
   * {@link bindBus} on mount, every emit also publishes a `CanvasEvent` envelope
   * to the canvas tap channel, so telemetry sees all store mutations
   * (`store-owns-state-plan.md` § 6).
   */
  readonly events: SourceEmitter<GraphStoreEventMap>;

  /** Per-flush counters. Reset on `flush()`. */
  private counters = emptyCounters();

  /** Pending dedup-ed event payloads to fire on the next flush. */
  private pendingNodeAdds: Set<string> = new Set();
  private pendingNodeUpdates: Map<string, Partial<GraphNode>> = new Map();
  private pendingNodeRemoves: Set<string> = new Set();
  private pendingEdgeAdds: Set<string> = new Set();
  private pendingEdgeUpdates: Map<string, Partial<GraphEdge>> = new Map();
  private pendingEdgeRemoves: Set<string> = new Set();
  private pendingEdgeOrphans: Set<string> = new Set();
  /**
   * Pending runtime-state toggles, keyed by `"<id>\u0000<name>"` so repeated
   * toggles of the same (id, name) within a flush window collapse to one event.
   * The emitted `on` is read from live set membership at flush time, so an
   * add+remove in the same frame nets out correctly.
   */
  private pendingNodeStates: Map<string, { id: string; name: string; actor?: string }> = new Map();
  private pendingEdgeStates: Map<string, { id: string; name: string; actor?: string }> = new Map();
  /**
   * Pending **explicit** visibility changes, keyed by id → latest hidden value.
   * Coalesced per flush (hide-then-show in one batch nets to the final value)
   * and emitted as `node:visibility` / `edge:visibility`. Endpoint-driven
   * (effective) edge hiding produces no entry here.
   */
  private pendingNodeVisibility: Map<string, boolean> = new Map();
  private pendingEdgeVisibility: Map<string, boolean> = new Map();

  /** Depth of nested `batch()` calls. Flushes only on outermost exit. */
  private batchDepth = 0;
  private flushScheduler: FrameFlushScheduler | null = null;

  /** {@link DataSource} flush listeners — fed a {@link LayerFlush} delta projection (D13). */
  private readonly flushListeners = new Set<(delta: LayerFlush) => void>();

  /** Monotonic version counter. Bumps on every mutation including silent. */
  private _version = 0;

  /**
   * Monotonic flush counter. Bumps on every `doFlush` regardless of which
   * code path triggered the flush. Used by `PendingEdges` TTL accounting.
   */
  private _frame = 0;

  // ────────────────────────────────────────────────────────────────────────

  constructor(opts: GraphStoreOptions = {}) {
    this.flushMode = opts.flushMode ?? 'sync';
    this.unknownEndpoint = opts.unknownEndpoint ?? 'throw';
    this.pendingEdgeTTL = opts.pendingEdgeTTL ?? Infinity;
    const initialCapacity = opts.initialCapacity ?? 256;

    this.events = new SourceEmitter<GraphStoreEventMap>({
      kind: 'store',
      id: opts.id ?? 'graph-store',
    });

    this.nodeCols = new ColumnStore(NODE_SCHEMA, { initialCapacity });
    this.edgeCols = new ColumnStore(EDGE_SCHEMA, { initialCapacity });

    if (this.flushMode === 'frame') {
      this.flushScheduler = new FrameFlushScheduler(() => this.doFlush());
    }
  }

  /**
   * Attach (or detach with `undefined`) the canvas event bus this store's
   * events forward to. Called by the owning `GraphLayer` on mount/unmount so
   * store mutations reach the telemetry tap channel (§ 6). Local
   * `store.events.on(...)` subscribers work with or without a bus.
   */
  bindBus(bus: CanvasEventBus | undefined): void {
    this.events.setBus(bus);
  }

  // ─── Public read accessors ──────────────────────────────────────────────

  /** Monotonic counter. Bumps on every mutation including silent position writes. */
  get version(): number {
    return this._version;
  }

  /** Number of live (non-tombstoned) nodes. */
  nodeCount(): number {
    return this.nodeMap.size;
  }

  /** Number of live (non-tombstoned) edges. */
  edgeCount(): number {
    return this.edgeMap.size;
  }

  hasNode(id: string): boolean {
    return this.nodeMap.has(id);
  }

  hasEdge(id: string): boolean {
    return this.edgeMap.has(id);
  }

  getNode<D = unknown>(id: string): GraphNode<D> | undefined {
    const cold = this.nodeMap.get(id);
    if (!cold) return undefined;
    const pos = this.readPosition(id);
    const node: GraphNode<D> = { ...(cold as GraphNode<D>) };
    if (pos) node.position = pos;
    node.pinned = this.isPinned(id);
    node.hidden = this.isNodeHidden(id);
    return node;
  }

  getEdge<D = unknown>(id: string): GraphEdge<D> | undefined {
    const cold = this.edgeMap.get(id);
    if (!cold) return undefined;
    const edge = { ...cold } as GraphEdge<D>;
    edge.hidden = this.isEdgeHidden(id);
    return edge;
  }

  /**
   * Write a node's cached {@link GraphNode.boundingBox} — the local render size
   * the `GraphLayer` computed after drawing it. **Silent**: this is a derived
   * cache, not a data mutation, so it emits no change / flush event and does not
   * bump {@link version} (avoids a render feedback loop). Unknown ids are a
   * no-op. Surfaced by {@link getNode} / {@link nodes} so layouts can read a
   * node's footprint without recomputing its shape spec.
   */
  setNodeBoundingBox(id: string, box: { width: number; height: number } | undefined): void {
    const cold = this.nodeMap.get(id);
    if (cold) cold.boundingBox = box;
  }

  *nodes(): IterableIterator<GraphNode> {
    for (const id of this.nodeMap.keys()) {
      const node = this.getNode(id);
      if (node) yield node;
    }
  }

  *edges(): IterableIterator<GraphEdge> {
    for (const [id, cold] of this.edgeMap) yield { ...cold, hidden: this.isEdgeHidden(id) };
  }

  // ─── Adjacency ──────────────────────────────────────────────────────────

  outDegree(nodeId: string): number {
    const slot = this.nodeCols.slot(nodeId);
    if (slot === undefined) return 0;
    return this.outAdj.degree(slot);
  }

  inDegree(nodeId: string): number {
    const slot = this.nodeCols.slot(nodeId);
    if (slot === undefined) return 0;
    return this.inAdj.degree(slot);
  }

  /**
   * Yield edges incident to `nodeId` in the requested direction.
   * `'out'` — edges where `nodeId` is the source.
   * `'in'`  — edges where `nodeId` is the target.
   * `'both'` — out then in.
   */
  *edgesOf(nodeId: string, dir: EdgeDirection = 'both'): IterableIterator<GraphEdge> {
    const slot = this.nodeCols.slot(nodeId);
    if (slot === undefined) return;
    if (dir === 'out' || dir === 'both') {
      const view = this.outAdj.view(slot);
      for (let i = 0; i < view.length; i++) {
        const edgeId = this.edgeCols.idAt(view[i]!);
        if (edgeId !== undefined) {
          const cold = this.edgeMap.get(edgeId);
          if (cold) yield { ...cold };
        }
      }
    }
    if (dir === 'in' || dir === 'both') {
      const view = this.inAdj.view(slot);
      for (let i = 0; i < view.length; i++) {
        const edgeId = this.edgeCols.idAt(view[i]!);
        if (edgeId !== undefined) {
          const cold = this.edgeMap.get(edgeId);
          if (cold) yield { ...cold };
        }
      }
    }
  }

  /** Yield neighbor node ids in the requested direction. */
  *neighborsOf(nodeId: string, dir: EdgeDirection = 'both'): IterableIterator<string> {
    const slot = this.nodeCols.slot(nodeId);
    if (slot === undefined) return;
    const srcCol = this.edgeCols.column('srcSlot');
    const dstCol = this.edgeCols.column('dstSlot');
    if (dir === 'out' || dir === 'both') {
      const view = this.outAdj.view(slot);
      for (let i = 0; i < view.length; i++) {
        const otherSlot = dstCol[view[i]!]!;
        const otherId = this.nodeCols.idAt(otherSlot);
        if (otherId !== undefined) yield otherId;
      }
    }
    if (dir === 'in' || dir === 'both') {
      const view = this.inAdj.view(slot);
      for (let i = 0; i < view.length; i++) {
        const otherSlot = srcCol[view[i]!]!;
        const otherId = this.nodeCols.idAt(otherSlot);
        if (otherId !== undefined) yield otherId;
      }
    }
  }

  // ─── Hierarchy ──────────────────────────────────────────────────────────

  parentOf(id: string): string | undefined {
    return this.nodeMap.get(id)?.parentId;
  }

  *childrenOf(parentId: string): IterableIterator<string> {
    const set = this.childrenIndex.get(parentId);
    if (!set) return;
    for (const childId of set) yield childId;
  }

  *descendantsOf(id: string): IterableIterator<string> {
    const stack: string[] = [];
    const initial = this.childrenIndex.get(id);
    if (initial) for (const c of initial) stack.push(c);
    while (stack.length > 0) {
      const next = stack.pop()!;
      yield next;
      const kids = this.childrenIndex.get(next);
      if (kids) for (const c of kids) stack.push(c);
    }
  }

  *ancestorsOf(id: string): IterableIterator<string> {
    let cursor = this.parentOf(id);
    while (cursor !== undefined) {
      yield cursor;
      cursor = this.parentOf(cursor);
    }
  }

  // ─── Positions ──────────────────────────────────────────────────────────

  getPosition(id: string): Vec2 | undefined {
    return this.readPosition(id);
  }

  /**
   * Set a single node's position.
   *
   * Default fires `node:update`. `opts.silent: true` skips the event and just
   * bumps `version` — use for layout sim ticks at 60fps.
   */
  setPosition(id: string, pos: Vec2, opts?: { silent?: boolean }): void {
    const slot = this.nodeCols.slot(id);
    if (slot === undefined) return;
    const xCol = this.nodeCols.column('x');
    const yCol = this.nodeCols.column('y');
    xCol[slot] = pos.x;
    yCol[slot] = pos.y;
    this.nodeCols.touch();
    this._version++;
    if (!opts?.silent) {
      this.enqueueNodeUpdate(id, { position: { x: pos.x, y: pos.y } });
      this.scheduleFlushIfNeeded();
    }
  }

  /**
   * Set many positions in a single tight loop.
   *
   * `xy` is packed `[x0, y0, x1, y1, ...]` (length must equal `ids.length * 2`).
   * `opts.silent: true` skips events — sim-tick fastpath. Otherwise emits one
   * deduped `node:update` per id.
   */
  setPositionsBulk(ids: readonly string[], xy: Float32Array, opts?: { silent?: boolean }): void {
    if (xy.length !== ids.length * 2) {
      throw new Error(
        `GraphStore.setPositionsBulk: xy.length=${xy.length} must equal ids.length*2=${ids.length * 2}`,
      );
    }
    const xCol = this.nodeCols.column('x');
    const yCol = this.nodeCols.column('y');
    const silent = !!opts?.silent;
    for (let i = 0; i < ids.length; i++) {
      const slot = this.nodeCols.slot(ids[i]!);
      if (slot === undefined) continue;
      const x = xy[i * 2]!;
      const y = xy[i * 2 + 1]!;
      xCol[slot] = x;
      yCol[slot] = y;
      if (!silent) {
        this.enqueueNodeUpdate(ids[i]!, { position: { x, y } });
      }
    }
    this.nodeCols.touch();
    this._version++;
    if (!silent) this.scheduleFlushIfNeeded();
  }

  setPinned(id: string, pinned: boolean): void {
    const slot = this.nodeCols.slot(id);
    if (slot === undefined) return;
    const flagsCol = this.nodeCols.column('flags');
    const prev = flagsCol[slot]!;
    const next = pinned ? prev | FLAG_PINNED : prev & ~FLAG_PINNED;
    if (next === prev) return;
    flagsCol[slot] = next;
    this.nodeCols.touch();
    this._version++;
    this.enqueueNodeUpdate(id, { pinned });
    this.scheduleFlushIfNeeded();
  }

  isPinned(id: string): boolean {
    const slot = this.nodeCols.slot(id);
    if (slot === undefined) return false;
    return (this.nodeCols.column('flags')[slot]! & FLAG_PINNED) !== 0;
  }

  *pinnedIds(): IterableIterator<string> {
    const flagsCol = this.nodeCols.column('flags');
    for (const id of this.nodeMap.keys()) {
      const slot = this.nodeCols.slot(id);
      if (slot === undefined) continue;
      if ((flagsCol[slot]! & FLAG_PINNED) !== 0) yield id;
    }
  }

  // ─── Visibility (hide / show) ───────────────────────────────────────────
  //
  // First-class per-element visibility. `hide*` / `show*` flip an explicit
  // `hidden` flag (a bit in the `flags` column, sibling of `pinned`); the
  // renderer, hit-test, bounds/camera, layout, labels and minimap all cull
  // effectively-hidden elements. Single ops are usable inside a caller's
  // `batch()`; bulk ops wrap themselves in one batch → one flush → one paint.
  //
  // Effective visibility (the rule consumers keep re-implementing, owned here):
  //   • a node is effectively hidden iff it is explicitly hidden;
  //   • an edge is effectively hidden iff it is explicitly hidden OR either
  //     endpoint is hidden (so hiding a node visually removes its incident
  //     edges without flagging them — no per-edge event, derived on read).
  // Hiding an element also clears its runtime (presence) states so no stale
  // hover/selection points at an invisible element. Topology queries
  // (`neighborsOf` / `degree` / `nodes()` / `edges()`) stay visibility-blind.

  /** Hide a node. Idempotent; usable inside a caller's `batch()`. */
  hideNode(id: string): void {
    if (this.applyNodeHidden(id, true)) this.scheduleFlushIfNeeded();
  }

  /** Show a node (clear its explicit hidden flag). Idempotent. */
  showNode(id: string): void {
    if (this.applyNodeHidden(id, false)) this.scheduleFlushIfNeeded();
  }

  /** Set a node's explicit hidden flag. Idempotent. */
  setNodeHidden(id: string, hidden: boolean): void {
    if (this.applyNodeHidden(id, hidden)) this.scheduleFlushIfNeeded();
  }

  /** Flip a node's explicit hidden flag. Returns the resulting hidden state. */
  toggleNodeHidden(id: string): boolean {
    this.setNodeHidden(id, !this.isNodeHidden(id));
    return this.isNodeHidden(id);
  }

  /** True iff the node's **explicit** hidden flag is set (O(1)). */
  isNodeHidden(id: string): boolean {
    const slot = this.nodeCols.slot(id);
    if (slot === undefined) return false;
    return (this.nodeCols.column('flags')[slot]! & FLAG_HIDDEN) !== 0;
  }

  /** Effective visibility of a node — live and not explicitly hidden. */
  isNodeVisible(id: string): boolean {
    return this.nodeMap.has(id) && !this.isNodeHidden(id);
  }

  /** Hide many nodes in one batch → one flush. */
  hideNodes(ids: Iterable<string>): void {
    this.batch(() => {
      for (const id of ids) this.hideNode(id);
    });
  }

  /** Show many nodes in one batch → one flush. */
  showNodes(ids: Iterable<string>): void {
    this.batch(() => {
      for (const id of ids) this.showNode(id);
    });
  }

  /** Set the hidden flag on many nodes in one batch → one flush. */
  setNodesHidden(ids: Iterable<string>, hidden: boolean): void {
    this.batch(() => {
      for (const id of ids) this.setNodeHidden(id, hidden);
    });
  }

  /** Ids of every explicitly-hidden node (O(1)-tracked, no scan). */
  *hiddenNodes(): IterableIterator<string> {
    for (const id of this.hiddenNodeIds) yield id;
  }

  /** Count of explicitly-hidden nodes (O(1)). */
  hiddenNodeCount(): number {
    return this.hiddenNodeIds.size;
  }

  /** Hide an edge. Idempotent; usable inside a caller's `batch()`. */
  hideEdge(id: string): void {
    if (this.applyEdgeHidden(id, true)) this.scheduleFlushIfNeeded();
  }

  /** Show an edge (clear its explicit hidden flag). Idempotent. */
  showEdge(id: string): void {
    if (this.applyEdgeHidden(id, false)) this.scheduleFlushIfNeeded();
  }

  /** Set an edge's explicit hidden flag. Idempotent. */
  setEdgeHidden(id: string, hidden: boolean): void {
    if (this.applyEdgeHidden(id, hidden)) this.scheduleFlushIfNeeded();
  }

  /** Flip an edge's explicit hidden flag. Returns the resulting hidden state. */
  toggleEdgeHidden(id: string): boolean {
    this.setEdgeHidden(id, !this.isEdgeHidden(id));
    return this.isEdgeHidden(id);
  }

  /** True iff the edge's **explicit** hidden flag is set (O(1)). */
  isEdgeHidden(id: string): boolean {
    const slot = this.edgeCols.slot(id);
    if (slot === undefined) return false;
    return (this.edgeCols.column('flags')[slot]! & FLAG_HIDDEN) !== 0;
  }

  /**
   * Effective visibility of an edge — live, not explicitly hidden, and with
   * **both endpoints visible**. This is the derived rule the renderer/hit-test
   * consult; hiding a node makes its incident edges return `false` here without
   * flagging them.
   */
  isEdgeVisible(id: string): boolean {
    const cold = this.edgeMap.get(id);
    if (!cold) return false;
    if (this.isEdgeHidden(id)) return false;
    if (this.isNodeHidden(cold.source)) return false;
    if (this.isNodeHidden(cold.target)) return false;
    return true;
  }

  /** Hide many edges in one batch → one flush. */
  hideEdges(ids: Iterable<string>): void {
    this.batch(() => {
      for (const id of ids) this.hideEdge(id);
    });
  }

  /** Show many edges in one batch → one flush. */
  showEdges(ids: Iterable<string>): void {
    this.batch(() => {
      for (const id of ids) this.showEdge(id);
    });
  }

  /** Set the hidden flag on many edges in one batch → one flush. */
  setEdgesHidden(ids: Iterable<string>, hidden: boolean): void {
    this.batch(() => {
      for (const id of ids) this.setEdgeHidden(id, hidden);
    });
  }

  /** Ids of every explicitly-hidden edge (O(1)-tracked, no scan). */
  *hiddenEdges(): IterableIterator<string> {
    for (const id of this.hiddenEdgeIds) yield id;
  }

  /** Count of explicitly-hidden edges (O(1)). */
  hiddenEdgeCount(): number {
    return this.hiddenEdgeIds.size;
  }

  /** Clear every explicit hidden flag (nodes + edges) in one batch → one flush. */
  showAllHidden(): void {
    this.batch(() => {
      for (const id of [...this.hiddenNodeIds]) this.showNode(id);
      for (const id of [...this.hiddenEdgeIds]) this.showEdge(id);
    });
  }

  /** Hide every node for which `fn` returns true, in one batch → one flush. */
  hideNodesByPredicate(fn: (node: GraphNode) => boolean): void {
    this.batch(() => {
      for (const node of this.nodes()) {
        if (fn(node)) this.hideNode(node.id);
      }
    });
  }

  /**
   * Flip a node's `FLAG_HIDDEN` bit + index, clear its runtime states on hide,
   * bump `version`, and enqueue a `node:visibility` event. Returns whether the
   * flag actually changed. Shared by the public setters and `updateNode`.
   */
  private applyNodeHidden(id: string, hidden: boolean): boolean {
    const slot = this.nodeCols.slot(id);
    if (slot === undefined) return false;
    const flagsCol = this.nodeCols.column('flags');
    const prev = flagsCol[slot]!;
    const next = hidden ? prev | FLAG_HIDDEN : prev & ~FLAG_HIDDEN;
    if (next === prev) return false;
    flagsCol[slot] = next;
    if (hidden) this.hiddenNodeIds.add(id);
    else this.hiddenNodeIds.delete(id);
    this.nodeCols.touch();
    this._version++;
    if (hidden) this.clearNodeRuntimeStatesOf(id);
    this.enqueueNodeVisibility(id, hidden);
    return true;
  }

  /** Edge sibling of {@link applyNodeHidden}. */
  private applyEdgeHidden(id: string, hidden: boolean): boolean {
    const slot = this.edgeCols.slot(id);
    if (slot === undefined) return false;
    const flagsCol = this.edgeCols.column('flags');
    const prev = flagsCol[slot]!;
    const next = hidden ? prev | FLAG_HIDDEN : prev & ~FLAG_HIDDEN;
    if (next === prev) return false;
    flagsCol[slot] = next;
    if (hidden) this.hiddenEdgeIds.add(id);
    else this.hiddenEdgeIds.delete(id);
    this.edgeCols.touch();
    this._version++;
    if (hidden) this.clearEdgeRuntimeStatesOf(id);
    this.enqueueEdgeVisibility(id, hidden);
    return true;
  }

  /**
   * Drop every runtime (presence) state on a node — used when hiding so a
   * re-shown element returns clean (no stale hover/selection/highlight). Emits
   * `node:state` off events for each cleared name. Does not touch document
   * `states[]`.
   */
  private clearNodeRuntimeStatesOf(id: string): void {
    const set = this.nodeRuntimeStates.get(id);
    if (!set || set.size === 0) return;
    const names = [...set];
    this.nodeRuntimeStates.delete(id);
    for (const name of names) this.enqueueNodeState(id, name);
  }

  /** Edge sibling of {@link clearNodeRuntimeStatesOf}. */
  private clearEdgeRuntimeStatesOf(id: string): void {
    const set = this.edgeRuntimeStates.get(id);
    if (!set || set.size === 0) return;
    const names = [...set];
    this.edgeRuntimeStates.delete(id);
    for (const name of names) this.enqueueEdgeState(id, name);
  }

  // ─── CRUD: nodes ────────────────────────────────────────────────────────

  /** Strict add — throws on duplicate. */
  addNode<D>(node: GraphNode<D>): void {
    if (this.nodeMap.has(node.id)) {
      throw new Error(`GraphStore.addNode: duplicate id "${node.id}"`);
    }
    this.installNode(node);
    this.scheduleFlushIfNeeded();
  }

  /** Add-or-merge. Streaming-friendly path. */
  upsertNode<D>(node: GraphNode<D>): void {
    if (this.nodeMap.has(node.id)) {
      this.updateNode(node.id, node as Partial<GraphNode<D>>);
      return;
    }
    this.installNode(node);
    this.scheduleFlushIfNeeded();
  }

  updateNode<D>(id: string, patch: Partial<GraphNode<D>>): void {
    const cold = this.nodeMap.get(id);
    if (!cold) return;
    const slot = this.nodeCols.slot(id)!;

    // Re-parenting validation + index maintenance.
    if ('parentId' in patch && patch.parentId !== cold.parentId) {
      if (patch.parentId !== undefined) {
        if (patch.parentId === id) {
          throw new Error(`GraphStore.updateNode: parentId cycle (self-parent) on "${id}"`);
        }
        if (this.wouldCreateCycle(id, patch.parentId)) {
          throw new Error(
            `GraphStore.updateNode: parentId cycle — "${patch.parentId}" is a descendant of "${id}"`,
          );
        }
      }
      if (cold.parentId !== undefined) {
        this.childrenIndex.get(cold.parentId)?.delete(id);
      }
      if (patch.parentId !== undefined) {
        let set = this.childrenIndex.get(patch.parentId);
        if (!set) {
          set = new Set();
          this.childrenIndex.set(patch.parentId, set);
        }
        set.add(id);
      }
      cold.parentId = patch.parentId;
    }

    if ('data' in patch) cold.data = patch.data;

    if ('states' in patch) cold.states = patch.states ?? undefined;
    if ('state' in patch) cold.state = patch.state;
    if ('type' in patch) cold.type = patch.type;
    if ('style' in patch) cold.style = patch.style;

    if ('position' in patch && patch.position !== undefined) {
      this.nodeCols.column('x')[slot] = patch.position.x;
      this.nodeCols.column('y')[slot] = patch.position.y;
    }

    if ('pinned' in patch && patch.pinned !== undefined) {
      const flagsCol = this.nodeCols.column('flags');
      const prev = flagsCol[slot]!;
      flagsCol[slot] = patch.pinned ? prev | FLAG_PINNED : prev & ~FLAG_PINNED;
    }

    // Visibility rides its own flag/index/event path so a `hidden` in a data
    // feed patch behaves exactly like `setNodeHidden` (clears runtime states,
    // emits `node:visibility`). It also stays in the `node:update` patch below
    // so generic consumers / the DataSource delta see it.
    if ('hidden' in patch && patch.hidden !== undefined) {
      this.applyNodeHidden(id, patch.hidden);
    }

    this.nodeCols.touch();
    this._version++;
    this.enqueueNodeUpdate(id, patch as Partial<GraphNode>);
    this.scheduleFlushIfNeeded();
  }

  /**
   * Remove a node. Cascades by default — removes all incident edges first.
   * `cascade: false` throws if any incident edges still exist.
   */
  removeNode(id: string, opts?: { cascade?: boolean }): void {
    const cold = this.nodeMap.get(id);
    if (!cold) return;
    const slot = this.nodeCols.slot(id)!;
    const cascade = opts?.cascade ?? true;

    const outView = this.outAdj.view(slot);
    const inView = this.inAdj.view(slot);
    if (!cascade && (outView.length > 0 || inView.length > 0)) {
      throw new Error(
        `GraphStore.removeNode: "${id}" still has ${outView.length + inView.length} incident edges (pass { cascade: true })`,
      );
    }

    // Snapshot edge ids to remove since `removeEdge` mutates the adjacency views.
    const incidentEdgeIds: string[] = [];
    for (let i = 0; i < outView.length; i++) {
      const eid = this.edgeCols.idAt(outView[i]!);
      if (eid !== undefined) incidentEdgeIds.push(eid);
    }
    for (let i = 0; i < inView.length; i++) {
      const eid = this.edgeCols.idAt(inView[i]!);
      if (eid !== undefined) incidentEdgeIds.push(eid);
    }
    for (const eid of incidentEdgeIds) this.removeEdge(eid);

    // Remove from parent index + clear childrenIndex bucket if present.
    if (cold.parentId !== undefined) {
      this.childrenIndex.get(cold.parentId)?.delete(id);
    }
    // Reparent direct children of this node to `undefined` (logical orphan).
    // Cheaper than recursive removal; caller decides what to do with orphans.
    const myChildren = this.childrenIndex.get(id);
    if (myChildren) {
      for (const childId of myChildren) {
        const childCold = this.nodeMap.get(childId);
        if (childCold) childCold.parentId = undefined;
      }
      this.childrenIndex.delete(id);
    }

    // Mark tombstone in the ColumnStore but keep the slot occupied so slot
    // indices stay stable until `compact()`.
    const flagsCol = this.nodeCols.column('flags');
    flagsCol[slot] = flagsCol[slot]! | FLAG_TOMBSTONE;
    this.outAdj.clearSlot(slot);
    this.inAdj.clearSlot(slot);

    // Remove from cold storage and id→slot map (so slot is no longer
    // discoverable by id, but the ColumnStore slot is preserved).
    this.nodeMap.delete(id);
    this.nodeCols.remove(id);
    this.nodeRuntimeStates.delete(id);
    this.hiddenNodeIds.delete(id);

    this.nodeCols.touch();
    this._version++;
    this.enqueueNodeRemove(id);
    this.scheduleFlushIfNeeded();

    // If anything was waiting for this id to arrive, those edges are now
    // orphaned for this admission attempt — drop them.
    if (this.unknownEndpoint === 'buffer') {
      const wereWaiting = this.pending.takeWaitingFor(id);
      for (const e of wereWaiting) {
        if (this.pending.has(e.id)) this.pending.unpark(e.id);
        this.enqueueEdgeOrphan(e.id);
      }
    }
  }

  // ─── CRUD: edges ────────────────────────────────────────────────────────

  addEdge<D>(edge: GraphEdge<D>): void {
    if (this.edgeMap.has(edge.id)) {
      throw new Error(`GraphStore.addEdge: duplicate id "${edge.id}"`);
    }
    const srcSlot = this.nodeCols.slot(edge.source);
    const dstSlot = this.nodeCols.slot(edge.target);
    if (srcSlot === undefined || dstSlot === undefined) {
      this.handleUnknownEndpoint(edge, srcSlot === undefined, dstSlot === undefined);
      return;
    }
    this.installEdge(edge, srcSlot, dstSlot);
    this.scheduleFlushIfNeeded();
  }

  upsertEdge<D>(edge: GraphEdge<D>): void {
    if (this.edgeMap.has(edge.id)) {
      this.updateEdge(edge.id, edge as Partial<GraphEdge<D>>);
      return;
    }
    // Defer to addEdge so unknownEndpoint policy applies uniformly.
    this.addEdge(edge);
  }

  updateEdge<D>(id: string, patch: Partial<GraphEdge<D>>): void {
    const cold = this.edgeMap.get(id);
    if (!cold) return;
    const slot = this.edgeCols.slot(id)!;

    if ('source' in patch || 'target' in patch) {
      const nextSource = (patch.source ?? cold.source) as string;
      const nextTarget = (patch.target ?? cold.target) as string;
      const nextSrcSlot = this.nodeCols.slot(nextSource);
      const nextDstSlot = this.nodeCols.slot(nextTarget);
      if (nextSrcSlot === undefined || nextDstSlot === undefined) {
        throw new Error(
          `GraphStore.updateEdge: re-pointing edge "${id}" to unknown endpoint "${nextSrcSlot === undefined ? nextSource : nextTarget}"`,
        );
      }
      // Rewire adjacency: remove from old, add to new.
      const oldSrcSlot = this.nodeCols.slot(cold.source)!;
      const oldDstSlot = this.nodeCols.slot(cold.target)!;
      this.outAdj.remove(oldSrcSlot, slot);
      this.inAdj.remove(oldDstSlot, slot);
      this.outAdj.add(nextSrcSlot, slot);
      this.inAdj.add(nextDstSlot, slot);
      this.edgeCols.column('srcSlot')[slot] = nextSrcSlot;
      this.edgeCols.column('dstSlot')[slot] = nextDstSlot;
      cold.source = nextSource;
      cold.target = nextTarget;
    }

    if ('type' in patch) cold.type = patch.type;
    if ('data' in patch) cold.data = patch.data;
    if ('states' in patch) cold.states = patch.states ?? undefined;
    if ('state' in patch) cold.state = patch.state;
    if ('style' in patch) cold.style = patch.style;

    // Visibility rides its own flag/index/event path — see updateNode.
    if ('hidden' in patch && patch.hidden !== undefined) {
      this.applyEdgeHidden(id, patch.hidden);
    }

    this.edgeCols.touch();
    this._version++;
    this.enqueueEdgeUpdate(id, patch as Partial<GraphEdge>);
    this.scheduleFlushIfNeeded();
  }

  /**
   * Reverse an edge's direction — swap its `source` and `target`. No-op if the
   * edge doesn't exist. Routes through {@link updateEdge}, so adjacency indexes
   * are rewired and an `edge:update` is enqueued like any other re-pointing.
   */
  reverseEdge(id: string): void {
    const cold = this.edgeMap.get(id);
    if (!cold) return;
    this.updateEdge(id, { source: cold.target, target: cold.source });
  }

  removeEdge(id: string): void {
    const cold = this.edgeMap.get(id);
    if (!cold) return;
    const slot = this.edgeCols.slot(id)!;
    const srcSlot = this.nodeCols.slot(cold.source);
    const dstSlot = this.nodeCols.slot(cold.target);
    if (srcSlot !== undefined) this.outAdj.remove(srcSlot, slot);
    if (dstSlot !== undefined) this.inAdj.remove(dstSlot, slot);
    const flagsCol = this.edgeCols.column('flags');
    flagsCol[slot] = flagsCol[slot]! | FLAG_TOMBSTONE;
    this.edgeCols.touch();
    this.edgeMap.delete(id);
    this.edgeCols.remove(id);
    this._version++;
    this.edgeRuntimeStates.delete(id);
    this.hiddenEdgeIds.delete(id);
    this.enqueueEdgeRemove(id);
    this.scheduleFlushIfNeeded();
  }

  // ─── Interaction state (presence compartment) ───────────────────────────
  //
  // These mutate the *runtime* (presence) compartment only — hover / selected /
  // highlighted / lineage, toggled by behaviours and UI. They are kept separate
  // from the document `states[]` field (feed-owned, changed via `updateNode`);
  // see the field declarations and `store-owns-state-plan.md` § 0 / § 5. Reads
  // ({@link nodeStatesOf} / {@link hasNodeState} / {@link nodesWithState}) report
  // the **union** of both compartments — the effective active-state set the
  // renderer applies. Multi-item callers should wrap writes in {@link batch} so
  // the N toggles coalesce into a single flush (§ 2.5).

  /**
   * Add a runtime (presence) state to a node. Idempotent — re-adding an already
   * active state is a no-op (no event). No-op if the node id is unknown.
   *
   * @param id    Node id.
   * @param name  State name (e.g. `'selected'`, `'highlighted'`, `'lineage'`).
   * @param _opts Reserved for collaboration — `actor` will tag the change with
   *   its originating user once presence replication lands (§ 5). Unused today.
   */
  addNodeState(id: string, name: string, _opts?: { actor?: string }): void {
    if (!this.nodeMap.has(id)) return;
    let set = this.nodeRuntimeStates.get(id);
    if (set?.has(name)) return;
    if (!set) {
      set = new Set();
      this.nodeRuntimeStates.set(id, set);
    }
    set.add(name);
    this._version++;
    this.enqueueNodeState(id, name, _opts?.actor);
    this.scheduleFlushIfNeeded();
  }

  /**
   * Remove a runtime (presence) state from a node. No-op if the state isn't
   * currently active (no event) or the node is unknown.
   */
  removeNodeState(id: string, name: string, _opts?: { actor?: string }): void {
    const set = this.nodeRuntimeStates.get(id);
    if (!set?.has(name)) return;
    set.delete(name);
    if (set.size === 0) this.nodeRuntimeStates.delete(id);
    this._version++;
    this.enqueueNodeState(id, name, _opts?.actor);
    this.scheduleFlushIfNeeded();
  }

  /**
   * Toggle a runtime (presence) state on a node — `on ? addNodeState :
   * removeNodeState`. Convenience for callers (e.g. hover) that compute the
   * desired membership as a boolean. Default `on = true`.
   */
  setNodeState(id: string, name: string, on = true, opts?: { actor?: string }): void {
    if (on) this.addNodeState(id, name, opts);
    else this.removeNodeState(id, name, opts);
  }

  /** Toggle a runtime (presence) state on an edge. See {@link setNodeState}. */
  setEdgeState(id: string, name: string, on = true, opts?: { actor?: string }): void {
    if (on) this.addEdgeState(id, name, opts);
    else this.removeEdgeState(id, name, opts);
  }

  /**
   * Strip a runtime (presence) state from every node that carries it, in one
   * pass — e.g. clearing a transient `'selected'` / `'lineage'` set. Touches the
   * presence compartment only; a document state of the same name in `states[]`
   * is unaffected (change those via {@link updateNode}).
   */
  clearNodeState(name: string): void {
    let changed = false;
    for (const [id, set] of this.nodeRuntimeStates) {
      if (set.delete(name)) {
        changed = true;
        this.enqueueNodeState(id, name);
        if (set.size === 0) this.nodeRuntimeStates.delete(id);
      }
    }
    if (changed) {
      this._version++;
      this.scheduleFlushIfNeeded();
    }
  }

  /** Add a runtime (presence) state to an edge. See {@link addNodeState}. */
  addEdgeState(id: string, name: string, _opts?: { actor?: string }): void {
    if (!this.edgeMap.has(id)) return;
    let set = this.edgeRuntimeStates.get(id);
    if (set?.has(name)) return;
    if (!set) {
      set = new Set();
      this.edgeRuntimeStates.set(id, set);
    }
    set.add(name);
    this._version++;
    this.enqueueEdgeState(id, name, _opts?.actor);
    this.scheduleFlushIfNeeded();
  }

  /** Remove a runtime (presence) state from an edge. See {@link removeNodeState}. */
  removeEdgeState(id: string, name: string, _opts?: { actor?: string }): void {
    const set = this.edgeRuntimeStates.get(id);
    if (!set?.has(name)) return;
    set.delete(name);
    if (set.size === 0) this.edgeRuntimeStates.delete(id);
    this._version++;
    this.enqueueEdgeState(id, name, _opts?.actor);
    this.scheduleFlushIfNeeded();
  }

  /** Strip a runtime (presence) state from every edge. See {@link clearNodeState}. */
  clearEdgeState(name: string): void {
    let changed = false;
    for (const [id, set] of this.edgeRuntimeStates) {
      if (set.delete(name)) {
        changed = true;
        this.enqueueEdgeState(id, name);
        if (set.size === 0) this.edgeRuntimeStates.delete(id);
      }
    }
    if (changed) {
      this._version++;
      this.scheduleFlushIfNeeded();
    }
  }

  /**
   * Effective active states of a node — the **union** of its document `states[]`
   * (feed-owned) and its runtime presence set. This is what the renderer iterates
   * to apply state overlays. Returns a fresh array; empty if the node is unknown
   * or carries no states.
   */
  nodeStatesOf(id: string): readonly string[] {
    const doc = this.nodeMap.get(id)?.states;
    const runtime = this.nodeRuntimeStates.get(id);
    if (!runtime || runtime.size === 0) return doc ? [...doc] : [];
    if (!doc || doc.length === 0) return [...runtime];
    const out = new Set<string>(doc);
    for (const name of runtime) out.add(name);
    return [...out];
  }

  /** Effective active states of an edge — union of document + presence. */
  edgeStatesOf(id: string): readonly string[] {
    const doc = this.edgeMap.get(id)?.states;
    const runtime = this.edgeRuntimeStates.get(id);
    if (!runtime || runtime.size === 0) return doc ? [...doc] : [];
    if (!doc || doc.length === 0) return [...runtime];
    const out = new Set<string>(doc);
    for (const name of runtime) out.add(name);
    return [...out];
  }

  /** True iff `name` is in a node's effective (document ∪ presence) state set. */
  hasNodeState(id: string, name: string): boolean {
    if (this.nodeRuntimeStates.get(id)?.has(name)) return true;
    return this.nodeMap.get(id)?.states?.includes(name) ?? false;
  }

  /** True iff `name` is in an edge's effective (document ∪ presence) state set. */
  hasEdgeState(id: string, name: string): boolean {
    if (this.edgeRuntimeStates.get(id)?.has(name)) return true;
    return this.edgeMap.get(id)?.states?.includes(name) ?? false;
  }

  /**
   * Ids of every node whose effective (document ∪ presence) state set contains
   * `name`. Scans live nodes; useful for snapshots / iteration.
   */
  *nodesWithState(name: string): IterableIterator<string> {
    for (const id of this.nodeMap.keys()) {
      if (this.nodeRuntimeStates.get(id)?.has(name)) {
        yield id;
        continue;
      }
      if (this.nodeMap.get(id)?.states?.includes(name)) yield id;
    }
  }

  /** Edge sibling of {@link nodesWithState}. */
  *edgesWithState(name: string): IterableIterator<string> {
    for (const [id, cold] of this.edgeMap) {
      if (this.edgeRuntimeStates.get(id)?.has(name) || cold.states?.includes(name)) {
        yield id;
      }
    }
  }

  // ─── Bulk operations ────────────────────────────────────────────────────

  addNodesBulk(nodes: readonly GraphNode[]): void {
    this.batch(() => {
      for (const n of nodes) this.addNode(n);
    });
  }

  addEdgesBulk(edges: readonly GraphEdge[]): void {
    this.batch(() => {
      for (const e of edges) this.addEdge(e);
    });
  }

  /**
   * Append nodes + edges in one batch — non-destructive (does NOT clear).
   * Convenience for streaming feeds that push a fresh chunk of items as
   * they arrive. Subscribers see a single `flush`.
   *
   * Differs from `GraphLayer.setData`, which clears the store first.
   */
  addData(data: { nodes?: readonly GraphNode[]; edges?: readonly GraphEdge[] }): void {
    this.batch(() => {
      if (data.nodes && data.nodes.length > 0) {
        for (const n of data.nodes) this.addNode(n);
      }
      if (data.edges && data.edges.length > 0) {
        for (const e of data.edges) this.addEdge(e);
      }
    });
  }

  /**
   * Apply a streaming delta in a single batch. Order within the batch:
   * 1. `removed.edgeIds`  — removed first so node removals can't cascade
   *    them again (no-op double removal is harmless, but explicit is cleaner).
   * 2. `removed.nodeIds`  — cascade-removes incident edges per `removeNode`'s
   *    default `cascade: true`.
   * 3. `added.nodes`      — `upsertNode` (idempotent; safe to re-send).
   * 4. `added.edges`      — `upsertEdge`.
   * 5. `updated.nodes`    — partial patches via `updateNode`.
   * 6. `updated.edges`    — partial patches via `updateEdge`.
   *
   * Use `upsertNode` / `upsertEdge` for the `added` lists so a feed that
   * re-sends an existing id (common in pub-sub) merges rather than throwing.
   * If you have hard-add semantics, use `addData` instead.
   *
   * Subscribers see one `flush` regardless of how many items were touched.
   */
  applyDelta(delta: {
    added?: { nodes?: readonly GraphNode[]; edges?: readonly GraphEdge[] };
    updated?: {
      nodes?: ReadonlyArray<{ id: string; patch: Partial<GraphNode> }>;
      edges?: ReadonlyArray<{ id: string; patch: Partial<GraphEdge> }>;
    };
    removed?: { nodeIds?: readonly string[]; edgeIds?: readonly string[] };
  }): void {
    this.batch(() => {
      const removedEdgeIds = delta.removed?.edgeIds;
      if (removedEdgeIds) {
        for (const id of removedEdgeIds) {
          if (this.hasEdge(id)) this.removeEdge(id);
        }
      }
      const removedNodeIds = delta.removed?.nodeIds;
      if (removedNodeIds) {
        for (const id of removedNodeIds) {
          if (this.hasNode(id)) this.removeNode(id);
        }
      }
      const addedNodes = delta.added?.nodes;
      if (addedNodes) {
        for (const n of addedNodes) this.upsertNode(n);
      }
      const addedEdges = delta.added?.edges;
      if (addedEdges) {
        for (const e of addedEdges) this.upsertEdge(e);
      }
      const updatedNodes = delta.updated?.nodes;
      if (updatedNodes) {
        for (const u of updatedNodes) {
          if (this.hasNode(u.id)) this.updateNode(u.id, u.patch);
        }
      }
      const updatedEdges = delta.updated?.edges;
      if (updatedEdges) {
        for (const u of updatedEdges) {
          if (this.hasEdge(u.id)) this.updateEdge(u.id, u.patch);
        }
      }
    });
  }

  // ─── Reactivity ─────────────────────────────────────────────────────────

  /**
   * Coalesce all mutations inside `fn` into a single flush. Nested `batch`
   * calls flush only on the outermost exit.
   */
  batch<T>(fn: () => T): T {
    this.batchDepth++;
    try {
      return fn();
    } finally {
      this.batchDepth--;
      if (this.batchDepth === 0) {
        this.scheduleFlushIfNeeded();
        if (this.flushMode === 'sync') this.doFlush();
      }
    }
  }

  /**
   * Drain any pending events. Cancels the RAF-scheduled flush (frame mode).
   * In sync mode this still works — handy for forcing the TTL eviction sweep
   * even if no mutation has happened since the last flush.
   */
  flush(): void {
    this.flushScheduler?.cancel();
    this.doFlush();
  }

  /**
   * {@link DataSource} (D13) — subscribe to a coalesced {@link LayerFlush} delta
   * projected from this store's per-flush changes (position-only updates → `moved`).
   * Distinct from `events.on('flush', …)` (which carries aggregate counters): this
   * is what `CanvasStore` bridges onto `data:flush`. Returns an unsubscribe.
   */
  onFlush(listener: (delta: LayerFlush) => void): () => void {
    this.flushListeners.add(listener);
    return () => this.flushListeners.delete(listener);
  }

  /**
   * {@link DataSource} (D13) — set the flush trigger. The engine drives `'manual'`
   * (its single rAF loop calls {@link flush}); kernel `'frame'`/`'microtask'` both
   * map to GraphStore's frame scheduler. GraphStore's native `'sync'` is the
   * constructor default and isn't reachable through this setter.
   */
  setFlushMode(mode: FlushMode): void {
    this.flushMode = mode === 'manual' ? 'manual' : 'frame';
    if (this.flushMode === 'frame' && !this.flushScheduler) {
      this.flushScheduler = new FrameFlushScheduler(() => this.doFlush());
    }
  }

  /** Wipe all data. Cancels any pending flush. */
  clear(): void {
    this.nodeMap.clear();
    this.edgeMap.clear();
    this.nodeRuntimeStates.clear();
    this.edgeRuntimeStates.clear();
    this.hiddenNodeIds.clear();
    this.hiddenEdgeIds.clear();
    this.childrenIndex.clear();
    this.outAdj.clearAll();
    this.inAdj.clearAll();
    this.pending.clear();
    this.nodeCols.clear();
    this.edgeCols.clear();
    this.pendingNodeAdds.clear();
    this.pendingNodeUpdates.clear();
    this.pendingNodeRemoves.clear();
    this.pendingEdgeAdds.clear();
    this.pendingEdgeUpdates.clear();
    this.pendingEdgeRemoves.clear();
    this.pendingEdgeOrphans.clear();
    this.pendingNodeStates.clear();
    this.pendingEdgeStates.clear();
    this.pendingNodeVisibility.clear();
    this.pendingEdgeVisibility.clear();
    this.counters = emptyCounters();
    this.flushScheduler?.cancel();
    this._version++;
  }

  /**
   * Reclaim tombstoned slots. Invalidates any external code that cached
   * slot indices. Renderer batch buffers etc. must invalidate first.
   */
  compact(): void {
    // Snapshot hot fields keyed by id BEFORE clearing the ColumnStores —
    // position + pinned-flag live only in the hot columns, not in the cold
    // maps, so we'd lose them if we cleared first.
    const xCol = this.nodeCols.column('x');
    const yCol = this.nodeCols.column('y');
    const flagsCol = this.nodeCols.column('flags');
    const nodeSnapshot = new Map<string, { x: number; y: number; flags: number }>();
    for (const id of this.nodeMap.keys()) {
      const slot = this.nodeCols.slot(id);
      if (slot === undefined) continue;
      nodeSnapshot.set(id, {
        x: xCol[slot]!,
        y: yCol[slot]!,
        flags: flagsCol[slot]! & ~FLAG_TOMBSTONE, // strip tombstone bit on rebuild
      });
    }

    this.nodeCols.clear();
    this.edgeCols.clear();
    this.outAdj.clearAll();
    this.inAdj.clearAll();

    for (const id of this.nodeMap.keys()) {
      const snap = nodeSnapshot.get(id) ?? { x: 0, y: 0, flags: 0 };
      const slot = this.nodeCols.add(id, snap);
      this.outAdj.ensureCapacity(slot);
      this.inAdj.ensureCapacity(slot);
    }
    for (const [id, edge] of this.edgeMap) {
      const srcSlot = this.nodeCols.slot(edge.source);
      const dstSlot = this.nodeCols.slot(edge.target);
      if (srcSlot === undefined || dstSlot === undefined) continue;
      const slot = this.edgeCols.add(id, {
        srcSlot,
        dstSlot,
        flags: this.hiddenEdgeIds.has(id) ? FLAG_HIDDEN : 0,
      });
      this.outAdj.add(srcSlot, slot);
      this.inAdj.add(dstSlot, slot);
    }
    this._version++;
  }

  // ─── Internals ──────────────────────────────────────────────────────────

  private installNode(node: GraphNode): void {
    if (node.parentId !== undefined) {
      if (node.parentId === node.id) {
        throw new Error(`GraphStore: parentId cycle (self-parent) on "${node.id}"`);
      }
      // Note: cycle check vs descendants only matters on update; on add the
      // node has no descendants yet so self-parent is the only case.
    }

    const slot = this.nodeCols.add(node.id, {
      x: node.position?.x ?? 0,
      y: node.position?.y ?? 0,
      flags: (node.pinned ? FLAG_PINNED : 0) | (node.hidden ? FLAG_HIDDEN : 0),
    });
    this.outAdj.ensureCapacity(slot);
    this.inAdj.ensureCapacity(slot);
    if (node.hidden) this.hiddenNodeIds.add(node.id);

    // Cold payload stored without `position` / `pinned` — those live in columns.
    const cold: GraphNode = { id: node.id };
    if (node.data !== undefined) cold.data = node.data;
    if (node.parentId !== undefined) cold.parentId = node.parentId;
    if (node.states !== undefined) cold.states = node.states;
    if (node.state !== undefined) cold.state = node.state;
    if (node.type !== undefined) cold.type = node.type;
    if (node.style !== undefined) cold.style = node.style;
    this.nodeMap.set(node.id, cold);

    if (node.parentId !== undefined) {
      let set = this.childrenIndex.get(node.parentId);
      if (!set) {
        set = new Set();
        this.childrenIndex.set(node.parentId, set);
      }
      set.add(node.id);
    }

    this._version++;
    this.enqueueNodeAdd(node.id);

    // If anything was waiting for this id, try to admit it now.
    if (this.unknownEndpoint === 'buffer') {
      const candidates = this.pending.takeWaitingFor(node.id);
      for (const edge of candidates) this.tryAdmitPending(edge);
    }
  }

  private installEdge(edge: GraphEdge, srcSlot: number, dstSlot: number): void {
    const slot = this.edgeCols.add(edge.id, {
      srcSlot,
      dstSlot,
      flags: edge.hidden ? FLAG_HIDDEN : 0,
    });
    this.outAdj.add(srcSlot, slot);
    this.inAdj.add(dstSlot, slot);
    if (edge.hidden) this.hiddenEdgeIds.add(edge.id);

    const cold: GraphEdge = { id: edge.id, source: edge.source, target: edge.target };
    if (edge.type !== undefined) cold.type = edge.type;
    if (edge.data !== undefined) cold.data = edge.data;
    if (edge.states !== undefined) cold.states = edge.states;
    if (edge.state !== undefined) cold.state = edge.state;
    if (edge.style !== undefined) cold.style = edge.style;
    this.edgeMap.set(edge.id, cold);

    this._version++;
    this.enqueueEdgeAdd(edge.id);
  }

  private handleUnknownEndpoint(edge: GraphEdge, srcMissing: boolean, dstMissing: boolean): void {
    switch (this.unknownEndpoint) {
      case 'throw': {
        const missing = srcMissing ? edge.source : edge.target;
        throw new Error(`GraphStore.addEdge: unknown endpoint "${missing}" on edge "${edge.id}"`);
      }
      case 'drop':
        return;
      case 'buffer': {
        const missingIds: string[] = [];
        if (srcMissing) missingIds.push(edge.source);
        if (dstMissing) missingIds.push(edge.target);
        this.pending.park(edge, missingIds, this._frame);
        // Schedule a flush so the TTL sweep runs on the next flush even if no
        // other mutation happens.
        this.scheduleFlushIfNeeded();
        return;
      }
    }
  }

  private tryAdmitPending(edge: GraphEdge): void {
    const srcSlot = this.nodeCols.slot(edge.source);
    const dstSlot = this.nodeCols.slot(edge.target);
    if (srcSlot === undefined || dstSlot === undefined) {
      // Still missing the other endpoint — re-park under that id.
      const missingIds: string[] = [];
      if (srcSlot === undefined) missingIds.push(edge.source);
      if (dstSlot === undefined) missingIds.push(edge.target);
      this.pending.park(edge, missingIds, this._frame);
      return;
    }
    if (this.edgeMap.has(edge.id)) return; // already admitted via direct path
    this.installEdge(edge, srcSlot, dstSlot);
  }

  /** True iff `candidateAncestor` is already a descendant of `id`. */
  private wouldCreateCycle(id: string, candidateAncestor: string): boolean {
    for (const desc of this.descendantsOf(id)) {
      if (desc === candidateAncestor) return true;
    }
    return false;
  }

  private readPosition(id: string): Vec2 | undefined {
    const slot = this.nodeCols.slot(id);
    if (slot === undefined) return undefined;
    const x = this.nodeCols.column('x')[slot]!;
    const y = this.nodeCols.column('y')[slot]!;
    return { x, y };
  }

  // Event queue management — dedups within a flush window.

  private enqueueNodeAdd(id: string): void {
    // If the node was removed earlier in the same batch and now re-added,
    // collapse: the net effect is a single 'add' (no remove fires).
    if (this.pendingNodeRemoves.delete(id)) {
      // remove counter cancelled
      this.counters.removedNodes = Math.max(0, this.counters.removedNodes - 1);
    }
    this.pendingNodeAdds.add(id);
    this.pendingNodeUpdates.delete(id);
    this.counters.addedNodes++;
  }

  private enqueueNodeUpdate(id: string, patch: Partial<GraphNode>): void {
    if (this.pendingNodeAdds.has(id)) return; // the add carries the latest state
    if (this.pendingNodeRemoves.has(id)) return; // removed — ignore late updates
    const existing = this.pendingNodeUpdates.get(id);
    if (existing) {
      Object.assign(existing, patch);
    } else {
      this.pendingNodeUpdates.set(id, { ...patch });
      this.counters.updatedNodes++;
    }
  }

  private enqueueNodeRemove(id: string): void {
    if (this.pendingNodeAdds.delete(id)) {
      // Added and removed in the same batch — net zero. Counters retreat.
      this.counters.addedNodes = Math.max(0, this.counters.addedNodes - 1);
      this.pendingNodeUpdates.delete(id);
      return;
    }
    this.pendingNodeUpdates.delete(id);
    this.pendingNodeRemoves.add(id);
    this.counters.removedNodes++;
  }

  private enqueueEdgeAdd(id: string): void {
    if (this.pendingEdgeRemoves.delete(id)) {
      this.counters.removedEdges = Math.max(0, this.counters.removedEdges - 1);
    }
    this.pendingEdgeAdds.add(id);
    this.pendingEdgeUpdates.delete(id);
    this.counters.addedEdges++;
  }

  private enqueueEdgeUpdate(id: string, patch: Partial<GraphEdge>): void {
    if (this.pendingEdgeAdds.has(id)) return;
    if (this.pendingEdgeRemoves.has(id)) return;
    const existing = this.pendingEdgeUpdates.get(id);
    if (existing) {
      Object.assign(existing, patch);
    } else {
      this.pendingEdgeUpdates.set(id, { ...patch });
      this.counters.updatedEdges++;
    }
  }

  private enqueueEdgeRemove(id: string): void {
    if (this.pendingEdgeAdds.delete(id)) {
      this.counters.addedEdges = Math.max(0, this.counters.addedEdges - 1);
      this.pendingEdgeUpdates.delete(id);
      return;
    }
    this.pendingEdgeUpdates.delete(id);
    this.pendingEdgeRemoves.add(id);
    this.counters.removedEdges++;
  }

  private enqueueEdgeOrphan(id: string): void {
    this.pendingEdgeOrphans.add(id);
  }

  /** Queue a node runtime-state change, deduped per `(id, name)` per flush. */
  private enqueueNodeState(id: string, name: string, actor?: string): void {
    this.pendingNodeStates.set(`${id}\u0000${name}`, { id, name, actor });
  }

  /** Queue an edge runtime-state change, deduped per `(id, name)` per flush. */
  private enqueueEdgeState(id: string, name: string, actor?: string): void {
    this.pendingEdgeStates.set(`${id}\u0000${name}`, { id, name, actor });
  }

  /** Queue a node explicit-visibility change; last value per id wins per flush. */
  private enqueueNodeVisibility(id: string, hidden: boolean): void {
    this.pendingNodeVisibility.set(id, hidden);
  }

  /** Queue an edge explicit-visibility change; last value per id wins per flush. */
  private enqueueEdgeVisibility(id: string, hidden: boolean): void {
    this.pendingEdgeVisibility.set(id, hidden);
  }

  private scheduleFlushIfNeeded(): void {
    if (this.batchDepth > 0) return;
    if (this.flushMode === 'manual') return; // engine drives flush() from its rAF loop
    if (this.flushMode === 'frame') {
      this.flushScheduler?.request();
      return;
    }
    this.doFlush();
  }

  private doFlush(): void {
    this._frame++;

    // Expire stale pending edges (TTL eviction) before flushing.
    if (this.unknownEndpoint === 'buffer' && Number.isFinite(this.pendingEdgeTTL)) {
      const stale: string[] = [];
      for (const e of this.pending.expired(this._frame, this.pendingEdgeTTL)) stale.push(e.id);
      for (const eid of stale) {
        this.pending.unpark(eid);
        this.pendingEdgeOrphans.add(eid);
      }
    }

    // Snapshot then clear queues so listener-induced mutations rebuild the
    // next batch cleanly.
    const nodeAdds = this.pendingNodeAdds;
    const nodeUpdates = this.pendingNodeUpdates;
    const nodeRemoves = this.pendingNodeRemoves;
    const edgeAdds = this.pendingEdgeAdds;
    const edgeUpdates = this.pendingEdgeUpdates;
    const edgeRemoves = this.pendingEdgeRemoves;
    const edgeOrphans = this.pendingEdgeOrphans;
    const nodeStates = this.pendingNodeStates;
    const edgeStates = this.pendingEdgeStates;
    const nodeVisibility = this.pendingNodeVisibility;
    const edgeVisibility = this.pendingEdgeVisibility;
    const counters = this.counters;
    this.pendingNodeAdds = new Set();
    this.pendingNodeUpdates = new Map();
    this.pendingNodeRemoves = new Set();
    this.pendingEdgeAdds = new Set();
    this.pendingEdgeUpdates = new Map();
    this.pendingEdgeRemoves = new Set();
    this.pendingEdgeOrphans = new Set();
    this.pendingNodeStates = new Map();
    this.pendingEdgeStates = new Map();
    this.pendingNodeVisibility = new Map();
    this.pendingEdgeVisibility = new Map();
    this.counters = emptyCounters();

    if (
      nodeAdds.size === 0 &&
      nodeUpdates.size === 0 &&
      nodeRemoves.size === 0 &&
      edgeAdds.size === 0 &&
      edgeUpdates.size === 0 &&
      edgeRemoves.size === 0 &&
      edgeOrphans.size === 0 &&
      nodeStates.size === 0 &&
      edgeStates.size === 0 &&
      nodeVisibility.size === 0 &&
      edgeVisibility.size === 0
    ) {
      return;
    }

    for (const id of nodeAdds) this.events.emit('node:add', { nodeId: id });
    for (const [id, patch] of nodeUpdates) this.events.emit('node:update', { nodeId: id, patch });
    for (const id of nodeRemoves) this.events.emit('node:remove', { nodeId: id });
    for (const id of edgeAdds) this.events.emit('edge:add', { edgeId: id });
    for (const [id, patch] of edgeUpdates) this.events.emit('edge:update', { edgeId: id, patch });
    for (const id of edgeRemoves) this.events.emit('edge:remove', { edgeId: id });
    for (const id of edgeOrphans) this.events.emit('edge:orphaned', { edgeId: id });
    // Runtime-state toggles — `on` read from live membership so an add+remove in
    // the same flush window nets out correctly. Document `states[]` changes ride
    // the `node:update` above, not these.
    for (const { id, name, actor } of nodeStates.values()) {
      this.events.emit('node:state', {
        nodeId: id,
        name,
        on: this.nodeRuntimeStates.get(id)?.has(name) ?? false,
        actor,
      });
    }
    for (const { id, name, actor } of edgeStates.values()) {
      this.events.emit('edge:state', {
        edgeId: id,
        name,
        on: this.edgeRuntimeStates.get(id)?.has(name) ?? false,
        actor,
      });
    }
    // Explicit visibility toggles. Only explicit hide/show emit; endpoint-driven
    // (effective) edge hiding is derived and produces no event here.
    for (const [id, hidden] of nodeVisibility) {
      this.events.emit('node:visibility', { nodeId: id, hidden });
    }
    for (const [id, hidden] of edgeVisibility) {
      this.events.emit('edge:visibility', { edgeId: id, hidden });
    }

    // DataSource (D13) — project this flush's topology/position deltas into a
    // LayerFlush for the kernel `data:flush` bridge. Position-only node updates →
    // `moved`; everything else → `changed`. Explicit visibility changes count as
    // `changed` so the projection re-renders the element. Pure state toggles and
    // silent sim-tick position writes don't appear here.
    if (
      this.flushListeners.size > 0 &&
      (nodeAdds.size > 0 ||
        nodeUpdates.size > 0 ||
        nodeRemoves.size > 0 ||
        edgeAdds.size > 0 ||
        edgeUpdates.size > 0 ||
        edgeRemoves.size > 0 ||
        nodeVisibility.size > 0 ||
        edgeVisibility.size > 0)
    ) {
      const moved: string[] = [];
      const changedSet = new Set<string>();
      for (const [id, patch] of nodeUpdates) {
        const keys = Object.keys(patch);
        if (keys.length === 1 && keys[0] === 'position') moved.push(id);
        else changedSet.add(id);
      }
      for (const id of nodeVisibility.keys()) changedSet.add(id);
      const edgeChangedSet = new Set<string>(edgeUpdates.keys());
      for (const id of edgeVisibility.keys()) edgeChangedSet.add(id);
      const delta: LayerFlush = {
        nodes: {
          added: [...nodeAdds],
          changed: [...changedSet],
          removed: [...nodeRemoves],
          moved,
          movedAll: false,
        },
        edges: { added: [...edgeAdds], changed: [...edgeChangedSet], removed: [...edgeRemoves] },
        groups: { added: [], changed: [], removed: [] },
        annotations: { added: [], changed: [], removed: [] },
        version: this._version,
      };
      for (const l of [...this.flushListeners]) l(delta);
    }

    this.events.emit('flush', counters);
  }

}

// Slot-stability note: `ColumnStore.remove` pushes the slot onto its internal
// free-slot stack, so the next `add` will reuse it. That means GraphStore slot
// indices are stable until the next `add` after a `remove`. The tombstone
// flag bit lets external code detect a recycled slot if it cached one before
// removal. `compact()` rebuilds both ColumnStores from cold storage, which
// fully reclaims any orphaned capacity. If profiling later shows that slot
// recycling causes problems for the GraphLayer renderer, the right fix is to
// add a `disableRecycling` option to ColumnStore upstream — not to hack
// around it here.
