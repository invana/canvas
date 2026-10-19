import { DataSource, SourceEmitter, CanvasEventBus, OperationLog, Delta, DeltaOptions, LayerFlush, FlushMode, ShapeLabelPlacement, Point, CompositeRootSpec, CompositePart, TogglePlacement, InsetAnchor, RingDecorationStyle, GlowDecorationStyle, PulseRingDecorationStyle, MarchingAntsDecorationStyle, LiquidFillDecorationStyle, ToggleDecorationStyle, ResizeHandleDecorationStyle, SelectionFrameDecorationStyle, ConnectorLabelPlacement, ConnectorLabelStyle, RingConnectorDecorationStyle, GlowConnectorDecorationStyle, MarchingAntsConnectorDecorationStyle, RippleConnectorDecorationStyle, FlyMarkerConnectorDecorationStyle, FlowParticlesConnectorDecorationStyle, RevealConnectorDecorationStyle, ShapeFill, ShapeLabelStyle, WorldLayer, WorldLayerHit, IElementRenderer, LayerOptions, SurfaceOptions, CanvasContext, Rect, ScreenLayer, ScreenLayerHit, EventEmitter, EngineCommandMap, CanvasCommand, Canvas, CommandRegistry, CanvasOptions, Layer, Behaviour, Layout, CanvasConfig, LayoutOptions, EasingName, LayoutRunOptions, BehaviourOptions, ElementScaleLODBehaviour, ElementScaleLODBehaviourOptions, NumberOrGetter } from '@invana/canvas';
export { CompositePart, CompositeRootSpec } from '@invana/canvas';

/**
 * `@invana/graph` — the ops a graph store records into the canvas's operation
 * log (`canvas.history`).
 *
 * Each recorded change is an ordered list of {@link HistoryOp}s applied to the
 * {@link GraphStore}, each carrying enough state to be inverted. Inverses are
 * captured *before* the mutation runs (read-before-write), which is the only way
 * to reconstruct a deleted node/edge — the store's `node:remove` / `edge:remove`
 * events fire *after* the data is already gone.
 *
 * Since the operation log landed (RFC
 * `feat-2026-09-28-an-analysis-cannot-be-recorded-or-replayed`, F5) the store
 * itself records every content write — `applyDelta` and the writers that wrap
 * it — as these ops, into the canvas's one log. Position writes
 * (`setPosition` / `setPositionsBulk`), runtime states and `store.internal.*`
 * are derived and never recorded.
 */

/**
 * A single invertible store mutation. `removeNode` carries the cascade-removed
 * incident `edges` so undo can restore them alongside the node, and the
 * `orphanedChildIds` whose `parentId` the store cleared when the node went
 * (removing a group unlinks its surviving members), so undo re-links them. `update*` ops
 * carry both `before` (for undo) and `after` (for redo) partial states.
 */
type HistoryOp = {
    kind: 'addNode';
    node: GraphNode;
}
/** Consecutive adds within one batch, collected (the bulk-load path). Inverse removes them, last first. */
 | {
    kind: 'addNodes';
    nodes: GraphNode[];
} | {
    kind: 'addEdges';
    edges: GraphEdge[];
} | {
    kind: 'removeNode';
    node: GraphNode;
    edges: GraphEdge[];
    orphanedChildIds?: string[];
} | {
    kind: 'updateNode';
    id: string;
    before: Partial<GraphNode>;
    after: Partial<GraphNode>;
} | {
    kind: 'moveNode';
    id: string;
    before: Vec2$1;
    after: Vec2$1;
} | {
    kind: 'addEdge';
    edge: GraphEdge;
} | {
    kind: 'removeEdge';
    edge: GraphEdge;
} | {
    kind: 'updateEdge';
    id: string;
    before: Partial<GraphEdge>;
    after: Partial<GraphEdge>;
}
/** Explicit hide / show of `ids` (only the ids whose flag actually changed). Inverse flips `hidden`. */
 | {
    kind: 'setHidden';
    element: 'node' | 'edge';
    ids: string[];
    hidden: boolean;
}
/** A whole-store wipe (`GraphStore.clear`), carrying what it removed. Inverse re-adds it. */
 | {
    kind: 'clear';
    nodes: GraphNode[];
    edges: GraphEdge[];
};

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
type GraphElementKind = 'node' | 'edge';
/**
 * The `type` assigned to a record inserted without one.
 *
 * `GraphNode.type` and `GraphEdge.type` are **required**, so every reader sees a
 * `string` without a guard. This is the value to use for a record that genuinely
 * has no kind. `GraphStore` also defaults to it on insert and update, as a
 * runtime net for the paths that bypass the compiler — `importData` of an older
 * snapshot, JSON parsed at runtime, and `Partial` patches.
 *
 * A named export rather than a bare literal so consumers can branch on it
 * (`node.type === UNKNOWN_TYPE`) without a magic string.
 *
 * ⚠️ **Reserved.** `ColorByBehaviour` treats it as `fallbackColor` rather than a
 * palette category, so a record deliberately typed `'unknown'` renders grey. If
 * you need a real category, pick a different name.
 */
declare const UNKNOWN_TYPE = "unknown";
/** A node in the graph. `id` is unique within a `GraphStore`. */
interface GraphNode<D = unknown> {
    /** Stable identity. Must be unique within the store. */
    id: string;
    /**
     * Type tag — matches a `NodeOption.type` template if any. Free-form.
     *
     * **Required.** Every record carries one; where a graph has no meaningful
     * kinds, use {@link UNKNOWN_TYPE}.
     */
    type: string;
    /** Arbitrary user payload — opaque to the store. */
    data?: D;
    /** Logical parent. Cycles are rejected at write time. */
    parentId?: string;
    /** Canonical position. Owned by the store; mutated by layouts and drags. */
    position?: {
        x: number;
        y: number;
    };
    /**
     * Cached **local render bounds** (`width` × `height`), written by the
     * `GraphLayer` after each render via `GraphStore.setNodeBoundingBox`. Derived
     * — *not* user input; it's the size the shape's `boundsOf` reported, so
     * layouts (ELK collide/sizing, force radii) can read a node's footprint
     * without recomputing its shape spec (which, for a composite card, means
     * rebuilding every part). `undefined` until the node has rendered once.
     */
    boundingBox?: {
        width: number;
        height: number;
    };
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
interface GraphEdge<D = unknown> {
    /** Stable identity. Must be unique within the store. */
    id: string;
    /** Source node id. */
    source: string;
    /** Target node id. */
    target: string;
    /**
     * Predicate / FK label / "calls" / "depends-on" — free-form.
     *
     * **Required.** Every record carries one; where a graph has no meaningful
     * predicates, use {@link UNKNOWN_TYPE}.
     */
    type: string;
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
interface GraphStoreOptions {
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
type GraphStoreEventMap = {
    'node:add': {
        nodeId: string;
    };
    'node:update': {
        nodeId: string;
        patch: Partial<GraphNode>;
    };
    'node:remove': {
        nodeId: string;
    };
    'edge:add': {
        edgeId: string;
    };
    'edge:update': {
        edgeId: string;
        patch: Partial<GraphEdge>;
    };
    'edge:remove': {
        edgeId: string;
    };
    /** Emitted when a buffered edge is dropped after exceeding `pendingEdgeTTL`. */
    'edge:orphaned': {
        edgeId: string;
    };
    /**
     * The **authoritative** schema was set/cleared via `setSchema` (e.g. a Neo4j
     * adapter declaring the full DB schema). `authoritative` is whether one is now
     * set. The payload intentionally omits the schema value (kept out of this map
     * to avoid a type cycle); read it from `store.schema`.
     */
    schema: {
        authoritative: boolean;
    };
    /**
     * A runtime (presence) state was toggled on a node — `on` reflects the
     * post-change membership of the runtime set. Fired per-toggle on flush,
     * deduped per `(id, name)` within the flush window. `actor` is reserved for
     * collaboration (the originating user); `undefined` in single-user mode.
     * Document `states[]` changes ride `node:update`, not this event.
     */
    'node:state': {
        nodeId: string;
        name: string;
        on: boolean;
        actor?: string;
    };
    /** Edge sibling of `node:state`. */
    'edge:state': {
        edgeId: string;
        name: string;
        on: boolean;
        actor?: string;
    };
    /**
     * A node's **explicit** hidden flag changed. `hidden` is the post-change
     * value. Fired only for explicit `hideNode`/`showNode`/`setNodeHidden`
     * changes — the incident-edge cascade emits *nothing* (consumers derive it
     * via `isEdgeVisible` and react to this event). Deduped per id within the
     * flush window; bulk ops coalesce into one flush.
     */
    'node:visibility': {
        nodeId: string;
        hidden: boolean;
    };
    /**
     * Edge sibling of `node:visibility` — fired only when an edge's **explicit**
     * hidden flag changes, never for endpoint-driven (effective) hiding.
     */
    'edge:visibility': {
        edgeId: string;
        hidden: boolean;
    };
    /** Aggregate counts per flush. Fires once per batch / RAF flush. */
    flush: {
        addedNodes: number;
        updatedNodes: number;
        removedNodes: number;
        addedEdges: number;
        updatedEdges: number;
        removedEdges: number;
        /**
         * Nodes whose **explicit** hidden flag was set / cleared in this flush
         * (`hideNodes` / `showNodes` / a delta's `hidden` / `shown`). Visibility
         * derived from a collapsed ancestor or pending placement is not counted.
         */
        hiddenNodes: number;
        shownNodes: number;
    };
};
/** Direction of an adjacency / neighbor query. */
type EdgeDirection = 'in' | 'out' | 'both';
/** Position record (used by `getPosition` / `setPosition`). */
interface Vec2$1 {
    x: number;
    y: number;
}

/** One property observed on a node type — a key and its value type. */
interface SchemaProperty {
    /** The `data` key. */
    name: string;
    /** Value-type token — `string` / `number` / `boolean` / `object` / `array` / `null` / `mixed`. */
    type: string;
}
/** A distinct node type (label) and what's known about its instances. */
interface SchemaNodeType {
    /** The type name. */
    name: string;
    /** How many nodes of this type are known (0 for an authoritative type not yet loaded). */
    count: number;
    /** Properties (key + value type), sorted by name. */
    properties: SchemaProperty[];
}
/** One node-type → node-type pairing for an edge type. */
interface SchemaEdgeConnection {
    /** Source node-type name. */
    from: string;
    /** Target node-type name. */
    to: string;
    /** How many edges of the owning type ran between this exact pair. */
    count: number;
}
/** A distinct edge type (predicate / relationship label) and the pairs it connects. */
interface SchemaEdgeType {
    /** The type name. */
    name: string;
    /** How many edges of this type are known. */
    count: number;
    /** The distinct `from → to` node-type pairs this edge type connects. */
    connections: SchemaEdgeConnection[];
}
/**
 * The schema of a graph — its metagraph. Either **observed** (derived from loaded
 * data via {@link deriveSchema}) or **authoritative** (declared by a data source
 * and stored on the graph via `GraphStore.setSchema`).
 */
interface GraphSchema {
    /** Node types, sorted by descending count then name. */
    nodeTypes: SchemaNodeType[];
    /** Edge types, sorted by descending count then name. */
    edgeTypes: SchemaEdgeType[];
}
/** Type accessors — override to pick a different "type" field per element. */
interface DeriveSchemaOptions {
    /**
     * How to read a node's type/label. Default reads `node.type`, then
     * `node.data.type` / `.label` / `.kind` / `.group` / `.category`, then `'node'`.
     */
    nodeTypeOf?: (node: GraphNode) => string;
    /**
     * How to read an edge's type/label. Default reads `edge.type`, then
     * `edge.data.type` / `.label` / `.kind`, then `'edge'`.
     */
    edgeTypeOf?: (edge: GraphEdge) => string;
}

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

declare class GraphStore implements DataSource {
    private flushMode;
    private readonly unknownEndpoint;
    private readonly pendingEdgeTTL;
    private readonly nodeCols;
    private readonly edgeCols;
    private readonly nodeMap;
    /**
     * Derived visibility inputs behind {@link isNodeVisible}, pushed in by the
     * owning layer (see that method for why they cannot be computed here).
     * Neither is authored data, so neither is serialised.
     */
    private collapseHidden;
    private _placementPending;
    private readonly edgeMap;
    private readonly childrenIndex;
    private readonly nodeRuntimeStates;
    private readonly edgeRuntimeStates;
    private readonly hiddenNodeIds;
    private readonly hiddenEdgeIds;
    private readonly outAdj;
    private readonly inAdj;
    private readonly pending;
    /**
     * Public event bus. Subscribe via `store.events.on('node:add', ...)`.
     *
     * A `SourceEmitter` (`{ kind: 'store' }`): once the owning layer calls
     * {@link bindBus} on mount, every emit also publishes a `CanvasEvent` envelope
     * to the canvas tap channel, so telemetry sees all store mutations
     * (`store-owns-state-plan.md` § 6).
     */
    readonly events: SourceEmitter<GraphStoreEventMap>;
    /** Authoritative schema declared by a data source (Neo4j, …); see {@link setSchema}. */
    private _schema?;
    /** Per-flush counters. Reset on `flush()`. */
    private counters;
    /** Pending dedup-ed event payloads to fire on the next flush. */
    private pendingNodeAdds;
    private pendingNodeUpdates;
    private pendingNodeRemoves;
    private pendingEdgeAdds;
    private pendingEdgeUpdates;
    private pendingEdgeRemoves;
    private pendingEdgeOrphans;
    /**
     * Pending runtime-state toggles, keyed by `"<id>\u0000<name>"` so repeated
     * toggles of the same (id, name) within a flush window collapse to one event.
     * The emitted `on` is read from live set membership at flush time, so an
     * add+remove in the same frame nets out correctly.
     */
    private pendingNodeStates;
    private pendingEdgeStates;
    /**
     * Pending **explicit** visibility changes, keyed by id → latest hidden value.
     * Coalesced per flush (hide-then-show in one batch nets to the final value)
     * and emitted as `node:visibility` / `edge:visibility`. Endpoint-driven
     * (effective) edge hiding produces no entry here.
     */
    private pendingNodeVisibility;
    private pendingEdgeVisibility;
    /** Depth of nested `batch()` calls. Flushes only on outermost exit. */
    private batchDepth;
    private flushScheduler;
    /** {@link DataSource} flush listeners — fed a {@link LayerFlush} delta projection (D13). */
    private readonly flushListeners;
    /** Monotonic version counter. Bumps on every mutation including silent. */
    private _version;
    /**
     * Monotonic flush counter. Bumps on every `doFlush` regardless of which
     * code path triggered the flush. Used by `PendingEdges` TTL accounting.
     */
    private _frame;
    /** Id this store's events and (by default) its log source carry. */
    private readonly storeId;
    /** The log recorded writes go to; `undefined` ⇒ nothing is recorded. */
    private log;
    /** This store's source id on {@link log}. */
    private logSourceId;
    /** Unregisters this store as a replay source on {@link log}. */
    private unregisterSource;
    private readonly logListeners;
    /**
     * Depth of unrecorded sections — `store.internal.*`, a replay, and the inner
     * steps of a composite write (a cascading remove records one op, not one per
     * edge).
     */
    private unrecordedDepth;
    /** Ops recorded inside the current outermost {@link batch}; one entry on exit. */
    private recordBuffer;
    /** The actor the first write of the current outermost batch named, if any. */
    private recordActor;
    /** Whether the current write is streamed (`applyDelta(…, { coalesce: true })`) — merged into the actor's open entry. */
    private recordCoalesce;
    constructor(opts?: GraphStoreOptions);
    /**
     * Attach (or detach with `undefined`) the canvas event bus this store's
     * events forward to. Called by the owning `GraphLayer` on mount/unmount so
     * store mutations reach the telemetry tap channel (§ 6). Local
     * `store.events.on(...)` subscribers work with or without a bus.
     */
    bindBus(bus: CanvasEventBus | undefined): void;
    /**
     * Record this store's content writes into `log` (the canvas's operation log),
     * and register it there as the replay source `sourceId`. Replaces any log
     * attached before; `undefined` detaches. `GraphLayer` calls this on mount with
     * the canvas's log and its own id. Returns the detach.
     */
    attachLog(log: OperationLog | undefined, sourceId?: string): () => void;
    /** The log this store records into, or `undefined` when none is attached. */
    get operationLog(): OperationLog | undefined;
    /** Hear {@link attachLog} (a new log, or `undefined` on detach). Returns the unsubscribe. */
    onLogAttached(listener: (log: OperationLog | undefined) => void): () => void;
    /**
     * Journal ops that were **already applied** as one entry — the escape hatch
     * for a gesture that writes unrecorded frames and settles once (a node drag
     * records one `moveNode` per node on release). No-op with no log attached.
     */
    recordApplied(ops: readonly HistoryOp[], meta?: {
        title?: string;
        actor?: string;
    }): void;
    /**
     * **Derived writes — never recorded.** For behaviours and layouts that write
     * presentation computed from content (a fade, a badge, a routed waypoint, a
     * collapse or LOD hide): the same effect on screen as the public writer, but
     * no history entry, so undo never fights the behaviour that recomputes it.
     * `run(fn)` makes every write inside `fn` unrecorded.
     */
    readonly internal: {
        /** Run `fn` with recording off; returns its result. */
        run: <T>(fn: () => T) => T;
        applyDelta: (delta: Delta<GraphNode, GraphEdge>) => void;
        updateNode: <D>(id: string, patch: Partial<GraphNode<D>>) => void;
        updateEdge: <D>(id: string, patch: Partial<GraphEdge<D>>) => void;
        hideNodes: (ids: Iterable<string>) => void;
        showNodes: (ids: Iterable<string>) => void;
        hideEdges: (ids: Iterable<string>) => void;
        showEdges: (ids: Iterable<string>) => void;
        setPosition: (id: string, pos: Vec2$1, opts?: {
            silent?: boolean;
        }) => void;
        setPositionsBulk: (ids: readonly string[], xy: Float32Array, opts?: {
            silent?: boolean;
        }) => void;
        setNodeState: (id: string, name: string, on?: boolean) => void;
        setEdgeState: (id: string, name: string, on?: boolean) => void;
    };
    /**
     * Whether a write right now should be captured and recorded. Hot path — one
     * check per write — so it doesn't ask the log whether it is replaying: this
     * store's own replay runs unrecorded, and the log drops anything else written
     * while it replays.
     */
    private get recording();
    private unrecorded;
    /** Record `op` — buffered inside a batch, else its own entry. Call only when {@link recording}. */
    private record;
    /**
     * Record an add. Inside a batch, consecutive adds of one kind collect into a
     * single `addNodes` / `addEdges` op instead of one op object per record — the
     * bulk-load hot path (V10). The record is held by reference, not cloned: the
     * store copies it on insert, so the caller's object is not the store's.
     */
    private recordAdd;
    /** Consume the current write's actor (and its streamed flag, which travels with it). */
    private takeRecordActor;
    /** Commit the outermost batch's buffered ops as one data part. */
    private commitRecording;
    /** Snapshot the patched fields' prior values for a node. */
    private captureNodeBefore;
    private captureEdgeBefore;
    /** Cloned incident edges (both directions), deduped — self-loops appear once. */
    private incidentEdges;
    /** {@link DataOpAdapter.applyOps} — replay recorded ops, unrecorded, as one flush. */
    private replayOps;
    private applyForward;
    private applyInverse;
    /**
     * Restore `parentId` on the children a `removeNode` unlinked. Inverses run in
     * reverse, so by the time a group is re-added its members (removed after it)
     * are already back — parentless. Children that are gone, or that picked up
     * another parent since, are left alone.
     */
    private relinkChildren;
    /** Re-add edges whose both endpoints exist; skip duplicates and danglers. */
    private readdEdges;
    /** Monotonic counter. Bumps on every mutation including silent position writes. */
    get version(): number;
    /**
     * The **authoritative** schema declared for this graph (e.g. the full Neo4j DB
     * schema behind a connected canvas), or `undefined` when none is set. It is
     * typically a *superset* of what's loaded — for the schema of the *loaded* data
     * use `deriveSchema(store)`. The common resolution is `store.schema ??
     * deriveSchema(store)` (authoritative wins).
     */
    get schema(): GraphSchema | undefined;
    /**
     * Set (or clear with `undefined`) the authoritative schema. Called by a data
     * source that *knows* its schema independent of loaded records — a Neo4j /
     * GraphQL / ontology adapter. Emits `'schema'` so reactive consumers re-read.
     */
    setSchema(schema: GraphSchema | undefined): void;
    /** Number of live (non-tombstoned) nodes. */
    nodeCount(): number;
    /** Number of live (non-tombstoned) edges. */
    edgeCount(): number;
    hasNode(id: string): boolean;
    hasEdge(id: string): boolean;
    getNode<D = unknown>(id: string): GraphNode<D> | undefined;
    getEdge<D = unknown>(id: string): GraphEdge<D> | undefined;
    /**
     * Write a node's cached {@link GraphNode.boundingBox} — the local render size
     * the `GraphLayer` computed after drawing it. **Silent**: this is a derived
     * cache, not a data mutation, so it emits no change / flush event and does not
     * bump {@link version} (avoids a render feedback loop). Unknown ids are a
     * no-op. Surfaced by {@link getNode} / {@link nodes} so layouts can read a
     * node's footprint without recomputing its shape spec.
     */
    setNodeBoundingBox(id: string, box: {
        width: number;
        height: number;
    } | undefined): void;
    nodes(): IterableIterator<GraphNode>;
    edges(): IterableIterator<GraphEdge>;
    outDegree(nodeId: string): number;
    inDegree(nodeId: string): number;
    /**
     * Yield edges incident to `nodeId` in the requested direction.
     * `'out'` — edges where `nodeId` is the source.
     * `'in'`  — edges where `nodeId` is the target.
     * `'both'` — out then in.
     */
    edgesOf(nodeId: string, dir?: EdgeDirection): IterableIterator<GraphEdge>;
    /** Yield neighbor node ids in the requested direction. */
    neighborsOf(nodeId: string, dir?: EdgeDirection): IterableIterator<string>;
    parentOf(id: string): string | undefined;
    childrenOf(parentId: string): IterableIterator<string>;
    descendantsOf(id: string): IterableIterator<string>;
    ancestorsOf(id: string): IterableIterator<string>;
    getPosition(id: string): Vec2$1 | undefined;
    /**
     * Whether `id` has ever been given a position — by the record it was inserted
     * with, by a layout, or by a drag.
     *
     * `getPosition` answers `(0, 0)` for a node nobody has placed, because that is
     * what the column holds; this is how a caller tells that apart from a node
     * genuinely sitting at the origin. Ask it before treating a node's current
     * position as meaningful — a transition's start point, a "restore my view"
     * check, an incremental layout's seed.
     */
    hasPosition(id: string): boolean;
    /**
     * Ids of the **visible** nodes ({@link isNodeVisible}) whose stored position
     * lies within `r` of `(cx, cy)` — a radius query over the `x`/`y` columns.
     *
     * O(N) typed-array reads with no per-node allocation, so a pointer-driven
     * caller (a fisheye lens) can ask every frame; only candidates inside the
     * radius pay the visibility check. Answers from **logical** positions —
     * whatever a renderer draws on top (a display override) never feeds back.
     *
     * @param out Optional array to fill (cleared first) instead of allocating.
     */
    nodeIdsWithin(cx: number, cy: number, r: number, out?: string[]): string[];
    /**
     * Set a single node's position.
     *
     * Default fires `node:update`. `opts.silent: true` skips the event and just
     * bumps `version` — use for layout sim ticks at 60fps.
     */
    setPosition(id: string, pos: Vec2$1, opts?: {
        silent?: boolean;
    }): void;
    /**
     * Set many positions in a single tight loop.
     *
     * `xy` is packed `[x0, y0, x1, y1, ...]` (length must equal `ids.length * 2`).
     * `opts.silent: true` skips events — sim-tick fastpath. Otherwise emits one
     * deduped `node:update` per id.
     */
    setPositionsBulk(ids: readonly string[], xy: Float32Array, opts?: {
        silent?: boolean;
    }): void;
    setPinned(id: string, pinned: boolean): void;
    isPinned(id: string): boolean;
    pinnedIds(): IterableIterator<string>;
    /** Hide a node. Idempotent; usable inside a caller's `batch()`. */
    hideNode(id: string): void;
    /** Show a node (clear its explicit hidden flag). Idempotent. */
    showNode(id: string): void;
    /** Set a node's explicit hidden flag. Idempotent. */
    setNodeHidden(id: string, hidden: boolean): void;
    /** Flip a node's explicit hidden flag. Returns the resulting hidden state. */
    toggleNodeHidden(id: string): boolean;
    /** True iff the node's **explicit** hidden flag is set (O(1)). */
    isNodeHidden(id: string): boolean;
    /**
     * **Effective visibility of a node — the single source of truth.**
     *
     * Every consumer that draws, hit-tests, measures or selects nodes asks this
     * one question, so the canvas, the minimap, the legend and the selection
     * behaviours cannot disagree about what the user can see. Three terms:
     *
     * 1. **live** — the node exists;
     * 2. **not explicitly hidden** — {@link isNodeHidden}, the authored flag;
     * 3. **not withheld** — hidden under a collapsed ancestor
     *    ({@link isCollapseHidden}), or not yet placed while a layout owns
     *    placement ({@link placementPending}).
     *
     * Terms 3's inputs are *derived*, pushed in by the owning layer rather than
     * computed here: whether a node is a group frame comes from the layer's style
     * resolution (which merges the layer template this store never sees), and
     * whether a layout is mid-solve is canvas state. The store owns the **rule**;
     * the layer supplies the **facts**. Neither derived input is serialised —
     * collapse already round-trips as the `collapsed` node state, and placement
     * as the position itself.
     *
     * **Read this, never `node.hidden`.** The raw flag is only term 2; reading it
     * directly silently opts out of the other two. The two exceptions are
     * deliberate and documented at their call sites: `isEdgeVisible` (collapse
     * *re-routes* edges rather than hiding them) and a layout's own
     * which-nodes-to-place filter (which must see nodes that are withheld
     * *because* they are unplaced).
     */
    isNodeVisible(id: string): boolean;
    /**
     * True while a layout owns placement and this node has never been placed —
     * its stored `(0, 0)` is the zero-filled default, not a position anyone
     * chose. Shared by {@link isNodeVisible} and {@link isEdgeVisible}.
     */
    private isPlacementWithheld;
    /**
     * Ids the owning layer has derived as hidden beneath a **collapsed
     * ancestor**. Replaced wholesale on every collapse flip — it is a derived
     * projection of the `collapsed` state plus the layer's group resolution, not
     * authored data, so it is never serialised and never merged.
     *
     * Fires `node:visibility` for the symmetric difference, so a consumer that
     * caches visibility learns it changed (the explicit-flag path already emits
     * that event, and collapse must not be quieter than it).
     */
    setCollapseHidden(ids: Iterable<string>): void;
    /** True iff the node is withheld because an ancestor group is collapsed. */
    isCollapseHidden(id: string): boolean;
    /**
     * Whether a layout currently owns placement and has not yet reported a run.
     *
     * While true, a node that has never been placed ({@link hasPosition}) is not
     * visible: its stored position is the zero-filled default, not a position
     * anyone chose, and drawing it puts every unplaced node on top of every other
     * at the origin. Set by the owning layer, which is what sees `layout:run:*`.
     */
    get placementPending(): boolean;
    /** Set {@link placementPending}. Fires `node:visibility` for affected nodes. */
    setPlacementPending(pending: boolean): void;
    /** Hide many nodes in one batch → one flush. */
    hideNodes(ids: Iterable<string>): void;
    /** Show many nodes in one batch → one flush. */
    showNodes(ids: Iterable<string>): void;
    /** Set the hidden flag on many nodes in one batch → one flush. */
    setNodesHidden(ids: Iterable<string>, hidden: boolean): void;
    /** Ids of every explicitly-hidden node (O(1)-tracked, no scan). */
    hiddenNodes(): IterableIterator<string>;
    /** Count of explicitly-hidden nodes (O(1)). */
    hiddenNodeCount(): number;
    /** Hide an edge. Idempotent; usable inside a caller's `batch()`. */
    hideEdge(id: string): void;
    /** Show an edge (clear its explicit hidden flag). Idempotent. */
    showEdge(id: string): void;
    /** Set an edge's explicit hidden flag. Idempotent. */
    setEdgeHidden(id: string, hidden: boolean): void;
    /** Flip an edge's explicit hidden flag. Returns the resulting hidden state. */
    toggleEdgeHidden(id: string): boolean;
    /** True iff the edge's **explicit** hidden flag is set (O(1)). */
    isEdgeHidden(id: string): boolean;
    /**
     * Effective visibility of an edge — live, not explicitly hidden, and with
     * **both endpoints visible**. This is the derived rule the renderer/hit-test
     * consult; hiding a node makes its incident edges return `false` here without
     * flagging them.
     */
    isEdgeVisible(id: string): boolean;
    /** Hide many edges in one batch → one flush. */
    hideEdges(ids: Iterable<string>): void;
    /** Show many edges in one batch → one flush. */
    showEdges(ids: Iterable<string>): void;
    /** Set the hidden flag on many edges in one batch → one flush. */
    setEdgesHidden(ids: Iterable<string>, hidden: boolean): void;
    /** Ids of every explicitly-hidden edge (O(1)-tracked, no scan). */
    hiddenEdges(): IterableIterator<string>;
    /** Count of explicitly-hidden edges (O(1)). */
    hiddenEdgeCount(): number;
    /** Clear every explicit hidden flag (nodes + edges) in one batch → one flush. */
    showAllHidden(): void;
    /** Hide every node for which `fn` returns true, in one batch → one flush. */
    hideNodesByPredicate(fn: (node: GraphNode) => boolean): void;
    /**
     * Flip a node's `FLAG_HIDDEN` bit + index, clear its runtime states on hide,
     * bump `version`, and enqueue a `node:visibility` event. Returns whether the
     * flag actually changed. Shared by the public setters and `updateNode`.
     */
    private applyNodeHidden;
    /** Edge sibling of {@link applyNodeHidden}. */
    private applyEdgeHidden;
    /**
     * Drop every runtime (presence) state on a node — used when hiding so a
     * re-shown element returns clean (no stale hover/selection/highlight). Emits
     * `node:state` off events for each cleared name. Does not touch document
     * `states[]`.
     */
    private clearNodeRuntimeStatesOf;
    /** Edge sibling of {@link clearNodeRuntimeStatesOf}. */
    private clearEdgeRuntimeStatesOf;
    /** Strict add — throws on duplicate. */
    addNode<D>(node: GraphNode<D>): void;
    /** Add-or-merge. Streaming-friendly path. */
    upsertNode<D>(node: GraphNode<D>): void;
    updateNode<D>(id: string, patch: Partial<GraphNode<D>>): void;
    /**
     * Remove a node. Cascades by default — removes all incident edges first.
     * `cascade: false` throws if any incident edges still exist.
     */
    removeNode(id: string, opts?: {
        cascade?: boolean;
    }): void;
    addEdge<D>(edge: GraphEdge<D>): void;
    upsertEdge<D>(edge: GraphEdge<D>): void;
    updateEdge<D>(id: string, patch: Partial<GraphEdge<D>>): void;
    /**
     * Reverse an edge's direction — swap its `source` and `target`. No-op if the
     * edge doesn't exist. Routes through {@link updateEdge}, so adjacency indexes
     * are rewired and an `edge:update` is enqueued like any other re-pointing.
     */
    reverseEdge(id: string): void;
    removeEdge(id: string): void;
    /**
     * Add a runtime (presence) state to a node. Idempotent — re-adding an already
     * active state is a no-op (no event). No-op if the node id is unknown.
     *
     * @param id    Node id.
     * @param name  State name (e.g. `'selected'`, `'highlighted'`, `'lineage'`).
     * @param _opts Reserved for collaboration — `actor` will tag the change with
     *   its originating user once presence replication lands (§ 5). Unused today.
     */
    addNodeState(id: string, name: string, _opts?: {
        actor?: string;
    }): void;
    /**
     * Remove a runtime (presence) state from a node. No-op if the state isn't
     * currently active (no event) or the node is unknown.
     */
    removeNodeState(id: string, name: string, _opts?: {
        actor?: string;
    }): void;
    /**
     * Toggle a runtime (presence) state on a node — `on ? addNodeState :
     * removeNodeState`. Convenience for callers (e.g. hover) that compute the
     * desired membership as a boolean. Default `on = true`.
     */
    setNodeState(id: string, name: string, on?: boolean, opts?: {
        actor?: string;
    }): void;
    /** Toggle a runtime (presence) state on an edge. See {@link setNodeState}. */
    setEdgeState(id: string, name: string, on?: boolean, opts?: {
        actor?: string;
    }): void;
    /**
     * Strip a runtime (presence) state from every node that carries it, in one
     * pass — e.g. clearing a transient `'selected'` / `'lineage'` set. Touches the
     * presence compartment only; a document state of the same name in `states[]`
     * is unaffected (change those via {@link updateNode}).
     */
    clearNodeState(name: string): void;
    /** Add a runtime (presence) state to an edge. See {@link addNodeState}. */
    addEdgeState(id: string, name: string, _opts?: {
        actor?: string;
    }): void;
    /** Remove a runtime (presence) state from an edge. See {@link removeNodeState}. */
    removeEdgeState(id: string, name: string, _opts?: {
        actor?: string;
    }): void;
    /** Strip a runtime (presence) state from every edge. See {@link clearNodeState}. */
    clearEdgeState(name: string): void;
    /**
     * Effective active states of a node — the **union** of its document `states[]`
     * (feed-owned) and its runtime presence set. This is what the renderer iterates
     * to apply state overlays. Returns a fresh array; empty if the node is unknown
     * or carries no states.
     */
    nodeStatesOf(id: string): readonly string[];
    /** Effective active states of an edge — union of document + presence. */
    edgeStatesOf(id: string): readonly string[];
    /** True iff `name` is in a node's effective (document ∪ presence) state set. */
    hasNodeState(id: string, name: string): boolean;
    /** True iff `name` is in an edge's effective (document ∪ presence) state set. */
    hasEdgeState(id: string, name: string): boolean;
    /**
     * Ids of every node whose effective (document ∪ presence) state set contains
     * `name`. Scans live nodes; useful for snapshots / iteration.
     */
    nodesWithState(name: string): IterableIterator<string>;
    /** Edge sibling of {@link nodesWithState}. */
    edgesWithState(name: string): IterableIterator<string>;
    addNodesBulk(nodes: readonly GraphNode[]): void;
    addEdgesBulk(edges: readonly GraphEdge[]): void;
    /**
     * Append nodes + edges in one batch — non-destructive (does NOT clear).
     * Convenience for streaming feeds that push a fresh chunk of items as
     * they arrive. Subscribers see a single `flush`.
     *
     * Differs from `GraphLayer.setData`, which clears the store first.
     */
    addData(data: {
        nodes?: readonly GraphNode[];
        edges?: readonly GraphEdge[];
    }): void;
    /**
     * **The data door.** Apply a {@link Delta} in a single batch — one flush, one
     * redraw, and (with a log attached) **one history entry**, attributed to
     * `opts.actor` or the canvas's session actor. Every other content writer is
     * shorthand for one of its fields. Order within the batch:
     *
     * 1. `removed.edgeIds`  — removed first so node removals can't cascade
     *    them again (no-op double removal is harmless, but explicit is cleaner).
     * 2. `removed.nodeIds`  — cascade-removes incident edges per `removeNode`'s
     *    default `cascade: true`.
     * 3. `added.nodes`      — `upsertNode` (idempotent; safe to re-send).
     * 4. `added.edges`      — `upsertEdge`.
     * 5. `updated.nodes`    — partial patches via `updateNode`.
     * 6. `updated.edges`    — partial patches via `updateEdge`.
     * 7. `hidden` / `shown` — the explicit hidden flag, nodes then edges.
     * 8. `pinned`           — pin (default) or unpin; `x` + `y` also move the node.
     *
     * `opts.coalesce` marks a **streamed** write (a live feed): it merges into
     * the actor's open streamed entry, an add and a later remove of the same id
     * cancel, and plain undo steps over it (RFC G12). Hosts should hold feed
     * ticks while `!history.atLatest()`.
     *
     * Unknown ids are skipped. Use `upsertNode` / `upsertEdge` semantics for the
     * `added` lists so a feed that re-sends an existing id (common in pub-sub)
     * merges rather than throwing. If you have hard-add semantics, use `addData`
     * instead.
     */
    applyDelta(delta: Delta<GraphNode, GraphEdge>, opts?: DeltaOptions): void;
    /** The body of {@link applyDelta}, in its documented order. */
    private applyDeltaBody;
    /**
     * Coalesce all mutations inside `fn` into a single flush and — with a log
     * attached — a single history entry. Nested `batch` calls flush and record
     * only on the outermost exit.
     *
     * `opts.title` labels the entry (`'paste'`, `'delete selection'`) and
     * `opts.actor` attributes it; both apply to the outermost batch only. The
     * entry is all or nothing: if `fn` throws, what it wrote is reverted.
     */
    batch<T>(fn: () => T, opts?: {
        title?: string;
        actor?: string;
    }): T;
    /** {@link batch} without the entry label: one flush, one recorded part on the outermost exit. */
    private runBatch;
    /**
     * Drain any pending events. Cancels the RAF-scheduled flush (frame mode).
     * In sync mode this still works — handy for forcing the TTL eviction sweep
     * even if no mutation has happened since the last flush.
     */
    flush(): void;
    /**
     * {@link DataSource} (D13) — subscribe to a coalesced {@link LayerFlush} delta
     * projected from this store's per-flush changes (position-only updates → `moved`).
     * Distinct from `events.on('flush', …)` (which carries aggregate counters): this
     * is what `CanvasStore` bridges onto `data:flush`. Returns an unsubscribe.
     */
    onFlush(listener: (delta: LayerFlush) => void): () => void;
    /**
     * {@link DataSource} (D13) — set the flush trigger. The engine drives `'manual'`
     * (its single rAF loop calls {@link flush}); kernel `'frame'`/`'microtask'` both
     * map to GraphStore's frame scheduler. GraphStore's native `'sync'` is the
     * constructor default and isn't reachable through this setter.
     */
    setFlushMode(mode: FlushMode): void;
    /**
     * Wipe all data. Cancels any pending flush. **Silent** — no per-element
     * events (`GraphLayer.clear` / `setData` detach the renderer themselves).
     * Recorded as one `clear` op holding what it removed, so undo re-adds it.
     */
    clear(): void;
    /**
     * Reclaim tombstoned slots. Invalidates any external code that cached
     * slot indices. Renderer batch buffers etc. must invalidate first.
     */
    compact(): void;
    private installNode;
    private installEdge;
    private handleUnknownEndpoint;
    private tryAdmitPending;
    /** True iff `candidateAncestor` is already a descendant of `id`. */
    private wouldCreateCycle;
    private readPosition;
    private enqueueNodeAdd;
    private enqueueNodeUpdate;
    private enqueueNodeRemove;
    private enqueueEdgeAdd;
    private enqueueEdgeUpdate;
    private enqueueEdgeRemove;
    private enqueueEdgeOrphan;
    /** Queue a node runtime-state change, deduped per `(id, name)` per flush. */
    private enqueueNodeState;
    /** Queue an edge runtime-state change, deduped per `(id, name)` per flush. */
    private enqueueEdgeState;
    /** Queue a node explicit-visibility change; last value per id wins per flush. */
    private enqueueNodeVisibility;
    /** Queue an edge explicit-visibility change; last value per id wins per flush. */
    private enqueueEdgeVisibility;
    private scheduleFlushIfNeeded;
    private doFlush;
}

/**
 * **Root-relative dot-path addressing** over a stored graph record — the one
 * resolver behind every `*ValueKey` / `*Key` option in the package.
 *
 * A string path rather than an accessor function because it **survives
 * serialisation**: it can live in `view.definition`, be edited in a settings
 * panel, persisted on a canvas record, and synced to a collaborator. Accessor
 * functions (`ColorByBehaviourOptions.nodeValueBy`) remain the escape hatch for
 * values that must be *computed* rather than addressed.
 *
 * Paths are relative to the **record root**, not to `data`, so they reach the
 * root fields and the payload alike:
 *
 * | Path | Resolves to |
 * |---|---|
 * | `'id'` | `node.id` |
 * | `'type'` | `node.type` |
 * | `'parentId'` | `node.parentId` |
 * | `'data.name'` | `node.data.name` |
 * | `'data.meta.tier'` | `node.data.meta.tier` |
 * | `'style.shape.kind'` | the shape kind |
 *
 * That's what distinguishes a node's root `type` from a `type` **key inside
 * `data`** — both occur in the wild (`defaultNodeTypeOf` reads `data.type` as a
 * fallback), and a bare property name cannot tell them apart.
 */
/**
 * Walk a root-relative dot path over `root`, returning `undefined` on any
 * missing segment (never throwing). Pure and synchronous.
 *
 * @param root - The record to address — a `GraphNode`, `GraphEdge`, or any object.
 * @param path - Dot path, e.g. `'id'`, `'type'`, `'data.meta.tier'`.
 * @returns The addressed value, or `undefined` if any segment is absent.
 *
 * @example
 * ```ts
 * readValueKey(node, 'type');        // → 'Person'
 * readValueKey(node, 'data.name');   // → 'Ada'
 * readValueKey(node, 'data.absent'); // → undefined
 * ```
 */
declare function readValueKey(root: unknown, path: string): unknown;

/**
 * Theme vocabulary for `@invana/graph` — the **named-palette** layer that sits
 * above the engine's graph-agnostic `ResolvedTheme` signal.
 *
 * A {@link Theme} is a named palette family (`default` / `forest` / `ocean` …)
 * with full **light + dark** variants. Each variant maps every {@link ColorRole}
 * to a concrete `0xRRGGBB` number. The {@link ThemeBehaviour} resolves the
 * active theme + mode down to the engine's `ResolvedTheme` and publishes it;
 * theme-aware layers recolour from the palette. Roles are resolved to numbers
 * before anything reaches the renderer — Pixi never sees a role.
 */
/**
 * Semantic colour variables — the canvas analogue of CSS custom properties.
 * Styling templates reference a role (`title → heading`); the active
 * {@link Theme} defines what that role resolves to per light/dark variant.
 */
type ColorRole = 'surface' | 'cardBg' | 'foreground' | 'heading' | 'muted' | 'accent' | 'divider' | 'stroke' | 'selectionRing' | 'hoverRing';
/** Concrete colour values for one light/dark variant of a {@link Theme}. */
interface ThemePalette extends Record<ColorRole, number> {
    /** Fill-by-category ramp consumed by `ColorByBehaviour` / minimap. */
    categorical: number[];
}
/** A named palette family with full light + dark variants. */
interface Theme {
    /** Stable name used to match against the host app's active theme family. */
    name: string;
    /** Optional human label for pickers. */
    label?: string;
    light: ThemePalette;
    dark: ThemePalette;
}
/** A registry of {@link Theme}s keyed by name. */
type ThemeRegistry = Record<string, Theme>;
/**
 * Mode selector.
 *
 * - `'system'` — follows `prefers-color-scheme` (the OS appearance setting).
 * - `'document'` — follows the **host page**: the `data-theme` attribute (or a
 *   `light`/`dark` class) on `<html>`, which is what design-kit theme switchers
 *   write. Use it when the canvas should track an app-level theme picker rather
 *   than the OS — and the family travels too, not just the light/dark kind.
 * - `'light'` / `'dark'` — pin the kind, ignoring both.
 */
type ThemeMode = 'system' | 'document' | 'light' | 'dark';
/** The concrete kind a {@link ThemeMode} resolves to. */
type ThemeKind = 'light' | 'dark';

/**
 * Node **structure** + **styling** templates — the two reusable layers above a
 * node's data that, together with the active {@link Theme}, decide how a node of
 * a given *type* looks.
 *
 * - **Structure** (`NodeStructureTemplate`) — the skeleton: a simple shape +
 *   label, or a composite *card* with rows/slots. **No colours.**
 * - **Styling** (`NodeStylingTemplate`) — which {@link ColorRole} each slot/label
 *   uses + typography. **No hex** (roles resolve to numbers against the theme;
 *   direct colours are an escape hatch via the paired non-`Role` fields).
 * - **Binding** (`NodeTypeBinding`) — ties a node *type* to a structure + styling
 *   and maps each slot to a dotted data path.
 *
 * The {@link GraphLayer} resolves these to a concrete `NodeStyle` (simple) or a
 * composite shape (card) — with every role already substituted for a number —
 * before anything reaches the renderer.
 */

/**
 * Authoring descriptor for a composite card's background silhouette, sized to
 * fill the card's `width × height` box. This is the *template* concept; the
 * compiler maps it to a concrete engine root shape ({@link CompositeRootSpec})
 * — `rect` → rounded rect, `ellipse` → sampled polygon, `regular-polygon` →
 * n-gon, `polygon` → the given normalised points. Omit for a rounded rectangle.
 */
type CompositeFrame = {
    readonly kind: 'rect';
    readonly cornerRadius?: number;
} | {
    readonly kind: 'ellipse';
} | {
    readonly kind: 'regular-polygon';
    readonly sides: number;
    readonly rotation?: number;
} | {
    readonly kind: 'polygon';
    readonly points: readonly {
        readonly x: number;
        readonly y: number;
    }[];
};
/**
 * A colour in a template: a literal `0xRRGGBB`, or a {@link ColorRole} name
 * resolved against the live palette. The two are distinguishable at runtime by
 * `typeof`, which is what lets a value→colour map hold either.
 */
type TemplateColor = number | ColorRole;
/**
 * One band of a {@link ValueLookup.bands} scale: a half-open numeric interval
 * mapped to a value.
 *
 * A band matches when the bound value is `>= from` (when given) **and** `< to`
 * (when given); a band with neither bound is the catch-all. Bands are scanned
 * in declaration order and the **first match wins**, so the common shape is
 * descending thresholds ending in a catch-all — the data form of
 * `v >= 80 ? green : v >= 60 ? amber : red`.
 */
interface ValueBand<T> {
    /** Inclusive lower bound. Omit for "no lower bound". */
    readonly from?: number;
    /** Exclusive upper bound. Omit for "no upper bound". */
    readonly to?: number;
    /** What this band resolves to. */
    readonly value: T;
}
/**
 * **A second data field, mapped to a presentation value.** The one construct a
 * template uses to say "this depends on the record" — shared by badge fills,
 * node size, card element colours and a card's border, so there is exactly one
 * thing to learn and one thing to edit.
 *
 * A node's *look* is otherwise selected by `node.type` alone (via
 * {@link NodeTypeBinding}), and colour by a dotted path (via
 * `ColorByBehaviour.nodeValueKey`). This is the same addressing — a
 * root-relative dot path — made available wherever a template needs it, which
 * is what turns a resolver into data.
 *
 * Resolution order: {@link map} (categorical, keyed by the value stringified),
 * then {@link bands} (numeric), then {@link fallback}. Nothing matching yields
 * `undefined`, and the caller keeps whatever it had.
 *
 * @example
 * // "size by complexity" — categorical
 * { bind: 'data.complexity', map: { simple: 4, moderate: 5.5, complex: 8 } }
 * @example
 * // "colour by coverage" — numeric, first match wins
 * { bind: 'data.coverage', bands: [{ from: 80, value: 0x16a34a }, { value: 0xdc2626 }] }
 */
interface ValueLookup<T> {
    /**
     * Dotted path to the driving field, rooted at the node (`'data.complexity'`,
     * `'type'`). Inside a {@link NodeBadgeTemplate} it may be omitted to reuse
     * that badge's own {@link NodeBadgeTemplate.bind}.
     */
    readonly bind?: string;
    /** Categorical map, keyed by the bound value stringified. Consulted first. */
    readonly map?: Readonly<Record<string, T>>;
    /** Numeric bands; first match wins. See {@link ValueBand}. */
    readonly bands?: readonly ValueBand<T>[];
    /** Used when neither {@link map} nor {@link bands} matched. */
    readonly fallback?: T;
}
/**
 * A reusable node skeleton:
 * - {@link SimpleStructure} — one shape + a label (lean path).
 * - {@link CardStructure} — a composite card auto-laid-out as rows of slots.
 * - {@link FreeformStructure} — a composite card whose elements are placed at
 *   absolute coordinates (what the visual **card designer** produces). It's
 *   self-contained: each element carries its own data binding + colour role, so
 *   it needs no separate styling/binding template.
 */
type NodeStructureTemplate = SimpleStructure | CardStructure | FreeformStructure;
/** Simple structure: one shape with a single label slot (the lean render path). */
interface SimpleStructure {
    name: string;
    kind: 'simple';
    /** The node's shape (circle / rect / arc / regular-polygon / star / polygon). */
    shape: NodeShapeOptions;
    /** Declared slots. `label` is always present; icon/badge reserved for later. */
    slots?: {
        label?: boolean;
        icon?: boolean;
        badge?: boolean;
    };
}
/** Composite card structure: a fixed-size body laid out as rows of slots. */
interface CardStructure {
    name: string;
    kind: 'card';
    /** Fixed card width in world units. Overflow text ellipsizes. */
    width: number;
    /** Fixed card height in world units. */
    height: number;
    /** Inner padding (default 14). */
    padding?: number;
    /**
     * Background silhouette filling the card box. Omit for a rounded rectangle;
     * set a circle/ellipse, polygon, etc. to make the card that shape (fill,
     * border and every state decoration follow it).
     */
    frame?: CompositeFrame;
    /** Ordered rows, laid out top → bottom. */
    rows: CardRow[];
}
/** One row of a {@link CardStructure}: either content slots or a divider line. */
interface CardRow {
    /** Left → right cells. Omit for a pure divider row. */
    slots?: CardSlot[];
    /** Render a hairline divider for this row (uses the `divider` slot styling). */
    divider?: boolean;
}
/** A cell within a {@link CardRow}. */
type CardSlot = {
    slot: string;
    kind: 'tag' | 'text';
} | {
    slot: string;
    kind: 'image';
    shape?: 'circle' | 'rounded';
    size?: number;
} | {
    stack: CardSlot[];
};
/** Fields shared by every {@link CardElement}: identity, position, visibility. */
interface CardElementCommon {
    id: string;
    /** Top-left X relative to the card (1:1 with the designer canvas). */
    x: number;
    /** Top-left Y relative to the card. */
    y: number;
    /** Optional human label shown in the designer's layers list. */
    label?: string;
    /** Hidden elements are kept in the template but not drawn (layers eye-toggle). */
    hidden?: boolean;
    /**
     * Promotes this element to an addressable **sub-part**: the renderer reports
     * the topmost `hitId` under the pointer and turns it into `shape:partover` /
     * `shape:partout`, so a consumer can hover, right-click or anchor against a
     * *row* rather than the whole card. Honoured on `rect` / `circle` elements
     * (the engine's `CompositePart` carries it on those kinds); ignored on the
     * rest. A transparent full-width `rect` with a `hitId` is the idiomatic way
     * to make a whole row hoverable.
     */
    hitId?: string;
    /**
     * Draw this element only when this dotted path resolves to a **non-nullish**
     * value. `0` and `''` are values, not absences.
     *
     * The card equivalent of a badge's presence rule, and the thing that lets an
     * interpolated string stay honest: a footer reading
     * `'L{data.lineRange.0}–{data.lineRange.1}'` must not render `L–` for the 253
     * records of `invanaCodeKg` that carry no line range. A resolver said this
     * with `p.lineRange ? … : ''`; this says it as data.
     */
    requires?: string;
}
/**
 * One absolutely-positioned element of a {@link FreeformStructure}. Colours are
 * a **pair** — a `*Role` (themed) or a direct numeric field (fixed). `text`
 * elements bind their content to a dotted data path via `bind` (falling back to
 * the literal `text`). Order in `elements[]` is the **z-order** (later = on top).
 */
type CardElement = (CardElementCommon & {
    type: 'text';
    /** Dotted data path bound to this text (e.g. `data.name`). */
    bind?: string;
    /**
     * Literal text, **or a template** over the record: `{}` stands for the
     * {@link bind} value and `{dotted.path}` for any field, so
     * `'L{data.lineRange.0}–{data.lineRange.1}'` reads `L123–187`. Used
     * whenever it is set; `bind` alone renders the bound value verbatim.
     *
     * Pair a template with {@link CardElementCommon.requires} so the element
     * disappears rather than rendering its punctuation around nothing.
     */
    text?: string;
    fontSize?: number;
    fontWeight?: number | string;
    fontStyle?: 'normal' | 'italic';
    /** Small-caps rendering — an entity-kind tag, a column flag. Distinct
     * from {@link uppercase}, which rewrites the string itself. */
    fontVariant?: 'normal' | 'small-caps';
    uppercase?: boolean;
    colorRole?: ColorRole;
    color?: number;
    /** Text colour read off the record; wins over the pair above. */
    colorLookup?: ValueLookup<TemplateColor>;
    /** Wrap/ellipsis width; omitted = single unbounded line. */
    maxWidth?: number;
    maxLines?: number;
    /** Line box height for wrapped text — a 2-line summary that must not
     * collide with the row under it. */
    lineHeight?: number;
    /** Which point of the text box sits at `x`. */
    anchor?: 'left' | 'center' | 'right';
    /** Horizontal alignment *within* a wrapped block. Independent of
     * {@link anchor}, which places the block. */
    align?: 'left' | 'center' | 'right';
}) | (CardElementCommon & {
    type: 'rect';
    width: number;
    height: number;
    cornerRadius?: number;
    fillRole?: ColorRole;
    fill?: number;
    /** Fill read off the record; wins over the pair above. An accent bar
     * whose colour follows the node's cluster. */
    fillLookup?: ValueLookup<TemplateColor>;
    /** Fill opacity (0–1). A tint of a themed fill — zebra rows, header strips. */
    fillAlpha?: number;
    /** Outline colour pair — an outlined glyph (a hollow key square, a chip). */
    strokeRole?: ColorRole;
    stroke?: number;
    strokeWidth?: number;
}) | (CardElementCommon & {
    type: 'circle';
    radius: number;
    fillRole?: ColorRole;
    fill?: number;
    /** Fill read off the record; wins over the pair above. */
    fillLookup?: ValueLookup<TemplateColor>;
    /** Fill opacity (0–1). */
    fillAlpha?: number;
    /** Outline colour pair. */
    strokeRole?: ColorRole;
    stroke?: number;
    strokeWidth?: number;
}) | (CardElementCommon & {
    type: 'line';
    x2: number;
    y2: number;
    colorRole?: ColorRole;
    color?: number;
    /** Colour read off the record; wins over the pair above. */
    colorLookup?: ValueLookup<TemplateColor>;
    strokeWidth?: number;
}) | (CardElementCommon & {
    type: 'image';
    size: number;
    shape?: 'circle' | 'rounded';
    /** Dotted data path for the image source (rendered as a placeholder today). */
    bind?: string;
}) | (CardElementCommon & {
    type: 'icon';
    /** Side of the square box the glyph scales into. */
    size: number;
    /**
     * Dotted data path to an **iconify id** (`lucide/plane`), so one
     * structure draws a different glyph per record. Wins over {@link icon}
     * when it resolves.
     */
    bind?: string;
    /** Literal iconify id — the glyph every record gets, or the fallback. */
    icon?: string;
    colorRole?: ColorRole;
    color?: number;
    /** Glyph colour read off the record; wins over the pair above. */
    colorLookup?: ValueLookup<TemplateColor>;
    /** Stroke width for outline icon sets (Lucide draws at `2`). */
    strokeWidth?: number;
});
/**
 * A self-contained composite card placed by absolute coordinates — the JSON the
 * visual card designer emits. Carries its own background, element list, data
 * bindings and colour roles, so a node type only needs to reference it by name
 * (no separate styling/binding template). Compiles straight to the engine's
 * `composite` shape; themed because every colour is a {@link ColorRole}.
 */
interface FreeformStructure {
    name: string;
    kind: 'freeform';
    width: number;
    height: number;
    cornerRadius?: number;
    /**
     * Background silhouette filling the card box. Omit for a rounded rectangle
     * (using {@link cornerRadius}); set a circle/ellipse, polygon, etc. to make
     * the card that shape — fill, border and decorations follow it.
     */
    frame?: CompositeFrame;
    bgRole?: ColorRole;
    bg?: number;
    strokeRole?: ColorRole;
    stroke?: number;
    /**
     * Border colour read off the record; wins over the pair above.
     *
     * On the **structure** rather than on an element because the silhouette is
     * the card's own outline — a card accented by cluster traces that colour
     * round the whole frame, not just the bar inside it. (There is deliberately
     * no `bgLookup` yet: no caller needs a per-record card *fill*, and an unused
     * door is a door to maintain.)
     */
    strokeLookup?: ValueLookup<TemplateColor>;
    strokeWidth?: number;
    elements: CardElement[];
}
/**
 * Per-type styling: roles + typography. Every colour is a **pair** — a `*Role`
 * field (themed, resolved from the active palette) **or** a direct numeric field
 * (fixed literal). `*Role` wins when both are set.
 */
interface NodeStylingTemplate {
    name: string;
    fillRole?: ColorRole;
    fill?: number;
    /**
     * Border colour — applies to **both** structure kinds: it becomes the shape's
     * `bgStrokeColor` on a `simple` structure, and the composite silhouette's own
     * stroke on a `card` (so it traces a custom `frame` too). Defaults to no
     * border when unset; {@link strokeWidth} defaults to `1` on a card and `1.5`
     * on a simple shape.
     */
    strokeRole?: ColorRole;
    stroke?: number;
    strokeWidth?: number;
    /**
     * Opacity of the **fill only**, `0`–`1`. Default opaque.
     *
     * Deliberately not the shape's overall opacity: `NodeStyle.bgAlpha` fades the
     * border with the fill, so a hairline under a low `bgAlpha` all but vanishes.
     * This compiles onto the fill layer (`{ kind: 'solid', color, alpha }`) and
     * leaves {@link strokeAlpha} to say what the outline does.
     *
     * The use that motivates it is a **theme-agnostic tint**: a neutral at low
     * alpha composites against whatever backdrop is behind it, so one value reads
     * correctly in light *and* dark, where a literal picked for one is wrong in
     * the other.
     *
     * **Scope: `simple` structures.** A `card` paints its fill through the
     * composite root rather than `bgFill`, and takes no alpha yet.
     */
    fillAlpha?: number;
    /**
     * Opacity of the border only, `0`–`1`. Default opaque. Sibling of
     * {@link fillAlpha}, and `simple`-structure-scoped for the same reason.
     */
    strokeAlpha?: number;
    label?: LabelStyling;
    bgRole?: ColorRole;
    bg?: number;
    accentRole?: ColorRole;
    accent?: number;
    /** Per-slot styling, keyed by slot name (e.g. `title`, `subtitle`, `divider`). */
    slots?: Record<string, SlotStyling>;
    /**
     * Render nodes of this type as a **compound group frame** — a container drawn
     * behind the descendants that point at it via `parentId`. See
     * {@link GroupOptions} for the full contract (auto-fit, header band, collapse
     * semantics).
     *
     * Why this lives on *styling* rather than on the structure or the binding: the
     * data says which nodes are children of which (`parentId` is hierarchy, and a
     * tree has it whether or not anything is drawn round it). Whether that
     * hierarchy *renders as a frame* is a presentation decision — the same call as
     * fill and stroke, and one a second styling template can answer differently
     * for the same skeleton.
     *
     * Declaring it here is what keeps a group out of `node.style` resolvers: it is
     * a per-type constant, so it belongs in the per-type template, and a config
     * that uses it stays serialisable. Equivalent to
     * `node: { style: { group: (n) => n.type === 'x' ? {…} : undefined } }`,
     * without the callback.
     *
     * Presence is the discriminator, exactly as on `NodeStyle.group` — an empty
     * object still makes the node a frame.
     */
    group?: GroupOptions;
    /**
     * Badges drawn on every node of this type, each one **bound to a field** of
     * the record rather than decided in advance.
     *
     * This is the declarative form of a `node: { style: { badges: (n) => … } }`
     * resolver. {@link NodeStyle.badges} is a list of already-decided badges, so
     * a health pill whose text, colour and very existence depend on the record
     * could only be written as a callback — and a callback cannot be saved,
     * diffed or edited in the settings panel. A {@link NodeBadgeTemplate} says
     * the same three things as data: {@link NodeBadgeTemplate.bind} names the
     * field, {@link NodeBadgeTemplate.fillLookup} maps its value to a colour, and
     * a badge whose bound field is absent is simply not drawn.
     *
     * Badges **concatenate** rather than override: the layer template's badges,
     * these, per-node `style.badges` and each active state's overlay all
     * contribute, deduped by `id` with later precedence winning (see
     * `GraphLayer.resolveNodeBadges`). Give every template an `id` when a state
     * overlay needs to replace one.
     */
    badges?: readonly NodeBadgeTemplate[];
    /**
     * The node's size, as a flat number or **read off a second field**.
     *
     * Compiles to {@link NodeStyle.size}, which `GraphLayer` applies *after* the
     * whole template has been resolved and normalises onto whatever shape
     * survived (`circle` → `radius`, `rect` → a square side, `arc` / `star` →
     * outer radius with the inner one scaled). That ordering is the point: a type
     * binding necessarily carries a **structure**, and a structure carries the
     * shape — so a size declared here *composes with* the skeleton instead of
     * fighting it, and a second field (`data.complexity`) can drive the radius
     * while `node.type` still picks the look and the label binding.
     *
     * Without it, "big dot for a complex module" is only sayable as a
     * `shape: (n) => …` resolver — and because a binding's structure would
     * overwrite that shape, the *label* could not be bound either. One field
     * frees both.
     */
    size?: number | ValueLookup<number>;
}
/**
 * A {@link NodeBadge} whose text, colour and presence are **read off the
 * record** instead of being fixed at authoring time.
 *
 * Everything a `NodeBadge` carries — `placement`, `origin`, `shape`, `icon`,
 * `offsetX`/`offsetY`, `decorations`, `effects`, … — is inherited unchanged.
 * What this adds is the binding: `bind` names the field, `when*` decides
 * whether the badge exists at all for a given record, `labelText` interpolates
 * the value into a string, and the colour fields gain the `*Role` pair + the
 * two value→colour maps.
 *
 * `GraphLayer` compiles one of these per node against the live palette, so a
 * template survives a save, a theme switch and a round trip through
 * `CanvasSettingsEditorPanel`.
 */
interface NodeBadgeTemplate extends Omit<NodeBadge, 'fill' | 'labelText' | 'labelColor' | 'strokeColor'> {
    /**
     * Dotted path to the field that drives this badge, rooted at the node
     * (`'data.coverage'`, `'type'`). Omit for a **static** badge that every node
     * of the type gets.
     *
     * Presence is the default rule: when `bind` is set and the path resolves to
     * `undefined` / `null`, the badge is **not drawn**. `0` and `''` are values,
     * not absences. It is the same rule {@link CardElementCommon.requires} applies
     * to a card element.
     */
    readonly bind?: string;
    /** Draw only when the bound value is strictly greater than this. */
    readonly whenGreaterThan?: number;
    /** Draw only when the bound value is strictly less than this. */
    readonly whenLessThan?: number;
    /** Draw only when the bound value is exactly this. */
    readonly whenEquals?: string | number | boolean;
    /**
     * Label text, with `{}` standing for the bound value and `{dotted.path}` for
     * any other field of the record — `'{}%'` on a `data.coverage` binding reads
     * `87%`. Omit to render the bound value verbatim; a badge with no `bind` and
     * no `labelText` is a plain plate.
     */
    readonly labelText?: string;
    /** Themed plate colour (wins over {@link fill}). */
    readonly fillRole?: ColorRole;
    /** Literal plate colour, and the fallback when {@link fillLookup} matches
     * nothing. */
    readonly fill?: number;
    /**
     * Plate colour read off the record — a {@link ValueLookup} over colours, so a
     * coverage pill can band its number to green/amber/red and a status chip can
     * map a string to a colour. Its `bind` defaults to this badge's own
     * {@link bind}, so the common case names the field once.
     */
    readonly fillLookup?: ValueLookup<TemplateColor>;
    /** Themed border colour (wins over {@link strokeColor}). */
    readonly strokeColorRole?: ColorRole;
    /** Literal border colour. */
    readonly strokeColor?: number;
    /** Themed label colour (wins over {@link labelColor}). */
    readonly labelColorRole?: ColorRole;
    /** Literal label colour. */
    readonly labelColor?: number;
}
/** Styling for one card slot. */
interface SlotStyling {
    colorRole?: ColorRole;
    color?: number;
    fontSize?: number;
    fontWeight?: number | string;
    fontFamily?: string;
    fontStyle?: 'normal' | 'italic';
    /** Render the text in UPPERCASE (e.g. a type tag). */
    uppercase?: boolean;
}
/** Styling for a simple structure's label (maps onto the `NodeStyle` label* fields). */
interface LabelStyling {
    colorRole?: ColorRole;
    color?: number;
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: number | string;
    fontStyle?: 'normal' | 'italic';
    placement?: ShapeLabelPlacement;
    offsetX?: number;
    offsetY?: number;
    rotation?: number;
    align?: 'left' | 'center' | 'right';
    background?: boolean;
    backgroundColorRole?: ColorRole;
    backgroundColor?: number;
}
/** Ties a node *type* to a structure + styling + slot→data bindings. */
interface NodeTypeBinding {
    /** Name of the {@link NodeStructureTemplate} to use. */
    structure: string;
    /** Name of the {@link NodeStylingTemplate} to use. */
    styling: string;
    /** Slot name → dotted data path (`'data.name'`, `'type'`). */
    bindings: Record<string, string>;
    /** Optional host-provided field schema for editor pickers. */
    fields?: {
        key: string;
        label: string;
    }[];
}
/** Registries keyed by template name. */
type NodeStructureRegistry = Record<string, NodeStructureTemplate>;
type NodeStylingRegistry = Record<string, NodeStylingTemplate>;
type NodeTypeRegistry = Record<string, NodeTypeBinding>;

/**
 * A field value that's either a static value or a function that derives the
 * value from the host item (node / edge / raw data).
 *
 * Used on every field of `NodeStyle` / `EdgeStyle` (via `ResolvableNodeStyle`
 * / `ResolvableEdgeStyle`) so callers can supply per-item-derived styling
 * on the layer template (`options.node.style`) or per-instance input
 * (`GraphNode.style`) without spreading hints into every node's `data`.
 *
 * Resolved per render (layer-level) or once at insert (per-input). Keep
 * resolvers cheap and pure — they may run per frame. Recursive returns
 * (a function returning another function) are not unwrapped — return the
 * final value.
 *
 * @example
 * ```ts
 * node: {
 *   style: {
 *     bgFill:    (n) => groupColors[(n.data as Group).group % groupColors.length],
 *     shape:     (n) => ({ kind: 'circle', radius: 12 + Math.sqrt((n.data as N).degree ?? 1) * 4 }),
 *     labelText: (n) => (n.data as N).name,
 *   },
 * }
 * ```
 */
type Resolvable<T, I> = T | ((input: I) => T);
/** Convenience alias for id-resolvers; `D` is the raw data type on input. */
type ResolvableId<D> = string | ((data: D) => string);
/**
 * Unwrap a {@link Resolvable} field for `input`. Static values pass through
 * untouched; function values are invoked once with `input` and their return
 * is used. Functions returning further functions are NOT unwrapped — return
 * the final value.
 */
declare function resolveField<T, I>(v: Resolvable<T, I> | undefined, input: I): T | undefined;
/** Path-style shortcut for an edge. Maps to the canvas router + pathStyle pair. */
type EdgePathType = 'straight' | 'bezier' | 'quadratic' | 'bump-radial' | 'bump-horizontal' | 'step-radial' | 'orth' | 'manhattan' | 'rounded' | 'smooth' | 'bundle' | 'loop-curve' | 'loop-polyline';
/**
 * Endpoint anchor.
 *
 * - `'boundary'` (default) — trim the endpoint at the node's outline along
 *   the line from the other endpoint. Visually the edge stops at the node
 *   boundary; works with arrows and connector decorations cleanly.
 * - `'center'` — leave the endpoint at the node's centre. The edge passes
 *   through the node visually; rely on z-order (nodes drawn on top) to make
 *   it look like the edge terminates at the boundary. Pick this for radial
 *   layouts so polar pathStyles (e.g. `bump-radial`) compute their tangent
 *   from the true node-centre angle rather than the trimmed cut point.
 * - `'perpendicular'` — exit / enter perpendicular to the host edge of a
 *   rect-like node. Reserved for box-shaped nodes.
 * - `'edge-port'` — attach to a specific point on one face of the node's
 *   bounding box, picked by `{ side, offset }` on the per-endpoint
 *   `sourceAnchorOpts` / `targetAnchorOpts`. Used by the Sankey layout to
 *   stack ribbons along the right face of source and left face of target.
 *
 * Widened to `string` so anchors registered at runtime (e.g. domain-specific
 * port anchors) can be referenced by name.
 */
type EdgeAnchor = 'boundary' | 'center' | 'perpendicular' | 'edge-port' | (string & {});
/**
 * Initial-load shape passed to `graphLayer.setData(data)`.
 *
 * Carries **input** records — `type` is optional here and the store defaults it
 * to `UNKNOWN_TYPE` on insert. Read the data back with `store.nodes()` /
 * `exportData()` to get the stored form, where `type` is always a `string`.
 */
interface GraphData {
    nodes: GraphNode[];
    edges: GraphEdge[];
}
/**
/**
 * Canonical interaction-state names with sensible defaults baked into the
 * GraphLayer's resolver. State styling lives on the layer-level
 * {@link NodeOption.state} / per-node `GraphNode.state` catalogue —
 * `default` is intentionally absent (it's the absence of any active state,
 * not a state itself).
 *
 * The state-config map is open-keyed: consumers can declare additional
 * named states (e.g. `'pinned'`, `'flagged'`, `'error'`, `'focused'`)
 * directly on `options.node.state` / `node.state` with the same shape —
 * they compose via the same merge rules. The canonical set below is
 * deliberately small; reach for it only when the named driver applies.
 *
 * ### Driver → state map
 *
 * Each canonical state has a distinct *driver* (what causes the state to
 * be written) and *lifetime* (when it clears). The visual treatments
 * overlap (most are stroke rings of various colours), but the semantics
 * do not — a single node can carry several states simultaneously (e.g.
 * `selected + hover`) and a behaviour should only write the states it
 * owns.
 *
 * | State         | Driver                                    | Lifetime                          | Cardinality       |
 * | ------------- | ----------------------------------------- | --------------------------------- | ----------------- |
 * | `hovered`     | Mouse / touch pointer-over                | Transient — clears on pointer-out | ≤ 1 per layer     |
 * | `selected`    | Click / lasso / brush — user's chosen set | Sticky until explicitly cleared   | 0–N per layer     |
 * | `highlighted` | 1-hop neighbours of the hovered / selected | Transient — clears with the driver | 0–N per layer    |
 * | `dimmed`      | Complement of the focal-emphasis set      | Transient — clears with the driver | 0–N per layer    |
 * | `disabled`    | Data flag — "not interactive"             | Sticky — owned by the data feed   | 0–N per layer     |
 *
 * ### Sticky chosen set — `selected`
 *
 * `selected` is the click / lasso / brush state — what the user *chose*.
 * Persists until explicitly deselected. **Multi-select doesn't need its
 * own state**: it's just the same `selected` state applied to every
 * member of `selectedIds: Set<string>`. One node selected → one ring;
 * ten nodes selected → ten rings.
 *
 * `selected` can co-exist with `hovered` — clicking a node doesn't stop
 * it from being hovered.
 *
 * ### Focal-emphasis flow — `highlighted` + `dimmed`
 *
 * Written together by a focal-emphasis behaviour (typically driven by
 * hover or selection). When the user hovers / selects a node:
 * - its 1-hop neighbours go `highlighted` — *supporting cast*,
 * - everyone else goes `dimmed` — *pushed back so the focal set pops*.
 *
 * Both clear together when emphasis ends. Drop the pair if the product
 * never needs the "fade everyone except the focal subgraph" interaction.
 *
 * ### Data-driven — `disabled`
 *
 * Sticky and owned by the data feed (not by an interaction behaviour).
 * `disabled` means "this node isn't interactive". Visually overlaps
 * `dimmed` but they're semantically distinct:
 * - `dimmed` says *"you're focusing elsewhere"* (transient, behaviour).
 * - `disabled` says *"you can't interact with me"* (sticky, data).
 * Conflating them would couple interaction code to data code — keep them
 * separate even if the visual treatment is similar.
 *
 * **Today `disabled` is a visual state only — nothing enforces it.** Naming
 * it in `states[]` applies whatever `state.disabled` overlay you author and
 * nothing more: the node stays pickable, hoverable and selectable. No
 * behaviour consults it, and no picking path filters on it. To actually stop
 * interaction, exclude the node's `type` on the behaviours that shouldn't
 * respond to it (`excludeNodeTypes` on `HoverActivateBehaviour` /
 * `ClickSelectBehaviour`), or veto it with their `enable` predicate. Making
 * this state load-bearing would mean routing it through the same behaviours —
 * a change worth its own RFC, not an assumption to build on.
 */
type CanonicalStateName = 
/** Mouse / touch pointer is over the node. Transient; one node at a time. */
'hovered'
/** User's chosen set (click / lasso / brush). Sticky; many at a time. Multi-select is just this state applied to each member of the selection. */
 | 'selected'
/** 1-hop neighbour of the hovered / selected focal — "supporting cast". Transient; cleared with the focal. */
 | 'highlighted'
/** Complement of the focal-emphasis set — pushed back so `selected` + `highlighted` pop. Transient. NOT `disabled` — that's a data flag. */
 | 'dimmed'
/** Data flag: "not interactive". Sticky; owned by the data feed. Visually similar to `dimmed` but semantically distinct (data, not interaction). */
 | 'disabled'
/**
 * A container frame ({@link GroupOptions}) is closed: its descendants are
 * hidden and incident edges re-route to it. Sticky; toggled by
 * `CollapseExpandBehaviour` or authored on the node's `states[]` to start
 * closed. Overlay `state.collapsed` to say what *this* node looks like when
 * closed — see {@link COLLAPSED_STATE}.
 */
 | 'collapsed';
/**
 * The state name that closes a container frame — {@link CanonicalStateName}'s
 * `'collapsed'`, named so callers don't hardcode the string.
 *
 * Collapse is **interaction state, not styling**: the truth lives in the
 * store's presence set (`store.setNodeState(id, COLLAPSED_STATE, true)`) or
 * the node's document `states[]`, never in `style`. Two things follow, and
 * they're the point of modelling it this way:
 *
 * - **Every node describes its own closed look**, through the same overlay
 *   catalogue as `hovered` / `selected` — `state.collapsed` on the node, on
 *   the layer template, or on a per-type template. Nothing about a closed
 *   frame is hardcoded in the layer.
 * - Geometry has a sensible default with no authoring: the resolved shape's
 *   own minimal form (`ShapeCtor.collapsedOf` — a `tabbed-rect` closes to its
 *   tab). An overlay that declares its own `shape` opts out of it.
 */
declare const COLLAPSED_STATE = "collapsed";
/** Rect-shape option. `cornerRadius` is optional; everything else required. */
interface RectShapeOption {
    readonly kind: 'rect';
    readonly width: number;
    readonly height: number;
    readonly cornerRadius?: number;
}
/**
 * Rectangle carrying a raised tab on its top edge — the "folder" outline,
 * drawn as one continuous silhouette. Its natural use is a **group frame**:
 * the tab is where the group's title goes, so the frame's contents are never
 * crowded by its own label. See {@link GroupOptions.tabWidth}.
 *
 * `height` describes the **body only**; the rendered node is
 * `tabHeight + height` tall and its `position` is the top of the *tab*.
 * A node label with an `inside-top*` placement is routed into the tab
 * automatically; every other `inside-*` placement stays in the body.
 */
interface TabbedRectShapeOption {
    readonly kind: 'tabbed-rect';
    readonly width: number;
    /** Height of the body alone, excluding {@link tabHeight}. */
    readonly height: number;
    /**
     * Width of the tab. On a group frame this is normally left to
     * {@link GroupOptions.tabWidth}'s auto-sizing rather than authored.
     */
    readonly tabWidth: number;
    /** Height of the tab, added above the body. */
    readonly tabHeight: number;
    readonly cornerRadius?: number;
    /** Fillet on the tab's top corners. Defaults to {@link cornerRadius}. */
    readonly tabCornerRadius?: number;
    /** Which side the tab hugs. Default `'left'`. */
    readonly tabAlign?: 'left' | 'center' | 'right';
    /** Gap between the {@link tabAlign} edge and the tab. Default `0`. */
    readonly tabOffset?: number;
    /**
     * Horizontal run of the tab's angled side. Default `0` (square tab). The
     * lean falls on the side facing the rest of the frame.
     */
    readonly tabSkew?: number;
    /** Draw the fold line closing the tab's base. Default `true`. */
    readonly tabDivider?: boolean;
}
/** Circle-shape option. */
interface CircleShapeOption {
    readonly kind: 'circle';
    readonly radius: number;
}
/** Arc (annular sector) shape option. All four geometry params required. */
interface ArcShapeOption {
    readonly kind: 'arc';
    readonly innerR: number;
    readonly outerR: number;
    readonly startAngle: number;
    readonly endAngle: number;
}
/**
 * Regular n-gon. With `rotation = 0` the first vertex points straight up, so
 * a triangle / pentagon / hexagon points up by default. Pass
 * `rotation: Math.PI / sides` for flat-top.
 */
interface RegularPolygonShapeOption {
    readonly kind: 'regular-polygon';
    readonly sides: number;
    readonly radius: number;
    readonly rotation?: number;
}
/**
 * N-pointed star. Classic 5-point star uses
 * `{ points: 5, outerRadius: r, innerRadius: r * 0.4 }`.
 */
interface StarShapeOption {
    readonly kind: 'star';
    readonly points: number;
    readonly innerRadius: number;
    readonly outerRadius: number;
    readonly rotation?: number;
}
/**
 * Free-form polygon. `vertices` are centre-relative — closed implicitly
 * (last vertex connects to first).
 */
interface PolygonShapeOption {
    readonly kind: 'polygon';
    readonly vertices: ReadonlyArray<Point>;
}
/**
 * Escape-hatch variant for shape kinds registered at runtime via
 * `canvas.primitives.registerShape(name, ctor)`. The widened `kind` accepts
 * any string the type-checker can't match against a built-in variant;
 * additional spec params are erased at the type level but pass through to
 * the renderer untouched at runtime (the adapter spreads the whole shape
 * record into the spec).
 *
 * Authors of custom shapes typically declare a local interface
 * (`interface ChevronShapeOption { kind: 'chevron'; size: number }`) and
 * cast at the boundary (`style: { shape: chevron as NodeShapeOptions }`).
 * The index signature was deliberately omitted here so that discriminant
 * narrowing on the typed built-in variants (`shape.kind === 'rect'` →
 * `RectShapeOption`) keeps working everywhere else in the codebase.
 *
 * Built-in kinds (`'rect'`, `'circle'`, `'arc'`, `'regular-polygon'`,
 * `'star'`, `'polygon'`) are matched by the typed variants above before
 * this fallback applies.
 */
interface CustomShapeOption {
    readonly kind: string & {};
}
/**
 * Composite "card" shape — a fixed-size rounded body with a `parts[]` list of
 * rects / circles / lines / labels laid out by the caller (or compiled from a
 * {@link CardStructure} by the template system). First-class so node *card*
 * templates are type-safe rather than going through the `as unknown` cast.
 * Maps 1:1 to the canvas `composite` shape spec; `parts` reuses the engine's
 * {@link CompositePart} union.
 */
interface CompositeShapeOption {
    readonly kind: 'composite';
    readonly width: number;
    readonly height: number;
    readonly cornerRadius?: number;
    /**
     * Background silhouette of the card — a concrete engine root shape (rect /
     * circle / polygon / regular-polygon / star / arc), centred in the box. Omit
     * for a rounded rectangle built from `cornerRadius` + `fill` / `stroke`. Fill,
     * stroke, hit-testing and every decoration follow it.
     */
    readonly root?: CompositeRootSpec;
    readonly fill?: number;
    readonly fillAlpha?: number;
    readonly stroke?: {
        readonly color: number;
        readonly width?: number;
        readonly alpha?: number;
    };
    readonly parts: readonly CompositePart[];
    /** Clip parts to the root silhouette so edge-touching parts follow the rounded corners. */
    readonly clip?: boolean;
}
/**
 * Closed union of the six shape kinds that `@invana/canvas` registers out
 * of the box. Exported so internal switch-narrowing sites can target it
 * directly via the {@link isBuiltInNodeShape} type guard.
 */
type BuiltInNodeShapeOptions = RectShapeOption | TabbedRectShapeOption | CircleShapeOption | ArcShapeOption | RegularPolygonShapeOption | StarShapeOption | PolygonShapeOption;
/**
 * Discriminated union of node shape options. The `kind` field enforces
 * per-variant required fields at compile time for the six built-in kinds
 * registered by `@invana/canvas`. {@link CustomShapeOption} provides an
 * open-keyed fallback for shapes registered at runtime by the consumer.
 *
 * Internal call sites that need to read variant-specific fields should
 * narrow via the {@link isBuiltInNodeShape} type guard first — the
 * open-keyed `CustomShapeOption.kind` prevents `switch (shape.kind)` over
 * literals from excluding the custom variant on its own.
 */
type NodeShapeOptions = BuiltInNodeShapeOptions | CompositeShapeOption | CustomShapeOption;
/**
 * Type guard separating the typed built-in variants from
 * {@link CustomShapeOption}. Use this before reading variant-specific
 * fields so TypeScript narrows cleanly inside each `case`.
 */
declare function isBuiltInNodeShape(shape: NodeShapeOptions): shape is BuiltInNodeShapeOptions;
/**
 * Vector inset rendered inside a node's body — glyph (font codepoint), SVG
 * path, or SVG by URL. Kept structured (discriminated union) because each
 * kind carries different required params.
 */
type NodeIcon = {
    readonly kind: 'glyph';
    readonly char: string;
    readonly fontFamily?: string;
    readonly fontWeight?: number | string;
    readonly fontStyle?: 'normal' | 'italic';
    readonly color?: number;
    readonly alpha?: number;
    readonly sizeRatio?: number;
    readonly anchor?: InsetAnchor;
} | {
    readonly kind: 'svg';
    readonly pathD: string;
    readonly viewBox?: {
        readonly width: number;
        readonly height: number;
    };
    readonly strokeWidth?: number;
    readonly color?: number;
    readonly alpha?: number;
    readonly sizeRatio?: number;
    readonly anchor?: InsetAnchor;
} | {
    readonly kind: 'svg-url';
    readonly url: string;
    readonly viewBox?: {
        readonly width: number;
        readonly height: number;
    };
    readonly strokeWidth?: number;
    readonly color?: number;
    readonly alpha?: number;
    readonly sizeRatio?: number;
    readonly anchor?: InsetAnchor;
};
/**
 * Raster image attached to a node. Mirrors the canvas-level `kind: 'image'`
 * `ShapeFillLayer` field-for-field. Two orthogonal sizing knobs:
 *
 * - `fit` (default `'cover'`) — `'cover'` scales by `max(...)` and fully
 *   covers the silhouette's AABB (may crop on the cross-axis);
 *   `'contain'` scales by `min(...)` and fully fits, leaving the
 *   cross-axis margin transparent (the underlying `bgFill` reads
 *   through; the texture sampler is pinned to `clamp-to-edge` so the
 *   margin doesn't tile).
 * - `padding` (default `0`) — pixel inset on the silhouette before fit
 *   math runs. The silhouette is re-traced at that inset for the image
 *   layer only, so the gap between full and inset silhouette paints
 *   from layers underneath (typically a `solid` `bgFill`). Useful when
 *   the host silhouette is more restrictive than its AABB (circle,
 *   polygon, star, arc) and texture corners would otherwise clip
 *   against the curve.
 */
interface NodeImage {
    readonly url: string;
    readonly alpha?: number;
    readonly fit?: 'cover' | 'contain';
    readonly padding?: number;
}
/**
 * Anchor point on the host node where a badge attaches. The eight cardinal
 * names address the midpoints / corners of the host's axis-aligned bounding
 * box; the `{ x, y }` variant pins to an explicit world point and is rarely
 * needed (use {@link NodeBadge.offsetX} / `offsetY` to nudge an enum anchor
 * before reaching for raw coordinates).
 */
type BadgePlacement = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top' | 'bottom' | 'left' | 'right' | {
    readonly x: number;
    readonly y: number;
};
/**
 * Point on the badge's own AABB that lands at the host anchor.
 *
 * - The eight cardinal names mirror {@link BadgePlacement} (without the
 *   custom `{x, y}` variant — origin is always a named point on the badge).
 * - `'center'` centres the badge on the host anchor — yields the classic
 *   "half-overhanging" notification-bubble look.
 *
 * When omitted, the projection defaults to the **mirror** of `placement`
 * (e.g. `placement: 'top-right'` → origin `'bottom-left'`) so the badge
 * sits fully outside the host edge.
 */
type BadgeOrigin = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top' | 'bottom' | 'left' | 'right' | 'center';
/**
 * Host-modulation effects on a badge. Re-exports the {@link NodeEffects}
 * surface because a badge is rendered as a shape under the hood — the same
 * `shake` / `breathing` / future shape-effect kinds apply field-for-field.
 */
type BadgeEffects = NodeEffects;
/**
 * Small overlay attached to a node — e.g. notification dot, count chip,
 * status indicator. A badge is rendered as a real shape, so it inherits the
 * full shape surface: any registered {@link NodeShapeOptions} kind as the
 * plate, optional {@link NodeIcon} as content, optional label text, plus
 * nested {@link decorations} / {@link effects} that compose exactly the way
 * they do on a node body.
 *
 * Position resolves from the host's AABB + the `placement` anchor + an
 * `origin` (which point of the badge sits at the anchor — defaults to the
 * mirror of `placement` so the badge nests fully outside the host edge).
 * Use `'center'` for the half-overhanging notification-bubble look.
 */
interface NodeBadge {
    /**
     * Stable id within the node, for keyed updates / state-overlay diffing.
     * When omitted, identity falls back to the badge's position in the
     * containing `badges[]` array.
     */
    readonly id?: string;
    /** Anchor point on the host node's AABB, or an explicit world point. */
    readonly placement: BadgePlacement;
    /**
     * Which point of the badge's own AABB lands at the host anchor.
     * Default: mirror of `placement` (badge sits fully outside the host edge).
     * Use `'center'` for the half-overhanging look.
     */
    readonly origin?: BadgeOrigin;
    /**
     * Pure geometry — any registered {@link NodeShapeOptions} kind. Fill /
     * stroke / alpha come from the flat sugar fields below, mirroring the
     * `NodeStyle.shape` + `bgFill` split used for node bodies.
     */
    readonly shape: NodeShapeOptions;
    /** Solid plate colour — projects to the badge shape's first fill layer. */
    readonly fill?: number;
    readonly alpha?: number;
    readonly strokeColor?: number;
    readonly strokeWidth?: number;
    /**
     * Vector inset rendered inside the badge plate (glyph / svg / svg-url).
     * Projects to an extra fill layer stacked on top of the solid plate.
     */
    readonly icon?: NodeIcon;
    /**
     * Optional short text rendered centred on the badge (count "3", "!").
     * Projects to a `'label'` decoration on the badge.
     */
    readonly labelText?: string;
    readonly labelColor?: number;
    readonly labelFontSize?: number;
    /** Pixel offset applied after placement resolution. */
    readonly offsetX?: number;
    readonly offsetY?: number;
    readonly zIndex?: number;
    /**
     * Decorations attached to the badge plate. Each entry is a regular
     * {@link NodeDecorationSpec} — glow, ring, marching-ants, pulse-ring, etc.
     * Identity / merge rules match {@link NodeStyle.decorations} (id-keyed,
     * `remove: true` drops earlier same-id entries from base under a state
     * overlay).
     */
    readonly decorations?: readonly NodeDecorationSpec[];
    /**
     * Effects modulating the badge plate's transform / style each frame
     * (`shake`, `breathing`, …). Same surface as {@link NodeStyle.effects}.
     */
    readonly effects?: BadgeEffects;
}
/**
 * Anchor point along an edge's routed path.
 *
 * - `'start'` / `'end'` — anchored *near* the source / target endpoint with
 *   automatic clearance: the badge is shifted tangentially by its own
 *   half-extent so it kisses the endpoint node's silhouette from outside
 *   rather than half-overlapping it. The natural choice for endpoint
 *   chips, status icons, etc.
 * - `'middle'` — exact arc-length midpoint (`t = 0.5`).
 * - A `number` in `[0, 1]` — raw arc-length `t`, no clearance applied.
 *   Use `placement: 1` when you explicitly want a badge centred on the
 *   silhouette point. Values outside `[0, 1]` are clamped.
 *
 * `'middle'` (not `'center'`) avoids term-clashing with `BadgeOrigin`
 * where `'center'` means "centre the badge on its own AABB".
 */
type EdgeBadgePlacement = 'start' | 'middle' | 'end' | number;
/**
 * Small overlay attached to an edge — e.g. flow-rate chip on the midpoint,
 * count badge at the source endpoint, arrow-tag at the target. A badge is
 * rendered as a real shape (any registered {@link NodeShapeOptions} kind);
 * placement is parametric along the routed path.
 *
 * Position resolves via `samplePathAt(path, t)` so the badge re-anchors
 * automatically when the path changes (source / target shape moves, anchor
 * / router / waypoints change). For loop edges, `'middle'` naturally lands
 * on the loop apex because the path passes through it at `t ≈ 0.5`.
 *
 * Decorations and effects compose exactly the way they do on
 * {@link NodeBadge}; the badge being shape-rendered means shape decorations
 * (`glow`, `ring`, `marching-ants`, `pulse-ring`, …) apply uniformly.
 */
interface EdgeBadge {
    /**
     * Stable id within the edge, for keyed updates / state-overlay diffing.
     * When omitted, identity falls back to the badge's position in the
     * containing `badges[]` array.
     */
    readonly id?: string;
    /** Where along the routed path the badge attaches. */
    readonly placement: EdgeBadgePlacement;
    /**
     * Which point of the badge's own AABB lands at the path anchor.
     * Default for edge badges is `'center'` — the badge centres on the path
     * point. Use other origins to lift the badge off the line (e.g.
     * `origin: 'bottom'` puts the badge above the line with its bottom edge
     * touching the path).
     */
    readonly origin?: BadgeOrigin;
    /**
     * Pure geometry — any registered {@link NodeShapeOptions} kind. Fill /
     * stroke / alpha come from the flat sugar fields below, mirroring the
     * `NodeStyle.shape` + `bgFill` split used for node bodies.
     */
    readonly shape: NodeShapeOptions;
    /** Solid plate colour — projects to the badge shape's first fill layer. */
    readonly fill?: number;
    readonly alpha?: number;
    readonly strokeColor?: number;
    readonly strokeWidth?: number;
    /**
     * Vector inset rendered inside the badge plate (glyph / svg / svg-url).
     * Projects to an extra fill layer stacked on top of the solid plate.
     */
    readonly icon?: NodeIcon;
    /**
     * Optional short text rendered centred on the badge (count "3", "!").
     * Projects to a `'label'` decoration on the badge.
     */
    readonly labelText?: string;
    readonly labelColor?: number;
    readonly labelFontSize?: number;
    /**
     * Shift the path-anchor along the local tangent (positive = forward
     * toward `'end'`, negative = backward toward `'start'`). Useful for
     * nudging a `'middle'`-anchored badge sideways without changing `t`.
     */
    readonly pathOffset?: number;
    /** Pixel offset applied after placement resolution. */
    readonly offsetX?: number;
    readonly offsetY?: number;
    /**
     * When `true`, the badge rotates to follow the path tangent at the
     * anchor point. Default `false` (badges stay axis-aligned). Useful for
     * arrow-shaped or directional badges on curved edges.
     */
    readonly autoRotate?: boolean;
    /**
     * When {@link autoRotate} is `true`, flip the badge by 180° on the
     * "downward" half of the path so text decorations stay readable on
     * every edge orientation. Default `true`. Ignored when `autoRotate` is
     * `false`.
     */
    readonly keepUpright?: boolean;
    readonly zIndex?: number;
    /**
     * Decorations attached to the badge plate. Same surface as
     * {@link NodeBadge.decorations} — shape decorations (`glow`, `ring`,
     * `marching-ants`, `pulse-ring`) apply because the badge is itself a
     * shape, regardless of being hosted on a connector.
     */
    readonly decorations?: readonly NodeDecorationSpec[];
    /**
     * Effects modulating the badge plate's transform / style each frame
     * (`shake`, `breathing`, …). Same surface as
     * {@link NodeBadge.effects}.
     */
    readonly effects?: BadgeEffects;
}
/**
 * Common fields on every entry in a `decorations[]` array. The `id` gives
 * stable diff identity (state overlays can re-declare the same id to
 * override, or set `remove: true` to drop a base-level decoration while a
 * state is active). When `id` is absent, identity falls back to `kind + array index`.
 */
interface DecorationSpecCommon {
    /** Stable id for diffing. Optional — falls back to `kind#<index>` when absent. */
    readonly id?: string;
    /**
     * When `true`, this entry instructs the resolver to drop any earlier-
     * precedence decoration with the same `id`. Use it in a state overlay to
     * temporarily remove a base-level decoration while the state is active.
     */
    readonly remove?: boolean;
}
/**
 * Discriminated union of decoration specs attachable to a node via
 * {@link NodeStyle.decorations}. Each variant pairs `kind` (the registered
 * canvas decoration name) with the matching style payload from
 * `@invana/canvas`.
 *
 * Multiples are allowed — the same kind can appear several times (e.g. an
 * inner + outer ring on a single node), as long as their `id`s differ.
 * `label` is intentionally absent — labels are managed by the flat
 * `labelText` / `label*` fields on `NodeStyle`, not by the decorations
 * array.
 */
type NodeDecorationSpec = (DecorationSpecCommon & {
    readonly kind: 'ring';
} & RingDecorationStyle) | (DecorationSpecCommon & {
    readonly kind: 'glow';
} & GlowDecorationStyle) | (DecorationSpecCommon & {
    readonly kind: 'pulse-ring';
} & PulseRingDecorationStyle) | (DecorationSpecCommon & {
    readonly kind: 'marching-ants';
} & MarchingAntsDecorationStyle) | (DecorationSpecCommon & {
    readonly kind: 'liquid-fill';
} & LiquidFillDecorationStyle) | (DecorationSpecCommon & {
    readonly kind: 'toggle';
} & ToggleDecorationStyle) | (DecorationSpecCommon & {
    readonly kind: 'resize-handle';
} & ResizeHandleDecorationStyle) | (DecorationSpecCommon & {
    readonly kind: 'selection-frame';
} & SelectionFrameDecorationStyle);
/**
 * Discriminated union of decoration specs attachable to an edge via
 * {@link EdgeStyle.decorations}. Mirrors {@link NodeDecorationSpec} for
 * the connector-target decoration registry. `label-connector` is excluded
 * for the same reason `label` is — labels live on the flat label fields.
 */
type EdgeDecorationSpec = (DecorationSpecCommon & {
    readonly kind: 'ring-connector';
} & RingConnectorDecorationStyle) | (DecorationSpecCommon & {
    readonly kind: 'glow-connector';
} & GlowConnectorDecorationStyle) | (DecorationSpecCommon & {
    readonly kind: 'marching-ants-connector';
} & MarchingAntsConnectorDecorationStyle) | (DecorationSpecCommon & {
    readonly kind: 'ripple-connector';
} & RippleConnectorDecorationStyle) | (DecorationSpecCommon & {
    readonly kind: 'fly-marker-connector';
} & FlyMarkerConnectorDecorationStyle) | (DecorationSpecCommon & {
    readonly kind: 'flow-particles-connector';
} & FlowParticlesConnectorDecorationStyle) | (DecorationSpecCommon & {
    readonly kind: 'reveal-connector';
} & RevealConnectorDecorationStyle);
/**
 * Host-modulation effects on a node (sibling of decorations). Effects don't
 * add geometry — they modulate the host's transform (`shake`, `breathing`) or
 * its style channels (tint / alpha, e.g. `'fade-in'`). **One spec per kind**,
 * so the key *is* the renderer slot: `{ shake: { amplitude: 2 } }` mounts the
 * registered `'shake'` effect with that style.
 *
 * ### Resolution
 *
 * The layer merges this dict across every contributing scope, in the same
 * precedence order it uses for {@link NodeStyle.decorations} — layer template
 * (`NodeOption.style`), then the per-node `style`, then each active state's
 * overlay. Later scopes win *per kind*, so a state overlay can retune one
 * effect without disturbing the others.
 *
 * - `undefined` (key absent) — this scope says nothing; an earlier scope's
 *   entry survives.
 * - `null` — **explicit removal**. The effects analogue of a decoration's
 *   `remove: true`: a higher-precedence scope drops an effect an earlier one
 *   set. An effect that arrives from a `state` overlay is retired
 *   automatically when that state clears.
 *
 * An unregistered `kind`, or one whose registered target is `'connector'`,
 * throws from the renderer rather than being ignored — the same contract as
 * a decoration `kind`.
 *
 * @example
 * ```ts
 * // Layer template: every node in the `error` state breathes.
 * node: { state: { error: { effects: { breathing: { amplitude: 0.2 } } } } }
 * ```
 */
interface NodeEffects {
    readonly shake?: unknown | null;
    readonly breathing?: unknown | null;
    readonly [kind: string]: unknown | null | undefined;
}
/**
 * Connector-side sibling of {@link NodeEffects} — host-modulation effects on
 * an edge. Identical dict semantics (one spec per kind, key = renderer slot,
 * `null` removes, merged across layer template → per-edge → active states).
 *
 * The registered connector effects are `'breathing-connector'` and
 * `'fade-in-connector'`; a shape-only kind such as `'shake'` throws when the
 * host is a connector.
 *
 * @example
 * ```ts
 * edge: { style: { effects: { 'fade-in-connector': { durationMs: 320 } } } }
 * ```
 */
interface EdgeEffects {
    readonly 'breathing-connector'?: unknown | null;
    readonly 'fade-in-connector'?: unknown | null;
    readonly [kind: string]: unknown | null | undefined;
}
/**
 * Marks a node as a **compound group** — a visual frame drawn behind its
 * descendants (children point to it via `parentId`). The presence of this
 * field on a node's resolved {@link NodeStyle} is the only signal the layer
 * uses to decide whether to apply group semantics; the structural shape
 * (`style.shape`) stays a regular `rect` / `circle` / etc.
 *
 * Group semantics, in summary:
 *
 * Whether a frame is open or closed is **not** part of these options — it's
 * the {@link COLLAPSED_STATE} node state (`store.setNodeState(id,
 * 'collapsed')`, or `states: ['collapsed']` in the data to start closed).
 * These options describe the frame itself; the state describes its condition,
 * and `state.collapsed` overlays describe how it looks in that condition.
 *
 * - **Expanded** (the `collapsed` state absent):
 *   - The node renders behind its children — z-index pushed underneath when
 *     `behindChildren !== false`, and into the `'backdrop'` paint plane so the
 *     frame sits below its members' connectors too
 *     (`docs/rfcs/fix/2026-08-05-group-frame-occludes-edges.md`).
 *   - **It is still hit-tested like any other node.** `plane` and `zIndex`
 *     govern painting, not picking (`BaseShapeSpec.plane` says so outright),
 *     and the frame is indexed by `PickingIndex` on the same terms as a card.
 *     That is deliberate — it is what lets `DragNodeBehaviour` translate a
 *     group by its frame, `NodeResizeBehaviour` mount handles on it, and
 *     `CollapseExpandBehaviour` close it on a double-click.
 *
 *     The cost is that with `autoFit` most of a frame's area is *uncovered*,
 *     so a pointer in the padding or between two children resolves to the
 *     frame — which reads wrong for a backdrop, and with an `inactiveState`
 *     lets a stray hover dim the whole graph.
 *
 *     **So hover and click-select decline an expanded frame by default**
 *     (`excludeGroups: 'expanded'` on both). A frame is scenery in every graph
 *     that draws one, and the layer already knows which nodes are frames, so
 *     no graph has to name its own. Set `excludeGroups: 'never'` on either
 *     behaviour to opt a diagram back in — hovering a frame to raise its
 *     members is a real design, and that is how to ask for it. Scenery that
 *     *isn't* a group still opts out by type, via
 *     `HoverActivateBehaviourOptions.excludeNodeTypes` /
 *     `ClickSelectBehaviourOptions.excludeNodeTypes`.
 *
 *     Either way the frame stays **picked**: declining *input* rather than
 *     removing it from *picking* is what keeps drag / resize / collapse
 *     working, and it is why no other behaviour is affected. A **collapsed**
 *     frame is excluded by neither default — it is the only visible stand-in
 *     for the members it hides. See
 *     `docs/rfcs/fix/2026-09-21-group-frames-hover-and-select-as-nodes.md`
 *     and
 *     `docs/rfcs/feat/2026-09-22-a-group-frame-is-scenery-but-every-graph-must-say-so.md`.
 *   - With `autoFit: true`, the layer recomputes `width` / `height` (rect)
 *     or `radius` (circle) every flush from the children's bounding box,
 *     plus `padding` and optional `headerHeight`. The declared `width` /
 *     `height` / `radius` fields act as a **lower bound** in this mode.
 *   - With `autoFit: false`, the layer uses the declared `width` / `height`
 *     / `radius` literally; children may visually leak outside.
 *
 * - **Collapsed** (the {@link COLLAPSED_STATE} state active):
 *   - The node renders as a normal interactive node (`hittable: true`,
 *     default z-order). All descendants are hidden from the renderer; edges
 *     pointing at a hidden descendant are re-routed to the nearest visible
 *     collapsed-group ancestor at render time (no mutation to the edge data).
 *   - Auto-fit is skipped and the resolved shape closes to its own minimal
 *     form (`ShapeCtor.collapsedOf` — a `tabbed-rect` becomes its tab; a
 *     `rect` / `circle` has none and keeps its declared size). Author
 *     `state.collapsed.shape` to describe the closed silhouette yourself
 *     instead — declaring a shape there opts out of the minimal form.
 *   - The `+`/`−` toggle is rendered via the {@link ToggleDecorationStyle}
 *     decoration on the group — wire up `CollapseExpandBehaviour` to make the
 *     toggle clickable. A count of the hidden descendants is available too,
 *     opt-in via {@link GroupOptions.showCollapsedCount}.
 *
 * Nested groups fall out of the `parentId` chain for free: a group node
 * whose own `parentId` points at another group becomes a sub-group; the
 * recompute walks deepest-first.
 *
 * Membership uses the existing `GraphNode.parentId` (single hierarchy field
 * shared with tree structures) — no separate group-membership concept.
 */
interface GroupOptions {
    /**
     * When `true`, the frame's size tracks the bounding box of its direct
     * children (computed every flush). When `false`, the declared `width` /
     * `height` / `radius` are used verbatim. Default `false`.
     */
    readonly autoFit?: boolean;
    /**
     * When `true`, `GroupResizeBehaviour` mounts corner / radial handle
     * decorations on this group and lets the user drag to resize. Composes
     * with `autoFit` per the floor rule on `width` / `height` / `radius`.
     * Default `false`.
     */
    readonly userResizable?: boolean;
    /** Inset around the children bbox before the frame outline. Default `16`. */
    readonly padding?: number;
    /**
     * Show the number of hidden descendants, as white bold text in the middle of
     * the collapsed frame. Default `false`.
     *
     * Off by default because the label is placed `inside-center`, and on a
     * `tabbed-rect` inside placements route into the **tab** — so the count
     * lands on top of the group's own title. Turn it on for frames whose title
     * is elsewhere (or absent). For a corner badge instead, leave this off and
     * set `countBadge` on `CollapseExpandBehaviour`.
     */
    readonly showCollapsedCount?: boolean;
    /**
     * Frame renders at `style.zIndex − 1` so descendants paint on top. Set to
     * `false` to keep the frame at its declared z-index (and let descendants
     * paint underneath when their z-index is lower). Default `true`.
     */
    readonly behindChildren?: boolean;
    /**
     * Height (px) of the band reserved above the children bbox for the
     * group's title. Default `0`.
     *
     * How it *draws* depends on the frame's shape kind:
     *
     * - `kind: 'rect'` / `'circle'` — nothing is drawn. The band only shifts
     *   the auto-fit recompute so a label placed at the top doesn't collide
     *   with the children underneath it.
     * - `kind: 'tabbed-rect'` — the band becomes the frame's **tab**: it's
     *   the folder's title flag, sitting above the body rather than inside
     *   it, and the title renders in it.
     */
    readonly headerHeight?: number;
    /**
     * Width of a `tabbed-rect` frame's tab. Ignored by other shape kinds.
     *
     * Leave it unset (the default) to **auto-size the tab to the title** — the
     * layer measures the group's resolved `labelText` in its resolved font and
     * hands the size to the shape, which decides what to do with it
     * (`ShapeCtor.fitToContent`). That's what keeps a row of frames with
     * differently-sized titles looking consistent without per-frame tuning.
     * Set it to pin every tab to the same width instead.
     */
    readonly tabWidth?: number;
    /**
     * Horizontal breathing room between the title and each end of an
     * auto-sized tab. Default `10`. Ignored when {@link tabWidth} is set.
     */
    readonly tabPadding?: number;
    /** Which side of the frame the tab hugs. Default `'left'`. */
    readonly tabAlign?: 'left' | 'center' | 'right';
    /** Gap between the {@link tabAlign} edge and the tab. Default `0`. */
    readonly tabOffset?: number;
    /**
     * Horizontal run of the tab's angled side — the taper that reads as a
     * folder tab rather than a box. Default `0` (square). The auto-sizing in
     * {@link tabWidth} adds this on top of the measured title, so leaning the
     * tab never squeezes the text.
     */
    readonly tabSkew?: number;
    /**
     * Floor (with `autoFit`) or fixed (without) width. Rect frames only.
     * Ignored for circle frames.
     */
    readonly width?: number;
    /** Sibling of {@link width} for `kind: 'rect'`. */
    readonly height?: number;
    /**
     * Floor (with `autoFit`) or fixed (without) radius. Circle frames only.
     * Ignored for rect frames.
     */
    readonly radius?: number;
    /**
     * Where the auto-attached `+` / `−` toggle sits relative to the group's
     * frame. Two forms:
     *
     * - **Keyword** — one of the {@link TogglePlacement} aliases
     *   (`'bottom'`, `'inside-bottom'`, `'top-right'`, `'bottom-left'`, …).
     *   Resolved against the host's AABB by the toggle decoration.
     * - **Shape-local coords** — `{ x, y }`, an absolute point inside the
     *   host shape's local frame (centre-relative for `circle`, top-left-
     *   relative for `rect`). Use this when none of the keywords place the
     *   toggle where you want it (diagonal offsets, mock-specific spots).
     *
     * Default `'bottom'` — centred just below the silhouette, matching the
     * "small bubble attached to the rim" pattern in the reference UI.
     * Clicks are dispatched at the canvas level by `CollapseExpandBehaviour`,
     * so the toggle remains clickable regardless of whether the resolved
     * position falls inside or outside the host's hit area.
     */
    readonly togglePlacement?: TogglePlacement | {
        readonly x: number;
        readonly y: number;
    };
    /**
     * Draw the `+` / `−` toggle button on this frame. Default `true`.
     *
     * `false` mounts no button, so the frame shows no expand / collapse
     * affordance — it reads as a plain container. The group can still be
     * toggled another way: a double-click on the frame
     * (`CollapseExpandBehaviour.doubleClickToToggle`) or the store API. To make
     * a frame not collapsible at all, disable the behaviour instead.
     */
    readonly showToggle?: boolean;
}
/**
 * Visual + structural style for a node. Flat-prefixed scalars for orthogonal
 * properties (`bgFill`, `bgStrokeWidth`, `labelColor`); polymorphic values
 * kept structured (`shape`, `icon`, `image`, `decorations`, `effects`,
 * `badges`).
 *
 * Per-instance state overlays for a node live at `GraphNode.state`
 * (a sibling of `style`), NOT inside `NodeStyle`.
 */
interface NodeStyle {
    readonly shape?: NodeShapeOptions;
    /**
     * Unified normalized size. When set, overrides the resolved `shape`'s
     * intrinsic size fields at style-resolution time (before the spec reaches
     * the renderer, `boundsOfNode`, or any layout's bounds query). Per-kind
     * mapping:
     *
     * - `circle` / `regular-polygon` — `shape.radius = size`
     * - `rect` — `shape.width = shape.height = 2 * size`
     * - `arc` — `shape.outerR = size` (and `shape.innerR` scaled so its ratio
     *   to `outerR` is preserved)
     * - `star` — `shape.outerRadius = size` (and `shape.innerRadius` scaled to
     *   preserve its ratio)
     * - `polygon` / custom — no canonical size axis; `size` is ignored
     *
     * Honoured uniformly by `boundsOfNode`, `D3ForceLayout` (collide.radius
     * receives the `GraphNode` and reads the normalized `shape.radius` via
     * `resolveNodeStyle`), and `ElkLayout` (reads bounds via `boundsOfNode`).
     * Use this when a single number should drive a node's footprint regardless
     * of which shape kind it renders as — e.g. degree-based sizing,
     * data-driven scaling.
     */
    readonly size?: number;
    /**
     * Marks this node as a compound group (visual frame drawn behind its
     * descendants). See {@link GroupOptions} for the full contract — autoFit
     * vs userResizable, expanded vs collapsed semantics, header band, edge
     * re-routing.
     *
     * Presence of this field is the only discriminator. The structural shape
     * (`shape: { kind: 'rect' | 'circle' }`) is unchanged; groups reuse the
     * same primitives as regular nodes.
     */
    readonly group?: GroupOptions;
    /**
     * When `true`, `NodeResizeBehaviour` mounts corner-handle decorations on
     * this node (rect / circle only) and lets the user drag to resize. The
     * drag writes back to `style.shape.width` / `height` / `radius` directly
     * (and `position` for non-corner-anchored rect drags). Independent from
     * `style.group?.userResizable`, which targets group frames specifically
     * — but both are honoured by the same behaviour, so a single registered
     * `NodeResizeBehaviour` handles every resizable node in the layer.
     */
    readonly resizable?: boolean;
    /**
     * Accepts every `ShapeFillLayer` kind — `solid` / `image` / `glyph` /
     * `svg` / `svg-url` — and arrays for stacked layers. The `image` kind
     * doubles as silhouette filler and inset content via its `fit` field
     * (`'inset'` vs the silhouette modes).
     */
    readonly bgFill?: ShapeFill;
    readonly bgAlpha?: number;
    readonly bgStrokeColor?: number;
    readonly bgStrokeAlpha?: number;
    readonly bgStrokeWidth?: number;
    readonly bgStrokeAlignment?: 'inside' | 'center' | 'outside';
    readonly bgStrokeDashArray?: readonly [number, number];
    readonly bgStrokeDashOffset?: number;
    readonly bgStrokeCap?: 'butt' | 'round' | 'square';
    readonly bgStrokeJoin?: 'miter' | 'round' | 'bevel';
    readonly icon?: NodeIcon;
    readonly image?: NodeImage;
    readonly labelText?: string;
    readonly labelColor?: number;
    readonly labelFontSize?: number;
    readonly labelFontFamily?: string;
    readonly labelFontWeight?: number | string;
    readonly labelFontStyle?: 'normal' | 'italic';
    readonly labelAlign?: 'left' | 'center' | 'right';
    readonly labelLineHeight?: number;
    readonly labelLetterSpacing?: number;
    readonly labelPlacement?: ShapeLabelPlacement;
    readonly labelOffsetX?: number;
    readonly labelOffsetY?: number;
    readonly labelAlpha?: number;
    readonly labelMinFontSize?: number;
    /** Radians. */
    readonly labelRotation?: number;
    /** Hide the label below this camera zoom level. */
    readonly labelMinZoom?: number;
    /** Hide the label above this camera zoom level. */
    readonly labelMaxZoom?: number;
    /** Collision priority — higher wins when two labels overlap. */
    readonly labelPriority?: number;
    /** Collision partition — labels in different groups never compete. */
    readonly labelCollisionGroup?: string;
    /** Bypass collision entirely — label always renders. */
    readonly labelForceShow?: boolean;
    readonly labelBackgroundFill?: number;
    readonly labelBackgroundAlpha?: number;
    readonly labelBackgroundStrokeColor?: number;
    readonly labelBackgroundStrokeWidth?: number;
    readonly labelBackgroundPadding?: number;
    readonly labelBackgroundCornerRadius?: number;
    /**
     * Escape hatch — full `ShapeLabelStyle` payload from `@invana/canvas`.
     * Use this when the flat `label*` fields don't cover the case (wrap,
     * html-text content, custom collision settings, etc.). When set, the
     * adapter uses this payload verbatim instead of building one from the
     * flat fields. Flat label fields are ignored on the same node.
     */
    readonly labelStyle?: ShapeLabelStyle;
    readonly badges?: readonly NodeBadge[];
    /**
     * Ordered list of decorations attached to the node. Each entry's `kind`
     * names a registered canvas decoration; the rest of the entry is that
     * decoration's style payload. See {@link NodeDecorationSpec}.
     *
     * The resolver concatenates this array across base style + every active
     * state's overlay, then dedupes by `id` (later precedence wins). Use
     * `remove: true` in a higher-precedence overlay to drop an earlier entry
     * with the same id while a state is active.
     */
    readonly decorations?: readonly NodeDecorationSpec[];
    readonly effects?: NodeEffects;
}
/**
 * Resolver-aware mirror of {@link NodeStyle}. Each field is either a static
 * value or `(D) => T`. Two scopes use this generic at different `D`:
 *
 *   - `NodeOption.style` — resolvers fire at render (`D` = stored `GraphNode`).
 */
type ResolvableNodeStyle<D = unknown> = {
    readonly [K in keyof NodeStyle]?: Resolvable<NonNullable<NodeStyle[K]>, D>;
};
/**
 * Layer-level node template — G6's `node` field on GraphOptions. Resolvers
 * fire every frame against the stored `GraphNode`.
 *
 * No `animation` field — per [[feedback_decoration_vs_animation]], animation
 * is the per-frame engine, not a node-level config. Decoration / effect
 * attachments live on `NodeStyle.decorations` / `NodeStyle.effects`.
 */
interface NodeOption {
    /** Type tag this template defines (e.g. 'person', 'doc'). Optional. */
    readonly type?: string;
    readonly style?: ResolvableNodeStyle<GraphNode>;
    readonly state?: Readonly<Record<string, ResolvableNodeStyle<GraphNode>>>;
    /** Reserved for palette-driven theming. Deferred wiring. */
    readonly palette?: unknown;
}
/** Arrowhead shape catalogue. */
type ArrowShape = 'triangle' | 'diamond' | 'circle' | 'none';
/**
 * Structural variant of an edge — the three-stage connector pipeline
 * (anchor → router → pathStyle). Variant-specific params live inside
 * `pathStyleOpts`, so this stays non-discriminated.
 */
interface EdgeShapeOptions {
    readonly pathType?: EdgePathType;
    readonly sourceAnchor?: EdgeAnchor;
    readonly targetAnchor?: EdgeAnchor;
    readonly sourceAnchorOpts?: Readonly<Record<string, unknown>>;
    readonly targetAnchorOpts?: Readonly<Record<string, unknown>>;
    readonly pathStyleOpts?: Readonly<Record<string, unknown>>;
    readonly waypoints?: ReadonlyArray<{
        readonly x: number;
        readonly y: number;
    }>;
}
/**
 * Flat-prefixed style bag for an edge. Edges have one stroke (the path), so
 * stroke fields are unprefixed. Arrow ends and label keep their distinct
 * prefixes.
 */
interface EdgeStyle {
    readonly shape?: EdgeShapeOptions;
    readonly strokeColor?: number;
    readonly strokeAlpha?: number;
    readonly strokeWidth?: number;
    readonly strokeAlignment?: 'inside' | 'center' | 'outside';
    readonly strokeDashArray?: readonly [number, number];
    readonly strokeDashOffset?: number;
    readonly strokeCap?: 'butt' | 'round' | 'square';
    readonly strokeJoin?: 'miter' | 'round' | 'bevel';
    readonly arrowSourceShape?: ArrowShape;
    readonly arrowSourceSize?: number;
    readonly arrowSourceColor?: number;
    readonly arrowSourceAlpha?: number;
    readonly arrowTargetShape?: ArrowShape;
    readonly arrowTargetSize?: number;
    readonly arrowTargetColor?: number;
    readonly arrowTargetAlpha?: number;
    readonly labelText?: string;
    readonly labelColor?: number;
    readonly labelFontSize?: number;
    readonly labelFontFamily?: string;
    readonly labelFontWeight?: number | string;
    readonly labelFontStyle?: 'normal' | 'italic';
    readonly labelAlign?: 'left' | 'center' | 'right';
    readonly labelLineHeight?: number;
    readonly labelLetterSpacing?: number;
    readonly labelPlacement?: ConnectorLabelPlacement;
    readonly labelPathOffset?: number;
    readonly labelAutoRotate?: boolean;
    readonly labelKeepUpright?: boolean;
    readonly labelOffsetX?: number;
    readonly labelOffsetY?: number;
    readonly labelAlpha?: number;
    readonly labelMinFontSize?: number;
    /** Hide the label below this camera zoom level. */
    readonly labelMinZoom?: number;
    /** Hide the label above this camera zoom level. */
    readonly labelMaxZoom?: number;
    /** Collision priority — higher wins when two labels overlap. */
    readonly labelPriority?: number;
    /** Collision partition — labels in different groups never compete. */
    readonly labelCollisionGroup?: string;
    /** Bypass collision entirely — label always renders. */
    readonly labelForceShow?: boolean;
    readonly labelBackgroundFill?: number;
    readonly labelBackgroundAlpha?: number;
    readonly labelBackgroundStrokeColor?: number;
    readonly labelBackgroundStrokeWidth?: number;
    readonly labelBackgroundPadding?: number;
    readonly labelBackgroundCornerRadius?: number;
    /**
     * Escape hatch — full `ConnectorLabelStyle` payload from `@invana/canvas`.
     * Use this when the flat `label*` fields don't cover the case (wrap,
     * html-text content, etc.). When set, the adapter uses this payload
     * verbatim instead of building one from the flat fields.
     */
    readonly labelStyle?: ConnectorLabelStyle;
    /**
     * Ordered list of decorations attached to the edge. Each entry's `kind`
     * names a registered canvas connector-decoration; the rest is that
     * decoration's style payload. See {@link EdgeDecorationSpec}.
     *
     * Resolver semantics match {@link NodeStyle.decorations}: concatenate
     * across base + active state overlays, dedupe by `id`, later precedence
     * wins.
     */
    readonly decorations?: readonly EdgeDecorationSpec[];
    /**
     * Ordered list of badges attached to the edge. Each entry is a real
     * {@link EdgeBadge} — any registered shape kind as the plate, optional
     * icon / labelText sugar, optional nested decorations and effects.
     * Placement is parametric along the routed path (`'start' | 'middle' |
     * 'end' | number`) and re-anchors automatically when the path changes
     * (source / target shape moves, anchor / router / waypoints change).
     *
     * Resolver semantics match {@link decorations}: concatenate across base
     * + active state overlays, dedupe by `id`, later precedence wins.
     */
    readonly badges?: readonly EdgeBadge[];
    /**
     * Host-modulation effects attached to the edge, keyed by registered
     * connector-effect kind. See {@link EdgeEffects} for the merge and removal
     * semantics; the node-side mirror is {@link NodeStyle.effects}.
     */
    readonly effects?: EdgeEffects;
}
/** Resolver-aware mirror of {@link EdgeStyle}; generic over the resolver argument. */
type ResolvableEdgeStyle<D = unknown> = {
    readonly [K in keyof EdgeStyle]?: Resolvable<NonNullable<EdgeStyle[K]>, D>;
};
/** Layer-level edge template — G6's `edge` field. */
interface EdgeOption {
    readonly type?: string;
    readonly style?: ResolvableEdgeStyle<GraphEdge>;
    readonly state?: Readonly<Record<string, ResolvableEdgeStyle<GraphEdge>>>;
    readonly palette?: unknown;
}
/**
 * Canonical node-state overlays auto-merged into every `GraphLayer`'s
 * `options.node.state` catalogue on construction (unless
 * `GraphLayerOptions.useDefaultStates: false`). Consumer-supplied
 * `options.node.state[name]` entries override individual fields per the
 * normal merge precedence; this map provides the resting visual identity
 * of each canonical state so a layer that touches no state code still
 * gets a sensible hover / select / error ring out of the box.
 *
 * All values are flat NodeStyle fields — extending or overriding is the
 * same shape as any other layer-template state overlay. Decorations are
 * intentionally not declared here so consumers compose them additively
 * (e.g. a ring decoration on hover) without colliding with the canonical
 * stroke treatment below.
 */
declare const DEFAULT_NODE_STATES: Readonly<Record<CanonicalStateName, NodeStyle>>;
/**
 * Canonical edge-state overlays — sibling of {@link DEFAULT_NODE_STATES}.
 * Auto-merged into every `GraphLayer`'s `options.edge.state` catalogue
 * unless `GraphLayerOptions.useDefaultStates: false`.
 */
declare const DEFAULT_EDGE_STATES: Readonly<Record<CanonicalStateName, EdgeStyle>>;
/** Constructor options for `GraphLayer`. */
interface GraphLayerOptions {
    /**
     * Optional pre-built store. If omitted, the layer creates its own with
     * default options (`flushMode: 'sync'`, `unknownEndpoint: 'throw'`). Pass
     * a store you own to share data with other layers / sync code.
     */
    store?: GraphStore;
    /**
     * Initial graph content (`{ nodes, edges }`), loaded when the layer mounts —
     * equivalent to calling `setData` right after mount. The *initial* seed only;
     * the live dataset streams / changes later via `layer.setData(...)` or store
     * mutations. Content, not style — lives here on the layer, not in the
     * serialisable canvas config.
     */
    initData?: GraphData;
    /**
     * Layer-level node template (G6's `node` field). Carries `style` (base
     * appearance) and `state` (catalogue of named overlays applied while a
     * state in `node.states[]` is active). Resolver-aware: every field on
     * `style` / each `state[name]` may be a static value or a function
     * `(node: GraphNode) => value` that fires every render.
     */
    node?: NodeOption;
    /** Sibling of {@link node} for edges. */
    edge?: EdgeOption;
    /**
     * Auto-merge {@link DEFAULT_NODE_STATES} / {@link DEFAULT_EDGE_STATES}
     * into `options.node.state` / `options.edge.state` on construction so
     * every canonical state has a sensible default appearance even when the
     * consumer supplied no state overlays. Consumer entries win on a
     * per-name basis (no per-field deep merge here — declare a full
     * `NodeStyle` if you want to replace a default entry). Default `true`.
     */
    useDefaultStates?: boolean;
    /**
     * Minimum hover/click target in screen pixels, forwarded to the
     * internal `PrimitivesRenderer`. Default `6`.
     *
     * Behaves as a *fallback*: exact geometric hits always win; only
     * when no shape contains the cursor does the dispatcher pick the
     * closest candidate within `hitFloorPx` screen pixels. See
     * `PrimitivesRendererOptions.hitFloorPx` for details.
     */
    hitFloorPx?: number;
    /**
     * Reusable node **structure** templates (skeletons: shape / slots / card
     * rows), keyed by name. Referenced by {@link nodeTypes}. No colours.
     */
    nodeStructureTemplates?: NodeStructureRegistry;
    /**
     * Reusable node **styling** templates (roles + typography), keyed by name.
     * Referenced by {@link nodeTypes}. Roles resolve to numbers against the
     * active theme before the renderer; no hex needed (direct colours allowed).
     */
    nodeStylingTemplates?: NodeStylingRegistry;
    /**
     * Per-node-**type** bindings — each maps a node `type` to a structure +
     * styling template and binds its slots to dotted data paths. A node whose
     * `type` has a binding is resolved through it (card → composite shape,
     * simple → shape + label) on top of the layer-level {@link node} template.
     */
    nodeTypes?: NodeTypeRegistry;
}
/**
 * Layer-level event payloads (separate from store events). Pointer/drag/etc.
 * arrive in later phases; today this is just the aggregated lifecycle.
 */
interface GraphLayerEvents {
    'data:changed': {
        addedNodes: number;
        removedNodes: number;
        updatedNodes: number;
        addedEdges: number;
        removedEdges: number;
        updatedEdges: number;
        /**
         * Nodes whose **explicit** hidden flag was set / cleared in this flush
         * (`hideNodes` / `showNodes` / a delta's `hidden` / `shown`). Visibility
         * derived from a collapsed ancestor or pending placement is not counted.
         */
        hiddenNodes: number;
        shownNodes: number;
    };
    'positions:updated': {
        count: number;
    };
    /**
     * A user-driven node drag began. Behaviours emitting this signal the
     * intent to hold a node's position against any physics / layout that
     * would otherwise move it. Layouts (e.g. `D3ForceLayout`) subscribe and
     * apply a *transient* lock — they MUST NOT mutate the store's
     * `GraphNode.pinned` flag in response, since that is reserved for
     * user-data semantics (permanent pin). The matching `node:drag-end`
     * releases the transient lock.
     *
     * `nodeId` is the *grabbed* node (the gesture's primary). `nodeIds` is the
     * full set of primary nodes being dragged together — `[nodeId]` for a plain
     * single-node drag, or every selected node for a multi-selection drag. Group
     * descendants are NOT listed here; consumers that care about them expand via
     * `store.descendantsOf(id)`.
     */
    'node:drag-start': {
        nodeId: string;
        nodeIds: readonly string[];
    };
    'node:drag-end': {
        nodeId: string;
        nodeIds: readonly string[];
    };
    /**
     * The layer-level style template changed (node / edge defaults or the state
     * catalogue) — emitted by `setNodeDefaults` / `setEdgeDefaults` /
     * `setStateConfigs` (and therefore by any `applyOptions` patch or behaviour
     * that writes the template, e.g. `ColorByBehaviour`). Distinct from
     * `data:changed` (topology / positions). Dependents that mirror resolved
     * styling — e.g. `MiniMapLayer` — subscribe to repaint. See
     * `unified-canvas-options-plan.md` §7.2.
     */
    'style:changed': {
        scope: 'node' | 'edge' | 'state';
    };
    /**
     * A group **container** was hidden/shown as a unit via `hideGroup(s)` /
     * `showGroup(s)` / `toggleGroupHidden`. `hidden` is the container's
     * post-change state; fired once per group whose container actually
     * transitioned (no-op calls emit nothing). A convenience signal for a
     * "hidden groups" panel so it needn't filter every member's store
     * `node:visibility`. It is *not* a cache — read the truth from
     * `isGroupHidden(id)` / `hiddenGroups()`. Note: hiding a container via the
     * per-node `hideNode` (which does not sweep the subtree) emits the store's
     * `node:visibility`, not this — subscribe to both if you must catch every
     * path, or just derive from `hiddenGroups()` on `node:visibility`.
     */
    'group:visibility': {
        groupId: string;
        hidden: boolean;
    };
    [event: string]: unknown;
}

/**
 * `GraphLayer` — `WorldLayer` subclass that renders a `GraphStore` via a
 * `PrimitivesRenderer`. Subscribes to store events and projects them into
 * `addShape` / `addConnector` / `updateShape` / `updateConnector` /
 * `removeShape` / `removeConnector` calls.
 *
 * The store is the source of truth. The layer is a thin projection — no
 * domain data lives here. Re-emits aggregated `data:changed` and
 * `positions:updated` events at the layer level for application code that
 * only cares about visible-graph changes.
 *
 * See `apps/docs/graph/data-model.md` for the data model and
 * `apps/docs/graph/events.md` for the event model.
 */

interface GraphLayerState {
    /** Reserved for hover / selection / decoration state in later phases. */
    readonly _placeholder?: never;
}
declare class GraphLayer extends WorldLayer<GraphLayerOptions, GraphLayerState, GraphLayerEvents, never, WorldLayerHit> {
    /**
     * Pixi-backed primitives renderer; created in `onMount`.
     *
     * Public so behaviours can subscribe to `shape:*` / `connector:*` pointer
     * events on `graph.getRenderer().events`. Returns `undefined` before mount.
     */
    private _renderer?;
    /** Durable spec collection for this layer — see `docs/renderer-split-design.md` §2. */
    private specStore?;
    private projector?;
    /** Renderer accessor for behaviours. Undefined before `onMount`. */
    getRenderer(): IElementRenderer | undefined;
    /**
     * Vector-SVG projection of this layer's nodes + edges — delegates to the
     * internal `PrimitivesRenderer.toSVG()`. Consumed by `Canvas.exportSVG`
     * (duck-typed via the engine's `SvgExportableLayer` contract). Returns `''`
     * before mount. Coverage caveats (raster-only fills, non-label decorations,
     * effects) are documented on `PrimitivesRenderer.toSVG`.
     */
    toSVG(): string;
    /**
     * Per-frame tick — delegated to `PrimitivesRenderer.tickAnimations` so
     * animated decorations (`pulse-ring`, `marching-ants`, …) and the
     * viewport-clipped label-resolution sweep advance every frame.
     *
     * `Canvas.tickOnce` duck-types this hook on each layer; without it the
     * renderer would never tick for graph layers because the field that
     * holds it (`_renderer`) is private and the alternative fallback path
     * looks for a public `renderer` property.
     */
    tickAnimations(deltaMs: number): void;
    /** Data source. Either supplied by the caller or self-created. */
    readonly store: GraphStore;
    /**
     * The **authoritative** schema for this graph, if a data source declared one
     * (delegates to {@link GraphStore.schema}) — typically the full DB schema behind
     * a connected canvas, a superset of what's loaded. `undefined` when none is set;
     * resolve `layer.schema ?? deriveSchema(layer.store)` for authoritative-else-observed.
     */
    get schema(): GraphSchema | undefined;
    /** Set/clear the authoritative schema (delegates to {@link GraphStore.setSchema}). */
    setSchema(schema: GraphSchema | undefined): void;
    /** Subscription disposers, called in `onUnmount`. */
    private subs;
    /**
     * True once the canvas's active layout has reported a run for this canvas.
     * Latches: a layout only owns "nothing has been placed yet" once, at the
     * start of a canvas's life.
     */
    private layoutHasRun;
    /** Pending {@link PLACEMENT_GRACE_MS} timer — see {@link evaluatePlacementPending}. */
    private placementGrace;
    /**
     * Edge ids whose endpoint moved since last flush. The connector path is
     * pinned to shape positions via the `boundary` anchor, but PixiJS doesn't
     * auto-reroute connectors when an anchored shape moves — we drain this set
     * on each store flush and call `updateConnector(eid, {})` to force re-route.
     */
    private dirtyConnectors;
    /**
     * Last-projected collapsed flag per group node id. Read by the
     * `node:update` handler so it can detect a collapse → expand (or
     * expand → collapse) flip — the patch itself doesn't carry the
     * previous style, and the store has already overwritten it by the
     * time the event fires. Updated by {@link syncGroupSyntheticDecorations}
     * on every group render.
     */
    private readonly lastCollapsedByGroup;
    /**
     * Group node ids whose visible frame may need re-projection (auto-fit
     * recompute, descendant visibility change, collapse / expand toggle).
     * Drained per flush in deepest-first order — see {@link drainDirtyGroups}.
     *
     * Populated by store subscriptions when:
     * - a group's own spec changes (add / update with `style.group` patch),
     * - a child's position changes and its parent is a group with `autoFit`,
     * - a child is added / removed from a group.
     *
     * Holding ids (not full snapshots) keeps the bucket idempotent — multiple
     * mutations within a single batch coalesce to one rerender per group.
     */
    private dirtyGroups;
    /**
     * Nodes / edges whose active-state set changed since the last flush — drained
     * once per flush into `rerenderNode` / `rerenderEdge`. Populated from the
     * store's `node:state` / `edge:state` events; the dedup + once-per-flush drain
     * keeps an N-item highlight to ≤1 rebuild per item (mirrors
     * {@link dirtyConnectors}). State itself is owned by the `GraphStore` (presence
     * compartment) — the layer holds none, just reads `store.nodeStatesOf` at
     * render. See `store-owns-state-plan.md` § 0 / § 2.5.
     */
    private readonly dirtyStateNodes;
    private readonly dirtyStateEdges;
    /**
     * Edges whose install was deferred because an endpoint shape wasn't on the
     * renderer yet — see {@link endpointShapesInstalled}. Retried on the next
     * flush (after node adds / re-renders have installed the shapes) and re-
     * deferred if the endpoint is still missing, so an install can never throw
     * and can never be silently lost.
     */
    private readonly deferredEdgeInstalls;
    /**
     * Currently-mounted decoration slot ids per node / edge, so the resolver
     * can diff (mount new / dispose removed / replace changed) against the
     * previous render's set. Slot ids are synthesized from `spec.id` or
     * `${kind}#<index>`. The `'label'` slot is managed separately by
     * `syncNodeLabel` / `syncEdgeLabel` and never appears in these maps.
     */
    private readonly nodeDecorationSlots;
    private readonly edgeDecorationSlots;
    /**
     * Currently-mounted **effect** slots per node / edge, and the style each was
     * mounted with. Effects are keyed by kind (one spec per kind), so the slot id
     * *is* the kind.
     *
     * Unlike {@link nodeDecorationSlots} this tracks the *value*, not just the
     * key, because the effect sync must skip slots whose spec is unchanged:
     * `PrimitivesRenderer.setEffect` disposes and reconstructs the effect on
     * every write, so re-setting an unchanged slot restarts a running animation
     * from its first frame. Harmless for a decoration, fatal for a one-shot fade
     * — any re-render mid-entrance (hover, state toggle, LOD tier change) would
     * reset that node to alpha 0 and fade it in again.
     */
    private readonly nodeEffectSlots;
    private readonly edgeEffectSlots;
    /**
     * Currently-mounted badge slot ids per node, mirroring
     * {@link nodeDecorationSlots} for badge diffing. Slot id falls back to
     * `${badge.placement-name}#<index>` when `NodeBadge.id` is absent so
     * id-less badges stack rather than collapse.
     */
    private readonly nodeBadgeSlots;
    /** Edge-side counterpart of {@link nodeBadgeSlots}. */
    private readonly edgeBadgeSlots;
    private nodeOption;
    private edgeOption;
    private nodeStructures;
    private nodeStylings;
    private nodeTypes;
    /** Current resolved palette (role → number), used to resolve per-type
     * templates. Seeded from the default theme until a theme is published. */
    private themePalette;
    /** Detaches the store from the canvas's operation log; set on mount. */
    private detachLog;
    /** Initial data from `options.initData`, applied once in `onMount`. */
    private readonly initialData;
    constructor(opts: LayerOptions<GraphLayerOptions>);
    protected createState(): GraphLayerState;
    /**
     * Hand the layer's hit floor to the device the surface builds. Graph nodes
     * can be small at low zoom, so this layer raises the pick tolerance above the
     * renderer-wide default.
     */
    protected surfaceOptions(): SurfaceOptions | undefined;
    protected onMount(ctx: CanvasContext): void;
    /**
     * Apply a resolved theme palette to the layer's base look: node label +
     * border, edge stroke + arrowheads + labels, and group-frame fills. Only
     * roles present in the palette are written, so the single-layer shorthand's
     * empty palette is a no-op. Per-type styling templates (Phase B) layer their
     * role-based styling on top of this base.
     */
    private applyTheme;
    /**
     * Resolve a per-type binding into a `NodeStyle` fragment. Card structures
     * compile to a `composite` shape; simple structures to shape + label fields.
     * All colour roles are resolved against the current palette here, so nothing
     * role-shaped reaches the renderer. A missing structure yields no fragment.
     */
    private resolveTypeBinding;
    /**
     * Journal node drags as one `'move'` history entry per gesture: every
     * dragged primary (a multi-selection drag moves them all) plus each one's
     * descendants (a group drag) is snapshot at `node:drag-start`, and the net
     * change is recorded at `node:drag-end` through {@link GraphStore.recordApplied}.
     * Nothing per frame, so layout writes and programmatic moves stay out of
     * history. A drag-end inside an open log group (`DragNodeBehaviour`'s
     * pin-on-release) joins that entry. Returns the unsubscribe.
     */
    private journalNodeDrags;
    protected onUnmount(): void;
    /**
     * Bulk-load nodes + edges, **replacing** any prior data. Wraps the
     * underlying store inserts in a single `batch()` so subscribers see one
     * flush.
     *
     * For streaming consumers (constantly arriving data), use the store
     * directly: `graph.store.addData({ nodes, edges })` appends without
     * clearing, and `graph.store.applyDelta({ added, updated, removed })`
     * applies an incremental change in one batch. All other per-id CRUD
     * (`upsertNode`, `updateNode`, `removeNode`, edge equivalents, `batch`,
     * `flush`, `clear`) lives on `graph.store` — the store is the single
     * source of truth and the layer just orchestrates store → renderer.
     */
    setData(data: GraphData): void;
    /**
     * Load `data` as the **baseline** — the starting state, not a change anyone
     * made. Replaces the graph like {@link setData}, but unrecorded, and clears
     * the canvas's history: entries recorded against the previous data can't be
     * replayed over this one, and Undo right after a load must not empty the
     * graph. What a React root's `data` prop and `options.initData` do (RFC
     * `feat-2026-09-28-an-analysis-cannot-be-recorded-or-replayed`, D-16 / F24).
     *
     * Call {@link setData} instead when the replacement is an edit the user
     * should be able to undo.
     */
    loadData(data: GraphData): void;
    /**
     * Serialise this layer's graph data — every node (with its live position,
     * `pinned` flag, style, states and payload) and every edge — to a plain
     * {@link GraphData} object safe to `JSON.stringify`.
     *
     * Implements the engine's structural `DataSerializableLayer` contract, so
     * `Canvas.exportState()` picks this layer's data up automatically. Round-trips
     * through {@link importData}.
     */
    exportData(): GraphData;
    /**
     * Replace this layer's data from a {@link GraphData} snapshot produced by
     * {@link exportData} — the import half of the `DataSerializableLayer`
     * contract. Delegates to {@link setData}, so the renderer teardown/repaint and
     * dependent-layer notifications all run.
     */
    importData(data: GraphData): void;
    /**
     * Contribute this layer's **serialisable config** to a canvas-state snapshot —
     * the layer-level styling template (`node` / `edge`), the card/structure/
     * styling template registries, and a couple of scalar options. Implements the
     * engine's `DefinitionSerializable` contract, so `Canvas.exportState()` picks
     * it up into `definition.layers[id]` even on a declarative canvas whose options
     * were passed to the constructor.
     *
     * Excludes `store` (a live instance) and `initData` (data is captured
     * separately, positions and all). The result is passed through {@link jsonSafe},
     * so **function-valued style resolvers** (e.g. `labelText: (n) => …`) are
     * dropped — they can't serialise. On import, `setOptions` shallow-merges this
     * slice, preserving any live resolver the serialised template omitted.
     */
    serializeDefinition(): Record<string, unknown> | undefined;
    /**
     * Remove every node and edge — tearing down their rendered shapes /
     * connectors and notifying full-repaint consumers (e.g. `MiniMapLayer`). The
     * canonical way to empty the graph; prefer it over
     * `setData({ nodes: [], edges: [] })`.
     *
     * Note the difference from the low-level `graph.store.clear()`: that is a
     * silent fast-wipe (no events, drops the pending queues), so on its own it
     * would leave the canvas painted and dependent layers stale. This method
     * keeps the renderer and store in sync and fires a single `data:changed`
     * (which `store.clear()` alone never produces, since `doFlush` skips an empty
     * flush) so consumers update immediately rather than on some later event.
     */
    clear(): void;
    /**
     * Force a full re-render of every node and edge from current store state +
     * active states. Does **not** mutate data and is **not** undoable — it is a
     * pure render pass. Use it after an external style/theme change that bypassed
     * the store (e.g. swapping the renderer's palette) or to recover from a
     * suspected render desync. For data edits prefer the store mutators, which
     * re-render the affected items automatically.
     */
    redraw(): void;
    /**
     * Keep hit-testing in step with whole-layer visibility. `WorldLayer` hides the
     * pixi container; graph picking runs through the renderer's own pointer router
     * (not `layer.hitTest`), so a hidden layer would otherwise stay clickable. Gate
     * the renderer's `hitTest` so a hidden layer's nodes/edges are non-interactive
     * too (decision 11 of the visibility plan).
     */
    protected onVisibleChange(value: boolean): void;
    /**
     * Drop every shape / connector this layer has mounted on the renderer and
     * reset transient routing state. Shared by `clear` / `setData`: `store.clear()`
     * is silent, so it never drives the renderer's event-based removal path —
     * the layer must detach explicitly.
     */
    private detachAllFromRenderer;
    /**
     * Patch the layer-level node template (`options.node.style`) and re-render
     * every node so the change takes effect immediately. Use this for global
     * "apply to all nodes" changes (e.g. a toolbar default-fill picker) instead
     * of looping `store.updateNode` per node.
     *
     * Merge is shallow (top-level): structured fields (`shape`, `decorations`,
     * `badges`, `effects`) are replaced wholesale — spread the prior value if you
     * mean to patch a single sub-field. Per-node `style`, active states, and
     * resolver functions still win over the template at resolve time (see
     * {@link resolveNodeStyle}). No-op visually if the layer isn't mounted yet,
     * but the template is still updated so later mounts pick it up.
     */
    setNodeDefaults(patch: Partial<NodeStyle>): void;
    /**
     * Sibling of {@link setNodeDefaults} for the edge template
     * (`options.edge.style`). Patches the shared edge styling and re-renders
     * every edge. Same shallow-merge contract — e.g. changing edge "type" means
     * `setEdgeDefaults({ shape: { ...prevShape, pathType: 'bezier' } })`.
     */
    setEdgeDefaults(patch: Partial<EdgeStyle>): void;
    /**
     * Patch the layer-level state *catalogues* (`options.node.state` /
     * `options.edge.state`) — the named overlays applied while a state is active
     * (`hover`, `selected`, …). Entries are merged by name (shallow, per the
     * `setNodeDefaults` contract: declare a full `NodeStyle` / `EdgeStyle` to
     * replace an entry; spread the prior value to patch one field). Re-renders
     * every node/edge so active states pick up the new appearance immediately.
     *
     * This is the runtime counterpart to the construction-time
     * `DEFAULT_NODE_STATES` / `DEFAULT_EDGE_STATES` merge — there was no setter
     * for state overlays before. Used by `GraphCanvas.update()` to live-patch
     * the state catalogue (e.g. theme the `selected` ring colour).
     */
    setStateConfigs(patch: {
        node?: Record<string, NodeStyle>;
        edge?: Record<string, EdgeStyle>;
    }): void;
    /**
     * Live-update entry point. Dispatches a `GraphLayerOptions` slice to the
     * concrete setters: `node.style` → {@link setNodeDefaults}, `edge.style` →
     * {@link setEdgeDefaults}, `node.state` / `edge.state` →
     * {@link setStateConfigs}. Called by `GraphCanvas.update()` per id.
     */
    setOptions(patch: Partial<GraphLayerOptions>): void;
    /** Read-only snapshot of the current node template style (resolved per node at render). */
    get nodeDefaults(): ResolvableNodeStyle<GraphNode> | undefined;
    /** Read-only snapshot of the current edge template style. */
    get edgeDefaults(): ResolvableEdgeStyle<GraphEdge> | undefined;
    /**
     * Highlight a node together with its neighbours (in `dir`) and incident edges
     * — adds the runtime state `state` to all of them in a single
     * {@link GraphStore.batch}, so the whole neighbourhood repaints in one flush.
     * No-op if the seed id is unknown. Clear with `store.clearNodeState(state)` +
     * `store.clearEdgeState(state)`.
     *
     * @param id    Seed node id.
     * @param dir   Adjacency direction for neighbours + incident edges. Default `'both'`.
     * @param state Runtime state name to apply. Default `'highlighted'`.
     */
    highlightNeighbourhood(id: string, dir?: EdgeDirection, state?: string): void;
    /**
     * Placeholder hit test — returns `null` until proper hit testing wires up
     * in a later phase (likely via the canvas hit-test pipeline reading the
     * renderer's shape registry).
     */
    hitTest(_worldX: number, _worldY: number): WorldLayerHit | null;
    /**
     * Resolve the active node hints — merges base `node.data` hints (legacy)
     * and v3 `node.style` with each active state's overlay (legacy + v3),
     * resolving layer-side resolver functions against the current node.
     *
     * Precedence (lowest → highest):
     * 1. layer `node.style` (resolved against GraphNode, adapted)
     * 2. `node.data` (legacy hints)
     * 3. per-node `node.style` (concrete NodeStyle, adapted)
     * 4. For each active state name in `node.states[]`:
     *    a. layer legacy `nodeStateConfigs[name]` (resolved)
     *    b. layer v3 `node.state[name]` (resolved against GraphNode, adapted)
     *    c. per-node `node.state[name]` (concrete NodeStyle, adapted)
     */
    /**
     * Resolve the final flat NodeStyle for a node by merging contributions from
     * the layer-level template (`options.node.style`), the per-node `style`,
     * and every active state's layer + per-node overlay. Object.assign order
     * encodes precedence (later wins).
     *
     * Exposed publicly so behaviours (NodeScaleLODBehaviour, label collision,
     * minimap, etc.) can read the same effective style the renderer sees,
     * without duplicating the merge logic.
     */
    resolveNodeStyle(node: GraphNode): Partial<NodeStyle>;
    /** Sibling of {@link resolveNodeStyle} for edges. Public for the same reason. */
    resolveEdgeStyle(edge: GraphEdge): Partial<EdgeStyle>;
    /**
     * Build the renderer-facing shape spec from the resolved {@link NodeStyle}.
     * Geometry is driven by the discriminated `style.shape` union; paint comes
     * from the flat `bg*` fields.
     *
     * The `kind` discriminator and any spec params on `style.shape` pass
     * straight through to the renderer, so any shape registered via
     * `canvas.primitives.registerShape(name, ctor)` is usable by name — built-
     * ins (`rect` / `circle` / `arc` / `regular-polygon` / `star` / `polygon`)
     * and custom shapes alike. An unknown `kind` errors loudly in the
     * renderer's `addShape` rather than silently falling back to a circle.
     */
    /**
     * Local AABB for `node`'s resolved shape. Delegates to the registered
     * shape's `static boundsOf` via `PrimitivesRenderer.boundsOfSpec`, so
     * built-in and custom shape kinds flow through the same hook.
     *
     * Returns `undefined` when:
     * - the renderer isn't mounted yet,
     * - the resolved `style.shape.kind` isn't registered, or
     * - the registered ctor doesn't implement `boundsOf`.
     *
     * The returned rect is in the shape's local (centre-relative) frame —
     * `node.position` is *not* baked in. Consumers that only need a size
     * read `width` / `height`; consumers that need world-space corners
     * offset by `node.position` themselves.
     *
     * Used by `MiniMapLayer` to estimate node footprint before the source
     * renderer mounts and by `ElkLayout` (and other layouts) to read node
     * sizes for layout-time placement — both without switching over a
     * closed shape-kind enum.
     */
    boundsOfNode(node: GraphNode): Rect | undefined;
    /**
     * World-space AABB of everything currently **visible** on this layer — the
     * "fit to content" rect. Overrides {@link WorldLayer.getBounds} to exclude
     * effectively-hidden elements deterministically (explicitly-hidden nodes/edges
     * and collapsed-group descendants), rather than depending on the renderer's
     * scene-graph bounds semantics for `visible: false` display objects.
     *
     * @param opts `includeHidden: true` unions hidden elements back in (default
     *   `false`). `ids` measures only those nodes (no edges) — the box a
     *   "frame these" action fits; it returns `null`, never the scene-graph
     *   fallback, when none of them can be measured. Otherwise falls back to the
     *   base scene-graph bounds before the renderer mounts or when nothing
     *   visible is aggregated.
     */
    /**
     * World-space AABB of this layer's content, or `null` when there is nothing
     * to measure — an empty graph, or a layer whose renderer hasn't mounted.
     *
     * `null` rather than a zero rect because callers fit the camera to this: a
     * zero rect produces a nonsense camera, whereas `null` lets them skip the fit
     * (`docs/renderer-split-design.md` D3).
     */
    getBounds(opts?: {
        includeHidden?: boolean;
        ids?: Iterable<string>;
    }): Rect | null;
    /** Hide a node (culls it + its incident edges). Delegates to the store. */
    hideNode(id: string): void;
    /** Show a previously-hidden node. Delegates to the store. */
    showNode(id: string): void;
    /** Flip a node's hidden flag. Returns the resulting hidden state. */
    toggleNodeHidden(id: string): boolean;
    /** True iff the node is explicitly hidden. */
    isNodeHidden(id: string): boolean;
    /** Effective visibility of a node (live and not explicitly hidden). */
    isNodeVisible(id: string): boolean;
    /** Hide many nodes in one batch → one paint. */
    hideNodes(ids: Iterable<string>): void;
    /** Show many nodes in one batch → one paint. */
    showNodes(ids: Iterable<string>): void;
    /** Hide an edge. Delegates to the store. */
    hideEdge(id: string): void;
    /** Show a previously-hidden edge. Delegates to the store. */
    showEdge(id: string): void;
    /** Flip an edge's hidden flag. Returns the resulting hidden state. */
    toggleEdgeHidden(id: string): boolean;
    /** True iff the edge's explicit hidden flag is set. */
    isEdgeHidden(id: string): boolean;
    /** Effective visibility of an edge (not hidden and both endpoints visible). */
    isEdgeVisible(id: string): boolean;
    /** Hide many edges in one batch → one paint. */
    hideEdges(ids: Iterable<string>): void;
    /** Show many edges in one batch → one paint. */
    showEdges(ids: Iterable<string>): void;
    /** Clear every explicit hidden flag (nodes + edges). */
    showAllHidden(): void;
    /** Hide a group node and all its `parentId` descendants. One batch → one paint. */
    hideGroup(id: string): void;
    /** Show a group node and all its `parentId` descendants. One batch → one paint. */
    showGroup(id: string): void;
    /**
     * Flip a group's visibility by the container node's state — hides the whole
     * subtree when it becomes hidden, shows it when it becomes visible. Returns the
     * resulting hidden state of the group node.
     */
    toggleGroupHidden(id: string): boolean;
    /** Hide many groups (each container + its subtree) in one batch → one paint. */
    hideGroups(ids: Iterable<string>): void;
    /** Show many groups (each container + its subtree) in one batch → one paint. */
    showGroups(ids: Iterable<string>): void;
    /**
     * Whether a group container is currently hidden. **Derived** from the
     * container node's hidden flag (the source of truth), so it can't drift — no
     * cached group index. `id` should be a group container node id; for a
     * non-group node this simply reports that node's hidden state.
     */
    isGroupHidden(id: string): boolean;
    /**
     * Ids of every currently-hidden **group container** — a UI ("hidden groups"
     * panel) helper so callers don't hand-roll the derivation. Computed on demand
     * from `store.hiddenNodes()` ∩ group nodes (not a maintained index, so always
     * correct); recompute it on the store's `node:visibility` event rather than
     * every render. If your app already tracks its group ids, intersecting them
     * with `store.hiddenNodes()` is cheaper than this `isGroupNode` scan.
     */
    hiddenGroups(): string[];
    /**
     * Centre the camera on a set of nodes — pan so the midpoint of their
     * positions sits at the viewport centre, **without changing zoom**. Unknown
     * ids are skipped; a no-op when none resolve or the layer isn't mounted.
     *
     * Graph-domain sugar over the geometry-only {@link Camera.centerOn}: it
     * resolves ids → positions so callers (e.g. a "focus on node" context-menu
     * action) don't have to. Focus locates a target; zooming stays a separate,
     * explicit gesture (wheel / pinch / fit-to-content).
     *
     * @param ids  Node ids to centre on.
     * @param opts `includeHidden: true` also considers explicitly-hidden nodes
     *   (default `false` — hidden nodes are skipped so framing tracks what's
     *   visible).
     */
    focusNodes(ids: Iterable<string>, opts?: {
        includeHidden?: boolean;
    }): void;
    /**
     * Centre the camera on a single node, optionally zooming in. Sugar over
     * {@link focusNodes} for the common "focus on this node" action.
     *
     * Camera-only: it moves the view, nothing else. Selecting / highlighting the
     * node is a separate, opt-in concern (a `ClickSelectBehaviour`) the caller
     * composes — focus stays orthogonal to selection.
     *
     * @param id        Node id to centre on.
     * @param opts.zoom Minimum zoom: the camera zooms *in* to at least this
     *   scale, but never zooms out (a no-op if already closer). Omit for a pure
     *   pan at the current zoom.
     */
    focusNode(id: string, opts?: {
        zoom?: number;
        includeHidden?: boolean;
    }): void;
    /**
     * Centre the camera on a set of edges — pan so the midpoint of their
     * endpoints sits at the viewport centre, **without changing zoom**. Unknown
     * ids (or edges with an unplaced endpoint) are skipped; a no-op when none
     * resolve or the layer isn't mounted.
     *
     * @param ids  Edge ids to centre on.
     * @param opts `includeHidden: true` also considers effectively-hidden edges
     *   (default `false` — hidden edges, including those hidden because an
     *   endpoint is, are skipped).
     */
    focusEdges(ids: Iterable<string>, opts?: {
        includeHidden?: boolean;
    }): void;
    /** Pan the camera to the centre of the AABB spanning `pts`. No-op if empty / unmounted. */
    private centerOnPoints;
    private nodeSpec;
    /**
     * Build the renderer-facing connector spec from the resolved
     * {@link EdgeStyle}. The three-stage pipeline (anchor → router →
     * pathStyle) is driven by `style.shape.pathType` + the anchor / router
     * options on the same struct; paint comes from the flat `stroke*` fields.
     */
    private edgeSpec;
    /**
     * Re-render a single node from its current data + active state stack.
     *
     * Prefers `renderer.updateShape` (instance-preserving) over the
     * `removeShape + addShape` fallback so the renderer's per-instance
     * state — `gfxScale` (written by `NodeScaleLODBehaviour`), attached
     * decorations, badges, effects — survives a state toggle. Falls back
     * to remove+add only when the rebuilt spec has a different `kind`,
     * which `updateShape` can't safely handle (the `IShape` class is
     * fixed at construction time).
     */
    private rerenderNode;
    /**
     * Re-render a single edge from its current data + active state stack.
     *
     * Always uses `renderer.updateConnector` so `inst.strokeWidthScale`
     * (written by `EdgeScaleLODBehaviour` as `1/cameraScale`) survives the
     * state-driven full-spec replacement. The fresh spec carries the new
     * "base" stroke width; the multiplier applies on top at draw time.
     */
    private rerenderEdge;
    /**
     * True iff a connector stroke is representable by the `setConnectorStroke`
     * fast path — carries a numeric `color` + `width` and nothing else (no dash /
     * alignment). Anything richer must go through the full re-render.
     */
    private strokeIsPlain;
    /**
     * True iff both endpoint shapes of a built connector spec are already
     * installed on the renderer.
     *
     * `PrimitivesRenderer.addConnector` routes eagerly and **throws** on an
     * unknown endpoint shape, so every add site checks this first. A `false`
     * means "not yet" — the edge goes into {@link deferredEdgeInstalls} and is
     * retried on the next flush, never dropped. This keeps the invariant *a
     * connector is only added once both endpoint shapes exist* independent of the
     * order style / data / config writes happen to arrive in (e.g. a layer-level
     * `edge.style` patch landing before the node shapes are painted).
     *
     * Note it checks the **spec's** endpoint ids, not `edge.source` / `edge.target`
     * — a collapsed group ancestor substitutes for a hidden descendant
     * (see {@link effectiveEndpoint}).
     */
    private endpointShapesInstalled;
    private drainDirtyConnectors;
    private installNodeShape;
    private installEdgeConnector;
    /**
     * Project the resolved `label` hint onto the canvas `'label'` decoration
     * slot for the given node. A `null` / `undefined` hint clears the slot.
     * Called after every `addShape` and every `rerenderNode` since decorations
     * are dropped when the shape is destroyed.
     */
    private syncNodeLabel;
    private syncEdgeLabel;
    /**
     * Resolve the final list of decorations for a node by concatenating every
     * contributing layer (layer template + per-node base + each active state
     * overlay) and deduping by `id`. Later precedence wins; `remove: true`
     * drops an earlier same-id entry. Entries without an explicit `id` fall
     * back to `${kind}#<combined-index>` — unique per source position, so
     * id-less decorations stack rather than collapsing.
     *
     * Returns a `Map<slotId, NodeDecorationSpec>` keyed by the resolved
     * identity. Caller emits one `setDecoration` call per slot to the
     * renderer; the slot id is reused on subsequent renders to enable diffing.
     */
    private resolveNodeDecorations;
    /** Sibling of {@link resolveNodeDecorations} for edges. */
    private resolveEdgeDecorations;
    /**
     * Project the resolved decoration array onto the canvas renderer for the
     * given node. Diffs against the previous render's slot set tracked in
     * {@link nodeDecorationSlots}: mounts new ids, removes vanished ones,
     * replaces specs whose slot id appears in both.
     */
    private syncNodeDecorations;
    /** Sibling of {@link syncNodeDecorations} for edges. */
    private syncEdgeDecorations;
    /**
     * Resolve the final effect dict for a node by merging every contributing
     * scope — layer template (`NodeOption.style`), the per-node `style`, then
     * each active state's overlay (layer-level first, per-node catalogue
     * second). Same precedence order as {@link resolveNodeDecorations}.
     *
     * Effects are a **dict keyed by kind**, not an ordered array, so the merge
     * is per key rather than a concat-and-dedupe:
     *
     * - an absent key leaves an earlier scope's entry standing;
     * - `null` **removes** it — the effects analogue of a decoration's
     *   `remove: true`, and what lets a state overlay add an effect that
     *   retires when the state clears.
     *
     * Returns a `Map<kind, style>`; the caller emits one `setEffect` per entry,
     * using the kind as the renderer slot.
     */
    private resolveNodeEffects;
    /** Sibling of {@link resolveNodeEffects} for edges. */
    private resolveEdgeEffects;
    /**
     * Project the resolved effect dict onto the renderer for the given node.
     * Diffs against {@link nodeEffectSlots}: mounts new kinds, clears vanished
     * ones, and **leaves unchanged kinds alone**.
     *
     * That last clause is the one place this deliberately departs from
     * {@link syncNodeDecorations}, which re-sets every slot unconditionally.
     * `setEffect` disposes the previous instance and constructs a new one, so an
     * unconditional re-set would restart a running animation from frame 0 every
     * time anything else about the node changed. A decoration survives that; a
     * one-shot `'fade-in'` does not.
     */
    private syncNodeEffects;
    /** Sibling of {@link syncNodeEffects} for edges. */
    private syncEdgeEffects;
    /**
     * Resolve the final list of badges for a node by concatenating every
     * contributing layer (layer template + per-node base + each active state
     * overlay) and deduping by `id`. Later precedence wins. Entries without an
     * explicit `id` fall back to `badge#<combined-index>` so id-less badges
     * stack rather than collapsing.
     */
    private resolveNodeBadges;
    /**
     * Project the resolved badge map onto the canvas renderer for the given
     * node. Diffs against the previous render's slot set tracked in
     * {@link nodeBadgeSlots}: mounts new ids, removes vanished ones, replaces
     * specs whose slot id appears in both.
     */
    private syncNodeBadges;
    /** Sibling of {@link resolveNodeBadges} for edges. */
    private resolveEdgeBadges;
    /** Sibling of {@link syncNodeBadges} for edges. */
    private syncEdgeBadges;
    private updateNodeShape;
    private queueIncidentConnectors;
    /**
     * True iff `node`'s resolved style carries a `group` field — the only
     * signal that promotes the node from a regular renderable into a
     * compound-group frame.
     *
     * Cheap to call: reads {@link resolveNodeStyle} which is already
     * memoised per render cycle through `Object.assign` of the merged
     * contributions.
     */
    isGroupNode(node: GraphNode): boolean;
    /**
     * True when this node is a group frame **and** the {@link COLLAPSED_STATE}
     * state is active on it — from the store's presence set (what
     * `CollapseExpandBehaviour` toggles) or the node's document `states[]`
     * (how a feed authors "starts closed"). Collapse is interaction state, not
     * styling, so it is never read off `style`.
     */
    isCollapsedGroup(node: GraphNode): boolean;
    /**
     * Public predicate behaviours can use to filter group nodes out of their
     * own hit pipeline. Hover / select / drag should typically skip groups
     * when the group is *expanded* (the frame is interaction-less) but treat
     * a collapsed group as a regular node. Returns one of:
     *
     * - `'none'`  — the id is not a group (treat as a regular node).
     * - `'expanded'` — group, currently expanded. Behaviours wanting to honour
     *   the "interaction-less frame" intent should early-return.
     * - `'collapsed'` — group, currently collapsed. Behaviours that act on
     *   regular nodes should treat this as a normal target.
     * - `undefined` — no such node.
     *
     * The string form is preferred over a boolean pair so a future
     * `'collapsed-locked'` (or similar) can be added without breaking callers.
     */
    getGroupRole(nodeId: string): 'none' | 'expanded' | 'collapsed' | undefined;
    /**
     * Climb the `parentId` chain from `nodeId` (exclusive) and return the
     * first ancestor whose resolved style has `group.collapsed === true`, or
     * `undefined` if no such ancestor exists. Used to decide whether a node
     * is currently hidden (any collapsed ancestor → hidden) and where to
     * re-route an incident edge (to that collapsed ancestor).
     */
    collapsedAncestor(nodeId: string): string | undefined;
    /**
     * Resolve which renderer-side shape id an edge endpoint should attach to
     * for `nodeId`. Returns the nearest collapsed-group ancestor when the
     * node is hidden, or `nodeId` unchanged when the node is visible. Pure
     * read — the store's `edge.source` / `edge.target` are never mutated.
     */
    effectiveEndpoint(nodeId: string): string;
    /**
     * Walk the `parentId` chain from `nodeId` and `add` every group ancestor
     * to {@link dirtyGroups}. Called whenever a descendant moves, is added,
     * or otherwise triggers an auto-fit recompute.
     */
    private markGroupAncestorsDirty;
    /**
     * Detect an open ↔ closed flip on a group and cascade it.
     *
     * The {@link COLLAPSED_STATE} state can arrive through either door — the
     * store's presence set (`setNodeState`, what the toggle uses) or a document
     * `states[]` patch from the feed — so both event handlers funnel here rather
     * than duplicating the comparison. {@link lastCollapsedByGroup} holds the
     * previously-projected value; the events themselves don't carry it.
     *
     * Idempotent: called with no change, it does nothing.
     */
    /**
     * Move a group that has just collapsed so its closed silhouette (the tab)
     * lands centred on the frame it replaces.
     *
     * An expanded auto-fit frame is drawn around its members; its stored
     * position plays no part in that. A collapsed one is drawn *from* its stored
     * position — which is wherever a layout last put the group node: the
     * container centre under ELK, but an arbitrary point under d3-force (often
     * near the frame's top edge). Without this the tab pops up somewhere other
     * than where the user just clicked, and a re-layout anchored on it
     * (`LayoutRunOptions.anchorNodeId`) then holds it there.
     *
     * Runs only on a runtime collapse (the `node:state` flip), never for a
     * document-authored `states: ['collapsed']` at load — there is no drawn
     * frame to centre on then. Both boxes are measured, not assumed: the frame
     * from the renderer (still drawn expanded at this point), the tab from its
     * own spec, because a shape's render origin is its centre for some kinds
     * and its top-left for others.
     */
    private centreCollapsedFrame;
    /**
     * Move a group that is opening so its members land centred on the tab being
     * replaced — the expand-side mirror of {@link centreCollapsedFrame}.
     *
     * While a group is closed its members are hidden and frozen: no layout
     * places them. If a layout ran in the meantime (a Detail or Layout switch),
     * the tab moved and the members did not, so the frame would re-open around
     * positions from a different picture — possibly far off-screen — and a
     * re-flow anchored on it (`LayoutRunOptions.anchorNodeId`) would drag the
     * whole graph there. Shifting the members as one block keeps their inner
     * arrangement and opens the frame where the user double-clicked.
     *
     * Runs only on a runtime expand (the `node:state` flip). Members that have
     * never been placed are left alone. After a plain collapse → expand the
     * shift is ~0, because {@link centreCollapsedFrame} centred the tab on the
     * frame it replaced.
     */
    private centreOpeningMembers;
    private syncGroupCollapse;
    /**
     * How long the placement gate waits for a declared `activeLayout` to report a
     * run before giving up and painting anyway.
     *
     * Not optional. Without a floor, a layout that is named in the config but
     * never runs — no data, an unregistered id, a solver that throws — would hold
     * every unplaced node invisible for the canvas's whole life, turning a
     * ~150 ms cosmetic flash into a permanently blank graph. Matches the
     * auto-fitter's own grace, which exists for exactly the same case.
     */
    private static readonly PLACEMENT_GRACE_MS;
    /** The canvas's active layout id, re-read on demand (never latched). */
    private activeLayoutId;
    /**
     * Decide whether a layout currently owns placement, and tell the store.
     *
     * `true` only while an `activeLayout` is declared and has not yet reported a
     * run. Everything else — no layout, or a layout that has run — leaves the
     * gate open, because then `(0, 0)` is a node's real position rather than a
     * default nobody chose.
     */
    private evaluatePlacementPending;
    /**
     * Recompute which nodes are hidden beneath a collapsed ancestor and push the
     * set to the store, so `store.isNodeVisible` — the one question every
     * consumer asks — accounts for collapse.
     *
     * The layer computes it because "is this node a group frame" comes from
     * {@link resolveNodeStyle}, which merges the layer template the store never
     * sees. The store owns the rule; this supplies the fact.
     *
     * O(N) over the nodes, run on a collapse flip (a user gesture), not per
     * frame. Before this, collapse was projected only into each node's *spec*, so
     * the canvas culled a child while the store still called it visible — and the
     * minimap drew it, and lasso could select it.
     */
    private publishCollapseHidden;
    /**
     * After a group flips `collapsed`, every descendant changes visibility
     * and every incident edge of every descendant needs re-routing (the
     * endpoint now resolves to either the original node or to the collapsed
     * group ancestor). Walk the subtree once, re-render each descendant
     * (which re-projects `visible`), and queue incident edges for re-route.
     */
    private refreshDescendantsAndIncidentEdges;
    /**
     * Compute the world-space AABB of the direct (one-level) children of
     * `groupId`. Returns `undefined` when the group has no children — the
     * caller falls back to whatever floor size the group's declared
     * width/height/radius provides.
     *
     * Recurses into child groups via the child's own spec, so a child whose
     * own frame has already been auto-fit contributes its current size, not
     * its stored declared size.
     *
     * **Anchored on the child's render origin, not its `position`.** Those are
     * the same point for most shapes, but *not* for `composite`: a card's
     * `position` is its **centre**, and {@link shapeRenderXY} shifts it by
     * `-size/2` because the composite shape draws from its top-left corner. So
     * the spec's `x`/`y` — already mapped through that function, and the exact
     * point the renderer draws at — is the only correct anchor here. Adding the
     * raw `position` instead assumed every shape was top-left-origin and shifted
     * a card-holding frame by half a card down-and-right: the members spilled out
     * of the top-left edges while the frame overhung on the bottom-right. The
     * frame's *size* was right the whole time, which is why it read as a
     * mispositioned box rather than a mis-measured one.
     *
     * Reading `spec.x` also keeps this in lockstep with the renderer for free —
     * any future shape that grows its own origin mapping is handled without
     * touching this method. The spec is built once and reused for the bounds
     * measurement, so this costs no more than the previous `boundsOfNode` call.
     */
    private directChildrenWorldBounds;
    /**
     * Project an expanded group's spec — apply auto-fit (when enabled),
     * compose the children-derived width/height/radius with the group's
     * declared floor, and shift `pos` so the frame wraps the bbox correctly.
     *
     * For `kind: 'rect'`: `pos` becomes top-left of the framed area; size is
     * `max(declared, childrenAABB) + 2 · padding (+ headerHeight on y)`.
     *
     * For `kind: 'tabbed-rect'`: same, except `headerHeight` becomes the
     * **tab** above the body rather than dead space inside it. The body wraps
     * the children bbox on its own, so `pos` still lands at
     * `childrenBBox.min − padding − tabHeight` and the overall footprint is
     * unchanged — the header band is simply drawn now instead of implied.
     *
     * For `kind: 'circle'`: `pos` becomes the AABB centroid; `radius` is
     * `max(declared, AABB half-diagonal) + padding`. The half-diagonal is
     * the smallest enclosing-circle approximation that's still cheap
     * (`Math.hypot` over AABB half-extents); true minimum-enclosing-circle
     * (Welzl) is out of scope.
     *
     * Non-rect / non-circle group shapes pass through untouched — autoFit is
     * a no-op outside those two kinds. Domain shapes that want their own
     * fit math can extend the layer's projection later.
     */
    private projectGroupShape;
    /**
     * Let the resolved shape size itself around its own title.
     *
     * The layer measures — it owns the label content and the renderer's font
     * resolution — and hands the size to `ShapeCtor.fitToContent`, which is
     * where the geometry decision lives. A `tabbed-rect` widens its tab; shapes
     * that don't implement the hook are returned untouched. No kind check here,
     * so a shape registered at runtime fits its own content the same way.
     *
     * Why measure at all: a frame that auto-fits its children changes size as
     * the graph changes, and a fixed tab either clips a long title or leaves a
     * short one swimming. Deriving the tab from the text is what lets a set of
     * frames with unrelated titles stay visually consistent with no per-frame
     * numbers in the data. Pre-mount there's no renderer to measure with, so the
     * declared geometry stands and the first post-mount render re-projects.
     */
    private fitShapeToLabel;
    /**
     * True when this node's `collapsed` overlay declares its own `shape` — in
     * which case the author is describing the closed silhouette themselves and
     * the resolved shape's minimal form ({@link ShapeCtor.collapsedOf}) is
     * skipped.
     *
     * Checks the catalogues for *presence* rather than resolving them: a
     * layer-template entry may be a resolver function, and only whether the
     * field was contributed matters here. Both the layer-level and per-node
     * catalogues count, mirroring the normal overlay precedence.
     */
    private collapsedOverlayDeclaresShape;
    /**
     * Force a group's frame to re-project right now (outside the normal
     * flush cycle). Public escape hatch for feeds that remove children
     * individually without triggering a position change on a sibling — the
     * `node:remove` event doesn't carry the parentId, so the layer can't
     * mark the parent dirty on its own. Domain code can call this after
     * `store.removeNode` to make the auto-fit frame catch up.
     */
    recomputeGroup(groupId: string): void;
    /**
     * Drain {@link dirtyGroups} in deepest-first order. Each pop re-renders
     * the group (re-running `nodeSpec` with the latest auto-fit math) and
     * marks the group's own parent chain dirty so a multi-level nested
     * group cascade settles in one flush.
     *
     * Bounded by `MAX_PASSES` to defend against a pathological cycle (which
     * the cycle-rejecting store should already prevent on insert, but the
     * extra guard is cheap).
     */
    private drainDirtyGroups;
    /**
     * Count of ancestors between `nodeId` and the root (`parentId === undefined`).
     * Used by {@link drainDirtyGroups} to order deepest first so a child
     * group recomputes before any group that depends on its bounds.
     */
    private depthOf;
    /**
     * Project the synthetic group-only decorations onto the renderer:
     * - the `+` / `−` toggle button at the group's bottom anchor; and
     * - a centred count badge (label decoration) when the group is collapsed
     *   *and* opted into `group.showCollapsedCount`, showing the number of
     *   hidden descendants.
     *
     * Called on every node lifecycle event for group nodes. Cleared
     * automatically when `style.group` goes away (the slots get `null` so
     * any previous mount disposes).
     */
    private syncGroupSyntheticDecorations;
    /** Number of descendants beneath `id` (the collapsed-count value). */
    private countDescendants;
    private updateEdgeConnector;
    /**
     * Publish a resolved spec as durable state, then project it.
     *
     * P2 inverted the direction here: the renderer is no longer handed a spec by
     * the caller — it is driven from the store, which is the single source of the
     * visual description. The projection is synchronous so that the label /
     * decoration / badge syncs that follow still find the element mounted.
     */
    private publishSpec;
    /** Drop a published spec — pairs with the projector's removal path. */
    private unpublishSpec;
}

/**
 * `MiniMapLayer` — bird's-eye overview of a `GraphLayer` with a draggable
 * viewport indicator.
 *
 * Implemented as a `ScreenLayer` rather than a self-hosted pixi `Application`
 * — much cheaper, no extra GPU surface, and pans/zooms/visibility integrate
 * with the main canvas naturally. The minimap occupies a fixed
 * `width × height` rectangle anchored to a corner of the viewport.
 *
 * Cross-layer dependency declared via `graphLayerId` per the canvas
 * architecture rule: no inference of "the only graph layer". You must point
 * the minimap at a specific id.
 *
 * @example
 * ```ts
 * const graph = new GraphLayer({ id: 'graph', options: {} });
 * canvas.layers.add(graph);
 *
 * const minimap = new MiniMapLayer({
 *   id: 'minimap',
 *   options: { graphLayerId: 'graph', position: 'bottom-right' },
 * });
 * canvas.layers.add(minimap);
 * ```
 */

/** Anchor corner inside the canvas viewport. */
type MiniMapPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
/**
 * A minimap-chrome colour. Pass a single `0xRRGGBB` for a fixed colour, or a
 * `{ light, dark }` pair to swap based on the layer's `mode` — so the minimap
 * can track the canvas theme the same way {@link BackgroundLayer} does.
 */
type MiniMapColor = number | {
    light: number;
    dark: number;
};
/**
 * Mode selector for light/dark colour resolution. `'auto'` follows the host's
 * `prefers-color-scheme` media query; `'light'` / `'dark'` pin explicitly.
 */
type MiniMapMode = 'auto' | 'light' | 'dark';
/** The concrete kind currently resolved after `mode` resolution. */
type MiniMapKind = 'light' | 'dark';
/** Constructor options for `MiniMapLayer`. */
interface MiniMapLayerOptions {
    /** Required — the `GraphLayer` id this minimap mirrors. */
    graphLayerId: string;
    /** Minimap width in screen pixels. Default `200`. */
    width?: number;
    /** Minimap height in screen pixels. Default `150`. */
    height?: number;
    /**
     * Id of a `BackgroundLayer` to mirror. When set, the minimap paints its
     * background with that layer's *resolved* colour — so the minimap backdrop
     * always matches the real canvas background (including theme flips) without
     * duplicating the colour here. Falls back to {@link backgroundColor} when the
     * id is unset or the layer can't be resolved. Declared explicitly per the
     * canvas cross-layer rule — no inference of "the only background layer".
     */
    backgroundLayerId?: string;
    /**
     * Background fill used when {@link backgroundLayerId} is unset / unresolved. A
     * `0xRRGGBB` or a `{ light, dark }` pair resolved against `mode`. Default
     * `0x1a1a2e`.
     */
    backgroundColor?: MiniMapColor;
    /** Border colour. Same forms as `backgroundColor`. Default `0x444444`. */
    borderColor?: MiniMapColor;
    /** Border stroke width. Default `1`. */
    borderWidth?: number;
    /** Viewport indicator fill. Same forms as `backgroundColor`. Default `0x4a90d9`. */
    viewportFill?: MiniMapColor;
    /** Viewport indicator stroke. Same forms as `backgroundColor`. Default `0x2a70b9`. */
    viewportStroke?: MiniMapColor;
    /** Viewport indicator fill alpha 0–1. Default `0.3`. */
    viewportFillAlpha?: number;
    /** Viewport indicator stroke width. Default `2`. */
    viewportStrokeWidth?: number;
    /**
     * Dim everything *outside* the viewport rectangle with a translucent overlay,
     * spotlighting the currently-visible region. Drawn above the mirrored world
     * (so out-of-view nodes/edges are dimmed) and clipped to the minimap box.
     * Default `true` — set `false` for the classic un-masked minimap.
     */
    maskEnabled?: boolean;
    /**
     * Out-of-viewport mask overlay colour. Same forms as {@link backgroundColor}
     * (`0xRRGGBB` or a `{ light, dark }` pair resolved against `mode`). Default
     * `0x000000`.
     */
    maskColor?: MiniMapColor;
    /** Out-of-viewport mask alpha 0–1. Default `0.5`. */
    maskAlpha?: number;
    /** World-space padding around node bounds. Default `20`. */
    padding?: number;
    /** Whether dragging the minimap pans the main camera. Default `true`. */
    enableDrag?: boolean;
    /** Anchor corner. Default `'bottom-right'`. */
    position?: MiniMapPosition;
    /**
     * How `{ light, dark }` colour variants are resolved. `'auto'` (default)
     * follows `prefers-color-scheme`; `'light'` / `'dark'` pin explicitly. Has no
     * effect when every colour is a plain scalar. Flip it (e.g. from a theme
     * toggle via `useTheme`'s `minimapLayerId`) to swap the minimap chrome in
     * lockstep with the canvas {@link BackgroundLayer}.
     */
    mode?: MiniMapMode;
    /**
     * Inset from the chosen corner, in screen pixels. Pass a single number for a
     * symmetric inset, or `{ x, y }` for independent horizontal / vertical insets
     * (e.g. to bottom-align the minimap with a control rail while clearing its
     * width). A missing axis on the object form falls back to `10`. Default `10`.
     */
    margin?: number | {
        x?: number;
        y?: number;
    };
}
interface MiniMapState {
    readonly _placeholder?: never;
}
declare class MiniMapLayer extends ScreenLayer<MiniMapLayerOptions, MiniMapState, Record<string, never>, never, ScreenLayerHit> {
    readonly kind = "minimap-layer";
    private opts;
    private readonly graphLayerId;
    private graph;
    private ctxRef;
    /** Inner content container (the minimap's drawable area). */
    private bgGfx;
    private worldGfx;
    private viewportGfx;
    /** Screen-space origin of the minimap box; the overlays are moved here. */
    private originX;
    private originY;
    /** Per-frame projection scale + offset (world → minimap-local). */
    private scale;
    private offsetX;
    private offsetY;
    /** Drag state. */
    private isDragging;
    private dragOffsetX;
    private dragOffsetY;
    /** ResizeObserver disposer. */
    private offResize;
    private offCameraPan;
    private offCameraZoom;
    /** `theme:change` subscriber — repaints the chrome when the theme flips. */
    private offTheme;
    /** DOM pointer-listener disposers for the drag interaction. */
    private readonly pointerDisposers;
    constructor(opts: LayerOptions<MiniMapLayerOptions>);
    protected createState(): MiniMapState;
    protected onMount(ctx: CanvasContext): void;
    protected onUnmount(): void;
    hitTest(): ScreenLayerHit | null;
    /** Force a re-paint. Cheap — call after mutating colours / sizes externally. */
    refresh(): void;
    setOptions(patch: Partial<Omit<MiniMapLayerOptions, 'graphLayerId'>>): void;
    /**
     * Set the colour-resolution mode. `'auto'` follows the active theme on
     * `ctx.theme`; `'light'` / `'dark'` pin explicitly. No-op when unchanged. The
     * minimap chrome flips in lockstep with the canvas {@link BackgroundLayer},
     * which resolves its kind from the same theme signal.
     */
    setMode(mode: MiniMapMode): void;
    /** Current mode setting. */
    getMode(): MiniMapMode;
    /**
     * Concrete kind currently resolved. A pinned `mode` wins; otherwise `'auto'`
     * follows the active theme on `ctx.theme` (defaulting to `'light'` before any
     * theme is published).
     */
    getResolvedKind(): MiniMapKind;
    private viewportSize;
    private layoutPosition;
    private repaint;
    private paintBackground;
    /**
     * The minimap backdrop colour. Mirrors the referenced {@link BackgroundLayer}
     * (`backgroundLayerId`) when one is wired and resolvable, so the minimap
     * tracks the canvas background — including theme flips — with no duplicated
     * colour. Falls back to the `backgroundColor` option otherwise.
     */
    private resolveBackgroundFill;
    private paintWorld;
    /**
     * Pre-mount / pre-install fallback for shape bounds. Used when the renderer
     * hasn't yet built an instance for a node (very brief window — the layer's
     * `data:changed` event repaints the minimap as soon as the renderer catches
     * up).
     *
     * Delegates to {@link GraphLayer.boundsOfNode}, which routes through the
     * shape registry's `static boundsOf` hook — built-in and custom shape
     * kinds flow through the same code path. Falls back to a 32px square
     * AABB centred on the node's stored position when the resolved shape
     * isn't registered or its ctor doesn't expose `boundsOf`.
     */
    private fallbackNodeBounds;
    private paintViewportIndicator;
    /**
     * Paint the out-of-viewport mask: a translucent overlay covering the minimap
     * box everywhere *except* the viewport rectangle `(x, y, w, h)`, spotlighting
     * the visible region. Drawn as four border rects (top / bottom / left /
     * right) around the viewport rect, each clamped to the minimap box — avoids
     * fill-rule/hole subtleties and never bleeds past the minimap edge even when
     * the viewport rect extends beyond it. No-op when disabled or fully
     * transparent.
     */
    private paintMask;
    /** Union node bounds with the current camera-visible bounds. */
    private effectiveBounds;
    /**
     * AABB of all drawn node *footprints* + padding, queried directly from the
     * renderer's per-instance world bounds — so arcs / polygons / stars /
     * custom shapes contribute their true extent, not a hardcoded size-derived
     * estimate. Pre-mount nodes fall through to a position+default-size box.
     * Returns a 1000×1000 placeholder when the layer has no nodes yet.
     */
    private nodeBounds;
    private projectBounds;
    /** Resolve a scalar or `{ light, dark }` colour against the current mode. */
    private resolveColor;
    private worldToMinimap;
    private minimapToWorld;
    /**
     * Pointer handling on the canvas element rather than on a pixi display object.
     *
     * The engine forbids raw backend events outside the renderer (root rule 6),
     * and the minimap does not need picking: it owns a known screen rectangle, so
     * a hit is a coordinate comparison. Move / up go on `window` so a drag that
     * leaves the canvas still completes.
     */
    private wireInteractions;
    /**
     * Pointer position in minimap-local pixels, or `null` when the event is
     * outside the minimap box. Replaces pixi's `getLocalPosition` + `hitArea`.
     */
    private localFromEvent;
    private onMiniPointerDown;
    private onMiniPointerMove;
    private onMiniPointerUp;
    /** Position the main camera so the world point `(wx, wy)` lands at screen centre. */
    private panMainCameraTo;
}

/**
 * `GraphLegendLayer` — a legend keyed on the graph's **types**: one row per node type
 * and per edge type, each showing a colour swatch, the type name, and how many
 * of that type are in the canvas.
 *
 * ```text
 *  Nodes
 *   ●  Person          12 / 40
 *   ●  Company             8
 *  Edges
 *   ─  WORKS_AT        12 / 31
 *   ╌  KNOWS               4
 * ```
 *
 * **Swatch colours are read back off the graph, never configured twice.** For
 * each type the layer picks a representative element (the first *visible* one,
 * else the first seen) and asks the source `GraphLayer` for its *effective*
 * style via `resolveNodeStyle` / `resolveEdgeStyle`. So the legend automatically
 * agrees with whatever is actually on screen — the layer template, per-node
 * overrides, `ColorByBehaviour`, and `ThemeBehaviour` recolours — with no
 * separate palette to keep in sync. A node swatch is always a filled circle in
 * the node's `bgFill` colour (the shape kind is deliberately *not* mirrored — the
 * legend keys on type, not geometry); an edge swatch is a short line in the
 * edge's `strokeColor`, at its `strokeWidth`, dashed when `strokeDashArray` is
 * set. Override any type explicitly with {@link GraphLegendLayerOptions.colors}.
 *
 * **Counts are `visible / total`.** The visible count skips elements hidden via
 * `GraphStore.hideNode` / `hideEdge` (and, for edges, those with a hidden
 * endpoint — the derived rule the renderer itself uses). When nothing of that
 * type is hidden the two are equal and a single number is shown, so an unfiltered
 * graph reads cleanly. Switch with {@link GraphLegendLayerOptions.countMode}.
 *
 * **Rows can filter the graph.** With
 * {@link GraphLegendLayerOptions.toggleOnClick} on, clicking a row hides every
 * element of that type (`GraphStore.hideNodes` / `hideEdges`, batched to one
 * flush) and renders the row struck through and muted; clicking again restores
 * it. The toggle state lives in `layer.state` (`hiddenNodeTypes` /
 * `hiddenEdgeTypes`) and is also drivable programmatically via
 * {@link GraphLegendLayer.setTypeHidden} / {@link GraphLegendLayer.showAllTypes},
 * so a host toolbar or a saved filter can share it. The `'row:click'` event
 * fires whether or not the built-in toggle is enabled, so a host can wire a
 * different reaction (drive a query, select the type) instead.
 *
 * Implemented as a `ScreenLayer` whose visible artifact is a plain
 * absolutely-positioned HTML `<div>` layered above the canvas — the
 * `DevInfoLayer` pattern, not pixi drawing. Crisp text at any DPR for free, and
 * the inherited pixi `container` goes unused. The panel is `pointer-events:none`
 * and only the *rows* opt back in (and only when `toggleOnClick` is on), so the
 * legend intercepts scene input on a clickable row and nowhere else. The layer
 * always opts out of engine hit-testing (`hittable: false`, `hitTest() → null`)
 * — its interaction is DOM, not pixi.
 *
 * Headless / offscreen mode: when `ctx.canvasElement` is undefined (i.e.
 * `Canvas.initWithStage`), the layer mounts cleanly and renders nothing.
 *
 * Cross-layer dependency declared via `graphLayerId` per the canvas
 * architecture rule — no inference of "the only graph layer".
 *
 * @example
 * ```ts
 * const graph = new GraphLayer({ id: 'graph', options: { initData } });
 * canvas.layers.add(graph);
 *
 * canvas.layers.add(
 *   new GraphLegendLayer({
 *     id: 'legend',
 *     options: { graphLayerId: 'graph', position: 'top-left' },
 *   }),
 * );
 * ```
 */

/** Anchor corner inside the canvas viewport. */
type GraphLegendPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
/**
 * A legend-chrome colour. Pass a single CSS colour string for a fixed colour, or
 * a `{ light, dark }` pair to swap based on the resolved {@link GraphLegendMode} — so
 * the legend can track the canvas theme the way `BackgroundLayer` and
 * `MiniMapLayer` do.
 */
type GraphLegendColor = string | {
    light: string;
    dark: string;
};
/**
 * Mode selector for light/dark colour resolution. `'auto'` follows the active
 * theme published on `ctx.theme`; `'light'` / `'dark'` pin explicitly.
 */
type GraphLegendMode = 'auto' | 'light' | 'dark';
/** The concrete kind currently resolved after `mode` resolution. */
type GraphLegendKind = 'light' | 'dark';
/** How the per-type count is rendered. */
type GraphLegendCountMode = 
/** `visible / total`, collapsing to one number when nothing of that type is hidden. */
'both'
/** Only the count currently rendered in the canvas. */
 | 'visible'
/** Only the count loaded in the store, hidden or not. */
 | 'total';
/** Row ordering within each section. */
type GraphLegendSort = 
/** Most-populous type first (by total), ties broken by name. */
'count-desc'
/** Alphabetical by type name. */
 | 'name-asc'
/** Order of first appearance in the store. */
 | 'insertion';
/** Constructor options for `GraphLegendLayer`. */
interface GraphLegendLayerOptions {
    /** Required — the `GraphLayer` id this legend describes. */
    graphLayerId: string;
    /** Panel heading. Pass `false` (or `''`) for no heading. Default `'Legend'`. */
    title?: string | false;
    /** Include the node-type section. Default `true`. */
    showNodes?: boolean;
    /** Include the edge-type section. Default `true`. */
    showEdges?: boolean;
    /** Node-section heading. Pass `false` to drop it. Default `'Nodes'`. */
    nodesTitle?: string | false;
    /** Edge-section heading. Pass `false` to drop it. Default `'Edges'`. */
    edgesTitle?: string | false;
    /** Show the per-type counts. Default `true`. */
    showCounts?: boolean;
    /** How the count is rendered. Default `'both'`. */
    countMode?: GraphLegendCountMode;
    /** Row ordering within each section. Default `'count-desc'`. */
    sort?: GraphLegendSort;
    /**
     * Cap on rows *per section*; the remainder collapses into a single
     * `+N more` row. `0` means no cap. Default `12`.
     */
    maxRows?: number;
    /**
     * Drop rows whose visible count is `0` (i.e. the type is entirely filtered
     * out). Default `false` — a zeroed row is usually the point of a legend.
     */
    hideEmpty?: boolean;
    /**
     * Restrict the legend to these type names (in this order, ignoring
     * {@link sort}). Types absent from the store are skipped. Unset → every
     * observed type.
     */
    nodeTypes?: readonly string[];
    /** Edge-side sibling of {@link nodeTypes}. */
    edgeTypes?: readonly string[];
    /**
     * Explicit per-type swatch colours as `0xRRGGBB`, keyed by type name (node and
     * edge types share the map). Wins over the colour resolved from the graph —
     * reach for it only when the representative element's style isn't the colour
     * you want in the legend.
     */
    colors?: Record<string, number>;
    /** Swatch colour for a type whose style resolves no usable colour. Default `0x9ca3af`. */
    fallbackColor?: number;
    /**
     * How to read a node's type. Defaults to the same accessor `deriveSchema`
     * uses (`node.type`, then `data.type` / `.label` / `.kind` / `.group` /
     * `.category`, then `'node'`) — so the legend and the schema panel agree.
     * Non-serialisable: pass it in the constructor, not through `canvas.update`.
     */
    nodeTypeOf?: (node: GraphNode) => string;
    /** Edge-side sibling of {@link nodeTypeOf}. */
    edgeTypeOf?: (edge: GraphEdge) => string;
    /**
     * Make rows clickable, toggling the whole type's visibility in the graph —
     * click `Person` to hide every Person node, click again to bring them back.
     * A toggled-off row renders **struck through and muted** (see
     * {@link hiddenTypeOpacity}) so the legend doubles as the filter's own state
     * display.
     *
     * Default `false` — interaction is opt-in, mirroring the engine's
     * behaviours-don't-auto-enable rule. The {@link GraphLegendLayerEvents.row:click}
     * event fires either way, so a host can wire its own reaction (drive a query,
     * select instead of hide) with this left off.
     *
     * Only the row elements take pointer events; the panel's padding and section
     * headings stay `pointer-events:none`, so panning the canvas "through" the
     * legend still works everywhere except directly on a row.
     */
    toggleOnClick?: boolean;
    /**
     * Row opacity when its type is toggled off via {@link toggleOnClick}. Applies
     * to the whole row (swatch included); the type name additionally gets
     * `line-through` and the muted text colour. Default `0.45`.
     */
    hiddenTypeOpacity?: number;
    /** Anchor corner. Default `'top-left'`. */
    position?: GraphLegendPosition;
    /**
     * Inset from the chosen corner, in screen pixels. A single number applies to
     * both axes; `{ x, y }` sets them independently (e.g. bump `y` to clear a top
     * header bar). A missing axis on the object form falls back to `10`.
     * Default `10`.
     */
    margin?: number | {
        x?: number;
        y?: number;
    };
    /** Render the overlay at all. Toggle at runtime via {@link GraphLegendLayer.setEnabled}. Default `true`. */
    enabled?: boolean;
    /** Text size in px. Default `11`. */
    fontSize?: number;
    /** Panel opacity 0–1. Default `0.95`. */
    opacity?: number;
    /** Node swatch diameter (and edge swatch stroke length basis) in px. Default `10`. */
    swatchSize?: number;
    /** Panel background. CSS colour or a `{ light, dark }` pair. */
    backgroundColor?: GraphLegendColor;
    /** Row text colour. CSS colour or a `{ light, dark }` pair. */
    textColor?: GraphLegendColor;
    /** Section-heading + count colour. CSS colour or a `{ light, dark }` pair. */
    mutedColor?: GraphLegendColor;
    /** Panel border colour. CSS colour or a `{ light, dark }` pair. */
    borderColor?: GraphLegendColor;
    /** Panel corner radius in px. Default `6`. */
    borderRadius?: number;
    /** How `{ light, dark }` colours resolve. Default `'auto'`. */
    mode?: GraphLegendMode;
}
/**
 * One tallied type, ready to render — the unit
 * {@link GraphLegendLayer.getRows} hands back.
 */
interface GraphLegendRow {
    /** The type name, as the accessor reported it. */
    type: string;
    /** How many are currently rendered (not hidden, endpoints visible for edges). */
    visible: number;
    /** How many are loaded in the store, hidden or not. */
    total: number;
    /** Resolved swatch colour as `0xRRGGBB`. */
    color: number;
    /** Edge rows only — the resolved stroke width, for the swatch line's thickness. */
    strokeWidth?: number;
    /** Edge rows only — true when the resolved style dashes the path. */
    dashed?: boolean;
}
/** Which side of the graph a row describes. */
type GraphLegendRowKind = 'node' | 'edge';
/**
 * Layer-level event payloads.
 *
 * A `type` alias rather than an `interface` so it satisfies the engine's
 * `EventMap` (`Record<string, unknown>`) constraint — only aliases get TypeScript's
 * implicit index signature.
 */
type GraphLegendLayerEvents = {
    /**
     * A legend row was clicked. Fires whether or not
     * {@link GraphLegendLayerOptions.toggleOnClick} is on — with it off nothing in
     * the graph changes and `hidden` simply reports the row's unchanged toggle
     * state, so a host can implement its own reaction (drive a query, select the
     * type, open a filter) without the built-in hide/show.
     */
    'row:click': {
        kind: GraphLegendRowKind;
        type: string;
        hidden: boolean;
    };
    /**
     * A type was toggled off (`hidden: true`) or back on. Only fires when
     * {@link GraphLegendLayerOptions.toggleOnClick} actually applied the change,
     * so it's the one to listen to for "the legend filtered the graph".
     */
    'type:visibility': {
        kind: GraphLegendRowKind;
        type: string;
        hidden: boolean;
    };
};
interface GraphLegendState {
    enabled: boolean;
    /** Node types the user has toggled off from the legend. */
    hiddenNodeTypes: Set<string>;
    /** Edge types the user has toggled off from the legend. */
    hiddenEdgeTypes: Set<string>;
}
declare class GraphLegendLayer extends ScreenLayer<GraphLegendLayerOptions, GraphLegendState, GraphLegendLayerEvents> {
    readonly kind = "graph-legend-layer";
    private opts;
    private readonly graphLayerId;
    private readonly nodeTypeOf;
    private readonly edgeTypeOf;
    private graph;
    private overlay;
    /** Unsubscribers for every event / observer subscription taken on mount. */
    private unsubs;
    /**
     * Pending repaint handle. Recounting is O(V+E), and the events that invalidate
     * it are bursty — `node:visibility` fires per node, so hiding 1 000 nodes
     * would otherwise mean 1 000 full recounts. Coalesce to one per frame.
     */
    private rafId;
    /**
     * Delegated row-click handler, attached once to the overlay so it survives the
     * `innerHTML` rewrites each repaint does (a per-row listener would not).
     */
    private onRowClick;
    /**
     * Whether the last repaint produced any rows. An empty legend (no data yet, or
     * every section switched off) hides the panel rather than floating an empty box
     * over the canvas — tracked here because {@link applyStyles} rewrites
     * `cssText` wholesale and would otherwise drop the `display` the repaint set.
     */
    private hasRows;
    constructor(opts: LayerOptions<GraphLegendLayerOptions>);
    protected createState(): GraphLegendState;
    /** Overlay is DOM with `pointer-events:none` — never participates in hit-testing. */
    hitTest(_screenX: number, _screenY: number): ScreenLayerHit | null;
    protected onMount(ctx: CanvasContext): void;
    protected onUnmount(): void;
    /** Show or hide the legend at runtime without removing the layer. */
    setEnabled(enabled: boolean): void;
    enable(): void;
    disable(): void;
    /**
     * Update display options at runtime. This is the seam `Canvas.update({ layers:
     * { <id>: … } })` drives, so the whole bag is serialisable — the
     * non-serialisable wiring (`graphLayerId`, the type accessors) is
     * constructor-only and ignored here.
     */
    setOptions(patch: Partial<Omit<GraphLegendLayerOptions, 'graphLayerId' | 'nodeTypeOf' | 'edgeTypeOf'>>): void;
    /** Force an immediate recount + repaint. Cheap for typical graph sizes. */
    refresh(): void;
    /**
     * The rows the legend is currently showing — node types then edge types, each
     * with its resolved colour and `visible` / `total` counts. Handy for a
     * DOM-free consumer (a React legend panel, a test) that wants the same tally
     * without the overlay.
     */
    getRows(): {
        nodes: GraphLegendRow[];
        edges: GraphLegendRow[];
    };
    /** True iff `type` is currently toggled off from the legend. */
    isTypeHidden(kind: GraphLegendRowKind, type: string): boolean;
    /** The types currently toggled off, as plain arrays (node types, edge types). */
    getHiddenTypes(): {
        nodes: string[];
        edges: string[];
    };
    /**
     * Hide or show every element of one type, exactly as clicking its row would —
     * the programmatic entry point, so a host toolbar or a saved filter can drive
     * the same state the legend displays. No-op when already in that state.
     *
     * Hiding writes the store's `hidden` flag on each matching element (batched to
     * one flush); the legend's own struck-through state is tracked here, so a
     * *restored* type reads as shown even if its elements remain invisible for
     * another reason (an edge whose endpoint is still hidden) — the row's
     * `visible / total` count is what tells you that.
     */
    setTypeHidden(kind: GraphLegendRowKind, type: string, hidden: boolean): void;
    /** Bring back every type toggled off from the legend, in one batch. */
    showAllTypes(): void;
    /**
     * Concrete kind currently resolved. A pinned `mode` wins; otherwise `'auto'`
     * follows the theme published on `ctx.theme` (defaulting to `'light'` before
     * any theme is published).
     */
    getResolvedKind(): GraphLegendKind;
    /**
     * Delegated row click: announce it, then apply the built-in toggle when
     * {@link GraphLegendLayerOptions.toggleOnClick} is on. `row:click` fires first
     * and unconditionally so a host can react even with the toggle off.
     */
    private handleRowClick;
    /** Coalesce bursty invalidations into a single repaint on the next frame. */
    private schedule;
    private cancelScheduled;
    private mountOverlay;
    private unmountOverlay;
    /** Resolve a {@link GraphLegendColor} against the current {@link GraphLegendKind}. */
    private color;
    private applyStyles;
    /**
     * Bucket the store's nodes by type, remembering counts and a representative
     * element per type, then resolve each representative's effective style for the
     * swatch colour. One pass over the nodes; the style resolution is once per
     * *type*, not per node.
     */
    private tallyNodes;
    /** Edge-side sibling of {@link tallyNodes}, adding stroke width / dash to each row. */
    private tallyEdges;
    /**
     * Apply the shared row post-processing: the optional type allow-list (which
     * also fixes the order), `hideEmpty`, and {@link GraphLegendLayerOptions.sort}.
     * `maxRows` is applied at render time so the `+N more` row can be built there.
     *
     * `hideEmpty` deliberately **keeps** a row the user toggled off — dropping it
     * would delete the only control that can bring that type back.
     */
    private finalise;
    private repaint;
    /** The panel title (`strong`) or a section heading (muted, uppercase-ish). */
    private headingHtml;
    /** Rows for one section, honouring `maxRows` with a trailing `+N more`. */
    private sectionHtml;
    /**
     * One `[swatch] Type   count` row.
     *
     * The row carries its identity in `data-legend-kind` / `data-legend-type` for
     * the delegated click handler, and takes pointer events **only when
     * `toggleOnClick` is on** — so a non-interactive legend still lets pointer
     * input through to the scene beneath it. A type toggled off renders at
     * `hiddenTypeOpacity` with its name struck through and muted.
     */
    private rowHtml;
    /** A filled circle in the node type's colour — geometry-agnostic on purpose. */
    private nodeSwatchHtml;
    /**
     * A short line in the edge type's stroke colour, at its resolved width, dashed
     * when the style dashes the path. Drawn as a `border-top` so CSS gives us the
     * dash pattern for free.
     */
    private edgeSwatchHtml;
    /**
     * `visible / total` in `'both'` mode, collapsed to a single number when the
     * two agree (an unfiltered graph shouldn't read `40 / 40`).
     */
    private countHtml;
}

/**
 * `GraphClipboard` — copy / cut / paste / delete for a {@link GraphStore}.
 *
 * Holds an in-memory buffer of cloned node/edge specs. It does **not** read the
 * current selection itself — the caller passes the ids in (the canvas-react
 * `useClipboard` hook reads them off a `ClickSelectBehaviour`). This keeps the
 * clipboard decoupled from the selection mechanism and trivially testable.
 *
 * cut / paste / delete each write one labelled `applyDelta` — one flush and,
 * once the store is on a canvas, one undoable `canvas.history` entry
 * (`'cut'`, `'delete'`, `'paste'`).
 *
 * @example
 * ```ts
 * const clipboard = new GraphClipboard(layer.store);
 * clipboard.copy(selectedNodeIds, selectedEdgeIds);
 * const { nodeIds } = clipboard.paste(); // offset + re-id'd
 * clickSelect.selectMultiple(nodeIds.map((id) => ({ id })));
 * ```
 */

/** Event-map for {@link GraphClipboard.events}. */
type GraphClipboardEventMap = {
    /** Fired whenever the buffer's contents change (copy / clear). Drives "can paste". */
    change: {
        hasContent: boolean;
    };
};
/** Constructor options for {@link GraphClipboard}. */
interface GraphClipboardOptions {
    /** Offset applied to pasted node positions to avoid exact overlap. Default `{x:24,y:24}`. */
    pasteOffset?: Vec2$1;
    /**
     * Candidate id generator for pasted nodes/edges. Called with increasing
     * `attempt` until the returned id is free. Default `${oldId}-copy[-N]`.
     */
    remapId?: (oldId: string, attempt: number) => string;
}
/** Ids produced by a {@link GraphClipboard.paste}. */
interface PasteResult {
    nodeIds: string[];
    edgeIds: string[];
}
declare class GraphClipboard {
    /** Fires `change` whenever the buffer's contents change (copy / clear). */
    readonly events: EventEmitter<GraphClipboardEventMap>;
    private readonly store;
    private pasteOffset;
    private readonly remapId;
    private bufferedNodes;
    private bufferedEdges;
    constructor(store: GraphStore, opts?: GraphClipboardOptions);
    /** True iff the buffer holds at least one node or edge (drives "can paste"). */
    get hasContent(): boolean;
    /** The offset applied to pasted node positions. */
    get offset(): Vec2$1;
    /** Change the offset applied to pasted node positions (from the next paste). */
    setPasteOffset(offset: Vec2$1): void;
    /** Empty the buffer. */
    clearBuffer(): void;
    /**
     * Snapshot the given ids into the buffer (clones, so later store mutations
     * don't mutate the buffer). Unknown ids are skipped. Replaces prior contents.
     */
    copy(nodeIds: readonly string[], edgeIds?: readonly string[]): void;
    /** Copy the ids into the buffer, then delete them as one undoable entry. */
    cut(nodeIds: readonly string[], edgeIds: readonly string[]): void;
    /** Delete the given ids as one undoable entry. Buffer is left untouched. */
    delete(nodeIds: readonly string[], edgeIds: readonly string[]): void;
    /**
     * Insert the buffer with fresh ids (collision-free) and a position offset, as
     * one undoable entry. Only buffered edges whose **both** endpoints were
     * also buffered are pasted, with endpoints remapped to the new node ids.
     * `parentId` is remapped when the parent was pasted too, else dropped.
     *
     * Returns the new ids so the caller can re-select the pasted items.
     */
    paste(): PasteResult;
    /** Remove explicit edges first, then nodes (cascading) — `applyDelta`'s order — as one labelled entry. */
    private remove;
    /** Pick the first remapped id that is neither already in the store nor reserved. */
    private freshId;
}

/**
 * The graph domain's {@link CanvasCommand}s — registered on every
 * `GraphCanvas`'s `commands` registry at construction, so a saved control panel
 * can switch the selection mode, route edges and clear the graph with no app
 * code.
 *
 * | Name | Args | Kind |
 * |---|---|---|
 * | `select.mode` | `{ modes?, labels?, value }` — `modes` maps mode → behaviour id (`''` = no behaviour) | choice |
 * | `graph.edgeType` | `{ layerId?, types?, value }` (default `'graph'`, {@link DEFAULT_EDGE_TYPES}) | choice |
 * | `graph.clear` | `{ layerId? }` (default `'graph'`) | button — one undoable `'clear'` entry in `canvas.history` |
 * | `graph.redraw` | `{ layerId? }` (default `'graph'`) | button — re-project the layer |
 * | `graph.erase` | `{ layerId?, clickSelectId? }` (default `'graph'` / `'click-select'`) | button — deletes the click-selection when there is one (active), else clears the layer via `graph.clear`; undoable |
 * | `clipboard.cut` / `.copy` / `.paste` / `.delete` | `{ layerId?, clickSelectId? }` | button — over the layer's `GraphClipboard` and the click-selection; undoable |
 * | `layout.activate` | `{ value }` | choice — overrides the engine's so the facade's auto-run is the only run |
 * | `tool.active` | `{ tools?, value }` — the modeller tool = `view.interaction.viewMode` | choice; also a per-tool toggle (active while the mode is `args.value`) |
 * | `tool.nodeKind` | `{ kinds?, value }` — `viewModeArgs.nodeKind`; `kinds` maps key → label | choice, enabled while the tool is `add` |
 *
 * The clipboard a command uses is the owning `GraphCanvas`'s, per layer
 * ({@link GraphEditAccess}) — so saved Cut / Paste controls work on every graph
 * canvas, with no provider mounted. Undo / redo are the engine's
 * `history.undo` / `history.redo` over `canvas.history`, which every graph
 * layer's store records into.
 *
 * Names are public API (`namespace.verb`): renaming one breaks saved panels.
 */

/**
 * Default path types an edge-type picker offers, in display order — the three
 * common routing styles plus the rounded / smooth orthogonal variants.
 */
declare const DEFAULT_EDGE_TYPES: readonly EdgePathType[];
/** Human labels for the built-in {@link EdgePathType} values. */
declare const DEFAULT_EDGE_TYPE_LABELS: Record<string, string>;
/**
 * The `graph.erase` command body: delete the click-selection (one undoable
 * entry), or clear the layer when nothing is selected — through the
 * registry's `graph.clear` (aimed at the same layer), so an override applies.
 * Carries no palette metadata — {@link registerGraphEditCommands} adds it.
 *
 * @param defaultLayerId The layer when `args.layerId` is absent. Default `'graph'`.
 */
declare function eraseCommand(defaultLayerId?: string): CanvasCommand<Canvas>;
/** `{ layerId? }` args (default `'graph'`). */
type LayerArgs = {
    layerId?: string;
} | undefined;
/** `{ layerId?, clickSelectId? }` args — a command over the click-selection of a layer. */
type SelectionArgs = {
    layerId?: string;
    clickSelectId?: string;
} | undefined;
/**
 * The graph commands and their `args` — the command map `GraphCanvas.commands`
 * is typed with (over {@link GraphCanvasCommandMap}). Keys match the table above.
 */
interface GraphCommandMap {
    'select.mode': {
        value?: string;
        modes?: Record<string, string>;
        labels?: Record<string, string>;
    } | undefined;
    'graph.edgeType': {
        layerId?: string;
        types?: string[];
        value?: string;
    } | undefined;
    'graph.clear': LayerArgs;
    'graph.redraw': LayerArgs;
    'graph.erase': SelectionArgs;
    'clipboard.cut': SelectionArgs;
    'clipboard.copy': SelectionArgs;
    'clipboard.paste': SelectionArgs;
    'clipboard.delete': SelectionArgs;
    'tool.active': {
        value?: string;
        tools?: string[];
    } | undefined;
    'tool.nodeKind': {
        value?: string;
        kinds?: Record<string, string>;
    } | undefined;
    'layout.activate': {
        value?: string;
    } | undefined;
}
/**
 * Every command a `GraphCanvas` holds: the engine's, with the graph's
 * override (`layout.activate`) replacing its.
 */
type GraphCanvasCommandMap = Omit<EngineCommandMap, keyof GraphCommandMap> & GraphCommandMap;
/**
 * How the graph commands reach the per-layer edit state their canvas owns —
 * `GraphCanvas.clipboard`.
 */
interface GraphEditAccess {
    /** The `GraphClipboard` over graph layer `layerId`'s store, or `null`. */
    clipboard(layerId: string): GraphClipboard | null;
}
/** The graph commands over the per-layer clipboard — see {@link registerGraphEditCommands}. */
type EditCommandName = 'graph.clear' | 'graph.erase' | 'clipboard.cut' | 'clipboard.copy' | 'clipboard.paste' | 'clipboard.delete';
/** Options for {@link registerGraphEditCommands}. */
interface RegisterGraphEditCommandsOptions {
    /** The layer a command targets when `args.layerId` is absent (and its described default). Default `'graph'`. */
    layerId?: string;
    /** Register only these (default: all of {@link EditCommandName}). */
    only?: readonly EditCommandName[];
}
/**
 * Register the clipboard commands (`clipboard.*`, `graph.clear`,
 * `graph.erase`) over `access`, with the same args, bodies and palette
 * metadata `GraphCanvas` registers — so an override (canvas-react's
 * `GraphClipboardProvider`) can't drift from the built-ins. Each honours `args.layerId`, falling back to `opts.layerId`; an
 * override covering one layer delegates the others through `access`.
 *
 * Registrations stack over same-named ones. Returns a disposer that removes
 * exactly these, restoring whatever was underneath.
 */
declare function registerGraphEditCommands(registry: CommandRegistry<Canvas>, access: GraphEditAccess, opts?: RegisterGraphEditCommandsOptions): () => void;

/**
 * `GraphCanvas` — the graph-domain entry point. Register layers/behaviours
 * imperatively (their classes live in code, not config); drive their visual
 * options through the serialisable `update()` / `get()` config inherited from
 * `Canvas`. `GraphCanvas` adds graph-flavoured typed lookups, the graph
 * commands, and a `GraphClipboard` per `GraphLayer` (`clipboard(id)`), so the
 * clipboard works with no UI provider. Undo is the canvas's own
 * `canvas.history`: every `GraphLayer`'s store records into it.
 *
 * @example
 * ```ts
 * const gc = new GraphCanvas();
 * await gc.init({ container: el });
 *
 * // register instances imperatively:
 * gc.layers.add(new BackgroundLayer({ id: 'bg' }));
 * gc.layers.add(new GraphLayer({ id: 'graph', options: { node: { style: { bgFill: tint } } } }));
 * gc.behaviours.register(new HoverActivateBehaviour({ id: 'hover', targetLayerId: 'graph', enabled: true }));
 *
 * const graph = gc.layer('graph')!;        // typed as GraphLayer
 * graph.setData({ nodes, edges });
 *
 * // serialisable config — drives a settings UI / save-load:
 * gc.update({ layers: { bg: { patternType: 'grid', color: 0x334155 } } });
 * ```
 */

/** Construction options for {@link GraphCanvas}: the engine's, plus the clipboard. */
interface GraphCanvasOptions extends CanvasOptions {
    /** Every `GraphLayer` gets a `GraphClipboard`; `pasteOffset` shifts pasted nodes (default `{ x: 24, y: 24 }`). */
    clipboard?: {
        pasteOffset?: Vec2$1;
    };
}
declare class GraphCanvas extends Canvas {
    /**
     * The engine's commands plus the graph's (`select.mode`, `graph.*`,
     * `clipboard.*`, `tool.*`), typed with
     * {@link GraphCanvasCommandMap}. Type-only redeclaration — same instance.
     */
    readonly commands: CommandRegistry<Canvas, GraphCanvasCommandMap>;
    private offActiveLayout;
    /** Per graph layer id, its clipboard and bridges (see the constructor). */
    private readonly editState;
    private readonly clipboardOptions;
    /**
     * Adds the graph commands (`select.mode`, `graph.edgeType`, `graph.clear`,
     * `clipboard.*`, …) to `commands`, and gives every `GraphLayer` — on
     * `scene:layer:add`, disposed on remove / destroy — its own:
     *
     * - **`GraphClipboard`** ({@link clipboard});
     * - **command-state bridges** to `commands.invalidate()`: the clipboard's
     *   `change`, and the layer's edge-template changes (`style:changed`, scope
     *   `edge`). Neither is in the view store, so bound controls follow both.
     */
    constructor(opts?: GraphCanvasOptions);
    /**
     * The `GraphClipboard` over graph layer `layerId`'s store, or `null` when
     * there is no such `GraphLayer`. The `clipboard.*` commands and canvas-react's
     * `useClipboard` use it.
     */
    clipboard(layerId?: string): GraphClipboard | null;
    /** Typed layer lookup; defaults to `GraphLayer`. */
    layer<T extends Layer = GraphLayer>(id: string): T | undefined;
    /** Typed behaviour lookup. */
    behaviour<T extends Behaviour = Behaviour>(id: string): T | undefined;
    /** Typed layout lookup. */
    layout<T extends Layout = Layout>(id: string): T | undefined;
    init(opts: CanvasOptions): Promise<void>;
    update(patch: CanvasConfig, action?: string): void;
    destroy(): void;
    /** Build `layer`'s clipboard and bridge its state to bound controls. */
    private createEditState;
    private disposeEditState;
    /**
     * Auto-run the active layout (`config.activeLayout`) against its target
     * layer, now if it already has data and again whenever what it places
     * changes: nodes added / removed, or explicitly hidden / shown (layouts skip
     * hidden nodes, so a hide re-flows the rest). Position-only updates (drags,
     * the sim's own writes) don't re-trigger it, so there's no loop. Collapse
     * doesn't either — `CollapseExpandBehaviour` owns that re-flow (anchored,
     * opt-in via `relayoutOnToggle`).
     *
     * Data-triggered runs follow the layout's {@link Layout.onData}: throttled
     * to one run per `throttleMs` (leading + trailing), and with
     * `preserveCamera` they leave the view where it is.
     */
    private wireActiveLayout;
}

/**
 * The selection-mode rule, shared by the `select.mode` command
 * (`graphCommands.ts`) and `canvas-react`'s `useSelectMode` hook, so a toolbar
 * picker and a saved control panel can never disagree about which mode is on.
 *
 * A **modes map** is `mode key → behaviour id`, e.g.
 * `{ click: '', brush: 'brush-select', lasso: 'lasso-select' }`. An empty id
 * means the mode needs no behaviour of its own (click select is always on);
 * every non-empty id is a behaviour the switch enables / disables exclusively.
 */
/**
 * The currently-active selection mode.
 *
 * Resolution order:
 * 1. the first mode (in key order) whose **non-empty** behaviour id is enabled;
 * 2. else the first mode whose id is `''` (the behaviour-less mode, e.g. `click`);
 * 3. else the first key;
 * 4. else `null` (an empty map).
 *
 * The caller supplies how "enabled" is read, so each keeps its own source: the
 * command reads the live behaviour (`canvas.behaviours.get(id)?.enabled`), the
 * React hook reads the reactive definition (`definition.behaviours[id].enabled`).
 * The two agree whenever writes go through `canvas.update`.
 *
 * @param modes     Mode key → behaviour id (`''` = no behaviour).
 * @param isEnabled Whether the behaviour with this id is currently enabled.
 * @returns The active mode key, or `null` when `modes` is empty.
 */
declare function resolveSelectMode(modes: Record<string, string>, isEnabled: (behaviourId: string) => boolean): string | null;
/**
 * The `canvas.update({ behaviours })` patch that switches to mode `next`:
 * `{ [id]: { enabled: mode === next } }` for every mode with a non-empty
 * behaviour id, so exactly `next`'s behaviour (if it has one) ends up enabled
 * and every other mode's behaviour disabled. Behaviour-less modes contribute
 * nothing — switching to one simply disables all the others.
 *
 * @param modes Mode key → behaviour id (`''` = no behaviour).
 * @param next  The mode key to switch to.
 */
declare function selectModePatch(modes: Record<string, string>, next: string): Record<string, {
    enabled: boolean;
}>;

/**
 * The graph edit actions shared by `canvas-react`'s hooks (`useClearGraph`,
 * `useClipboard`) and the graph commands (`graph.clear`, `clipboard.*` —
 * `GraphCanvas`'s built-ins and the clipboard provider's plain-canvas forms),
 * so a toolbar button and a control-panel button can never behave
 * differently. Every edit is recorded by the layer's store into
 * `canvas.history`, so undo needs nothing from here. Plain functions over a
 * `Canvas` — no React — so they also run headless.
 *
 * Must not import `graphCommands.ts` (which imports this module).
 */

/**
 * Clear `layerId` — one undoable `'clear'` entry in `canvas.history` (the
 * store records the wipe with everything it removed, so Undo restores the
 * graph). No-op when the layer is missing or can't be cleared.
 *
 * @param canvas  The canvas holding the layer.
 * @param layerId The graph layer to clear.
 */
declare function clearGraphLayer(canvas: Canvas, layerId: string): void;
/**
 * The node and edge ids the click-select behaviour `clickSelectId` currently
 * holds, read at call time. Both lists are empty when the behaviour isn't
 * registered.
 */
declare function selectedElementIds(canvas: Canvas, clickSelectId: string): {
    nodeIds: string[];
    edgeIds: string[];
};
/**
 * Copy the current click-selection (read at call time) into `clipboard`'s
 * buffer. Not an edit, so never journalled.
 */
declare function copySelection(canvas: Canvas, clipboard: GraphClipboard, clickSelectId: string): void;
/**
 * Cut the current click-selection (read at call time): copy it to the buffer,
 * then delete it — one undoable step.
 */
declare function cutSelection(canvas: Canvas, clipboard: GraphClipboard, clickSelectId: string): void;
/**
 * Delete the current click-selection (read at call time) without touching the
 * buffer — one undoable step.
 */
declare function deleteSelection(canvas: Canvas, clipboard: GraphClipboard, clickSelectId: string): void;
/**
 * Paste the clipboard (one undoable step) and select what was pasted through
 * the click-select behaviour `clickSelectId`.
 */
declare function pasteAndSelect(canvas: Canvas, clipboard: GraphClipboard, clickSelectId: string): void;
/**
 * The layer-wide edge path type — `edgeDefaults.shape.pathType` — or
 * `undefined` when the template doesn't set one. Shared by the
 * `graph.edgeType` command and `useEdgeType`.
 */
declare function edgePathType(layer: GraphLayer): string | undefined;
/**
 * Switch every edge in the layer (and edges added later) to path type `type`
 * via `GraphLayer.setEdgeDefaults`. The prior `shape` is spread first, since
 * `setEdgeDefaults` replaces it wholesale — anchors / waypoints survive. The
 * layer emits `style:changed` (scope `edge`), which `GraphCanvas` bridges to
 * bound controls.
 */
declare function setEdgePathType(layer: GraphLayer, type: string): void;

/**
 * The position set a {@link OneShotPositionLayout} subclass computes for a run.
 *
 * `positions` is a flat `Float32Array` of length `ids.length * 2` — `x, y`
 * interleaved per id, the shape `GraphStore.setPositionsBulk` consumes. Return
 * `null` (or an empty `ids`) to no-op the run (e.g. no nodes, no root).
 */
interface LayoutPositions<M = unknown> {
    ids: string[];
    positions: Float32Array;
    /**
     * Optional per-run payload threaded back to {@link OneShotPositionLayout.onPositionsApplied}
     * after the positions settle — e.g. derived geometry that depends on the final
     * positions (ELK edge waypoints, circle-pack sizes, sunburst arcs). Threaded
     * through the run rather than stashed on the instance, so overlapping runs
     * can't clobber each other.
     */
    meta?: M;
}
/** Options shared by every one-shot (deterministic) layout. */
interface OneShotLayoutOptions extends LayoutOptions {
    /**
     * Animate nodes from their current positions to the computed layout instead
     * of snapping. `true` uses {@link DEFAULT_POSITION_TRANSITION_MS}; a number is
     * an explicit duration in ms; `false` snaps. Default `true`.
     *
     * Serializable (boolean | number) so it rides the canvas config bag and binds
     * straight to a lil-gui control.
     */
    transition?: boolean | number;
    /**
     * Easing curve for the transition, as a serializable {@link EasingName} key.
     * Default `'easeOutCubic'`. Ignored when `transition` is `false`.
     */
    transitionEase?: EasingName;
    /**
     * Include explicitly-hidden nodes in the layout. Default `false` — hidden
     * nodes are excluded from placement so they don't perturb the visible graph,
     * and their last positions are left frozen (the layout never writes them).
     */
    includeHidden?: boolean;
}
/**
 * Base class for **one-shot** layouts — those that compute a final position for
 * every node in a single pass (ELK, d3-hierarchy trees/dendrograms, grid, snake,
 * circular, radial, …), as opposed to iterative simulations like
 * `D3ForceLayout` that paint their own per-tick evolution.
 *
 * It owns the parts every one-shot layout shares, so subclasses don't re-implement
 * them:
 *
 *  - the serializable `transition` / `transitionEase` options;
 *  - **snap-or-tween**: writing the computed positions straight to the store, or
 *    gliding each node from its current spot to the target via the engine's
 *    {@link animatePositions} helper;
 *  - **cancellation**: a run-token + in-flight-transition handle so a re-`apply()`
 *    (or `stop()`) aborts the previous run/transition cleanly and the next run
 *    starts from wherever the nodes currently are;
 *  - the uniform `start` / `tick` / `end` lifecycle (so `fitContent`-on-`end`
 *    fires at the same moment — after the transition settles — for all of them).
 *
 * Subclasses implement {@link computeLayout} (produce the target positions) and
 * may override {@link onPositionsApplied} (e.g. write computed edge geometry once
 * the nodes have landed).
 */
declare abstract class OneShotPositionLayout<TOpts extends OneShotLayoutOptions = OneShotLayoutOptions> extends Layout<GraphLayer> {
    /**
     * The live options bag. Subclasses read their own fields off this (it's the
     * merged result of the constructor opts and every {@link setOptions} patch),
     * rather than keeping a private copy — so config edits take effect.
     */
    protected opts: TOpts;
    /** `false` | `true` (default ms) | explicit ms. See {@link OneShotLayoutOptions.transition}. */
    protected transition: boolean | number;
    /** Easing key for the transition. See {@link OneShotLayoutOptions.transitionEase}. */
    protected transitionEase: EasingName;
    /** Monotonic run id. Each `apply()` bumps it; stale runs check against it and bail. */
    private runToken;
    /** True while a run (compute + transition) is in flight. */
    protected running: boolean;
    /** In-flight position transition, so `stop()` can cancel it. */
    private activeTransition;
    /** Resolver for the `apply()` Promise blocked on the transition. */
    private transitionResolve;
    /** Last layer `apply()` ran against — so `setOptions` can re-run live. */
    private lastLayer;
    constructor(opts?: TOpts);
    /**
     * Live-reconfigure. Called by `Canvas.update({ layouts: { id: patch } })` (and
     * once at init with the `config.layouts[id]` slice). Merges the patch into
     * {@link opts}, re-derives the transition settings, and — if the layout has
     * already run against a layer — re-applies so the change shows immediately
     * (the one-shot analog of `D3ForceLayout` re-heating its simulation). Before
     * the first `apply()` it just records the options (no premature run).
     */
    setOptions(patch: Partial<TOpts>): void;
    /**
     * Compute the target position for every node this layout places. Called once
     * per `apply()`. May be async (e.g. ELK). Return `null` / empty `ids` to no-op.
     *
     * Implementations only compute — the base writes the result (snap or tween),
     * manages cancellation, fires the lifecycle, and applies
     * {@link LayoutRunOptions.anchorNodeId} (so subclasses never anchor
     * themselves). `run` is this run's options, for layouts that change *how*
     * they solve a re-flow (e.g. ELK seeding the current order).
     */
    protected abstract computeLayout(layer: GraphLayer, run: Readonly<LayoutRunOptions>): LayoutPositions | null | Promise<LayoutPositions | null>;
    /**
     * Shift a run's `meta` by `(dx, dy)` — called when an anchored run translates
     * the computed positions, for subclasses whose `meta` holds **absolute**
     * coordinates that must move with them (e.g. ELK's routed edge bend points).
     * Default: returns `meta` unchanged, which is right for translation-invariant
     * payloads (pack radii, sunburst arcs).
     */
    protected translateMeta(meta: unknown, _dx: number, _dy: number): unknown;
    /**
     * Whether a node should be placed by this run. Excludes explicitly-hidden
     * nodes unless {@link OneShotLayoutOptions.includeHidden} is set. Subclasses
     * call this while snapshotting `layer.store.nodes()` so hidden nodes stay
     * frozen at their last positions. Edges incident to a skipped node should be
     * dropped from the layout graph too (both endpoints must be placeable).
     */
    protected shouldPlaceNode(node: {
        hidden?: boolean;
    }): boolean;
    /**
     * Hook run once the node positions have settled (immediately when snapping,
     * or after the transition completes), before `tick` / `end`. `meta` is the
     * payload {@link computeLayout} returned for this run. Override to write
     * derived geometry that depends on final positions — e.g. ELK edge routing,
     * pack sizes, sunburst arcs. Default no-op.
     */
    protected onPositionsApplied(_layer: GraphLayer, _meta: unknown): void;
    /**
     * Whether this run should animate (vs snap), on top of the `transition`
     * option. Defaults to `true`. Override to veto for runs whose output isn't a
     * pure position move — e.g. a mode that replaces node *geometry* (circle-pack
     * sizes, sunburst arcs) where tweening the positions would look wrong.
     */
    protected shouldTransition(_layer: GraphLayer): boolean;
    apply(layer: GraphLayer, run?: LayoutRunOptions): Promise<void>;
    /** Cancel an in-flight run. Positions already written stay in the store. */
    stop(): void;
    /** Resolve the `transition` option to a concrete duration in ms (`0` = snap). */
    private transitionDurationMs;
    /** Snap or tween `target` onto the store, then run the settle hook + lifecycle. */
    private writePositions;
}

/**
 * Group-aware layout helpers — the shared rules every layout needs when the
 * graph contains **groups** (container nodes whose resolved style carries
 * `group`; see {@link GraphLayer.isGroupNode}).
 *
 * Five layout packages need the same four answers, and none of them should own
 * a private copy:
 *
 *  1. **Which nodes does this run place?** — hidden nodes are excluded by the
 *     base ({@link OneShotPositionLayout.shouldPlaceNode}), but the members of a
 *     *collapsed* group are hidden **derivedly**: `GraphLayer` computes their
 *     invisibility from {@link GraphLayer.collapsedAncestor} at render time and
 *     never sets `node.hidden`. A layout that only tests `hidden` therefore lays
 *     out nodes nobody can see, reserving empty space in the picture.
 *  2. **What nests under what?** — `parentId` is the *general* hierarchy field
 *     (it carries plain trees as well as group membership), so nesting on it
 *     blindly turns an ordinary parent/child tree into a container. Only a
 *     parent that is a **group node** nests.
 *  3. **Where do edges to invisible nodes go?** — they must be re-pointed at the
 *     collapsed ancestor that visually stands in for them (mirroring
 *     {@link GraphLayer.effectiveEndpoint}, which is what the renderer does),
 *     not dropped: dropping them strips a collapsed group of every edge its
 *     members contribute, so it drifts free of the graph it belongs to.
 *  4. **How big is the box around a group's members?** — from the group's own
 *     {@link GroupOptions}, not a magic number.
 *
 * These helpers are pure reads over `layer` + `layer.store`; they never mutate.
 *
 * @see docs/group-aware-layouts-plan.md
 */

/** Width/height box a layout reserves for one node. */
interface LayoutNodeSize {
    width: number;
    height: number;
}
/** Per-side insets between a group's member bounding box and its frame. */
interface GroupInsets {
    top: number;
    right: number;
    bottom: number;
    left: number;
}
/**
 * An edge as a layout sees it, after collapsed endpoints have been re-pointed
 * at their visible stand-in and duplicates merged.
 */
interface LayoutEdge {
    /** Original edge id, or a synthesised one when several edges merged. */
    id: string;
    source: string;
    target: string;
}
/**
 * One node of the group forest: `children` is non-empty only when this node is
 * an expanded group node with at least one placeable child.
 */
interface GroupForestNode {
    id: string;
    /** True when this node is a group container (expanded or collapsed). */
    isGroup: boolean;
    /** True when this node is a group whose members are hidden inside it. */
    isCollapsed: boolean;
    /** Placeable members, nested. Empty for leaves and collapsed groups. */
    children: GroupForestNode[];
}
/**
 * Whether `node` should be placed by a layout run.
 *
 * Two independent reasons to skip a node, both meaning "invisible, so leave its
 * position frozen":
 *
 *  - it is explicitly hidden (`node.hidden`) and `includeHidden` is off — the
 *    rule {@link OneShotPositionLayout.shouldPlaceNode} already applies;
 *  - it sits under a **collapsed** group. This one is invisible to a plain
 *    `hidden` check because collapse-hiding is derived, never stored — which is
 *    why every layout that doesn't call this helper silently lays out the
 *    members of collapsed groups.
 *
 * `includeHidden` covers both: asking for hidden nodes asks for collapsed
 * members too, so a debug run can still see everything.
 */
declare function isPlaceableNode(layer: GraphLayer, node: GraphNode, includeHidden?: boolean): boolean;
/**
 * The set of node ids a layout run places, per {@link isPlaceableNode}.
 * Computed once per run and threaded into the other helpers, so the
 * `collapsedAncestor` chain-walk happens once per node rather than per query.
 */
declare function collectPlaceableNodes(layer: GraphLayer, includeHidden?: boolean): Set<string>;
/**
 * Resolve which node an edge endpoint attaches to for layout purposes: the
 * outermost collapsed group standing in for `id`, or `id` itself when visible.
 *
 * This mirrors {@link GraphLayer.effectiveEndpoint} but iterates **to a
 * fixpoint**. `collapsedAncestor` returns the *nearest* collapsed ancestor,
 * which can itself sit inside a higher collapsed group (nested collapse); one
 * hop would leave the endpoint on a node that is itself invisible. Looping
 * until the answer stops changing lands on the outermost stand-in — the node
 * the renderer actually draws.
 *
 * The loop is bounded by the number of placeable-or-not nodes seen, so a
 * `parentId` cycle terminates instead of spinning.
 */
declare function effectiveLayoutEndpoint(layer: GraphLayer, id: string): string;
/**
 * Snapshot the store's edges as layout edges: endpoints resolved through
 * {@link effectiveLayoutEndpoint}, self-loops dropped, endpoints outside
 * `placeable` dropped, and parallel results **deduplicated**.
 *
 * Dedup matters for two different reasons. ELK rejects duplicate edge ids
 * outright, and force layouts double-count parallel links — so a collapsed
 * group holding twenty edges to the same neighbour would be yanked toward it
 * twenty times as hard as the picture justifies.
 */
declare function collectLayoutEdges(layer: GraphLayer, placeable: ReadonlySet<string>): LayoutEdge[];
/**
 * Whether an edge id produced by {@link collectLayoutEdges} still refers to a
 * real stored edge. Geometry written back per-edge (ELK's waypoints) must skip
 * merged ids — they stand for several edges at once and address none of them.
 */
declare function isMergedEdgeId(id: string): boolean;
/**
 * Build the forest of placeable nodes, nesting members **only** under parents
 * that are group nodes.
 *
 * Three rules, each of which a naive `childrenOf` recursion gets wrong:
 *
 *  - **A non-group parent doesn't contain anything.** Its children are emitted
 *    as roots (flat siblings), so an ordinary `parentId` tree lays out exactly
 *    as it does today rather than being packed into boxes.
 *  - **A collapsed group is a leaf.** Its members are already excluded from
 *    `placeable`; the group itself is placed as the ordinary node the renderer
 *    draws in their stead.
 *  - **Cycles degrade to flat.** A `parentId` cycle (or a self-parent) would
 *    otherwise recurse forever; a visited set drops the repeat instead.
 */
declare function buildGroupForest(layer: GraphLayer, placeable: ReadonlySet<string>): GroupForestNode[];
/**
 * The insets between a group's member bounding box and its frame, read from the
 * group's resolved {@link GroupOptions}.
 *
 * `headerHeight` is added to the **top** inset: the band is reserved above the
 * members for the group's title (and for a `tabbed-rect` frame it's the tab
 * itself), so laying members out into it would put them under the title.
 * Matching the layout to `GraphLayer`'s own auto-fit projection here is what
 * stops the frame growing again the moment it's drawn.
 */
declare function groupInsets(layer: GraphLayer, node: GraphNode): GroupInsets;
/**
 * A group's declared size floor, **as an outer box** — what the frame is
 * guaranteed to paint at, so a layout can reserve exactly that much room and
 * no sibling crowds it.
 *
 * Returns `undefined` when the author declared no floor, which is the signal
 * to let the layout size the container purely from its children.
 *
 * ### Three things this gets right that are easy to get wrong
 *
 * **1. It applies under `autoFit` too.** `GroupOptions` documents the declared
 * `width` / `height` / `radius` as "a **lower bound** in this mode", and
 * {@link GraphLayer} honours it — `projectGroupShape` computes
 * `max(declared, childrenExtent) + padding`. A layout that ignored the floor
 * would pack siblings against a frame that then paints wider than the box
 * reserved for it, and the frames overlap.
 *
 * This used to bail out on `autoFit`, reasoning that the stored size is last
 * frame's computed fit and honouring it would ratchet the frame permanently
 * larger. That reasoning does not apply here: the fit is computed into a
 * **local** inside `GraphLayer.nodeSpec` and never written back to the record,
 * so `style.shape` is still the author's declared value. Last frame's fit
 * lives only in the projected spec and in `node.boundingBox` — and neither is
 * read below, which is what keeps this ratchet-free.
 *
 * **2. `GroupOptions` wins over the shape.** `projectGroupShape` reads
 * `group.width ?? shape.width`, so an author who sets the floor the documented
 * way — on the group, not on the silhouette — must be visible here too. Read
 * in the other order (or not at all) and `group: { width: 400 }` is invisible
 * to every layout.
 *
 * **3. The floor is the OUTER box, not the content box.** The frame paints
 * `declared + padding` on each side (plus the header band on top), so a floor
 * quoted in content terms under-reserves by exactly the insets. Adding
 * {@link groupInsets} here matches `projectGroupShape`'s arithmetic for all
 * three frame kinds: a `rect` adds `2 * padding + header`, a `tabbed-rect`
 * adds `2 * padding` to its body and the tab contributes the header above it —
 * the same total — and a `circle` grows its radius by `padding`, i.e. the
 * diameter by `2 * padding`.
 *
 * @returns the outer `width` × `height` the frame will not shrink below, or
 *   `undefined` when no floor was declared.
 */
declare function groupSizeFloor(layer: GraphLayer, node: GraphNode): LayoutNodeSize | undefined;
/**
 * Resolve a node's layout footprint: the cached render size when the node has
 * been drawn, else the shape registry's computed bounds, else a fallback.
 *
 * Prefers `node.boundingBox` (written by the layer after each draw) so a
 * composite card isn't re-composed part-by-part once per layout run.
 */
declare function resolveNodeSize(layer: GraphLayer, node: GraphNode, fallback?: LayoutNodeSize): LayoutNodeSize;

/**
 * `SubgraphPositionLayout` — the base for one-shot layouts that can be run over
 * an **arbitrary set of nodes and edges**, rather than only over a whole layer.
 *
 * Subclasses implement {@link computeSubgraphLayout} (place these ids, given
 * these edges and sizes) instead of `computeLayout(layer)`. Declaring that
 * capability buys them **group containment for free**: this base runs the
 * layout once per group — deepest first — packs each group's members into a box
 * sized from the group's own {@link GroupOptions}, treats that box as a single
 * super-node one level up, and finally translates every member into place.
 *
 * ## Why a declared capability rather than a fake layer
 *
 * The alternative was to hand a layout a filtered *view* of the `GraphLayer` and
 * let it believe it was laying out the whole graph. That needs no subclass
 * changes, but it makes "can this layout be nested?" a runtime gamble: the view
 * has to implement whatever slice of the layer/store surface each layout happens
 * to reach for, discovered by inspection and free to regress silently. A layout
 * that implements {@link computeSubgraphLayout} states its independence from the
 * layer in the type system — and a snapshot-driven compute is the shape these
 * layouts want anyway if they ever move off the main thread.
 *
 * ## What recursion cannot do
 *
 * A group's members are laid out **blind to the outside world** — edges leaving
 * the group don't influence placement inside it, so a member with an external
 * neighbour can land on the far side of its box. Engines with native compound
 * support (ELK's `elk.hierarchyHandling: INCLUDE_CHILDREN`) route across
 * container boundaries and don't have this weakness, which is why `ElkLayout`
 * keeps its own path instead of extending this class. Recursion buys correct
 * *containment* everywhere; it doesn't buy ELK-quality aesthetics.
 *
 * @see docs/group-aware-layouts-plan.md
 */

/** A point in layout space. Centre coordinates, matching `GraphNode.position`. */
interface Vec2 {
    x: number;
    y: number;
}
/**
 * The node/edge set handed to {@link SubgraphPositionLayout.computeSubgraphLayout}.
 *
 * A subgraph is self-contained: every edge's endpoints are in `ids`, and every
 * id has a size. When the run is nested, `groupId` names the group whose members
 * these are — a layout may use it for messages, but must not read the store
 * through it (the point of the snapshot is that it doesn't have to).
 */
interface LayoutSubgraph {
    /** The nodes to place. Never empty. */
    readonly ids: readonly string[];
    /** Edges between `ids`. Deduplicated; no self-loops. */
    readonly edges: readonly LayoutEdge[];
    /**
     * The footprint to reserve for `id`. For a nested group this is the **box**
     * computed from its members, not the frame's stored size.
     */
    sizeOf(id: string): LayoutNodeSize;
    /** Current position of `id`, when it has one (for layouts that seed from it). */
    getPosition(id: string): Vec2 | undefined;
    /**
     * The node's opaque `data` payload — what value accessors read (circle-pack
     * sizing, sunburst weights). Kept on the snapshot so a layout never needs the
     * store to reach it.
     */
    dataOf(id: string): unknown;
    /**
     * Whether `id` is a group container rather than an ordinary node.
     *
     * A layout that derives topology from *edges* needs this: a group frame has
     * no edges of its own, so an algorithm that treats every id as part of the
     * edge graph will read it as a disconnected component (a second tree root, an
     * isolated cluster) and either fail or place it nonsensically. Layouts that
     * only place boxes can ignore it.
     */
    isGroup(id: string): boolean;
    /** The group these nodes are members of; `undefined` at the top level. */
    readonly groupId?: string;
}
/** Options shared by every layout that can lay groups out recursively. */
interface SubgraphLayoutOptions extends OneShotLayoutOptions {
    /**
     * Lay `parentId` **groups** out as containers — each group's members are
     * placed among themselves, then the whole group is placed as one box at its
     * parent's level. Only nodes whose resolved style carries `group` count as
     * containers; a plain `parentId` tree is unaffected.
     *
     * Default `false`. Containment is exact, but a group's interior is solved
     * without sight of its external edges — see the class docs. Prefer
     * `ElkLayout` when edge routing across group boundaries matters.
     */
    includeGroups?: boolean;
}
declare abstract class SubgraphPositionLayout<TOpts extends SubgraphLayoutOptions = SubgraphLayoutOptions> extends OneShotPositionLayout<TOpts> {
    /**
     * Place `sub.ids` using `sub.edges`, returning **centre** coordinates.
     *
     * Called once for a flat run, or once per group plus once for the top level
     * when {@link SubgraphLayoutOptions.includeGroups} is on. Implementations must
     * treat the subgraph as the whole world: coordinates are interpreted relative
     * to whatever container the run belongs to, so absolute placement (centring on
     * the origin, etc.) is fine and gets translated afterwards.
     *
     * Return `null` to no-op the run.
     */
    protected abstract computeSubgraphLayout(sub: LayoutSubgraph): LayoutPositions | null | Promise<LayoutPositions | null>;
    /**
     * Whether this layout can be run recursively over groups **in its current
     * configuration**. Default `true`.
     *
     * Override to veto per-mode. Two things make a layout un-recursable: output
     * that isn't purely positional (a mode that also assigns node *geometry* —
     * circle-pack radii, sunburst arcs — since the per-run `meta` carrying that
     * geometry can't be merged across many runs), or a topology contract the
     * per-group subgraph can't satisfy. Vetoing falls back to one flat run, which
     * still prunes collapsed members and still lets `autoFit` frames wrap their
     * members — it just doesn't pack them into boxes.
     */
    protected canRecurseGroups(): boolean;
    /**
     * Snapshot the layer and either run the subclass once (flat) or drive the
     * group recursion. Subclasses normally leave this alone — override only for a
     * layout that needs the layer itself, and then it probably shouldn't extend
     * this class.
     */
    protected computeLayout(layer: GraphLayer): Promise<LayoutPositions | null>;
    /** Run the subclass over one subgraph, normalising an empty result to `null`. */
    private runSubgraph;
    /**
     * The recursive group solve: post-order to size every group from its members,
     * then pre-order to translate local solutions into world coordinates.
     */
    private solveRecursively;
}

/**
 * `HoverActivateBehaviour` — toggles a named visual state on hovered nodes /
 * edges (and optionally their N-hop neighbours), with optional dimming of
 * everything else.
 *
 * Layer-scoped: constructed with a `targetLayerId` referencing a
 * {@link GraphLayer}. Subscribes to that layer's renderer pointer events
 * (`shape:pointerover` / `connector:pointerover`) and drives layer state via
 * `layer.store.setNodeState` / `layer.store.setEdgeState`.
 *
 * Default `enabled: false` — register, then explicitly enable. Matches the
 * project rule that no behaviour auto-activates.
 *
 * Defaults align with the canonical state catalogue auto-merged into
 * every `GraphLayer`: `state: 'hovered'` for the focal (and N-hop
 * neighbours when `degree > 0`), and optional `inactiveState: 'dimmed'`
 * for everything else. Override these when the project's state
 * vocabulary diverges.
 *
 * @example
 * ```ts
 * // Layer defaults already include `hovered`, `highlighted`, `dimmed` —
 * // no setup needed beyond registering the behaviour.
 *
 * canvas.behaviours.register(
 *   new HoverActivateBehaviour({
 *     id: 'hover',
 *     targetLayerId: 'graph',
 *     enabled: true,
 *     // state defaults to 'hovered'
 *     inactiveState: 'dimmed',
 *     degree: 1,
 *   }),
 * );
 * ```
 */

/** Element kind for hover targets. */
type HoverableElementType = 'shape' | 'connector';
/** Edge-traversal direction filter for neighbour expansion. */
type HoverDirection = 'in' | 'out' | 'both';
/**
 * Which group frames a pointer behaviour declines to act on, keyed on what a
 * frame *is* rather than on what its `GraphNode.type` is called.
 *
 * - `'expanded'` — **the default.** An expanded frame is scenery: it is drawn,
 *   it is picked (drag / resize / collapse all need that), but hover and
 *   click-select pass it by. A *collapsed* frame stays interactive — it is the
 *   only visible stand-in for the members it hides, so making it inert would
 *   leave a collapsed group with no interaction at all.
 * - `'always'` — every frame, open or closed.
 * - `'never'` — no structural exclusion; a frame hovers and selects like any
 *   other node. This is the pre-2026-09-22 behaviour, and what a graph that
 *   *uses* frame interaction (e.g. hovering a frame to raise its contents)
 *   asks for.
 *
 * Resolved through {@link GraphLayer.getGroupRole}, so it needs nothing from
 * the data: a group is a node whose resolved style carries `group`.
 *
 * Orthogonal to {@link HoverActivateBehaviourOptions.excludeNodeTypes}, which
 * stays the answer for scenery that isn't a group — either list vetoes.
 */
type GroupExclusion = 'expanded' | 'always' | 'never';
/** Element handed to hover callbacks. */
interface HoverableElement {
    readonly id: string;
    readonly type: HoverableElementType;
    /** Arbitrary user payload from `node.data` or `edge.data`. */
    readonly data: unknown;
}
/** Constructor options for `HoverActivateBehaviour`. */
interface HoverActivateBehaviourOptions extends BehaviourOptions {
    /** Required — the `GraphLayer` id this behaviour drives. */
    targetLayerId: string;
    /**
     * Per-target enable predicate. `boolean` is a global on/off; a function
     * runs per pointer-over and may veto activation. Default `true`.
     */
    enable?: boolean | ((element: HoverableElement) => boolean);
    /**
     * Whether hovering **directly** over an edge activates it. When `false` (the
     * default) the behaviour ignores `connector:pointerover` entirely, so only
     * nodes drive the hover. Neighbour-edge highlighting is unaffected: a hovered
     * node's connecting edges still light up when `degree > 0` (that path is
     * governed by `degree`, not this flag). Set `true` to also activate edges
     * under the pointer.
     *
     * Equivalent to `enable: (el) => el.type !== 'connector'`, but a discoverable
     * first-class flag (and surfaced in the settings editor). Toggling it off
     * while an edge is hovered releases that edge immediately.
     */
    hoverEdges?: boolean;
    /**
     * Node types that never become the focal hover. A node whose
     * `GraphNode.type` appears here is ignored on `shape:pointerover` — the
     * pointer passes over it without activating anything, and without dimming
     * the rest of the graph.
     *
     * The serialisable counterpart of {@link enable}: same veto, expressed as
     * data so it round-trips through a saved `CanvasConfig` and shows up in the
     * settings editor. Prefer it; reach for `enable` only when the predicate
     * needs something no list can say.
     *
     * The motivating case is **scenery** — a node that is drawn but isn't
     * content. An expanded group frame is the archetype: it is picked like any
     * other shape (`plane: 'backdrop'` moves only where it *paints*), and with
     * `autoFit` it is mostly uncovered area, so grazing its padding hovers the
     * frame and — since a frame carries no edges for `degree` to expand into —
     * an `inactiveState` dims the entire graph.
     *
     * Scoped to the **focal** element only, exactly like {@link hoverEdges}.
     * Neighbour highlighting is untouched: if a hovered node's `degree`
     * expansion reaches an excluded node, that node still lights up as a
     * neighbour. This option says "don't hover *at* me", not "never show me as
     * related".
     *
     * Matching is by exact string, and applies whatever the node's condition —
     * a collapsed group frame of an excluded type is excluded too. Default `[]`
     * (nothing excluded). Removing a type while its node is hovered does not
     * retro-activate it; adding one releases an in-flight hover immediately.
     *
     * @example `excludeNodeTypes: ['package']` — package frames are scenery.
     */
    excludeNodeTypes?: string[];
    /**
     * Which group frames never become the focal hover — the **structural**
     * counterpart of {@link excludeNodeTypes}, which keys on a domain string.
     *
     * Default `'expanded'`: an expanded frame is inert, a collapsed one behaves
     * like an ordinary node. That is a change of behaviour from before
     * 2026-09-22, when a frame hovered like any other shape unless the graph
     * named its type — see `rfc:feat-2026-09-22-a-group-frame-is-scenery-but-every-graph-must-say-so`.
     *
     * Why a default rather than a recipe: a frame is scenery in *every* graph
     * that draws one, the property is structural (`style.group`), and with
     * `autoFit` most of a frame's area is uncovered — so grazing its padding
     * hovers the frame, and since a frame carries no edges for `degree` to
     * expand into, an {@link inactiveState} then dims the entire graph.
     *
     * Scoped to the **focal** element, exactly like {@link excludeNodeTypes}: a
     * frame reached by `degree` expansion still highlights as a neighbour. Set
     * `'never'` to opt a graph back in — {@link raiseActive} on an expanded
     * frame lifts its members and their internal edges, which is a real design
     * and the reason `'never'` exists.
     *
     * @example `excludeGroups: 'never'` — this diagram hovers its frames on purpose.
     */
    excludeGroups?: GroupExclusion;
    /**
     * Edge types that never become the focal hover. The {@link excludeNodeTypes}
     * sibling, keyed on `GraphEdge.type`.
     *
     * Only meaningful when {@link hoverEdges} is `true` — with edge hover off,
     * no edge is ever focal and this list has nothing to veto. As with nodes,
     * the veto is focal-only: an excluded edge still highlights as a hovered
     * node's neighbour when `degree > 0`. Default `[]`.
     */
    excludeEdgeTypes?: string[];
    /**
     * State name applied to the hovered focal element (and its N-hop
     * neighbours when `degree > 0`). Default `'hovered'` — matches the
     * canonical state catalogue auto-merged into every `GraphLayer`. Pass
     * a custom name when the behaviour should write a project-specific
     * state instead (e.g. `'focal'`).
     */
    state?: string;
    /**
     * State name applied to every element *not* in the active set. Leave
     * `undefined` to skip inactive dimming. Default `undefined`.
     */
    inactiveState?: string;
    /**
     * Lift the active set (the hovered focal element + its N-hop neighbours)
     * above the rest within its render layer for the duration of the hover, so
     * unrelated nodes / edges don't paint over the highlighted data. Edges raise
     * above other edges (still below all nodes); neighbour nodes raise above
     * other nodes. Reset when the hover clears. Visual-only — restacking doesn't
     * affect hit-testing. Default `true`.
     */
    raiseActive?: boolean;
    /**
     * N-hop neighbour radius. `0` = hovered element only; `1` = direct
     * neighbours + connecting edges; `N` = N-hop. Default `0`.
     */
    degree?: number;
    /** Direction for neighbour traversal. Default `'both'`. */
    direction?: HoverDirection;
    /**
     * Camera scale at or below which the behaviour swaps `state` for
     * `zoomedOutState` (and `zoomedOutEdgeState` for edges). The hovered set
     * gets re-painted through the swapped state names whenever the camera
     * crosses this threshold mid-hover. Omit (or leave both zoomed-out names
     * undefined) and the behaviour is identical to today.
     *
     * Typical use: at world-level zoom every node collapses to ~1 anti-aliased
     * pixel, so the normal `active` state is invisible against background
     * dots. A bigger `active-far` config (size + strokeWidth bumped) makes
     * the hovered node pop.
     */
    zoomThreshold?: number;
    /**
     * State name applied to the hovered node + N-hop neighbour nodes when
     * `camera.scale <= zoomThreshold`. Falls back to `state` when undefined
     * (no node-side zoom swap, but edges may still swap via
     * `zoomedOutEdgeState`).
     */
    zoomedOutState?: string;
    /**
     * State name applied to connecting edges when
     * `camera.scale <= zoomThreshold` AND `degree > 0`. Falls back to `state`
     * when undefined.
     */
    zoomedOutEdgeState?: string;
    /**
     * Gfx-transform scale multiplier applied to each hovered node (and the
     * N-hop neighbour nodes) when `camera.scale <= zoomThreshold`. Pure
     * transform write via {@link PrimitivesRenderer.scaleShape} — no geometry
     * rebuild, no styling change. Use this when you want the hovered node to
     * just *grow visually* at low zoom (so it stands out against ~1 px
     * background dots) while keeping its original colour, stroke, and label.
     *
     * Multiplies the existing `gfx.scale`, so if `NodeScaleLODBehaviour` is
     * also active it will overwrite the multiplier on the next zoom frame —
     * prefer `zoomedOutState` with a bigger `size` in that case. For stories
     * without an LOD behaviour, this is the cleanest "scale on hover" knob.
     *
     * Only nodes are scaled — connectors don't compose cleanly with
     * `gfx.scale` (the polyline would shift, not just thicken). The hovered
     * node's outgoing edges still anchor to its geometric position, which
     * sits inside the now-bigger silhouette — visually acceptable.
     *
     * `undefined` (default) and `1` both disable the multiplier.
     */
    zoomedOutScale?: number;
    /** Fired when an element first becomes hovered. */
    onHover?: (element: HoverableElement) => void;
    /** Fired when hover ends on a previously hovered element. */
    onHoverEnd?: (element: HoverableElement) => void;
}
interface ResolvedOptions$9 {
    enable: boolean | ((element: HoverableElement) => boolean);
    hoverEdges: boolean;
    excludeNodeTypes: readonly string[];
    excludeGroups: GroupExclusion;
    excludeEdgeTypes: readonly string[];
    state: string;
    inactiveState: string | undefined;
    raiseActive: boolean;
    degree: number;
    direction: HoverDirection;
    zoomThreshold: number | undefined;
    zoomedOutState: string | undefined;
    zoomedOutEdgeState: string | undefined;
    zoomedOutScale: number | undefined;
    onHover: ((element: HoverableElement) => void) | undefined;
    onHoverEnd: ((element: HoverableElement) => void) | undefined;
}
declare class HoverActivateBehaviour extends Behaviour {
    readonly kind = "hover-activate";
    /** Bound target layer — resolved in `onRegister`. */
    private layer;
    private opts;
    /** Subscription disposers, called in `onDestroy`. */
    private subs;
    /** Currently hovered element, or `null`. */
    private current;
    /**
     * Kernel store — the focal hover id is mirrored into `view.interaction.hover`
     * so it's observable (`useStore`), tap-able, and syncable (Awareness) without
     * readers touching this behaviour. The behaviour keeps owning the hover
     * machinery + render visuals (`GraphStore` runtime states).
     */
    private _canvasStore?;
    /** Neighbour ids that received the active state (excluding `current`). */
    private activeIds;
    /** Element ids that received the inactive state. */
    private inactiveIds;
    /**
     * State name actually applied to nodes for the current hover — equals
     * `opts.state` normally, `opts.zoomedOutState` when the camera was below
     * `opts.zoomThreshold` at activation (or after a mid-hover swap). Tracked
     * so `clearHover` / `swapStates` remove whatever was actually applied,
     * not just whatever the current `opts.state` is now.
     */
    private appliedNodeState;
    /** Sibling of {@link appliedNodeState} for edges. */
    private appliedEdgeState;
    /**
     * Gfx-transform multiplier currently applied to the hovered node set.
     * `1` (or `null`) means no multiplier is active. Tracked so a threshold
     * cross or clear can reset only the ids we actually scaled.
     */
    private appliedScale;
    /** Node ids currently scaled via `renderer.scaleShape` — reset on clear. */
    private readonly scaledNodeIds;
    constructor(opts: HoverActivateBehaviourOptions);
    protected onRegister(ctx: CanvasContext): void;
    protected onDestroy(): void;
    protected onDisable(): void;
    /** The element currently driving the hover effect, or `null`. */
    get hoveredElement(): HoverableElement | null;
    /** Read-only snapshot of resolved options. */
    get options(): Readonly<ResolvedOptions$9>;
    /**
     * Runtime option update. State-affecting changes clear any in-flight hover
     * so the next hover applies the new visuals cleanly.
     */
    setOptions(patch: Partial<HoverActivateBehaviourOptions>): void;
    /** Mirror the focal hover id into `view.interaction.hover` (D11). */
    private mirrorHover;
    /** Clear all states applied by the current hover. */
    clearHover(): void;
    private handlePointerOver;
    private handlePointerOut;
    private activate;
    /**
     * Choose which node + edge state names AND gfx scale to apply right now,
     * based on `camera.scale` vs. `opts.zoomThreshold`.
     *
     * - `node` / `edge`: `opts.state` (or `opts.zoomedOutState` /
     *   `opts.zoomedOutEdgeState` at far zoom). Each role falls back to
     *   `opts.state` independently.
     * - `scale`: `1` (or `opts.zoomedOutScale` at far zoom). The scale
     *   multiplier is independent of the state-name swap — a story can
     *   configure either, both, or neither.
     */
    private pickTier;
    /**
     * Handle a `camera:zoom` event while a hover is active. Two independent
     * dimensions may change as the camera crosses the threshold:
     *
     * - State names — swap via {@link swapStates} (state-config-driven
     *   restyle, composes with `NodeScaleLODBehaviour`).
     * - Scale multiplier — re-apply via {@link applyScale} (`gfx.scale`
     *   write, does NOT compose with LOD).
     *
     * Idempotent: a zoom that doesn't cross the threshold leaves both
     * dimensions unchanged and exits cheaply.
     */
    private handleCameraZoom;
    /**
     * Set / reset `gfx.scale` on the hovered node set. Pure transform write
     * via {@link PrimitivesRenderer.scaleShape} — no geometry rebuild,
     * preserves the node's spec-driven colour, stroke, label, etc.
     *
     * Resets any previously-scaled ids first so `applyScale(1)` is a clean
     * teardown. Only ids that resolve to shapes (not connectors) are
     * touched — `activeIds` is a flat set of mixed kinds; `renderer.hasShape`
     * filters out edge ids cheaply.
     */
    private applyScale;
    /**
     * Publish what this hover should lift, under this behaviour's own id in
     * `view.interaction.raised`.
     *
     * This is where the *policy* lives: the hovered set (`current` +
     * `activeIds`) is resolved through {@link collectRaiseTargets} into the
     * elements that actually rise. The layer's projection is mechanical — it
     * lifts exactly the ids published here and lowers the rest — so anything
     * clever about *what* rises has to be decided before it's written to state.
     */
    private applyRaise;
    /**
     * Resolve one hovered id into the elements that should rise with it,
     * accumulating into `out`.
     *
     * Everything lifts itself, except an **expanded group frame**, which lifts
     * what it *contains* — its whole subtree plus the edges with both ends
     * inside it. Two reasons the frame stays put:
     *
     * - **It can't be lifted correctly.** The renderer's overlay sorts every
     *   raised shape above every raised connector, so a lifted frame paints over
     *   its own members' edges — the arrows inside it vanish. No z-index avoids
     *   that; the bands are fixed.
     * - **Lifting a backdrop is meaningless.** A frame is the container behind
     *   its members; floating it above unrelated content while its contents stay
     *   behind isn't what "raise this element" means for a group.
     *
     * Left alone, the frame keeps its `behindChildren` z in the shape layer, so
     * the lifted members and their lifted edges both sit above it. A *collapsed*
     * frame is an ordinary node with nothing inside to cover, so it lifts itself
     * — which is why {@link onCollapseFlip} re-runs this: a lifted collapsed
     * frame that opens must re-resolve to "lift its contents", or it stays
     * stranded on top of the children it just revealed.
     */
    private collectRaiseTargets;
    /**
     * Lift what an expanded group *contains* — its descendants (recursive, so a
     * nested group brings its whole subtree) plus the edges with both ends inside
     * it — rather than the frame itself.
     *
     * Two reasons the frame stays put:
     *
     * - **It can't be lifted correctly.** The renderer's overlay sorts every
     *   raised shape far above every raised connector, so a lifted frame paints
     *   over its own members' edges — the arrows inside it vanish. No z-index
     *   avoids that; the bands are fixed.
     * - **Lifting a backdrop is meaningless.** A frame is the container behind
     *   its members; floating it above unrelated content while its contents stay
     *   behind isn't what "raise this element" means for a group.
     *
     * Left alone, the frame keeps its `behindChildren` z in the shape layer, so
     * the lifted members and their lifted edges both sit above it. A *collapsed*
     * group never reaches here — it renders as an ordinary node with nothing
     * inside to cover, and raises normally.
     */
    /** Drop this behaviour's paint-order lift; other sources keep theirs. */
    private resetRaise;
    /**
     * Walk the current hovered set (`current` + `activeIds`) and replace the
     * previously-applied state names with `picked.node` / `picked.edge`.
     * Skips work per-role when the state name didn't change for that role
     * (e.g. only the edge state swapped while the node state stayed put).
     *
     * `activeIds` is a flat set containing both node and edge ids — we don't
     * track type per id, so we call `setNodeState` / `setEdgeState` for both;
     * mismatched calls (an id that doesn't exist in that store) no-op
     * gracefully. Matches the existing pattern in {@link clearHover}.
     */
    private swapStates;
    /** BFS neighbourhood expansion using the store's adjacency index. */
    private collectNeighbours;
    private applyInactive;
    /**
     * Is this element's `type` on the matching exclusion list?
     *
     * Reads `GraphNode.type` / `GraphEdge.type` off the store rather than the
     * {@link HoverableElement} payload, because that struct carries the *render*
     * kind (`'shape'` / `'connector'`), not the record's domain type. An id the
     * store no longer knows is not excluded — the `resolveElement` call that
     * follows will drop it anyway.
     */
    private isExcluded;
    private resolveElement;
}

/**
 * `ModifierTracker` — global helper that tracks which keyboard modifier keys
 * are currently held. Several behaviours (Click/Brush/Lasso) need to know
 * the modifier state at the moment of a pointer event, but the renderer's
 * shape/connector pointer events don't carry that info — they're synthesised
 * from PixiJS events. Tracking modifiers via window-level key events is the
 * pragmatic substitute.
 *
 * Reference-counted: the first behaviour to call `attach()` installs the
 * window listeners; subsequent `attach()` calls just bump the counter.
 * `detach()` removes the listeners when the count returns to zero.
 *
 * @internal — not exported from `@invana/graph`. Used by behaviours.
 */
type ModifierKey = 'shift' | 'control' | 'alt' | 'meta';

/**
 * `ClickSelectBehaviour` — toggles a named visual state on clicked nodes /
 * edges with optional N-degree neighbour expansion, modifier-driven
 * multi-select, and optional dimming of unselected elements.
 *
 * Layer-scoped: constructed with a `targetLayerId`. Subscribes to that
 * layer's renderer click events and to the canvas-level `background:click`
 * for clear-on-background behaviour.
 *
 * Default `enabled: false` — register, then explicitly enable.
 *
 * The canonical `selected` state is auto-merged into every
 * `GraphLayer`'s state catalogue — no setup needed. Override the layer's
 * `options.node.state.selected` to customise the visual.
 *
 * @example
 * ```ts
 * canvas.behaviours.register(
 *   new ClickSelectBehaviour({
 *     id: 'select',
 *     targetLayerId: 'graph',
 *     enabled: true,
 *     multiple: true,
 *     degree: 1,
 *   }),
 * );
 * ```
 */

/** Element kind for selection targets. */
type SelectableElementType = HoverableElementType;
/** Edge-traversal direction filter. */
type SelectDirection = HoverDirection;
/** Modifier-key names accepted by `trigger`. */
type SelectModifierKey = ModifierKey;
/** Element handed to selection callbacks. */
interface SelectableElement {
    readonly id: string;
    readonly type: SelectableElementType;
    /** Arbitrary user payload from `node.data` or `edge.data`. */
    readonly data: unknown;
}
/** Per-flush snapshot fired to `onSelectionChange`. */
interface SelectionSnapshot {
    shapeIds: string[];
    connectorIds: string[];
}
/** Event-map for {@link ClickSelectBehaviour.events}. */
type ClickSelectEventMap = {
    /**
     * Fired once whenever the selection set is replaced (click, `select*`,
     * `clearSelection`, or brush/lasso delegation). The non-clobbering complement
     * to the `onSelectionChange` callback — observers (e.g. the canvas-react
     * `useSelection` hook) subscribe here instead of hijacking the callback.
     */
    'selection:change': SelectionSnapshot;
};
/** Constructor options for `ClickSelectBehaviour`. */
interface ClickSelectBehaviourOptions extends BehaviourOptions {
    /** Required — the `GraphLayer` id this behaviour drives. */
    targetLayerId: string;
    /**
     * Per-target enable predicate. `boolean` is a global on/off; a function
     * runs per click and may veto. Default `true`.
     */
    enable?: boolean | ((element: SelectableElement) => boolean);
    /**
     * Node types that can never be selected by a click. A click landing on a
     * node whose `GraphNode.type` appears here is a no-op: the selection is left
     * exactly as it was — **not** cleared, so clicking scenery never costs the
     * user their selection.
     *
     * The serialisable counterpart of {@link enable}: same veto, expressed as
     * data so it round-trips through a saved `CanvasConfig` and shows up in the
     * settings editor. Prefer it; reach for `enable` only when the predicate
     * needs something no list can say.
     *
     * The motivating case is **scenery** — a node that is drawn but isn't
     * content, an expanded group frame above all: it is picked like any other
     * shape, and with `autoFit` most of its area is uncovered, so a click aimed
     * at the gap between two cards selects the frame.
     *
     * Scoped to the **clicked** element. Neighbour expansion is untouched: with
     * `degree > 0`, an excluded node reached from a legitimate seed is still
     * selected as a neighbour. This option says "don't seed a selection at me".
     *
     * Applies to clicks only — it never revises a selection already made, so
     * adding a type here leaves anything currently selected selected.
     * `selectAll` / `selectNeighbourhood` and the rubber-band behaviours
     * (`BrushSelectBehaviour` / `LassoSelectBehaviour`) have their own paths and
     * do not consult this list. Default `[]`.
     *
     * @example `excludeNodeTypes: ['package']` — package frames are scenery.
     */
    excludeNodeTypes?: string[];
    /**
     * Which group frames can never be selected by a click — the **structural**
     * counterpart of {@link excludeNodeTypes}, which keys on a domain string.
     * See {@link GroupExclusion}.
     *
     * Default `'expanded'`: a click on an expanded frame is a no-op that leaves
     * the selection exactly as it was — clicking scenery never costs the user
     * their selection — while a collapsed frame selects like an ordinary node.
     * That is a change of behaviour from before 2026-09-22, when a frame was
     * selectable unless the graph named its type; see
     * `rfc:feat-2026-09-22-a-group-frame-is-scenery-but-every-graph-must-say-so`.
     *
     * With `autoFit`, most of a frame's area is uncovered, so a click aimed at
     * the gap between two cards used to select the frame. Scoped to the
     * **clicked** element: with `degree > 0`, a frame reached from a legitimate
     * seed is still selected as a neighbour. Set `'never'` to opt back in.
     *
     * Unaffected paths, as with the type lists: `selectAll` /
     * `selectNeighbourhood`, and `sym:BrushSelectBehaviour` /
     * `sym:LassoSelectBehaviour`, which select by geometry through their own
     * code and do not consult this.
     *
     * @example `excludeGroups: 'never'` — frames are selectable content here.
     */
    excludeGroups?: GroupExclusion;
    /**
     * Edge types that can never be selected by a click. The
     * {@link excludeNodeTypes} sibling, keyed on `GraphEdge.type`, with the same
     * focal-only scope and the same "leaves the existing selection alone"
     * semantics. Default `[]`.
     */
    excludeEdgeTypes?: string[];
    /**
     * Allow more than one element selected at a time. When `true`, a qualifying
     * click (see `trigger`) toggles the element in/out of the selection; when
     * `false` it replaces the selection with the clicked element. Default `false`.
     */
    multiple?: boolean;
    /**
     * Modifier key(s) required for a click to affect the selection **at all**.
     * When non-empty, a click that holds none of these is ignored — a plain
     * (unmodified) click selects nothing, and a plain left-drag stays a pure
     * pan. With a modifier held, the click selects (replacing the selection, or
     * toggling membership when `multiple` is `true`). Empty array = every click
     * selects, no modifier needed. Default `[]` (plain click selects). Pass
     * `['shift']` to gate selection behind the Shift key.
     */
    trigger?: SelectModifierKey[];
    /**
     * N-hop neighbour radius around each seed. `0` = clicked element only.
     * Default `0`.
     */
    degree?: number;
    /** Direction for neighbour traversal. Default `'both'`. */
    direction?: SelectDirection;
    /** Active-state name. Default `'selected'`. */
    state?: string;
    /**
     * State applied to every element that is *not* selected. `undefined`
     * disables dimming. Default `undefined`.
     */
    unselectedState?: string;
    /**
     * Lift the selected set (seeds + degree-expanded neighbours) above the rest
     * within its render layer, so unrelated nodes / edges don't paint over the
     * selection. Edges raise above other edges (still below all nodes); nodes
     * raise above other nodes. Reset when the selection clears. Visual-only —
     * restacking doesn't affect hit-testing. Default `true`.
     */
    raiseActive?: boolean;
    /** Clear selection when clicking the empty canvas background. Default `true`. */
    clearOnBackground?: boolean;
    /** Fired when an element becomes selected. */
    onSelect?: (element: SelectableElement) => void;
    /** Fired when an element becomes deselected. */
    onDeselect?: (element: SelectableElement) => void;
    /** Fired once per click with the post-settle selection snapshot. */
    onSelectionChange?: (snapshot: SelectionSnapshot) => void;
}
interface ResolvedOptions$8 {
    enable: boolean | ((element: SelectableElement) => boolean);
    excludeNodeTypes: readonly string[];
    excludeGroups: GroupExclusion;
    excludeEdgeTypes: readonly string[];
    multiple: boolean;
    trigger: SelectModifierKey[];
    degree: number;
    direction: SelectDirection;
    state: string;
    unselectedState: string | undefined;
    raiseActive: boolean;
    clearOnBackground: boolean;
    onSelect: ((element: SelectableElement) => void) | undefined;
    onDeselect: ((element: SelectableElement) => void) | undefined;
    onSelectionChange: ((snapshot: SelectionSnapshot) => void) | undefined;
}
declare class ClickSelectBehaviour extends Behaviour {
    readonly kind = "click-select";
    /**
     * Selection event bus. Subscribe to `'selection:change'` for a reactive
     * snapshot every time the selection set is replaced. Independent of (and
     * additive to) the `onSelectionChange` option.
     */
    readonly events: EventEmitter<ClickSelectEventMap>;
    private layer;
    private opts;
    /** Subscription disposers. */
    private subs;
    /**
     * Kernel store — the semantic selection set is mirrored into
     * `view.interaction.selection` (D11) so it's observable (`useStore`), tap-able
     * (telemetry), and syncable (Awareness) without readers touching this behaviour.
     * The behaviour keeps owning the interaction *machinery* (expansion / dimming /
     * z-raise) and the render visuals (`GraphStore` runtime states).
     */
    private _canvasStore?;
    /** Seed set — ids the user *directly* clicked / passed to `select*`. */
    private seeds;
    /** Expanded set — seeds + degree-expanded neighbours. */
    private selected;
    /**
     * The ids this behaviour last wrote into the store's canvas-wide selection —
     * its share, replaced as a whole on the next change even when some of those
     * elements have since been removed from the layer.
     */
    private mirrored;
    /** Ids currently rendered with the `unselectedState`. */
    private unselectedIds;
    /** True when the most recent click already consumed an element. */
    private clickConsumedByElement;
    /** Pointerdown screen-position — used to distinguish a click from a drag. */
    private pointerDownScreen;
    /**
     * Set once the pointer travels past the click/drag threshold while a button
     * is held. Used to suppress the synthetic element `click` that fires at the
     * end of a node drag — without it, dragging a selected node would collapse
     * the whole selection down to that one node on release.
     */
    private pressMoved;
    constructor(opts: ClickSelectBehaviourOptions);
    protected onRegister(ctx: CanvasContext): void;
    protected onDestroy(): void;
    protected onDisable(): void;
    /**
     * Pick up a selection written while this behaviour was off (a playbook step,
     * a panel) — the store subscription ignores writes while disabled.
     */
    protected onEnable(): void;
    /** Resolved current options (read-only snapshot). */
    get options(): Readonly<ResolvedOptions$8>;
    /**
     * Runtime option update. State-affecting changes clear the current
     * visual selection and re-apply with the new options.
     */
    setOptions(patch: Partial<ClickSelectBehaviourOptions>): void;
    /** Replace the selection with a single element. */
    select(id: string, type?: SelectableElementType): void;
    /** Replace the selection with the given (id, type) pairs. */
    selectMultiple(elements: Array<{
        id: string;
        type?: SelectableElementType;
    }>): void;
    /** Add a single element to the current selection. */
    addToSelection(id: string, type?: SelectableElementType): void;
    /** Remove a single element from the current selection. */
    deselect(id: string): void;
    /** Toggle the membership of `id` in the selection. */
    toggle(id: string, type?: SelectableElementType): void;
    /** True iff `id` is part of the rendered selection (seed or expanded). */
    isSelected(id: string): boolean;
    /** All currently selected ids (seeds + expanded). */
    getSelectedIds(): string[];
    /** Currently selected shape (node) ids. */
    getSelectedShapeIds(): string[];
    /** Currently selected connector (edge) ids. */
    getSelectedConnectorIds(): string[];
    /** Clear the entire selection and any dimming. */
    clearSelection(): void;
    /**
     * Select every node and edge on the target layer. Replaces the current
     * selection. No-op if the layer isn't mounted.
     */
    selectAll(): void;
    /**
     * Select a node together with its neighbours (in the given direction) and the
     * edges incident to it. Replaces the current selection. No-op if the layer
     * isn't mounted.
     *
     * @param id  Seed node id.
     * @param dir Adjacency direction for neighbours + incident edges. Default `'both'`.
     */
    selectNeighbourhood(id: string, dir?: 'in' | 'out' | 'both'): void;
    private handleElementClick;
    /**
     * Apply the store's canvas-wide selection as this layer's share (RFC F8):
     * the ids this layer holds, as-is — the store holds the *resolved* selection,
     * so it isn't re-expanded by `degree`. Our own mirror arrives here as a set
     * equal to `selected`, which is the echo guard.
     */
    private followStoreSelection;
    /**
     * Core selection engine: replace seeds, recompute expansion, swap visuals,
     * diff-emit callbacks.
     */
    private applySelection;
    /** Expand seeds by `degree` hops (BFS) — same shape as HoverActivate. */
    private expandSeeds;
    private clearVisualsOnly;
    /**
     * Publish the selected set as this behaviour's paint-order lift, under its
     * own id in `view.interaction.raised`.
     *
     * Intent only — no renderer calls. `GraphLayer`'s projection applies the
     * union of every source and lowers whatever leaves it, so a selection lift
     * can't strand elements on top of the scene the way the old per-behaviour
     * bookkeeping could (it only lowered on the *next* selection change, and
     * knew nothing about lifts other sources had applied to the same ids).
     */
    private applyRaise;
    /** Drop this behaviour's paint-order lift; other sources keep theirs. */
    private resetRaise;
    private applyUnselected;
    /**
     * Is this element's `type` on the matching exclusion list?
     *
     * Reads `GraphNode.type` / `GraphEdge.type` off the store rather than the
     * {@link SelectableElement} payload, because that struct carries the
     * *render* kind (`'shape'` / `'connector'`), not the record's domain type.
     * An id the store no longer knows is not excluded — the `resolveElement`
     * call that follows will drop it anyway.
     */
    private isExcluded;
    private resolveElement;
    private buildSnapshot;
}

/**
 * `ClickInspectBehaviour` — tracks the **single** node / edge a user clicked for
 * *inspection / editing*, independent of {@link ClickSelectBehaviour}.
 *
 * Selection and inspection are different concerns: selection drives highlighting
 * and multi-element drag (and may hold many elements at once); inspection feeds a
 * property editor (`InspectorPanel`), which only ever edits **one** element. This
 * behaviour is the authority for the latter — it remembers the last element
 * clicked and clears on a background click — so the editor never has to reach
 * into the selection set (where a multi-select would leave it with nothing single
 * to show).
 *
 * Layer-scoped: constructed with a `targetLayerId`. Subscribes to that layer's
 * renderer click events; uses a native DOM `click` listener for the
 * clear-on-background path (the engine doesn't emit `background:click` today),
 * mirroring `ClickSelectBehaviour`.
 *
 * Default `enabled: false` — register, then explicitly enable.
 *
 * @example
 * ```ts
 * canvas.behaviours.register(
 *   new ClickInspectBehaviour({ id: 'click-inspect', targetLayerId: 'graph', enabled: true }),
 * );
 * canvas.behaviours.get<ClickInspectBehaviour>('click-inspect')
 *   ?.events.on('inspect:change', (t) => console.log(t)); // { kind, id } | null
 * ```
 */

/** The single element currently targeted for inspection / editing. */
interface InspectTarget {
    kind: 'node' | 'edge';
    id: string;
}
/** Event-map for {@link ClickInspectBehaviour.events}. */
type ClickInspectEventMap = {
    /**
     * Fired whenever the inspected element changes — a node / edge click sets it,
     * a background click (or `clear`) sets it to `null`.
     */
    'inspect:change': InspectTarget | null;
};
/** Constructor options for `ClickInspectBehaviour`. */
interface ClickInspectBehaviourOptions extends BehaviourOptions {
    /** Required — the `GraphLayer` id this behaviour reads clicks from. */
    targetLayerId: string;
    /** Clear the inspected element when clicking the empty canvas. Default `true`. */
    clearOnBackground?: boolean;
}
declare class ClickInspectBehaviour extends Behaviour<ClickInspectBehaviourOptions> {
    readonly kind = "click-inspect";
    /**
     * Inspection event bus. Subscribe to `'inspect:change'` for the current
     * single target (or `null`) every time it changes.
     */
    readonly events: EventEmitter<ClickInspectEventMap>;
    private layer;
    /** Live-read from `_options` (consulted at click-time) so `setOptions` applies. */
    private get clearOnBackground();
    /** Subscription disposers. */
    private subs;
    /** Current inspected element, or `null`. */
    private target;
    /** True when the most recent click already consumed an element. */
    private clickConsumedByElement;
    /** Pointerdown screen-position — used to distinguish a click from a drag. */
    private pointerDownScreen;
    /**
     * Set once the pointer travels past the click/drag threshold while a button
     * is held — suppresses the synthetic element `click` fired at the end of a
     * node drag so a drag doesn't open the inspector.
     */
    private pressMoved;
    constructor(opts: ClickInspectBehaviourOptions);
    protected onRegister(ctx: CanvasContext): void;
    protected onDestroy(): void;
    protected onDisable(): void;
    /** The element currently targeted for inspection, or `null`. */
    getTarget(): InspectTarget | null;
    /** Set the inspected element explicitly (e.g. from a context menu). */
    setTarget(target: InspectTarget | null): void;
    /** Clear the inspected element. */
    clear(): void;
    private handleElementClick;
}

/**
 * `ClickViewBehaviour` — tracks the **single** node / edge a user clicked in
 * order to *view* its properties, independent of {@link ClickSelectBehaviour}
 * and {@link ClickInspectBehaviour}.
 *
 * It is the read-only counterpart of `ClickInspectBehaviour`: where that one
 * feeds an editor, this one feeds a **read-only element detail view**
 * (`NodeDetailView` / `EdgeDetailView`). It deliberately applies **no visual effect** — node /
 * edge highlighting is owned by `ClickSelectBehaviour`, which can run alongside
 * this one. This behaviour's only job is to remember the last element clicked
 * (clearing on a background click) and announce it via `view:change`, so a
 * viewer panel can show that element's `label` / `type` / `data` without
 * reaching into the (possibly multi-element) selection set.
 *
 * **Follows `view.interaction.inspect`.** The viewed element is mirrored into
 * the kernel's `interaction.inspect`, and a write there from anywhere else — a
 * playbook step, the assistant, a panel — opens (or closes) that element here,
 * provided it lives in this behaviour's layer.
 *
 * Layer-scoped: constructed with a `targetLayerId`. Subscribes to that layer's
 * renderer click events; uses a native DOM `click` listener for the
 * clear-on-background path (the engine doesn't emit `background:click` today),
 * mirroring `ClickSelectBehaviour` / `ClickInspectBehaviour`.
 *
 * Default `enabled: false` — register, then explicitly enable.
 *
 * @example
 * ```ts
 * canvas.behaviours.register(
 *   new ClickViewBehaviour({ id: 'click-view', targetLayerId: 'graph', enabled: true }),
 * );
 * canvas.behaviours.get<ClickViewBehaviour>('click-view')
 *   ?.events.on('view:change', (t) => console.log(t)); // { kind, id } | null
 * ```
 */

/** The single element currently targeted for property viewing. */
interface ViewTarget {
    kind: 'node' | 'edge';
    id: string;
}
/** Event-map for {@link ClickViewBehaviour.events}. */
type ClickViewEventMap = {
    /**
     * Fired whenever the viewed element changes — a node / edge click sets it,
     * a background click (or `clear`) sets it to `null`.
     */
    'view:change': ViewTarget | null;
};
/** Constructor options for `ClickViewBehaviour`. */
interface ClickViewBehaviourOptions extends BehaviourOptions {
    /** Required — the `GraphLayer` id this behaviour reads clicks from. */
    targetLayerId: string;
    /** Clear the viewed element when clicking the empty canvas. Default `true`. */
    clearOnBackground?: boolean;
}
declare class ClickViewBehaviour extends Behaviour<ClickViewBehaviourOptions> {
    readonly kind = "click-view";
    /**
     * View event bus. Subscribe to `'view:change'` for the current single target
     * (or `null`) every time it changes.
     */
    readonly events: EventEmitter<ClickViewEventMap>;
    private layer;
    /** Live-read from `_options` (consulted at click-time) so `setOptions` applies. */
    private get clearOnBackground();
    /** Subscription disposers. */
    private subs;
    /** Current viewed element, or `null`. */
    private target;
    /** The kernel store, for mirroring {@link target} into `interaction.inspect`. */
    private canvasStore;
    /** True when the most recent click already consumed an element. */
    private clickConsumedByElement;
    /** Pointerdown screen-position — used to distinguish a click from a drag. */
    private pointerDownScreen;
    /**
     * Set once the pointer travels past the click/drag threshold while a button
     * is held — suppresses the synthetic element `click` fired at the end of a
     * node drag so a drag doesn't open the viewer.
     */
    private pressMoved;
    constructor(opts: ClickViewBehaviourOptions);
    protected onRegister(ctx: CanvasContext): void;
    protected onDestroy(): void;
    protected onDisable(): void;
    /** The element currently targeted for viewing, or `null`. */
    getTarget(): ViewTarget | null;
    /** Set the viewed element explicitly (e.g. from a context menu). */
    setTarget(target: ViewTarget | null): void;
    /** Clear the viewed element. */
    clear(): void;
    private handleElementClick;
}

/**
 * `FocusBehaviour` — draws the kernel's `view.interaction.focus`: the focused
 * nodes are emphasised, the rest optionally dimmed, and on request the camera
 * frames them.
 *
 * `interaction.focus` is written by whoever points at nodes — a playbook step
 * (`view.focus`), the assistant, a panel, `canvas.store.actions.focus.set` —
 * and until this behaviour nothing drew it (RFC
 * `feat-2026-09-28-an-analysis-cannot-be-recorded-or-replayed`, F9 / M8). It
 * follows the store; it never writes it.
 *
 * - **Emphasis** — focused nodes (and, with `includeEdges`, the edges between
 *   two of them) get {@link FocusBehaviourOptions.focusState}; everything else
 *   gets {@link FocusBehaviourOptions.dimState} when the focus asks to dim
 *   (`focus.dim`). Written as runtime states through `store.internal`, so they
 *   are never recorded: undo moves the focus, and this behaviour redraws it.
 * - **Framing** — a `'focus'` camera intent (`interaction.cameraIntent`, a
 *   playbook step's `view.camera: 'focus'`) frames the focused nodes once the
 *   canvas settles. With {@link FocusBehaviourOptions.frame} on, every focus
 *   change frames too.
 *
 * Convergent: it re-derives the wanted states from the store on every change
 * (focus, data added / removed) and writes only the difference, and clears
 * everything it wrote on disable.
 *
 * Default `enabled: false` — register, then explicitly enable.
 *
 * @example
 * ```ts
 * canvas.behaviours.register(
 *   new FocusBehaviour({ id: 'focus', targetLayerId: 'graph', frame: true, enabled: true }),
 * );
 * canvas.store.actions.focus.set(['valjean', 'javert']); // highlight + dim the rest
 * canvas.store.actions.cameraIntent.request('focus');     // frame them
 * ```
 */

/** Constructor options for {@link FocusBehaviour}. */
interface FocusBehaviourOptions extends BehaviourOptions {
    /** Required — the `GraphLayer` id whose nodes this behaviour emphasises. */
    targetLayerId: string;
    /** Runtime state written on focused nodes (and edges). Default `'highlighted'`. */
    focusState?: string;
    /**
     * Runtime state written on everything outside the focus when the focus asks
     * to dim (`interaction.focus.dim`). Default `'dimmed'`. `''` never dims.
     */
    dimState?: string;
    /** Also emphasise the edges whose two endpoints are both focused. Default `true`. */
    includeEdges?: boolean;
    /**
     * Frame the focused nodes after **every** focus change, once the canvas
     * settles. Default `false`: only a `'focus'` camera intent frames.
     */
    frame?: boolean;
    /** Screen-px margin around the framed nodes. Default `80`. */
    framePadding?: number;
    /** Length of the framing glide in ms. `0` snaps. Default `450`. */
    frameDurationMs?: number;
    /**
     * Never zoom in past this when framing — keeps one focused node from
     * filling the screen. Default `2`.
     */
    frameMaxZoom?: number;
}
/** {@link FocusBehaviourOptions} with every default applied. */
interface ResolvedOptions$7 {
    focusState: string;
    dimState: string;
    includeEdges: boolean;
    frame: boolean;
    framePadding: number;
    frameDurationMs: number;
    frameMaxZoom: number;
}
declare class FocusBehaviour extends Behaviour {
    readonly kind = "focus";
    private opts;
    private layer;
    private ctxRef;
    private readonly subs;
    /**
     * What this behaviour has written, per element id, with the state name it
     * used — so an option change (a new `focusState`) still clears the old name.
     */
    private readonly nodeMarks;
    private readonly edgeMarks;
    constructor(opts: FocusBehaviourOptions);
    protected onRegister(ctx: CanvasContext): void;
    protected onEnable(): void;
    protected onDisable(): void;
    protected onDestroy(): void;
    /** Resolved current options (read-only snapshot). */
    get options(): Readonly<ResolvedOptions$7>;
    /** Runtime option update; redraws the current focus when enabled. */
    setOptions(patch: Partial<FocusBehaviourOptions>): void;
    private focus;
    /** Bring the written states in line with the store's focus, writing only the difference. */
    private sync;
    private clearAll;
    /**
     * Frame the focus once the canvas settles — after the layout a step
     * triggered has placed the nodes, so the camera aims at where they end up.
     * A focus that changed meanwhile is framed as it is then.
     */
    private frameWhenSettled;
    private frameNow;
}

/**
 * `HoverElementPreviewBehaviour` — surfaces a **hover preview card** for nodes and
 * edges. Headless: it detects a dwelled hover, resolves the hovered element +
 * its anchor position, builds a flat {@link ResolvedPreviewCard} from a
 * serializable {@link HoverElementPreviewCardSpec}, and emits `preview:show` /
 * `preview:move` / `preview:hide`. It renders **no UI** — a consumer (a React
 * `HoverElementPreviewCard`, or plain DOM in a story) draws the card from the
 * emitted snapshot and positions it at `screen`.
 *
 * This mirrors the headless pattern of {@link ContextMenuBehaviour} (resolve a
 * target + screen coords, emit, let the consumer draw) and the dedicated event
 * bus of {@link ClickViewBehaviour}. It is deliberately **separate** from
 * {@link HoverActivateBehaviour}: that one drives visual *state*
 * (highlight / dim / raise) on pointerover; this one drives a *card* with its
 * own dwell (`openDelay`) and grace (`closeDelay`) timing. The two compose —
 * one can highlight the node while the other shows its card.
 *
 * **Serializable by design.** Every option except the event callbacks is plain
 * JSON — `targets`, `openDelay`, `closeDelay`, `placement`, and the whole
 * `card` field-map. That lets the card be authored in display-settings and
 * round-tripped. The field-path resolution (`data.name`, `type`, …) runs once
 * per shown hover against the single hovered element, so it is O(1) in graph
 * size — unaffected by 100k-node / 500k-edge graphs.
 *
 * Default `enabled: false` — register, then explicitly enable.
 *
 * @example
 * ```ts
 * const preview = new HoverElementPreviewBehaviour({
 *   id: 'preview',
 *   targetLayerId: 'graph',
 *   enabled: true,
 *   card: {
 *     image: { field: 'data.avatar', shape: 'rounded' },
 *     title: { field: 'data.name' },
 *     subtitle: { field: 'data.description', maxLines: 2 },
 *     rows: [
 *       { label: 'Email', field: 'data.email' },
 *       { label: 'Score', field: 'data.score', format: 'percent' },
 *     ],
 *   },
 * });
 * canvas.behaviours.register(preview);
 * preview.events.on('preview:show', ({ card, screen }) => drawCard(card, screen));
 * preview.events.on('preview:hide', () => hideCard());
 * ```
 */

/**
 * Where the card anchors relative to the element — a hint passed through to the
 * consumer in {@link PreviewSnapshot.placement}.
 *
 * `'auto'` defers the side choice to the consumer: only the consumer renders
 * the card, so only it knows the card's size and the viewport bounds needed to
 * flip the card inward near a screen corner/edge and clamp it on-screen. The
 * headless behaviour never measures the card, so it can't resolve `'auto'`
 * itself — it emits the anchor (`screen`) and the hint, and the
 * consumer's positioner does the collision-aware flip + clamp.
 */
type PreviewPlacement = 'auto' | 'top' | 'right' | 'bottom' | 'left' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
/**
 * A dotted field path into the hovered element record — e.g. `'data.name'`,
 * `'type'`, `'id'`, or (for edges) `'source'` / `'target'`. Resolved against
 * the store's node / edge object.
 */
type PreviewFieldPath = string;
/** Image field for the left identity-card avatar. */
interface PreviewImageSpec {
    /** Field path resolving to an image URL string. */
    field: PreviewFieldPath;
    /** Avatar shape. Default `'rounded'`. */
    shape?: 'rounded' | 'circle';
}
/** A single text field (title). */
interface PreviewTextSpec {
    field: PreviewFieldPath;
}
/** The description line — clamped to `maxLines`. */
interface PreviewSubtitleSpec {
    field: PreviewFieldPath;
    /** Line clamp. Default `2`. */
    maxLines?: number;
}
/** Numeric/text formatting for a property row value. */
type PreviewRowFormat = 'text' | 'percent';
/** A labelled property row beneath the identity block. */
interface PreviewRowSpec {
    label: string;
    field: PreviewFieldPath;
    /** Value formatting. Default `'text'`. */
    format?: PreviewRowFormat;
}
/**
 * The serializable preview-card template. Pure JSON — author it in display
 * settings and feed it verbatim. `id` + `type` are rendered automatically
 * (structural, from the resolved target) and need no field entry here.
 */
interface HoverElementPreviewCardSpec {
    /** Left avatar; the whole block is skipped when the field doesn't resolve. */
    image?: PreviewImageSpec;
    /** Title line (e.g. a display name). */
    title?: PreviewTextSpec;
    /** Description line, 2-line clamp by default. */
    subtitle?: PreviewSubtitleSpec;
    /** Labelled property rows, full-width below a divider. Empty values are dropped. */
    rows?: readonly PreviewRowSpec[];
}
/**
 * Per-type card specs — a different card layout keyed by element `type`, all
 * serializable so a UI can define them (and round-trip via display settings).
 * The behaviour picks `nodes[type]` / `edges[type]` for the hovered element,
 * falling back to the behaviour's single `card` spec when a type has no entry.
 *
 * @example
 * ```ts
 * {
 *   nodes: {
 *     person:  { image: { field: 'data.avatar' }, title: { field: 'data.name' } },
 *     company: { title: { field: 'data.name' }, subtitle: { field: 'data.industry' } },
 *   },
 *   edges: { INFLUENCED: { title: { field: 'type' } } },
 * }
 * ```
 */
interface HoverElementPreviewCardsByType {
    /** Card spec per node `type`. */
    nodes?: Record<string, HoverElementPreviewCardSpec>;
    /** Card spec per edge `type`. */
    edges?: Record<string, HoverElementPreviewCardSpec>;
}
/** A resolved property row — primitive label + value, ready to render. */
interface PreviewCardRow {
    label: string;
    value: string;
}
/**
 * The render-ready card — all field paths resolved against the hovered element
 * to concrete primitives. The consumer renders this directly; no field logic
 * leaks into the UI.
 */
interface ResolvedPreviewCard {
    /** Element id (rendered in the header strip). */
    id: string;
    kind: GraphElementKind;
    /** Element `type` tag, if any (rendered in the header strip beside the id). */
    type?: string;
    /** Resolved image URL, or `undefined` to skip the avatar column. */
    imageUrl?: string;
    /** Avatar shape — always concrete (defaults applied). */
    imageShape: 'rounded' | 'circle';
    /** Resolved title text, if the field resolved. */
    title?: string;
    /** Resolved description text, if the field resolved. */
    subtitle?: string;
    /** Line clamp for the subtitle — always concrete. */
    subtitleMaxLines: number;
    /** Resolved property rows (empty values already dropped). */
    rows: PreviewCardRow[];
}
/**
 * What `preview:show` / `preview:move` carry — the hovered element + its
 * resolved card + anchor. Discriminated on `kind`, so `snapshot.node` /
 * `snapshot.edge` is the properly-typed live `GraphNode` / `GraphEdge` record
 * (edges expose `source` / `target`, nodes `position`, …), consistent with the
 * rest of `@invana/graph`. The consumer positions the card at `screen`.
 */
type PreviewSnapshot<DN = unknown, DE = unknown> = {
    /** Element id (mirrors `node.id` / `edge.id`). */
    id: string;
    /** Resolved, render-ready card. */
    card: ResolvedPreviewCard;
    /** Configured placement hint, so the consumer offsets the card consistently. */
    placement: PreviewPlacement;
    /** Anchor in world (scene) coords — node centre, or the hover point for edges. */
    world: {
        x: number;
        y: number;
    };
    /** Anchor in screen (canvas-relative) coords, via `camera.toScreen`. */
    screen: {
        x: number;
        y: number;
    };
} & ({
    kind: 'node';
    node: GraphNode<DN>;
} | {
    kind: 'edge';
    edge: GraphEdge<DE>;
});
/** Event-map for {@link HoverElementPreviewBehaviour.events}. */
type HoverElementPreviewEventMap = {
    /** Fired after the dwell delay once an element's card should appear. */
    'preview:show': PreviewSnapshot;
    /** Fired when the anchored card must reposition (camera pan / zoom). */
    'preview:move': PreviewSnapshot;
    /** Fired when the card should disappear. */
    'preview:hide': null;
};
/** Constructor options for `HoverElementPreviewBehaviour`. */
interface HoverElementPreviewBehaviourOptions extends BehaviourOptions {
    /** Required — the `GraphLayer` id this behaviour watches. */
    targetLayerId: string;
    /**
     * Which kinds fire a preview. A hover on a kind not listed is ignored.
     * Default `['node', 'edge']`.
     */
    targets?: readonly GraphElementKind[];
    /** Dwell, in ms, before a hovered element's card shows. Default `50`. */
    openDelay?: number;
    /**
     * Grace period, in ms, after the pointer leaves before the card hides —
     * smooths jitter when crossing element gaps. Default `50`.
     */
    closeDelay?: number;
    /** Anchor placement hint passed through to the consumer. Default `'bottom-right'`. */
    placement?: PreviewPlacement;
    /**
     * Interactive card — let the pointer enter the card (to select text, click
     * links, scroll) without it vanishing. Default `true`. Set `false` for a
     * passive, click-through tooltip.
     *
     * When `true`, leaving the canvas does **not** hide immediately; instead the
     * `closeDelay` grace timer runs, giving the pointer time to reach the card.
     * The consumer must render the card with pointer events enabled and call
     * {@link HoverElementPreviewBehaviour.holdOpen} on the card's `pointerenter` (to
     * cancel the pending hide) and {@link HoverElementPreviewBehaviour.releaseHold} on
     * its `pointerleave`. Needs a non-zero `closeDelay` to bridge the gap between
     * the element and the card — pair it with e.g. `closeDelay: 200`.
     */
    interactive?: boolean;
    /**
     * Per-target enable predicate. `boolean` is a global on/off; a function runs
     * per hover with the live `GraphNode` / `GraphEdge` record (+ its `kind`) and
     * may veto showing a card for that element. Default `true`.
     */
    enable?: boolean | ((element: GraphNode | GraphEdge, kind: GraphElementKind) => boolean);
    /**
     * The serializable card template — the **fallback** used when no per-type
     * spec in {@link cards} matches the hovered element. Default `{}`.
     */
    card?: HoverElementPreviewCardSpec;
    /**
     * Per-type card specs, keyed by element `type` (`cards.nodes[type]` /
     * `cards.edges[type]`). Lets a 'person' node and a 'company' node show
     * different fields. Serializable — define it in a UI / display settings.
     * Falls back to {@link card} when a type has no entry. Default `{}`.
     */
    cards?: HoverElementPreviewCardsByType;
    /** Fired when a card becomes visible. */
    onShow?: (snapshot: PreviewSnapshot) => void;
    /** Fired when the card hides. */
    onHide?: () => void;
}
interface ResolvedOptions$6 {
    targets: readonly GraphElementKind[];
    openDelay: number;
    closeDelay: number;
    placement: PreviewPlacement;
    interactive: boolean;
    enable: boolean | ((element: GraphNode | GraphEdge, kind: GraphElementKind) => boolean);
    card: HoverElementPreviewCardSpec;
    cards: HoverElementPreviewCardsByType;
    onShow: ((snapshot: PreviewSnapshot) => void) | undefined;
    onHide: (() => void) | undefined;
}
/**
 * Resolve a {@link HoverElementPreviewCardSpec} against a hovered element into a
 * flat, render-ready {@link ResolvedPreviewCard}. Pure — exported so the React
 * `HoverElementPreviewCard` (and tests) reuse the exact same field logic the
 * behaviour emits.
 *
 * The element's `id` and (when present) `type` are **prepended automatically**
 * as the first rows — the consumer never adds them to `spec.rows`.
 *
 * @param spec    The serializable card template.
 * @param subject The store node / edge record to resolve field paths against.
 * @param id      Element id — auto-added as the first `id` row.
 * @param kind    `'node'` | `'edge'`.
 * @param type    Element `type` tag — auto-added as the `type` row when present.
 */
declare function resolvePreviewCard(spec: HoverElementPreviewCardSpec, subject: unknown, id: string, kind: GraphElementKind, type: string | undefined): ResolvedPreviewCard;
declare class HoverElementPreviewBehaviour extends Behaviour {
    readonly kind = "hover-element-preview";
    /**
     * Preview event bus. Subscribe to `'preview:show'` / `'preview:move'` /
     * `'preview:hide'` to render and position the card.
     */
    readonly events: EventEmitter<HoverElementPreviewEventMap>;
    private layer;
    private opts;
    /** Subscription disposers, called in `onDestroy`. */
    private subs;
    /** The snapshot currently shown, or `null`. */
    private shown;
    /** The target queued by the open timer (awaiting dwell), or `null`. */
    private pending;
    /**
     * `true` while the pointer rests on an interactive card ({@link holdOpen}).
     * Suppresses every hide path — so a late `shape:pointerout` (fired because the
     * DOM card swallowed the pointer over the node) can't close the card after
     * `holdOpen` already cancelled the timer. Order-independent.
     */
    private held;
    private openTimer;
    private closeTimer;
    constructor(opts: HoverElementPreviewBehaviourOptions);
    protected onRegister(ctx: CanvasContext): void;
    protected onDestroy(): void;
    protected onDisable(): void;
    /** The snapshot currently shown, or `null`. */
    get current(): PreviewSnapshot | null;
    /** Read-only snapshot of resolved options. */
    get options(): Readonly<ResolvedOptions$6>;
    /**
     * Runtime option update. A `card` / `placement` change re-resolves any
     * in-flight card so the next paint reflects it immediately.
     */
    setOptions(patch: Partial<HoverElementPreviewBehaviourOptions>): void;
    /** Force the card to hide (cancels any pending dwell). */
    hide(): void;
    /**
     * Keep the card open — cancels the pending close timer. Call from the card's
     * `pointerenter` in {@link HoverElementPreviewBehaviourOptions.interactive} mode so
     * the pointer can rest on the card (to select text / click) without it hiding.
     */
    holdOpen(): void;
    /**
     * Release a {@link holdOpen} — restart the `closeDelay` grace timer. Call from
     * the card's `pointerleave` so it hides once the pointer leaves the card.
     */
    releaseHold(): void;
    private handlePointerOver;
    private handlePointerOut;
    /** Start (or restart) the `closeDelay` grace timer that hides the card. */
    private scheduleHide;
    /** Mature the dwell timer — show whatever snapshot is pending. */
    private fireOpen;
    private showSnapshot;
    private hideNow;
    /** Re-project the shown card's world anchor to screen and emit `preview:move`. */
    private reposition;
    /**
     * Pick the card spec for a hovered element — its per-type override from
     * {@link HoverElementPreviewBehaviourOptions.cards} when present, else the
     * single {@link HoverElementPreviewBehaviourOptions.card} fallback.
     */
    private specFor;
    /**
     * Resolve a hovered id into a full {@link PreviewSnapshot} (live record +
     * anchor + card). Nodes anchor at their centre (stable across pan / zoom);
     * edges anchor at the hover point `(worldX, worldY)`. Returns `null` if the
     * element vanished between the pointer event and resolution.
     */
    private resolveSnapshot;
    private clearOpenTimer;
    private clearCloseTimer;
}

/**
 * `ColorByBehaviour` — colours nodes and edges from **one addressable field**,
 * in one of two modes:
 *
 * - **`'categorical'`** *(default)* — *"which kind is this?"* One distinct colour
 *   per distinct value, handed out from a palette in order of first appearance
 *   and remembered. The classic "colour by node/edge type" view.
 * - **`'range'`** — *"how much of this is there?"* A numeric value mapped
 *   through a {@link ColorByScale} onto a colour ramp — continuously, or
 *   quantised into quantile / threshold bins.
 *
 * ### Addressing — one option, any field
 *
 * {@link ColorByBehaviourOptions.nodeValueKey} is a **root-relative dot path**
 * over the stored record, so it reaches everything: `'type'` (the default),
 * `'data.riskScore'`, `'data.meta.tier'`, `'parentId'`, `'style.shape.kind'`.
 * A string path is used rather than a function because it **survives
 * serialisation** — it can live in `view.definition`, be edited in a settings
 * panel, and sync to a collaborator. {@link ColorByBehaviourOptions.nodeValueBy}
 * remains as the escape hatch for values that must be *computed* rather than
 * addressed.
 *
 * > There is **no `kind` field** on a node or edge. `GraphElementKind` is the
 * > package-wide `'node' | 'edge'` discriminator used on events, never stored
 * > per item; `Behaviour.kind` is the unrelated editor-registry key. The
 * > per-item discriminator is `type`. For the *shape* kind, use
 * > `'style.shape.kind'`.
 *
 * ### Validity matrix — which options each mode reads
 *
 * | Option | `'categorical'` | `'range'` continuous | `quantile` | `threshold` |
 * |---|:--:|:--:|:--:|:--:|
 * | `*ValueKey` / `*ValueBy` | ✅ as string | ✅ as number | ✅ | ✅ |
 * | `colorNodes` / `colorEdges` / `fallbackColor` | ✅ | ✅ | ✅ | ✅ |
 * | `palette` · `valueColors` · `maxCategories` | ✅ | — | — | — |
 * | `colorStops` | — | ✅ | ✅ per bucket | ✅ per bucket |
 * | `nodeDomain` / `edgeDomain` | — | ✅ | ✅ | — |
 * | `bins` | — | — | ✅ | — |
 * | `nodeThresholds` / `edgeThresholds` | — | — | — | ✅ |
 *
 * Options outside their mode are **ignored, not errors** — switching `mode`
 * shouldn't require clearing the other mode's fields, and round-tripping through
 * an editor must not destroy the settings of the mode you aren't on.
 *
 * ### How it writes
 *
 * As **field resolvers on the layer template** — `bgFill` for nodes (via
 * `setNodeDefaults`), `strokeColor` + `arrowTargetColor` for edges (via
 * `setEdgeDefaults`). Because the colour lives on the template as a function of
 * the item, **new nodes and edges are coloured as they arrive** — no per-item
 * loop, no re-apply wiring. The template only sets these specific fields, so
 * other styling (shape, size, label, node border) is untouched; run a
 * `ThemeBehaviour` for those alongside.
 *
 * Default `enabled: false` — register, then explicitly enable. On disable it
 * restores whatever those template fields held before (best effort).
 *
 * **Precedence — applied once, overridable.** Any behaviour that writes the same
 * template fields *after* it wins. In particular `ThemeBehaviour`, whose palette
 * drives the layer to re-apply its defaults on every theme change. Its base
 * recolour touches `labelColor` / `bgStrokeColor` (node) and `strokeColor`
 * (edge), **not** `bgFill`, so colour-by fills sit alongside the theme's
 * border/label colours rather than fighting them.
 *
 * @example
 * ```ts
 * // colour by type (the default — no options needed)
 * new ColorByBehaviour({ id: 'color', targetLayerId: 'graph', enabled: true });
 *
 * // colour by a nested payload field, edges left alone
 * new ColorByBehaviour({
 *   id: 'color', targetLayerId: 'graph', enabled: true,
 *   colorEdges: false,
 *   nodeValueKey: 'data.subject',
 * });
 *
 * // colour by magnitude — a continuous ramp over an explicit domain
 * new ColorByBehaviour({
 *   id: 'color', targetLayerId: 'graph', enabled: true,
 *   mode: 'range',
 *   nodeValueKey: 'data.coverage',
 *   nodeDomain: [0, 100],
 * });
 * ```
 */

/** Which colouring job — see the class TSDoc's validity matrix. */
type ColorByMode = 'categorical' | 'range';
/**
 * Curve / binning mapping a numeric value to a colour. Continuous curves
 * interpolate along `colorStops`; binning scales quantise into discrete steps.
 * `'linear' | 'sqrt' | 'log'` match `NodeCentralityScale` deliberately.
 */
type ColorByScale = 'linear' | 'sqrt' | 'log' | 'quantile' | 'threshold';
/** Maps an item to its colour value. `null` / `undefined` / `''` → `fallbackColor`. */
type ColorValueAccessor<T> = (item: T) => string | number | null | undefined;
/**
 * What a legend should render for one channel. Derived from the same resolved
 * options and domain the canvas is painted from, so the two can never disagree.
 */
type ColorByLegendSection = {
    kind: 'categories';
    /** The field path (or `'(computed)'` when a `*ValueBy` accessor is in use). */
    field: string;
    entries: {
        value: string;
        color: number;
    }[];
    /** Values beyond `maxCategories`, collapsed. Absent when nothing was capped. */
    other?: {
        count: number;
        color: number;
    };
} | {
    kind: 'bins';
    field: string;
    bins: {
        from: number;
        to: number;
        color: number;
    }[];
} | {
    kind: 'gradient';
    field: string;
    domain: [number, number];
    stops: readonly number[];
};
/**
 * Default 12-colour categorical palette (0xRRGGBB) — distinct hues that read on
 * both light and dark backgrounds. Cycled when a graph has more values than
 * colours. Override via {@link ColorByBehaviourOptions.palette}.
 */
declare const DEFAULT_CATEGORY_PALETTE: readonly number[];
/**
 * Default ramp for `mode: 'range'` — a **sequential single-hue** scale
 * (light → dark blue).
 *
 * Single-hue on purpose. Interpolation happens in sRGB, where a ramp between
 * distant hues can pass near grey at its midpoint and read as "no data" exactly
 * where mid-range values live. A single hue is both the conventionally correct
 * default for a magnitude and immune to that. Multi-hue and diverging ramps are
 * opt-in via {@link ColorByBehaviourOptions.colorStops}, where the caller is
 * choosing the endpoints deliberately.
 */
declare const DEFAULT_RANGE_STOPS: readonly number[];
/** Constructor options for {@link ColorByBehaviour}. */
interface ColorByBehaviourOptions extends BehaviourOptions {
    /** Required — the `GraphLayer` id this behaviour colours. */
    targetLayerId: string;
    /**
     * Which colouring job. Default `'categorical'` — one distinct colour per distinct
     * value. `'range'` maps a numeric value through {@link scale} onto
     * {@link colorStops}. Determines which options below are read.
     */
    mode?: ColorByMode;
    /**
     * **Root-relative dot path** to the value driving a node's colour — e.g.
     * `'type'`, `'data.riskScore'`, `'data.meta.tier'`. Default `'type'`.
     * A missing path, or a non-numeric value in `'range'` mode, yields
     * {@link fallbackColor}. Superseded by {@link nodeValueBy}.
     *
     * A path from the node **root**, not a key inside `data` — unlike
     * `NodeCentralityBehaviourOptions.weightKey`, because the default (`type`)
     * lives at the root.
     */
    nodeValueKey?: string;
    /** Edge equivalent of {@link nodeValueKey}. Default `'type'`. */
    edgeValueKey?: string;
    /**
     * **Code escape hatch.** Per-node value accessor; supersedes
     * {@link nodeValueKey} when set. Use for computed keys the store doesn't hold
     * (`` `community-${n.data.group}` ``) or derived magnitudes. Return a `string`
     * in `'categorical'` mode, a `number` in `'range'` mode.
     * **Not editor-exposed** (it's a function) and not persisted.
     */
    nodeValueBy?: ColorValueAccessor<GraphNode>;
    /** Edge equivalent of {@link nodeValueBy}. */
    edgeValueBy?: ColorValueAccessor<GraphEdge>;
    /** Colour nodes — writes `bgFill`. Default `true`. */
    colorNodes?: boolean;
    /** Colour edges — writes `strokeColor` + `arrowTargetColor`. Default `true`. */
    colorEdges?: boolean;
    /**
     * Colour for items whose value is missing, empty, or (in `'range'` mode)
     * non-numeric. Default `0x9ca3af` (grey).
     */
    fallbackColor?: number;
    /**
     * Colours (`0xRRGGBB`) handed out in order of first appearance and remembered,
     * cycled when there are more distinct values than colours.
     * Default {@link DEFAULT_CATEGORY_PALETTE}.
     */
    palette?: readonly number[];
    /**
     * **Pin known values to specific colours.** Anything not listed falls through
     * to {@link palette} in first-appearance order. Without this, `'failed'` gets
     * whatever colour happens to be next — and that changes with data arrival
     * order. Shared across nodes and edges (values compare as strings).
     */
    valueColors?: Readonly<Record<string, number>>;
    /**
     * **Cardinality cap.** Values beyond the first `maxCategories` distinct ones
     * (in first-appearance order) share {@link fallbackColor} and collapse into a
     * single `other` legend row. Default `24`.
     *
     * A guard against colouring by a high-cardinality field — `nodeValueKey: 'id'`
     * is legal and yields one distinct value *per node*, which cycles the palette
     * into meaninglessness and grows a legend row per item. Capping makes the
     * truncation **visible** (`other (317)`) instead of silently lying.
     *
     * Values pinned by {@link valueColors} are always honoured and **do not count
     * against the cap** — an explicit choice is never truncated.
     *
     * Set to `Infinity` to disable.
     */
    maxCategories?: number;
    /**
     * How a numeric value becomes a colour. Default `'linear'`.
     *
     * - `'linear'` / `'sqrt'` / `'log'` — **continuous**: normalise into `[0,1]`
     *   against the domain, ease, then interpolate along {@link colorStops}.
     * - `'quantile'` — **binned** into {@link bins} equal-*count* buckets, edges
     *   derived from the observed values.
     * - `'threshold'` — **binned** at explicit edges ({@link nodeThresholds} /
     *   {@link edgeThresholds}).
     */
    scale?: ColorByScale;
    /**
     * Colour ramp (`0xRRGGBB`), interpolated in sRGB. Two or more stops; a single
     * stop is a constant colour. Default {@link DEFAULT_RANGE_STOPS}.
     */
    colorStops?: readonly number[];
    /**
     * Explicit `[min, max]` for node values. **Omit to auto-scan** the field across
     * the layer's nodes, rescanned when the node/edge set changes.
     *
     * ⚠️ With auto-domain, loading a node that widens the range **recolours every
     * other node** — set this explicitly for stable colours across a streaming load.
     */
    nodeDomain?: readonly [number, number];
    /** Edge equivalent of {@link nodeDomain}. */
    edgeDomain?: readonly [number, number];
    /** Bucket count for `scale: 'quantile'`. Default `5`. Ignored by other scales. */
    bins?: number;
    /**
     * Explicit bucket edges for `scale: 'threshold'`, in the node field's units —
     * `[10, 50, 200]` gives four buckets. Sorted ascending on resolve; duplicates
     * dropped. Ignored by other scales.
     */
    nodeThresholds?: readonly number[];
    /** Edge equivalent of {@link nodeThresholds}, in the edge field's units. */
    edgeThresholds?: readonly number[];
}
/**
 * Every option resolved to a concrete value — nothing past the constructor
 * writes `?? default`.
 *
 * Exported because {@link ColorByBehaviour.getResolvedOptions} hands it out:
 * the base `getOptions()` returns only what the caller *passed*, which omits
 * every default and so can't answer "what is this behaviour actually doing".
 */
interface ResolvedColorByOptions {
    mode: ColorByMode;
    nodeValueKey: string;
    edgeValueKey: string;
    nodeValueBy: ColorValueAccessor<GraphNode> | undefined;
    edgeValueBy: ColorValueAccessor<GraphEdge> | undefined;
    colorNodes: boolean;
    colorEdges: boolean;
    fallbackColor: number;
    palette: readonly number[];
    valueColors: Readonly<Record<string, number>>;
    maxCategories: number;
    scale: ColorByScale;
    colorStops: readonly number[];
    nodeDomain: readonly [number, number] | undefined;
    edgeDomain: readonly [number, number] | undefined;
    bins: number;
    nodeThresholds: readonly number[] | undefined;
    edgeThresholds: readonly number[] | undefined;
}
declare class ColorByBehaviour extends Behaviour<ColorByBehaviourOptions> {
    readonly kind = "color-by";
    private layer;
    private opts;
    /** Subscription disposers, called in `onDestroy`. */
    private readonly subs;
    /** Coalesces a burst of topology events into one domain rescan. */
    private rescanScheduled;
    /** Re-entrancy guard — our own repaint must not feed back into a rescan. */
    private patching;
    /** value → assigned colour, in first-appearance order. Categorical mode. */
    private readonly colors;
    /** Distinct values assigned *from the palette* — what `maxCategories` counts. */
    private paletteAssigned;
    /** Values that overflowed the cap, for the legend's `other (N)` row. */
    private readonly overflow;
    private nodeState;
    private edgeState;
    /** True while the resolvers are installed on the template. */
    private applied;
    /** Prior template fields, captured on `apply` and put back on `restore`. */
    private priorNodeBgFill;
    private priorEdgeStroke;
    private priorEdgeArrow;
    /**
     * The exact resolver instances this behaviour installed, so `restore` can tell
     * **its own** function from a consumer's. Identity, not `typeof === 'function'`:
     * a consumer's `bgFill: (n) => …` is also a function, and treating it as ours
     * meant disabling this behaviour overwrote their fill with a snapshot taken
     * before their config was ever applied — usually `undefined`, which renders a
     * node with no fill at all.
     */
    private installedNodeBgFill;
    /** Stroke alone identifies the edge channel — both fields install together. */
    private installedEdgeStroke;
    constructor(opts: ColorByBehaviourOptions);
    protected onRegister(ctx: CanvasContext): void;
    protected onEnable(): void;
    protected onDisable(): void;
    protected onDestroy(): void;
    /**
     * Re-apply when a live option patch lands, so a mode / key / palette change
     * recolours immediately.
     *
     * Resets the value→colour assignment (a new palette or cap re-assigns from
     * scratch), re-scans any auto-domain, and re-syncs each channel to its current
     * flag — installing the resolver when the channel is on, uninstalling it when
     * off, so toggling `colorNodes` off *while enabled* reverts that channel
     * immediately. A no-op while disabled; the next enable picks up the merged
     * options.
     */
    protected onOptionsChanged(patch: Partial<ColorByBehaviourOptions>): void;
    /**
     * The fully-resolved option set actually in use — **every default filled in**.
     *
     * Distinct from the base `getOptions()`, which returns only the options the
     * caller passed. A settings panel or a story that wants to show what the
     * behaviour is doing needs the resolved set, otherwise it silently omits every
     * default and reports `mode: undefined` for a behaviour that is very
     * definitely in categorical mode.
     *
     * Remember the validity matrix (class TSDoc): options outside the active mode
     * are present here but **ignored** by the write path.
     */
    getResolvedOptions(): Readonly<ResolvedColorByOptions>;
    /**
     * The derived per-channel domain and bin edges the colour resolvers read.
     *
     * Only meaningful in `'range'` mode. Worth exposing separately from
     * {@link getResolvedOptions} because when `nodeDomain` / `edgeDomain` are unset
     * the *resolved option* is `undefined` while the *domain in use* is whatever
     * the last auto-scan found — and that gap is exactly what surprises people.
     */
    getDomains(): {
        nodes: {
            domain: [number, number];
            edges: number[];
        };
        edges: {
            domain: [number, number];
            edges: number[];
        };
    };
    /**
     * Live value → colour mapping. Categorical mode only — `'range'` has no discrete
     * assignment, so prefer {@link getLegend} for anything mode-agnostic.
     */
    getColorMap(): ReadonlyMap<string, number>;
    /**
     * What a legend should render, per coloured channel.
     *
     * Derived from the same resolved options and domain the canvas is painted
     * from, so a legend sourced here can never disagree with what's on screen —
     * which a type-keyed legend structurally does once `mode: 'range'` is on.
     */
    getLegend(): {
        nodes?: ColorByLegendSection;
        edges?: ColorByLegendSection;
    };
    /** The colour for one already-extracted category value. */
    colorForValue(value: string | null | undefined): number;
    /** Extract a node's raw colour value: accessor if set, else the dot path. */
    private nodeValue;
    /** Extract an edge's raw colour value: accessor if set, else the dot path. */
    private edgeValue;
    /** Map a raw value to a colour under the current mode. */
    private colorFor;
    /** Drop category assignments so a new palette / cap re-assigns from scratch. */
    private resetAssignments;
    /**
     * Coalesce a burst of topology events into one rescan on the next microtask.
     * Guarded by `patching` so the repaint we trigger can't feed back into another.
     */
    private scheduleRescan;
    /**
     * Recompute each channel's domain and bin edges.
     *
     * **Refreshes the derived fields only — it never re-runs the install path.**
     * The resolvers close over `this`, so a fresh domain is picked up on the next
     * read; re-installing would re-snapshot the prior template fields and break
     * restore.
     */
    private rescanDomains;
    /** Build one channel's domain + bin edges from its observed values. */
    private deriveState;
    /** Build one channel's legend section from the resolved options + domain. */
    private legendFor;
    /**
     * Sync the node channel to `on`. When on, snapshot whatever base `bgFill` the
     * template currently carries — unless *our own* resolver is what's sitting
     * there, so we never snapshot ourselves — then install the colour resolver.
     * When off, put the snapshot back, but **only if our resolver is still the
     * installed one**.
     *
     * The guard is identity (`current === this.installedNodeBgFill`), not
     * `typeof current === 'function'`. A consumer's own `bgFill: (n) => …` is a
     * function too, and the old test claimed it as ours: disabling this behaviour
     * then wrote the pre-config snapshot (usually `undefined`) over the consumer's
     * resolver, leaving every node with no fill — invisible shapes with visible
     * labels. Identity also covers the ordering case: when a config lands *after*
     * we enabled, the template no longer holds our function, so we leave it alone.
     */
    private syncNode;
    /**
     * Sibling of {@link syncNode} for the edge channel (`strokeColor` +
     * `arrowTargetColor`), with the same identity guard — a consumer's own stroke
     * resolver is never mistaken for ours and restored over.
     */
    private syncEdge;
    /** Install the colour resolvers for the enabled channels. */
    private apply;
    /**
     * Re-render with the **already-installed** resolvers, after a domain rescan
     * changed what they return.
     *
     * Deliberately not `apply()`: re-installing would re-snapshot the prior
     * template fields (§restore) and, on every data batch, break disable. Passing
     * the same function identity back through `setNodeDefaults` re-renders every
     * item while leaving the identity guard intact.
     */
    private repaint;
    /** Put the snapshotted template fields back (uninstall both channels). */
    private restore;
}

/**
 * `BrushSelectBehaviour` — click-and-drag rectangular selection in screen
 * space. Every shape (and optionally connector) enclosed by the rectangle is
 * unioned with the existing selection.
 *
 * When a {@link ClickSelectBehaviour} is registered on the canvas (default
 * id `'click-select'`), the brush delegates selection mutations through it
 * so both behaviours stay in sync. Without a click-select target, the brush
 * falls back to driving `GraphLayer` state directly.
 *
 * Default `enabled: false` — register, then explicitly enable.
 *
 * Note: this behaviour creates a `Graphics` overlay attached to `ctx.stage`
 * for the rubber-band rectangle. That's one of two narrow carve-outs where
 * `@invana/graph` reaches into pixi directly — the alternative would be to
 * mount a private `ScreenLayer` per behaviour, which leaks an unnamed layer
 * id into the public registry.
 *
 * @example
 * ```ts
 * canvas.behaviours.register(
 *   new BrushSelectBehaviour({
 *     id: 'brush',
 *     targetLayerId: 'graph',
 *     enabled: true,
 *     trigger: ['shift'],
 *     enableElements: ['shape', 'connector'],
 *   }),
 * );
 * ```
 */

/** Element kinds the brush will pick up. */
type BrushSelectElementType = SelectableElementType;
/** Modifier-key names accepted by `trigger`. */
type BrushModifierKey = ModifierKey;
/** Visual style for the rubber-band rectangle. */
interface BrushSelectStyle {
    /** Fill color `0xRRGGBB`. Default `0x1677ff`. */
    fill?: number;
    /** Fill opacity 0–1. Default `0.1`. */
    fillAlpha?: number;
    /** Stroke color `0xRRGGBB`. Default `0x1677ff`. */
    stroke?: number;
    /** Stroke opacity 0–1. Default `0.8`. */
    strokeAlpha?: number;
    /** Stroke width in pixels. Default `1`. */
    strokeWidth?: number;
    /** Dash pattern `[dashLen, gapLen]`. `[]` for solid. Default `[4, 4]`. */
    strokeDash?: number[];
}
/** Constructor options for `BrushSelectBehaviour`. */
interface BrushSelectBehaviourOptions extends BehaviourOptions {
    /** Required — the `GraphLayer` id this behaviour brushes over. */
    targetLayerId: string;
    /**
     * Optional `ClickSelectBehaviour` id to delegate to. Default `'click-select'`.
     * If found, the brush hands the merged selection to the click-select layer
     * so both stay in sync. Otherwise the brush mutates `GraphLayer` state
     * directly.
     */
    clickSelectId?: string;
    /**
     * Per-drag enable predicate. `boolean` global on/off; or a function
     * called with the pointerdown native event. Default `true`.
     */
    enable?: boolean | ((event: PointerEvent) => boolean);
    /**
     * Element types eligible for brush selection. Default `['shape', 'connector']`.
     */
    enableElements?: BrushSelectElementType[];
    /**
     * Modifier key(s) that must be held during pointerdown to activate the
     * brush. Empty array = any left-drag activates. Default `['shift']`.
     */
    trigger?: BrushModifierKey[];
    /**
     * Live-update the selection as the rect grows. `false` = apply only on
     * release. Default `false`.
     */
    immediately?: boolean;
    /**
     * Visual state name applied to brushed elements when no `ClickSelectBehaviour`
     * is targeted. Ignored on the delegate path. Default `'selected'`.
     */
    state?: string;
    /** Rectangle style. */
    style?: BrushSelectStyle;
    /**
     * Clear selection when the user clicks on the empty background (no drag).
     * Default `true`.
     */
    clearOnBackground?: boolean;
    /** Fired once on release if the brush produced a selection change. */
    onSelect?: (snapshot: SelectionSnapshot) => void;
}
interface ResolvedOptions$5 {
    enable: boolean | ((event: PointerEvent) => boolean);
    enableElements: BrushSelectElementType[];
    trigger: BrushModifierKey[];
    immediately: boolean;
    state: string;
    style: BrushSelectStyle;
    clearOnBackground: boolean;
    onSelect: ((snapshot: SelectionSnapshot) => void) | undefined;
}
declare class BrushSelectBehaviour extends Behaviour {
    readonly kind = "brush-select";
    private readonly clickSelectId;
    private opts;
    private layer;
    private ctxRef;
    private overlay;
    private dragActive;
    private dragStart;
    private dragCurrent;
    private listenerDisposers;
    constructor(opts: BrushSelectBehaviourOptions);
    protected onRegister(ctx: CanvasContext): void;
    protected onDestroy(): void;
    protected onDisable(): void;
    get options(): Readonly<ResolvedOptions$5>;
    setOptions(patch: Partial<BrushSelectBehaviourOptions>): void;
    private screenFromEvent;
    private handlePointerDown;
    private handlePointerMove;
    private handlePointerUp;
    private cancelDrag;
    private drawRect;
    private clearRect;
    private rectHasArea;
    private triggerActive;
    private applySelection;
    private clearSelection;
}

/**
 * `LassoSelectBehaviour` — click-and-drag freeform polygon selection in
 * **world** space (the polygon stays anchored to the graph during pan/zoom).
 *
 * Mirrors {@link BrushSelectBehaviour} but operates with point-in-polygon
 * containment instead of an AABB rect. Delegates to a
 * {@link ClickSelectBehaviour} when one is registered.
 *
 * Default `enabled: false` — register, then explicitly enable.
 *
 * Same pixi-overlay carve-out as `BrushSelectBehaviour` — the world-space
 * polygon is rendered into a `Graphics` attached to `ctx.world` (which
 * pans/zooms with the camera).
 */

/** Element kinds the lasso will pick up. */
type LassoSelectElementType = SelectableElementType;
/** Modifier-key names accepted by `trigger`. */
type LassoModifierKey = ModifierKey;
/** Visual style for the polygon overlay. Same shape as the brush style. */
interface LassoSelectStyle {
    fill?: number;
    fillAlpha?: number;
    stroke?: number;
    strokeAlpha?: number;
    /** Stroke width in *screen* pixels (auto-divided by zoom). Default `1`. */
    strokeWidth?: number;
    /** Dash pattern in screen pixels `[dashLen, gapLen]`. Default `[4, 4]`. */
    strokeDash?: number[];
}
/** Constructor options for `LassoSelectBehaviour`. */
interface LassoSelectBehaviourOptions extends BehaviourOptions {
    targetLayerId: string;
    clickSelectId?: string;
    enable?: boolean | ((event: PointerEvent) => boolean);
    enableElements?: LassoSelectElementType[];
    trigger?: LassoModifierKey[];
    immediately?: boolean;
    state?: string;
    style?: LassoSelectStyle;
    clearOnBackground?: boolean;
    onSelect?: (snapshot: SelectionSnapshot) => void;
}
interface ResolvedOptions$4 {
    enable: boolean | ((event: PointerEvent) => boolean);
    enableElements: LassoSelectElementType[];
    trigger: LassoModifierKey[];
    immediately: boolean;
    state: string;
    style: LassoSelectStyle;
    clearOnBackground: boolean;
    onSelect: ((snapshot: SelectionSnapshot) => void) | undefined;
}
declare class LassoSelectBehaviour extends Behaviour {
    readonly kind = "lasso-select";
    private readonly clickSelectId;
    private opts;
    private layer;
    private ctxRef;
    private overlay;
    private dragActive;
    /** Polygon points in WORLD space. */
    private worldPoints;
    private lastScreen;
    private startScreen;
    private listenerDisposers;
    constructor(opts: LassoSelectBehaviourOptions);
    protected onRegister(ctx: CanvasContext): void;
    protected onDestroy(): void;
    protected onDisable(): void;
    get options(): Readonly<ResolvedOptions$4>;
    setOptions(patch: Partial<LassoSelectBehaviourOptions>): void;
    private screenFromEvent;
    private handlePointerDown;
    private handlePointerMove;
    private handlePointerUp;
    private cancelDrag;
    private gestureHasArea;
    private drawPolygon;
    private clearPolygon;
    private triggerActive;
    private applySelection;
    private clearSelection;
}

/**
 * `DragNodeBehaviour` — pointer-drag a `GraphLayer` node by writing the new
 * position to its `GraphStore` (not directly to the renderer).
 *
 * Differs from `@invana/canvas` `DragShapeBehaviour` in one important way:
 * the position update flows through the store, so:
 *   - `node:update` events fire — anyone listening (server replication,
 *     analytics, animations) sees the move.
 *   - The layer's connector-reroute pass runs naturally on the store flush.
 *
 * **Doesn't pin during the drag.** The transient hold against an active
 * physics layout is done via the layer's `node:drag-start` / `node:drag-end`
 * events — layouts (e.g. `D3ForceLayout` clamping `fx/fy`) subscribe and
 * manage the lock internally. The store's `GraphNode.pinned` flag is *not*
 * touched mid-gesture, since that flag is user-data semantics (permanent
 * pin) and a drag shouldn't silently mutate it.
 *
 * **Pin on release is opt-in.** Set `pinOnRelease: true` to call
 * `store.setPinned(id, true)` on drag-end — useful when you want the user's
 * placement to survive future layout passes. Off by default; when off, a
 * released node is free again and the next layout tick may move it.
 *
 * **Selection-aware.** With `dragSelection` (default on), grabbing a node that
 * is part of the current selection drags the whole selection together. The
 * selection is read from the layer's `selectionState` visual state, so it works
 * with any select behaviour (click / lasso / brush) — this behaviour is not
 * coupled to a specific one.
 *
 * Default `enabled: false` — register, then explicitly enable.
 *
 * @example
 * ```ts
 * canvas.behaviours.register(
 *   new DragNodeBehaviour({ id: 'drag', targetLayerId: 'graph', enabled: true }),
 * );
 * ```
 */

/** Constructor options for `DragNodeBehaviour`. */
interface DragNodeBehaviourOptions extends BehaviourOptions {
    /** Required — the `GraphLayer` id whose nodes this behaviour drags. */
    targetLayerId: string;
    /**
     * Predicate to restrict which node ids are draggable. Returning `false`
     * ignores the pointerdown. Default = every node is draggable.
     */
    filter?: (id: string) => boolean;
    /** Cursor applied to the canvas while dragging. Default `'grabbing'`. */
    dragCursor?: string;
    /**
     * When `true`, set `GraphNode.pinned = true` on the dragged node when
     * the gesture ends (real drag only — a click that didn't move is a
     * no-op). The store's pinned flag is read by layouts (e.g.
     * `D3ForceLayout` writes pinned nodes to d3-force's `fx/fy`) so the
     * node stays where the user dropped it across future layout passes.
     * Default `false`. To un-pin a pinned node, call
     * `graph.store.setPinned(id, false)` explicitly.
     */
    pinOnRelease?: boolean;
    /**
     * When `true` (the default), dragging a node that is itself a compound
     * group (resolved `style.group` set) translates every descendant by the
     * same delta in one `setPositionsBulk` call so the whole subtree moves
     * together. Set to `false` to drag the group frame on its own — useful
     * only when descendants are layout-driven and should stay put.
     *
     * For auto-fit groups the frame's position is layer-derived from the
     * children bbox; moving descendants moves the frame naturally on the
     * next flush. For non-auto-fit groups, the group's stored `position`
     * is also updated so the declared frame follows the cursor.
     */
    groupAware?: boolean;
    /**
     * When `true` (the default), grabbing a node that is part of the current
     * selection drags the **whole selection** together — every selected node
     * moves by the same delta. Grabbing an unselected node (or a selection of
     * one) falls back to a plain single-node drag. Set `false` to always drag
     * just the grabbed node regardless of selection.
     *
     * Selection is read from the layer's visual state (see `selectionState`),
     * so this works uniformly whatever set it — click, lasso, or brush — with
     * no coupling to a specific select behaviour.
     */
    dragSelection?: boolean;
    /**
     * Name of the layer visual-state that marks a node as selected. Default
     * `'selected'`, matching `ClickSelectBehaviour`'s default `state`. Only
     * consulted when `dragSelection` is on. Override if your select behaviour
     * writes a different state name.
     */
    selectionState?: string;
    /**
     * When `true` (the default), a plain (no-modifier) press anywhere inside the
     * current selection's union bounding box — *including the empty world space
     * between the selected nodes* — grabs the whole selection and drags it, the
     * way Figma / PowerPoint let you drag a multi-selection by its body rather
     * than by a specific item.
     *
     * Without this, a selection is only draggable by pressing squarely on one of
     * the selected nodes; pressing in the gaps does nothing (no shape is hit, so
     * no drag starts). Off the back of a brush/lasso selection that almost always
     * reads as "the selection won't move" — hence default on.
     *
     * Only meaningful when `dragSelection` is also on. The press must carry no
     * modifier key (so it never collides with brush / lasso / shift-to-add) and
     * must not land on a node (those go through the normal per-node path). This
     * does mean panning the camera by dragging from *inside* the selection box is
     * no longer possible — drag from outside the box, or set this `false`.
     */
    selectionBodyDrag?: boolean;
    /**
     * Extra world-space padding added around the selection's union bounding box
     * when testing a press for {@link selectionBodyDrag}. Widens the grab target
     * so presses just outside the tightest box still catch. Default `0`.
     */
    selectionBodyPadding?: number;
}
declare class DragNodeBehaviour extends Behaviour<DragNodeBehaviourOptions> {
    readonly kind = "drag-node";
    private layer;
    private ctxRef;
    private get filter();
    private get dragCursor();
    private get groupAware();
    private get pinOnRelease();
    private get dragSelection();
    private get selectionState();
    private get selectionBodyDrag();
    private get selectionBodyPadding();
    private state;
    private offShapeDown;
    private offCanvasDown;
    private canvasEl;
    private prevCursor;
    /**
     * Pointer id captured on `pointerdown` so we can hold the capture on the
     * canvas element for the duration of the drag — otherwise the cursor
     * crossing the canvas bounds (e.g. over a lil-gui panel) fires
     * `pointercancel` on the document and the drag ends prematurely.
     */
    private capturedPointerId;
    constructor(opts: DragNodeBehaviourOptions);
    protected onRegister(ctx: CanvasContext): void;
    protected onDestroy(): void;
    protected onDisable(): void;
    /**
     * Resolve the set of *primary* nodes a gesture on `grabbedId` should drag.
     * With `dragSelection` on, a grab on a selected node drags every selected
     * node (filtered by `filter`); otherwise — or for a selection of one — just
     * the grabbed node. Group descendants are added later, in the first move.
     */
    private resolveDragSet;
    /** Current selection (nodes carrying `selectionState`), filtered by `filter`. */
    private selectedNodeIds;
    /**
     * World-space union AABB of the given nodes, or `null` if none resolve. Each
     * node contributes its `boundsOfNode` rect (centre-relative, so offset by the
     * node's stored position); a node whose shape kind reports no bounds collapses
     * to a zero-size point at its centre.
     */
    private selectionBounds;
    /**
     * Selection-body drag entry point (see `selectionBodyDrag`). A plain press on
     * empty world space that falls inside the selection's union bounds grabs the
     * whole selection. Presses on a node, with a modifier held, or outside the
     * bounds are left alone so the per-node / brush / lasso / pan paths win.
     */
    private onCanvasPointerDown;
    private startDrag;
    /**
     * Low-level drag start shared by the per-node path ({@link startDrag}) and the
     * selection-body path ({@link onCanvasPointerDown}). `primaryId` is the gesture's
     * emitted primary; `ids` is the full primary set to translate together.
     */
    private beginDrag;
    private endDrag;
    private readonly onWindowPointerMove;
    private readonly onWindowPointerUp;
    private clientToScreen;
}

/**
 * `ContextMenuBehaviour` — surfaces right-click (context-menu) gestures on
 * nodes, edges, and the empty canvas as a single `onContextMenu` callback.
 *
 * Layer-scoped: constructed with a `targetLayerId`. Subscribes to that
 * layer's renderer `shape:contextmenu` / `connector:contextmenu` events and to
 * the engine-level `background:contextmenu` (empty-canvas right-click).
 *
 * **Headless.** The behaviour does not render any menu UI — it resolves the
 * target (node id + `data`, edge id + `data`, or canvas) and hands the caller
 * everything needed to position and populate their own menu. The browser's
 * native menu is suppressed by `Canvas` (`suppressBrowserContextMenu`, default
 * `true`), so no `preventDefault` is needed here.
 *
 * Default `enabled: false` — register, then explicitly enable.
 *
 * @example
 * ```ts
 * canvas.behaviours.register(
 *   new ContextMenuBehaviour({
 *     id: 'context-menu',
 *     targetLayerId: 'graph',
 *     enabled: true,
 *     onContextMenu: ({ targetType, id, screen }) => {
 *       showMenu(targetType, id, screen.x, screen.y);
 *     },
 *   }),
 * );
 * ```
 */

/** Which kind of target a context-menu gesture landed on. */
type ContextMenuTargetType = 'node' | 'edge' | 'canvas';
/** Payload handed to {@link ContextMenuBehaviourOptions.onContextMenu}. */
interface ContextMenuEvent {
    /** What was right-clicked. */
    readonly targetType: ContextMenuTargetType;
    /** Node/edge id, or `null` for an empty-canvas right-click. */
    readonly id: string | null;
    /**
     * Arbitrary user payload from `node.data` / `edge.data`. `undefined` for a
     * canvas right-click or when the resolved item carries no `data`.
     */
    readonly data: unknown;
    /** Pointer position in world (scene) coordinates. */
    readonly world: {
        readonly x: number;
        readonly y: number;
    };
    /**
     * Pointer position in screen (canvas-relative) coordinates, via
     * `camera.toScreen`. Add the canvas element's bounding-rect offset to place
     * a `position: fixed` menu, or use directly inside a `position: relative`
     * canvas container.
     */
    readonly screen: {
        readonly x: number;
        readonly y: number;
    };
}
/** Constructor options for `ContextMenuBehaviour`. */
interface ContextMenuBehaviourOptions extends BehaviourOptions {
    /** Required — the `GraphLayer` id this behaviour drives. */
    targetLayerId: string;
    /**
     * Which targets fire `onContextMenu`. A right-click on a target not in this
     * list is ignored. Default `['node', 'edge', 'canvas']`.
     */
    targets?: readonly ContextMenuTargetType[];
    /**
     * Optional transient state name applied to the right-clicked node/edge (e.g.
     * `'context-open'`). The previously marked target is cleared first, so at
     * most one element carries it at a time. Cleared on disable/destroy.
     * `null`/`undefined` disables this. Default `null`.
     */
    state?: string | null;
    /** Fired on a qualifying right-click. */
    onContextMenu?: (event: ContextMenuEvent) => void;
}
interface ResolvedOptions$3 {
    targets: readonly ContextMenuTargetType[];
    state: string | null;
    onContextMenu: ((event: ContextMenuEvent) => void) | undefined;
}
declare class ContextMenuBehaviour extends Behaviour {
    readonly kind = "context-menu";
    private layer;
    private opts;
    /** Subscription disposers. */
    private subs;
    /** Element currently carrying `opts.state`, so we can clear it on the next open. */
    private statedTarget;
    constructor(opts: ContextMenuBehaviourOptions);
    protected onRegister(ctx: CanvasContext): void;
    protected onDestroy(): void;
    protected onDisable(): void;
    /** Resolved current options (read-only snapshot). */
    get options(): Readonly<ResolvedOptions$3>;
    /** Merge new options. Unspecified fields keep their current value. */
    setOptions(patch: Partial<ContextMenuBehaviourOptions>): void;
    private handle;
    /** Move the transient `opts.state` marker onto the freshly clicked target. */
    private applyStatedTarget;
    private clearStatedTarget;
}

/**
 * `CreateNodeBehaviour` — click empty canvas to add a node to a `GraphLayer`.
 *
 * Layer-scoped; mutates the store directly (like `DragNodeBehaviour`) and also
 * fires an `onNodeCreate` callback. A `createNode` factory lets the consumer
 * shape the node (id, style, data) or veto by returning `null`.
 *
 * Background-click detection mirrors `ClickSelectBehaviour`: the renderer fires
 * `shape:click` / `connector:click` synchronously during the native DOM click,
 * so a flag set there tells us the click landed on an element (don't create).
 * A pointer-move threshold between `pointerdown` and `click` distinguishes a
 * click from a camera pan.
 *
 * Default `enabled: false` — register, then explicitly enable. To tie it to the
 * modeller's Add tool, enable it with `modes: ['add']`: it then runs only while
 * `view.interaction.viewMode` is `'add'` (the `tool.active` command / `useTool`),
 * with no host-side gating. The Add tool's node kind is
 * `viewModeArgs.nodeKind` — read it in `createNode`.
 */

/** Constructor options for `CreateNodeBehaviour`. */
interface CreateNodeBehaviourOptions extends BehaviourOptions {
    /** Required — the `GraphLayer` id this behaviour adds nodes to. */
    targetLayerId: string;
    /**
     * Build the node to insert from the click's world position. Return `null`
     * to veto creation. Default: `{ id: <generated>, position }`.
     */
    createNode?: (world: {
        x: number;
        y: number;
    }) => GraphNode | null;
    /** Fired after a node is added to the store. */
    onNodeCreate?: (node: GraphNode) => void;
}
declare class CreateNodeBehaviour extends Behaviour<CreateNodeBehaviourOptions> {
    readonly kind = "create-node";
    private layer;
    private ctxRef;
    private canvasEl;
    private get makeNode();
    private get onNodeCreate();
    /** Subscription disposers. */
    private subs;
    /** True when the in-flight click already landed on a node/edge. */
    private clickConsumedByElement;
    /** Pointerdown screen-position — used to distinguish a click from a drag/pan. */
    private pointerDownScreen;
    constructor(opts: CreateNodeBehaviourOptions);
    protected onRegister(ctx: CanvasContext): void;
    protected onDestroy(): void;
    private clientToScreen;
}

/**
 * `DrawEdgeBehaviour` — drag from a source node to a target node to create an
 * edge, with a dashed rubber-band preview that follows the cursor.
 *
 * Layer-scoped; mutates the store directly (like `DragNodeBehaviour`) and fires
 * an `onEdgeCreate` callback. A `createEdge` factory shapes the edge (id, style,
 * data) or vetoes by returning `null` (e.g. to reject duplicates).
 *
 * The preview is a **transient renderer connector** routed from the source
 * shape to a free `{ kind: 'point' }` endpoint updated on every pointermove —
 * no "cursor node", so hit-testing for the drop target is unaffected. The
 * target node under the cursor is found with `renderer.hitTest(...)`.
 *
 * Pointer-capture + `clientToScreen` lifecycle mirrors `DragNodeBehaviour`.
 *
 * Default `enabled: false`. Don't run this and `DragNodeBehaviour` enabled at
 * the same time — both start on `shape:pointerdown`. Enable it with
 * `modes: ['connect']` (and `DragNodeBehaviour` with `modes: ['select']`) so the
 * modeller tool picks exactly one.
 */

/** Constructor options for `DrawEdgeBehaviour`. */
interface DrawEdgeBehaviourOptions extends BehaviourOptions {
    /** Required — the `GraphLayer` id this behaviour draws edges in. */
    targetLayerId: string;
    /**
     * Allow releasing on the *source* node to create a self-loop. Default
     * `false` (releasing on the source cancels). When `true`, the default
     * `createEdge` factory styles a self-loop as `pathType: 'loop-curve'` with
     * `sourceAnchor`/`targetAnchor` set to `'center'` (a loop needs center
     * anchors — `'boundary'` collapses it onto a single silhouette point).
     */
    allowSelfLoop?: boolean;
    /**
     * Build the edge to insert from the endpoints. Return `null` to veto (e.g.
     * a duplicate or disallowed pair). Default: `{ id: <generated>, source, target }`,
     * or a loop-styled edge when `source === target` (see {@link allowSelfLoop}).
     */
    createEdge?: (source: string, target: string) => GraphEdge | null;
    /** Fired after an edge is added to the store. */
    onEdgeCreate?: (edge: GraphEdge) => void;
    /** Rubber-band preview stroke. Defaults to a dashed light-blue line. */
    draftStyle?: Partial<{
        color: number;
        width: number;
        alpha: number;
        dash: [number, number];
    }>;
}
declare class DrawEdgeBehaviour extends Behaviour<DrawEdgeBehaviourOptions> {
    readonly kind = "draw-edge";
    private layer;
    private ctxRef;
    private canvasEl;
    private get allowSelfLoop();
    private get onEdgeCreate();
    private get makeEdge();
    private get draft();
    private offShapeDown;
    private sourceId;
    private candidateTarget;
    private capturedPointerId;
    constructor(opts: DrawEdgeBehaviourOptions);
    protected onRegister(ctx: CanvasContext): void;
    protected onDestroy(): void;
    protected onDisable(): void;
    private startDraw;
    private endDraw;
    private readonly onWindowPointerMove;
    private readonly onWindowPointerUp;
    private clientToScreen;
}

/**
 * `EraseBehaviour` — click a node or edge to delete it from a `GraphLayer`.
 *
 * The "eraser" tool of a drawing toolbar: clicking a node removes it **and**
 * cascades its incident edges; clicking an edge removes just that edge. Like
 * {@link CreateNodeBehaviour} / `DrawEdgeBehaviour` it mutates the store
 * directly and fires a callback — but `onErase` reports the *removed* element
 * with enough captured state (the node + its incident edges, or the edge) to
 * reconstruct it, so a consumer can journal an undoable delete.
 *
 * Hit detection rides the renderer's synchronous `shape:click` /
 * `connector:click` channels — the same ones `ClickSelectBehaviour` uses — so
 * the clicked element's id arrives directly; no world-space hit-testing needed.
 *
 * Default `enabled: false` — register, then explicitly enable (e.g. a "Delete"
 * tool mode toggles it on). Don't run it enabled alongside `ClickSelect` /
 * `DragNode` on the same layer: all three react to a node press. Enable it with
 * `modes: ['delete']` (the others with `modes: ['select']`) so the modeller tool
 * leaves exactly one live.
 */

/** Which element kinds the eraser removes. */
type EraseTargetKind = 'node' | 'edge' | 'both';
/**
 * Payload describing what {@link EraseBehaviour} just removed. Carries the full
 * pre-removal element(s) so a consumer can rebuild them (undo). A removed node
 * carries its cascade-removed incident `edges`.
 */
type ErasedElement = {
    kind: 'node';
    node: GraphNode;
    edges: GraphEdge[];
} | {
    kind: 'edge';
    edge: GraphEdge;
};
/** Constructor options for `EraseBehaviour`. */
interface EraseBehaviourOptions extends BehaviourOptions {
    /** Required — the `GraphLayer` id this behaviour erases from. */
    targetLayerId: string;
    /** Which element kinds a click removes. Default `'both'`. */
    target?: EraseTargetKind;
    /** Fired after an element is removed, with the captured pre-removal state. */
    onErase?: (removed: ErasedElement) => void;
}
declare class EraseBehaviour extends Behaviour<EraseBehaviourOptions> {
    readonly kind = "erase";
    private layer;
    private get target();
    private get onErase();
    /** Subscription disposers. */
    private subs;
    constructor(opts: EraseBehaviourOptions);
    protected onRegister(ctx: CanvasContext): void;
    protected onDestroy(): void;
    /** Capture node + incident edges, cascade-remove, then report. */
    private eraseNode;
    /** Capture the edge, remove it, then report. */
    private eraseEdge;
    /** Cloned incident edges (both directions), deduped — self-loops appear once. */
    private incidentEdges;
}

/**
 * `CollapseExpandBehaviour` — flips a group frame between its expanded and
 * collapsed states. Two routes to the same flip: a click on the group's
 * `+` / `−` toggle decoration, and (unless `doubleClickToToggle: false`) a
 * double-click anywhere on the frame itself. The camera stays where it is;
 * opt in to re-flowing the graph around the toggled frame with
 * `relayoutOnToggle`, and to re-centring on it with `centerOnToggle`.
 *
 * With `countBadge` on, the behaviour also marks every collapsed frame with a
 * small pill showing how many nodes it hides. It writes that badge into the
 * frame's own `style.badges` (slot {@link COLLAPSED_COUNT_BADGE_ID}) — a node's
 * `style` is presentation, never persisted to the graph backend (only `.data`
 * is), so a behaviour may keep derived presentation there as long as it owns
 * the slot, keeps it in step, and removes it when switched off.
 *
 * Listens for native DOM `pointerdown` on the canvas element rather than
 * the renderer's `shape:pointerdown` channel. The reason: the toggle
 * decoration is typically anchored to (or *outside*) the host's
 * silhouette — outside-`'bottom'` for collapsed circles in the reference
 * UI — and PixiJS's hit-test rejects clicks outside the silhouette so a
 * shape-level subscription would never fire for those placements. A
 * canvas-wide listener tests the click against the toggle's cached hit
 * geometry regardless of where it sits.
 *
 * Layer-scoped. Default `enabled: false` per the no-auto-registration rule.
 *
 * @example
 * ```ts
 * canvas.behaviours.register(
 *   new CollapseExpandBehaviour({
 *     id: 'collapse-expand',
 *     targetLayerId: 'graph',
 *     enabled: true,
 *   }),
 * );
 * ```
 */

/**
 * Slot id the `GraphLayer` mounts the group's `+` / `−` toggle decoration on.
 * Re-exported for advanced consumers that want to read or override the
 * decoration; most callers shouldn't need it.
 */
declare const GROUP_TOGGLE_SLOT = "group-toggle";
/**
 * `NodeBadge.id` of the collapsed-count badge this behaviour writes into a
 * collapsed frame's `style.badges` when `countBadge` is on. Other badges on
 * the same node are never touched.
 */
declare const COLLAPSED_COUNT_BADGE_ID = "collapsed-count";
interface CollapseExpandBehaviourOptions extends BehaviourOptions {
    /** Required — the `GraphLayer` id this behaviour drives. */
    targetLayerId: string;
    /**
     * Double-clicking a group frame toggles it, as a second route to the same
     * flip the `+` / `−` button performs. Default `true`.
     *
     * The target is the frame itself, anywhere it is the topmost thing under the
     * pointer — its tab, its padding, the gaps between its members. A
     * double-click that lands on a **member node** belongs to that node and is
     * ignored here (the renderer's hit test ranks by z-index, and an expanded
     * frame deliberately paints *under* its children). Double-clicking a
     * collapsed frame re-opens it.
     */
    doubleClickToToggle?: boolean;
    /**
     * Pan the camera to centre the frame after it opens or closes. Default
     * `false` — the camera stays put, so the frame stays where the user
     * clicked it.
     *
     * Opt in when frames are large enough that closing one pulls its toggle far
     * from where the user left it; the pan then glides over
     * {@link centerDurationMs}. Zoom is untouched; this is a pan only.
     */
    centerOnToggle?: boolean;
    /**
     * How long the {@link centerOnToggle} pan glides for, in milliseconds.
     * Default `300`, eased out. `0` jumps straight to the frame.
     *
     * The frame itself changes size in a single frame, so an instant re-centre
     * lands in that same frame and the whole scene jumps with it — hundreds of
     * pixels when the frame sat near the edge of the view. Gliding lets the eye
     * follow the frame to the centre. Any pan or zoom by the user during the
     * glide cancels it.
     */
    centerDurationMs?: number;
    /**
     * Re-run the canvas's active layout after a frame opens or closes. Default
     * `false`.
     *
     * A toggle on its own only swaps the frame's geometry: closing one leaves its
     * old footprint empty, and opening one whose neighbours have since moved in
     * lands its members on top of them. With this on, the graph re-flows with
     * the layout's own transition, **anchored on the toggled frame** — it stays
     * where the user clicked it and everything else moves around it — and the
     * camera is left alone (the run carries `preserveCamera`, so no fitter
     * re-frames the view). Off by default because it moves nodes the user may
     * have placed by hand.
     */
    relayoutOnToggle?: boolean;
    /**
     * Mark each collapsed frame with a small pill showing how many nodes it
     * hides, like a notification count. Default `false`.
     *
     * Coloured from the active theme (`accent` fill, `surface` text, `cardBg`
     * ring) and re-coloured on every theme change. Applies to every group frame
     * in the target layer, however it was collapsed — by this behaviour, by a
     * dataset's `states: ['collapsed']`, or by code — and disappears when the
     * frame opens, when the frame is itself hidden inside a collapsed parent,
     * or when the behaviour is disabled.
     *
     * The pill is written into the frame's `style.badges` under
     * {@link COLLAPSED_COUNT_BADGE_ID}, next to any badges the frame already
     * declares. For the count as centred text instead, use
     * `GroupOptions.showCollapsedCount`.
     */
    countBadge?: boolean;
    /**
     * Which corner or edge of the collapsed frame the {@link countBadge} pill
     * sits on. The pill is centred on that point, so it hangs half over the
     * frame's edge. Default `'top-right'`.
     */
    countBadgePlacement?: BadgePlacement;
}
declare class CollapseExpandBehaviour extends Behaviour<CollapseExpandBehaviourOptions> {
    readonly kind = "collapse-expand";
    private layer;
    private ctxRef;
    private canvasEl;
    /** Unsubscribers for the layer / canvas events the count badge follows. */
    private subs;
    /** Active theme roles for the count badge, over {@link FALLBACK_PALETTE}. */
    private palette;
    constructor(opts: CollapseExpandBehaviourOptions);
    protected onRegister(ctx: CanvasContext): void;
    protected onEnable(): void;
    protected onDisable(): void;
    protected onOptionsChanged(): void;
    protected onDestroy(): void;
    private readonly onPointerDown;
    /**
     * Double-click anywhere on a group frame toggles it — the same flip the
     * `+` / `−` button performs, on a target that's far easier to hit.
     *
     * Resolution is one hit test, and the z-order does the discrimination for
     * us: an expanded frame paints *under* its members (`behindChildren`), so a
     * double-click over a member returns the member and we leave it alone,
     * while one over the frame's own tab / padding / gaps returns the frame. A
     * collapsed frame is a normal node and is returned directly.
     *
     * Opt out with `doubleClickToToggle: false`.
     */
    private readonly onDoubleClick;
    /**
     * The group frame under the pointer, or `null` when the topmost element
     * there is a regular node, a connector, or nothing at all.
     *
     * Shapes that aren't nodes — a badge (e.g. the {@link
     * CollapseExpandBehaviourOptions.countBadge} pill) is its own small shape on
     * top of its host — are looked through: the hit test runs again excluding them, so a
     * double-click on a frame's badge reaches the frame. Member cards are nodes,
     * so a double-click on one still belongs to the card.
     */
    private groupUnder;
    /**
     * The smallest group frame whose on-screen box, grown by
     * {@link BADGE_REACH}, contains `(x, y)` — how a double-click on the part of
     * a badge hanging outside its frame finds that frame. `null` when none does.
     */
    private groupNear;
    /**
     * Convert a `PointerEvent` into world coordinates and walk every group
     * node in the layer. Return the first group whose mounted toggle
     * decoration's hit area contains the click, or `null` if none match.
     */
    private findToggleHit;
    /**
     * Flip the {@link COLLAPSED_STATE} state on the group.
     *
     * Collapse is interaction state, so the write goes to the store's presence
     * set — the same channel as `hovered` / `selected` — and never to `style`.
     * The visual consequences follow from the state: `GraphLayer` hides the
     * descendants, closes the silhouette to its minimal form, and applies
     * whatever `state.collapsed` overlay the node (or its template) declares.
     *
     * The one wrinkle is the document `states[]`: `nodeStatesOf` is the *union*
     * of the feed's states and the runtime set, so a node authored as
     * `states: ['collapsed']` would stay closed forever if we only cleared the
     * runtime flag. Opening therefore strips the document state too — the user's
     * click wins over the feed's initial condition.
     */
    private toggleCollapsed;
    /**
     * Follow up on a toggle once the frame has re-projected: re-flow the graph
     * ({@link CollapseExpandBehaviourOptions.relayoutOnToggle}), then centre the
     * camera on the frame ({@link CollapseExpandBehaviourOptions.centerOnToggle}).
     * Each is opt-in; with neither on this is a no-op.
     *
     * Timing is the whole point of the indirection. The toggle only writes
     * state; the frame's new geometry — collapsed silhouette or re-fitted body —
     * lands when `GraphLayer` drains its dirty groups during the store flush,
     * which with the default frame-coalesced store is the next rAF. Acting
     * inline would measure the geometry the user is leaving — a re-flow would
     * anchor on the old frame, a re-centre would overshoot by exactly the amount
     * the frame is about to change by. So we take a one-shot `data:changed`
     * subscription (emitted at the *end* of the flush, after the group drain).
     *
     * When both are on, the centre waits for the re-flow to settle, so it aims
     * at where the frame finally lands.
     */
    private afterReproject;
    /**
     * Glide the camera to centre `nodeId`'s frame.
     *
     * Bounds rather than `node.position`: an auto-fit frame's stored position is
     * its top-left, and a collapsed one keeps the position of the frame it used
     * to be — neither is the centre of what's on screen.
     */
    private centerOn;
    /**
     * Bring every group frame's {@link COLLAPSED_COUNT_BADGE_ID} badge in line
     * with the current state: present, with the hidden-node count, on each
     * collapsed frame while the behaviour is enabled with `countBadge` on;
     * absent everywhere else.
     *
     * Idempotent and convergent: a frame whose badge already matches is not
     * written, so the flush a write causes finds nothing more to change. That
     * is also what clears a stale badge carried in by an import (the frame
     * comes back open, so its badge is removed on the first flush).
     */
    private syncCountBadges;
    /**
     * The count pill for frame `id`: a rounded rect sized to the digits, centred
     * on {@link CollapseExpandBehaviourOptions.countBadgePlacement}, in theme
     * colours.
     */
    private countBadgeFor;
    /**
     * Put `badge` in `node.style.badges` under {@link COLLAPSED_COUNT_BADGE_ID}
     * (or remove that entry when `badge` is `undefined`), leaving the node's
     * other badges alone. Skips the write when nothing would change.
     */
    private writeCountBadge;
}

/**
 * `NodeResizeBehaviour` — drag-resize any node (group or regular) whose
 * resolved style opts into resizing.
 *
 * The behaviour:
 * 1. mounts a single `SelectionFrameDecoration` on every eligible node.
 *    The decoration paints a dashed AABB outline plus round handles at
 *    the corners (and edge midpoints for rect hosts). For circle hosts
 *    only the radial `'right'` handle is exposed so the user always
 *    grows / shrinks the radius isotropically. Eligibility =
 *    `style.resizable === true` (regular nodes) OR
 *    `style.group?.userResizable === true` (compound groups);
 * 2. listens at the **canvas DOM level** for `pointerdown`. The handles
 *    sit at AABB corners, which fall outside the silhouette for circles
 *    and on the edge for rects — PixiJS's shape hit-test rejects those
 *    clicks. Canvas-level listening sidesteps the issue: every click is
 *    tested against the decoration's cached per-handle hit geometry;
 * 3. on drag (window-level `pointermove`), writes the new size back via
 *    `store.updateNode`. The target field depends on the eligibility
 *    flag: groups go to `style.group.width / height / radius`, regular
 *    nodes go to `style.shape.width / height / radius`. Position is also
 *    rewritten so the opposite anchor stays fixed on rect drags (except
 *    for auto-fit groups, where the layer derives the frame's position
 *    from the children bbox).
 *
 * Layer-scoped. Default `enabled: false`.
 *
 * @example
 * ```ts
 * canvas.behaviours.register(
 *   new NodeResizeBehaviour({ id: 'resize', targetLayerId: 'graph', enabled: true }),
 * );
 * ```
 */

interface NodeResizeBehaviourOptions extends BehaviourOptions {
    /** Required — the `GraphLayer` id this behaviour drives. */
    targetLayerId: string;
    /** Handle outer radius in px. Default `5`. */
    handleRadius?: number;
    /** Handle fill colour. Default `0xffffff`. */
    handleFill?: number;
    /** Frame border + handle outline colour. Default `0x6b7fff`. */
    frameColor?: number;
    /** Dash pattern `[dashLength, gapLength]` in px. Default `[5, 4]`. */
    dashArray?: readonly [number, number];
    /** Gap between host silhouette and the dashed frame. Default `4`. */
    framePadding?: number;
    /** Minimum width / height / radius the behaviour allows during drag. Default `20`. */
    minSize?: number;
}
declare class NodeResizeBehaviour extends Behaviour {
    readonly kind = "node-resize";
    private layer;
    private ctxRef;
    private canvasEl;
    private prevCursor;
    private state;
    private subs;
    private readonly opts;
    /** Node ids that currently have a selection-frame decoration mounted. */
    private readonly mountedNodes;
    constructor(opts: NodeResizeBehaviourOptions);
    protected onRegister(ctx: CanvasContext): void;
    protected onDestroy(): void;
    protected onEnable(): void;
    protected onDisable(): void;
    /**
     * Returns the write-target a drag on this node would use, or `null` when
     * the node isn't resizable. A group with `userResizable: true` always
     * writes to `style.group.*`; a non-group with `style.resizable: true`
     * writes to `style.shape.*`.
     */
    private resizeTarget;
    private refreshAllFrames;
    private mountFrameFor;
    private clearFrameFor;
    private clearAllFrames;
    private readonly onCanvasPointerDown;
    private findHandleHit;
    private startDrag;
    private endDrag;
    private readonly onWindowPointerMove;
    private readonly onWindowPointerUp;
    /**
     * Apply the new geometry to the store. Branch on `target`:
     *
     * - `target === 'group'` — write to `style.group.width / height / radius`.
     *   Position is updated for rect drags only when `autoFit !== true` (the
     *   layer derives the position from the children bbox when auto-fit is on,
     *   so writing it would either be redundant or fight the recompute).
     * - `target === 'shape'` — write to `style.shape.width / height / radius`.
     *   Position is updated for rect drags so the opposite anchor stays put.
     *
     * Either way the store replaces `style` wholesale on update (see
     * `feedback_updatenode_replaces_style`), so the spread preserves every
     * other field.
     */
    private commit;
    /** Record the whole gesture as one undoable `'resize'` entry, start → final. */
    private journalResize;
}

/**
 * `LabelCollisionBehaviour` — hides overlapping node / edge labels via a
 * greedy priority-sorted sweep so dense graphs stay legible.
 *
 * Strategy: each pass collects the world-space AABB of every label **inside the
 * current viewport** (off-screen labels are skipped — they're culled and unseen),
 * sorts that set by `priority` (configurable resolver — `priority` field on the
 * style, node-degree, or a custom callback), and walks high-to-low. A label is
 * **shown** if its AABB doesn't overlap any label already shown in the same
 * `collisionGroup`; otherwise it's hidden for this frame. Overlap is tested
 * against an **rbush spatial index** per group (an already-shown label is
 * inserted into its group's index), so the pass is `O(n log n)` rather than the
 * `O(n²)` of a pairwise scan — the difference between smooth and janky pan/zoom
 * on dense graphs. Labels with `forceShow: true` skip the check entirely (use
 * for hovered / selected elements).
 *
 * Default groups partition node labels and edge labels — a node label never
 * loses to an edge label of higher priority.
 *
 * The behaviour reruns on every store flush (data churn) and on every
 * `camera:zoom` / `camera:pan` event (viewport churn). A small hysteresis
 * timer keeps just-flipped labels from immediately flipping back when zoom
 * leaves them right on the overlap boundary.
 *
 * Default `enabled: false` — register, then explicitly enable. Matches the
 * project rule that no behaviour auto-activates.
 *
 * @example
 * ```ts
 * canvas.behaviours.register(
 *   new LabelCollisionBehaviour({
 *     id: 'label-collision',
 *     targetLayerId: 'graph',
 *     enabled: true,
 *     prioritise: 'node-degree',
 *   }),
 * );
 * ```
 */

/** What the behaviour does with an overlap. `'hide'` is the only strategy in v0. */
type LabelCollisionStrategy = 'hide';
/** How label priority is resolved when sorting. */
type LabelPriorityResolver = 'priority-field' | 'node-degree' | ((kind: 'node' | 'edge', id: string) => number);
interface LabelCollisionBehaviourOptions extends BehaviourOptions {
    /** Required — the `GraphLayer` id this behaviour drives. */
    targetLayerId: string;
    /** Default `'hide'`. */
    strategy?: LabelCollisionStrategy;
    /** Default `'priority-field'`. Falls back to node-degree when undefined. */
    prioritise?: LabelPriorityResolver;
    /**
     * Hysteresis: a just-hidden label stays hidden for at least this many ms
     * before it can re-appear, and vice versa. Stops flicker when zoom is
     * right at an overlap boundary. Default `100`.
     */
    flickerGuardMs?: number;
    /**
     * Default `'nodes'` for node labels, `'edges'` for edge labels. Set to a
     * custom mapping if you want different partitioning (e.g. all in one
     * group so edges can win priority against nodes).
     */
    groups?: {
        nodes?: string;
        edges?: string;
    };
}
declare class LabelCollisionBehaviour extends Behaviour {
    readonly kind = "label-collision";
    private layer;
    /** Camera — read for the visible world bounds each pass (viewport-scoping). */
    private camera;
    private opts;
    /** Last-flip timestamp per label id (perf.now()). */
    private readonly lastFlip;
    /** Last visibility decision per label id. */
    private readonly lastVisible;
    /** Subscription disposers, called in onDestroy. */
    private subs;
    /** Coalesce repeated triggers within a single frame. */
    private scheduled;
    /** `performance.now()` of the last pass — throttles passes during a gesture. */
    private lastRunAt;
    /** Pending trailing-edge pass (settle), or `null`. */
    private trailingTimer;
    constructor(opts: LabelCollisionBehaviourOptions);
    protected onRegister(ctx: CanvasContext): void;
    protected onDestroy(): void;
    protected onEnable(): void;
    protected onDisable(): void;
    /**
     * Throttle passes during a gesture: run on the leading edge, then at most once
     * per {@link COLLISION_THROTTLE_MS} while events keep streaming, with a
     * guaranteed trailing pass after they stop (settle). Off a gesture (a lone
     * flush / the first event) this runs immediately.
     */
    private schedule;
    /** Coalesce a single pass into a microtask; stamps `lastRunAt`. */
    private runSoon;
    /**
     * Collect the in-viewport labels, sort by priority, and greedy-hide overlaps
     * within each `collisionGroup` using a per-group rbush index. Mutates label
     * `gfx.visible` via `setDecorationVisible`; doesn't touch decoration state
     * otherwise.
     */
    private runPass;
    private priorityFor;
    private degreeOf;
}

/**
 * `TextResolutionLODBehaviour` — re-rasterise label glyphs at higher
 * resolution as the camera zooms in, so text stays crisp instead of
 * sampling-blurry when the user inspects nodes up close.
 *
 * **Why this is tier-based, not step-based.** Pixi rasterises each `Text`
 * to a glyph texture exactly once (default resolution = renderer DPR).
 * When the world is scaled 5×, that texture is upsampled 5× — fuzzy.
 * Re-rasterising fixes the fuzziness but regenerates every label's
 * texture on the GPU, which is the expensive part. With a few thousand
 * labels (e.g. the H-1B pack story) a re-raster is a multi-hundred-ms
 * frame pause — perceptible as a stutter mid-zoom.
 *
 * An earlier design snapped the zoom to a step (e.g. `step: 0.5`) and
 * re-rastered at every snap boundary — so a continuous zoom from 1× to
 * 6× crossed ~10 boundaries and dropped frames at each one. This design
 * uses **discrete tiers**: a few widely-spaced minZoom thresholds, with
 * a multiplier per tier. In a typical zoom-in-and-stay session the user
 * crosses one boundary, pays one re-raster, and the rest is GPU-cheap.
 *
 * **Hysteresis** keeps boundary scrolls (1.49 → 1.51 → 1.49) from
 * flickering between tiers. After crossing UP into tier N, the behaviour
 * only reverts to tier N-1 when zoom drops below
 * `levels[N].minZoom - hysteresis`.
 *
 * Default `enabled: false` — register, then explicitly enable. Matches
 * the project rule that no behaviour auto-activates.
 *
 * @example
 * ```ts
 * canvas.behaviours.register(
 *   new TextResolutionLODBehaviour({
 *     id: 'label-resolution',
 *     targetLayerId: 'graph',
 *     enabled: true,
 *     // Defaults: 1× DPR by default, jump to 4× DPR once zoom > 1.5.
 *     // Override for more or fewer tiers.
 *     levels: [
 *       { minZoom: 0,   multiplier: 1 },
 *       { minZoom: 1.5, multiplier: 4 },
 *       { minZoom: 5,   multiplier: 8 },
 *     ],
 *   }),
 * );
 * ```
 */

/** One discrete LOD tier. Highest `minZoom` ≤ current zoom wins. */
interface TextResolutionLODTier {
    /** Camera zoom (`canvas.camera.scale`) at which this tier becomes active. */
    minZoom: number;
    /** Multiplier applied to `baseResolution` while this tier is active. */
    multiplier: number;
}
interface TextResolutionLODBehaviourOptions extends BehaviourOptions {
    /** Required — the `GraphLayer` id this behaviour drives. */
    targetLayerId: string;
    /**
     * Base resolution to multiply by the active tier's multiplier. Default
     * `window.devicePixelRatio` (≈ 1 on standard displays, 2 on retina). Set
     * this if your Canvas was initialised with a custom `resolution` option.
     */
    baseResolution?: number;
    /**
     * Discrete zoom tiers, evaluated as a step function. Each tier names a
     * `minZoom` at which it activates and a `multiplier` applied to
     * `baseResolution` while it's active. Order doesn't matter — the
     * behaviour sorts by `minZoom` internally.
     *
     * Pick *few, widely-spaced* tiers: every additional tier means another
     * GPU re-raster of every label during a typical zoom-in pass. Default:
     * `[{ minZoom: 0, multiplier: 1 }, { minZoom: 1.5, multiplier: 4 }]` —
     * one threshold, one re-raster.
     */
    levels?: TextResolutionLODTier[];
    /**
     * Hysteresis applied to *downward* tier changes. After crossing UP into
     * tier N at `levels[N].minZoom`, the behaviour only reverts to tier N-1
     * once zoom drops below `levels[N].minZoom - hysteresis`. Prevents
     * flicker when the user dithers on a threshold. Default `0.1`.
     */
    hysteresis?: number;
}
declare class TextResolutionLODBehaviour extends Behaviour<TextResolutionLODBehaviourOptions> {
    readonly kind = "label-resolution-lod";
    private layer;
    private subs;
    /** Base resolution multiplied by the active tier's multiplier. */
    private get baseResolution();
    /** Tiers sorted ascending by `minZoom`, guaranteed to cover zoom 0. */
    private get levels();
    private get hysteresis();
    /**
     * Index into `opts.levels` of the currently active tier. Re-evaluated
     * on every camera-zoom event; the renderer is only nudged when this
     * index actually changes, so a continuous zoom inside one tier costs
     * nothing past the cheap comparison below.
     */
    private currentTierIdx;
    /** Last resolution actually pushed to the renderer. */
    private lastPushed;
    constructor(opts: TextResolutionLODBehaviourOptions);
    protected onRegister(ctx: CanvasContext): void;
    protected onDestroy(): void;
    protected onEnable(): void;
    protected onDisable(): void;
    /**
     * A live `levels` / `baseResolution` / `hysteresis` change must re-evaluate
     * the active tier and re-push the resolution. Drop the memo (`lastPushed`)
     * and reset the tier index so {@link apply} climbs the (possibly reshaped)
     * tier list from scratch instead of early-returning on an unchanged index.
     */
    protected onOptionsChanged(): void;
    /**
     * Re-evaluate the active tier under the current camera zoom and push the
     * tier's resolution to the renderer only when the tier index changes.
     * Continuous zoom inside one tier is a constant-time no-op past the
     * `idx === currentTierIdx` check below.
     */
    private apply;
}

/**
 * `NodeScaleLODBehaviour` — keep `GraphLayer` node bodies (and their
 * outline strokes) at a fixed screen-pixel size across camera zoom.
 *
 * Two modes, per layer config:
 * - **Uniform** (default) — every node is driven to the same `sizePx` screen
 *   size. Simple and legible, but flattens per-node sizing.
 * - **Relative** (`preserveRelativeSize: true`) — each node keeps its *resolved*
 *   size (e.g. from `NodeCentralityBehaviour`, so hubs stay bigger than leaves)
 *   and is only made **zoom-invariant**. This composes with centrality sizing
 *   instead of overriding it.
 *
 * Concrete subclass of `ElementScaleLODBehaviour` — that base owns the
 * RAF coalescing, `camera:zoom` subscription, and enable/disable
 * lifecycle. This class only knows how to rescale graph nodes.
 *
 * ## How it works (transform-scale fast path)
 *
 * On enable (and on `reflow()` after a GUI knob moves), the behaviour
 * does **one** expensive O(N) pass: it rewrites every node's spec so
 * the geometric values (`radius`, `width`, `height`, `stroke.width`)
 * carry the target-pixel sizes as if they were world units. Then per
 * `camera:zoom` it does the cheap pass: a single
 * `renderer.scaleShape(id, 1 / cameraScale)` per node, which just writes
 * the gfx transform — no `Graphics.clear()`, no path retrace, no spec
 * mutation. That collapses thousands of geometry rebuilds per zoom
 * frame into thousands of transform writes (~50× cheaper).
 *
 * Stroke width travels along the transform (Pixi strokes are in local
 * units), so the stroke is pixel-constant by construction. There is no
 * way to opt the stroke out of the transform while keeping the body in
 * — the two are coupled by the single scale factor.
 *
 * Pair with {@link EdgeScaleLODBehaviour} when you also want pixel-constant
 * edge strokes. They're independent behaviours; their RAF callbacks
 * batch into the same animation frame, so registering both has the same
 * per-frame cost as one monolith doing both passes.
 *
 * Supports `circle` and `rect` node shapes. `arc`-shape nodes are
 * skipped — their geometry is in `innerR` / `outerR` / sweep angles and
 * doesn't map cleanly to a single screen-px input.
 *
 * Hosts with `setDecoration` decorations or attached badges are also
 * supported, but those auxiliary visuals are **not** re-anchored on
 * each zoom — the underlying `scaleShape` fast path skips the
 * decoration / badge refresh that `updateShape` performs. Acceptable
 * for halos/glows (still centred on the host); inappropriate for
 * placement-sensitive badges. Use `updateShape` directly in that case.
 *
 * @example
 * ```ts
 * import { NodeScaleLODBehaviour } from '@invana/graph';
 *
 * canvas.behaviours.register(
 *   new NodeScaleLODBehaviour({
 *     id: 'node-scale-lod',
 *     enabled: true,
 *     layers: [
 *       {
 *         targetLayerId: 'graph',
 *         sizePx: 6,          // node diameter in screen px
 *         strokeWidthPx: 1,   // outline width in screen px (omit to leave in world units)
 *       },
 *     ],
 *   }),
 * );
 * ```
 */

/** Per-`GraphLayer` config — one entry per layer this behaviour rescales. */
interface NodeScaleLODConfig {
    /** Required — the `GraphLayer` whose nodes are rescaled. */
    targetLayerId: string;
    /**
     * Target body size in screen px for nodes that don't carry a per-node
     * `data.size` override. Falls back to the layer's `nodeDefaults.size`
     * when omitted. Accepts a static number or a getter — getters re-read
     * on every reflow so GUI sliders update live.
     */
    sizePx?: NumberOrGetter;
    /**
     * Target outline width in screen px. When omitted, the layer's
     * `nodeDefaults.strokeWidth` (or each node's `data.strokeWidth`) is
     * reinterpreted as the implicit pixel target — the transform-scale
     * fast path always pins both body and stroke together, so the stroke
     * is pixel-constant even without an explicit value here. Setting an
     * explicit value just changes what that pixel target is.
     */
    strokeWidthPx?: NumberOrGetter;
    /**
     * **Preserve relative sizes.** By default this behaviour drives every node
     * to a *uniform* `sizePx` screen size, which flattens any per-node sizing
     * (e.g. from `NodeCentralityBehaviour`). Set this `true` to instead keep each
     * node's *resolved* (natural) size — hubs stay bigger than leaves — and only
     * make it **zoom-invariant** (constant screen size across camera scale). So
     * it composes with centrality sizing instead of overriding it. `sizePx` /
     * `strokeWidthPx` are ignored in this mode. Default `false`.
     */
    preserveRelativeSize?: boolean;
}
interface NodeScaleLODBehaviourOptions extends ElementScaleLODBehaviourOptions {
    /** One config per `GraphLayer` to drive. */
    layers: NodeScaleLODConfig[];
}
declare class NodeScaleLODBehaviour extends ElementScaleLODBehaviour<NodeScaleLODBehaviourOptions> {
    readonly kind = "node-size-lod";
    /** Live-read from `_options` so `setOptions` applies; `onOptionsChanged` reflows. */
    private get configs();
    private resolved;
    /**
     * Pending reanchor timer. The per-frame `scaleShape` fast path is cheap
     * (transform writes only), but `reanchorAllConnectors` rebuilds every
     * connector's Pixi geometry — at thousands of edges that drops fps to
     * the floor under a continuous zoom gesture. Coalesce to a single
     * trailing-edge call.
     */
    private reanchorTimer;
    constructor(opts: NodeScaleLODBehaviourOptions);
    /**
     * Re-write the baseline and re-apply the transform when a live option patch
     * lands (e.g. a `sizePx` / `strokeWidthPx` slider), so the change shows
     * without waiting for the next zoom. `reflow()` is overridden here to
     * `writeBaseline('target')` first.
     */
    protected onOptionsChanged(): void;
    protected onResolveTargets(ctx: CanvasContext): void;
    protected onReleaseTargets(): void;
    /**
     * Per-frame fast path. Sets `gfx.scale = 1 / cameraScale` on every node
     * via the renderer's transform fast path — no geometry rebuild. The
     * spec was pre-set to "target-px values treated as world units" by
     * {@link writeBaseline} at enable / reflow time, so:
     *
     *     on-screen = nativeWorldSize × cameraScale × gfxScale
     *               = (sizePx / 1)    × cameraScale × (1 / cameraScale)
     *               = sizePx ✓
     *
     * Stroke width scales with the body (Pixi's stroke is in local units)
     * — which is precisely the pixel-constant intent.
     */
    protected apply(rawScale: number): void;
    private scheduleReanchor;
    private flushReanchor;
    protected onEnable(): void;
    protected onDisable(): void;
    reflow(): void;
    /**
     * One-shot O(N) pass that rewrites every node's spec via
     * `renderer.updateShape`. Two flavours:
     *
     * - `'target'` — write the LOD-on baseline: `radius = sizePx / 2`,
     *   `stroke.width = strokeWidthPx`. The per-frame `gfx.scale = 1 / cs`
     *   then collapses the world-unit values back to pixel-constant.
     * - `'worldUnit'` — restore the LOD-off baseline: `radius = (data.size
     *   ?? defaults.size) / 2`, `stroke.width = data.strokeWidth ??
     *   defaults.strokeWidth`. Matches what `GraphLayer.nodeSpec` would
     *   write for a fresh `addShape`.
     *
     * Expensive (each `updateShape` rebuilds the underlying Pixi geometry)
     * — only call on transitions (enable / disable / slider change), not
     * per frame.
     */
    private writeBaseline;
    private writeLayerBaseline;
}

/**
 * `EdgeScaleLODBehaviour` — keep `GraphLayer` connector stroke widths at
 * a fixed screen-pixel width across camera zoom.
 *
 * Concrete subclass of `ElementScaleLODBehaviour`. Pair with
 * {@link NodeScaleLODBehaviour} when you also want pixel-constant nodes
 * (typical for map-overlay use cases — at city zoom a `strokeWidth: 0.6`
 * becomes a 150-px slab without this behaviour).
 *
 * Uses `PrimitivesRenderer.setConnectorStroke` (not `updateConnector`)
 * to patch the stroke spec and redraw on the cached path. Crucially,
 * this skips `recomputeConnectorPath`, which would iterate every shape
 * in the renderer to build an obstacle list — `O(edges × shapes)` per
 * reflow and lethal during continuous zoom. The path doesn't depend on
 * camera scale, so re-routing on a stroke-only change is wasted work.
 *
 * @example
 * ```ts
 * import { EdgeScaleLODBehaviour } from '@invana/graph';
 *
 * canvas.behaviours.register(
 *   new EdgeScaleLODBehaviour({
 *     id: 'edge-scale-lod',
 *     enabled: true,
 *     layers: [{ targetLayerId: 'graph', strokeWidthPx: 0.6 }],
 *   }),
 * );
 * ```
 */

/** Per-`GraphLayer` config — one entry per layer this behaviour rescales. */
interface EdgeScaleLODConfig {
    /** Required — the `GraphLayer` whose edges are rescaled. */
    targetLayerId: string;
    /**
     * Target stroke width in screen px for edges that don't carry a
     * per-edge `data.strokeWidth` override. Falls back to the layer's
     * `edgeDefaults.strokeWidth`. Accepts a static number or a getter
     * (`() => settings.targetEdgePx`).
     */
    strokeWidthPx?: NumberOrGetter;
}
interface EdgeScaleLODBehaviourOptions extends ElementScaleLODBehaviourOptions {
    /** One config per `GraphLayer` to drive. */
    layers: EdgeScaleLODConfig[];
}
declare class EdgeScaleLODBehaviour extends ElementScaleLODBehaviour<EdgeScaleLODBehaviourOptions> {
    readonly kind = "edge-size-lod";
    /** Live-read from `_options` so `setOptions` applies; `onOptionsChanged` reflows. */
    private get configs();
    private resolved;
    constructor(opts: EdgeScaleLODBehaviourOptions);
    /**
     * Re-apply the stroke scaling at the current camera scale when a live option
     * patch lands (e.g. a `strokeWidthPx` slider), so the change shows without
     * waiting for the next zoom.
     */
    protected onOptionsChanged(): void;
    protected onResolveTargets(ctx: CanvasContext): void;
    protected onReleaseTargets(): void;
    /**
     * Per-zoom-frame apply: write the screen-px / world-px ratio to every
     * managed edge as a render-time stroke multiplier. The renderer's draw
     * pipeline reads `inst.strokeWidthScale` and multiplies it into the
     * spec's `stroke.width` at draw time, so state-config strokes (e.g.
     * `active: { strokeWidth: 1.5 }`) are interpreted in the same screen-px
     * unit the layer's "live" strokes are interpreted in — no LOD-loss
     * across a `GraphLayer.rerenderEdge` rebuild, and no inversion of the
     * caller's intent.
     *
     * The strokeWidthPx config field is unused under this model — every
     * spec width is treated as the target screen-px. Kept on the type for
     * back-compat; a future revision may remove it.
     */
    protected apply(rawScale: number): void;
}

/**
 * `ParallelEdgeBehaviour` — fans edges that share the same `(source, target)`
 * pair so they don't overlap. Cross-edge coordination that belongs above the
 * per-edge connector pipeline (anchor → router → pathStyle), since each
 * pipeline stage sees only one edge in isolation.
 *
 * Layer-scoped: constructed with a `targetLayerId` referencing a
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
 *     targetLayerId: 'graph',
 *     enabled: true,
 *     spacing: 12,
 *   }),
 * );
 * ```
 */

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
type ParallelEdgeBasis = 'auto' | 'perpendicular' | 'axis-aligned';
/** A bucket of edges that share endpoints and should be fanned together. */
interface ParallelEdgeGroup {
    /** Source node id shared by every edge in this group. */
    readonly sourceId: string;
    /** Target node id shared by every edge in this group. */
    readonly targetId: string;
    /** Geometric centre of the source node (renderer ref or store position). */
    readonly sourceCenter: Vec2$1;
    /** Geometric centre of the target node. */
    readonly targetCenter: Vec2$1;
    /**
     * Edges in this group, in store iteration order. Distribution policies
     * decide which edge gets which rank — the default centres the group so
     * `edges[i]` receives rank `k = i - (N-1)/2`.
     */
    readonly edges: ReadonlyArray<GraphEdge>;
}
/** Patch a distribution policy emits for one edge in the group. */
interface ParallelEdgePatch {
    /** Edge id this patch applies to. */
    readonly edgeId: string;
    /** New `sourceAnchorOpts`. Merged onto the edge's existing shape. */
    readonly sourceAnchorOpts?: Readonly<Record<string, unknown>>;
    /** New `targetAnchorOpts`. */
    readonly targetAnchorOpts?: Readonly<Record<string, unknown>>;
    /** New `waypoints`. Pass an empty array to clear. */
    readonly waypoints?: ReadonlyArray<{
        readonly x: number;
        readonly y: number;
    }>;
}
/** Settings the behaviour passes through to a distribution policy. */
interface ParallelEdgeDistributeContext {
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
type ParallelEdgeDistribute = (group: ParallelEdgeGroup, ctx: ParallelEdgeDistributeContext) => ReadonlyArray<ParallelEdgePatch>;
/** Constructor options for {@link ParallelEdgeBehaviour}. */
interface ParallelEdgeBehaviourOptions extends BehaviourOptions {
    /** Required — the `GraphLayer` id this behaviour drives. */
    targetLayerId: string;
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
interface ResolvedOptions$2 {
    spacing: number;
    basis: ParallelEdgeBasis;
    anchorOffset: boolean;
    groupBy: (edge: GraphEdge) => string | null;
    distribute: ParallelEdgeDistribute;
}
/**
 * Default distribution policy — centres `N` ranks around zero, then for each
 * edge writes one midpoint waypoint plus (optionally) port-anchor offsets.
 *
 * Exported so callers can compose it (e.g. wrap with a filter) or call
 * directly when implementing a custom variant that wants to reuse the
 * default geometry for some edges.
 */
declare const centeredRanksPolicy: ParallelEdgeDistribute;
declare class ParallelEdgeBehaviour extends Behaviour {
    readonly kind = "parallel-edge";
    /** Bound target layer — resolved in `onRegister`. */
    private layer;
    private opts;
    /** Subscription disposers, called in `onDestroy`. */
    private subs;
    /** Re-entrancy guard: `true` while writing patches to the store. */
    private patching;
    constructor(opts: ParallelEdgeBehaviourOptions);
    protected onRegister(ctx: CanvasContext): void;
    protected onDestroy(): void;
    protected onEnable(): void;
    /** Read-only snapshot of resolved options. */
    get options(): Readonly<ResolvedOptions$2>;
    /** Runtime option update. Re-runs the distribution immediately if enabled. */
    setOptions(patch: Partial<ParallelEdgeBehaviourOptions>): void;
    /**
     * Force a recompute pass. Useful after bulk mutations performed inside a
     * `store.batch()` that callers want to flush through the behaviour
     * immediately.
     */
    recompute(): void;
}

/**
 * `FisheyeBehaviour` — a focus+context magnifier lens over a `GraphLayer`.
 *
 * Nodes within `radius` screen pixels of the lens centre are drawn pushed apart
 * (Sarkar–Brown distortion, see {@link fisheyeDisplace}) and enlarged toward the
 * centre, with their labels forced visible — so a dense region can be read in
 * place while everything outside the lens, and the region's relation to it,
 * stays where it is. Modelled on G6's Fisheye plugin.
 *
 * **Display-only.** The lens never writes the store: it drives the renderer's
 * `setShapeDisplayOverride`, which layers the displacement on top of each node's
 * logical position and LOD scale. Layouts, history, export and collaboration
 * never see it, a running force layout keeps ticking underneath it, and
 * connectors + picking follow the *drawn* node (edges stay glued, clicks land on
 * what you see). A raster export taken while the lens is up does capture it.
 *
 * **Input.**
 * - `trigger: 'pointermove'` (default) — the lens follows the cursor and hides
 *   when the cursor leaves the canvas.
 * - `trigger: 'click'` — a click places the lens; it stays until the next click.
 * - `trigger: 'drag'` — a click places it; dragging from inside the lens moves it
 *   (claims the gesture, so drag-pan yields).
 * - `radiusWheelModifier` (default `alt`) / `distortionWheelModifier` (default
 *   `shift`) + wheel, with the cursor inside the lens, grow/shrink the radius /
 *   distortion (scroll up = bigger / stronger). The wheel event is caught in the
 *   capture phase so the camera does not zoom as well; a plain wheel still does.
 *   On macOS a trackpad pinch arrives as `ctrl`+wheel, so `'ctrl'` as a modifier
 *   would hijack pinch-zoom inside the lens.
 *
 * While another behaviour owns the pointer gesture (node drag, lasso, brush) the
 * lens steps aside — overrides cleared, ring hidden — and returns on release, so
 * a magnified node can never feed its drawn offset into drag maths.
 *
 * Expanded group frames are skipped (their geometry is derived from members);
 * collapsed groups distort like ordinary nodes.
 *
 * @example
 * ```ts
 * canvas.behaviours.register(
 *   new FisheyeBehaviour({ id: 'fisheye', targetLayerId: 'graph', enabled: true, radius: 140 }),
 * );
 * ```
 */

/** How the lens is moved. */
type FisheyeTrigger = 'pointermove' | 'click' | 'drag';
/** A keyboard modifier that turns the wheel into a lens adjustment. */
type FisheyeWheelModifier = 'alt' | 'shift' | 'ctrl' | 'meta';
/** Constructor options for {@link FisheyeBehaviour}. Flat and JSON-serialisable. */
interface FisheyeBehaviourOptions extends BehaviourOptions {
    /** Required — the `GraphLayer` id whose nodes the lens distorts. */
    targetLayerId: string;
    /** How the lens moves. Default `'pointermove'`. */
    trigger?: FisheyeTrigger;
    /** Lens radius in **screen pixels** (same apparent size at any zoom). Default `120`. */
    radius?: number;
    /** Lower clamp for {@link radius}. Default `20`. */
    minRadius?: number;
    /** Upper clamp for {@link radius}; `null` = half the canvas's shorter side. Default `null`. */
    maxRadius?: number | null;
    /** Distortion factor `d` — `0` = none, larger spreads the focus more. Default `1.5`. */
    distortion?: number;
    /** Lower clamp for {@link distortion}. Default `0`. */
    minDistortion?: number;
    /** Upper clamp for {@link distortion}. Default `5`. */
    maxDistortion?: number;
    /** Node size multiplier at the lens centre, easing to `1` at the rim. `1` = no enlargement. Default `1.5`. */
    nodeScale?: number;
    /** Force labels visible for nodes inside the lens (beats text LOD and label collision). Default `true`. */
    showLabels?: boolean;
    /** Modifier that makes the wheel adjust the radius; `null` disables. Default `'alt'`. */
    radiusWheelModifier?: FisheyeWheelModifier | null;
    /** Modifier that makes the wheel adjust the distortion; `null` disables. Default `'shift'`. */
    distortionWheelModifier?: FisheyeWheelModifier | null;
    /** Lens ring colour. Default `0x64748b`. */
    lensStrokeColor?: number;
    /** Lens ring width in screen pixels. Default `2`. */
    lensStrokeWidth?: number;
    /** Lens disc fill colour. Default `0x94a3b8`. */
    lensFillColor?: number;
    /** Lens disc fill alpha (`0` = no fill). Default `0.08`. */
    lensFillAlpha?: number;
}
/** {@link FisheyeBehaviourOptions} with every default applied. */
interface ResolvedFisheyeOptions {
    trigger: FisheyeTrigger;
    radius: number;
    minRadius: number;
    maxRadius: number | null;
    distortion: number;
    minDistortion: number;
    maxDistortion: number;
    nodeScale: number;
    showLabels: boolean;
    radiusWheelModifier: FisheyeWheelModifier | null;
    distortionWheelModifier: FisheyeWheelModifier | null;
    lensStrokeColor: number;
    lensStrokeWidth: number;
    lensFillColor: number;
    lensFillAlpha: number;
}
declare class FisheyeBehaviour extends Behaviour<FisheyeBehaviourOptions> {
    readonly kind = "fisheye";
    private opts;
    private layer;
    private overlay;
    /** Lens centre in canvas-relative screen px, or `null` when there is no lens. */
    private focus;
    /** Overrides currently applied, by node id — diffed against each new frame. */
    private applied;
    /** Reused buffer for {@link GraphStore.nodeIdsWithin}. */
    private readonly candidates;
    /** Per-node group role, cached between data changes (style resolution isn't free). */
    private readonly skipCache;
    /** Press position for click detection, or `null` when no press is in flight. */
    private press;
    /** `true` while this behaviour is dragging the lens (`trigger: 'drag'`). */
    private draggingLens;
    private rafId;
    private readonly disposers;
    constructor(opts: FisheyeBehaviourOptions);
    /** Advisory gesture ids for the registry's conflict warnings. */
    private static shortcutsFor;
    protected onRegister(ctx: CanvasContext): void;
    protected onEnable(): void;
    protected onDisable(): void;
    protected onDestroy(): void;
    /** Read-only snapshot of the resolved options. */
    get options(): Readonly<ResolvedFisheyeOptions>;
    /**
     * Place the lens at a canvas-relative screen point (`null` removes it) — the
     * programmatic twin of a click, for hosts that drive the lens themselves.
     */
    setFocus(point: {
        x: number;
        y: number;
    } | null): void;
    /** Include the serialisable lens options in a canvas-state snapshot. */
    serializeDefinition(): Record<string, unknown>;
    /** Live option update (settings editor, `canvas.update`). */
    protected onOptionsChanged(changes: Partial<FisheyeBehaviourOptions>): void;
    /** Canvas-relative screen coordinates of a DOM event. */
    private screenFromEvent;
    private insideLens;
    private handlePointerMove;
    private handlePointerLeave;
    private handlePointerDown;
    private handlePointerUp;
    private handleWheel;
    /** Apply a wheel adjustment and record it so `getOptions()` (the editor's seed) stays current. */
    private adjust;
    private halfShortSide;
    private schedule;
    private cancelFrame;
    /** Recompute the lens population and push the diff to the renderer. */
    private update;
    /** Remove every override this lens applied, re-route their edges, hide the ring. */
    private clearLens;
    /** Re-route each connector incident to a touched node once, so edges follow the drawn nodes. */
    private rerouteIncident;
    /** Expanded group frames don't distort — their frame is derived from their members. */
    private isSkipped;
    private drawRing;
}

/**
 * Fisheye distortion maths — pure, renderer-free, shared by `FisheyeBehaviour`.
 *
 * The radial map is Sarkar–Brown's graphical fisheye (as used by G6's Fisheye
 * plugin): a point at distance `dist ≤ r` from the focus moves, along the same
 * ray, to
 *
 * ```
 * dist' = (d + 1) · r · dist / (d · dist + r)
 * ```
 *
 * which maps `[0, r]` onto itself (`0 → 0`, `r → r`) and is monotonic, so the
 * lens has no seam at its rim and never reorders points along a ray. `d = 0` is
 * the identity; larger `d` pushes points near the focus further out, spreading a
 * dense cluster.
 */
/** Where one point is drawn under the lens, relative to where it really is. */
interface FisheyeDisplacement {
    /** World-space offset from the logical position. */
    readonly dx: number;
    /** World-space offset from the logical position. */
    readonly dy: number;
    /** Size multiplier: `nodeScale` at the focus, easing linearly to `1` at the rim. */
    readonly scale: number;
}
/**
 * Displace the point `(px, py)` under a fisheye lens focused at `(fx, fy)`.
 *
 * @param r          lens radius (world units). Points farther than `r` are untouched.
 * @param d          distortion factor, `≥ 0`. `0` = no displacement.
 * @param nodeScale  size multiplier at the focus; `1` = no enlargement.
 * @returns the displacement, or `null` when the point lies outside the lens.
 */
declare function fisheyeDisplace(px: number, py: number, fx: number, fy: number, r: number, d: number, nodeScale: number): FisheyeDisplacement | null;

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

/** Scaling curve used to map raw degree → output size. */
type NodeCentralityScale = 'linear' | 'sqrt' | 'log';
/** Constructor options for `NodeCentralityBehaviour`. */
interface NodeCentralityBehaviourOptions extends BehaviourOptions {
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
interface ResolvedOptions$1 {
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
declare class NodeCentralityBehaviour extends Behaviour {
    readonly kind = "degree-size";
    /** Bound target layer — resolved in `onRegister`. */
    private layer;
    private opts;
    /** Subscription disposers, called in `onDestroy`. */
    private readonly subs;
    /**
     * Snapshot of each touched node's prior `style.size` **and**
     * `style.labelFontSize`, captured on the first write to that node. A field
     * being `undefined` means the node had none before — restore by writing
     * `undefined`. Cleared on `disable` / `destroy`.
     */
    private readonly prior;
    /** Microtask debounce flag — coalesces bursts of store events. */
    private recomputeScheduled;
    /** Re-entrancy guard — set while writing patches so our own emits no-op. */
    private patching;
    constructor(opts: NodeCentralityBehaviourOptions);
    protected onRegister(ctx: CanvasContext): void;
    protected onEnable(): void;
    protected onDisable(): void;
    protected onDestroy(): void;
    /** Read-only snapshot of resolved options. */
    get options(): Readonly<ResolvedOptions$1>;
    /**
     * Runtime option update. Re-runs `applyAll()` immediately if enabled so
     * GUI slider changes are visible without an extra call.
     */
    setOptions(patch: Partial<NodeCentralityBehaviourOptions>): void;
    /**
     * Force a recompute + write pass. Useful after a bulk `store.batch()`
     * the caller wants reflected immediately (the microtask-debounced
     * subscription would otherwise fire on the next tick).
     */
    recompute(): void;
    private scheduleRecompute;
    /**
     * Compute degree for every node, map to size, and write back via
     * `store.updateNode` (merged with the prior `style` per the
     * `updateNode replaces style wholesale` contract).
     *
     * Nodes touched here have their original `style.size` captured into
     * `this.prior` on first write so `revertAll()` can restore them.
     */
    private applyAll;
    /**
     * Weighted degree — the SUM of the configured edge weight over a node's
     * incident edges in `direction`. O(edges-of-node); the whole pass is O(E).
     */
    private weightedDegree;
    /**
     * One edge's weight: `weightBy` fn wins; else `data[weightKey]` (a non-numeric
     * / missing value counts as `0`). Only called when weighting is configured.
     */
    private weightOf;
    /**
     * Restore each touched node's prior `style.size` + `style.labelFontSize` and
     * clear the snapshot. A field that was `undefined` before is dropped again.
     */
    private revertAll;
}

/**
 * `ContentLODBehaviour` — abstract base for the zoom-visibility LOD family
 * (`NodeLabelLODBehaviour`, `EdgeLabelLODBehaviour`, `IconLODBehaviour`,
 * `ImageLODBehaviour`).
 *
 * Each concrete subclass gates **one** content kind by a single camera-zoom band
 * (`{ minZoom, maxZoom }`): when the camera leaves the band the content is hidden;
 * when it re-enters, shown. The engine renderer stays ignorant of zoom — it only
 * exposes generic per-element toggles (`setShapeTextVisible`,
 * `setConnectorTextVisible`, …); the subclass picks which, and which element set
 * ({@link ContentLODTarget}) it sweeps. This base owns the *policy*: react to
 * `input:camera:zoom` (RAF-coalesced), sweep only on a threshold **crossing**,
 * re-apply to new elements on `data:changed`, and restore on disable.
 *
 * Splitting per content kind (rather than one behaviour with several bands) lets
 * each be enabled and tuned independently — node labels and edge labels in
 * particular get separate panels.
 *
 * **One per layer and kind.** Each subclass is the only writer of its content
 * channel, so two instances of one kind on one layer would overwrite each
 * other's sweeps (and, for the label kinds, each other's size policy). A second
 * one throws at registration; put the band and the size options on one instance.
 */

/** A zoom band. Content is shown when `minZoom ≤ camera.scale ≤ maxZoom`. */
interface ZoomBand {
    /** Show at/above this camera scale. Omit (or `null`) for "no lower bound". */
    readonly minZoom?: number | null;
    /** Show at/below this camera scale. Omit (or `null`) for "no upper bound". */
    readonly maxZoom?: number | null;
}
/** Constructor options shared by every content-LOD behaviour. */
interface ContentLODBehaviourOptions extends BehaviourOptions, ZoomBand {
    /** Required — the `GraphLayer` id this behaviour drives. */
    targetLayerId: string;
}
/** Which element set a content-LOD sweep visits. */
type ContentLODTarget = 'nodes' | 'edges';
/** The renderer subset the concrete subclasses toggle against. */
type ContentRenderer = NonNullable<ReturnType<GraphLayer['getRenderer']>>;
declare abstract class ContentLODBehaviour<TOptions extends ContentLODBehaviourOptions = ContentLODBehaviourOptions> extends Behaviour<TOptions> {
    /** Registry kind — also the key of the one-per-layer claim. */
    abstract readonly kind: string;
    /** Bound target layer — resolved in `onRegister`. */
    protected layer: GraphLayer | null;
    /**
     * The element set this behaviour's band sweeps. `'nodes'` unless a subclass
     * gates edge content (`EdgeLabelLODBehaviour`).
     */
    protected readonly contentTarget: ContentLODTarget;
    /** The active zoom band, live-read from `_options` so `setOptions` applies. */
    private get band();
    /** Subscription disposers, called in `onDestroy`. */
    private readonly subs;
    /**
     * Last-applied visibility. `undefined` = not yet applied. The zoom path only
     * sweeps when the desired value differs, so a non-crossing zoom does no work.
     */
    private applied;
    /** RAF-coalescing handle. `null` when no apply is scheduled. */
    private rafHandle;
    /** A pending scheduled apply must re-sweep every node (new nodes / (re-)enable). */
    private pendingFull;
    constructor(opts: TOptions);
    /**
     * Show / hide this behaviour's content kind on one element (a node or an
     * edge, per {@link contentTarget}). Subclasses route to the matching renderer
     * toggle (`setShapeTextVisible` / `setConnectorTextVisible` / `…Icon…` / …).
     */
    protected abstract setContentVisible(renderer: ContentRenderer, id: string, visible: boolean): void;
    /**
     * Override hook — elements whose content stays visible **even when the band
     * would hide it** (e.g. always-show the most central nodes' labels). Default:
     * no exemptions. Consulted only while the band is hiding, so it never
     * over-hides.
     */
    protected isExempt(_id: string): boolean;
    /**
     * Override hook — recompute the exemption set. Called before every **full**
     * sweep (data change / enable / `setOptions`), so an exemption derived from
     * topology (degree centrality) stays current, while zoom-only reflows skip it.
     */
    protected refreshExemptions(): void;
    /**
     * Override hook — runs on every **full** reconcile (register / enable / data
     * change / option change), after {@link refreshExemptions}. For a subclass that
     * also pushes layer-wide config to the renderer (a label-size policy): the
     * renderer may not exist at register time, and a data change can mean a
     * remounted one, so re-pushing here keeps it current. Default no-op.
     */
    protected onFullReconcile(): void;
    protected onRegister(ctx: CanvasContext): void;
    protected onDestroy(): void;
    /**
     * Take this kind's slot on `layer`, or throw when another live instance of the
     * same kind already holds it. Runs before any subscription, so a rejected
     * instance leaves nothing wired.
     */
    private claimLayer;
    /** Give the slot back — only if this instance is the one holding it. */
    private releaseLayer;
    protected onEnable(): void;
    protected onDisable(): void;
    /**
     * A live option patch (band, exemption knobs) re-applies with a full sweep.
     * `enabled` is handled by the base `setOptions` before this runs.
     */
    protected onOptionsChanged(): void;
    private schedule;
    private cancel;
    /**
     * Reconcile visibility to the current camera scale. When `full`, sweep every
     * node regardless of change (covers new nodes / re-enable); otherwise sweep
     * only when the band membership flipped (the zoom hot path).
     */
    private apply;
    /**
     * Set this behaviour's content visibility across every node (or edge, per
     * {@link contentTarget}) in the layer. When the band shows content, everything
     * is shown; when it hides, exempt elements ({@link isExempt}) stay visible.
     */
    private sweep;
}

/**
 * The on-screen label-size options shared by `NodeLabelLODBehaviour` and
 * `EdgeLabelLODBehaviour`, and their translation into the renderer's
 * `LabelSizePolicy`.
 */

/**
 * How big a label reads **on screen** as the camera zooms. All three are
 * optional and unset changes nothing — the label keeps the size its host gives
 * it today. Sizes are CSS pixels; a label's authored `labelFontSize` is its
 * on-screen size at camera zoom `1`.
 */
interface LabelSizeOptions {
    /**
     * How on-screen size follows camera zoom: `fontSize × zoom ^ zoomGrowth`.
     * `1` grows with the world, `0.5` with its square root, `0` keeps each
     * label's own font size on screen (relative sizes between labels survive).
     * Clamped to `[0, 1]`. Omit (or `null`) to keep the size the node gives the
     * label — world-scaled, or pixel-constant under `NodeScaleLODBehaviour`.
     */
    zoomGrowth?: number | null;
    /**
     * Smallest on-screen font size in CSS px — keeps zoomed-out labels readable.
     * Omit, `null` or `≤ 0` for no floor.
     */
    minFontPx?: number | null;
    /**
     * Largest on-screen font size in CSS px — stops labels ballooning when zoomed
     * in. Omit, `null` or `≤ 0` for no cap (a 0 px cap would collapse every label).
     */
    maxFontPx?: number | null;
}

/**
 * `NodeLabelLODBehaviour` — node labels across camera zoom: **when** they show
 * (a zoom band) and **how big** they read on screen (a size policy).
 *
 * - **Visibility.** Below / above the band the text is dropped (pixi's priciest
 *   primitive), so a crowded overview stays fast; it returns inside the band.
 *   This covers a simple node's `'label'` decoration *and* the internal text of
 *   composite nodes (a `CompositeShape`'s `label` parts).
 * - **Keep the important labels.** {@link NodeLabelLODBehaviourOptions.alwaysShowTop}
 *   exempts the most **central** nodes so their labels persist even at overview
 *   zoom — a **fraction** (top-N %), not an absolute edge count, so it adapts
 *   across sparse and dense graphs.
 * - **Size.** {@link LabelSizeOptions} cap, floor or damp how big a label reads
 *   on screen (`maxFontPx: 20` stops labels ballooning when you zoom into a
 *   cluster). Applies to the `'label'` decoration only — composite card text
 *   always scales with its card. Unset, label size is exactly as today.
 *
 * Edge labels have their own behaviour, `EdgeLabelLODBehaviour`, so node and
 * edge labels are tuned separately. Crispness is `TextResolutionLODBehaviour`'s
 * job; overlap is `LabelCollisionBehaviour`'s. Opt-in, off the per-frame render
 * path (see {@link ContentLODBehaviour}).
 *
 * @example
 * ```ts
 * canvas.behaviours.register(
 *   new NodeLabelLODBehaviour({
 *     id: 'node-labels',
 *     targetLayerId: 'graph',
 *     enabled: true,
 *     minZoom: 0.6,        // hide labels below 0.6× …
 *     alwaysShowTop: 0.05, // … except the top 5% most-connected nodes
 *     minFontPx: 10,       // never smaller than 10px on screen
 *     maxFontPx: 20,       // never bigger than 20px on screen
 *   }),
 * );
 * ```
 */

/** Constructor options for {@link NodeLabelLODBehaviour}. */
interface NodeLabelLODBehaviourOptions extends ContentLODBehaviourOptions, LabelSizeOptions {
    /**
     * Keep labels shown for the most **central** nodes even when the zoom band
     * hides the rest — a **fraction** in `(0, 1]` by degree centrality (in + out
     * edges). `0.1` keeps the top 10%. Relative, not an absolute edge count, so it
     * adapts across graphs of different densities. Omit / `0` to gate all text
     * uniformly.
     */
    alwaysShowTop?: number;
}
declare class NodeLabelLODBehaviour extends ContentLODBehaviour<NodeLabelLODBehaviourOptions> {
    readonly kind = "node-label-lod";
    /** Node ids currently exempt from hiding (the top-centrality set). */
    private readonly exemptIds;
    constructor(opts: NodeLabelLODBehaviourOptions);
    protected setContentVisible(renderer: ContentRenderer, id: string, visible: boolean): void;
    protected isExempt(id: string): boolean;
    /**
     * Recompute the top-centrality exemption set: rank every node by degree
     * (in + out) and keep the top `alwaysShowTop` fraction. O(n log n), but only
     * runs on a full reflow (data change / enable / option change), never per zoom.
     */
    protected refreshExemptions(): void;
    /** Push the node-label size policy (or clear it when no size option is set). */
    protected onFullReconcile(): void;
    protected onDisable(): void;
    protected onDestroy(): void;
}

/**
 * `EdgeLabelLODBehaviour` — edge labels across camera zoom: **when** they show
 * (a zoom band) and **how big** they read on screen (a size policy). The edge
 * twin of `NodeLabelLODBehaviour`, tuned separately — edge labels usually
 * appear later and stay smaller than node labels.
 *
 * - **Visibility.** Outside the band the edge's `'label'` decoration is hidden;
 *   it returns inside it. Only the text-LOD channel is touched, so
 *   `LabelCollisionBehaviour` keeps deciding overlaps independently.
 * - **Size.** {@link LabelSizeOptions} cap, floor or damp how big a label reads
 *   on screen. A label stays centred on its path point; its style offset scales
 *   with it. Unset, label size is exactly as today (it grows with the world).
 *
 * Opt-in, off the per-frame render path (see {@link ContentLODBehaviour}).
 *
 * @example
 * ```ts
 * canvas.behaviours.register(
 *   new EdgeLabelLODBehaviour({
 *     id: 'edge-labels',
 *     targetLayerId: 'graph',
 *     enabled: true,
 *     minZoom: 1.2,  // hidden at overview, shown once you zoom in
 *     zoomGrowth: 0, // then a fixed on-screen size (each label's own font size)
 *   }),
 * );
 * ```
 */

/** Constructor options for {@link EdgeLabelLODBehaviour}. */
interface EdgeLabelLODBehaviourOptions extends ContentLODBehaviourOptions, LabelSizeOptions {
}
declare class EdgeLabelLODBehaviour extends ContentLODBehaviour<EdgeLabelLODBehaviourOptions> {
    readonly kind = "edge-label-lod";
    protected readonly contentTarget: ContentLODTarget;
    constructor(opts: EdgeLabelLODBehaviourOptions);
    protected setContentVisible(renderer: ContentRenderer, id: string, visible: boolean): void;
    /** Push the edge-label size policy (or clear it when no size option is set). */
    protected onFullReconcile(): void;
    protected onDisable(): void;
    protected onDestroy(): void;
}

/**
 * `IconLODBehaviour` — shows / hides node **inset icons** (`glyph` / `svg` /
 * `svg-url`) by camera zoom. Below the band the icons are dropped (a pure
 * `.visible` flip — no repaint), keeping a crowded overview fast; they return as
 * you zoom in.
 *
 * Sits in the node-content LOD family alongside `NodeLabelLODBehaviour` /
 * `ImageLODBehaviour`; opt-in, off the per-frame render path (see
 * {@link ContentLODBehaviour}).
 *
 * @example
 * ```ts
 * canvas.behaviours.register(
 *   new IconLODBehaviour({ id: 'icon-lod', targetLayerId: 'graph', enabled: true, minZoom: 1 }),
 * );
 * ```
 */

/** Constructor options for {@link IconLODBehaviour}. */
type IconLODBehaviourOptions = ContentLODBehaviourOptions;
declare class IconLODBehaviour extends ContentLODBehaviour {
    readonly kind = "icon-lod";
    protected setContentVisible(renderer: ContentRenderer, id: string, visible: boolean): void;
}

/**
 * `ImageLODBehaviour` — shows / hides node **silhouette `image` fills** by camera
 * zoom. Below the band the image is dropped; because an image is painted *into*
 * the body (not a separate child), hiding it repaints the body with the image
 * layer stripped — done only on a threshold crossing, not per frame.
 *
 * Sits in the node-content LOD family alongside `NodeLabelLODBehaviour` /
 * `IconLODBehaviour`; opt-in, off the per-frame render path (see
 * {@link ContentLODBehaviour}).
 *
 * @example
 * ```ts
 * canvas.behaviours.register(
 *   new ImageLODBehaviour({ id: 'image-lod', targetLayerId: 'graph', enabled: true, minZoom: 2.5 }),
 * );
 * ```
 */

/** Constructor options for {@link ImageLODBehaviour}. */
type ImageLODBehaviourOptions = ContentLODBehaviourOptions;
declare class ImageLODBehaviour extends ContentLODBehaviour {
    readonly kind = "image-lod";
    protected setContentVisible(renderer: ContentRenderer, id: string, visible: boolean): void;
}

/**
 * `EdgeLODBehaviour` — **thin edges when zoomed out.** Below a camera-zoom
 * threshold the edges of a dense graph merge into a sub-pixel blob, yet the
 * renderer still draws every one of them (the per-frame `layers` cost on a
 * hairball). This behaviour hides all but a `keepFraction` of them below the
 * threshold and restores them above it — so the zoomed-out view costs a fraction
 * to draw while the zoomed-in view is untouched.
 *
 * It reuses the store's explicit **edge-hidden** flag (`hideEdges` / `showEdges`),
 * so thinned edges drop out of *both* the render pass and the hit index — and it
 * therefore composes with the viewport culler (hidden edges leave the index, so
 * the culler ignores them; no fight over `renderable`). It only ever un-hides
 * edges *it* hid, so a user's manual edge-hides are preserved.
 *
 * Phase 2 (C) of `docs/large-graph-performance-plan.md` — the lever for the
 * fully **zoomed-out** hairball, where viewport culling buys nothing. Opt-in,
 * off the per-frame path (reacts to `input:camera:zoom`, RAF-coalesced).
 *
 * @example
 * ```ts
 * canvas.behaviours.register(
 *   new EdgeLODBehaviour({
 *     id: 'edge-lod', targetLayerId: 'graph', enabled: true,
 *     minZoom: 0.5,        // below 0.5× zoom, thin…
 *     keepFraction: 0.1,   // …keep the top 10% of edges
 *     keepBy: 'degree',    // …chosen as the high-degree backbone
 *   }),
 * );
 * ```
 */

/** How the kept (never-thinned) edges are chosen. */
type EdgeLODKeepBy = 'sample' | 'weight' | 'degree';
/** Constructor options for {@link EdgeLODBehaviour}. */
interface EdgeLODBehaviourOptions extends BehaviourOptions {
    /** Required — the `GraphLayer` id this behaviour drives. */
    targetLayerId: string;
    /** Thin edges when `camera.scale` is below this. Default `0.5`. */
    minZoom?: number;
    /** Fraction of edges kept visible when thinned, in `(0, 1]`. Default `0.1`. */
    keepFraction?: number;
    /**
     * Which edges to keep: `'sample'` (a stable pseudo-random subset — preserves
     * the overall density texture; default), `'weight'` (highest {@link weightKey}),
     * or `'degree'` (between the highest-degree endpoints — the structural backbone).
     */
    keepBy?: EdgeLODKeepBy;
    /** Numeric edge-`data` field used when `keepBy: 'weight'`. */
    weightKey?: string;
}
interface ResolvedOptions {
    minZoom: number;
    keepFraction: number;
    keepBy: EdgeLODKeepBy;
    weightKey: string | undefined;
}
declare class EdgeLODBehaviour extends Behaviour {
    readonly kind = "edge-lod";
    /** Bound target layer — resolved in `onRegister`. */
    private layer;
    private opts;
    /** Subscription disposers, called in `onDestroy`. */
    private readonly subs;
    /** Edges eligible to be hidden when thinned (everything outside the kept set). */
    private readonly thinnable;
    /** Edges *we* hid (weren't already user-hidden) — so restore only touches ours. */
    private readonly hiddenByUs;
    /** Last-applied thinned state. `undefined` = not yet applied. */
    private applied;
    /** RAF-coalescing handle. */
    private rafHandle;
    /** A pending scheduled apply must recompute the thinnable set (data / (re-)enable). */
    private pendingFull;
    constructor(opts: EdgeLODBehaviourOptions);
    protected onRegister(ctx: CanvasContext): void;
    protected onDestroy(): void;
    protected onEnable(): void;
    protected onDisable(): void;
    /** Read-only snapshot of resolved options. */
    get options(): Readonly<ResolvedOptions>;
    /** Runtime option update — re-applies immediately (a full pass) if enabled. */
    setOptions(patch: Partial<EdgeLODBehaviourOptions>): void;
    private schedule;
    private cancel;
    private apply;
    /** Recompute the thinnable set — every edge outside the top `keepFraction`. */
    private computeThinnable;
    private weightOf;
    /** Hide the thinnable edges we don't already find hidden (recording which). */
    private hide;
    /** Un-hide only the edges we hid (leaving any user-hidden edges alone). */
    private show;
}

/**
 * `ThemeBehaviour` — the **single source of truth** for the canvas theme.
 *
 * It is the *only* place in the codebase that reads the host's appearance —
 * `prefers-color-scheme` in `'system'` mode, the document's `data-theme` in
 * `'document'` mode — and the *only* publisher of the engine's theme signal.
 * On enable (and on every relevant change) it resolves the active {@link Theme} +
 * {@link ThemeMode} down to the engine's `ResolvedTheme` and calls
 * `ctx.theme.set(...)`, which stores it and emits `'theme:change'`. Theme-aware layers — `BackgroundLayer`,
 * `MiniMapLayer`, `GraphLayer` — subscribe and recolour themselves; this
 * behaviour paints nothing directly.
 *
 * Two ways to drive it:
 *
 * 1. **Named palette themes** (the rich path). Supply `mode` + `active`; the
 *    resolved palette recolours background, nodes, edges, labels and group
 *    frames across the whole canvas. The active name is matched (loosely) to the
 *    host app's theme family via {@link themeFamily}; an unknown name falls back
 *    to `fallback` (default `'default'`).
 *
 * 2. **Single-layer shorthand** (eases migration of imperative stories). Set
 *    `targetLayerId` + flat `light` / `dark` option patches; on each resolved
 *    kind the matching patch is pushed to that one layer via `setOptions`. The
 *    published `ResolvedTheme` carries an **empty palette** in this mode, so the
 *    shorthand colours win and no role-based recolour fights them.
 *
 * Behaviours never auto-enable — register **and** enable it explicitly.
 *
 * `mode: 'document'` is the third way in: instead of a host pushing patches, the
 * behaviour *reads* the page's own theme — the `data-theme` attribute (or a
 * `light`/`dark` class) on `<html>`, which is what the design-kit switchers and
 * `@invana/styling`'s `applyTheme()` write — and re-publishes on every change.
 * Both halves travel: the kind from the variant's suffix and the family from its
 * prefix (when that family is a registered theme). Prefer `CanvasThemeSync` in a
 * React app, where the provider's context is the more direct signal; reach for
 * `'document'` in imperative hosts (a story, a plain-DOM embed) that have no
 * React context to read.
 *
 * @example Named theme, following the OS until the host drives it:
 * ```ts
 * canvas.behaviours.register(new ThemeBehaviour({ id: 'theme' }));
 * canvas.update({ behaviours: { theme: { enabled: true, mode: 'system', active: 'default' } } });
 * // later, from a host theme switch:
 * canvas.update({ behaviours: { theme: { active: 'forest', mode: 'dark' } } });
 * ```
 *
 * @example Following the host page's theme picker (`<html data-theme="ocean-dark">`):
 * ```ts
 * canvas.behaviours.register(new ThemeBehaviour({ id: 'theme' }));
 * canvas.update({ behaviours: { theme: { enabled: true, mode: 'document', accent: 'css-var' } } });
 * // no further calls — family + kind track the attribute, accent tracks the CSS var
 * ```
 *
 * @example Single-layer shorthand (background only), OS-following:
 * ```ts
 * canvas.behaviours.register(new ThemeBehaviour({ id: 'theme', targetLayerId: 'bg' }));
 * canvas.update({ behaviours: { theme: {
 *   enabled: true, mode: 'system',
 *   light: { backgroundColor: '#f8fafc', color: '#94a3b8' },
 *   dark:  { backgroundColor: '#0f172a', color: '#475569' },
 * } } });
 * ```
 */

/** Construction options for {@link ThemeBehaviour}. */
interface ThemeBehaviourOptions extends BehaviourOptions {
    /** Consumer themes, merged over the built-ins (`default/forest/ocean/gold/rose/minimal`). */
    themes?: ThemeRegistry;
    /** Active theme name. Default `fallback`. Matched to the host theme family. */
    active?: string;
    /** Theme used when `active` isn't found. Default `'default'`. */
    fallback?: string;
    /**
     * `'system'` (default) follows `prefers-color-scheme`; `'document'` follows the
     * host page's `data-theme` / `light`-`dark` class on `<html>` (family **and**
     * kind); `'light'`/`'dark'` pin the kind.
     */
    mode?: ThemeMode;
    /**
     * Source for the `accent` role. `'css-var'` reads {@link accentVar} live off
     * the document root; a `number` pins it. Omit to use the theme's own accent.
     */
    accent?: 'css-var' | number;
    /** CSS custom property read when `accent: 'css-var'`. Default `'--color-primary'`. */
    accentVar?: string;
    /** Single-layer shorthand: patch pushed to {@link targetLayerId} in light mode. */
    light?: Record<string, unknown>;
    /** Single-layer shorthand: patch pushed to {@link targetLayerId} in dark mode. */
    dark?: Record<string, unknown>;
}
/** Subset of options that can be patched live via `setOptions`. */
type ThemePatch = Partial<Pick<ThemeBehaviourOptions, 'themes' | 'active' | 'fallback' | 'mode' | 'accent' | 'accentVar' | 'light' | 'dark'>>;
declare class ThemeBehaviour extends Behaviour<ThemeBehaviourOptions> {
    readonly kind = "theme";
    private themes;
    private active;
    private fallback;
    private mode;
    private accent?;
    private accentVar;
    private light?;
    private dark?;
    private mediaQuery;
    private mediaListener;
    /** Armed only in `'document'` mode — watches `<html>`'s theme attributes. */
    private documentObserver;
    constructor(opts: ThemeBehaviourOptions);
    protected onRegister(_ctx: CanvasContext): void;
    protected onEnable(): void;
    protected onDisable(): void;
    protected onDestroy(): void;
    /** Patch options and re-publish (when enabled). */
    setOptions(patch: ThemePatch): void;
    /** Switch mode. Re-publishes immediately when enabled. */
    setMode(mode: ThemeMode): void;
    /** Switch the active theme by name. Re-publishes immediately when enabled. */
    setTheme(name: string): void;
    getMode(): ThemeMode;
    /**
     * The **pinned** theme name (the option), not the resolved one — in
     * `'document'` mode the page's family may win. Read the published
     * `ResolvedTheme.name` for what is actually on screen.
     */
    getActiveName(): string;
    /** Concrete kind currently resolved from {@link mode}. */
    getResolvedKind(): ThemeKind;
    /** Resolve + publish the theme onto `ctx.theme` (emits `'theme:change'`). */
    private apply;
    /** Resolve the live accent colour, if configured. */
    private resolveAccent;
    /**
     * SSR-safe kind resolution. `'system'` consults the media query, `'document'`
     * the host page, `'light'`/`'dark'` answer themselves.
     */
    private resolveKind;
    /**
     * Read the host page's active theme variant off `<html>`. Two sources, in
     * order: the `data-theme` attribute (`"ocean-dark"` → family `ocean`, kind
     * `dark` — the shape `@invana/styling`'s `applyTheme()` writes), then a bare
     * `dark` class for hosts that only toggle that. SSR-safe: `'light'` with no
     * family when there's no document.
     *
     * The family is returned raw; {@link resolveActiveName} decides whether it's a
     * theme this engine knows.
     */
    private readDocumentVariant;
    /**
     * The theme name to resolve the palette from. Normally the pinned `active`; in
     * `'document'` mode the page's own family wins **when this engine has a theme
     * by that name** — so a host on `ocean` recolours the canvas to `ocean`, while
     * a host family with no engine counterpart (`tailwind`, `vite`) leaves `active`
     * in charge rather than falling through to `fallback`.
     */
    private resolveActiveName;
    /**
     * Arm exactly the listener the current {@link mode} needs and disarm the other:
     * the media query in `'system'`, the document observer in `'document'`, neither
     * when the kind is pinned. Idempotent — safe to call on every `setOptions`.
     */
    private wireSources;
    /** Drop both listeners (disable / destroy). */
    private detachSources;
    /**
     * Observe the host page's theme attributes while in `'document'` mode. Scoped
     * to `<html>`'s `class` + `data-theme` (`attributeFilter`) so an unrelated DOM
     * mutation can't cost a republish, and `subtree: false` — the variant lives on
     * the root element only.
     */
    private wireDocumentObserver;
    private detachDocumentObserver;
    /** Arm the `prefers-color-scheme` listener while in `'system'` mode. */
    private wireMediaQuery;
    private detachMediaQuery;
}

/**
 * `EntranceBehaviour` — the graph *arrives* instead of appearing.
 *
 * A canvas whose nodes are placed by a layout has no first frame worth
 * watching: the scene is empty, then it is complete. This behaviour fades each
 * element in once, with a per-item delay, so the diagram lands in an order you
 * chose — left-to-right for a flow, top-down for a tree — rather than all at
 * once.
 *
 * ### What it writes
 *
 * Per-item `style.effects` entries: `'fade-in'` on nodes, `'fade-in-connector'`
 * on edges (the renderer's two one-shot opacity effects). Each carries its own
 * `delayMs`, which is the whole mechanism — one fade is a flash, a hundred
 * staggered fades is an entrance. When the sweep is over the behaviour
 * **removes** the effects again, so a transient animation never settles into
 * exported state.
 *
 * This is ordinary styling: the effects go through `GraphStore.updateNode` and
 * are projected by `GraphLayer.syncNodeEffects` like any other declared style.
 * Nothing here talks to the renderer.
 *
 * ### When it plays
 *
 * Once, on the first frame the scene is worth showing:
 *
 * - with an `activeLayout`, when that layout reports `layout:run:end`
 *   (`'settled'`) — the moment the nodes are where they belong, and the same
 *   signal the engine's auto-fit waits for;
 * - with no layout, on the first data the layer receives.
 *
 * Enabling the behaviour while a layout is still pending does **not** play it
 * early: a sweep ordered by position is meaningless before anything has a
 * position, and it would be over before the graph arrived.
 *
 * Re-layouts, data updates and theme changes never replay it: an entrance that
 * fires twice is an animation tax, not a welcome. Disable and re-enable (or
 * call {@link EntranceBehaviour.replay}) to see it again.
 *
 * Default `enabled: false` — register, then explicitly enable (root rule 7).
 *
 * ### Known gap
 *
 * A node's **badge** is its own shape instance, not a child of the node's
 * container, so a host-alpha effect does not cascade to it: a badged node fades
 * in while its badge is already opaque.
 *
 * @example
 * ```ts
 * canvas.behaviours.register(
 *   new EntranceBehaviour({ id: 'entrance', targetLayerId: 'graph', enabled: true }),
 * );
 * ```
 */

/** Which axis the sweep runs along. `'none'` fades everything together. */
type EntranceOrder = 'x' | 'y' | 'none';
interface EntranceBehaviourOptions extends BehaviourOptions {
    /** Required — the `GraphLayer` id this behaviour animates. */
    targetLayerId: string;
    /** Fade length per item, in ms. Default `320`. */
    durationMs?: number;
    /**
     * Delay added per item along {@link EntranceBehaviourOptions.order}, in ms.
     * `0` fades everything together. Default `24`.
     */
    staggerMs?: number;
    /**
     * Ceiling on the whole sweep, in ms. With many items the per-item step is
     * compressed to fit, so a 2,000-node graph doesn't take a minute to arrive.
     * Default `600`.
     */
    maxStaggerMs?: number;
    /**
     * Sweep direction. `'x'` reads left-to-right (right for a `direction: 'RIGHT'`
     * layout), `'y'` top-down, `'none'` disables the stagger. Default `'x'`.
     */
    order?: EntranceOrder;
    /**
     * Fade edges as well, each one behind the later of its two endpoints so a
     * connector never arrives before the things it connects. Default `true`.
     */
    includeEdges?: boolean;
    /** Named easing — serialisable, so it rides the config bag. Default `'easeOutCubic'`. */
    easing?: EasingName;
}
/** Every option with its default filled in — what {@link EntranceBehaviour.getResolvedOptions} returns. */
interface ResolvedEntranceOptions {
    durationMs: number;
    staggerMs: number;
    maxStaggerMs: number;
    order: EntranceOrder;
    includeEdges: boolean;
    easing: EasingName;
}
declare class EntranceBehaviour extends Behaviour<EntranceBehaviourOptions> {
    readonly kind = "entrance";
    private layer;
    private opts;
    private readonly subs;
    /** Ids currently carrying an effect this behaviour wrote — what {@link clear} undoes. */
    private readonly painted;
    private cleanupTimer;
    private played;
    /**
     * `true` once the active layout has reported a settled run. Gates
     * {@link onEnable}: before it, the nodes have no meaningful positions, so a
     * position-ordered sweep would be noise.
     */
    private layoutSettled;
    constructor(opts: EntranceBehaviourOptions);
    protected onRegister(ctx: CanvasContext): void;
    protected onEnable(): void;
    protected onDisable(): void;
    protected onDestroy(): void;
    protected onOptionsChanged(patch: Partial<EntranceBehaviourOptions>): void;
    /** The fully-resolved option set in use, every default filled in. */
    getResolvedOptions(): Readonly<ResolvedEntranceOptions>;
    /**
     * Play the entrance again — the escape hatch for a "preview" button in a
     * settings panel, and for a consumer who re-seeds a canvas with new data and
     * wants it to arrive rather than cut.
     */
    replay(): void;
    /** Write one staggered fade per element. Once per enable; a no-op when empty. */
    private play;
    /**
     * Per-item delay, by rank along the chosen axis.
     *
     * The step is `staggerMs`, compressed so the whole sweep fits inside
     * `maxStaggerMs` — the difference between a 10-node graph (which should feel
     * like a sweep) and a 2,000-node one (which should not feel like a wait).
     */
    private buildDelays;
    /** Remove every effect this behaviour wrote, leaving any others in place. */
    private clear;
}

/**
 * The six built-in {@link Theme} families, each with full light + dark variants.
 * Authored once here; the {@link ThemeBehaviour} merges any consumer-supplied
 * themes over these. Colours are concrete `0xRRGGBB` numbers — resolved straight
 * to the renderer with no string parsing.
 */

declare const DEFAULT_THEME: Theme;
declare const FOREST_THEME: Theme;
declare const OCEAN_THEME: Theme;
declare const GOLD_THEME: Theme;
declare const ROSE_THEME: Theme;
declare const MINIMAL_THEME: Theme;
/** All built-in themes, keyed by name. Consumer themes merge over these. */
declare const BUILT_IN_THEMES: ThemeRegistry;

/**
 * Accent resolution — pull the host app's live primary colour off a CSS custom
 * property so the canvas accent role tracks the design-kit theme.
 */
/**
 * Parse a CSS colour string into a `0xRRGGBB` number. Handles `#rgb`, `#rrggbb`,
 * and `rgb()/rgba()` forms (alpha dropped). Returns `undefined` for anything it
 * can't read so callers fall back to the palette's own accent.
 */
declare function cssColorToNumber(input: string | null | undefined): number | undefined;
/**
 * Read a CSS custom property (default `--color-primary`) off the document root
 * and parse it to a number. SSR-safe (`undefined` when there's no `document`).
 */
declare function resolveAccentVar(varName?: string): number | undefined;

/**
 * Map a host app theme id (`@invana/themes`) onto a canvas {@link Theme} family
 * name. The app theme and the canvas theme are linked only by a loose name
 * match — strip the light/dark mode token from either end and what's left is
 * the family (`'forest'`, `'ocean'`, `'default'`).
 *
 * @example
 * themeFamily('default-dark') // 'default'
 * themeFamily('dark-forest')  // 'forest'
 * themeFamily('ocean-light')  // 'ocean'
 * themeFamily(undefined)      // 'default'
 */
declare function themeFamily(themeId: string | null | undefined): string;

/**
 * Default **role → style** mappings the {@link GraphLayer} applies when a theme
 * is published. This is the *base* recolour that keeps the whole graph in sync
 * with the active palette even before any per-type styling template is set
 * (Phase B layers role-based per-type styling on top of this).
 *
 * Every mapping reads from a string-keyed palette (the engine's
 * `ResolvedTheme.palette`) and emits **only the fields whose role is present**,
 * so the single-layer `{ light, dark }` shorthand — which publishes an empty
 * palette — produces empty patches and changes nothing.
 */

/** A resolved role → number palette (string keys; roles may be absent). */
type RolePalette = Readonly<Record<string, number>>;

/**
 * Resolve a dotted data path (`'data.name'`, `'type'`, `'data.profile.title'`)
 * against a graph node, for slot → value binding. Returns `undefined` for a
 * missing path; the caller decides the fallback (usually an empty string).
 */

/** Read a dotted path off a node. The path is rooted at the node object, so
 * `'type'` reads `node.type` and `'data.name'` reads `node.data.name`. */
declare function resolvePath(node: GraphNode, path: string): unknown;
/** Resolve a path to a display string (`''` when missing/nullish). */
declare function resolveText(node: GraphNode, path: string | undefined): string;

/**
 * Compile a {@link NodeStructureTemplate} + {@link NodeStylingTemplate} +
 * bindings + a node's data + the active palette into a concrete `NodeStyle`
 * fragment the {@link GraphLayer} merges into the node's resolved style.
 *
 * - **simple** → label text/colour/typography + shape + fill/stroke fields.
 * - **card** → a `composite` shape (`CompositeShapeOption`) with parts laid out
 *   by a small auto-layout pass, plus `bgStrokeWidth: 0` so the layer's base
 *   node border doesn't double up on the card frame.
 *
 * Every colour role is resolved to a number here (or falls back to a direct
 * colour, then to a neutral) — nothing role-shaped escapes to the renderer.
 */

/**
 * Substitute `{}` / `{dotted.path}` tokens against a record.
 *
 * One rule, used by every template string — a badge's label and a card text
 * element — so `'{}%'` and `'L{data.lineRange.0}–{data.lineRange.1}'` are the
 * same feature rather than two syntaxes. A string with no braces passes
 * through untouched, which is what keeps every existing literal working.
 */
declare function interpolate(template: string, node: GraphNode, bound?: unknown): string;
/**
 * Resolve a {@link ValueLookup} against a record: the categorical `map` first,
 * then the numeric `bands`, then `fallback`. `undefined` when nothing matched,
 * so the caller keeps whatever it already had.
 *
 * `fallbackBind` lets a lookup inherit the bind of the thing it sits on (a
 * badge's own `bind`), so the common case names the field once.
 */
declare function resolveLookup<T>(lookup: ValueLookup<T> | undefined, node: GraphNode, fallbackBind?: string): T | undefined;
/**
 * Resolve a template's `size` — a flat number, or a {@link ValueLookup} over a
 * second field. See {@link NodeStylingTemplate.size} for why this composes with
 * a type binding's structure instead of fighting it.
 */
declare function compileSize(size: number | ValueLookup<number> | undefined, node: GraphNode): number | undefined;
/**
 * Compile a styling template's {@link NodeBadgeTemplate} list into the concrete
 * {@link NodeBadge} list for one node — bindings resolved, colours looked up
 * and roles substituted, and every badge whose bound field is absent dropped.
 *
 * Returns `undefined` when the template declares no badges (so the node
 * contributes nothing), and an **empty array** when it declares some and this
 * record matched none.
 */
declare function compileBadges(styling: NodeStylingTemplate | undefined, node: GraphNode, palette: RolePalette): NodeBadge[] | undefined;
/** Compile a simple structure into label + shape + fill/stroke style fields. */
declare function compileSimple(struct: SimpleStructure, styling: NodeStylingTemplate | undefined, bindings: Record<string, string>, node: GraphNode, palette: RolePalette): Partial<NodeStyle>;
/** Compile a card structure into a `composite` shape option with laid-out parts. */
declare function compileCard(struct: CardStructure, styling: NodeStylingTemplate | undefined, bindings: Record<string, string>, node: GraphNode, palette: RolePalette): Partial<NodeStyle>;
/**
 * Compile a {@link FreeformStructure} into a `composite` shape. Element
 * coordinates are already absolute (the designer canvas is 1:1 with the card),
 * so this is a direct map: bind text to data, resolve every colour role against
 * the palette, and emit one {@link CompositePart} per element. Self-contained —
 * no styling/binding template needed.
 */
declare function compileFreeform(struct: FreeformStructure, node: GraphNode, palette: RolePalette): Partial<NodeStyle>;

/**
 * Built-in node structure + styling templates. Consumers can supply their own
 * via `GraphLayerOptions.nodeStructureTemplates` / `nodeStylingTemplates`; these
 * are merged under any same-named overrides so a graph has sensible defaults.
 *
 * Simple structures cover the six shape kinds (each a full label surface); the
 * one built-in card is `idCard` (type tag · divider · avatar + title/subtitle).
 */

/** All built-in structures, keyed by name. */
declare const BUILT_IN_STRUCTURES: NodeStructureRegistry;
/** Built-in stylings paired with the built-in structures (theme-role based). */
declare const BUILT_IN_STYLINGS: NodeStylingRegistry;

/** The card's box + fill / stroke / clip, returned by {@link CompositeCard.build}. */
interface CardFrame {
    width: number;
    height: number;
    fill: number;
    stroke?: {
        color: number;
        width?: number;
        alpha?: number;
    };
    cornerRadius?: number;
    /** Clip parts to the rounded silhouette (edge accents follow the corners). */
    clip?: boolean;
}
/**
 * Base class for the built-in composite **card** node types — the composite
 * counterpart to `ShapeBase<TSpec>` (`RectShape` / `CircleShape` / …). Like a
 * shape, a card is fully driven by a typed **spec**: every knob (width, colours,
 * radii, spacing) lives in `this.spec`, so *editing the spec* changes the card —
 * no subclassing needed for values. Subclass and override the `protected`
 * section methods only when you need to change *structure*.
 *
 * ```ts
 * // configure via the spec (like RectShape)
 * const card = new UserCard({ width: 300, bg: 0x1e293b, nameColor: 0xffffff });
 * node.style.shape = (n) => card.build(n.data as UserCardData);
 *
 * // …or subclass to change structure
 * class MyUser extends UserCard { protected topAccent() {} } // no accent bar
 * ```
 *
 * `spec` fields are mutable — `card.spec.width = 320` re-styles on the next
 * render. Instances are otherwise stateless, so one renders every node of a type.
 */
declare abstract class CompositeCard<TSpec, TData, TOpts = void> {
    /** The card's full, resolved configuration. Mutable — edit to re-style. */
    readonly spec: TSpec;
    constructor(spec: TSpec);
    /** Assemble the ordered {@link CompositePart}s for this card. */
    protected abstract parts(data: TData, opts: TOpts): CompositePart[];
    /** The card box + fill / stroke / clip, given the assembled parts. */
    protected abstract frame(data: TData, parts: readonly CompositePart[], opts: TOpts): CardFrame;
    /** Build the composite spec for one node's data (+ optional per-call opts). */
    build(data: TData, opts?: TOpts): CompositeShapeOption;
}

/**
 * Data shapes consumed by the built-in composite **card** builders. Each is the
 * per-node payload you'd store on `GraphNode.data` and hand to the matching
 * builder (`schemaTableCard(data)` etc.).
 */
/** One field of a {@link SchemaTableData} — a name + a data-type token. */
interface SchemaField {
    name: string;
    /** Data-type token (`string` / `integer` / `number` / `date` / `boolean` / …). */
    type: string;
}
/** Data for {@link schemaTableCard} — a titled, **variable-length** field list. */
interface SchemaTableData {
    label: string;
    /** Optional header icon (iconify id, e.g. `lucide/users`). */
    icon?: string;
    /** Header band colour (default blue). */
    header?: number;
    fields: SchemaField[];
}
/** Data for {@link userCard} — an avatar profile card. */
interface UserCardData {
    name: string;
    role: string;
    /** Avatar initials (e.g. `AL`). */
    initials: string;
    /** Avatar disc + top accent colour. */
    avatar: number;
    status?: 'online' | 'away' | 'offline';
    email?: string;
    phone?: string;
}
/** Data for {@link statCard} — a dashboard KPI tile. */
interface StatCardData {
    label: string;
    value: string;
    delta?: string;
    trend?: 'up' | 'down';
    /** Icon (iconify id) shown in the accent chip. */
    icon?: string;
    /** Accent colour (left bar + icon chip). */
    accent: number;
}
/** A coloured tag chip — shared by {@link TaskCardData} and {@link ProductCardData}. */
interface CardTag {
    label: string;
    color: number;
}
/**
 * @deprecated Use {@link CardTag}. A `{ label, color }` chip is not a task
 * concept; kept as an alias so existing imports keep compiling.
 */
type TaskTag = CardTag;
/** Data for {@link taskCard} — a Kanban-style task card. */
interface TaskCardData {
    title: string;
    priority: 'high' | 'med' | 'low';
    tags?: CardTag[];
    assignee?: {
        initials: string;
        color: number;
    };
    due?: string;
}
/** Data for {@link idCard} — an identity / access badge. */
interface IDCardData {
    name: string;
    /** Job title or role, under the name. */
    title?: string;
    /** The badge number, shown in the footer. */
    idNumber: string;
    /** Issuing organisation, shown in the accent header band. */
    org?: string;
    /** Photo icon (iconify id). Falls back to {@link IDCardData.initials}. */
    photo?: string;
    /** Initials drawn in the photo chip when no `photo` is given. */
    initials?: string;
    /** Expiry note, shown beside the status pill. */
    validUntil?: string;
    status?: 'active' | 'expired' | 'suspended';
    /** Header band + photo chip colour. */
    accent: number;
}
/** Data for {@link organisationCard} — a company / institution card. */
interface OrganisationCardData {
    name: string;
    /** Industry or entity type, shown as a tag under the name. */
    kind?: string;
    /** Logo icon (iconify id). Falls back to {@link OrganisationCardData.monogram}. */
    logo?: string;
    /** One or two letters drawn in the logo chip when no `logo` is given. */
    monogram?: string;
    location?: string;
    /** Headcount, pre-formatted (e.g. `1,200 employees`). */
    headcount?: string;
    /** Founding note, pre-formatted (e.g. `est. 1954`). */
    founded?: string;
    /** Logo chip + tag colour. */
    accent: number;
}
/** Data for {@link productCard} — a catalogue item tile. */
interface ProductCardData {
    title: string;
    /** Pre-formatted price string (e.g. `$149.00`) — no currency maths here. */
    price: string;
    /** Media-band icon (iconify id). */
    icon?: string;
    /** Rating out of 5, rendered beside a star glyph. */
    rating?: number;
    /** Review count shown in parentheses after the rating. */
    reviews?: number;
    tags?: CardTag[];
    stock?: 'in' | 'low' | 'out';
    /** Media band tint + accent colour. */
    accent: number;
}
/** Data for {@link eventCard} — a dated event with venue + attendance. */
interface EventCardData {
    title: string;
    /** Day-of-month for the date chip (e.g. `14`). */
    day: string;
    /** Short month for the date chip (e.g. `SEP`). */
    month: string;
    time?: string;
    venue?: string;
    /** Attendance, pre-formatted (e.g. `128 going`). */
    attendees?: string;
    /** Date chip colour. */
    accent: number;
}

/** Full configuration for a {@link SchemaTableCard} — edit any field to re-style. */
interface SchemaTableCardSpec {
    width: number;
    headerHeight: number;
    rowHeight: number;
    cornerRadius: number;
    padding: number;
    /** Reserved width for the right-aligned data-type column. */
    typeColWidth: number;
    bg: number;
    stroke: number;
    /** Header colour used when a node's `data.header` is unset. */
    headerColor: number;
    titleColor: number;
    nameColor: number;
    typeColor: number;
    /** Row highlight colour + alpha (per-row hover band). */
    rowHoverColor: number;
    rowHoverAlpha: number;
}
/** Default {@link SchemaTableCardSpec}. */
declare const SCHEMA_TABLE_CARD_DEFAULTS: SchemaTableCardSpec;
/** Options for {@link SchemaTableCard.build}. */
interface SchemaTableCardOptions {
    /** Index of the row to highlight — wire from `shape:partover` for per-row hover. */
    hoverRow?: number;
}
/**
 * **ER / schema table** card — a coloured header (optional icon + title) over
 * one row per field (colour-coded type chip + name + data type). Auto-sizes to
 * the field count; each row is an addressable sub-part (`hitId = row index`).
 * Fully configured by {@link SchemaTableCardSpec}; override {@link typeChip} /
 * {@link header} / {@link row} for structural changes.
 */
declare class SchemaTableCard extends CompositeCard<SchemaTableCardSpec, SchemaTableData, SchemaTableCardOptions> {
    constructor(spec?: Partial<SchemaTableCardSpec>);
    /** Colour-coded chip glyph + colour for a field's data type. Override to remap. */
    protected typeChip(type: string): {
        char: string;
        color: number;
    };
    /** Header band (icon + title). */
    protected header(data: SchemaTableData, parts: CompositePart[]): void;
    /** One field row (chip + name + type). */
    protected row(field: {
        name: string;
        type: string;
    }, index: number, active: boolean, parts: CompositePart[]): void;
    protected parts(data: SchemaTableData, opts: SchemaTableCardOptions): CompositePart[];
    protected frame(data: SchemaTableData): CardFrame;
}
/** Convenience builder with the stock spec — `new SchemaTableCard().build(data, opts)`. */
declare function schemaTableCard(data: SchemaTableData, opts?: SchemaTableCardOptions): CompositeShapeOption;

/** Full configuration for a {@link UserCard} — edit any field to re-style. */
interface UserCardSpec {
    width: number;
    padding: number;
    avatarRadius: number;
    contactRowHeight: number;
    cornerRadius: number;
    /** Top accent bar height (0 to hide it). */
    accentHeight: number;
    bg: number;
    stroke: number;
    nameColor: number;
    roleColor: number;
    contactColor: number;
    contactIconColor: number;
}
/** Default {@link UserCardSpec}. */
declare const USER_CARD_DEFAULTS: UserCardSpec;
/**
 * **Profile / user** card — avatar disc (initials) + status dot, name + role, a
 * divider, and up to two Lucide contact rows. A top accent bar (avatar colour)
 * follows the rounded corners via `clip`. Configured by {@link UserCardSpec};
 * override {@link topAccent} / {@link avatar} / {@link identity} /
 * {@link contacts} for structural changes.
 */
declare class UserCard extends CompositeCard<UserCardSpec, UserCardData> {
    constructor(spec?: Partial<UserCardSpec>);
    /** Top accent bar (avatar colour). Set `spec.accentHeight = 0` or override to hide. */
    protected topAccent(data: UserCardData, parts: CompositePart[]): void;
    /** Avatar disc + initials + status dot. */
    protected avatar(data: UserCardData, parts: CompositePart[]): void;
    /** Name + role, beside the avatar. */
    protected identity(data: UserCardData, parts: CompositePart[]): void;
    /** The contact rows this card renders (mail / phone), in order. */
    protected contactRows(data: UserCardData): Array<{
        icon: string;
        text: string;
    }>;
    /** Y of the divider (below the avatar block). */
    protected dividerY(): number;
    /** Contact rows (icon + text) below the divider. */
    protected contacts(data: UserCardData, parts: CompositePart[]): void;
    protected parts(data: UserCardData): CompositePart[];
    protected frame(data: UserCardData): CardFrame;
}
/** Convenience builder with the stock spec — `new UserCard().build(data)`. */
declare function userCard(data: UserCardData): CompositeShapeOption;

/** Full configuration for a {@link StatCard} — edit any field to re-style. */
interface StatCardSpec {
    width: number;
    height: number;
    padding: number;
    cornerRadius: number;
    /** Left accent bar width (0 to hide it). */
    accentWidth: number;
    bg: number;
    stroke: number;
    captionColor: number;
    valueColor: number;
    upColor: number;
    downColor: number;
}
/** Default {@link StatCardSpec}. */
declare const STAT_CARD_DEFAULTS: StatCardSpec;
/**
 * **Stat / KPI** tile — a left accent bar, a caption, an accent-tinted icon
 * chip, a large value, and a coloured trend-delta row. Configured by
 * {@link StatCardSpec}; override {@link accentBar} / {@link caption} /
 * {@link iconChip} / {@link value} / {@link delta} for structural changes.
 */
declare class StatCard extends CompositeCard<StatCardSpec, StatCardData> {
    constructor(spec?: Partial<StatCardSpec>);
    /** Left accent bar (clipped to the card corners). */
    protected accentBar(data: StatCardData, parts: CompositePart[]): void;
    /** Upper-left caption. */
    protected caption(data: StatCardData, parts: CompositePart[]): void;
    /** Accent-tinted icon chip (top-right). */
    protected iconChip(data: StatCardData, parts: CompositePart[]): void;
    /** The big value. */
    protected value(data: StatCardData, parts: CompositePart[]): void;
    /** Trend-delta row (glyph + text). */
    protected delta(data: StatCardData, parts: CompositePart[]): void;
    protected parts(data: StatCardData): CompositePart[];
    protected frame(): CardFrame;
}
/** Convenience builder with the stock spec — `new StatCard().build(data)`. */
declare function statCard(data: StatCardData): CompositeShapeOption;

/** Full configuration for a {@link TaskCard} — edit any field to re-style. */
interface TaskCardSpec {
    width: number;
    height: number;
    padding: number;
    cornerRadius: number;
    /** Bottom accent bar height (0 to hide it). */
    accentHeight: number;
    /**
     * Corner radius of the priority pill and tag chips, in pixels. Half the chip's
     * height reads as a full pill; drop it toward `4` for a squarer tag.
     */
    chipRadius: number;
    bg: number;
    stroke: number;
    titleColor: number;
    /** Colour per priority (pill + accent). */
    priorityColors: Record<TaskCardData['priority'], number>;
    /** Display text per priority. */
    priorityLabels: Record<TaskCardData['priority'], string>;
}
/** Default {@link TaskCardSpec}. */
declare const TASK_CARD_DEFAULTS: TaskCardSpec;
/**
 * **Kanban task** card — a wrapped title, a priority pill + coloured tag chips,
 * a divider, and a footer (assignee avatar + due date). A bottom accent bar
 * (priority colour) follows the rounded corners via `clip`. Configured by
 * {@link TaskCardSpec}; override {@link pill} / {@link title} / {@link tags} /
 * {@link footer} for structural changes.
 */
declare class TaskCard extends CompositeCard<TaskCardSpec, TaskCardData> {
    constructor(spec?: Partial<TaskCardSpec>);
    /**
     * A rounded pill chip. Delegates to the shared {@link chip} builder so every
     * pill in the catalogue measures and centres identically — there used to be
     * two implementations here and they drifted apart.
     */
    protected pill(parts: CompositePart[], x: number, y: number, text: string, color: number): number;
    /** Bottom accent bar (priority colour). */
    protected bottomAccent(data: TaskCardData, parts: CompositePart[]): void;
    /** Title (wraps to 2 lines) + the priority pill top-right. */
    protected title(data: TaskCardData, parts: CompositePart[]): void;
    /** Tag chips, left → right. */
    protected tags(data: TaskCardData, parts: CompositePart[]): void;
    /** Footer: assignee avatar (left) + due date (right). */
    protected footer(data: TaskCardData, footY: number, parts: CompositePart[]): void;
    protected parts(data: TaskCardData): CompositePart[];
    protected frame(): CardFrame;
}
/** Convenience builder with the stock spec — `new TaskCard().build(data)`. */
declare function taskCard(data: TaskCardData): CompositeShapeOption;

/** Full configuration for an {@link IDCard} — edit any field to re-style. */
interface IDCardSpec {
    width: number;
    height: number;
    padding: number;
    cornerRadius: number;
    /** Accent header band height (0 to hide it, and the `org` line with it). */
    headerHeight: number;
    /** Side of the square photo chip. */
    photoSize: number;
    /** Corner radius of the photo chip. */
    photoRadius: number;
    /**
     * Corner radius of the status chip, in pixels. Half the chip's
     * height reads as a full pill; drop it toward `4` for a squarer tag.
     */
    chipRadius: number;
    bg: number;
    stroke: number;
    orgColor: number;
    nameColor: number;
    titleColor: number;
    idColor: number;
    validColor: number;
}
/** Default {@link IDCardSpec}. */
declare const ID_CARD_DEFAULTS: IDCardSpec;
/**
 * **Identity / access badge** card — an accent header band carrying the issuing
 * organisation, a photo chip (icon, or initials when there's no photo) beside
 * the holder's name + title, a divider, then the badge number and a status
 * pill. The header follows the rounded corners via `clip`.
 *
 * Distinct from the `idCard` **structure template** in
 * `src/template/structures.ts`: that one is a row/slot `CardStructure` compiled
 * by `compileCard`, this is a {@link CompositeCard} subclass that builds the
 * composite spec directly. Same name, two layers of the same stack.
 *
 * Configured by {@link IDCardSpec}; override {@link header} / {@link photo} /
 * {@link identity} / {@link footer} for structural changes.
 */
declare class IDCard extends CompositeCard<IDCardSpec, IDCardData> {
    constructor(spec?: Partial<IDCardSpec>);
    /** Accent header band + the issuing organisation. */
    protected header(data: IDCardData, parts: CompositePart[]): void;
    /** Photo chip — the `photo` icon, or `initials` on an accent-tinted square. */
    protected photo(data: IDCardData, parts: CompositePart[]): void;
    /** Name + title, beside the photo chip. */
    protected identity(data: IDCardData, parts: CompositePart[]): void;
    /** Y of the divider, below the photo block. */
    protected dividerY(): number;
    /** Badge number (left) + status pill and validity note (right). */
    protected footer(data: IDCardData, parts: CompositePart[]): void;
    protected parts(data: IDCardData): CompositePart[];
    protected frame(): CardFrame;
}
/** Convenience builder with the stock spec — `new IDCard().build(data)`. */
declare function idCard(data: IDCardData): CompositeShapeOption;

/** Full configuration for an {@link OrganisationCard} — edit any field to re-style. */
interface OrganisationCardSpec {
    width: number;
    padding: number;
    cornerRadius: number;
    /** Side of the square logo chip. */
    logoSize: number;
    /** Corner radius of the logo chip. */
    logoRadius: number;
    /** Height of one meta row (location / headcount / founded). */
    metaRowHeight: number;
    /**
     * Corner radius of the entity-type tag chip, in pixels. Half the chip's
     * height reads as a full pill; drop it toward `4` for a squarer tag.
     */
    chipRadius: number;
    bg: number;
    stroke: number;
    nameColor: number;
    metaColor: number;
    metaIconColor: number;
}
/** Default {@link OrganisationCardSpec}. */
declare const ORGANISATION_CARD_DEFAULTS: OrganisationCardSpec;
/**
 * **Organisation** card — a logo chip (icon, or a monogram when there's no
 * logo) beside the organisation name and an entity-type tag, a divider, then
 * one meta row per present detail: location, headcount, founding note.
 *
 * Auto-sizes to the number of meta rows, so a bare `{ name, accent }` card is
 * short and a fully-populated one is tall — absent fields leave no gap.
 * Configured by {@link OrganisationCardSpec}; override {@link logo} /
 * {@link identity} / {@link metaRows} for structural changes.
 */
declare class OrganisationCard extends CompositeCard<OrganisationCardSpec, OrganisationCardData> {
    constructor(spec?: Partial<OrganisationCardSpec>);
    /** Logo chip — the `logo` icon, or `monogram` on an accent-tinted square. */
    protected logo(data: OrganisationCardData, parts: CompositePart[]): void;
    /** Name + entity-type tag, beside the logo chip. */
    protected identity(data: OrganisationCardData, parts: CompositePart[]): void;
    /** The meta rows this card renders, in order — only the present ones. */
    protected metaRows(data: OrganisationCardData): Array<{
        icon: string;
        text: string;
    }>;
    /** Y of the divider, below the logo block. */
    protected dividerY(): number;
    protected parts(data: OrganisationCardData): CompositePart[];
    protected frame(data: OrganisationCardData): CardFrame;
}
/** Convenience builder with the stock spec — `new OrganisationCard().build(data)`. */
declare function organisationCard(data: OrganisationCardData): CompositeShapeOption;

/** Full configuration for a {@link ProductCard} — edit any field to re-style. */
interface ProductCardSpec {
    width: number;
    padding: number;
    cornerRadius: number;
    /** Height of the accent-tinted media band at the top (0 to hide it). */
    mediaHeight: number;
    /** Height reserved for the tag-chip row when tags are present. */
    tagRowHeight: number;
    /**
     * Corner radius of the stock pill and tag chips, in pixels. Half the chip's
     * height reads as a full pill; drop it toward `4` for a squarer tag.
     */
    chipRadius: number;
    bg: number;
    stroke: number;
    titleColor: number;
    priceColor: number;
    ratingColor: number;
    reviewColor: number;
}
/** Default {@link ProductCardSpec}. */
declare const PRODUCT_CARD_DEFAULTS: ProductCardSpec;
/**
 * **Product / catalogue item** card — an accent-tinted media band with a
 * centred icon, a two-line title, a price beside a star rating, an optional
 * stock pill, and a row of tag chips.
 *
 * The media band runs edge to edge and relies on the frame's `clip` to follow
 * the rounded corners — a `rect` part is square geometry and can't round one on
 * its own. Auto-sizes to whether tags are present. Configured by
 * {@link ProductCardSpec}; override {@link media} / {@link title} /
 * {@link priceRow} / {@link tags} for structural changes.
 */
declare class ProductCard extends CompositeCard<ProductCardSpec, ProductCardData> {
    constructor(spec?: Partial<ProductCardSpec>);
    /** Accent-tinted media band with a centred icon. */
    protected media(data: ProductCardData, parts: CompositePart[]): void;
    /** Two-line product title below the media band. */
    protected title(data: ProductCardData, parts: CompositePart[]): void;
    /** Y of the price row — below a title laid out as two lines. */
    protected priceRowY(): number;
    /** Price (left) + star rating and review count (right). */
    protected priceRow(data: ProductCardData, parts: CompositePart[]): void;
    /** Stock pill + tag chips, left → right. */
    protected tags(data: ProductCardData, parts: CompositePart[]): void;
    /** Whether this card renders a chip row at all. */
    protected hasTagRow(data: ProductCardData): boolean;
    protected parts(data: ProductCardData): CompositePart[];
    protected frame(data: ProductCardData): CardFrame;
}
/** Convenience builder with the stock spec — `new ProductCard().build(data)`. */
declare function productCard(data: ProductCardData): CompositeShapeOption;

/** Full configuration for an {@link EventCard} — edit any field to re-style. */
interface EventCardSpec {
    width: number;
    padding: number;
    cornerRadius: number;
    /** Side of the square date chip. */
    dateChipSize: number;
    /** Corner radius of the date chip. */
    dateChipRadius: number;
    /** Height of one meta row (time / venue / attendees). */
    metaRowHeight: number;
    bg: number;
    stroke: number;
    titleColor: number;
    dayColor: number;
    monthColor: number;
    metaColor: number;
    metaIconColor: number;
}
/** Default {@link EventCardSpec}. */
declare const EVENT_CARD_DEFAULTS: EventCardSpec;
/**
 * **Event** card — a solid accent date chip (day over short month) beside a
 * two-line title, then one meta row per present detail: time, venue,
 * attendance.
 *
 * Auto-sizes to the number of meta rows. `day` / `month` are pre-formatted
 * strings, not a `Date` — the card does no locale or timezone work, so the
 * caller decides how a date reads. Configured by {@link EventCardSpec};
 * override {@link dateChip} / {@link title} / {@link metaRows} for structural
 * changes.
 */
declare class EventCard extends CompositeCard<EventCardSpec, EventCardData> {
    constructor(spec?: Partial<EventCardSpec>);
    /** Solid accent date chip — day over short month. */
    protected dateChip(data: EventCardData, parts: CompositePart[]): void;
    /** Two-line event title, beside the date chip. */
    protected title(data: EventCardData, parts: CompositePart[]): void;
    /** The meta rows this card renders, in order — only the present ones. */
    protected metaRows(data: EventCardData): Array<{
        icon: string;
        text: string;
    }>;
    /** Y of the divider, below the date-chip block. */
    protected dividerY(): number;
    protected parts(data: EventCardData): CompositePart[];
    protected frame(data: EventCardData): CardFrame;
}
/** Convenience builder with the stock spec — `new EventCard().build(data)`. */
declare function eventCard(data: EventCardData): CompositeShapeOption;

/**
 * Shared bits for the built-in composite **card** node types — colours + a
 * couple of helpers reused across the composite node types in this folder.
 * These builders produce a {@link CompositeShapeOption} from data;
 * consumers wire them via a per-node `shape` resolver:
 *
 * ```ts
 * new GraphLayer({ options: { node: { style: {
 *   shape: (n) => userCard(n.data as UserCardData),
 *   bgStrokeWidth: 0,
 * }}}})
 * ```
 *
 * Colours are dark-theme defaults baked in (matching the story look); the card
 * body / stroke can be overridden per builder, and data-driven accents come
 * from the data. Theme-role colouring is a later enhancement.
 */

/** iconify CDN URL for an icon id like `lucide/users` (used by the `icon` parts). */
declare const iconifyUrl: (id: string) => string;
/** Default card body fill (slate-900). */
declare const CARD_BG = 988970;
/** Default card border (slate-700). */
declare const CARD_STROKE = 3359061;
/** Geometry + copy for one {@link metaRow} — a Lucide icon beside a line of text. */
interface MetaRowOptions {
    /** Left edge of the icon box. */
    x: number;
    /** Top of the row. */
    y: number;
    /** Width available to the row; the label ellipsises to fit what's left. */
    width: number;
    /** Iconify id, e.g. `lucide/map-pin`. */
    icon: string;
    text: string;
    iconColor: number;
    textColor: number;
    /** Side of the icon box. Default `14`. */
    iconSize?: number;
    /** Default `12`. */
    fontSize?: number;
    /** Space between icon and text. Default `8`. */
    gap?: number;
}
/**
 * Push an **icon + text meta row** — the `lucide/map-pin` + location pattern
 * shared by the organisation, event and user cards. The label ellipsises into
 * whatever `width` leaves after the icon and gap.
 */
declare function metaRow(parts: CompositePart[], o: MetaRowOptions): void;
/** Geometry + copy for one {@link chip} — a rounded, tinted pill. */
interface ChipOptions {
    x: number;
    y: number;
    text: string;
    /** Drives both the tinted background and the label. */
    color: number;
    /** Default `18`. */
    height?: number;
    /** Default `11`. */
    fontSize?: number;
    /** Background tint alpha. Default `0.2`. */
    alpha?: number;
    /**
     * Corner radius in pixels. Default `height / 2` — a full pill. Pass a smaller
     * number for a squarer tag (`4` reads as a chip, `0` as a plain box).
     */
    cornerRadius?: number;
}
/**
 * Push a **rounded pill chip** (tinted rect + centred label) and return its
 * width, so a caller can lay chips out left → right. Width is estimated from
 * the character count — the renderer measures text, this does not.
 */
declare function chip(parts: CompositePart[], o: ChipOptions): number;

/** Default node-type accessor — see {@link DeriveSchemaOptions.nodeTypeOf}. */
declare function defaultNodeTypeOf(node: GraphNode): string;
/** Default edge-type accessor — see {@link DeriveSchemaOptions.edgeTypeOf}. */
declare function defaultEdgeTypeOf(edge: GraphEdge): string;
/**
 * Derive the {@link GraphSchema} of a graph by scanning a {@link GraphStore}'s
 * loaded nodes/edges once. Pure and synchronous; returns an empty schema for a
 * missing store. This is the **observed** schema (what's loaded) — for the
 * authoritative one prefer `store.schema` and fall back to this.
 */
declare function deriveSchema(store: GraphStore | null | undefined, { nodeTypeOf, edgeTypeOf }?: DeriveSchemaOptions): GraphSchema;
/**
 * A compact string that changes only when the schema's **structure** changes
 * (type names, counts, property counts, connectivity) — handy for keying/memoing
 * off a schema.
 */
declare function schemaSignature(schema: GraphSchema): string;

export { type ArcShapeOption, type ArrowShape, BUILT_IN_STRUCTURES, BUILT_IN_STYLINGS, BUILT_IN_THEMES, type BadgeEffects, type BadgeOrigin, type BadgePlacement, type BrushModifierKey, BrushSelectBehaviour, type BrushSelectBehaviourOptions, type BrushSelectElementType, type BrushSelectStyle, type BuiltInNodeShapeOptions, CARD_BG, CARD_STROKE, COLLAPSED_COUNT_BADGE_ID, COLLAPSED_STATE, type CanonicalStateName, type CardElement, type CardElementCommon, type CardFrame, type CardRow, type CardSlot, type CardStructure, type CardTag, type ChipOptions, type CircleShapeOption, ClickInspectBehaviour, type ClickInspectBehaviourOptions, type ClickInspectEventMap, ClickSelectBehaviour, type ClickSelectBehaviourOptions, type ClickSelectEventMap, ClickViewBehaviour, type ClickViewBehaviourOptions, type ClickViewEventMap, CollapseExpandBehaviour, type CollapseExpandBehaviourOptions, ColorByBehaviour, type ColorByBehaviourOptions, type ColorByLegendSection, type ColorByMode, type ColorByScale, type ColorRole, type ColorValueAccessor, CompositeCard, type CompositeShapeOption, type ContentLODBehaviourOptions, ContextMenuBehaviour, type ContextMenuBehaviourOptions, type ContextMenuEvent, type ContextMenuTargetType, CreateNodeBehaviour, type CreateNodeBehaviourOptions, type CustomShapeOption, DEFAULT_CATEGORY_PALETTE, DEFAULT_EDGE_STATES, DEFAULT_EDGE_TYPES, DEFAULT_EDGE_TYPE_LABELS, DEFAULT_NODE_STATES, DEFAULT_RANGE_STOPS, DEFAULT_THEME, type DecorationSpecCommon, type DeriveSchemaOptions, DragNodeBehaviour, type DragNodeBehaviourOptions, DrawEdgeBehaviour, type DrawEdgeBehaviourOptions, EVENT_CARD_DEFAULTS, type EdgeAnchor, type EdgeBadge, type EdgeBadgePlacement, type EdgeDecorationSpec, type EdgeDirection, type EdgeEffects, EdgeLODBehaviour, type EdgeLODBehaviourOptions, type EdgeLODKeepBy, EdgeLabelLODBehaviour, type EdgeLabelLODBehaviourOptions, type EdgeOption, type EdgePathType, EdgeScaleLODBehaviour, type EdgeScaleLODBehaviourOptions, type EdgeScaleLODConfig, type EdgeShapeOptions, type EdgeStyle, type EditCommandName, EntranceBehaviour, type EntranceBehaviourOptions, type EntranceOrder, EraseBehaviour, type EraseBehaviourOptions, type EraseTargetKind, type ErasedElement, EventCard, type EventCardData, type EventCardSpec, FOREST_THEME, FisheyeBehaviour, type FisheyeBehaviourOptions, type FisheyeDisplacement, type FisheyeTrigger, type FisheyeWheelModifier, FocusBehaviour, type FocusBehaviourOptions, type FreeformStructure, GOLD_THEME, GROUP_TOGGLE_SLOT, GraphCanvas, type GraphCanvasCommandMap, type GraphCanvasOptions, GraphClipboard, type GraphClipboardEventMap, type GraphClipboardOptions, type GraphCommandMap, type GraphData, type GraphEdge, type GraphEditAccess, type GraphElementKind, GraphLayer, type GraphLayerEvents, type GraphLayerOptions, type GraphLegendColor, type GraphLegendCountMode, type GraphLegendKind, GraphLegendLayer, type GraphLegendLayerEvents, type GraphLegendLayerOptions, type GraphLegendMode, type GraphLegendPosition, type GraphLegendRow, type GraphLegendRowKind, type GraphLegendSort, type GraphNode, type GraphSchema, GraphStore, type GraphStoreEventMap, type GraphStoreOptions, type GroupExclusion, type GroupForestNode, type GroupInsets, type GroupOptions, type HistoryOp, HoverActivateBehaviour, type HoverActivateBehaviourOptions, type HoverDirection, HoverElementPreviewBehaviour, type HoverElementPreviewBehaviourOptions, type HoverElementPreviewCardSpec, type HoverElementPreviewCardsByType, type HoverElementPreviewEventMap, type HoverableElement, type HoverableElementType, IDCard, type IDCardData, type IDCardSpec, ID_CARD_DEFAULTS, IconLODBehaviour, type IconLODBehaviourOptions, ImageLODBehaviour, type ImageLODBehaviourOptions, type InspectTarget, LabelCollisionBehaviour, type LabelCollisionBehaviourOptions, type LabelCollisionStrategy, type LabelPriorityResolver, type LabelSizeOptions, type LabelStyling, type LassoModifierKey, LassoSelectBehaviour, type LassoSelectBehaviourOptions, type LassoSelectElementType, type LassoSelectStyle, type LayoutEdge, type LayoutNodeSize, type LayoutPositions, type LayoutSubgraph, MINIMAL_THEME, type MetaRowOptions, type MiniMapColor, type MiniMapKind, MiniMapLayer, type MiniMapLayerOptions, type MiniMapMode, type MiniMapPosition, type NodeBadge, type NodeBadgeTemplate, NodeCentralityBehaviour, type NodeCentralityBehaviourOptions, type NodeCentralityScale, type NodeDecorationSpec, type NodeEffects, type NodeIcon, type NodeImage, NodeLabelLODBehaviour, type NodeLabelLODBehaviourOptions, type NodeOption, NodeResizeBehaviour, type NodeResizeBehaviourOptions, NodeScaleLODBehaviour, type NodeScaleLODBehaviourOptions, type NodeScaleLODConfig, type NodeShapeOptions, type NodeStructureRegistry, type NodeStructureTemplate, type NodeStyle, type NodeStylingRegistry, type NodeStylingTemplate, type NodeTypeBinding, type NodeTypeRegistry, OCEAN_THEME, ORGANISATION_CARD_DEFAULTS, type OneShotLayoutOptions, OneShotPositionLayout, OrganisationCard, type OrganisationCardData, type OrganisationCardSpec, PRODUCT_CARD_DEFAULTS, type ParallelEdgeBasis, ParallelEdgeBehaviour, type ParallelEdgeBehaviourOptions, type ParallelEdgeDistribute, type ParallelEdgeDistributeContext, type ParallelEdgeGroup, type ParallelEdgePatch, type PasteResult, type PolygonShapeOption, type PreviewCardRow, type PreviewFieldPath, type PreviewImageSpec, type PreviewPlacement, type PreviewRowFormat, type PreviewRowSpec, type PreviewSnapshot, type PreviewSubtitleSpec, type PreviewTextSpec, ProductCard, type ProductCardData, type ProductCardSpec, ROSE_THEME, type RectShapeOption, type RegisterGraphEditCommandsOptions, type RegularPolygonShapeOption, type Resolvable, type ResolvableEdgeStyle, type ResolvableId, type ResolvableNodeStyle, type ResolvedColorByOptions, type ResolvedEntranceOptions, type ResolvedFisheyeOptions, type ResolvedPreviewCard, SCHEMA_TABLE_CARD_DEFAULTS, STAT_CARD_DEFAULTS, type SchemaEdgeConnection, type SchemaEdgeType, type SchemaField, type SchemaNodeType, type SchemaProperty, SchemaTableCard, type SchemaTableCardOptions, type SchemaTableCardSpec, type SchemaTableData, type SelectDirection, type SelectModifierKey, type SelectableElement, type SelectableElementType, type SelectionSnapshot, type SimpleStructure, type SlotStyling, type StarShapeOption, StatCard, type StatCardData, type StatCardSpec, type SubgraphLayoutOptions, SubgraphPositionLayout, TASK_CARD_DEFAULTS, TaskCard, type TaskCardData, type TaskCardSpec, type TaskTag, type TemplateColor, TextResolutionLODBehaviour, type TextResolutionLODBehaviourOptions, type Theme, ThemeBehaviour, type ThemeBehaviourOptions, type ThemeKind, type ThemeMode, type ThemePalette, type ThemeRegistry, UNKNOWN_TYPE, USER_CARD_DEFAULTS, UserCard, type UserCardData, type UserCardSpec, type ValueBand, type ValueLookup, type Vec2$1 as Vec2, type ViewTarget, type ZoomBand, buildGroupForest, centeredRanksPolicy, chip, clearGraphLayer, collectLayoutEdges, collectPlaceableNodes, compileBadges, compileCard, compileFreeform, compileSimple, compileSize, copySelection, cssColorToNumber, cutSelection, defaultEdgeTypeOf, defaultNodeTypeOf, deleteSelection, deriveSchema, edgePathType, effectiveLayoutEndpoint, eraseCommand, eventCard, fisheyeDisplace, groupInsets, groupSizeFloor, iconifyUrl, idCard, interpolate, isBuiltInNodeShape, isMergedEdgeId, isPlaceableNode, metaRow, organisationCard, pasteAndSelect, productCard, readValueKey, registerGraphEditCommands, resolveAccentVar, resolveField, resolveLookup, resolveNodeSize, resolvePath, resolvePreviewCard, resolveSelectMode, resolveText, schemaSignature, schemaTableCard, selectModePatch, selectedElementIds, setEdgePathType, statCard, taskCard, themeFamily, userCard };
