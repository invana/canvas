/**
 * `@invana/graph` — `GraphStore` type definitions.
 *
 * See `apps/docs/graph/data-model.md` for the user-facing description and
 * `apps/docs/graph/store-plan.md` for the implementation rationale.
 */

/** A node in the graph. `id` is unique within a `GraphStore`. */
export interface GraphNode<D = unknown> {
  /** Stable identity. Must be unique within the store. */
  id: string;
  /** Arbitrary user payload — opaque to the store. */
  data?: D;
  /** Logical parent. Cycles are rejected at write time. */
  parentId?: string;
  /** Canonical position. Owned by the store; mutated by layouts and drags. */
  position?: { x: number; y: number };
  /** True iff layouts must not move this node. */
  pinned?: boolean;
}

/** A directed edge. Multi-edges between the same pair are allowed. */
export interface GraphEdge<D = unknown> {
  /** Stable identity. Must be unique within the store. */
  id: string;
  /** Source node id. */
  source: string;
  /** Target node id. */
  target: string;
  /** Predicate / FK label / "calls" / "depends-on" — free-form. */
  type?: string;
  /** Arbitrary user payload — opaque to the store. */
  data?: D;
}

/**
 * Constructor options for `GraphStore`.
 *
 * Defaults are tuned for sync, single-process, batch-driven use. Streaming
 * feeds should set `flushMode: 'frame'` and `unknownEndpoint: 'buffer'`.
 */
export interface GraphStoreOptions {
  /**
   * `'sync'` — events fire synchronously at each mutation / on `batch` exit.
   * `'frame'` — events coalesce into a single flush per animation frame.
   * Default `'sync'`.
   */
  flushMode?: 'sync' | 'frame';

  /**
   * What to do when `addEdge` is called with an unknown source or target id.
   * - `'throw'` (default) — reject and throw.
   * - `'buffer'` — park in the pending-edge buffer; admit when the endpoint arrives.
   * - `'drop'` — silently discard.
   */
  unknownEndpoint?: 'throw' | 'buffer' | 'drop';

  /**
   * Drop a buffered edge (and emit `edge:orphaned`) if it has been pending
   * for more than this many frames. Default `Infinity` (never expire).
   * Only meaningful with `unknownEndpoint: 'buffer'`.
   */
  pendingEdgeTTL?: number;

  /**
   * Initial slot capacity for the underlying `ColumnStore`s. Larger up-front
   * capacity avoids early geometric growth on bulk inserts. Default 256.
   */
  initialCapacity?: number;
}

/**
 * Event-map shape for `GraphStore.events` (used by `EventEmitter<E>`).
 *
 * Subscribe to fine-grained `node:*` / `edge:*` events for per-entity updates,
 * or to `flush` for aggregated per-batch counts.
 */
export type GraphStoreEventMap = {
  'node:add': { nodeId: string };
  'node:update': { nodeId: string; patch: Partial<GraphNode> };
  'node:remove': { nodeId: string };
  'edge:add': { edgeId: string };
  'edge:update': { edgeId: string; patch: Partial<GraphEdge> };
  'edge:remove': { edgeId: string };
  /** Emitted when a buffered edge is dropped after exceeding `pendingEdgeTTL`. */
  'edge:orphaned': { edgeId: string };
  /** Aggregate counts per flush. Fires once per batch / RAF flush. */
  flush: {
    addedNodes: number;
    updatedNodes: number;
    removedNodes: number;
    addedEdges: number;
    updatedEdges: number;
    removedEdges: number;
  };
};

/** Direction of an adjacency / neighbor query. */
export type EdgeDirection = 'in' | 'out' | 'both';

/** Position record (used by `getPosition` / `setPosition`). */
export interface Vec2 {
  x: number;
  y: number;
}
