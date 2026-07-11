/**
 * `@invana/graph` — `GraphStore` type definitions.
 *
 * See `apps/docs/graph/data-model.md` for the user-facing description and
 * `apps/docs/graph/store-plan.md` for the implementation rationale.
 *
 * **v3 G6-aligned shape**: per-instance descriptor is flat with
 * `{ id, type, data, style, state, states, combo, children, ... }`.
 * `state` (singular) is the per-instance overlay catalogue;
 * `states` (plural) is the active-state list.
 */

/**
 * Which kind of graph element — the canonical `'node' | 'edge'` discriminator,
 * shared across the graph package instead of each behaviour rolling its own.
 */
export type GraphElementKind = 'node' | 'edge';

/** A node in the graph. `id` is unique within a `GraphStore`. */
export interface GraphNode<D = unknown> {
  /** Stable identity. Must be unique within the store. */
  id: string;
  /** Type tag — matches a `NodeOption.type` template if any. Free-form. */
  type?: string;
  /** Arbitrary user payload — opaque to the store. */
  data?: D;
  /** Logical parent. Cycles are rejected at write time. */
  parentId?: string;
  /** Canonical position. Owned by the store; mutated by layouts and drags. */
  position?: { x: number; y: number };
  /** True iff layouts must not move this node. */
  pinned?: boolean;
  /**
   * True iff this node is explicitly hidden. A hidden node is culled from the
   * render batch, hit-test, bounds/camera, layout, labels and minimap — it is
   * *not* merely alpha-0. Sibling of {@link pinned}; stored as a bit in the
   * hot `flags` column, not on the cold record. Hiding a node also makes its
   * incident edges *effectively* hidden without flagging them (see
   * `GraphStore.isEdgeVisible`). Default `false`.
   */
  hidden?: boolean;

  /**
   * Currently-active state names (plural). Each name should match a key in
   * `style.state` (per-instance overlay catalogue) or in
   * `GraphLayerOptions.node.state` (layer-level catalogue).
   *
   * The store treats this field as opaque metadata. The layer reads it on
   * insert and update to toggle visual states via `setNodeState`. On
   * update with `states` present in the patch the layer REPLACES the
   * visible state set with the new array — runtime states applied via
   * `setNodeState` (e.g. hover) are wiped. Pass an empty array (or
   * `null`) to clear.
   */
  states?: readonly string[] | null;

  /**
   * Visual + structural style for this node. Typed via
   * `import('../layer/types').NodeStyle` in consumer code; left as `unknown`
   * here to avoid a store → layer dependency cycle.
   */
  style?: unknown;

  /**
   * Per-instance overlay catalogue keyed by state name (singular `state`).
   * Each value is a `NodeStyle` patch applied when that name appears in
   * {@link states}. Typed by the consumer as
   * `Readonly<Record<string, NodeStyle>>`.
   */
  state?: unknown;
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
  /** Sibling of {@link GraphNode.states} — currently-active state names. */
  states?: readonly string[] | null;
  /**
   * True iff this edge is explicitly hidden. Sibling of {@link GraphNode.hidden}
   * (stored as a bit in the edge `flags` column). Note an edge is *effectively*
   * hidden when it is explicitly hidden **or** either endpoint is hidden — see
   * `GraphStore.isEdgeVisible`. Default `false`.
   */
  hidden?: boolean;
  /** Per-instance style. Typed by consumer as `EdgeStyle`. */
  style?: unknown;
  /** Per-instance overlay catalogue. Typed by consumer as `Record<string, EdgeStyle>`. */
  state?: unknown;
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

  /**
   * Identity for the store's event-source envelopes on the canvas tap channel
   * (telemetry). Becomes `source.id` on every `{ kind: 'store' }` event the bus
   * publishes. Default `'graph-store'`; pass the owning layer's id to
   * disambiguate multiple graphs. See `store-owns-state-plan.md` § 6.
   */
  id?: string;
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
  /**
   * A runtime (presence) state was toggled on a node — `on` reflects the
   * post-change membership of the runtime set. Fired per-toggle on flush,
   * deduped per `(id, name)` within the flush window. `actor` is reserved for
   * collaboration (the originating user); `undefined` in single-user mode.
   * Document `states[]` changes ride `node:update`, not this event.
   */
  'node:state': { nodeId: string; name: string; on: boolean; actor?: string };
  /** Edge sibling of `node:state`. */
  'edge:state': { edgeId: string; name: string; on: boolean; actor?: string };
  /**
   * A node's **explicit** hidden flag changed. `hidden` is the post-change
   * value. Fired only for explicit `hideNode`/`showNode`/`setNodeHidden`
   * changes — the incident-edge cascade emits *nothing* (consumers derive it
   * via `isEdgeVisible` and react to this event). Deduped per id within the
   * flush window; bulk ops coalesce into one flush.
   */
  'node:visibility': { nodeId: string; hidden: boolean };
  /**
   * Edge sibling of `node:visibility` — fired only when an edge's **explicit**
   * hidden flag changes, never for endpoint-driven (effective) hiding.
   */
  'edge:visibility': { edgeId: string; hidden: boolean };
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
