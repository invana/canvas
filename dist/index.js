import { SourceEmitter, ColumnStore, WorldLayer, SpecProjector, jsonSafe, ScreenLayer, select, BackgroundLayer, EventEmitter, Canvas, Layout, DEFAULT_POSITION_TRANSITION_MS, animatePositions, resolveEasing, Behaviour, ElementScaleLODBehaviour, resolveNumberOrGetter } from '@invana/canvas';
import RBush from 'rbush';

// src/store/GraphStore.ts

// src/history/netOps.ts
var NetBook = class {
  byId = /* @__PURE__ */ new Map();
  /** Final explicit hidden flag per id, for ids whose flag changed. */
  hidden = /* @__PURE__ */ new Map();
  add(record) {
    const prev = this.byId.get(record.id);
    const copy = { ...record };
    this.byId.set(record.id, prev && prev.status !== "added" ? { status: "replaced", record: copy } : { status: "added", record: copy });
  }
  remove(id) {
    const prev = this.byId.get(id);
    this.hidden.delete(id);
    if (prev?.status === "added") this.byId.delete(id);
    else this.byId.set(id, { status: "removed" });
  }
  update(id, after) {
    const prev = this.byId.get(id);
    if (prev?.status === "added" || prev?.status === "replaced") Object.assign(prev.record, after);
    else if (prev?.status === "updated") Object.assign(prev.patch, after);
    else if (!prev) this.byId.set(id, { status: "updated", patch: { ...after } });
  }
  setHidden(id, hidden) {
    if (this.byId.get(id)?.status === "removed") return;
    this.hidden.set(id, hidden);
  }
};
function opsToDelta(ops) {
  const nodes = new NetBook();
  const edges = new NetBook();
  for (const op of ops) {
    switch (op.kind) {
      case "addNode":
        nodes.add(op.node);
        break;
      case "addNodes":
        for (const n of op.nodes) nodes.add(n);
        break;
      case "addEdge":
        edges.add(op.edge);
        break;
      case "addEdges":
        for (const e of op.edges) edges.add(e);
        break;
      case "removeNode":
        for (const e of op.edges) edges.remove(e.id);
        nodes.remove(op.node.id);
        break;
      case "removeEdge":
        edges.remove(op.edge.id);
        break;
      case "updateNode":
        nodes.update(op.id, op.after);
        break;
      case "moveNode":
        nodes.update(op.id, { position: { ...op.after } });
        break;
      case "updateEdge":
        edges.update(op.id, op.after);
        break;
      case "setHidden":
        for (const id of op.ids) (op.element === "node" ? nodes : edges).setHidden(id, op.hidden);
        break;
      case "clear":
        for (const e of op.edges) edges.remove(e.id);
        for (const n of op.nodes) nodes.remove(n.id);
        break;
    }
  }
  const delta = {};
  const put = (slot, key, value) => {
    const bucket = delta[slot] ??= {};
    (bucket[key] ??= []).push(value);
  };
  for (const [book, recordKey, idKey] of [
    [nodes, "nodes", "nodeIds"],
    [edges, "edges", "edgeIds"]
  ]) {
    for (const [id, net] of book.byId) {
      if (net.status === "removed" || net.status === "replaced") put("removed", idKey, id);
      if (net.status === "added" || net.status === "replaced") put("added", recordKey, net.record);
      if (net.status === "updated") put("updated", recordKey, { id, patch: net.patch });
    }
    for (const [id, hidden] of book.hidden) put(hidden ? "hidden" : "shown", idKey, id);
  }
  return delta;
}
function touches(op) {
  switch (op.kind) {
    case "updateNode":
    case "moveNode":
      return { kind: "node", id: op.id };
    case "updateEdge":
      return { kind: "edge", id: op.id };
    default:
      return null;
  }
}
function cancelOps(ops) {
  const addedNodes = /* @__PURE__ */ new Set();
  const addedEdges = /* @__PURE__ */ new Set();
  const cancelNodes = /* @__PURE__ */ new Set();
  const cancelEdges = /* @__PURE__ */ new Set();
  const pinnedNodes = /* @__PURE__ */ new Set();
  const pinnedEdges = /* @__PURE__ */ new Set();
  for (const op of ops) {
    switch (op.kind) {
      case "addNode":
        addedNodes.add(op.node.id);
        break;
      case "addNodes":
        for (const n of op.nodes) addedNodes.add(n.id);
        break;
      case "addEdge":
        addedEdges.add(op.edge.id);
        break;
      case "addEdges":
        for (const e of op.edges) addedEdges.add(e.id);
        break;
      case "removeEdge":
        if (addedEdges.has(op.edge.id)) cancelEdges.add(op.edge.id);
        break;
      case "removeNode": {
        const keep = (op.orphanedChildIds?.length ?? 0) > 0 || !addedNodes.has(op.node.id);
        if (keep) {
          pinnedNodes.add(op.node.id);
          for (const e of op.edges) if (!addedEdges.has(e.id)) pinnedEdges.add(e.id);
        } else cancelNodes.add(op.node.id);
        for (const e of op.edges) if (addedEdges.has(e.id)) cancelEdges.add(e.id);
        break;
      }
      case "clear":
        for (const n of op.nodes) pinnedNodes.add(n.id);
        for (const e of op.edges) pinnedEdges.add(e.id);
        break;
    }
  }
  for (const id of pinnedNodes) cancelNodes.delete(id);
  for (const id of pinnedEdges) cancelEdges.delete(id);
  if (cancelNodes.size === 0 && cancelEdges.size === 0) return [...ops];
  const out = [];
  for (const op of ops) {
    switch (op.kind) {
      case "addNode":
        if (!cancelNodes.has(op.node.id)) out.push(op);
        continue;
      case "addNodes": {
        const nodes = op.nodes.filter((n) => !cancelNodes.has(n.id));
        if (nodes.length > 0) out.push(nodes.length === op.nodes.length ? op : { kind: "addNodes", nodes });
        continue;
      }
      case "addEdge":
        if (!cancelEdges.has(op.edge.id)) out.push(op);
        continue;
      case "addEdges": {
        const edges = op.edges.filter((e) => !cancelEdges.has(e.id));
        if (edges.length > 0) out.push(edges.length === op.edges.length ? op : { kind: "addEdges", edges });
        continue;
      }
      case "removeEdge":
        if (!cancelEdges.has(op.edge.id)) out.push(op);
        continue;
      case "removeNode": {
        if (cancelNodes.has(op.node.id)) continue;
        const edges = op.edges.filter((e) => !cancelEdges.has(e.id));
        out.push(edges.length === op.edges.length ? op : { ...op, edges });
        continue;
      }
      case "setHidden": {
        const gone = op.element === "node" ? cancelNodes : cancelEdges;
        const ids = op.ids.filter((id) => !gone.has(id));
        if (ids.length > 0) out.push(ids.length === op.ids.length ? op : { ...op, ids });
        continue;
      }
      default: {
        const t = touches(op);
        if (t && (t.kind === "node" ? cancelNodes : cancelEdges).has(t.id)) continue;
        out.push(op);
      }
    }
  }
  return out;
}

// src/store/AdjacencyIndex.ts
var AdjacencyIndex = class _AdjacencyIndex {
  /** Per-slot edge-slot lists. `buckets[u]` may be `undefined` for empty slots. */
  buckets = [];
  /** Live entry count per slot. Parallels `buckets`. */
  degrees;
  /** Initial per-bucket capacity. Doubles geometrically on overflow. */
  static INITIAL_BUCKET_CAPACITY = 4;
  constructor(initialNodeCapacity = 256) {
    this.degrees = new Int32Array(initialNodeCapacity);
  }
  /**
   * Ensure the degree array is large enough to address slot `slot`. Mirrors
   * the geometric growth pattern of `ColumnStore`.
   */
  ensureCapacity(slot) {
    if (slot < this.degrees.length) return;
    let next = this.degrees.length || 1;
    while (next <= slot) next *= 2;
    const grown = new Int32Array(next);
    grown.set(this.degrees);
    this.degrees = grown;
  }
  /** Degree of `slot`. Zero if the slot has no edges or is unallocated. */
  degree(slot) {
    return slot < this.degrees.length ? this.degrees[slot] : 0;
  }
  /**
   * Append `edgeSlot` to slot `slot`'s adjacency. Allocates / grows the
   * per-slot `Int32Array` as needed.
   */
  add(slot, edgeSlot) {
    this.ensureCapacity(slot);
    let bucket = this.buckets[slot];
    const deg = this.degrees[slot];
    if (!bucket) {
      bucket = new Int32Array(_AdjacencyIndex.INITIAL_BUCKET_CAPACITY);
      this.buckets[slot] = bucket;
    } else if (deg >= bucket.length) {
      const grown = new Int32Array(bucket.length * 2);
      grown.set(bucket);
      this.buckets[slot] = grown;
      bucket = grown;
    }
    bucket[deg] = edgeSlot;
    this.degrees[slot] = deg + 1;
  }
  /**
   * Remove `edgeSlot` from slot `slot`'s adjacency via swap-pop. O(deg(slot))
   * in the worst case to scan for the entry, O(1) to remove. No-op if absent.
   *
   * Returns `true` if the entry was found and removed.
   */
  remove(slot, edgeSlot) {
    if (slot >= this.degrees.length) return false;
    const bucket = this.buckets[slot];
    const deg = this.degrees[slot];
    if (!bucket || deg === 0) return false;
    for (let i = 0; i < deg; i++) {
      if (bucket[i] === edgeSlot) {
        const last = deg - 1;
        if (i !== last) bucket[i] = bucket[last];
        this.degrees[slot] = last;
        return true;
      }
    }
    return false;
  }
  /**
   * Return a zero-allocation view of slot `slot`'s adjacency. Length is
   * `degree(slot)`. The returned subarray shares memory with the underlying
   * bucket — do **not** mutate it.
   *
   * Stable across reads only until the next `add` / `remove` against this
   * slot (which may grow or swap-pop the bucket).
   */
  view(slot) {
    if (slot >= this.degrees.length) return EMPTY_VIEW;
    const bucket = this.buckets[slot];
    const deg = this.degrees[slot];
    if (!bucket || deg === 0) return EMPTY_VIEW;
    return bucket.subarray(0, deg);
  }
  /** Clear all per-slot data (e.g. on `store.clear()`). Capacity preserved. */
  clearAll() {
    this.buckets.length = 0;
    this.degrees.fill(0);
  }
  /** Reset a single slot (e.g. on `removeNode`). */
  clearSlot(slot) {
    if (slot >= this.degrees.length) return;
    this.buckets[slot] = void 0;
    this.degrees[slot] = 0;
  }
};
var EMPTY_VIEW = new Int32Array(0);

// src/store/FrameFlushScheduler.ts
var hasRAF = typeof globalThis !== "undefined" && typeof globalThis.requestAnimationFrame === "function";
var FrameFlushScheduler = class {
  flushFn;
  scheduled = false;
  /** Monotonic frame counter, incremented on each flush. */
  _frame = 0;
  constructor(flushFn) {
    this.flushFn = flushFn;
  }
  /**
   * Current frame counter. Bumps after each flush. Used by `PendingEdges` for
   * TTL accounting.
   */
  get frame() {
    return this._frame;
  }
  /**
   * Ask for a flush on the next animation frame. Idempotent within a frame.
   */
  request() {
    if (this.scheduled) return;
    this.scheduled = true;
    const fire = this.fire.bind(this);
    if (hasRAF) {
      globalThis.requestAnimationFrame(
        fire
      );
    } else {
      queueMicrotask(fire);
    }
  }
  /**
   * Run any pending flush synchronously. No-op if nothing was scheduled.
   * Used by `GraphStore.flush()` and by tests that need deterministic timing.
   */
  flushNow() {
    if (!this.scheduled) return;
    this.fire();
  }
  /** Drop any pending flush without firing it (used on `clear()`). */
  cancel() {
    this.scheduled = false;
  }
  fire() {
    if (!this.scheduled) return;
    this.scheduled = false;
    this._frame++;
    this.flushFn();
  }
};

// src/store/PendingEdges.ts
var PendingEdges = class {
  /** missing-id → set of pending entries waiting on it. */
  waitingFor = /* @__PURE__ */ new Map();
  /** edge id → entry (so duplicate `addEdge` calls update one entry). */
  byEdgeId = /* @__PURE__ */ new Map();
  /** Number of pending edges (not entries — an edge missing both endpoints counts once). */
  size() {
    return this.byEdgeId.size;
  }
  /**
   * Park `edge`, registering it under each of the missing endpoint ids.
   * Replaces a prior pending entry for the same edge id if any.
   */
  park(edge, missingIds, frame) {
    const existing = this.byEdgeId.get(edge.id);
    if (existing) this.unpark(edge.id);
    const entry = { edge, parkedAtFrame: frame, ownerSets: /* @__PURE__ */ new Set() };
    this.byEdgeId.set(edge.id, entry);
    for (const id of missingIds) {
      let set = this.waitingFor.get(id);
      if (!set) {
        set = /* @__PURE__ */ new Set();
        this.waitingFor.set(id, set);
      }
      set.add(entry);
      entry.ownerSets.add(set);
    }
  }
  /**
   * Take every pending edge that was waiting on `id`. Caller decides which
   * are now admissible (an edge missing both endpoints will be returned when
   * the first endpoint arrives but should be re-parked under the second).
   */
  takeWaitingFor(id) {
    const set = this.waitingFor.get(id);
    if (!set || set.size === 0) return [];
    const entries = [];
    for (const entry of set) {
      entries.push(entry);
      this.byEdgeId.delete(entry.edge.id);
    }
    this.waitingFor.delete(id);
    for (const entry of entries) {
      for (const otherSet of entry.ownerSets) {
        if (otherSet !== set) otherSet.delete(entry);
      }
      entry.ownerSets.clear();
    }
    return entries.map((e) => e.edge);
  }
  /** Remove a pending edge entirely (e.g. on `unpark` after admission). */
  unpark(edgeId) {
    const entry = this.byEdgeId.get(edgeId);
    if (!entry) return;
    this.byEdgeId.delete(edgeId);
    for (const set of entry.ownerSets) set.delete(entry);
    entry.ownerSets.clear();
  }
  /** True iff `edgeId` is currently parked. */
  has(edgeId) {
    return this.byEdgeId.has(edgeId);
  }
  /**
   * Yield all edges that were parked more than `ttl` frames before `currentFrame`.
   * Caller is expected to call `unpark` on each before emitting `edge:orphaned`.
   */
  *expired(currentFrame, ttl) {
    if (!Number.isFinite(ttl)) return;
    const cutoff = currentFrame - ttl;
    for (const entry of this.byEdgeId.values()) {
      if (entry.parkedAtFrame <= cutoff) yield entry.edge;
    }
  }
  /** Wipe all state. */
  clear() {
    this.waitingFor.clear();
    this.byEdgeId.clear();
  }
};

// src/store/types.ts
var UNKNOWN_TYPE = "unknown";

// src/store/GraphStore.ts
var FLAG_PINNED = 1 << 0;
var FLAG_TOMBSTONE = 1 << 1;
var FLAG_HIDDEN = 1 << 2;
var FLAG_PLACED = 1 << 3;
var NODE_SCHEMA = {
  x: "f32",
  y: "f32",
  flags: "u8"
};
var EDGE_SCHEMA = {
  srcSlot: "i32",
  dstSlot: "i32",
  flags: "u8"
};
function emptyCounters() {
  return {
    addedNodes: 0,
    updatedNodes: 0,
    removedNodes: 0,
    addedEdges: 0,
    updatedEdges: 0,
    removedEdges: 0,
    hiddenNodes: 0,
    shownNodes: 0
  };
}
var GraphStore = class {
  // ─── Options ────────────────────────────────────────────────────────────
  flushMode;
  unknownEndpoint;
  pendingEdgeTTL;
  // ─── Hot storage (typed arrays via ColumnStore) ─────────────────────────
  nodeCols;
  edgeCols;
  // ─── Cold storage (Map<id, payload>) ────────────────────────────────────
  nodeMap = /* @__PURE__ */ new Map();
  /**
   * Derived visibility inputs behind {@link isNodeVisible}, pushed in by the
   * owning layer (see that method for why they cannot be computed here).
   * Neither is authored data, so neither is serialised.
   */
  collapseHidden = /* @__PURE__ */ new Set();
  _placementPending = false;
  edgeMap = /* @__PURE__ */ new Map();
  childrenIndex = /* @__PURE__ */ new Map();
  // ─── Interaction state (presence compartment) ───────────────────────────
  // The *runtime* active-state sets — hover / selected / highlighted toggled by
  // behaviours and UI. Kept SEPARATE from the cold `states[]` field, which is
  // the *document* (data-driven) active-state list. The two compartments are
  // independent: runtime toggles never touch `states[]`, and a data-feed
  // `updateNode({ states })` never touches these sets (so a feed update can't
  // wipe a live hover/selection). The renderer reads the **union** of both via
  // {@link nodeStatesOf}. See `store-owns-state-plan.md` § 0 / § 5.
  nodeRuntimeStates = /* @__PURE__ */ new Map();
  edgeRuntimeStates = /* @__PURE__ */ new Map();
  // ─── Visibility (explicit-hidden indexes) ───────────────────────────────
  // Ids of elements whose explicit `hidden` flag is set. Kept in lockstep with
  // the `FLAG_HIDDEN` bit in the `flags` column (the flag is the storage the
  // renderer/compact read; these sets give O(1) `hiddenNodeCount()` and cheap
  // `hiddenNodes()` iteration without scanning every element). Effective edge
  // visibility (edge hidden if an endpoint is hidden) is derived lazily — no
  // set is maintained for it. See `docs/per-element-visibility-plan.md`.
  hiddenNodeIds = /* @__PURE__ */ new Set();
  hiddenEdgeIds = /* @__PURE__ */ new Set();
  // ─── Indices ────────────────────────────────────────────────────────────
  outAdj = new AdjacencyIndex();
  inAdj = new AdjacencyIndex();
  pending = new PendingEdges();
  // ─── Reactivity ─────────────────────────────────────────────────────────
  /**
   * Public event bus. Subscribe via `store.events.on('node:add', ...)`.
   *
   * A `SourceEmitter` (`{ kind: 'store' }`): once the owning layer calls
   * {@link bindBus} on mount, every emit also publishes a `CanvasEvent` envelope
   * to the canvas tap channel, so telemetry sees all store mutations
   * (`store-owns-state-plan.md` § 6).
   */
  events;
  /** Authoritative schema declared by a data source (Neo4j, …); see {@link setSchema}. */
  _schema;
  /** Per-flush counters. Reset on `flush()`. */
  counters = emptyCounters();
  /** Pending dedup-ed event payloads to fire on the next flush. */
  pendingNodeAdds = /* @__PURE__ */ new Set();
  pendingNodeUpdates = /* @__PURE__ */ new Map();
  pendingNodeRemoves = /* @__PURE__ */ new Set();
  pendingEdgeAdds = /* @__PURE__ */ new Set();
  pendingEdgeUpdates = /* @__PURE__ */ new Map();
  pendingEdgeRemoves = /* @__PURE__ */ new Set();
  pendingEdgeOrphans = /* @__PURE__ */ new Set();
  /**
   * Pending runtime-state toggles, keyed by `"<id>\u0000<name>"` so repeated
   * toggles of the same (id, name) within a flush window collapse to one event.
   * The emitted `on` is read from live set membership at flush time, so an
   * add+remove in the same frame nets out correctly.
   */
  pendingNodeStates = /* @__PURE__ */ new Map();
  pendingEdgeStates = /* @__PURE__ */ new Map();
  /**
   * Pending **explicit** visibility changes, keyed by id → latest hidden value.
   * Coalesced per flush (hide-then-show in one batch nets to the final value)
   * and emitted as `node:visibility` / `edge:visibility`. Endpoint-driven
   * (effective) edge hiding produces no entry here.
   */
  pendingNodeVisibility = /* @__PURE__ */ new Map();
  pendingEdgeVisibility = /* @__PURE__ */ new Map();
  /** Depth of nested `batch()` calls. Flushes only on outermost exit. */
  batchDepth = 0;
  flushScheduler = null;
  /** {@link DataSource} flush listeners — fed a {@link LayerFlush} delta projection (D13). */
  flushListeners = /* @__PURE__ */ new Set();
  /** Monotonic version counter. Bumps on every mutation including silent. */
  _version = 0;
  /**
   * Monotonic flush counter. Bumps on every `doFlush` regardless of which
   * code path triggered the flush. Used by `PendingEdges` TTL accounting.
   */
  _frame = 0;
  // ─── Recording (the operation log) ──────────────────────────────────────
  /** Id this store's events and (by default) its log source carry. */
  storeId;
  /** The log recorded writes go to; `undefined` ⇒ nothing is recorded. */
  log;
  /** This store's source id on {@link log}. */
  logSourceId = "";
  /** Unregisters this store as a replay source on {@link log}. */
  unregisterSource = null;
  logListeners = /* @__PURE__ */ new Set();
  /**
   * Depth of unrecorded sections — `store.internal.*`, a replay, and the inner
   * steps of a composite write (a cascading remove records one op, not one per
   * edge).
   */
  unrecordedDepth = 0;
  /** Ops recorded inside the current outermost {@link batch}; one entry on exit. */
  recordBuffer = null;
  /** The actor the first write of the current outermost batch named, if any. */
  recordActor;
  /** Whether the current write is streamed (`applyDelta(…, { coalesce: true })`) — merged into the actor's open entry. */
  recordCoalesce = false;
  // ────────────────────────────────────────────────────────────────────────
  constructor(opts = {}) {
    this.flushMode = opts.flushMode ?? "sync";
    this.unknownEndpoint = opts.unknownEndpoint ?? "throw";
    this.pendingEdgeTTL = opts.pendingEdgeTTL ?? Infinity;
    const initialCapacity = opts.initialCapacity ?? 256;
    this.storeId = opts.id ?? "graph-store";
    this.events = new SourceEmitter({
      kind: "store",
      id: this.storeId
    });
    this.nodeCols = new ColumnStore(NODE_SCHEMA, { initialCapacity });
    this.edgeCols = new ColumnStore(EDGE_SCHEMA, { initialCapacity });
    if (this.flushMode === "frame") {
      this.flushScheduler = new FrameFlushScheduler(() => this.doFlush());
    }
  }
  /**
   * Attach (or detach with `undefined`) the canvas event bus this store's
   * events forward to. Called by the owning `GraphLayer` on mount/unmount so
   * store mutations reach the telemetry tap channel (§ 6). Local
   * `store.events.on(...)` subscribers work with or without a bus.
   */
  bindBus(bus) {
    this.events.setBus(bus);
  }
  // ─── Recording (the operation log) ──────────────────────────────────────
  //
  // Every **content** write is recorded into the attached log as `HistoryOp`s,
  // captured before the mutation runs so each can be inverted: `applyDelta` —
  // the one data door — and the writers that are shorthand for one of its
  // fields (`addNode`, `updateNode`, `removeNode`, the edge equivalents,
  // `hideNodes` / `showNodes` / `setNodeHidden` …, `setPinned`, `addData`, the
  // bulk adds, `clear`). One public call is one entry; a `batch(fn)` is one
  // entry. **Not recorded** (derived, recomputed from content): position writes
  // (`setPosition` / `setPositionsBulk` — layouts and drag frames; a drag is
  // journalled once on release), runtime states (hover / selection), the
  // collapse / placement visibility inputs, `setNodeBoundingBox`, and anything
  // written through {@link internal}. With no log attached nothing is recorded
  // and nothing is captured. RFC
  // `feat-2026-09-28-an-analysis-cannot-be-recorded-or-replayed`, F5 / F6.
  /**
   * Record this store's content writes into `log` (the canvas's operation log),
   * and register it there as the replay source `sourceId`. Replaces any log
   * attached before; `undefined` detaches. `GraphLayer` calls this on mount with
   * the canvas's log and its own id. Returns the detach.
   */
  attachLog(log, sourceId = this.storeId) {
    this.unregisterSource?.();
    this.unregisterSource = null;
    this.log = log;
    this.logSourceId = sourceId;
    if (log) {
      const adapter = {
        sourceId,
        applyOps: (ops, direction) => this.replayOps(ops, direction),
        applyDelta: (delta, opts) => this.applyDelta(delta, opts),
        hasElement: (id) => this.hasNode(id) || this.hasEdge(id),
        toDelta: (ops) => opsToDelta(ops),
        compact: (ops) => cancelOps(ops)
      };
      this.unregisterSource = log.registerSource(adapter);
    }
    for (const l of [...this.logListeners]) l(log);
    return () => {
      if (this.log === log) this.attachLog(void 0);
    };
  }
  /** The log this store records into, or `undefined` when none is attached. */
  get operationLog() {
    return this.log;
  }
  /** Hear {@link attachLog} (a new log, or `undefined` on detach). Returns the unsubscribe. */
  onLogAttached(listener) {
    this.logListeners.add(listener);
    return () => this.logListeners.delete(listener);
  }
  /**
   * Journal ops that were **already applied** as one entry — the escape hatch
   * for a gesture that writes unrecorded frames and settles once (a node drag
   * records one `moveNode` per node on release). No-op with no log attached.
   */
  recordApplied(ops, meta = {}) {
    const log = this.log;
    if (!log || ops.length === 0 || log.replaying) return;
    log.group(meta, () => log.recordData(this.logSourceId, ops, meta.actor));
  }
  /**
   * **Derived writes — never recorded.** For behaviours and layouts that write
   * presentation computed from content (a fade, a badge, a routed waypoint, a
   * collapse or LOD hide): the same effect on screen as the public writer, but
   * no history entry, so undo never fights the behaviour that recomputes it.
   * `run(fn)` makes every write inside `fn` unrecorded.
   */
  internal = {
    /** Run `fn` with recording off; returns its result. */
    run: (fn) => this.unrecorded(fn),
    applyDelta: (delta) => this.unrecorded(() => this.applyDelta(delta)),
    updateNode: (id, patch) => this.unrecorded(() => this.updateNode(id, patch)),
    updateEdge: (id, patch) => this.unrecorded(() => this.updateEdge(id, patch)),
    hideNodes: (ids) => this.unrecorded(() => this.hideNodes(ids)),
    showNodes: (ids) => this.unrecorded(() => this.showNodes(ids)),
    hideEdges: (ids) => this.unrecorded(() => this.hideEdges(ids)),
    showEdges: (ids) => this.unrecorded(() => this.showEdges(ids)),
    setPosition: (id, pos, opts) => this.setPosition(id, pos, opts),
    setPositionsBulk: (ids, xy, opts) => this.setPositionsBulk(ids, xy, opts),
    setNodeState: (id, name, on = true) => this.setNodeState(id, name, on),
    setEdgeState: (id, name, on = true) => this.setEdgeState(id, name, on)
  };
  /**
   * Whether a write right now should be captured and recorded. Hot path — one
   * check per write — so it doesn't ask the log whether it is replaying: this
   * store's own replay runs unrecorded, and the log drops anything else written
   * while it replays.
   */
  get recording() {
    return this.log !== void 0 && this.unrecordedDepth === 0;
  }
  unrecorded(fn) {
    this.unrecordedDepth++;
    try {
      return fn();
    } finally {
      this.unrecordedDepth--;
    }
  }
  /** Record `op` — buffered inside a batch, else its own entry. Call only when {@link recording}. */
  record(op) {
    if (this.batchDepth > 0) {
      (this.recordBuffer ??= []).push(op);
      return;
    }
    const coalesce = this.recordCoalesce;
    this.log?.recordData(this.logSourceId, [op], this.takeRecordActor(), coalesce ? { coalesce } : void 0);
  }
  recordAdd(kind, record) {
    if (this.batchDepth === 0) {
      this.record(kind === "addNode" ? { kind, node: record } : { kind, edge: record });
      return;
    }
    const buffer = this.recordBuffer ??= [];
    const last = buffer[buffer.length - 1];
    if (kind === "addNode") {
      if (last?.kind === "addNodes") last.nodes.push(record);
      else buffer.push({ kind: "addNodes", nodes: [record] });
    } else if (last?.kind === "addEdges") last.edges.push(record);
    else buffer.push({ kind: "addEdges", edges: [record] });
  }
  /** Consume the current write's actor (and its streamed flag, which travels with it). */
  takeRecordActor() {
    const actor = this.recordActor;
    this.recordActor = void 0;
    this.recordCoalesce = false;
    return actor;
  }
  /** Commit the outermost batch's buffered ops as one data part. */
  commitRecording() {
    const ops = this.recordBuffer;
    this.recordBuffer = null;
    const coalesce = this.recordCoalesce;
    const actor = this.takeRecordActor();
    if (!ops || ops.length === 0 || !this.log) return;
    this.log.recordData(this.logSourceId, compactOps(ops), actor, coalesce ? { coalesce } : void 0);
  }
  /** Snapshot the patched fields' prior values for a node. */
  captureNodeBefore(id, patch) {
    const node = this.getNode(id);
    const before = {};
    for (const key of Object.keys(patch)) before[key] = node[key];
    return before;
  }
  captureEdgeBefore(id, patch) {
    const edge = this.getEdge(id);
    const before = {};
    for (const key of Object.keys(patch)) before[key] = edge[key];
    return before;
  }
  /** Cloned incident edges (both directions), deduped — self-loops appear once. */
  incidentEdges(nodeId) {
    const seen = /* @__PURE__ */ new Set();
    const out = [];
    for (const edge of this.edgesOf(nodeId, "both")) {
      if (seen.has(edge.id)) continue;
      seen.add(edge.id);
      out.push({ ...edge, hidden: this.isEdgeHidden(edge.id) });
    }
    return out;
  }
  /** {@link DataOpAdapter.applyOps} — replay recorded ops, unrecorded, as one flush. */
  replayOps(ops, direction) {
    const list = ops;
    this.unrecorded(
      () => this.batch(() => {
        if (direction === "forward") {
          for (const op of list) this.applyForward(op);
        } else {
          for (let i = list.length - 1; i >= 0; i--) this.applyInverse(list[i]);
        }
      })
    );
  }
  applyForward(op) {
    switch (op.kind) {
      case "addNode":
        if (!this.hasNode(op.node.id)) this.addNode(op.node);
        break;
      case "removeNode":
        if (this.hasNode(op.node.id)) this.removeNode(op.node.id, { cascade: true });
        break;
      case "updateNode":
        this.updateNode(op.id, op.after);
        break;
      case "moveNode":
        this.setPosition(op.id, op.after);
        break;
      case "addEdge":
        if (!this.hasEdge(op.edge.id)) this.addEdge(op.edge);
        break;
      case "removeEdge":
        if (this.hasEdge(op.edge.id)) this.removeEdge(op.edge.id);
        break;
      case "updateEdge":
        this.updateEdge(op.id, op.after);
        break;
      case "addNodes":
        for (const node of op.nodes) if (!this.hasNode(node.id)) this.addNode(node);
        break;
      case "addEdges":
        for (const edge of op.edges) if (!this.hasEdge(edge.id)) this.addEdge(edge);
        break;
      case "setHidden":
        for (const id of op.ids) {
          if (op.element === "node") this.setNodeHidden(id, op.hidden);
          else this.setEdgeHidden(id, op.hidden);
        }
        break;
      case "clear":
        for (const edge of op.edges) if (this.hasEdge(edge.id)) this.removeEdge(edge.id);
        for (const node of op.nodes) if (this.hasNode(node.id)) this.removeNode(node.id, { cascade: true });
        break;
    }
  }
  applyInverse(op) {
    switch (op.kind) {
      case "addNode":
        if (this.hasNode(op.node.id)) this.removeNode(op.node.id, { cascade: true });
        break;
      case "removeNode":
        if (!this.hasNode(op.node.id)) this.addNode(op.node);
        this.readdEdges(op.edges);
        this.relinkChildren(op.node.id, op.orphanedChildIds);
        break;
      case "updateNode":
        this.updateNode(op.id, op.before);
        break;
      case "moveNode":
        this.setPosition(op.id, op.before);
        break;
      case "addEdge":
        if (this.hasEdge(op.edge.id)) this.removeEdge(op.edge.id);
        break;
      case "removeEdge":
        if (!this.hasEdge(op.edge.id)) this.addEdge(op.edge);
        break;
      case "updateEdge":
        this.updateEdge(op.id, op.before);
        break;
      case "addNodes":
        for (let i = op.nodes.length - 1; i >= 0; i--) {
          const id = op.nodes[i].id;
          if (this.hasNode(id)) this.removeNode(id, { cascade: true });
        }
        break;
      case "addEdges":
        for (let i = op.edges.length - 1; i >= 0; i--) {
          const id = op.edges[i].id;
          if (this.hasEdge(id)) this.removeEdge(id);
        }
        break;
      case "setHidden":
        for (const id of op.ids) {
          if (op.element === "node") this.setNodeHidden(id, !op.hidden);
          else this.setEdgeHidden(id, !op.hidden);
        }
        break;
      case "clear":
        for (const node of op.nodes) if (!this.hasNode(node.id)) this.addNode(node);
        this.readdEdges(op.edges);
        break;
    }
  }
  /**
   * Restore `parentId` on the children a `removeNode` unlinked. Inverses run in
   * reverse, so by the time a group is re-added its members (removed after it)
   * are already back — parentless. Children that are gone, or that picked up
   * another parent since, are left alone.
   */
  relinkChildren(parentId, childIds) {
    if (!childIds) return;
    for (const childId of childIds) {
      if (!this.hasNode(childId) || this.parentOf(childId) !== void 0) continue;
      this.updateNode(childId, { parentId });
    }
  }
  /** Re-add edges whose both endpoints exist; skip duplicates and danglers. */
  readdEdges(edges) {
    for (const edge of edges) {
      if (this.hasEdge(edge.id)) continue;
      if (!this.hasNode(edge.source) || !this.hasNode(edge.target)) continue;
      this.addEdge(edge);
    }
  }
  // ─── Public read accessors ──────────────────────────────────────────────
  /** Monotonic counter. Bumps on every mutation including silent position writes. */
  get version() {
    return this._version;
  }
  /**
   * The **authoritative** schema declared for this graph (e.g. the full Neo4j DB
   * schema behind a connected canvas), or `undefined` when none is set. It is
   * typically a *superset* of what's loaded — for the schema of the *loaded* data
   * use `deriveSchema(store)`. The common resolution is `store.schema ??
   * deriveSchema(store)` (authoritative wins).
   */
  get schema() {
    return this._schema;
  }
  /**
   * Set (or clear with `undefined`) the authoritative schema. Called by a data
   * source that *knows* its schema independent of loaded records — a Neo4j /
   * GraphQL / ontology adapter. Emits `'schema'` so reactive consumers re-read.
   */
  setSchema(schema) {
    this._schema = schema;
    this.events.emit("schema", { authoritative: schema != null });
  }
  /** Number of live (non-tombstoned) nodes. */
  nodeCount() {
    return this.nodeMap.size;
  }
  /** Number of live (non-tombstoned) edges. */
  edgeCount() {
    return this.edgeMap.size;
  }
  hasNode(id) {
    return this.nodeMap.has(id);
  }
  hasEdge(id) {
    return this.edgeMap.has(id);
  }
  getNode(id) {
    const cold = this.nodeMap.get(id);
    if (!cold) return void 0;
    const pos = this.readPosition(id);
    const node = { ...cold };
    if (pos) node.position = pos;
    node.pinned = this.isPinned(id);
    node.hidden = this.isNodeHidden(id);
    return node;
  }
  getEdge(id) {
    const cold = this.edgeMap.get(id);
    if (!cold) return void 0;
    const edge = { ...cold };
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
  setNodeBoundingBox(id, box) {
    const cold = this.nodeMap.get(id);
    if (cold) cold.boundingBox = box;
  }
  *nodes() {
    for (const id of this.nodeMap.keys()) {
      const node = this.getNode(id);
      if (node) yield node;
    }
  }
  *edges() {
    for (const [id, cold] of this.edgeMap) yield { ...cold, hidden: this.isEdgeHidden(id) };
  }
  // ─── Adjacency ──────────────────────────────────────────────────────────
  outDegree(nodeId) {
    const slot = this.nodeCols.slot(nodeId);
    if (slot === void 0) return 0;
    return this.outAdj.degree(slot);
  }
  inDegree(nodeId) {
    const slot = this.nodeCols.slot(nodeId);
    if (slot === void 0) return 0;
    return this.inAdj.degree(slot);
  }
  /**
   * Yield edges incident to `nodeId` in the requested direction.
   * `'out'` — edges where `nodeId` is the source.
   * `'in'`  — edges where `nodeId` is the target.
   * `'both'` — out then in.
   */
  *edgesOf(nodeId, dir = "both") {
    const slot = this.nodeCols.slot(nodeId);
    if (slot === void 0) return;
    if (dir === "out" || dir === "both") {
      const view = this.outAdj.view(slot);
      for (let i = 0; i < view.length; i++) {
        const edgeId = this.edgeCols.idAt(view[i]);
        if (edgeId !== void 0) {
          const cold = this.edgeMap.get(edgeId);
          if (cold) yield { ...cold };
        }
      }
    }
    if (dir === "in" || dir === "both") {
      const view = this.inAdj.view(slot);
      for (let i = 0; i < view.length; i++) {
        const edgeId = this.edgeCols.idAt(view[i]);
        if (edgeId !== void 0) {
          const cold = this.edgeMap.get(edgeId);
          if (cold) yield { ...cold };
        }
      }
    }
  }
  /** Yield neighbor node ids in the requested direction. */
  *neighborsOf(nodeId, dir = "both") {
    const slot = this.nodeCols.slot(nodeId);
    if (slot === void 0) return;
    const srcCol = this.edgeCols.column("srcSlot");
    const dstCol = this.edgeCols.column("dstSlot");
    if (dir === "out" || dir === "both") {
      const view = this.outAdj.view(slot);
      for (let i = 0; i < view.length; i++) {
        const otherSlot = dstCol[view[i]];
        const otherId = this.nodeCols.idAt(otherSlot);
        if (otherId !== void 0) yield otherId;
      }
    }
    if (dir === "in" || dir === "both") {
      const view = this.inAdj.view(slot);
      for (let i = 0; i < view.length; i++) {
        const otherSlot = srcCol[view[i]];
        const otherId = this.nodeCols.idAt(otherSlot);
        if (otherId !== void 0) yield otherId;
      }
    }
  }
  // ─── Hierarchy ──────────────────────────────────────────────────────────
  parentOf(id) {
    return this.nodeMap.get(id)?.parentId;
  }
  *childrenOf(parentId) {
    const set = this.childrenIndex.get(parentId);
    if (!set) return;
    for (const childId of set) yield childId;
  }
  *descendantsOf(id) {
    const stack = [];
    const initial = this.childrenIndex.get(id);
    if (initial) for (const c of initial) stack.push(c);
    while (stack.length > 0) {
      const next = stack.pop();
      yield next;
      const kids = this.childrenIndex.get(next);
      if (kids) for (const c of kids) stack.push(c);
    }
  }
  *ancestorsOf(id) {
    let cursor = this.parentOf(id);
    while (cursor !== void 0) {
      yield cursor;
      cursor = this.parentOf(cursor);
    }
  }
  // ─── Positions ──────────────────────────────────────────────────────────
  getPosition(id) {
    return this.readPosition(id);
  }
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
  hasPosition(id) {
    const slot = this.nodeCols.slot(id);
    if (slot === void 0) return false;
    return (this.nodeCols.column("flags")[slot] & FLAG_PLACED) !== 0;
  }
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
  nodeIdsWithin(cx, cy, r, out = []) {
    out.length = 0;
    if (!(r > 0)) return out;
    const xs = this.nodeCols.column("x");
    const ys = this.nodeCols.column("y");
    const r2 = r * r;
    this.nodeCols.forEach((id, slot) => {
      const dx = xs[slot] - cx;
      const dy = ys[slot] - cy;
      if (dx * dx + dy * dy <= r2 && this.isNodeVisible(id)) out.push(id);
    });
    return out;
  }
  /**
   * Set a single node's position.
   *
   * Default fires `node:update`. `opts.silent: true` skips the event and just
   * bumps `version` — use for layout sim ticks at 60fps.
   */
  setPosition(id, pos, opts) {
    const slot = this.nodeCols.slot(id);
    if (slot === void 0) return;
    const xCol = this.nodeCols.column("x");
    const yCol = this.nodeCols.column("y");
    xCol[slot] = pos.x;
    yCol[slot] = pos.y;
    const flagsCol = this.nodeCols.column("flags");
    flagsCol[slot] = flagsCol[slot] | FLAG_PLACED;
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
  setPositionsBulk(ids, xy, opts) {
    if (xy.length !== ids.length * 2) {
      throw new Error(
        `GraphStore.setPositionsBulk: xy.length=${xy.length} must equal ids.length*2=${ids.length * 2}`
      );
    }
    const xCol = this.nodeCols.column("x");
    const yCol = this.nodeCols.column("y");
    const flagsCol = this.nodeCols.column("flags");
    const silent = !!opts?.silent;
    for (let i = 0; i < ids.length; i++) {
      const slot = this.nodeCols.slot(ids[i]);
      if (slot === void 0) continue;
      const x = xy[i * 2];
      const y = xy[i * 2 + 1];
      xCol[slot] = x;
      yCol[slot] = y;
      flagsCol[slot] = flagsCol[slot] | FLAG_PLACED;
      if (!silent) {
        this.enqueueNodeUpdate(ids[i], { position: { x, y } });
      }
    }
    this.nodeCols.touch();
    this._version++;
    if (!silent) this.scheduleFlushIfNeeded();
  }
  setPinned(id, pinned) {
    const slot = this.nodeCols.slot(id);
    if (slot === void 0) return;
    const flagsCol = this.nodeCols.column("flags");
    const prev = flagsCol[slot];
    const next = pinned ? prev | FLAG_PINNED : prev & ~FLAG_PINNED;
    if (next === prev) return;
    flagsCol[slot] = next;
    this.nodeCols.touch();
    this._version++;
    if (this.recording) this.record({ kind: "updateNode", id, before: { pinned: !pinned }, after: { pinned } });
    this.enqueueNodeUpdate(id, { pinned });
    this.scheduleFlushIfNeeded();
  }
  isPinned(id) {
    const slot = this.nodeCols.slot(id);
    if (slot === void 0) return false;
    return (this.nodeCols.column("flags")[slot] & FLAG_PINNED) !== 0;
  }
  *pinnedIds() {
    const flagsCol = this.nodeCols.column("flags");
    for (const id of this.nodeMap.keys()) {
      const slot = this.nodeCols.slot(id);
      if (slot === void 0) continue;
      if ((flagsCol[slot] & FLAG_PINNED) !== 0) yield id;
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
  hideNode(id) {
    if (this.applyNodeHidden(id, true)) this.scheduleFlushIfNeeded();
  }
  /** Show a node (clear its explicit hidden flag). Idempotent. */
  showNode(id) {
    if (this.applyNodeHidden(id, false)) this.scheduleFlushIfNeeded();
  }
  /** Set a node's explicit hidden flag. Idempotent. */
  setNodeHidden(id, hidden) {
    if (this.applyNodeHidden(id, hidden)) this.scheduleFlushIfNeeded();
  }
  /** Flip a node's explicit hidden flag. Returns the resulting hidden state. */
  toggleNodeHidden(id) {
    this.setNodeHidden(id, !this.isNodeHidden(id));
    return this.isNodeHidden(id);
  }
  /** True iff the node's **explicit** hidden flag is set (O(1)). */
  isNodeHidden(id) {
    const slot = this.nodeCols.slot(id);
    if (slot === void 0) return false;
    return (this.nodeCols.column("flags")[slot] & FLAG_HIDDEN) !== 0;
  }
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
  isNodeVisible(id) {
    if (!this.nodeMap.has(id)) return false;
    if (this.isNodeHidden(id)) return false;
    if (this.collapseHidden.has(id)) return false;
    if (this.isPlacementWithheld(id)) return false;
    return true;
  }
  /**
   * True while a layout owns placement and this node has never been placed —
   * its stored `(0, 0)` is the zero-filled default, not a position anyone
   * chose. Shared by {@link isNodeVisible} and {@link isEdgeVisible}.
   */
  isPlacementWithheld(id) {
    return this._placementPending && !this.hasPosition(id);
  }
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
  setCollapseHidden(ids) {
    const next = ids instanceof Set ? ids : new Set(ids);
    const prev = this.collapseHidden;
    const touched = [];
    for (const id of next) if (!prev.has(id)) touched.push(id);
    for (const id of prev) if (!next.has(id)) touched.push(id);
    if (touched.length === 0) return;
    this.collapseHidden = next;
    for (const id of touched) {
      this.events.emit("node:visibility", { nodeId: id, hidden: !this.isNodeVisible(id) });
    }
    this.scheduleFlushIfNeeded();
  }
  /** True iff the node is withheld because an ancestor group is collapsed. */
  isCollapseHidden(id) {
    return this.collapseHidden.has(id);
  }
  /**
   * Whether a layout currently owns placement and has not yet reported a run.
   *
   * While true, a node that has never been placed ({@link hasPosition}) is not
   * visible: its stored position is the zero-filled default, not a position
   * anyone chose, and drawing it puts every unplaced node on top of every other
   * at the origin. Set by the owning layer, which is what sees `layout:run:*`.
   */
  get placementPending() {
    return this._placementPending;
  }
  /** Set {@link placementPending}. Fires `node:visibility` for affected nodes. */
  setPlacementPending(pending) {
    if (this._placementPending === pending) return;
    this._placementPending = pending;
    for (const id of this.nodeMap.keys()) {
      if (this.hasPosition(id)) continue;
      this.events.emit("node:visibility", { nodeId: id, hidden: !this.isNodeVisible(id) });
    }
    this.scheduleFlushIfNeeded();
  }
  /** Hide many nodes in one batch → one flush. */
  hideNodes(ids) {
    this.batch(() => {
      for (const id of ids) this.hideNode(id);
    });
  }
  /** Show many nodes in one batch → one flush. */
  showNodes(ids) {
    this.batch(() => {
      for (const id of ids) this.showNode(id);
    });
  }
  /** Set the hidden flag on many nodes in one batch → one flush. */
  setNodesHidden(ids, hidden) {
    this.batch(() => {
      for (const id of ids) this.setNodeHidden(id, hidden);
    });
  }
  /** Ids of every explicitly-hidden node (O(1)-tracked, no scan). */
  *hiddenNodes() {
    for (const id of this.hiddenNodeIds) yield id;
  }
  /** Count of explicitly-hidden nodes (O(1)). */
  hiddenNodeCount() {
    return this.hiddenNodeIds.size;
  }
  /** Hide an edge. Idempotent; usable inside a caller's `batch()`. */
  hideEdge(id) {
    if (this.applyEdgeHidden(id, true)) this.scheduleFlushIfNeeded();
  }
  /** Show an edge (clear its explicit hidden flag). Idempotent. */
  showEdge(id) {
    if (this.applyEdgeHidden(id, false)) this.scheduleFlushIfNeeded();
  }
  /** Set an edge's explicit hidden flag. Idempotent. */
  setEdgeHidden(id, hidden) {
    if (this.applyEdgeHidden(id, hidden)) this.scheduleFlushIfNeeded();
  }
  /** Flip an edge's explicit hidden flag. Returns the resulting hidden state. */
  toggleEdgeHidden(id) {
    this.setEdgeHidden(id, !this.isEdgeHidden(id));
    return this.isEdgeHidden(id);
  }
  /** True iff the edge's **explicit** hidden flag is set (O(1)). */
  isEdgeHidden(id) {
    const slot = this.edgeCols.slot(id);
    if (slot === void 0) return false;
    return (this.edgeCols.column("flags")[slot] & FLAG_HIDDEN) !== 0;
  }
  /**
   * Effective visibility of an edge — live, not explicitly hidden, and with
   * **both endpoints visible**. This is the derived rule the renderer/hit-test
   * consult; hiding a node makes its incident edges return `false` here without
   * flagging them.
   */
  isEdgeVisible(id) {
    const cold = this.edgeMap.get(id);
    if (!cold) return false;
    if (this.isEdgeHidden(id)) return false;
    if (this.isNodeHidden(cold.source)) return false;
    if (this.isNodeHidden(cold.target)) return false;
    if (this.isPlacementWithheld(cold.source)) return false;
    if (this.isPlacementWithheld(cold.target)) return false;
    return true;
  }
  /** Hide many edges in one batch → one flush. */
  hideEdges(ids) {
    this.batch(() => {
      for (const id of ids) this.hideEdge(id);
    });
  }
  /** Show many edges in one batch → one flush. */
  showEdges(ids) {
    this.batch(() => {
      for (const id of ids) this.showEdge(id);
    });
  }
  /** Set the hidden flag on many edges in one batch → one flush. */
  setEdgesHidden(ids, hidden) {
    this.batch(() => {
      for (const id of ids) this.setEdgeHidden(id, hidden);
    });
  }
  /** Ids of every explicitly-hidden edge (O(1)-tracked, no scan). */
  *hiddenEdges() {
    for (const id of this.hiddenEdgeIds) yield id;
  }
  /** Count of explicitly-hidden edges (O(1)). */
  hiddenEdgeCount() {
    return this.hiddenEdgeIds.size;
  }
  /** Clear every explicit hidden flag (nodes + edges) in one batch → one flush. */
  showAllHidden() {
    this.batch(() => {
      for (const id of [...this.hiddenNodeIds]) this.showNode(id);
      for (const id of [...this.hiddenEdgeIds]) this.showEdge(id);
    });
  }
  /** Hide every node for which `fn` returns true, in one batch → one flush. */
  hideNodesByPredicate(fn) {
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
  applyNodeHidden(id, hidden) {
    const slot = this.nodeCols.slot(id);
    if (slot === void 0) return false;
    const flagsCol = this.nodeCols.column("flags");
    const prev = flagsCol[slot];
    const next = hidden ? prev | FLAG_HIDDEN : prev & ~FLAG_HIDDEN;
    if (next === prev) return false;
    flagsCol[slot] = next;
    if (hidden) this.hiddenNodeIds.add(id);
    else this.hiddenNodeIds.delete(id);
    this.nodeCols.touch();
    this._version++;
    if (this.recording) this.record({ kind: "setHidden", element: "node", ids: [id], hidden });
    if (hidden) this.clearNodeRuntimeStatesOf(id);
    this.enqueueNodeVisibility(id, hidden);
    return true;
  }
  /** Edge sibling of {@link applyNodeHidden}. */
  applyEdgeHidden(id, hidden) {
    const slot = this.edgeCols.slot(id);
    if (slot === void 0) return false;
    const flagsCol = this.edgeCols.column("flags");
    const prev = flagsCol[slot];
    const next = hidden ? prev | FLAG_HIDDEN : prev & ~FLAG_HIDDEN;
    if (next === prev) return false;
    flagsCol[slot] = next;
    if (hidden) this.hiddenEdgeIds.add(id);
    else this.hiddenEdgeIds.delete(id);
    this.edgeCols.touch();
    this._version++;
    if (this.recording) this.record({ kind: "setHidden", element: "edge", ids: [id], hidden });
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
  clearNodeRuntimeStatesOf(id) {
    const set = this.nodeRuntimeStates.get(id);
    if (!set || set.size === 0) return;
    const names = [...set];
    this.nodeRuntimeStates.delete(id);
    for (const name of names) this.enqueueNodeState(id, name);
  }
  /** Edge sibling of {@link clearNodeRuntimeStatesOf}. */
  clearEdgeRuntimeStatesOf(id) {
    const set = this.edgeRuntimeStates.get(id);
    if (!set || set.size === 0) return;
    const names = [...set];
    this.edgeRuntimeStates.delete(id);
    for (const name of names) this.enqueueEdgeState(id, name);
  }
  // ─── CRUD: nodes ────────────────────────────────────────────────────────
  /** Strict add — throws on duplicate. */
  addNode(node) {
    if (this.nodeMap.has(node.id)) {
      throw new Error(`GraphStore.addNode: duplicate id "${node.id}"`);
    }
    this.installNode(node);
    if (this.recording) this.recordAdd("addNode", node);
    this.scheduleFlushIfNeeded();
  }
  /** Add-or-merge. Streaming-friendly path. */
  upsertNode(node) {
    if (this.nodeMap.has(node.id)) {
      this.updateNode(node.id, node);
      return;
    }
    this.installNode(node);
    if (this.recording) this.recordAdd("addNode", node);
    this.scheduleFlushIfNeeded();
  }
  updateNode(id, patch) {
    const cold = this.nodeMap.get(id);
    if (!cold) return;
    const slot = this.nodeCols.slot(id);
    const before = this.recording ? this.captureNodeBefore(id, patch) : null;
    if ("parentId" in patch && patch.parentId !== cold.parentId) {
      if (patch.parentId !== void 0) {
        if (patch.parentId === id) {
          throw new Error(`GraphStore.updateNode: parentId cycle (self-parent) on "${id}"`);
        }
        if (this.wouldCreateCycle(id, patch.parentId)) {
          throw new Error(
            `GraphStore.updateNode: parentId cycle \u2014 "${patch.parentId}" is a descendant of "${id}"`
          );
        }
      }
      if (cold.parentId !== void 0) {
        this.childrenIndex.get(cold.parentId)?.delete(id);
      }
      if (patch.parentId !== void 0) {
        let set = this.childrenIndex.get(patch.parentId);
        if (!set) {
          set = /* @__PURE__ */ new Set();
          this.childrenIndex.set(patch.parentId, set);
        }
        set.add(id);
      }
      cold.parentId = patch.parentId;
    }
    if ("data" in patch) cold.data = patch.data;
    if ("states" in patch) cold.states = patch.states ?? void 0;
    if ("state" in patch) cold.state = patch.state;
    if ("type" in patch) cold.type = patch.type || UNKNOWN_TYPE;
    if ("style" in patch) cold.style = patch.style;
    if ("position" in patch && patch.position !== void 0) {
      this.nodeCols.column("x")[slot] = patch.position.x;
      this.nodeCols.column("y")[slot] = patch.position.y;
      const posFlags = this.nodeCols.column("flags");
      posFlags[slot] = posFlags[slot] | FLAG_PLACED;
    }
    if ("pinned" in patch && patch.pinned !== void 0) {
      const flagsCol = this.nodeCols.column("flags");
      const prev = flagsCol[slot];
      flagsCol[slot] = patch.pinned ? prev | FLAG_PINNED : prev & ~FLAG_PINNED;
    }
    if ("hidden" in patch && patch.hidden !== void 0) {
      const hidden = patch.hidden;
      this.unrecorded(() => this.applyNodeHidden(id, hidden));
    }
    this.nodeCols.touch();
    this._version++;
    if (before) this.record({ kind: "updateNode", id, before, after: { ...patch } });
    this.enqueueNodeUpdate(id, patch);
    this.scheduleFlushIfNeeded();
  }
  /**
   * Remove a node. Cascades by default — removes all incident edges first.
   * `cascade: false` throws if any incident edges still exist.
   */
  removeNode(id, opts) {
    const cold = this.nodeMap.get(id);
    if (!cold) return;
    const slot = this.nodeCols.slot(id);
    const cascade = opts?.cascade ?? true;
    const outView = this.outAdj.view(slot);
    const inView = this.inAdj.view(slot);
    if (!cascade && (outView.length > 0 || inView.length > 0)) {
      throw new Error(
        `GraphStore.removeNode: "${id}" still has ${outView.length + inView.length} incident edges (pass { cascade: true })`
      );
    }
    const op = this.recording ? {
      kind: "removeNode",
      node: this.getNode(id),
      edges: this.incidentEdges(id),
      ...this.childrenIndex.get(id)?.size ? { orphanedChildIds: [...this.childrenIndex.get(id)] } : {}
    } : null;
    const incidentEdgeIds = [];
    for (let i = 0; i < outView.length; i++) {
      const eid = this.edgeCols.idAt(outView[i]);
      if (eid !== void 0) incidentEdgeIds.push(eid);
    }
    for (let i = 0; i < inView.length; i++) {
      const eid = this.edgeCols.idAt(inView[i]);
      if (eid !== void 0) incidentEdgeIds.push(eid);
    }
    this.unrecorded(() => {
      for (const eid of incidentEdgeIds) this.removeEdge(eid);
    });
    if (cold.parentId !== void 0) {
      this.childrenIndex.get(cold.parentId)?.delete(id);
    }
    const myChildren = this.childrenIndex.get(id);
    if (myChildren) {
      for (const childId of myChildren) {
        const childCold = this.nodeMap.get(childId);
        if (childCold) childCold.parentId = void 0;
      }
      this.childrenIndex.delete(id);
    }
    const flagsCol = this.nodeCols.column("flags");
    flagsCol[slot] = flagsCol[slot] | FLAG_TOMBSTONE;
    this.outAdj.clearSlot(slot);
    this.inAdj.clearSlot(slot);
    this.nodeMap.delete(id);
    this.nodeCols.remove(id);
    this.nodeRuntimeStates.delete(id);
    this.hiddenNodeIds.delete(id);
    this.nodeCols.touch();
    this._version++;
    if (op) this.record(op);
    this.enqueueNodeRemove(id);
    this.scheduleFlushIfNeeded();
    if (this.unknownEndpoint === "buffer") {
      const wereWaiting = this.pending.takeWaitingFor(id);
      for (const e of wereWaiting) {
        if (this.pending.has(e.id)) this.pending.unpark(e.id);
        this.enqueueEdgeOrphan(e.id);
      }
    }
  }
  // ─── CRUD: edges ────────────────────────────────────────────────────────
  addEdge(edge) {
    if (this.edgeMap.has(edge.id)) {
      throw new Error(`GraphStore.addEdge: duplicate id "${edge.id}"`);
    }
    const srcSlot = this.nodeCols.slot(edge.source);
    const dstSlot = this.nodeCols.slot(edge.target);
    if (srcSlot === void 0 || dstSlot === void 0) {
      this.handleUnknownEndpoint(edge, srcSlot === void 0, dstSlot === void 0);
      return;
    }
    this.installEdge(edge, srcSlot, dstSlot);
    if (this.recording) this.recordAdd("addEdge", edge);
    this.scheduleFlushIfNeeded();
  }
  upsertEdge(edge) {
    if (this.edgeMap.has(edge.id)) {
      this.updateEdge(edge.id, edge);
      return;
    }
    this.addEdge(edge);
  }
  updateEdge(id, patch) {
    const cold = this.edgeMap.get(id);
    if (!cold) return;
    const slot = this.edgeCols.slot(id);
    const before = this.recording ? this.captureEdgeBefore(id, patch) : null;
    if ("source" in patch || "target" in patch) {
      const nextSource = patch.source ?? cold.source;
      const nextTarget = patch.target ?? cold.target;
      const nextSrcSlot = this.nodeCols.slot(nextSource);
      const nextDstSlot = this.nodeCols.slot(nextTarget);
      if (nextSrcSlot === void 0 || nextDstSlot === void 0) {
        throw new Error(
          `GraphStore.updateEdge: re-pointing edge "${id}" to unknown endpoint "${nextSrcSlot === void 0 ? nextSource : nextTarget}"`
        );
      }
      const oldSrcSlot = this.nodeCols.slot(cold.source);
      const oldDstSlot = this.nodeCols.slot(cold.target);
      this.outAdj.remove(oldSrcSlot, slot);
      this.inAdj.remove(oldDstSlot, slot);
      this.outAdj.add(nextSrcSlot, slot);
      this.inAdj.add(nextDstSlot, slot);
      this.edgeCols.column("srcSlot")[slot] = nextSrcSlot;
      this.edgeCols.column("dstSlot")[slot] = nextDstSlot;
      cold.source = nextSource;
      cold.target = nextTarget;
    }
    if ("type" in patch) cold.type = patch.type || UNKNOWN_TYPE;
    if ("data" in patch) cold.data = patch.data;
    if ("states" in patch) cold.states = patch.states ?? void 0;
    if ("state" in patch) cold.state = patch.state;
    if ("style" in patch) cold.style = patch.style;
    if ("hidden" in patch && patch.hidden !== void 0) {
      const hidden = patch.hidden;
      this.unrecorded(() => this.applyEdgeHidden(id, hidden));
    }
    this.edgeCols.touch();
    this._version++;
    if (before) this.record({ kind: "updateEdge", id, before, after: { ...patch } });
    this.enqueueEdgeUpdate(id, patch);
    this.scheduleFlushIfNeeded();
  }
  /**
   * Reverse an edge's direction — swap its `source` and `target`. No-op if the
   * edge doesn't exist. Routes through {@link updateEdge}, so adjacency indexes
   * are rewired and an `edge:update` is enqueued like any other re-pointing.
   */
  reverseEdge(id) {
    const cold = this.edgeMap.get(id);
    if (!cold) return;
    this.updateEdge(id, { source: cold.target, target: cold.source });
  }
  removeEdge(id) {
    const cold = this.edgeMap.get(id);
    if (!cold) return;
    if (this.recording) this.record({ kind: "removeEdge", edge: this.getEdge(id) });
    const slot = this.edgeCols.slot(id);
    const srcSlot = this.nodeCols.slot(cold.source);
    const dstSlot = this.nodeCols.slot(cold.target);
    if (srcSlot !== void 0) this.outAdj.remove(srcSlot, slot);
    if (dstSlot !== void 0) this.inAdj.remove(dstSlot, slot);
    const flagsCol = this.edgeCols.column("flags");
    flagsCol[slot] = flagsCol[slot] | FLAG_TOMBSTONE;
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
  addNodeState(id, name, _opts) {
    if (!this.nodeMap.has(id)) return;
    let set = this.nodeRuntimeStates.get(id);
    if (set?.has(name)) return;
    if (!set) {
      set = /* @__PURE__ */ new Set();
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
  removeNodeState(id, name, _opts) {
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
  setNodeState(id, name, on = true, opts) {
    if (on) this.addNodeState(id, name, opts);
    else this.removeNodeState(id, name, opts);
  }
  /** Toggle a runtime (presence) state on an edge. See {@link setNodeState}. */
  setEdgeState(id, name, on = true, opts) {
    if (on) this.addEdgeState(id, name, opts);
    else this.removeEdgeState(id, name, opts);
  }
  /**
   * Strip a runtime (presence) state from every node that carries it, in one
   * pass — e.g. clearing a transient `'selected'` / `'lineage'` set. Touches the
   * presence compartment only; a document state of the same name in `states[]`
   * is unaffected (change those via {@link updateNode}).
   */
  clearNodeState(name) {
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
  addEdgeState(id, name, _opts) {
    if (!this.edgeMap.has(id)) return;
    let set = this.edgeRuntimeStates.get(id);
    if (set?.has(name)) return;
    if (!set) {
      set = /* @__PURE__ */ new Set();
      this.edgeRuntimeStates.set(id, set);
    }
    set.add(name);
    this._version++;
    this.enqueueEdgeState(id, name, _opts?.actor);
    this.scheduleFlushIfNeeded();
  }
  /** Remove a runtime (presence) state from an edge. See {@link removeNodeState}. */
  removeEdgeState(id, name, _opts) {
    const set = this.edgeRuntimeStates.get(id);
    if (!set?.has(name)) return;
    set.delete(name);
    if (set.size === 0) this.edgeRuntimeStates.delete(id);
    this._version++;
    this.enqueueEdgeState(id, name, _opts?.actor);
    this.scheduleFlushIfNeeded();
  }
  /** Strip a runtime (presence) state from every edge. See {@link clearNodeState}. */
  clearEdgeState(name) {
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
  nodeStatesOf(id) {
    const doc = this.nodeMap.get(id)?.states;
    const runtime = this.nodeRuntimeStates.get(id);
    if (!runtime || runtime.size === 0) return doc ? [...doc] : [];
    if (!doc || doc.length === 0) return [...runtime];
    const out = new Set(doc);
    for (const name of runtime) out.add(name);
    return [...out];
  }
  /** Effective active states of an edge — union of document + presence. */
  edgeStatesOf(id) {
    const doc = this.edgeMap.get(id)?.states;
    const runtime = this.edgeRuntimeStates.get(id);
    if (!runtime || runtime.size === 0) return doc ? [...doc] : [];
    if (!doc || doc.length === 0) return [...runtime];
    const out = new Set(doc);
    for (const name of runtime) out.add(name);
    return [...out];
  }
  /** True iff `name` is in a node's effective (document ∪ presence) state set. */
  hasNodeState(id, name) {
    if (this.nodeRuntimeStates.get(id)?.has(name)) return true;
    return this.nodeMap.get(id)?.states?.includes(name) ?? false;
  }
  /** True iff `name` is in an edge's effective (document ∪ presence) state set. */
  hasEdgeState(id, name) {
    if (this.edgeRuntimeStates.get(id)?.has(name)) return true;
    return this.edgeMap.get(id)?.states?.includes(name) ?? false;
  }
  /**
   * Ids of every node whose effective (document ∪ presence) state set contains
   * `name`. Scans live nodes; useful for snapshots / iteration.
   */
  *nodesWithState(name) {
    for (const id of this.nodeMap.keys()) {
      if (this.nodeRuntimeStates.get(id)?.has(name)) {
        yield id;
        continue;
      }
      if (this.nodeMap.get(id)?.states?.includes(name)) yield id;
    }
  }
  /** Edge sibling of {@link nodesWithState}. */
  *edgesWithState(name) {
    for (const [id, cold] of this.edgeMap) {
      if (this.edgeRuntimeStates.get(id)?.has(name) || cold.states?.includes(name)) {
        yield id;
      }
    }
  }
  // ─── Bulk operations ────────────────────────────────────────────────────
  addNodesBulk(nodes) {
    this.batch(() => {
      for (const n of nodes) this.addNode(n);
    });
  }
  addEdgesBulk(edges) {
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
  addData(data) {
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
  applyDelta(delta, opts = {}) {
    if (opts.actor !== void 0 && this.recordActor === void 0) this.recordActor = opts.actor;
    if (opts.coalesce && this.batchDepth === 0) this.recordCoalesce = true;
    const label2 = opts.title !== void 0 ? { title: opts.title, ...opts.actor !== void 0 ? { actor: opts.actor } : {} } : {};
    this.batch(() => this.applyDeltaBody(delta), label2);
  }
  /** The body of {@link applyDelta}, in its documented order. */
  applyDeltaBody(delta) {
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
    for (const [change, hidden] of [
      [delta.hidden, true],
      [delta.shown, false]
    ]) {
      for (const id of change?.nodeIds ?? []) this.setNodeHidden(id, hidden);
      for (const id of change?.edgeIds ?? []) this.setEdgeHidden(id, hidden);
    }
    for (const p of delta.pinned ?? []) {
      if (!this.hasNode(p.id)) continue;
      const pinned = p.pinned ?? true;
      if (p.x !== void 0 && p.y !== void 0) this.updateNode(p.id, { pinned, position: { x: p.x, y: p.y } });
      else this.setPinned(p.id, pinned);
    }
  }
  // ─── Reactivity ─────────────────────────────────────────────────────────
  /**
   * Coalesce all mutations inside `fn` into a single flush and — with a log
   * attached — a single history entry. Nested `batch` calls flush and record
   * only on the outermost exit.
   *
   * `opts.title` labels the entry (`'paste'`, `'delete selection'`) and
   * `opts.actor` attributes it; both apply to the outermost batch only. The
   * entry is all or nothing: if `fn` throws, what it wrote is reverted.
   */
  batch(fn, opts = {}) {
    const log = this.log;
    if ((opts.title !== void 0 || opts.actor !== void 0) && log && this.recording && this.batchDepth === 0 && !log.replaying) {
      const meta = {
        ...opts.title !== void 0 ? { title: opts.title } : {},
        ...opts.actor !== void 0 ? { actor: opts.actor } : {}
      };
      return log.group(meta, () => this.runBatch(fn));
    }
    return this.runBatch(fn);
  }
  /** {@link batch} without the entry label: one flush, one recorded part on the outermost exit. */
  runBatch(fn) {
    this.batchDepth++;
    try {
      return fn();
    } finally {
      this.batchDepth--;
      if (this.batchDepth === 0) {
        this.commitRecording();
        this.scheduleFlushIfNeeded();
        if (this.flushMode === "sync") this.doFlush();
      }
    }
  }
  /**
   * Drain any pending events. Cancels the RAF-scheduled flush (frame mode).
   * In sync mode this still works — handy for forcing the TTL eviction sweep
   * even if no mutation has happened since the last flush.
   */
  flush() {
    this.flushScheduler?.cancel();
    this.doFlush();
  }
  /**
   * {@link DataSource} (D13) — subscribe to a coalesced {@link LayerFlush} delta
   * projected from this store's per-flush changes (position-only updates → `moved`).
   * Distinct from `events.on('flush', …)` (which carries aggregate counters): this
   * is what `CanvasStore` bridges onto `data:flush`. Returns an unsubscribe.
   */
  onFlush(listener) {
    this.flushListeners.add(listener);
    return () => this.flushListeners.delete(listener);
  }
  /**
   * {@link DataSource} (D13) — set the flush trigger. The engine drives `'manual'`
   * (its single rAF loop calls {@link flush}); kernel `'frame'`/`'microtask'` both
   * map to GraphStore's frame scheduler. GraphStore's native `'sync'` is the
   * constructor default and isn't reachable through this setter.
   */
  setFlushMode(mode) {
    this.flushMode = mode === "manual" ? "manual" : "frame";
    if (this.flushMode === "frame" && !this.flushScheduler) {
      this.flushScheduler = new FrameFlushScheduler(() => this.doFlush());
    }
  }
  /**
   * Wipe all data. Cancels any pending flush. **Silent** — no per-element
   * events (`GraphLayer.clear` / `setData` detach the renderer themselves).
   * Recorded as one `clear` op holding what it removed, so undo re-adds it.
   */
  clear() {
    if (this.recording && (this.nodeMap.size > 0 || this.edgeMap.size > 0)) {
      this.record({ kind: "clear", nodes: [...this.nodes()], edges: [...this.edges()] });
    }
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
  compact() {
    const xCol = this.nodeCols.column("x");
    const yCol = this.nodeCols.column("y");
    const flagsCol = this.nodeCols.column("flags");
    const nodeSnapshot = /* @__PURE__ */ new Map();
    for (const id of this.nodeMap.keys()) {
      const slot = this.nodeCols.slot(id);
      if (slot === void 0) continue;
      nodeSnapshot.set(id, {
        x: xCol[slot],
        y: yCol[slot],
        flags: flagsCol[slot] & ~FLAG_TOMBSTONE
        // strip tombstone bit on rebuild
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
      if (srcSlot === void 0 || dstSlot === void 0) continue;
      const slot = this.edgeCols.add(id, {
        srcSlot,
        dstSlot,
        flags: this.hiddenEdgeIds.has(id) ? FLAG_HIDDEN : 0
      });
      this.outAdj.add(srcSlot, slot);
      this.inAdj.add(dstSlot, slot);
    }
    this._version++;
  }
  // ─── Internals ──────────────────────────────────────────────────────────
  installNode(node) {
    if (node.parentId !== void 0) {
      if (node.parentId === node.id) {
        throw new Error(`GraphStore: parentId cycle (self-parent) on "${node.id}"`);
      }
    }
    const slot = this.nodeCols.add(node.id, {
      x: node.position?.x ?? 0,
      y: node.position?.y ?? 0,
      // A record that arrives without a `position` is *unplaced*, not at the
      // origin — the distinction a layout needs to snap rather than glide it.
      flags: (node.pinned ? FLAG_PINNED : 0) | (node.hidden ? FLAG_HIDDEN : 0) | (node.position !== void 0 ? FLAG_PLACED : 0)
    });
    this.outAdj.ensureCapacity(slot);
    this.inAdj.ensureCapacity(slot);
    if (node.hidden) this.hiddenNodeIds.add(node.id);
    const cold = { id: node.id, type: UNKNOWN_TYPE };
    if (node.data !== void 0) cold.data = node.data;
    if (node.parentId !== void 0) cold.parentId = node.parentId;
    if (node.states !== void 0) cold.states = node.states;
    if (node.state !== void 0) cold.state = node.state;
    cold.type = node.type || UNKNOWN_TYPE;
    if (node.style !== void 0) cold.style = node.style;
    this.nodeMap.set(node.id, cold);
    if (node.parentId !== void 0) {
      let set = this.childrenIndex.get(node.parentId);
      if (!set) {
        set = /* @__PURE__ */ new Set();
        this.childrenIndex.set(node.parentId, set);
      }
      set.add(node.id);
    }
    this._version++;
    this.enqueueNodeAdd(node.id);
    if (this.unknownEndpoint === "buffer") {
      const candidates = this.pending.takeWaitingFor(node.id);
      for (const edge of candidates) this.tryAdmitPending(edge);
    }
  }
  installEdge(edge, srcSlot, dstSlot) {
    const slot = this.edgeCols.add(edge.id, {
      srcSlot,
      dstSlot,
      flags: edge.hidden ? FLAG_HIDDEN : 0
    });
    this.outAdj.add(srcSlot, slot);
    this.inAdj.add(dstSlot, slot);
    if (edge.hidden) this.hiddenEdgeIds.add(edge.id);
    const cold = {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      // See the note in `installNode` — `||` catches `''` as well as nullish.
      type: edge.type || UNKNOWN_TYPE
    };
    if (edge.data !== void 0) cold.data = edge.data;
    if (edge.states !== void 0) cold.states = edge.states;
    if (edge.state !== void 0) cold.state = edge.state;
    if (edge.style !== void 0) cold.style = edge.style;
    this.edgeMap.set(edge.id, cold);
    this._version++;
    this.enqueueEdgeAdd(edge.id);
  }
  handleUnknownEndpoint(edge, srcMissing, dstMissing) {
    switch (this.unknownEndpoint) {
      case "throw": {
        const missing = srcMissing ? edge.source : edge.target;
        throw new Error(`GraphStore.addEdge: unknown endpoint "${missing}" on edge "${edge.id}"`);
      }
      case "drop":
        return;
      case "buffer": {
        const missingIds = [];
        if (srcMissing) missingIds.push(edge.source);
        if (dstMissing) missingIds.push(edge.target);
        this.pending.park(edge, missingIds, this._frame);
        this.scheduleFlushIfNeeded();
        return;
      }
    }
  }
  tryAdmitPending(edge) {
    const srcSlot = this.nodeCols.slot(edge.source);
    const dstSlot = this.nodeCols.slot(edge.target);
    if (srcSlot === void 0 || dstSlot === void 0) {
      const missingIds = [];
      if (srcSlot === void 0) missingIds.push(edge.source);
      if (dstSlot === void 0) missingIds.push(edge.target);
      this.pending.park(edge, missingIds, this._frame);
      return;
    }
    if (this.edgeMap.has(edge.id)) return;
    this.installEdge(edge, srcSlot, dstSlot);
  }
  /** True iff `candidateAncestor` is already a descendant of `id`. */
  wouldCreateCycle(id, candidateAncestor) {
    for (const desc of this.descendantsOf(id)) {
      if (desc === candidateAncestor) return true;
    }
    return false;
  }
  readPosition(id) {
    const slot = this.nodeCols.slot(id);
    if (slot === void 0) return void 0;
    const x = this.nodeCols.column("x")[slot];
    const y = this.nodeCols.column("y")[slot];
    return { x, y };
  }
  // Event queue management — dedups within a flush window.
  enqueueNodeAdd(id) {
    if (this.pendingNodeRemoves.delete(id)) {
      this.counters.removedNodes = Math.max(0, this.counters.removedNodes - 1);
    }
    this.pendingNodeAdds.add(id);
    this.pendingNodeUpdates.delete(id);
    this.counters.addedNodes++;
  }
  enqueueNodeUpdate(id, patch) {
    if (this.pendingNodeAdds.has(id)) return;
    if (this.pendingNodeRemoves.has(id)) return;
    const existing = this.pendingNodeUpdates.get(id);
    if (existing) {
      Object.assign(existing, patch);
    } else {
      this.pendingNodeUpdates.set(id, { ...patch });
      this.counters.updatedNodes++;
    }
  }
  enqueueNodeRemove(id) {
    if (this.pendingNodeAdds.delete(id)) {
      this.counters.addedNodes = Math.max(0, this.counters.addedNodes - 1);
      this.pendingNodeUpdates.delete(id);
      return;
    }
    this.pendingNodeUpdates.delete(id);
    this.pendingNodeRemoves.add(id);
    this.counters.removedNodes++;
  }
  enqueueEdgeAdd(id) {
    if (this.pendingEdgeRemoves.delete(id)) {
      this.counters.removedEdges = Math.max(0, this.counters.removedEdges - 1);
    }
    this.pendingEdgeAdds.add(id);
    this.pendingEdgeUpdates.delete(id);
    this.counters.addedEdges++;
  }
  enqueueEdgeUpdate(id, patch) {
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
  enqueueEdgeRemove(id) {
    if (this.pendingEdgeAdds.delete(id)) {
      this.counters.addedEdges = Math.max(0, this.counters.addedEdges - 1);
      this.pendingEdgeUpdates.delete(id);
      return;
    }
    this.pendingEdgeUpdates.delete(id);
    this.pendingEdgeRemoves.add(id);
    this.counters.removedEdges++;
  }
  enqueueEdgeOrphan(id) {
    this.pendingEdgeOrphans.add(id);
  }
  /** Queue a node runtime-state change, deduped per `(id, name)` per flush. */
  enqueueNodeState(id, name, actor) {
    this.pendingNodeStates.set(`${id}\0${name}`, { id, name, actor });
  }
  /** Queue an edge runtime-state change, deduped per `(id, name)` per flush. */
  enqueueEdgeState(id, name, actor) {
    this.pendingEdgeStates.set(`${id}\0${name}`, { id, name, actor });
  }
  /** Queue a node explicit-visibility change; last value per id wins per flush. */
  enqueueNodeVisibility(id, hidden) {
    this.pendingNodeVisibility.set(id, hidden);
  }
  /** Queue an edge explicit-visibility change; last value per id wins per flush. */
  enqueueEdgeVisibility(id, hidden) {
    this.pendingEdgeVisibility.set(id, hidden);
  }
  scheduleFlushIfNeeded() {
    if (this.batchDepth > 0) return;
    if (this.flushMode === "manual") return;
    if (this.flushMode === "frame") {
      this.flushScheduler?.request();
      return;
    }
    this.doFlush();
  }
  doFlush() {
    this._frame++;
    if (this.unknownEndpoint === "buffer" && Number.isFinite(this.pendingEdgeTTL)) {
      const stale = [];
      for (const e of this.pending.expired(this._frame, this.pendingEdgeTTL)) stale.push(e.id);
      for (const eid of stale) {
        this.pending.unpark(eid);
        this.pendingEdgeOrphans.add(eid);
      }
    }
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
    this.pendingNodeAdds = /* @__PURE__ */ new Set();
    this.pendingNodeUpdates = /* @__PURE__ */ new Map();
    this.pendingNodeRemoves = /* @__PURE__ */ new Set();
    this.pendingEdgeAdds = /* @__PURE__ */ new Set();
    this.pendingEdgeUpdates = /* @__PURE__ */ new Map();
    this.pendingEdgeRemoves = /* @__PURE__ */ new Set();
    this.pendingEdgeOrphans = /* @__PURE__ */ new Set();
    this.pendingNodeStates = /* @__PURE__ */ new Map();
    this.pendingEdgeStates = /* @__PURE__ */ new Map();
    this.pendingNodeVisibility = /* @__PURE__ */ new Map();
    this.pendingEdgeVisibility = /* @__PURE__ */ new Map();
    this.counters = emptyCounters();
    if (nodeAdds.size === 0 && nodeUpdates.size === 0 && nodeRemoves.size === 0 && edgeAdds.size === 0 && edgeUpdates.size === 0 && edgeRemoves.size === 0 && edgeOrphans.size === 0 && nodeStates.size === 0 && edgeStates.size === 0 && nodeVisibility.size === 0 && edgeVisibility.size === 0) {
      return;
    }
    for (const id of nodeAdds) this.events.emit("node:add", { nodeId: id });
    for (const [id, patch] of nodeUpdates) this.events.emit("node:update", { nodeId: id, patch });
    for (const id of nodeRemoves) this.events.emit("node:remove", { nodeId: id });
    for (const id of edgeAdds) this.events.emit("edge:add", { edgeId: id });
    for (const [id, patch] of edgeUpdates) this.events.emit("edge:update", { edgeId: id, patch });
    for (const id of edgeRemoves) this.events.emit("edge:remove", { edgeId: id });
    for (const id of edgeOrphans) this.events.emit("edge:orphaned", { edgeId: id });
    for (const { id, name, actor } of nodeStates.values()) {
      this.events.emit("node:state", {
        nodeId: id,
        name,
        on: this.nodeRuntimeStates.get(id)?.has(name) ?? false,
        actor
      });
    }
    for (const { id, name, actor } of edgeStates.values()) {
      this.events.emit("edge:state", {
        edgeId: id,
        name,
        on: this.edgeRuntimeStates.get(id)?.has(name) ?? false,
        actor
      });
    }
    for (const [id, hidden] of nodeVisibility) {
      if (hidden) counters.hiddenNodes++;
      else counters.shownNodes++;
      this.events.emit("node:visibility", { nodeId: id, hidden });
    }
    for (const [id, hidden] of edgeVisibility) {
      this.events.emit("edge:visibility", { edgeId: id, hidden });
    }
    if (this.flushListeners.size > 0 && (nodeAdds.size > 0 || nodeUpdates.size > 0 || nodeRemoves.size > 0 || edgeAdds.size > 0 || edgeUpdates.size > 0 || edgeRemoves.size > 0 || nodeVisibility.size > 0 || edgeVisibility.size > 0)) {
      const moved = [];
      const changedSet = /* @__PURE__ */ new Set();
      for (const [id, patch] of nodeUpdates) {
        const keys = Object.keys(patch);
        if (keys.length === 1 && keys[0] === "position") moved.push(id);
        else changedSet.add(id);
      }
      for (const id of nodeVisibility.keys()) changedSet.add(id);
      const edgeChangedSet = new Set(edgeUpdates.keys());
      for (const id of edgeVisibility.keys()) edgeChangedSet.add(id);
      const delta = {
        nodes: {
          added: [...nodeAdds],
          changed: [...changedSet],
          removed: [...nodeRemoves],
          moved,
          movedAll: false
        },
        edges: { added: [...edgeAdds], changed: [...edgeChangedSet], removed: [...edgeRemoves] },
        groups: { added: [], changed: [], removed: [] },
        annotations: { added: [], changed: [], removed: [] },
        version: this._version
      };
      for (const l of [...this.flushListeners]) l(delta);
    }
    this.events.emit("flush", counters);
  }
};
function compactOps(ops) {
  if (!ops.some((op) => op.kind === "setHidden")) return ops;
  const out = [];
  for (const op of ops) {
    const last = out[out.length - 1];
    if (op.kind === "setHidden" && last?.kind === "setHidden" && last.element === op.element && last.hidden === op.hidden) {
      last.ids.push(...op.ids);
      continue;
    }
    out.push(op.kind === "setHidden" ? { ...op, ids: [...op.ids] } : op);
  }
  return out;
}

// src/store/valueKey.ts
function readValueKey(root, path) {
  let cur = root;
  for (const seg of path.split(".")) {
    if (cur == null || typeof cur !== "object") return void 0;
    cur = cur[seg];
  }
  return cur;
}

// src/layer/types.ts
function resolveField(v, input) {
  return typeof v === "function" ? v(input) : v;
}
var COLLAPSED_STATE = "collapsed";
function isBuiltInNodeShape(shape) {
  switch (shape.kind) {
    case "rect":
    case "circle":
    case "arc":
    case "regular-polygon":
    case "star":
    case "polygon":
      return true;
    default:
      return false;
  }
}
var DEFAULT_NODE_STATES = {
  // Hovered — detached white ring sitting 2px outside the body. Real
  // decoration (not a stroke) so it composes cleanly with `selected`'s
  // own ring + halo when both states are active simultaneously.
  hovered: {
    decorations: [
      { kind: "ring", id: "canonical-hover-ring", color: 16777215, width: 3, gap: 5, alpha: 1 }
    ]
  },
  // Click-selected — sharp ring outside the body plus a soft halo for
  // extra prominence. Ring sits at `gap: 7` with `width: 3`; halo extends
  // a further ~10px outward with quadratic alpha falloff (built into
  // `glow`). `id`s scope the slots so per-layer overlays can swap or
  // remove either independently.
  selected: {
    decorations: [
      { kind: "ring", id: "canonical-select-ring", color: 16436245, width: 3, gap: 7, alpha: 1 },
      { kind: "glow", id: "canonical-select-halo", color: 16436245, strokeWidth: 30, innerAlpha: 0.4, layers: 4 }
    ]
  },
  highlighted: {
    decorations: [
      { kind: "ring", id: "canonical-hover-ring", color: 16639626, width: 3, gap: 5, alpha: 1 }
    ]
  },
  dimmed: { bgAlpha: 0.25 },
  disabled: { bgFill: 10265519, bgAlpha: 0.6 },
  // Deliberately empty: a closed frame's *geometry* default is the resolved
  // shape's own minimal form (`ShapeCtor.collapsedOf`), which no static style
  // could express — it differs per silhouette. This entry exists so consumers
  // can override `state.collapsed` like any other canonical state.
  collapsed: {}
};
var DEFAULT_EDGE_STATES = {
  hovered: { strokeColor: 1120295, strokeWidth: 3 },
  selected: { strokeColor: 16436245, strokeWidth: 3 },
  highlighted: { strokeColor: 16639626, strokeWidth: 2 },
  dimmed: { strokeAlpha: 0.2 },
  disabled: { strokeColor: 10265519, strokeAlpha: 0.6, arrowTargetShape: "none" },
  // Edges are never containers; the state exists on the shared canonical union.
  collapsed: {}
};

// src/theme/roles.ts
function hasAny(patch) {
  return Object.keys(patch).length > 0;
}
function paletteToNodeDefaults(p) {
  const out = {};
  if (p.foreground !== void 0) out.labelColor = p.foreground;
  if (p.stroke !== void 0) out.bgStrokeColor = p.stroke;
  return out;
}
function paletteToEdgeDefaults(p) {
  const out = {};
  if (p.muted !== void 0) {
    out.strokeColor = p.muted;
    out.arrowTargetColor = p.muted;
    out.arrowSourceColor = p.muted;
  }
  if (p.foreground !== void 0) out.labelColor = p.foreground;
  return out;
}
function paletteToGroupStyle(p) {
  const out = {};
  if (p.cardBg !== void 0) out.bgFill = p.cardBg;
  if (p.divider !== void 0) out.bgStrokeColor = p.divider;
  return out;
}

// src/theme/themes.ts
var CATEGORICAL = [
  3900150,
  15680580,
  1096065,
  16096779,
  9133302,
  15485081,
  440020,
  15381256,
  1357990,
  10741301,
  16347926,
  6514417
];
var DEFAULT_THEME = {
  name: "default",
  label: "Default",
  light: {
    surface: 16317180,
    cardBg: 16777215,
    foreground: 3359061,
    heading: 988970,
    muted: 6583435,
    accent: 3900150,
    divider: 14870768,
    stroke: 13358561,
    selectionRing: 3900150,
    hoverRing: 9684477,
    categorical: CATEGORICAL
  },
  dark: {
    surface: 988970,
    cardBg: 1976635,
    foreground: 14870768,
    heading: 16317180,
    muted: 9741240,
    accent: 6333946,
    divider: 3359061,
    stroke: 4674921,
    selectionRing: 6333946,
    hoverRing: 3900150,
    categorical: CATEGORICAL
  }
};
var FOREST_THEME = {
  name: "forest",
  label: "Forest",
  light: {
    surface: 16054258,
    cardBg: 16777215,
    foreground: 3096116,
    heading: 1320730,
    muted: 6123360,
    accent: 3120739,
    divider: 14279894,
    stroke: 12176563,
    selectionRing: 3120739,
    hoverRing: 8832927,
    categorical: [
      3120739,
      4906624,
      8702998,
      15381256,
      1357990,
      959908,
      6660877,
      10724109,
      1483594,
      13273604,
      366185,
      10145074
    ]
  },
  dark: {
    surface: 726029,
    cardBg: 1385498,
    foreground: 14149336,
    heading: 15398122,
    muted: 9086607,
    accent: 4906624,
    divider: 2438954,
    stroke: 3428411,
    selectionRing: 4906624,
    hoverRing: 2278750,
    categorical: [
      4906624,
      2278750,
      10741301,
      16436245,
      3003583,
      3462041,
      8702998,
      14285213,
      1483594,
      16638023,
      1096065,
      12513892
    ]
  }
};
var OCEAN_THEME = {
  name: "ocean",
  label: "Ocean",
  light: {
    surface: 15857403,
    cardBg: 16777215,
    foreground: 2374483,
    heading: 730432,
    muted: 5927300,
    accent: 3112913,
    divider: 14083312,
    stroke: 11783648,
    selectionRing: 3112913,
    hoverRing: 9356267,
    categorical: [
      3112913,
      3718648,
      959977,
      6514417,
      9133302,
      440020,
      3900150,
      561586,
      2450411,
      8141549,
      165063,
      5195493
    ]
  },
  dark: {
    surface: 463647,
    cardBg: 926261,
    foreground: 13624050,
    heading: 15135227,
    muted: 8955583,
    accent: 3718648,
    divider: 1914192,
    stroke: 2837099,
    selectionRing: 3718648,
    hoverRing: 959977,
    categorical: [
      3718648,
      959977,
      6333946,
      8490232,
      10980346,
      2282478,
      3900150,
      440020,
      6514417,
      9133302,
      959977,
      8246268
    ]
  }
};
var GOLD_THEME = {
  name: "gold",
  label: "Gold",
  light: {
    surface: 16513264,
    cardBg: 16777215,
    foreground: 4865834,
    heading: 2760976,
    muted: 8023119,
    accent: 13605671,
    divider: 15524812,
    stroke: 14536614,
    selectionRing: 13605671,
    hoverRing: 15124595,
    categorical: CATEGORICAL
  },
  dark: {
    surface: 1315082,
    cardBg: 2432786,
    foreground: 15524294,
    heading: 16248794,
    muted: 11772025,
    accent: 16106818,
    divider: 3484696,
    stroke: 4865314,
    selectionRing: 16106818,
    hoverRing: 13934615,
    categorical: CATEGORICAL
  }
};
var ROSE_THEME = {
  name: "rose",
  label: "Rose",
  light: {
    surface: 16643318,
    cardBg: 16777215,
    foreground: 5058360,
    heading: 2888219,
    muted: 8413291,
    accent: 14362487,
    divider: 15849953,
    stroke: 14858438,
    selectionRing: 14362487,
    hoverRing: 15771332,
    categorical: CATEGORICAL
  },
  dark: {
    surface: 1707796,
    cardBg: 2758690,
    foreground: 15784418,
    heading: 16510707,
    muted: 12028571,
    accent: 16020150,
    divider: 3810096,
    stroke: 5189440,
    selectionRing: 16020150,
    hoverRing: 15485081,
    categorical: CATEGORICAL
  }
};
var MINIMAL_THEME = {
  name: "minimal",
  label: "Minimal",
  light: {
    surface: 16777215,
    cardBg: 16777215,
    foreground: 2042167,
    heading: 1120295,
    muted: 7041664,
    accent: 1120295,
    divider: 15067115,
    stroke: 13751771,
    selectionRing: 1120295,
    hoverRing: 10265519,
    categorical: [
      1120295,
      3621201,
      7041664,
      10265519,
      4937059,
      2042167,
      13751771,
      5395035,
      7434618,
      10592682,
      4144966,
      8487297
    ]
  },
  dark: {
    surface: 657930,
    cardBg: 1513239,
    foreground: 15066597,
    heading: 16448250,
    muted: 10724259,
    accent: 16448250,
    divider: 2500134,
    stroke: 4210752,
    selectionRing: 16448250,
    hoverRing: 7566195,
    categorical: [
      16448250,
      13948116,
      10724259,
      7566195,
      15066597,
      11908533,
      5395026,
      13290186,
      9803157,
      8421504,
      12434877,
      7039851
    ]
  }
};
var BUILT_IN_THEMES = {
  default: DEFAULT_THEME,
  forest: FOREST_THEME,
  ocean: OCEAN_THEME,
  gold: GOLD_THEME,
  rose: ROSE_THEME,
  minimal: MINIMAL_THEME
};

// src/template/bindings.ts
function resolvePath(node, path) {
  if (!path) return void 0;
  let cur = node;
  for (const key of path.split(".")) {
    if (cur == null || typeof cur !== "object") return void 0;
    cur = cur[key];
  }
  return cur;
}
function resolveText(node, path) {
  if (!path) return "";
  const v = resolvePath(node, path);
  if (v == null) return "";
  return typeof v === "string" ? v : String(v);
}

// src/template/compile.ts
function frameToRoot(frame, width, height, cornerRadius, fill, stroke) {
  const base = { x: 0, y: 0, fill, ...stroke ? { stroke } : {} };
  switch (frame.kind) {
    case "rect":
      return { kind: "rect", ...base, width, height, cornerRadius };
    case "ellipse":
      return { kind: "ellipse", ...base, radiusX: width / 2, radiusY: height / 2 };
    case "regular-polygon":
      return {
        kind: "regular-polygon",
        ...base,
        radius: Math.min(width, height) / 2,
        sides: frame.sides,
        ...frame.rotation !== void 0 ? { rotation: frame.rotation } : {}
      };
    case "polygon":
      return {
        kind: "polygon",
        ...base,
        // Normalised [0,1] box points → centre-relative (PolygonSpec convention).
        vertices: frame.points.map((p) => ({ x: (p.x - 0.5) * width, y: (p.y - 0.5) * height }))
      };
  }
}
function color(role, direct, palette) {
  if (role !== void 0) {
    const v = palette[role];
    if (v !== void 0) return v;
  }
  return direct;
}
var BIND_TOKEN = /\{([^{}]*)\}/g;
function interpolate(template, node, bound) {
  if (!template.includes("{")) return template;
  return template.replace(
    BIND_TOKEN,
    (_match, path) => path === "" ? bound === void 0 || bound === null ? "" : String(bound) : resolveText(node, path)
  );
}
function matchBand(bands, value) {
  for (const band of bands) {
    if (band.from !== void 0 && value < band.from) continue;
    if (band.to !== void 0 && value >= band.to) continue;
    return band.value;
  }
  return void 0;
}
function resolveLookup(lookup, node, fallbackBind) {
  if (!lookup) return void 0;
  const path = lookup.bind ?? fallbackBind;
  const value = path !== void 0 ? resolvePath(node, path) : void 0;
  if (lookup.map && value !== void 0 && value !== null) {
    const hit = lookup.map[String(value)];
    if (hit !== void 0) return hit;
  }
  if (lookup.bands && typeof value === "number") {
    const hit = matchBand(lookup.bands, value);
    if (hit !== void 0) return hit;
  }
  return lookup.fallback;
}
function templateColor(value, palette) {
  if (value === void 0) return void 0;
  return typeof value === "number" ? value : palette[value];
}
function lookupColor(lookup, role, direct, node, palette) {
  const hit = templateColor(resolveLookup(lookup, node), palette);
  if (hit !== void 0) return hit;
  return color(role, direct, palette);
}
function compileSize(size, node) {
  if (size === void 0) return void 0;
  return typeof size === "number" ? size : resolveLookup(size, node);
}
function badgeApplies(t, value) {
  if (t.bind === void 0) return true;
  if (value === void 0 || value === null) return false;
  if (t.whenEquals !== void 0 && value !== t.whenEquals) return false;
  if (t.whenGreaterThan !== void 0 && !(typeof value === "number" && value > t.whenGreaterThan)) {
    return false;
  }
  if (t.whenLessThan !== void 0 && !(typeof value === "number" && value < t.whenLessThan)) {
    return false;
  }
  return true;
}
function compileBadges(styling, node, palette) {
  const templates = styling?.badges;
  if (!templates || templates.length === 0) return void 0;
  const out = [];
  for (const t of templates) {
    const value = t.bind !== void 0 ? resolvePath(node, t.bind) : void 0;
    if (!badgeApplies(t, value)) continue;
    const {
      bind: _bind,
      whenEquals: _whenEquals,
      whenGreaterThan: _whenGreaterThan,
      whenLessThan: _whenLessThan,
      labelText,
      fill: _fill,
      fillRole: _fillRole,
      fillLookup: _fillLookup,
      strokeColor: _strokeColor,
      strokeColorRole: _strokeColorRole,
      labelColor: _labelColor,
      labelColorRole: _labelColorRole,
      ...geometry
    } = t;
    const badge = { ...geometry };
    const fill = templateColor(resolveLookup(t.fillLookup, node, t.bind), palette);
    badge.fill = fill ?? color(t.fillRole, t.fill, palette);
    if (badge.fill === void 0) delete badge.fill;
    const stroke = color(t.strokeColorRole, t.strokeColor, palette);
    if (stroke !== void 0) badge.strokeColor = stroke;
    const labelColor = color(t.labelColorRole, t.labelColor, palette);
    if (labelColor !== void 0) badge.labelColor = labelColor;
    const text = labelText !== void 0 ? interpolate(labelText, node, value) : value === void 0 || value === null ? "" : String(value);
    if (text !== "") badge.labelText = text;
    out.push(badge);
  }
  return out;
}
function compileSimple(struct, styling, bindings, node, palette) {
  const out = { shape: struct.shape };
  const fill = color(styling?.fillRole, styling?.fill, palette);
  if (fill !== void 0) {
    out.bgFill = styling?.fillAlpha !== void 0 ? { kind: "solid", color: fill, alpha: styling.fillAlpha } : fill;
  }
  const stroke = color(styling?.strokeRole, styling?.stroke, palette);
  if (stroke !== void 0) {
    out.bgStrokeColor = stroke;
    out.bgStrokeWidth = styling?.strokeWidth ?? 1.5;
  } else if (styling?.strokeWidth !== void 0) {
    out.bgStrokeWidth = styling.strokeWidth;
  }
  if (styling?.strokeAlpha !== void 0) out.bgStrokeAlpha = styling.strokeAlpha;
  const labelPath = bindings.label;
  if (labelPath) out.labelText = resolveText(node, labelPath);
  const lbl = styling?.label;
  if (lbl) {
    const lc = color(lbl.colorRole, lbl.color, palette);
    if (lc !== void 0) out.labelColor = lc;
    if (lbl.fontSize !== void 0) out.labelFontSize = lbl.fontSize;
    if (lbl.fontFamily !== void 0) out.labelFontFamily = lbl.fontFamily;
    if (lbl.fontWeight !== void 0) out.labelFontWeight = lbl.fontWeight;
    if (lbl.fontStyle !== void 0) out.labelFontStyle = lbl.fontStyle;
    if (lbl.placement !== void 0) out.labelPlacement = lbl.placement;
    if (lbl.offsetX !== void 0) out.labelOffsetX = lbl.offsetX;
    if (lbl.offsetY !== void 0) out.labelOffsetY = lbl.offsetY;
    if (lbl.rotation !== void 0) out.labelRotation = lbl.rotation;
    if (lbl.align !== void 0) out.labelAlign = lbl.align;
    if (lbl.background) {
      const bg = color(lbl.backgroundColorRole, lbl.backgroundColor, palette);
      if (bg !== void 0) out.labelBackgroundFill = bg;
    }
  }
  return out;
}
var DEFAULT_PAD = 14;
var ROW_GAP = 8;
var STACK_GAP = 2;
function resolveSlotStyle(slotStyle, palette, fallbackRole) {
  return {
    fill: color(slotStyle?.colorRole, slotStyle?.color, palette) ?? palette[fallbackRole] ?? 1118481,
    fontSize: slotStyle?.fontSize ?? 13,
    fontWeight: slotStyle?.fontWeight ?? 400,
    fontFamily: slotStyle?.fontFamily,
    fontStyle: slotStyle?.fontStyle,
    uppercase: slotStyle?.uppercase ?? false
  };
}
function compileCard(struct, styling, bindings, node, palette) {
  const { width, height } = struct;
  const pad = struct.padding ?? DEFAULT_PAD;
  const parts = [];
  const bg = color(styling?.bgRole, styling?.bg, palette) ?? palette.cardBg ?? 16777215;
  const strokeColor = color(styling?.strokeRole, styling?.stroke, palette);
  const accent = color(styling?.accentRole, styling?.accent, palette);
  const dividerColor = color(styling?.slots?.divider?.colorRole, styling?.slots?.divider?.color, palette) ?? palette.divider ?? 14870768;
  if (accent !== void 0) {
    parts.push({ part: "rect", x: 0, y: 0, width: 4, height, fill: accent });
  }
  let y = pad;
  for (const row of struct.rows) {
    if (row.divider) {
      parts.push({
        part: "line",
        x: pad,
        y,
        x2: width - pad,
        y2: y,
        stroke: { color: dividerColor, width: 1 }
      });
      y += ROW_GAP;
      continue;
    }
    if (!row.slots || row.slots.length === 0) {
      y += ROW_GAP;
      continue;
    }
    y = layoutRow(row.slots, parts, { x: pad, y, pad, width }, styling, bindings, node, palette);
    y += ROW_GAP;
  }
  const rootStroke = strokeColor !== void 0 ? { color: strokeColor, width: styling?.strokeWidth ?? 1 } : void 0;
  const shape = {
    kind: "composite",
    width,
    height,
    cornerRadius: 10,
    // `root` and `stroke` are always stated, `undefined` when absent: the
    // renderer merges a shape update over the previous spec, so a key left out
    // keeps the last template's value (a rebind from a framed card to a plain
    // one would keep the old silhouette).
    root: struct.frame ? frameToRoot(struct.frame, width, height, 10, bg, rootStroke) : void 0,
    fill: bg,
    stroke: rootStroke,
    parts
  };
  return { shape, bgFill: bg, bgStrokeWidth: 0 };
}
function layoutRow(slots, parts, cursor, styling, bindings, node, palette) {
  let x = cursor.x;
  let rowHeight = 0;
  const rightEdge = cursor.width - cursor.pad;
  for (let i = 0; i < slots.length; i++) {
    const cell = slots[i];
    const available = rightEdge - x;
    const cellWidth = available / (slots.length - i);
    const isTrailing = slots.length > 1 && i === slots.length - 1;
    if ("stack" in cell) {
      let sy = cursor.y;
      for (const sub of cell.stack) {
        if ("stack" in sub || sub.kind === "image") continue;
        const ss2 = resolveSlotStyle(styling?.slots?.[sub.slot], palette, "foreground");
        const text2 = formatText(resolveText(node, bindings[sub.slot]), ss2.uppercase);
        parts.push(label(text2, x, sy + ss2.fontSize, ss2, cellWidth, "left"));
        sy += ss2.fontSize + STACK_GAP + 2;
      }
      rowHeight = Math.max(rowHeight, sy - cursor.y);
      x += cellWidth;
      continue;
    }
    if (cell.kind === "image") {
      const size = cell.size ?? 40;
      const cx = x + size / 2;
      const cy = cursor.y + size / 2;
      const discFill = palette.accent ?? palette.muted ?? 13358561;
      if (cell.shape === "rounded") {
        parts.push({ part: "rect", x, y: cursor.y, width: size, height: size, cornerRadius: 8, fill: discFill });
      } else {
        parts.push({ part: "circle", x: cx, y: cy, radius: size / 2, fill: discFill });
      }
      const initials = initialsOf(resolveText(node, bindings.title));
      if (initials) {
        const fontSize = Math.round(size * 0.4);
        parts.push({
          part: "label",
          x: cx,
          y: cy - fontSize / 2,
          text: initials,
          anchor: "center",
          fontSize,
          fontWeight: 700,
          fill: 16777215,
          maxLines: 1,
          overflow: "ellipsis"
        });
      }
      x += size + 10;
      rowHeight = Math.max(rowHeight, size);
      continue;
    }
    const ss = resolveSlotStyle(
      styling?.slots?.[cell.slot],
      palette,
      cell.kind === "tag" ? "muted" : "heading"
    );
    const text = formatText(resolveText(node, bindings[cell.slot]), ss.uppercase);
    parts.push(
      isTrailing ? label(text, rightEdge, cursor.y + ss.fontSize, ss, cellWidth, "right") : label(text, x, cursor.y + ss.fontSize, ss, cellWidth, "left")
    );
    x += cellWidth;
    rowHeight = Math.max(rowHeight, ss.fontSize + 2);
  }
  return cursor.y + (rowHeight || 14);
}
function formatText(text, uppercase) {
  return uppercase ? text.toUpperCase() : text;
}
function initialsOf(name) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}
function label(text, x, baselineY, ss, maxWidth, anchor) {
  return {
    part: "label",
    x,
    y: baselineY,
    text,
    anchor,
    fontSize: ss.fontSize,
    fontWeight: ss.fontWeight,
    ...ss.fontStyle ? { fontStyle: ss.fontStyle } : {},
    fill: ss.fill,
    maxWidth,
    maxLines: 1,
    overflow: "ellipsis"
  };
}
function compileFreeform(struct, node, palette) {
  const bg = color(struct.bgRole, struct.bg, palette) ?? palette.cardBg ?? 16777215;
  const strokeColor = lookupColor(
    struct.strokeLookup,
    struct.strokeRole,
    struct.stroke,
    node,
    palette
  );
  const parts = [];
  for (const el of struct.elements) {
    if (el.hidden) continue;
    parts.push(...elementToParts(el, node, palette));
  }
  const rootStroke = strokeColor !== void 0 ? { color: strokeColor, width: struct.strokeWidth ?? 1 } : void 0;
  const shape = {
    kind: "composite",
    width: struct.width,
    height: struct.height,
    cornerRadius: struct.cornerRadius ?? 10,
    // Always stated, `undefined` when absent — see `compileCard`.
    root: struct.frame ? frameToRoot(struct.frame, struct.width, struct.height, struct.cornerRadius ?? 10, bg, rootStroke) : void 0,
    fill: bg,
    stroke: rootStroke,
    parts
  };
  return { shape, bgFill: bg, bgStrokeWidth: 0 };
}
function elementToParts(el, node, palette) {
  if (el.requires !== void 0) {
    const present = resolvePath(node, el.requires);
    if (present === void 0 || present === null) return [];
  }
  switch (el.type) {
    case "text": {
      const bound = el.bind ? resolvePath(node, el.bind) : void 0;
      const raw = el.text !== void 0 ? interpolate(el.text, node, bound) : el.bind ? resolveText(node, el.bind) : "";
      const text = el.uppercase ? raw.toUpperCase() : raw;
      const fill = lookupColor(el.colorLookup, el.colorRole, el.color, node, palette) ?? palette.foreground ?? 1118481;
      const wrap = el.maxWidth !== void 0 ? { maxWidth: el.maxWidth, maxLines: el.maxLines ?? 1, overflow: "ellipsis" } : {};
      return [
        {
          part: "label",
          x: el.x,
          y: el.y + (el.fontSize ?? 13),
          text,
          anchor: el.anchor ?? "left",
          fontSize: el.fontSize ?? 13,
          fontWeight: el.fontWeight ?? 400,
          ...el.fontStyle ? { fontStyle: el.fontStyle } : {},
          ...el.fontVariant ? { fontVariant: el.fontVariant } : {},
          ...el.lineHeight !== void 0 ? { lineHeight: el.lineHeight } : {},
          ...el.align ? { align: el.align } : {},
          fill,
          ...wrap
        }
      ];
    }
    case "rect": {
      const fill = lookupColor(el.fillLookup, el.fillRole, el.fill, node, palette);
      const stroke = color(el.strokeRole, el.stroke, palette);
      return [
        {
          part: "rect",
          x: el.x,
          y: el.y,
          width: el.width,
          height: el.height,
          ...el.cornerRadius ? { cornerRadius: el.cornerRadius } : {},
          ...fill !== void 0 ? { fill } : {},
          ...el.fillAlpha !== void 0 ? { fillAlpha: el.fillAlpha } : {},
          ...stroke !== void 0 ? { stroke: { color: stroke, width: el.strokeWidth ?? 1 } } : {},
          ...el.hitId !== void 0 ? { hitId: el.hitId } : {}
        }
      ];
    }
    case "circle": {
      const fill = lookupColor(el.fillLookup, el.fillRole, el.fill, node, palette);
      const stroke = color(el.strokeRole, el.stroke, palette);
      return [
        {
          part: "circle",
          x: el.x + el.radius,
          y: el.y + el.radius,
          radius: el.radius,
          ...fill !== void 0 ? { fill } : {},
          ...el.fillAlpha !== void 0 ? { fillAlpha: el.fillAlpha } : {},
          ...stroke !== void 0 ? { stroke: { color: stroke, width: el.strokeWidth ?? 1 } } : {},
          ...el.hitId !== void 0 ? { hitId: el.hitId } : {}
        }
      ];
    }
    case "line": {
      const stroke = lookupColor(el.colorLookup, el.colorRole, el.color, node, palette) ?? palette.divider ?? 14870768;
      return [
        { part: "line", x: el.x, y: el.y, x2: el.x2, y2: el.y2, stroke: { color: stroke, width: el.strokeWidth ?? 1 } }
      ];
    }
    case "image": {
      const fill = palette.divider ?? 13421772;
      if (el.shape === "rounded") {
        return [{ part: "rect", x: el.x, y: el.y, width: el.size, height: el.size, cornerRadius: 8, fill }];
      }
      const r = el.size / 2;
      return [{ part: "circle", x: el.x + r, y: el.y + r, radius: r, fill }];
    }
    case "icon": {
      const bound = el.bind ? resolvePath(node, el.bind) : void 0;
      const id = typeof bound === "string" && bound !== "" ? bound : el.icon;
      if (!id) return [];
      const fill = lookupColor(el.colorLookup, el.colorRole, el.color, node, palette) ?? palette.foreground ?? 1118481;
      return [
        {
          part: "icon",
          x: el.x,
          y: el.y,
          size: el.size,
          icon: {
            kind: "svg-url",
            url: `https://api.iconify.design/${id}.svg`,
            color: fill,
            ...el.strokeWidth !== void 0 ? { strokeWidth: el.strokeWidth } : {}
          }
        }
      ];
    }
    default:
      return [];
  }
}

// src/template/structures.ts
var circle = {
  name: "circle",
  kind: "simple",
  shape: { kind: "circle", radius: 10 },
  slots: { label: true }
};
var rect = {
  name: "rect",
  kind: "simple",
  shape: { kind: "rect", width: 28, height: 28, cornerRadius: 4 },
  slots: { label: true }
};
var arc = {
  name: "arc",
  kind: "simple",
  shape: { kind: "arc", innerR: 6, outerR: 12, startAngle: 0, endAngle: Math.PI * 1.5 },
  slots: { label: true }
};
var regularPolygon = {
  name: "regular-polygon",
  kind: "simple",
  shape: { kind: "regular-polygon", sides: 6, radius: 12 },
  slots: { label: true }
};
var star = {
  name: "star",
  kind: "simple",
  shape: { kind: "star", points: 5, innerRadius: 5, outerRadius: 12 },
  slots: { label: true }
};
var polygon = {
  name: "polygon",
  kind: "simple",
  shape: {
    kind: "polygon",
    vertices: [
      { x: 0, y: -12 },
      { x: 12, y: 0 },
      { x: 0, y: 12 },
      { x: -12, y: 0 }
    ]
  },
  slots: { label: true }
};
var idCard = {
  name: "idCard",
  kind: "card",
  width: 220,
  height: 96,
  rows: [
    { slots: [{ slot: "type", kind: "tag" }] },
    { divider: true },
    {
      slots: [
        { slot: "avatar", kind: "image", shape: "circle", size: 40 },
        { stack: [{ slot: "title", kind: "text" }, { slot: "subtitle", kind: "text" }] }
      ]
    }
  ]
};
var BUILT_IN_STRUCTURES = {
  circle,
  rect,
  arc,
  "regular-polygon": regularPolygon,
  star,
  polygon,
  idCard
};
var BUILT_IN_STYLINGS = {
  circle: {
    name: "circle",
    fillRole: "accent",
    strokeRole: "stroke",
    label: { colorRole: "foreground", fontSize: 12, placement: "bottom" }
  },
  idCard: {
    name: "idCard",
    bgRole: "cardBg",
    accentRole: "accent",
    slots: {
      type: { colorRole: "muted", fontSize: 10, fontWeight: 600, uppercase: true },
      title: { colorRole: "heading", fontSize: 15, fontWeight: 700 },
      subtitle: { colorRole: "muted", fontSize: 12 },
      divider: { colorRole: "divider" }
    }
  }
};

// src/layer/GraphLayer.ts
var { categorical: _fallbackCategorical, ...FALLBACK_PALETTE } = DEFAULT_THEME.light;
function pathTypeToRouterPathStyle(t) {
  switch (t) {
    case "straight":
      return { router: "straight", pathStyle: "normal" };
    case "bezier":
      return { router: "straight", pathStyle: "bezier" };
    case "quadratic":
      return { router: "straight", pathStyle: "quadratic" };
    case "bump-radial":
      return { router: "straight", pathStyle: "bump-radial" };
    case "bump-horizontal":
      return { router: "straight", pathStyle: "bump-horizontal" };
    case "step-radial":
      return { router: "straight", pathStyle: "step-radial" };
    case "orth":
      return { router: "orth", pathStyle: "normal" };
    case "manhattan":
      return { router: "manhattan", pathStyle: "normal" };
    case "rounded":
      return { router: "orth", pathStyle: "rounded" };
    case "smooth":
      return { router: "orth", pathStyle: "smooth" };
    case "bundle":
      return { router: "straight", pathStyle: "bundle" };
    case "loop-curve":
    case "loop-polyline":
      return { router: "straight", pathStyle: t };
  }
}
var GraphLayer = class _GraphLayer extends WorldLayer {
  /**
   * Pixi-backed primitives renderer; created in `onMount`.
   *
   * Public so behaviours can subscribe to `shape:*` / `connector:*` pointer
   * events on `graph.getRenderer().events`. Returns `undefined` before mount.
   */
  _renderer;
  /** Durable spec collection for this layer — see `docs/renderer-split-design.md` §2. */
  specStore;
  projector;
  /** Renderer accessor for behaviours. Undefined before `onMount`. */
  getRenderer() {
    return this._renderer;
  }
  /**
   * Vector-SVG projection of this layer's nodes + edges — delegates to the
   * internal `PrimitivesRenderer.toSVG()`. Consumed by `Canvas.exportSVG`
   * (duck-typed via the engine's `SvgExportableLayer` contract). Returns `''`
   * before mount. Coverage caveats (raster-only fills, non-label decorations,
   * effects) are documented on `PrimitivesRenderer.toSVG`.
   */
  toSVG() {
    return this._renderer?.toSVG() ?? "";
  }
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
  tickAnimations(deltaMs) {
    this._renderer?.tickAnimations(deltaMs);
  }
  /** Data source. Either supplied by the caller or self-created. */
  store;
  /**
   * The **authoritative** schema for this graph, if a data source declared one
   * (delegates to {@link GraphStore.schema}) — typically the full DB schema behind
   * a connected canvas, a superset of what's loaded. `undefined` when none is set;
   * resolve `layer.schema ?? deriveSchema(layer.store)` for authoritative-else-observed.
   */
  get schema() {
    return this.store.schema;
  }
  /** Set/clear the authoritative schema (delegates to {@link GraphStore.setSchema}). */
  setSchema(schema) {
    this.store.setSchema(schema);
  }
  /** Subscription disposers, called in `onUnmount`. */
  subs = [];
  /**
   * True once the canvas's active layout has reported a run for this canvas.
   * Latches: a layout only owns "nothing has been placed yet" once, at the
   * start of a canvas's life.
   */
  layoutHasRun = false;
  /** Pending {@link PLACEMENT_GRACE_MS} timer — see {@link evaluatePlacementPending}. */
  placementGrace;
  /**
   * Edge ids whose endpoint moved since last flush. The connector path is
   * pinned to shape positions via the `boundary` anchor, but PixiJS doesn't
   * auto-reroute connectors when an anchored shape moves — we drain this set
   * on each store flush and call `updateConnector(eid, {})` to force re-route.
   */
  dirtyConnectors = /* @__PURE__ */ new Set();
  /**
   * Last-projected collapsed flag per group node id. Read by the
   * `node:update` handler so it can detect a collapse → expand (or
   * expand → collapse) flip — the patch itself doesn't carry the
   * previous style, and the store has already overwritten it by the
   * time the event fires. Updated by {@link syncGroupSyntheticDecorations}
   * on every group render.
   */
  lastCollapsedByGroup = /* @__PURE__ */ new Map();
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
  dirtyGroups = /* @__PURE__ */ new Set();
  /**
   * Nodes / edges whose active-state set changed since the last flush — drained
   * once per flush into `rerenderNode` / `rerenderEdge`. Populated from the
   * store's `node:state` / `edge:state` events; the dedup + once-per-flush drain
   * keeps an N-item highlight to ≤1 rebuild per item (mirrors
   * {@link dirtyConnectors}). State itself is owned by the `GraphStore` (presence
   * compartment) — the layer holds none, just reads `store.nodeStatesOf` at
   * render. See `store-owns-state-plan.md` § 0 / § 2.5.
   */
  dirtyStateNodes = /* @__PURE__ */ new Set();
  dirtyStateEdges = /* @__PURE__ */ new Set();
  /**
   * Edges whose install was deferred because an endpoint shape wasn't on the
   * renderer yet — see {@link endpointShapesInstalled}. Retried on the next
   * flush (after node adds / re-renders have installed the shapes) and re-
   * deferred if the endpoint is still missing, so an install can never throw
   * and can never be silently lost.
   */
  deferredEdgeInstalls = /* @__PURE__ */ new Set();
  /**
   * Currently-mounted decoration slot ids per node / edge, so the resolver
   * can diff (mount new / dispose removed / replace changed) against the
   * previous render's set. Slot ids are synthesized from `spec.id` or
   * `${kind}#<index>`. The `'label'` slot is managed separately by
   * `syncNodeLabel` / `syncEdgeLabel` and never appears in these maps.
   */
  nodeDecorationSlots = /* @__PURE__ */ new Map();
  edgeDecorationSlots = /* @__PURE__ */ new Map();
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
  nodeEffectSlots = /* @__PURE__ */ new Map();
  edgeEffectSlots = /* @__PURE__ */ new Map();
  /**
   * Currently-mounted badge slot ids per node, mirroring
   * {@link nodeDecorationSlots} for badge diffing. Slot id falls back to
   * `${badge.placement-name}#<index>` when `NodeBadge.id` is absent so
   * id-less badges stack rather than collapse.
   */
  nodeBadgeSlots = /* @__PURE__ */ new Map();
  /** Edge-side counterpart of {@link nodeBadgeSlots}. */
  edgeBadgeSlots = /* @__PURE__ */ new Map();
  // ─── v3 G6-aligned layer template ────────────────────────────────────
  // `options.node` and `options.edge` carry layer-level NodeOption /
  // EdgeOption templates (style + state catalogue, resolver-aware).
  nodeOption;
  edgeOption;
  // ─── Per-type structure / styling templates (built-ins ∪ consumer) ────
  nodeStructures;
  nodeStylings;
  nodeTypes;
  /** Current resolved palette (role → number), used to resolve per-type
   * templates. Seeded from the default theme until a theme is published. */
  themePalette = FALLBACK_PALETTE;
  /** Detaches the store from the canvas's operation log; set on mount. */
  detachLog;
  /** Initial data from `options.initData`, applied once in `onMount`. */
  initialData;
  constructor(opts) {
    super(opts);
    this.initialData = opts.options.initData;
    this.store = opts.options.store ?? new GraphStore({ id: this.id, flushMode: "frame" });
    const useDefaults = opts.options.useDefaultStates !== false;
    this.nodeOption = mergeNodeOptionWithDefaults(opts.options.node, useDefaults);
    this.edgeOption = mergeEdgeOptionWithDefaults(opts.options.edge, useDefaults);
    this.nodeStructures = { ...BUILT_IN_STRUCTURES, ...opts.options.nodeStructureTemplates };
    this.nodeStylings = { ...BUILT_IN_STYLINGS, ...opts.options.nodeStylingTemplates };
    this.nodeTypes = opts.options.nodeTypes;
  }
  createState() {
    return {};
  }
  /**
   * Hand the layer's hit floor to the device the surface builds. Graph nodes
   * can be small at low zoom, so this layer raises the pick tolerance above the
   * renderer-wide default.
   */
  surfaceOptions() {
    return this.options.hitFloorPx !== void 0 ? { hitFloorPx: this.options.hitFloorPx } : void 0;
  }
  onMount(ctx) {
    this.store.bindBus(ctx.events);
    const liftGate = (id) => {
      if (id !== this.activeLayoutId()) return;
      this.layoutHasRun = true;
      this.evaluatePlacementPending();
    };
    this.subs.push(ctx.events.on("layout:run:tick", ({ id }) => liftGate(id)));
    this.subs.push(ctx.events.on("layout:run:end", ({ id }) => liftGate(id)));
    this.subs.push(
      ctx.store.view.subscribe(() => this.evaluatePlacementPending())
    );
    this.evaluatePlacementPending();
    ctx.store.setSource(this.id, this.store);
    this.specStore = ctx.store.specsFor(this.id);
    this._renderer = this.surface.primitives;
    this.projector = new SpecProjector(this.specStore, this._renderer, {
      onKindChange: (changed) => {
        this.nodeDecorationSlots.delete(changed);
        this.nodeBadgeSlots.delete(changed);
        this.nodeEffectSlots.delete(changed);
      }
    });
    for (const node of this.store.nodes()) {
      this.installNodeShape(node);
      if (this.isGroupNode(node)) this.dirtyGroups.add(node.id);
    }
    for (const edge of this.store.edges()) {
      this.installEdgeConnector(edge);
    }
    this.drainDirtyGroups();
    for (const node of this.store.nodes()) {
      if (this.isGroupNode(node)) this.syncGroupCollapse(node);
    }
    const s = this.store.events;
    this.subs.push(
      s.on("node:add", ({ nodeId }) => {
        const node = this.store.getNode(nodeId);
        if (!node) return;
        if (this._renderer?.hasShape(nodeId)) {
          console.debug(
            `[graph] node:add for "${nodeId}" skipped \u2014 shape already installed (expected once per node on the initial frame-flush replay; a later duplicate may indicate a double add).`
          );
          return;
        }
        this.installNodeShape(node);
        if (this.isGroupNode(node)) {
          this.dirtyGroups.add(node.id);
          this.syncGroupCollapse(node);
        }
        if (node.parentId) this.markGroupAncestorsDirty(node.parentId);
      }),
      s.on("node:update", ({ nodeId, patch }) => {
        const node = this.store.getNode(nodeId);
        if (!node) return;
        this.updateNodeShape(node, patch);
        if (patch.position && node.parentId) {
          this.markGroupAncestorsDirty(node.parentId);
        }
        if ("parentId" in patch && node.parentId) {
          this.markGroupAncestorsDirty(node.parentId);
        }
        if (this.isGroupNode(node)) {
          this.dirtyGroups.add(node.id);
          this.syncGroupCollapse(node);
        }
      }),
      s.on("node:remove", ({ nodeId }) => {
        this.dirtyStateNodes.delete(nodeId);
        this.nodeDecorationSlots.delete(nodeId);
        this.nodeBadgeSlots.delete(nodeId);
        this.nodeEffectSlots.delete(nodeId);
        this.unpublishSpec(nodeId);
        this._renderer?.removeShape(nodeId);
        this.dirtyGroups.delete(nodeId);
        this.lastCollapsedByGroup.delete(nodeId);
      }),
      s.on("edge:add", ({ edgeId }) => {
        const edge = this.store.getEdge(edgeId);
        if (!edge) return;
        if (this._renderer?.hasConnector(edgeId)) {
          console.debug(
            `[graph] edge:add for "${edgeId}" skipped \u2014 connector already installed (expected once per edge on the initial frame-flush replay; a later duplicate may indicate a double add).`
          );
          return;
        }
        this.installEdgeConnector(edge);
      }),
      s.on("edge:update", ({ edgeId, patch }) => {
        const edge = this.store.getEdge(edgeId);
        if (!edge) return;
        this.updateEdgeConnector(edge, patch);
      }),
      s.on("edge:remove", ({ edgeId }) => {
        this.dirtyStateEdges.delete(edgeId);
        this.deferredEdgeInstalls.delete(edgeId);
        this.edgeDecorationSlots.delete(edgeId);
        this.edgeBadgeSlots.delete(edgeId);
        this.edgeEffectSlots.delete(edgeId);
        this.unpublishSpec(edgeId);
        this._renderer?.removeConnector(edgeId);
      }),
      // Runtime (presence) state toggles — mark dirty; the flush handler drains
      // them once each (dedup), keeping an N-item highlight to one paint (§2.5).
      s.on("node:state", ({ nodeId, name }) => {
        this.dirtyStateNodes.add(nodeId);
        if (name !== COLLAPSED_STATE) return;
        const node = this.store.getNode(nodeId);
        if (!node || !this.isGroupNode(node)) return;
        if (this.isCollapsedGroup(node)) this.centreCollapsedFrame(node);
        else if (this.lastCollapsedByGroup.get(nodeId) === true) this.centreOpeningMembers(node);
        this.dirtyGroups.add(nodeId);
        this.syncGroupCollapse(node);
      }),
      s.on("edge:state", ({ edgeId }) => {
        this.dirtyStateEdges.add(edgeId);
      }),
      // Explicit per-element visibility. Re-render the node (its spec now
      // carries `visible: false`) and cascade to every incident edge, whose
      // *effective* visibility follows this endpoint (derived — the store fires
      // no per-edge event). Both drain once via the `flush` handler below.
      s.on("node:visibility", ({ nodeId }) => {
        this.dirtyStateNodes.add(nodeId);
        for (const edge of this.store.edgesOf(nodeId, "both")) {
          this.dirtyStateEdges.add(edge.id);
        }
      }),
      s.on("edge:visibility", ({ edgeId }) => {
        this.dirtyStateEdges.add(edgeId);
      }),
      s.on("flush", (counters) => {
        this.drainDirtyGroups();
        if (this.dirtyStateNodes.size > 0) {
          for (const nodeId of this.dirtyStateNodes) this.rerenderNode(nodeId);
          this.dirtyStateNodes.clear();
        }
        if (this.dirtyStateEdges.size > 0) {
          for (const edgeId of this.dirtyStateEdges) this.rerenderEdge(edgeId, true);
          this.dirtyStateEdges.clear();
        }
        if (this.deferredEdgeInstalls.size > 0) {
          const retry = [...this.deferredEdgeInstalls];
          this.deferredEdgeInstalls.clear();
          for (const edgeId of retry) this.rerenderEdge(edgeId);
        }
        if (this.dirtyConnectors.size > 0 && this._renderer) {
          for (const edgeId of this.dirtyConnectors) {
            this._renderer.updateConnector(edgeId, {});
          }
          this.dirtyConnectors.clear();
        }
        this.events.emit("data:changed", { ...counters });
      })
    );
    this.subs.push(ctx.events.on("theme:change", (theme) => this.applyTheme(theme.palette)));
    const currentTheme = ctx.theme.current();
    if (currentTheme) this.applyTheme(currentTheme.palette);
    this.subs.push(this.journalNodeDrags());
    if (this.initialData) {
      const initial = this.initialData;
      this.store.internal.run(() => this.setData(initial));
      this.store.flush();
    }
    if (ctx.log) this.detachLog = this.store.attachLog(ctx.log, this.id);
  }
  /**
   * Apply a resolved theme palette to the layer's base look: node label +
   * border, edge stroke + arrowheads + labels, and group-frame fills. Only
   * roles present in the palette are written, so the single-layer shorthand's
   * empty palette is a no-op. Per-type styling templates (Phase B) layer their
   * role-based styling on top of this base.
   */
  applyTheme(palette) {
    this.themePalette = { ...FALLBACK_PALETTE, ...palette };
    const nodePatch = paletteToNodeDefaults(palette);
    if (hasAny(nodePatch)) this.setNodeDefaults(nodePatch);
    const edgePatch = paletteToEdgeDefaults(palette);
    if (hasAny(edgePatch)) this.setEdgeDefaults(edgePatch);
    const groupPatch = paletteToGroupStyle(palette);
    if (hasAny(groupPatch)) {
      for (const node of this.store.nodes()) {
        if (!this.isGroupNode(node)) continue;
        const prevStyle = node.style ?? {};
        this.store.internal.updateNode(node.id, { style: { ...prevStyle, ...groupPatch } });
      }
    }
    if (this.nodeTypes && !hasAny(nodePatch)) this.redraw();
  }
  /**
   * Resolve a per-type binding into a `NodeStyle` fragment. Card structures
   * compile to a `composite` shape; simple structures to shape + label fields.
   * All colour roles are resolved against the current palette here, so nothing
   * role-shaped reaches the renderer. A missing structure yields no fragment.
   */
  resolveTypeBinding(node, binding) {
    const struct = this.nodeStructures[binding.structure];
    if (!struct) return {};
    const styling = this.nodeStylings[binding.styling];
    const frag = struct.kind === "freeform" ? compileFreeform(struct, node, this.themePalette) : struct.kind === "card" ? compileCard(struct, styling, binding.bindings, node, this.themePalette) : compileSimple(struct, styling, binding.bindings, node, this.themePalette);
    const badges = compileBadges(styling, node, this.themePalette);
    const size = compileSize(styling?.size, node);
    if (!styling?.group && badges === void 0 && size === void 0) return frag;
    return {
      ...frag,
      ...styling?.group ? { group: styling.group } : {},
      ...badges !== void 0 ? { badges } : {},
      ...size !== void 0 ? { size } : {}
    };
  }
  /**
   * Journal node drags as one `'move'` history entry per gesture: every
   * dragged primary (a multi-selection drag moves them all) plus each one's
   * descendants (a group drag) is snapshot at `node:drag-start`, and the net
   * change is recorded at `node:drag-end` through {@link GraphStore.recordApplied}.
   * Nothing per frame, so layout writes and programmatic moves stay out of
   * history. A drag-end inside an open log group (`DragNodeBehaviour`'s
   * pin-on-release) joins that entry. Returns the unsubscribe.
   */
  journalNodeDrags() {
    const store = this.store;
    let before = null;
    const offStart = this.events.on("node:drag-start", ({ nodeId, nodeIds }) => {
      const ids = /* @__PURE__ */ new Set();
      for (const primary of nodeIds ?? [nodeId]) {
        ids.add(primary);
        for (const desc of store.descendantsOf(primary)) ids.add(desc);
      }
      before = /* @__PURE__ */ new Map();
      for (const id of ids) {
        const p = store.getPosition(id);
        if (p) before.set(id, { x: p.x, y: p.y });
      }
    });
    const offEnd = this.events.on("node:drag-end", () => {
      const snap = before;
      before = null;
      if (!snap) return;
      const ops = [];
      for (const [id, from] of snap) {
        const to = store.getPosition(id);
        if (to && (to.x !== from.x || to.y !== from.y)) {
          ops.push({ kind: "moveNode", id, before: from, after: { x: to.x, y: to.y } });
        }
      }
      store.recordApplied(ops, { title: "move" });
    });
    return () => {
      offStart();
      offEnd();
    };
  }
  onUnmount() {
    for (const off of this.subs) off();
    this.subs.length = 0;
    if (this.placementGrace !== void 0) {
      clearTimeout(this.placementGrace);
      this.placementGrace = void 0;
    }
    this.store.setPlacementPending(false);
    this.projector?.destroy();
    this.projector = void 0;
    this.store.bindBus(void 0);
    this.detachLog?.();
    this.detachLog = void 0;
    this._renderer = void 0;
  }
  // ─── Bulk loading ────────────────────────────────────────────────────────
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
  setData(data) {
    if (data.nodes.length === 0 && data.edges.length === 0) {
      this.clear();
      return;
    }
    this.detachAllFromRenderer();
    this.store.batch(() => {
      this.store.clear();
      this.store.addNodesBulk(data.nodes);
      this.store.addEdgesBulk(data.edges);
    });
  }
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
  loadData(data) {
    this.store.internal.run(() => this.setData(data));
    this.ctx?.log?.clear();
  }
  /**
   * Serialise this layer's graph data — every node (with its live position,
   * `pinned` flag, style, states and payload) and every edge — to a plain
   * {@link GraphData} object safe to `JSON.stringify`.
   *
   * Implements the engine's structural `DataSerializableLayer` contract, so
   * `Canvas.exportState()` picks this layer's data up automatically. Round-trips
   * through {@link importData}.
   */
  exportData() {
    return { nodes: [...this.store.nodes()], edges: [...this.store.edges()] };
  }
  /**
   * Replace this layer's data from a {@link GraphData} snapshot produced by
   * {@link exportData} — the import half of the `DataSerializableLayer`
   * contract. Delegates to {@link setData}, so the renderer teardown/repaint and
   * dependent-layer notifications all run.
   */
  importData(data) {
    this.setData(data);
  }
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
  serializeDefinition() {
    return jsonSafe({
      // Whole-layer visibility so a hidden layer restores hidden. Only emitted
      // when hidden (default is visible) to keep the definition slice lean.
      ...this.visible === false ? { visible: false } : {},
      ...this.nodeOption ? { node: this.nodeOption } : {},
      ...this.edgeOption ? { edge: this.edgeOption } : {},
      ...this.options.useDefaultStates !== void 0 ? { useDefaultStates: this.options.useDefaultStates } : {},
      ...this.options.hitFloorPx !== void 0 ? { hitFloorPx: this.options.hitFloorPx } : {},
      nodeStructureTemplates: this.nodeStructures,
      nodeStylingTemplates: this.nodeStylings,
      nodeTypes: this.nodeTypes
    });
  }
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
  clear() {
    const removedNodes = this.store.nodeCount();
    const removedEdges = this.store.edgeCount();
    this.detachAllFromRenderer();
    this.store.clear();
    this.events.emit("data:changed", {
      addedNodes: 0,
      updatedNodes: 0,
      removedNodes,
      addedEdges: 0,
      updatedEdges: 0,
      removedEdges,
      hiddenNodes: 0,
      shownNodes: 0
    });
  }
  /**
   * Force a full re-render of every node and edge from current store state +
   * active states. Does **not** mutate data and is **not** undoable — it is a
   * pure render pass. Use it after an external style/theme change that bypassed
   * the store (e.g. swapping the renderer's palette) or to recover from a
   * suspected render desync. For data edits prefer the store mutators, which
   * re-render the affected items automatically.
   */
  redraw() {
    for (const node of this.store.nodes()) this.rerenderNode(node.id);
    for (const edge of this.store.edges()) this.rerenderEdge(edge.id);
  }
  /**
   * Keep hit-testing in step with whole-layer visibility. `WorldLayer` hides the
   * pixi container; graph picking runs through the renderer's own pointer router
   * (not `layer.hitTest`), so a hidden layer would otherwise stay clickable. Gate
   * the renderer's `hitTest` so a hidden layer's nodes/edges are non-interactive
   * too (decision 11 of the visibility plan).
   */
  onVisibleChange(value) {
    super.onVisibleChange(value);
    this._renderer?.setHitTestEnabled(value);
  }
  /**
   * Drop every shape / connector this layer has mounted on the renderer and
   * reset transient routing state. Shared by `clear` / `setData`: `store.clear()`
   * is silent, so it never drives the renderer's event-based removal path —
   * the layer must detach explicitly.
   */
  detachAllFromRenderer() {
    const renderer = this._renderer;
    if (!renderer) return;
    this.specStore?.clear();
    for (const node of this.store.nodes()) renderer.removeShape(node.id);
    for (const edge of this.store.edges()) renderer.removeConnector(edge.id);
    this.dirtyConnectors.clear();
    this.deferredEdgeInstalls.clear();
  }
  // ─── Layer-level template (defaults) ──────────────────────────────────────
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
  setNodeDefaults(patch) {
    this.nodeOption = {
      ...this.nodeOption,
      style: {
        ...this.nodeOption?.style ?? {},
        ...patch
      }
    };
    for (const node of this.store.nodes()) this.rerenderNode(node.id);
    this.events.emit("style:changed", { scope: "node" });
  }
  /**
   * Sibling of {@link setNodeDefaults} for the edge template
   * (`options.edge.style`). Patches the shared edge styling and re-renders
   * every edge. Same shallow-merge contract — e.g. changing edge "type" means
   * `setEdgeDefaults({ shape: { ...prevShape, pathType: 'bezier' } })`.
   */
  setEdgeDefaults(patch) {
    this.edgeOption = {
      ...this.edgeOption,
      style: {
        ...this.edgeOption?.style ?? {},
        ...patch
      }
    };
    for (const edge of this.store.edges()) this.rerenderEdge(edge.id);
    this.events.emit("style:changed", { scope: "edge" });
  }
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
  setStateConfigs(patch) {
    if (patch.node) {
      this.nodeOption = {
        ...this.nodeOption,
        state: { ...this.nodeOption?.state ?? {}, ...patch.node }
      };
    }
    if (patch.edge) {
      this.edgeOption = {
        ...this.edgeOption,
        state: { ...this.edgeOption?.state ?? {}, ...patch.edge }
      };
    }
    this.redraw();
    this.events.emit("style:changed", { scope: "state" });
  }
  /**
   * Live-update entry point. Dispatches a `GraphLayerOptions` slice to the
   * concrete setters: `node.style` → {@link setNodeDefaults}, `edge.style` →
   * {@link setEdgeDefaults}, `node.state` / `edge.state` →
   * {@link setStateConfigs}. Called by `GraphCanvas.update()` per id.
   */
  setOptions(patch) {
    if (patch.node?.style) this.setNodeDefaults(patch.node.style);
    if (patch.edge?.style) this.setEdgeDefaults(patch.edge.style);
    if (patch.node?.state || patch.edge?.state) {
      this.setStateConfigs({
        node: patch.node?.state,
        edge: patch.edge?.state
      });
    }
    let templatesChanged = false;
    if (patch.nodeStructureTemplates) {
      this.nodeStructures = { ...this.nodeStructures, ...patch.nodeStructureTemplates };
      templatesChanged = true;
    }
    if (patch.nodeStylingTemplates) {
      this.nodeStylings = { ...this.nodeStylings, ...patch.nodeStylingTemplates };
      templatesChanged = true;
    }
    if (patch.nodeTypes) {
      this.nodeTypes = { ...this.nodeTypes, ...patch.nodeTypes };
      templatesChanged = true;
    }
    if (templatesChanged && this.mounted) this.redraw();
  }
  /** Read-only snapshot of the current node template style (resolved per node at render). */
  get nodeDefaults() {
    return this.nodeOption?.style;
  }
  /** Read-only snapshot of the current edge template style. */
  get edgeDefaults() {
    return this.edgeOption?.style;
  }
  // ─── State sugar ──────────────────────────────────────────────────────────
  //
  // Interaction state is owned by the `GraphStore` (presence compartment) — set
  // it via `layer.store.addNodeState` / `removeNodeState` / `clearNodeState`
  // (+ edge variants). The layer only adds graph-domain *sugar* that composes
  // several store writes; the layer itself holds no state.
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
  highlightNeighbourhood(id, dir = "both", state = "highlighted") {
    if (!this.store.hasNode(id)) return;
    this.store.batch(() => {
      this.store.addNodeState(id, state);
      for (const nb of this.store.neighborsOf(id, dir)) this.store.addNodeState(nb, state);
      for (const e of this.store.edgesOf(id, dir)) this.store.addEdgeState(e.id, state);
    });
  }
  // ─── Hit testing (placeholder) ───────────────────────────────────────────
  /**
   * Placeholder hit test — returns `null` until proper hit testing wires up
   * in a later phase (likely via the canvas hit-test pipeline reading the
   * renderer's shape registry).
   */
  hitTest(_worldX, _worldY) {
    return null;
  }
  // ─── Internals: data → spec translation ─────────────────────────────────
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
  resolveNodeStyle(node) {
    const merged = {};
    if (this.nodeOption?.style) {
      assignNodeStyle(merged, resolveNodeStyleFields(this.nodeOption.style, node));
    }
    if (this.nodeTypes && node.type) {
      const binding = this.nodeTypes[node.type];
      if (binding) assignNodeStyle(merged, this.resolveTypeBinding(node, binding));
    }
    assignNodeStyle(merged, node.style ?? {});
    const activeStates = this.store.nodeStatesOf(node.id);
    if (activeStates.length > 0) {
      const perNodeCatalogue = node.state;
      for (const name of activeStates) {
        const layerOverlay = this.nodeOption?.state?.[name];
        if (layerOverlay) {
          assignNodeStyle(merged, resolveNodeStyleFields(layerOverlay, node));
        }
        const perNodeOverlay = perNodeCatalogue?.[name];
        if (perNodeOverlay) assignNodeStyle(merged, perNodeOverlay);
      }
    }
    if (merged.size !== void 0) {
      const baseShape = merged.shape ?? { kind: "circle", radius: 0 };
      const normalized = normalizeShapeSize(baseShape, merged.size);
      if (normalized !== baseShape || merged.shape === void 0) {
        merged.shape = normalized;
      }
    }
    return merged;
  }
  /** Sibling of {@link resolveNodeStyle} for edges. Public for the same reason. */
  resolveEdgeStyle(edge) {
    const merged = {};
    if (this.edgeOption?.style) {
      Object.assign(merged, resolveEdgeStyleFields(this.edgeOption.style, edge));
    }
    Object.assign(merged, edge.style ?? {});
    const activeStates = this.store.edgeStatesOf(edge.id);
    if (activeStates.length > 0) {
      const perEdgeCatalogue = edge.state;
      for (const name of activeStates) {
        const layerOverlay = this.edgeOption?.state?.[name];
        if (layerOverlay) {
          Object.assign(merged, resolveEdgeStyleFields(layerOverlay, edge));
        }
        const perEdgeOverlay = perEdgeCatalogue?.[name];
        if (perEdgeOverlay) Object.assign(merged, perEdgeOverlay);
      }
    }
    return merged;
  }
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
  boundsOfNode(node) {
    if (!this._renderer) return void 0;
    return this._renderer.boundsOfSpec(this.nodeSpec(node));
  }
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
  getBounds(opts) {
    const includeHidden = opts?.includeHidden ?? false;
    const only = opts?.ids ? new Set(opts.ids) : null;
    const renderer = this._renderer;
    if (!renderer) return only ? null : super.getBounds();
    this.store.flush();
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    let any = false;
    const union = (r) => {
      if (!r) return;
      any = true;
      if (r.x < minX) minX = r.x;
      if (r.y < minY) minY = r.y;
      if (r.x + r.width > maxX) maxX = r.x + r.width;
      if (r.y + r.height > maxY) maxY = r.y + r.height;
    };
    for (const node of this.store.nodes()) {
      if (only && !only.has(node.id)) continue;
      if (!includeHidden && !this.store.isNodeVisible(node.id)) continue;
      const spec = this.nodeSpec(node);
      const local = renderer.boundsOfSpec(spec);
      if (local) {
        union({ x: spec.x + local.x, y: spec.y + local.y, width: local.width, height: local.height });
      } else {
        union(renderer.getShapeWorldBounds(node.id));
      }
    }
    for (const edge of only ? [] : this.store.edges()) {
      if (!includeHidden && !this.store.isEdgeVisible(edge.id)) continue;
      const poly = renderer.getConnectorPolyline(edge.id);
      if (!poly || poly.length === 0) continue;
      for (const p of poly) union({ x: p.x, y: p.y, width: 0, height: 0 });
    }
    if (!any) return only ? null : super.getBounds();
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  }
  // ─── Visibility (hide / show) ─────────────────────────────────────────────
  //
  // Convenience wrappers over the store so callers that already hold the layer
  // (they call `focusNode` / `focusEdges`) don't reach into the store. The store
  // owns the effective-visibility rule + events; the renderer culls hidden
  // elements via the `visible` flag in `nodeSpec` / `edgeSpec`, and the
  // node-hide path cascades to incident edges through the store's
  // `node:visibility` handler above.
  /** Hide a node (culls it + its incident edges). Delegates to the store. */
  hideNode(id) {
    this.store.hideNode(id);
  }
  /** Show a previously-hidden node. Delegates to the store. */
  showNode(id) {
    this.store.showNode(id);
  }
  /** Flip a node's hidden flag. Returns the resulting hidden state. */
  toggleNodeHidden(id) {
    return this.store.toggleNodeHidden(id);
  }
  /** True iff the node is explicitly hidden. */
  isNodeHidden(id) {
    return this.store.isNodeHidden(id);
  }
  /** Effective visibility of a node (live and not explicitly hidden). */
  isNodeVisible(id) {
    return this.store.isNodeVisible(id);
  }
  /** Hide many nodes in one batch → one paint. */
  hideNodes(ids) {
    this.store.hideNodes(ids);
  }
  /** Show many nodes in one batch → one paint. */
  showNodes(ids) {
    this.store.showNodes(ids);
  }
  /** Hide an edge. Delegates to the store. */
  hideEdge(id) {
    this.store.hideEdge(id);
  }
  /** Show a previously-hidden edge. Delegates to the store. */
  showEdge(id) {
    this.store.showEdge(id);
  }
  /** Flip an edge's hidden flag. Returns the resulting hidden state. */
  toggleEdgeHidden(id) {
    return this.store.toggleEdgeHidden(id);
  }
  /** True iff the edge's explicit hidden flag is set. */
  isEdgeHidden(id) {
    return this.store.isEdgeHidden(id);
  }
  /** Effective visibility of an edge (not hidden and both endpoints visible). */
  isEdgeVisible(id) {
    return this.store.isEdgeVisible(id);
  }
  /** Hide many edges in one batch → one paint. */
  hideEdges(ids) {
    this.store.hideEdges(ids);
  }
  /** Show many edges in one batch → one paint. */
  showEdges(ids) {
    this.store.showEdges(ids);
  }
  /** Clear every explicit hidden flag (nodes + edges). */
  showAllHidden() {
    this.store.showAllHidden();
  }
  // ─── Group visibility (node + parentId subtree) ─────────────────────────────
  //
  // A "group" today is a container node (`isGroupNode` / `style.group`) whose
  // members are its `parentId` descendants — there is no separate groups
  // collection yet (that's the future bubble-sets model). Unlike {@link hideNode}
  // (which hides only the node — no parentId cascade, decision 9), the group
  // methods deliberately hide/show the container **and its whole subtree** so a
  // group vanishes/returns as a unit. Each call is one batch → one paint;
  // incident edges auto-hide via the endpoint cascade. `showGroup(s)` reveals the
  // entire subtree unconditionally (the clean inverse; re-hide specific members
  // after if needed).
  /** Hide a group node and all its `parentId` descendants. One batch → one paint. */
  hideGroup(id) {
    this.hideGroups([id]);
  }
  /** Show a group node and all its `parentId` descendants. One batch → one paint. */
  showGroup(id) {
    this.showGroups([id]);
  }
  /**
   * Flip a group's visibility by the container node's state — hides the whole
   * subtree when it becomes hidden, shows it when it becomes visible. Returns the
   * resulting hidden state of the group node.
   */
  toggleGroupHidden(id) {
    if (this.store.isNodeHidden(id)) {
      this.showGroup(id);
      return false;
    }
    this.hideGroup(id);
    return true;
  }
  /** Hide many groups (each container + its subtree) in one batch → one paint. */
  hideGroups(ids) {
    const transitioned = [];
    this.store.batch(() => {
      for (const id of ids) {
        if (!this.store.isNodeHidden(id)) transitioned.push(id);
        this.store.hideNode(id);
        for (const descendant of this.store.descendantsOf(id)) this.store.hideNode(descendant);
      }
    });
    for (const groupId of transitioned) this.events.emit("group:visibility", { groupId, hidden: true });
  }
  /** Show many groups (each container + its subtree) in one batch → one paint. */
  showGroups(ids) {
    const transitioned = [];
    this.store.batch(() => {
      for (const id of ids) {
        if (this.store.isNodeHidden(id)) transitioned.push(id);
        this.store.showNode(id);
        for (const descendant of this.store.descendantsOf(id)) this.store.showNode(descendant);
      }
    });
    for (const groupId of transitioned) this.events.emit("group:visibility", { groupId, hidden: false });
  }
  /**
   * Whether a group container is currently hidden. **Derived** from the
   * container node's hidden flag (the source of truth), so it can't drift — no
   * cached group index. `id` should be a group container node id; for a
   * non-group node this simply reports that node's hidden state.
   */
  isGroupHidden(id) {
    return this.store.isNodeHidden(id);
  }
  /**
   * Ids of every currently-hidden **group container** — a UI ("hidden groups"
   * panel) helper so callers don't hand-roll the derivation. Computed on demand
   * from `store.hiddenNodes()` ∩ group nodes (not a maintained index, so always
   * correct); recompute it on the store's `node:visibility` event rather than
   * every render. If your app already tracks its group ids, intersecting them
   * with `store.hiddenNodes()` is cheaper than this `isGroupNode` scan.
   */
  hiddenGroups() {
    const out = [];
    for (const id of this.store.hiddenNodes()) {
      const node = this.store.getNode(id);
      if (node && this.isGroupNode(node)) out.push(id);
    }
    return out;
  }
  // ─── Viewport framing ─────────────────────────────────────────────────────
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
  focusNodes(ids, opts) {
    const includeHidden = opts?.includeHidden ?? false;
    const pts = [];
    for (const id of ids) {
      if (!includeHidden && this.store.isNodeHidden(id)) continue;
      const pos = this.store.getPosition(id);
      if (pos) pts.push(pos);
    }
    this.centerOnPoints(pts);
  }
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
  focusNode(id, opts) {
    this.focusNodes([id], { includeHidden: opts?.includeHidden ?? false });
    const camera = this.ctx?.camera;
    if (camera && opts?.zoom !== void 0) {
      camera.setZoom(Math.max(camera.scale, opts.zoom));
    }
  }
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
  focusEdges(ids, opts) {
    const includeHidden = opts?.includeHidden ?? false;
    const pts = [];
    for (const id of ids) {
      const edge = this.store.getEdge(id);
      if (!edge) continue;
      if (!includeHidden && !this.store.isEdgeVisible(id)) continue;
      const a = this.store.getPosition(edge.source);
      const b = this.store.getPosition(edge.target);
      if (a) pts.push(a);
      if (b) pts.push(b);
    }
    this.centerOnPoints(pts);
  }
  /** Pan the camera to the centre of the AABB spanning `pts`. No-op if empty / unmounted. */
  centerOnPoints(pts) {
    const camera = this.ctx?.camera;
    if (!camera || pts.length === 0) return;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const p of pts) {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    }
    camera.centerOn((minX + maxX) / 2, (minY + maxY) / 2);
  }
  nodeSpec(node) {
    const style = this.resolveNodeStyle(node);
    let shape = style.shape ?? { kind: "circle", radius: 10 };
    let pos = node.position ?? { x: 0, y: 0 };
    const group = style.group;
    const collapsedFrame = group !== void 0 && this.isCollapsedGroup(node);
    if (group && !collapsedFrame) {
      const fitted = this.projectGroupShape(node.id, shape, group, pos);
      shape = fitted.shape;
      pos = fitted.pos;
    }
    if (collapsedFrame && !this.collapsedOverlayDeclaresShape(node)) {
      const minimal = this._renderer?.collapsedShapeSpec(shape);
      if (minimal) shape = { ...shape, ...minimal };
    }
    shape = this.fitShapeToLabel(shape, style);
    const culled = !this.store.isNodeVisible(node.id);
    const bg = style.bgFill;
    const hasImage = style.image !== void 0;
    const hasIcon = style.icon !== void 0;
    const shapeFill = shape.fill;
    let fill;
    if (!hasImage && !hasIcon && typeof bg === "number") {
      fill = bg;
    } else if (bg === void 0 && !hasImage && !hasIcon) {
      fill = shapeFill;
    } else {
      const layers = [];
      if (typeof bg === "number") {
        layers.push({ kind: "solid", color: bg });
      } else if (Array.isArray(bg)) {
        for (const l of bg) layers.push(l);
      } else if (bg !== void 0) {
        layers.push(bg);
      }
      if (style.image !== void 0) {
        const img = style.image;
        layers.push({
          kind: "image",
          url: img.url,
          ...img.alpha !== void 0 ? { alpha: img.alpha } : {},
          ...img.fit !== void 0 ? { fit: img.fit } : {},
          ...img.padding !== void 0 ? { padding: img.padding } : {}
        });
      }
      if (style.icon !== void 0) {
        layers.push(style.icon);
      }
      fill = layers.length > 0 ? layers : void 0;
    }
    const bgStrokeWidth = style.bgStrokeWidth ?? 0;
    const stroke = style.bgStrokeColor !== void 0 && bgStrokeWidth > 0 ? {
      color: style.bgStrokeColor,
      width: bgStrokeWidth,
      alignment: style.bgStrokeAlignment ?? "outside",
      ...style.bgStrokeAlpha !== void 0 ? { alpha: style.bgStrokeAlpha } : {},
      ...style.bgStrokeDashArray ? { dashArray: style.bgStrokeDashArray } : {},
      ...style.bgStrokeDashOffset !== void 0 ? { dashOffset: style.bgStrokeDashOffset } : {}
    } : void 0;
    const baseZ = style.zIndex;
    let zIndex = baseZ;
    let plane = "content";
    if (group && !collapsedFrame && group.behindChildren !== false) {
      zIndex = (baseZ ?? 0) - 1;
      plane = "backdrop";
    }
    const { x, y } = shapeRenderXY(shape, pos);
    const spec = {
      ...shape,
      x,
      y,
      // Always emit `alpha` (default opaque) — same partial-merge reasoning as
      // `visible` below. A transient state (e.g. `dimmed`, `bgAlpha: 0.25`) sets
      // it; when that state clears and the base style doesn't pin `bgAlpha`,
      // omitting the field here would leave the dimmed alpha stuck on the cached
      // spec. Emitting `1` restores opacity on state removal.
      alpha: style.bgAlpha ?? 1,
      // Always emit `fill` — same partial-merge reasoning as `alpha` above and
      // `visible` below. The renderer merges patches onto the cached spec, so
      // omitting the field when `fill` resolves to `undefined` (a style clearing
      // `bgFill` — e.g. a colour-by-label behaviour restoring on disable) would
      // leave the previously-painted fill stuck on the cached spec. Emitting
      // `undefined` lets `applyFill` clear it back to an unfilled silhouette.
      fill,
      ...stroke ? { stroke } : {},
      ...zIndex !== void 0 ? { zIndex } : {},
      // Always emit `plane` — same partial-merge reasoning as `alpha` / `fill` /
      // `visible`. A frame that collapses stops being a backdrop, and omitting
      // the field on that pass would leave a stale `'backdrop'` on the cached
      // spec: a collapsed group node rendering under the edges it terminates.
      plane,
      // Always emit `visible` — the renderer partial-merges patches onto
      // the cached spec, so omitting the field on the "now visible" pass
      // after a collapse → expand (or show) transition would leave the previous
      // `visible: false` in place and the node would stay hidden.
      visible: !culled
    };
    const b = this._renderer?.boundsOfSpec(spec);
    if (b) this.store.setNodeBoundingBox(node.id, { width: b.width, height: b.height });
    return spec;
  }
  /**
   * Build the renderer-facing connector spec from the resolved
   * {@link EdgeStyle}. The three-stage pipeline (anchor → router →
   * pathStyle) is driven by `style.shape.pathType` + the anchor / router
   * options on the same struct; paint comes from the flat `stroke*` fields.
   */
  edgeSpec(edge) {
    const style = this.resolveEdgeStyle(edge);
    const shape = style.shape ?? {};
    const pathType = shape.pathType ?? "straight";
    const { router, pathStyle } = pathTypeToRouterPathStyle(pathType);
    const baseAnchor = "boundary";
    const sourceAnchorName = shape.sourceAnchor ?? baseAnchor;
    const targetAnchorName = shape.targetAnchor ?? baseAnchor;
    const sourceAnchorOpts = shape.sourceAnchorOpts;
    const targetAnchorOpts = shape.targetAnchorOpts;
    const pathStyleOpts = shape.pathStyleOpts ?? {};
    const waypoints = shape.waypoints;
    const strokeColor = style.strokeColor ?? 9741240;
    const strokeWidth = style.strokeWidth ?? 1.5;
    const alpha = style.strokeAlpha ?? 1;
    const arrowTargetShape = style.arrowTargetShape ?? "triangle";
    const arrowTargetColor = style.arrowTargetColor ?? strokeColor;
    const sourceAnchorSpec = sourceAnchorOpts && Object.keys(sourceAnchorOpts).length > 0 ? { name: sourceAnchorName, opts: sourceAnchorOpts } : sourceAnchorName;
    const targetAnchorSpec = targetAnchorOpts && Object.keys(targetAnchorOpts).length > 0 ? { name: targetAnchorName, opts: targetAnchorOpts } : targetAnchorName;
    const sourceShapeId = this.effectiveEndpoint(edge.source);
    const targetShapeId = this.effectiveEndpoint(edge.target);
    const isCollapseSelfLoop = sourceShapeId === targetShapeId && edge.source !== edge.target;
    const edgeVisible = !isCollapseSelfLoop && this.store.isEdgeVisible(edge.id);
    return {
      kind: "connector",
      source: { kind: "shape", shapeId: sourceShapeId, anchor: sourceAnchorSpec },
      target: { kind: "shape", shapeId: targetShapeId, anchor: targetAnchorSpec },
      router,
      pathStyle,
      ...pathStyleOpts && Object.keys(pathStyleOpts).length > 0 ? { pathStyleOpts } : {},
      ...waypoints && waypoints.length > 0 ? { waypoints } : {},
      stroke: {
        color: strokeColor,
        width: strokeWidth,
        ...style.strokeAlignment !== void 0 ? { alignment: style.strokeAlignment } : {},
        ...style.strokeDashArray ? { dashArray: style.strokeDashArray } : {},
        ...style.strokeDashOffset !== void 0 ? { dashOffset: style.strokeDashOffset } : {}
      },
      alpha,
      visible: edgeVisible,
      // Always emit the marker keys (as `undefined` when off), never omit them.
      // `updateConnector` shallow-merges the spec, so an omitted key would keep a
      // previously-drawn marker — e.g. an edge that first renders with the default
      // `'triangle'` then re-renders with `'none'` (config/layout applied after the
      // first paint, as in the sankey story) would otherwise keep its arrowhead.
      targetMarker: markerSpecFor(
        arrowTargetShape,
        arrowTargetColor,
        style.arrowTargetSize,
        style.arrowTargetAlpha,
        strokeWidth
      ),
      sourceMarker: markerSpecFor(
        style.arrowSourceShape,
        style.arrowSourceColor ?? strokeColor,
        style.arrowSourceSize,
        style.arrowSourceAlpha,
        strokeWidth
      )
    };
  }
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
  rerenderNode(id) {
    if (!this._renderer) return;
    const node = this.store.getNode(id);
    if (!node) return;
    this.publishSpec(id, this.nodeSpec(node));
    this.syncNodeLabel(id);
    this.syncNodeDecorations(id);
    this.syncNodeEffects(id);
    this.syncNodeBadges(id);
    this.syncGroupSyntheticDecorations(id);
    this.queueIncidentConnectors(id);
    this.drainDirtyConnectors();
  }
  /**
   * Re-render a single edge from its current data + active state stack.
   *
   * Always uses `renderer.updateConnector` so `inst.strokeWidthScale`
   * (written by `EdgeScaleLODBehaviour` as `1/cameraScale`) survives the
   * state-driven full-spec replacement. The fresh spec carries the new
   * "base" stroke width; the multiplier applies on top at draw time.
   */
  rerenderEdge(id, stateOnly = false) {
    if (!this._renderer) return;
    const edge = this.store.getEdge(id);
    if (!edge) return;
    const spec = this.edgeSpec(edge);
    if (!this._renderer.hasConnector(id) && !this.endpointShapesInstalled(spec)) {
      this.deferredEdgeInstalls.add(id);
      return;
    }
    if (this._renderer.hasConnector(id)) {
      const stroke = spec.stroke;
      if (stateOnly && this.strokeIsPlain(stroke) && this._renderer.connectorGeometryUnchanged(id, spec)) {
        this._renderer.setConnectorStroke(id, {
          color: stroke.color,
          width: stroke.width
        });
      } else {
        this._renderer.updateConnector(id, spec);
      }
    } else {
      this._renderer.addConnector(id, spec);
    }
    this.syncEdgeLabel(id);
    this.syncEdgeDecorations(id);
    this.syncEdgeEffects(id);
    this.syncEdgeBadges(id);
  }
  /**
   * True iff a connector stroke is representable by the `setConnectorStroke`
   * fast path — carries a numeric `color` + `width` and nothing else (no dash /
   * alignment). Anything richer must go through the full re-render.
   */
  strokeIsPlain(stroke) {
    if (!stroke || typeof stroke.color !== "number" || typeof stroke.width !== "number") {
      return false;
    }
    for (const k in stroke) if (k !== "color" && k !== "width") return false;
    return true;
  }
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
  endpointShapesInstalled(spec) {
    const renderer = this._renderer;
    if (!renderer) return false;
    for (const end of [spec.source, spec.target]) {
      if (end.kind === "shape" && !renderer.hasShape(end.shapeId)) return false;
    }
    return true;
  }
  drainDirtyConnectors() {
    if (this.dirtyConnectors.size === 0 || !this._renderer) return;
    for (const edgeId of this.dirtyConnectors) {
      this._renderer.updateConnector(edgeId, {});
    }
    this.dirtyConnectors.clear();
  }
  installNodeShape(node) {
    if (!this._renderer) return;
    this.publishSpec(node.id, this.nodeSpec(node));
    this.syncNodeLabel(node.id);
    this.syncNodeDecorations(node.id);
    this.syncNodeEffects(node.id);
    this.syncNodeBadges(node.id);
    this.syncGroupSyntheticDecorations(node.id);
  }
  installEdgeConnector(edge) {
    if (!this._renderer) return;
    const spec = this.edgeSpec(edge);
    if (!this.endpointShapesInstalled(spec)) {
      this.deferredEdgeInstalls.add(edge.id);
      return;
    }
    this.publishSpec(edge.id, spec);
    this.syncEdgeLabel(edge.id);
    this.syncEdgeDecorations(edge.id);
    this.syncEdgeEffects(edge.id);
    this.syncEdgeBadges(edge.id);
  }
  /**
   * Project the resolved `label` hint onto the canvas `'label'` decoration
   * slot for the given node. A `null` / `undefined` hint clears the slot.
   * Called after every `addShape` and every `rerenderNode` since decorations
   * are dropped when the shape is destroyed.
   */
  syncNodeLabel(id) {
    if (!this._renderer) return;
    const node = this.store.getNode(id);
    if (!node) return;
    const style = this.resolveNodeStyle(node);
    const labelStyle = style.labelStyle ?? buildShapeLabelStyle(style);
    if (!labelStyle) {
      this._renderer.setDecoration(id, "label", null);
      return;
    }
    this._renderer.setDecoration(id, "label", { kind: "label", style: labelStyle });
  }
  syncEdgeLabel(id) {
    if (!this._renderer) return;
    const edge = this.store.getEdge(id);
    if (!edge) return;
    const style = this.resolveEdgeStyle(edge);
    const labelStyle = style.labelStyle ?? buildConnectorLabelStyle(style);
    if (!labelStyle) {
      this._renderer.setDecoration(id, "label", null);
      return;
    }
    this._renderer.setDecoration(id, "label", { kind: "label-connector", style: labelStyle });
  }
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
  resolveNodeDecorations(node) {
    const collected = [];
    const pushFrom = (style) => {
      const decos = style?.decorations;
      if (decos && decos.length > 0) collected.push(...decos);
    };
    if (this.nodeOption?.style) {
      pushFrom(resolveNodeStyleFields(this.nodeOption.style, node));
    }
    pushFrom(node.style);
    const activeStates = this.store.nodeStatesOf(node.id);
    if (activeStates.length > 0) {
      const perNodeCatalogue = node.state;
      for (const name of activeStates) {
        const layerOverlay = this.nodeOption?.state?.[name];
        if (layerOverlay) {
          pushFrom(resolveNodeStyleFields(layerOverlay, node));
        }
        const perNodeOverlay = perNodeCatalogue?.[name];
        if (perNodeOverlay) pushFrom(perNodeOverlay);
      }
    }
    const out = /* @__PURE__ */ new Map();
    for (let i = 0; i < collected.length; i++) {
      const spec = collected[i];
      const slotId = spec.id ?? `${spec.kind}#${i}`;
      if (spec.remove) {
        out.delete(slotId);
      } else {
        out.set(slotId, spec);
      }
    }
    return out;
  }
  /** Sibling of {@link resolveNodeDecorations} for edges. */
  resolveEdgeDecorations(edge) {
    const collected = [];
    const pushFrom = (style) => {
      const decos = style?.decorations;
      if (decos && decos.length > 0) collected.push(...decos);
    };
    if (this.edgeOption?.style) {
      pushFrom(resolveEdgeStyleFields(this.edgeOption.style, edge));
    }
    pushFrom(edge.style);
    const activeStates = this.store.edgeStatesOf(edge.id);
    if (activeStates.length > 0) {
      const perEdgeCatalogue = edge.state;
      for (const name of activeStates) {
        const layerOverlay = this.edgeOption?.state?.[name];
        if (layerOverlay) {
          pushFrom(resolveEdgeStyleFields(layerOverlay, edge));
        }
        const perEdgeOverlay = perEdgeCatalogue?.[name];
        if (perEdgeOverlay) pushFrom(perEdgeOverlay);
      }
    }
    const out = /* @__PURE__ */ new Map();
    for (let i = 0; i < collected.length; i++) {
      const spec = collected[i];
      const slotId = spec.id ?? `${spec.kind}#${i}`;
      if (spec.remove) {
        out.delete(slotId);
      } else {
        out.set(slotId, spec);
      }
    }
    return out;
  }
  /**
   * Project the resolved decoration array onto the canvas renderer for the
   * given node. Diffs against the previous render's slot set tracked in
   * {@link nodeDecorationSlots}: mounts new ids, removes vanished ones,
   * replaces specs whose slot id appears in both.
   */
  syncNodeDecorations(id) {
    if (!this._renderer) return;
    const node = this.store.getNode(id);
    if (!node) return;
    const next = this.resolveNodeDecorations(node);
    const prev = this.nodeDecorationSlots.get(id);
    if (prev) {
      for (const slotId of prev) {
        if (!next.has(slotId)) this._renderer.setDecoration(id, slotId, null);
      }
    }
    for (const [slotId, spec] of next) {
      const { kind, style } = splitDecorationSpec(spec);
      this._renderer.setDecoration(id, slotId, { kind, style });
    }
    if (next.size === 0) this.nodeDecorationSlots.delete(id);
    else this.nodeDecorationSlots.set(id, new Set(next.keys()));
  }
  /** Sibling of {@link syncNodeDecorations} for edges. */
  syncEdgeDecorations(id) {
    if (!this._renderer) return;
    const edge = this.store.getEdge(id);
    if (!edge) return;
    const next = this.resolveEdgeDecorations(edge);
    const prev = this.edgeDecorationSlots.get(id);
    if (prev) {
      for (const slotId of prev) {
        if (!next.has(slotId)) this._renderer.setDecoration(id, slotId, null);
      }
    }
    for (const [slotId, spec] of next) {
      const { kind, style } = splitDecorationSpec(spec);
      this._renderer.setDecoration(id, slotId, { kind, style });
    }
    if (next.size === 0) this.edgeDecorationSlots.delete(id);
    else this.edgeDecorationSlots.set(id, new Set(next.keys()));
  }
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
  resolveNodeEffects(node) {
    const out = /* @__PURE__ */ new Map();
    const mergeFrom = (style) => {
      const effects = style?.effects;
      if (!effects) return;
      for (const kind of Object.keys(effects)) {
        const value = effects[kind];
        if (value === void 0) continue;
        if (value === null) out.delete(kind);
        else out.set(kind, value);
      }
    };
    if (this.nodeOption?.style) {
      mergeFrom(resolveNodeStyleFields(this.nodeOption.style, node));
    }
    mergeFrom(node.style);
    const activeStates = this.store.nodeStatesOf(node.id);
    if (activeStates.length > 0) {
      const perNodeCatalogue = node.state;
      for (const name of activeStates) {
        const layerOverlay = this.nodeOption?.state?.[name];
        if (layerOverlay) {
          mergeFrom(resolveNodeStyleFields(layerOverlay, node));
        }
        const perNodeOverlay = perNodeCatalogue?.[name];
        if (perNodeOverlay) mergeFrom(perNodeOverlay);
      }
    }
    return out;
  }
  /** Sibling of {@link resolveNodeEffects} for edges. */
  resolveEdgeEffects(edge) {
    const out = /* @__PURE__ */ new Map();
    const mergeFrom = (style) => {
      const effects = style?.effects;
      if (!effects) return;
      for (const kind of Object.keys(effects)) {
        const value = effects[kind];
        if (value === void 0) continue;
        if (value === null) out.delete(kind);
        else out.set(kind, value);
      }
    };
    if (this.edgeOption?.style) {
      mergeFrom(resolveEdgeStyleFields(this.edgeOption.style, edge));
    }
    mergeFrom(edge.style);
    const activeStates = this.store.edgeStatesOf(edge.id);
    if (activeStates.length > 0) {
      const perEdgeCatalogue = edge.state;
      for (const name of activeStates) {
        const layerOverlay = this.edgeOption?.state?.[name];
        if (layerOverlay) {
          mergeFrom(resolveEdgeStyleFields(layerOverlay, edge));
        }
        const perEdgeOverlay = perEdgeCatalogue?.[name];
        if (perEdgeOverlay) mergeFrom(perEdgeOverlay);
      }
    }
    return out;
  }
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
  syncNodeEffects(id) {
    if (!this._renderer) return;
    const node = this.store.getNode(id);
    if (!node) return;
    const next = this.resolveNodeEffects(node);
    const prev = this.nodeEffectSlots.get(id);
    if (prev) {
      for (const kind of prev.keys()) {
        if (!next.has(kind)) this._renderer.setEffect(id, kind, null);
      }
    }
    for (const [kind, style] of next) {
      if (prev?.has(kind) && effectStyleEquals(prev.get(kind), style)) continue;
      this._renderer.setEffect(id, kind, { kind, style });
    }
    if (next.size === 0) this.nodeEffectSlots.delete(id);
    else this.nodeEffectSlots.set(id, next);
  }
  /** Sibling of {@link syncNodeEffects} for edges. */
  syncEdgeEffects(id) {
    if (!this._renderer) return;
    const edge = this.store.getEdge(id);
    if (!edge) return;
    const next = this.resolveEdgeEffects(edge);
    const prev = this.edgeEffectSlots.get(id);
    if (prev) {
      for (const kind of prev.keys()) {
        if (!next.has(kind)) this._renderer.setEffect(id, kind, null);
      }
    }
    for (const [kind, style] of next) {
      if (prev?.has(kind) && effectStyleEquals(prev.get(kind), style)) continue;
      this._renderer.setEffect(id, kind, { kind, style });
    }
    if (next.size === 0) this.edgeEffectSlots.delete(id);
    else this.edgeEffectSlots.set(id, next);
  }
  /**
   * Resolve the final list of badges for a node by concatenating every
   * contributing layer (layer template + per-node base + each active state
   * overlay) and deduping by `id`. Later precedence wins. Entries without an
   * explicit `id` fall back to `badge#<combined-index>` so id-less badges
   * stack rather than collapsing.
   */
  resolveNodeBadges(node) {
    const collected = [];
    const pushFrom = (style) => {
      const badges = style?.badges;
      if (badges && badges.length > 0) collected.push(...badges);
    };
    if (this.nodeOption?.style) {
      pushFrom(resolveNodeStyleFields(this.nodeOption.style, node));
    }
    if (this.nodeTypes && node.type) {
      const styling = this.nodeStylings[this.nodeTypes[node.type]?.styling ?? ""];
      if (styling?.badges) {
        const compiled = compileBadges(styling, node, this.themePalette);
        if (compiled && compiled.length > 0) collected.push(...compiled);
      }
    }
    pushFrom(node.style);
    const activeStates = this.store.nodeStatesOf(node.id);
    if (activeStates.length > 0) {
      const perNodeCatalogue = node.state;
      for (const name of activeStates) {
        const layerOverlay = this.nodeOption?.state?.[name];
        if (layerOverlay) {
          pushFrom(resolveNodeStyleFields(layerOverlay, node));
        }
        const perNodeOverlay = perNodeCatalogue?.[name];
        if (perNodeOverlay) pushFrom(perNodeOverlay);
      }
    }
    const out = /* @__PURE__ */ new Map();
    for (let i = 0; i < collected.length; i++) {
      const badge = collected[i];
      const slotId = badge.id ?? `badge#${i}`;
      out.set(slotId, badge);
    }
    return out;
  }
  /**
   * Project the resolved badge map onto the canvas renderer for the given
   * node. Diffs against the previous render's slot set tracked in
   * {@link nodeBadgeSlots}: mounts new ids, removes vanished ones, replaces
   * specs whose slot id appears in both.
   */
  syncNodeBadges(id) {
    if (!this._renderer) return;
    const node = this.store.getNode(id);
    if (!node) return;
    const next = this.store.isNodeVisible(id) ? this.resolveNodeBadges(node) : /* @__PURE__ */ new Map();
    const prev = this.nodeBadgeSlots.get(id);
    if (prev) {
      for (const slotId of prev) {
        if (!next.has(slotId)) this._renderer.removeBadge(id, slotId);
      }
    }
    for (const [slotId, badge] of next) {
      this._renderer.setBadge(id, slotId, nodeBadgeToCanvasOptions(badge));
    }
    if (next.size === 0) this.nodeBadgeSlots.delete(id);
    else this.nodeBadgeSlots.set(id, new Set(next.keys()));
  }
  /** Sibling of {@link resolveNodeBadges} for edges. */
  resolveEdgeBadges(edge) {
    const collected = [];
    const pushFrom = (style) => {
      const badges = style?.badges;
      if (badges && badges.length > 0) collected.push(...badges);
    };
    if (this.edgeOption?.style) {
      pushFrom(resolveEdgeStyleFields(this.edgeOption.style, edge));
    }
    pushFrom(edge.style);
    const activeStates = this.store.edgeStatesOf(edge.id);
    if (activeStates.length > 0) {
      const perEdgeCatalogue = edge.state;
      for (const name of activeStates) {
        const layerOverlay = this.edgeOption?.state?.[name];
        if (layerOverlay) {
          pushFrom(resolveEdgeStyleFields(layerOverlay, edge));
        }
        const perEdgeOverlay = perEdgeCatalogue?.[name];
        if (perEdgeOverlay) pushFrom(perEdgeOverlay);
      }
    }
    const out = /* @__PURE__ */ new Map();
    for (let i = 0; i < collected.length; i++) {
      const badge = collected[i];
      const slotId = badge.id ?? `badge#${i}`;
      out.set(slotId, badge);
    }
    return out;
  }
  /** Sibling of {@link syncNodeBadges} for edges. */
  syncEdgeBadges(id) {
    if (!this._renderer) return;
    const edge = this.store.getEdge(id);
    if (!edge) return;
    const next = this.resolveEdgeBadges(edge);
    const prev = this.edgeBadgeSlots.get(id);
    if (prev) {
      for (const slotId of prev) {
        if (!next.has(slotId)) this._renderer.removeBadge(id, slotId);
      }
    }
    for (const [slotId, badge] of next) {
      this._renderer.setBadge(id, slotId, edgeBadgeToCanvasOptions(badge));
    }
    if (next.size === 0) this.edgeBadgeSlots.delete(id);
    else this.edgeBadgeSlots.set(id, new Set(next.keys()));
  }
  updateNodeShape(node, patch) {
    if (!this._renderer) return;
    const patchKeys = Object.keys(patch);
    const nonVisualOnly = patchKeys.every((k) => k === "pinned" || k === "parentId");
    if (nonVisualOnly) return;
    if ("position" in patch && patch.position && patchKeys.length === 1) {
      const shape = this.resolveNodeStyle(node).shape ?? { kind: "circle"};
      const { x, y } = shapeRenderXY(shape, patch.position);
      this._renderer.moveShape(node.id, x, y);
      this.queueIncidentConnectors(node.id);
      return;
    }
    this.publishSpec(node.id, this.nodeSpec(node));
    this.syncNodeLabel(node.id);
    this.syncNodeDecorations(node.id);
    this.syncNodeEffects(node.id);
    this.syncNodeBadges(node.id);
    this.syncGroupSyntheticDecorations(node.id);
    this.queueIncidentConnectors(node.id);
  }
  queueIncidentConnectors(nodeId) {
    for (const edge of this.store.edgesOf(nodeId, "both")) {
      this.dirtyConnectors.add(edge.id);
    }
    const node = this.store.getNode(nodeId);
    if (node && this.isCollapsedGroup(node)) {
      for (const descId of this.store.descendantsOf(nodeId)) {
        for (const edge of this.store.edgesOf(descId, "both")) {
          this.dirtyConnectors.add(edge.id);
        }
      }
    }
  }
  // ─── Group helpers ────────────────────────────────────────────────────
  /**
   * True iff `node`'s resolved style carries a `group` field — the only
   * signal that promotes the node from a regular renderable into a
   * compound-group frame.
   *
   * Cheap to call: reads {@link resolveNodeStyle} which is already
   * memoised per render cycle through `Object.assign` of the merged
   * contributions.
   */
  isGroupNode(node) {
    const style = this.resolveNodeStyle(node);
    return style.group !== void 0;
  }
  /**
   * True when this node is a group frame **and** the {@link COLLAPSED_STATE}
   * state is active on it — from the store's presence set (what
   * `CollapseExpandBehaviour` toggles) or the node's document `states[]`
   * (how a feed authors "starts closed"). Collapse is interaction state, not
   * styling, so it is never read off `style`.
   */
  isCollapsedGroup(node) {
    if (!this.isGroupNode(node)) return false;
    return this.store.nodeStatesOf(node.id).includes(COLLAPSED_STATE);
  }
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
  getGroupRole(nodeId) {
    const node = this.store.getNode(nodeId);
    if (!node) return void 0;
    if (!this.isGroupNode(node)) return "none";
    return this.isCollapsedGroup(node) ? "collapsed" : "expanded";
  }
  /**
   * Climb the `parentId` chain from `nodeId` (exclusive) and return the
   * first ancestor whose resolved style has `group.collapsed === true`, or
   * `undefined` if no such ancestor exists. Used to decide whether a node
   * is currently hidden (any collapsed ancestor → hidden) and where to
   * re-route an incident edge (to that collapsed ancestor).
   */
  collapsedAncestor(nodeId) {
    let cur = this.store.getNode(nodeId);
    while (cur?.parentId) {
      const parent = this.store.getNode(cur.parentId);
      if (!parent) return void 0;
      if (this.isCollapsedGroup(parent)) return parent.id;
      cur = parent;
    }
    return void 0;
  }
  /**
   * Resolve which renderer-side shape id an edge endpoint should attach to
   * for `nodeId`. Returns the nearest collapsed-group ancestor when the
   * node is hidden, or `nodeId` unchanged when the node is visible. Pure
   * read — the store's `edge.source` / `edge.target` are never mutated.
   */
  effectiveEndpoint(nodeId) {
    return this.collapsedAncestor(nodeId) ?? nodeId;
  }
  /**
   * Walk the `parentId` chain from `nodeId` and `add` every group ancestor
   * to {@link dirtyGroups}. Called whenever a descendant moves, is added,
   * or otherwise triggers an auto-fit recompute.
   */
  markGroupAncestorsDirty(nodeId) {
    let cur = this.store.getNode(nodeId);
    while (cur) {
      if (this.isGroupNode(cur)) this.dirtyGroups.add(cur.id);
      if (!cur.parentId) break;
      cur = this.store.getNode(cur.parentId);
    }
  }
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
  centreCollapsedFrame(node) {
    const renderer = this._renderer;
    const frame = renderer?.getShapeWorldBounds(node.id);
    if (!renderer || !frame) return;
    const spec = this.nodeSpec(node);
    const tab = renderer.boundsOfSpec(spec);
    if (!tab) return;
    const dx = frame.x + frame.width / 2 - (spec.x + tab.x + tab.width / 2);
    const dy = frame.y + frame.height / 2 - (spec.y + tab.y + tab.height / 2);
    if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return;
    const pos = node.position ?? { x: 0, y: 0 };
    this.store.setPosition(node.id, { x: pos.x + dx, y: pos.y + dy });
  }
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
  centreOpeningMembers(node) {
    const renderer = this._renderer;
    const tab = renderer?.getShapeWorldBounds(node.id);
    if (!renderer || !tab) return;
    const spec = this.nodeSpec(node);
    const frame = renderer.boundsOfSpec(spec);
    if (!frame) return;
    const dx = tab.x + tab.width / 2 - (spec.x + frame.x + frame.width / 2);
    const dy = tab.y + tab.height / 2 - (spec.y + frame.y + frame.height / 2);
    if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return;
    const ids = [];
    for (const id of this.store.descendantsOf(node.id)) {
      if (this.store.hasPosition(id)) ids.push(id);
    }
    if (ids.length === 0) return;
    const xy = new Float32Array(ids.length * 2);
    ids.forEach((id, i) => {
      const p = this.store.getPosition(id);
      xy[i * 2] = p.x + dx;
      xy[i * 2 + 1] = p.y + dy;
    });
    this.store.setPositionsBulk(ids, xy);
  }
  syncGroupCollapse(node) {
    const was = this.lastCollapsedByGroup.get(node.id) === true;
    const now = this.isCollapsedGroup(node);
    if (was === now) return;
    this.lastCollapsedByGroup.set(node.id, now);
    this.publishCollapseHidden();
    this.refreshDescendantsAndIncidentEdges(node.id);
  }
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
  static PLACEMENT_GRACE_MS = 1200;
  /** The canvas's active layout id, re-read on demand (never latched). */
  activeLayoutId() {
    return this.ctx?.store.view.getState().definition.activeLayout;
  }
  /**
   * Decide whether a layout currently owns placement, and tell the store.
   *
   * `true` only while an `activeLayout` is declared and has not yet reported a
   * run. Everything else — no layout, or a layout that has run — leaves the
   * gate open, because then `(0, 0)` is a node's real position rather than a
   * default nobody chose.
   */
  evaluatePlacementPending() {
    const pending = !!this.activeLayoutId() && !this.layoutHasRun;
    if (pending && this.placementGrace === void 0) {
      this.placementGrace = setTimeout(() => {
        this.placementGrace = void 0;
        this.layoutHasRun = true;
        this.store.setPlacementPending(false);
        this.flush();
      }, _GraphLayer.PLACEMENT_GRACE_MS);
    }
    if (!pending && this.placementGrace !== void 0) {
      clearTimeout(this.placementGrace);
      this.placementGrace = void 0;
    }
    this.store.setPlacementPending(pending);
  }
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
  publishCollapseHidden() {
    const hidden = /* @__PURE__ */ new Set();
    for (const node of this.store.nodes()) {
      if (this.collapsedAncestor(node.id) !== void 0) hidden.add(node.id);
    }
    this.store.setCollapseHidden(hidden);
  }
  /**
   * After a group flips `collapsed`, every descendant changes visibility
   * and every incident edge of every descendant needs re-routing (the
   * endpoint now resolves to either the original node or to the collapsed
   * group ancestor). Walk the subtree once, re-render each descendant
   * (which re-projects `visible`), and queue incident edges for re-route.
   */
  refreshDescendantsAndIncidentEdges(groupId) {
    const seenEdges = /* @__PURE__ */ new Set();
    const refreshEdge = (edgeId) => {
      if (seenEdges.has(edgeId)) return;
      seenEdges.add(edgeId);
      this.rerenderEdge(edgeId);
    };
    for (const descId of this.store.descendantsOf(groupId)) {
      const desc = this.store.getNode(descId);
      if (!desc) continue;
      this.rerenderNode(descId);
      for (const edge of this.store.edgesOf(descId, "both")) refreshEdge(edge.id);
    }
    for (const edge of this.store.edgesOf(groupId, "both")) refreshEdge(edge.id);
  }
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
  directChildrenWorldBounds(groupId) {
    const renderer = this._renderer;
    if (!renderer) return void 0;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    let any = false;
    for (const childId of this.store.childrenOf(groupId)) {
      const child = this.store.getNode(childId);
      if (!child) continue;
      const spec = this.nodeSpec(child);
      const local = renderer.boundsOfSpec(spec);
      if (!local) continue;
      const origin = spec;
      const wx = (origin.x ?? 0) + local.x;
      const wy = (origin.y ?? 0) + local.y;
      if (wx < minX) minX = wx;
      if (wy < minY) minY = wy;
      if (wx + local.width > maxX) maxX = wx + local.width;
      if (wy + local.height > maxY) maxY = wy + local.height;
      any = true;
    }
    return any ? { minX, minY, maxX, maxY } : void 0;
  }
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
  projectGroupShape(groupId, shape, group, pos) {
    const padding = group.padding ?? 16;
    const header = group.headerHeight ?? 0;
    const bbox = group.autoFit ? this.directChildrenWorldBounds(groupId) : void 0;
    if (shape.kind === "rect") {
      const rectShape = shape;
      let width = group.width ?? rectShape.width;
      let height = group.height ?? rectShape.height;
      let nextPos = pos;
      if (bbox) {
        const childW = bbox.maxX - bbox.minX;
        const childH = bbox.maxY - bbox.minY;
        width = Math.max(width ?? 0, childW) + 2 * padding;
        height = Math.max(height ?? 0, childH) + 2 * padding + header;
        nextPos = { x: bbox.minX - padding, y: bbox.minY - padding - header };
      } else {
        width = Math.max(width ?? 0, 1);
        height = Math.max(height ?? 0, 1);
      }
      const out = { ...rectShape, width, height };
      return { shape: out, pos: nextPos };
    }
    if (shape.kind === "tabbed-rect") {
      const tabbed = shape;
      let width = group.width ?? tabbed.width;
      let height = group.height ?? tabbed.height;
      let nextPos = pos;
      if (bbox) {
        width = Math.max(width ?? 0, bbox.maxX - bbox.minX) + 2 * padding;
        height = Math.max(height ?? 0, bbox.maxY - bbox.minY) + 2 * padding;
        nextPos = { x: bbox.minX - padding, y: bbox.minY - padding - header };
      } else {
        width = Math.max(width ?? 0, 1);
        height = Math.max(height ?? 0, 1);
      }
      const out = {
        ...tabbed,
        width,
        height,
        ...header > 0 ? { tabHeight: header } : {},
        ...group.tabAlign !== void 0 ? { tabAlign: group.tabAlign } : {},
        ...group.tabOffset !== void 0 ? { tabOffset: group.tabOffset } : {},
        ...group.tabSkew !== void 0 ? { tabSkew: group.tabSkew } : {},
        // Pinning `tabWidth` opts the tab out of fitting itself to the title;
        // leaving it unset is what enables the fit. `tabPadding` is the fit's
        // breathing room — both are read by the shape, not by the layer.
        ...group.tabWidth !== void 0 ? { tabWidth: group.tabWidth } : {},
        ...group.tabPadding !== void 0 ? { tabPadding: group.tabPadding } : {}
      };
      return { shape: out, pos: nextPos };
    }
    if (shape.kind === "circle") {
      const circleShape = shape;
      let radius = group.radius ?? circleShape.radius;
      let nextPos = pos;
      if (bbox) {
        const halfW = (bbox.maxX - bbox.minX) / 2;
        const halfH = (bbox.maxY - bbox.minY) / 2;
        const halfDiag = Math.hypot(halfW, halfH);
        radius = Math.max(radius ?? 0, halfDiag) + padding;
        nextPos = {
          x: bbox.minX + halfW,
          y: bbox.minY + halfH
        };
      } else {
        radius = Math.max(radius ?? 0, 1);
      }
      const out = { ...circleShape, radius };
      return { shape: out, pos: nextPos };
    }
    return { shape, pos };
  }
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
  fitShapeToLabel(shape, style) {
    const renderer = this._renderer;
    if (!renderer) return shape;
    const labelStyle = style.labelStyle ?? buildShapeLabelStyle(style);
    if (!labelStyle) return shape;
    const measured = renderer.measureLabel(labelStyle.content, labelStyle.wrap);
    if (!measured) return shape;
    const fitted = renderer.fitShapeSpecToContent(shape, measured);
    return fitted ? { ...shape, ...fitted } : shape;
  }
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
  collapsedOverlayDeclaresShape(node) {
    if (this.nodeOption?.state?.[COLLAPSED_STATE]?.shape !== void 0) return true;
    const perNode = node.state;
    return perNode?.[COLLAPSED_STATE]?.shape !== void 0;
  }
  /**
   * Force a group's frame to re-project right now (outside the normal
   * flush cycle). Public escape hatch for feeds that remove children
   * individually without triggering a position change on a sibling — the
   * `node:remove` event doesn't carry the parentId, so the layer can't
   * mark the parent dirty on its own. Domain code can call this after
   * `store.removeNode` to make the auto-fit frame catch up.
   */
  recomputeGroup(groupId) {
    this.dirtyGroups.add(groupId);
    this.drainDirtyGroups();
  }
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
  drainDirtyGroups() {
    const MAX_PASSES = 32;
    let pass = 0;
    while (this.dirtyGroups.size > 0 && pass++ < MAX_PASSES) {
      const ids = [...this.dirtyGroups];
      this.dirtyGroups.clear();
      ids.sort((a, b) => this.depthOf(b) - this.depthOf(a));
      for (const id of ids) {
        const node = this.store.getNode(id);
        if (!node) continue;
        this.rerenderNode(id);
        this.queueIncidentConnectors(id);
        if (node.parentId) {
          const parent = this.store.getNode(node.parentId);
          if (parent && this.isGroupNode(parent)) {
            this.dirtyGroups.add(parent.id);
          }
        }
      }
    }
  }
  /**
   * Count of ancestors between `nodeId` and the root (`parentId === undefined`).
   * Used by {@link drainDirtyGroups} to order deepest first so a child
   * group recomputes before any group that depends on its bounds.
   */
  depthOf(nodeId) {
    let d = 0;
    let cur = this.store.getNode(nodeId);
    while (cur?.parentId) {
      d++;
      cur = this.store.getNode(cur.parentId);
    }
    return d;
  }
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
  syncGroupSyntheticDecorations(id) {
    if (!this._renderer) return;
    const node = this.store.getNode(id);
    if (!node) return;
    const style = this.resolveNodeStyle(node);
    const group = style.group;
    if (!group) {
      this._renderer.setDecoration(id, "group-toggle", null);
      this._renderer.setDecoration(id, "group-count", null);
      this.lastCollapsedByGroup.delete(id);
      return;
    }
    const isCollapsed = this.isCollapsedGroup(node);
    if (group.showToggle === false) {
      this._renderer.setDecoration(id, "group-toggle", null);
    } else {
      const tp = group.togglePlacement;
      const placementStyle = typeof tp === "object" && tp !== null ? { position: tp } : { placement: tp ?? "bottom" };
      this._renderer.setDecoration(id, "group-toggle", {
        kind: "toggle",
        style: {
          state: isCollapsed ? "plus" : "minus",
          radius: 10,
          ...placementStyle
        }
      });
    }
    if (isCollapsed && group.showCollapsedCount === true) {
      this._renderer.setDecoration(id, "group-count", {
        kind: "label",
        style: {
          content: {
            kind: "text",
            text: String(this.countDescendants(id)),
            fill: 16777215,
            fontSize: 14,
            fontWeight: 700
          },
          placement: "inside-center"
        }
      });
    } else {
      this._renderer.setDecoration(id, "group-count", null);
    }
  }
  /** Number of descendants beneath `id` (the collapsed-count value). */
  countDescendants(id) {
    let count = 0;
    for (const _ of this.store.descendantsOf(id)) count++;
    return count;
  }
  updateEdgeConnector(edge, _patch) {
    if (!this._renderer) return;
    this.publishSpec(edge.id, this.edgeSpec(edge));
    this.syncEdgeLabel(edge.id);
  }
  // ── Spec publication (P1) ─────────────────────────────────────────────────
  /**
   * Publish a resolved spec as durable state, then project it.
   *
   * P2 inverted the direction here: the renderer is no longer handed a spec by
   * the caller — it is driven from the store, which is the single source of the
   * visual description. The projection is synchronous so that the label /
   * decoration / badge syncs that follow still find the element mounted.
   */
  publishSpec(id, spec) {
    this.specStore?.set(id, spec);
    this.projector?.project(id);
  }
  /** Drop a published spec — pairs with the projector's removal path. */
  unpublishSpec(id) {
    this.specStore?.delete(id);
    this.projector?.unproject(id);
  }
};
function assignNodeStyle(target, contribution) {
  const priorGroup = target.group;
  Object.assign(target, contribution);
  if (priorGroup && "group" in contribution && contribution.group) {
    target.group = { ...priorGroup, ...contribution.group };
  }
}
var ARROW_MARKER_KIND = {
  triangle: "arrow",
  diamond: "diamond",
  circle: "dot"
};
var MARKER_WIDTH_RATIO = 3 / 4;
function markerSpecFor(shape, color2, size, alpha, strokeWidth) {
  if (shape === void 0 || shape === "none") return void 0;
  const kind = ARROW_MARKER_KIND[shape] ?? "arrow";
  const fill = alpha !== void 0 ? { kind: "solid", color: color2, alpha } : color2;
  if (size === void 0 || !(strokeWidth > 0)) {
    return { kind, fill };
  }
  const lengthScale = size / strokeWidth;
  return {
    kind,
    fill,
    lengthScale,
    widthScale: lengthScale * MARKER_WIDTH_RATIO
  };
}
function shapeRenderXY(shape, pos) {
  const sc = shape;
  if (sc.kind === "composite" && typeof sc.width === "number" && typeof sc.height === "number") {
    return { x: pos.x - sc.width / 2, y: pos.y - sc.height / 2 };
  }
  return { x: pos.x, y: pos.y };
}
function normalizeShapeSize(shape, size) {
  switch (shape.kind) {
    case "circle":
      return { ...shape, radius: size };
    case "regular-polygon":
      return { ...shape, radius: size };
    case "rect": {
      const side = size * 2;
      return { ...shape, width: side, height: side };
    }
    case "arc": {
      const arc2 = shape;
      const ratio = arc2.outerR > 0 ? arc2.innerR / arc2.outerR : 0;
      return { ...arc2, outerR: size, innerR: size * ratio };
    }
    case "star": {
      const star2 = shape;
      const ratio = star2.outerRadius > 0 ? star2.innerRadius / star2.outerRadius : 0;
      return { ...star2, outerRadius: size, innerRadius: size * ratio };
    }
    default:
      return shape;
  }
}
function mergeNodeOptionWithDefaults(opt, applyDefaults) {
  if (!applyDefaults) return opt;
  const mergedState = { ...DEFAULT_NODE_STATES, ...opt?.state ?? {} };
  return { ...opt ?? {}, state: mergedState };
}
function mergeEdgeOptionWithDefaults(opt, applyDefaults) {
  if (!applyDefaults) return opt;
  const mergedState = { ...DEFAULT_EDGE_STATES, ...opt?.state ?? {} };
  return { ...opt ?? {}, state: mergedState };
}
function effectStyleEquals(a, b) {
  if (Object.is(a, b)) return true;
  if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((v, i) => effectStyleEquals(v, b[i]));
  }
  const ka = Object.keys(a);
  const kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  return ka.every(
    (k) => Object.prototype.hasOwnProperty.call(b, k) && effectStyleEquals(a[k], b[k])
  );
}
function splitDecorationSpec(spec) {
  const { kind, id: _id, remove: _remove, ...style } = spec;
  return { kind, style };
}
function nodeBadgeToCanvasOptions(badge) {
  const fillLayers = [];
  if (badge.fill !== void 0) {
    fillLayers.push({ kind: "solid", color: badge.fill });
  }
  if (badge.icon !== void 0) {
    fillLayers.push(badge.icon);
  }
  const strokeWidth = badge.strokeWidth ?? 0;
  const stroke = badge.strokeColor !== void 0 && strokeWidth > 0 ? { color: badge.strokeColor, width: strokeWidth } : void 0;
  const shape = {
    ...badge.shape,
    ...fillLayers.length > 0 ? { fill: fillLayers } : {},
    ...stroke ? { stroke } : {},
    ...badge.alpha !== void 0 ? { alpha: badge.alpha } : {},
    ...badge.zIndex !== void 0 ? { zIndex: badge.zIndex } : {}
  };
  const decorations = {};
  if (badge.decorations) {
    badge.decorations.forEach((spec, i) => {
      if (spec.remove) return;
      const slotId = spec.id ?? `${spec.kind}#${i}`;
      const { kind, style } = splitDecorationSpec(spec);
      decorations[slotId] = { kind, style };
    });
  }
  if (badge.labelText !== void 0) {
    decorations.label = {
      kind: "label",
      style: {
        content: {
          kind: "text",
          text: badge.labelText,
          ...badge.labelColor !== void 0 ? { fill: badge.labelColor } : {},
          ...badge.labelFontSize !== void 0 ? { fontSize: badge.labelFontSize } : {}
        },
        placement: "center"
      }
    };
  }
  const effects = {};
  if (badge.effects) {
    for (const [kind, style] of Object.entries(badge.effects)) {
      if (style === void 0 || style === null) continue;
      effects[kind] = { kind, style };
    }
  }
  return {
    shape,
    placement: badge.placement,
    ...badge.origin !== void 0 ? { origin: badge.origin } : {},
    ...badge.offsetX !== void 0 ? { offsetX: badge.offsetX } : {},
    ...badge.offsetY !== void 0 ? { offsetY: badge.offsetY } : {},
    ...Object.keys(decorations).length > 0 ? { decorations } : {},
    ...Object.keys(effects).length > 0 ? { effects } : {}
  };
}
function edgeBadgeToCanvasOptions(badge) {
  const fillLayers = [];
  if (badge.fill !== void 0) {
    fillLayers.push({ kind: "solid", color: badge.fill });
  }
  if (badge.icon !== void 0) {
    fillLayers.push(badge.icon);
  }
  const strokeWidth = badge.strokeWidth ?? 0;
  const stroke = badge.strokeColor !== void 0 && strokeWidth > 0 ? { color: badge.strokeColor, width: strokeWidth } : void 0;
  const shape = {
    ...badge.shape,
    ...fillLayers.length > 0 ? { fill: fillLayers } : {},
    ...stroke ? { stroke } : {},
    ...badge.alpha !== void 0 ? { alpha: badge.alpha } : {},
    ...badge.zIndex !== void 0 ? { zIndex: badge.zIndex } : {}
  };
  const decorations = {};
  if (badge.decorations) {
    badge.decorations.forEach((spec, i) => {
      if (spec.remove) return;
      const slotId = spec.id ?? `${spec.kind}#${i}`;
      const { kind, style } = splitDecorationSpec(spec);
      decorations[slotId] = { kind, style };
    });
  }
  if (badge.labelText !== void 0) {
    decorations.label = {
      kind: "label",
      style: {
        content: {
          kind: "text",
          text: badge.labelText,
          ...badge.labelColor !== void 0 ? { fill: badge.labelColor } : {},
          ...badge.labelFontSize !== void 0 ? { fontSize: badge.labelFontSize } : {}
        },
        placement: "center"
      }
    };
  }
  const effects = {};
  if (badge.effects) {
    for (const [kind, style] of Object.entries(badge.effects)) {
      if (style === void 0 || style === null) continue;
      effects[kind] = { kind, style };
    }
  }
  return {
    shape,
    placement: badge.placement,
    ...badge.origin !== void 0 ? { origin: badge.origin } : {},
    ...badge.offsetX !== void 0 ? { offsetX: badge.offsetX } : {},
    ...badge.offsetY !== void 0 ? { offsetY: badge.offsetY } : {},
    ...badge.pathOffset !== void 0 ? { pathOffset: badge.pathOffset } : {},
    ...badge.autoRotate !== void 0 ? { autoRotate: badge.autoRotate } : {},
    ...badge.keepUpright !== void 0 ? { keepUpright: badge.keepUpright } : {},
    ...Object.keys(decorations).length > 0 ? { decorations } : {},
    ...Object.keys(effects).length > 0 ? { effects } : {}
  };
}
function buildShapeLabelStyle(style) {
  if (style.labelText === void 0) {
    return void 0;
  }
  return {
    content: {
      kind: "text",
      text: style.labelText ?? "",
      ...style.labelColor !== void 0 ? { fill: style.labelColor } : {},
      ...style.labelFontSize !== void 0 ? { fontSize: style.labelFontSize } : {},
      ...style.labelFontFamily !== void 0 ? { fontFamily: style.labelFontFamily } : {},
      ...style.labelFontWeight !== void 0 ? { fontWeight: style.labelFontWeight } : {},
      ...style.labelFontStyle !== void 0 ? { fontStyle: style.labelFontStyle } : {},
      ...style.labelAlign !== void 0 ? { align: style.labelAlign } : {},
      ...style.labelLineHeight !== void 0 ? { lineHeight: style.labelLineHeight } : {},
      ...style.labelLetterSpacing !== void 0 ? { letterSpacing: style.labelLetterSpacing } : {}
    },
    ...style.labelPlacement !== void 0 ? { placement: style.labelPlacement } : {},
    ...style.labelRotation !== void 0 ? { rotation: style.labelRotation } : {},
    ...style.labelAlpha !== void 0 ? { alpha: style.labelAlpha } : {},
    ...style.labelMinFontSize !== void 0 ? { minFontSize: style.labelMinFontSize } : {},
    ...style.labelPriority !== void 0 ? { priority: style.labelPriority } : {},
    ...style.labelCollisionGroup !== void 0 ? { collisionGroup: style.labelCollisionGroup } : {},
    ...style.labelForceShow !== void 0 ? { forceShow: style.labelForceShow } : {},
    ...style.labelMinZoom !== void 0 || style.labelMaxZoom !== void 0 ? {
      visibility: {
        ...style.labelMinZoom !== void 0 ? { minZoom: style.labelMinZoom } : {},
        ...style.labelMaxZoom !== void 0 ? { maxZoom: style.labelMaxZoom } : {}
      }
    } : {},
    ...style.labelOffsetX !== void 0 || style.labelOffsetY !== void 0 ? {
      offset: {
        ...style.labelOffsetX !== void 0 ? { x: style.labelOffsetX } : {},
        ...style.labelOffsetY !== void 0 ? { y: style.labelOffsetY } : {}
      }
    } : {},
    ...buildLabelBackground(style) !== void 0 ? { background: buildLabelBackground(style) } : {}
  };
}
function buildLabelBackground(style) {
  if (style.labelBackgroundFill === void 0 && style.labelBackgroundAlpha === void 0 && style.labelBackgroundStrokeColor === void 0 && style.labelBackgroundStrokeWidth === void 0 && style.labelBackgroundPadding === void 0 && style.labelBackgroundCornerRadius === void 0) {
    return void 0;
  }
  return {
    ...style.labelBackgroundFill !== void 0 ? { fill: style.labelBackgroundFill } : {},
    ...style.labelBackgroundAlpha !== void 0 ? { fillAlpha: style.labelBackgroundAlpha } : {},
    ...style.labelBackgroundStrokeColor !== void 0 ? { stroke: style.labelBackgroundStrokeColor } : {},
    ...style.labelBackgroundStrokeWidth !== void 0 ? { strokeWidth: style.labelBackgroundStrokeWidth } : {},
    ...style.labelBackgroundPadding !== void 0 ? { padding: style.labelBackgroundPadding } : {},
    ...style.labelBackgroundCornerRadius !== void 0 ? { radius: style.labelBackgroundCornerRadius } : {}
  };
}
function resolveNodeStyleFields(cfg, subject) {
  const out = {};
  for (const k of Object.keys(cfg)) {
    const v = resolveField(cfg[k], subject);
    if (v !== void 0) out[k] = v;
  }
  return out;
}
function buildConnectorLabelStyle(style) {
  if (style.labelText === void 0) {
    return void 0;
  }
  return {
    content: {
      kind: "text",
      text: style.labelText ?? "",
      ...style.labelColor !== void 0 ? { fill: style.labelColor } : {},
      ...style.labelFontSize !== void 0 ? { fontSize: style.labelFontSize } : {},
      ...style.labelFontFamily !== void 0 ? { fontFamily: style.labelFontFamily } : {},
      ...style.labelFontWeight !== void 0 ? { fontWeight: style.labelFontWeight } : {},
      ...style.labelFontStyle !== void 0 ? { fontStyle: style.labelFontStyle } : {},
      ...style.labelAlign !== void 0 ? { align: style.labelAlign } : {},
      ...style.labelLineHeight !== void 0 ? { lineHeight: style.labelLineHeight } : {},
      ...style.labelLetterSpacing !== void 0 ? { letterSpacing: style.labelLetterSpacing } : {}
    },
    ...style.labelPlacement !== void 0 ? { placement: style.labelPlacement } : {},
    ...style.labelPathOffset !== void 0 ? { pathOffset: style.labelPathOffset } : {},
    ...style.labelAutoRotate !== void 0 ? { autoRotate: style.labelAutoRotate } : {},
    ...style.labelKeepUpright !== void 0 ? { keepUpright: style.labelKeepUpright } : {},
    ...style.labelAlpha !== void 0 ? { alpha: style.labelAlpha } : {},
    ...style.labelMinFontSize !== void 0 ? { minFontSize: style.labelMinFontSize } : {},
    ...style.labelPriority !== void 0 ? { priority: style.labelPriority } : {},
    ...style.labelCollisionGroup !== void 0 ? { collisionGroup: style.labelCollisionGroup } : {},
    ...style.labelForceShow !== void 0 ? { forceShow: style.labelForceShow } : {},
    ...style.labelMinZoom !== void 0 || style.labelMaxZoom !== void 0 ? {
      visibility: {
        ...style.labelMinZoom !== void 0 ? { minZoom: style.labelMinZoom } : {},
        ...style.labelMaxZoom !== void 0 ? { maxZoom: style.labelMaxZoom } : {}
      }
    } : {},
    ...style.labelOffsetX !== void 0 || style.labelOffsetY !== void 0 ? {
      offset: {
        ...style.labelOffsetX !== void 0 ? { x: style.labelOffsetX } : {},
        ...style.labelOffsetY !== void 0 ? { y: style.labelOffsetY } : {}
      }
    } : {},
    ...buildLabelBackground(style) !== void 0 ? { background: buildLabelBackground(style) } : {}
  };
}
function resolveEdgeStyleFields(cfg, subject) {
  const out = {};
  for (const k of Object.keys(cfg)) {
    const v = resolveField(cfg[k], subject);
    if (v !== void 0) out[k] = v;
  }
  return out;
}
var DEFAULTS = {
  width: 200,
  height: 150,
  backgroundColor: 1710638,
  borderColor: 4473924,
  borderWidth: 1,
  viewportFill: 4886745,
  viewportStroke: 2781369,
  viewportFillAlpha: 0.3,
  viewportStrokeWidth: 2,
  maskEnabled: true,
  maskColor: 0,
  maskAlpha: 0.5,
  padding: 20,
  enableDrag: true,
  position: "bottom-right",
  margin: 10,
  mode: "auto"
};
var MiniMapLayer = class extends ScreenLayer {
  kind = "minimap-layer";
  opts;
  graphLayerId;
  graph = null;
  ctxRef = null;
  /** Inner content container (the minimap's drawable area). */
  bgGfx = null;
  worldGfx = null;
  viewportGfx = null;
  /** Screen-space origin of the minimap box; the overlays are moved here. */
  originX = 0;
  originY = 0;
  /** Per-frame projection scale + offset (world → minimap-local). */
  scale = 1;
  offsetX = 0;
  offsetY = 0;
  /** Drag state. */
  isDragging = false;
  dragOffsetX = 0;
  dragOffsetY = 0;
  /** ResizeObserver disposer. */
  offResize = null;
  offCameraPan = null;
  offCameraZoom = null;
  /** `theme:change` subscriber — repaints the chrome when the theme flips. */
  offTheme = null;
  /** DOM pointer-listener disposers for the drag interaction. */
  pointerDisposers = [];
  constructor(opts) {
    super({
      ...opts,
      zIndex: opts.zIndex ?? 1e3,
      cullable: opts.cullable ?? false,
      hittable: opts.hittable ?? false
    });
    this.graphLayerId = opts.options.graphLayerId;
    this.opts = { ...DEFAULTS, ...opts.options, graphLayerId: void 0 };
  }
  createState() {
    return {};
  }
  onMount(ctx) {
    const graph = ctx.layers.get(this.graphLayerId);
    if (!graph) {
      throw new Error(
        `MiniMapLayer "${this.id}": graph layer "${this.graphLayerId}" not found. Add the GraphLayer before MiniMapLayer.`
      );
    }
    this.graph = graph;
    this.ctxRef = ctx;
    this.bgGfx = ctx.createOverlay(`${this.id}:bg`, "screen");
    this.worldGfx = ctx.createOverlay(`${this.id}:world`, "screen");
    this.viewportGfx = ctx.createOverlay(`${this.id}:viewport`, "screen");
    if (this.opts.enableDrag) this.wireInteractions();
    this.layoutPosition();
    this.repaint();
    this.offTheme = ctx.events.on("theme:change", () => this.repaint());
    this.offCameraPan = ctx.events.on("input:camera:pan", () => this.paintViewportIndicator());
    this.offCameraZoom = ctx.events.on("input:camera:zoom", () => this.paintViewportIndicator());
    const offDataChanged = graph.events.on("data:changed", () => this.repaint());
    const offStyleChanged = graph.events.on("style:changed", () => this.repaint());
    const offSourceVisibility = ctx.events.on("scene:layer:visibilitychange", ({ id }) => {
      if (id === graph.id) this.repaint();
    });
    const bgId = this.opts.backgroundLayerId;
    const offOptions = bgId ? select(ctx.store.view, (s) => s.definition.layers[bgId]).subscribe(() => this.repaint()) : () => {
    };
    if (typeof ResizeObserver !== "undefined" && ctx.canvasElement) {
      const ro = new ResizeObserver(() => {
        this.layoutPosition();
        this.repaint();
      });
      ro.observe(ctx.canvasElement);
      this.offResize = () => ro.disconnect();
    }
    const prevOffResize = this.offResize;
    this.offResize = () => {
      offDataChanged();
      offStyleChanged();
      offSourceVisibility();
      offOptions();
      prevOffResize?.();
    };
  }
  onUnmount() {
    this.offTheme?.();
    this.offTheme = null;
    this.offCameraPan?.();
    this.offCameraZoom?.();
    this.offResize?.();
    this.offCameraPan = null;
    this.offCameraZoom = null;
    this.offResize = null;
    for (const off of this.pointerDisposers) off();
    this.pointerDisposers.length = 0;
    this.bgGfx?.destroy();
    this.worldGfx?.destroy();
    this.viewportGfx?.destroy();
    this.bgGfx = null;
    this.worldGfx = null;
    this.viewportGfx = null;
    this.bgGfx = null;
    this.worldGfx = null;
    this.viewportGfx = null;
    this.graph = null;
    this.ctxRef = null;
  }
  hitTest() {
    return null;
  }
  // ─── Public API ─────────────────────────────────────────────────────────
  /** Force a re-paint. Cheap — call after mutating colours / sizes externally. */
  refresh() {
    this.repaint();
  }
  setOptions(patch) {
    this.opts = { ...this.opts, ...patch };
    this.layoutPosition();
    this.repaint();
  }
  /**
   * Set the colour-resolution mode. `'auto'` follows the active theme on
   * `ctx.theme`; `'light'` / `'dark'` pin explicitly. No-op when unchanged. The
   * minimap chrome flips in lockstep with the canvas {@link BackgroundLayer},
   * which resolves its kind from the same theme signal.
   */
  setMode(mode) {
    if (this.opts.mode === mode) return;
    this.opts = { ...this.opts, mode };
    this.repaint();
  }
  /** Current mode setting. */
  getMode() {
    return this.opts.mode;
  }
  /**
   * Concrete kind currently resolved. A pinned `mode` wins; otherwise `'auto'`
   * follows the active theme on `ctx.theme` (defaulting to `'light'` before any
   * theme is published).
   */
  getResolvedKind() {
    if (this.opts.mode === "light" || this.opts.mode === "dark") return this.opts.mode;
    return this.ctxRef?.theme.current()?.kind ?? "light";
  }
  // ─── Layout ─────────────────────────────────────────────────────────────
  viewportSize() {
    const el = this.ctxRef?.canvasElement;
    if (el) return { width: el.clientWidth || 800, height: el.clientHeight || 600 };
    return { width: 800, height: 600 };
  }
  layoutPosition() {
    if (!this.bgGfx) return;
    const { width, height, position, margin } = this.opts;
    const vp = this.viewportSize();
    const mx = typeof margin === "number" ? margin : margin.x ?? 10;
    const my = typeof margin === "number" ? margin : margin.y ?? 10;
    let x = 0;
    let y = 0;
    switch (position) {
      case "top-left":
        x = mx;
        y = my;
        break;
      case "top-right":
        x = vp.width - width - mx;
        y = my;
        break;
      case "bottom-left":
        x = mx;
        y = vp.height - height - my;
        break;
      case "bottom-right":
        x = vp.width - width - mx;
        y = vp.height - height - my;
        break;
    }
    this.originX = x;
    this.originY = y;
    this.bgGfx?.setPosition(x, y);
    this.worldGfx?.setPosition(x, y);
    this.viewportGfx?.setPosition(x, y);
  }
  // ─── Painting ───────────────────────────────────────────────────────────
  repaint() {
    if (!this.bgGfx || !this.graph || !this.ctxRef) return;
    this.projectBounds(this.effectiveBounds());
    this.paintBackground();
    this.paintWorld();
    this.paintViewportIndicator();
  }
  paintBackground() {
    const g = this.bgGfx;
    if (!g) return;
    const { width, height, borderColor, borderWidth } = this.opts;
    g.clear();
    g.rect(0, 0, width, height).fill(this.resolveBackgroundFill());
    if (borderWidth > 0) {
      g.rect(0, 0, width, height).stroke({
        color: this.resolveColor(borderColor),
        width: borderWidth
      });
    }
  }
  /**
   * The minimap backdrop colour. Mirrors the referenced {@link BackgroundLayer}
   * (`backgroundLayerId`) when one is wired and resolvable, so the minimap
   * tracks the canvas background — including theme flips — with no duplicated
   * colour. Falls back to the `backgroundColor` option otherwise.
   */
  resolveBackgroundFill() {
    const id = this.opts.backgroundLayerId;
    if (id) {
      const bg = this.ctxRef?.layers.get(id);
      if (bg instanceof BackgroundLayer) return bg.getResolvedBackgroundColor();
    }
    return this.resolveColor(this.opts.backgroundColor);
  }
  paintWorld() {
    const g = this.worldGfx;
    const graph = this.graph;
    if (!g || !graph) return;
    g.clear();
    const renderer = graph.getRenderer();
    for (const edge of graph.store.edges()) {
      if (!graph.store.isEdgeVisible(edge.id)) continue;
      const edgeStyle = graph.resolveEdgeStyle(edge);
      const stroke = typeof edgeStyle.strokeColor === "number" ? edgeStyle.strokeColor : 6710886;
      const edgeWidth = Math.max(
        MIN_EDGE_WIDTH,
        (typeof edgeStyle.strokeWidth === "number" ? edgeStyle.strokeWidth : 1) * this.scale
      );
      const edgeAlpha = typeof edgeStyle.strokeAlpha === "number" ? edgeStyle.strokeAlpha : 1;
      const polyline = renderer?.getConnectorPolyline(edge.id);
      if (polyline && polyline.length >= 2) {
        const first = this.worldToMinimap(polyline[0].x, polyline[0].y);
        g.moveTo(first.x, first.y);
        for (let i = 1; i < polyline.length; i++) {
          const p = this.worldToMinimap(polyline[i].x, polyline[i].y);
          g.lineTo(p.x, p.y);
        }
        g.stroke({ width: edgeWidth, color: stroke, alpha: edgeAlpha });
        continue;
      }
      const src = graph.store.getNode(edge.source);
      const dst = graph.store.getNode(edge.target);
      if (!src || !dst) continue;
      const sp = src.position ?? { x: 0, y: 0 };
      const tp = dst.position ?? { x: 0, y: 0 };
      const p1 = this.worldToMinimap(sp.x, sp.y);
      const p2 = this.worldToMinimap(tp.x, tp.y);
      g.moveTo(p1.x, p1.y);
      g.lineTo(p2.x, p2.y);
      g.stroke({ width: edgeWidth, color: stroke, alpha: edgeAlpha });
    }
    for (const node of graph.store.nodes()) {
      if (!graph.store.isNodeVisible(node.id)) continue;
      const bounds = renderer?.getShapeWorldBounds(node.id) ?? this.fallbackNodeBounds(node);
      if (!bounds) continue;
      const tl = this.worldToMinimap(bounds.x, bounds.y);
      const br = this.worldToMinimap(bounds.x + bounds.width, bounds.y + bounds.height);
      const w = Math.max(2, br.x - tl.x);
      const h = Math.max(2, br.y - tl.y);
      const nodeStyle = graph.resolveNodeStyle(node);
      const fillColor = typeof nodeStyle.bgFill === "number" ? nodeStyle.bgFill : 5025616;
      const kind = nodeStyle.shape?.kind;
      if (kind === "circle") {
        g.ellipse(tl.x + w / 2, tl.y + h / 2, w / 2, h / 2).fill(fillColor);
      } else {
        g.rect(tl.x, tl.y, w, h).fill(fillColor);
      }
    }
  }
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
  fallbackNodeBounds(node) {
    const graph = this.graph;
    if (!graph) return null;
    const pos = node.position ?? { x: 0, y: 0 };
    const local = graph.boundsOfNode(node) ?? FALLBACK_LOCAL_BOUNDS;
    return {
      x: pos.x + local.x,
      y: pos.y + local.y,
      width: local.width,
      height: local.height
    };
  }
  paintViewportIndicator() {
    const g = this.viewportGfx;
    const ctx = this.ctxRef;
    if (!g || !ctx) return;
    const vis = ctx.camera.getVisibleBounds();
    const tl = this.worldToMinimap(vis.x, vis.y);
    const br = this.worldToMinimap(vis.x + vis.width, vis.y + vis.height);
    g.clear();
    this.paintMask(g, tl.x, tl.y, br.x - tl.x, br.y - tl.y);
    const W = this.opts.width;
    const H = this.opts.height;
    const x = Math.max(0, Math.min(W, tl.x));
    const y = Math.max(0, Math.min(H, tl.y));
    const w = Math.max(0, Math.min(W, br.x)) - x;
    const h = Math.max(0, Math.min(H, br.y)) - y;
    if (w <= 0 || h <= 0) return;
    g.rect(x, y, w, h);
    g.fill({ color: this.resolveColor(this.opts.viewportFill), alpha: this.opts.viewportFillAlpha });
    g.rect(x, y, w, h);
    g.stroke({
      color: this.resolveColor(this.opts.viewportStroke),
      width: this.opts.viewportStrokeWidth
    });
  }
  /**
   * Paint the out-of-viewport mask: a translucent overlay covering the minimap
   * box everywhere *except* the viewport rectangle `(x, y, w, h)`, spotlighting
   * the visible region. Drawn as four border rects (top / bottom / left /
   * right) around the viewport rect, each clamped to the minimap box — avoids
   * fill-rule/hole subtleties and never bleeds past the minimap edge even when
   * the viewport rect extends beyond it. No-op when disabled or fully
   * transparent.
   */
  paintMask(g, x, y, w, h) {
    if (!this.opts.maskEnabled || this.opts.maskAlpha <= 0) return;
    const W = this.opts.width;
    const H = this.opts.height;
    const cx0 = Math.max(0, Math.min(W, x));
    const cy0 = Math.max(0, Math.min(H, y));
    const cx1 = Math.max(0, Math.min(W, x + w));
    const cy1 = Math.max(0, Math.min(H, y + h));
    if (cy0 > 0) g.rect(0, 0, W, cy0);
    if (cy1 < H) g.rect(0, cy1, W, H - cy1);
    if (cx0 > 0) g.rect(0, cy0, cx0, cy1 - cy0);
    if (cx1 < W) g.rect(cx1, cy0, W - cx1, cy1 - cy0);
    g.fill({ color: this.resolveColor(this.opts.maskColor), alpha: this.opts.maskAlpha });
  }
  // ─── Bounds + projection ────────────────────────────────────────────────
  /** Union node bounds with the current camera-visible bounds. */
  effectiveBounds() {
    const node = this.nodeBounds();
    const vis = this.ctxRef?.camera.getVisibleBounds() ?? {
      x: 0,
      y: 0,
      width: 1,
      height: 1
    };
    const minX = Math.min(node.x, vis.x);
    const minY = Math.min(node.y, vis.y);
    const maxX = Math.max(node.x + node.width, vis.x + vis.width);
    const maxY = Math.max(node.y + node.height, vis.y + vis.height);
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  }
  /**
   * AABB of all drawn node *footprints* + padding, queried directly from the
   * renderer's per-instance world bounds — so arcs / polygons / stars /
   * custom shapes contribute their true extent, not a hardcoded size-derived
   * estimate. Pre-mount nodes fall through to a position+default-size box.
   * Returns a 1000×1000 placeholder when the layer has no nodes yet.
   */
  nodeBounds() {
    const graph = this.graph;
    if (!graph || graph.store.nodeCount() === 0) {
      return { x: -500, y: -500, width: 1e3, height: 1e3 };
    }
    const renderer = graph.getRenderer();
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    let any = false;
    for (const node of graph.store.nodes()) {
      if (!graph.store.isNodeVisible(node.id)) continue;
      const b = renderer?.getShapeWorldBounds(node.id) ?? this.fallbackNodeBounds(node);
      if (!b) continue;
      any = true;
      if (b.x < minX) minX = b.x;
      if (b.y < minY) minY = b.y;
      if (b.x + b.width > maxX) maxX = b.x + b.width;
      if (b.y + b.height > maxY) maxY = b.y + b.height;
    }
    if (!any) return { x: -500, y: -500, width: 1e3, height: 1e3 };
    const pad = this.opts.padding;
    return {
      x: minX - pad,
      y: minY - pad,
      width: Math.max(1, maxX - minX + pad * 2),
      height: Math.max(1, maxY - minY + pad * 2)
    };
  }
  projectBounds(b) {
    const { width, height } = this.opts;
    const sx = width / b.width;
    const sy = height / b.height;
    this.scale = Math.min(sx, sy) * 0.9;
    this.offsetX = (width - b.width * this.scale) / 2 - b.x * this.scale;
    this.offsetY = (height - b.height * this.scale) / 2 - b.y * this.scale;
  }
  // ─── Theme colour resolution ────────────────────────────────────────────
  /** Resolve a scalar or `{ light, dark }` colour against the current mode. */
  resolveColor(c) {
    if (typeof c === "number") return c;
    return this.getResolvedKind() === "dark" ? c.dark : c.light;
  }
  worldToMinimap(wx, wy) {
    return {
      x: wx * this.scale + this.offsetX,
      y: wy * this.scale + this.offsetY
    };
  }
  minimapToWorld(mx, my) {
    return {
      x: (mx - this.offsetX) / this.scale,
      y: (my - this.offsetY) / this.scale
    };
  }
  // ─── Interactions ───────────────────────────────────────────────────────
  /**
   * Pointer handling on the canvas element rather than on a pixi display object.
   *
   * The engine forbids raw backend events outside the renderer (root rule 6),
   * and the minimap does not need picking: it owns a known screen rectangle, so
   * a hit is a coordinate comparison. Move / up go on `window` so a drag that
   * leaves the canvas still completes.
   */
  wireInteractions() {
    const el = this.ctxRef?.canvasElement;
    if (!el) return;
    const onDown = (e) => this.onMiniPointerDown(e);
    const onMove = (e) => this.onMiniPointerMove(e);
    const onUp = () => this.onMiniPointerUp();
    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    this.pointerDisposers.push(
      () => el.removeEventListener("pointerdown", onDown),
      () => window.removeEventListener("pointermove", onMove),
      () => window.removeEventListener("pointerup", onUp),
      () => window.removeEventListener("pointercancel", onUp)
    );
  }
  /**
   * Pointer position in minimap-local pixels, or `null` when the event is
   * outside the minimap box. Replaces pixi's `getLocalPosition` + `hitArea`.
   */
  localFromEvent(e) {
    const el = this.ctxRef?.canvasElement;
    if (!el) return null;
    const rect2 = el.getBoundingClientRect();
    const x = e.clientX - rect2.left - this.originX;
    const y = e.clientY - rect2.top - this.originY;
    if (x < 0 || y < 0 || x > this.opts.width || y > this.opts.height) return null;
    return { x, y };
  }
  onMiniPointerDown = (e) => {
    const ctx = this.ctxRef;
    const local = this.localFromEvent(e);
    if (!ctx || !local) return;
    const world = this.minimapToWorld(local.x, local.y);
    const vis = ctx.camera.getVisibleBounds();
    const cx = vis.x + vis.width / 2;
    const cy = vis.y + vis.height / 2;
    const inside = world.x >= vis.x && world.x <= vis.x + vis.width && world.y >= vis.y && world.y <= vis.y + vis.height;
    this.isDragging = true;
    if (inside) {
      this.dragOffsetX = world.x - cx;
      this.dragOffsetY = world.y - cy;
    } else {
      this.dragOffsetX = 0;
      this.dragOffsetY = 0;
      this.panMainCameraTo(world.x, world.y);
    }
  };
  onMiniPointerMove = (e) => {
    if (!this.isDragging || !this.ctxRef) return;
    const el = this.ctxRef.canvasElement;
    if (!el) return;
    const rect2 = el.getBoundingClientRect();
    const world = this.minimapToWorld(
      e.clientX - rect2.left - this.originX,
      e.clientY - rect2.top - this.originY
    );
    this.panMainCameraTo(world.x - this.dragOffsetX, world.y - this.dragOffsetY);
  };
  onMiniPointerUp = () => {
    this.isDragging = false;
  };
  /** Position the main camera so the world point `(wx, wy)` lands at screen centre. */
  panMainCameraTo(wx, wy) {
    const cam = this.ctxRef?.camera;
    if (!cam) return;
    const s = cam.scale;
    const tx = cam.screenWidth / 2 - wx * s;
    const ty = cam.screenHeight / 2 - wy * s;
    cam.setPosition(tx, ty);
  }
};
var FALLBACK_LOCAL_BOUNDS = { x: -16, y: -16, width: 32, height: 32 };
var MIN_EDGE_WIDTH = 0.4;

// src/schema/deriveSchema.ts
var EMPTY_SCHEMA = { nodeTypes: [], edgeTypes: [] };
var asName = (v) => typeof v === "string" && v.length > 0 ? v : void 0;
var isRecord = (v) => typeof v === "object" && v !== null;
var valueType = (v) => v === null ? "null" : Array.isArray(v) ? "array" : typeof v;
function defaultNodeTypeOf(node) {
  const d = node.data;
  return asName(node.type) ?? (isRecord(d) ? asName(d.type) ?? asName(d.label) ?? asName(d.kind) ?? asName(d.group) ?? asName(d.category) : void 0) ?? "node";
}
function defaultEdgeTypeOf(edge) {
  const d = edge.data;
  return asName(edge.type) ?? (isRecord(d) ? asName(d.type) ?? asName(d.label) ?? asName(d.kind) : void 0) ?? "edge";
}
function deriveSchema(store, { nodeTypeOf = defaultNodeTypeOf, edgeTypeOf = defaultEdgeTypeOf } = {}) {
  if (!store) return EMPTY_SCHEMA;
  const typeOfNode = /* @__PURE__ */ new Map();
  const nodeAgg = /* @__PURE__ */ new Map();
  for (const node of store.nodes()) {
    const t = nodeTypeOf(node);
    typeOfNode.set(node.id, t);
    let agg = nodeAgg.get(t);
    if (!agg) {
      agg = { count: 0, props: /* @__PURE__ */ new Map() };
      nodeAgg.set(t, agg);
    }
    agg.count += 1;
    if (isRecord(node.data)) {
      for (const [k, v] of Object.entries(node.data)) {
        let types = agg.props.get(k);
        if (!types) {
          types = /* @__PURE__ */ new Set();
          agg.props.set(k, types);
        }
        types.add(valueType(v));
      }
    }
  }
  const edgeAgg = /* @__PURE__ */ new Map();
  for (const edge of store.edges()) {
    const t = edgeTypeOf(edge);
    const from = typeOfNode.get(edge.source) ?? "node";
    const to = typeOfNode.get(edge.target) ?? "node";
    let agg = edgeAgg.get(t);
    if (!agg) {
      agg = { count: 0, conns: /* @__PURE__ */ new Map() };
      edgeAgg.set(t, agg);
    }
    agg.count += 1;
    const key = `${from} ${to}`;
    const conn = agg.conns.get(key);
    if (conn) conn.count += 1;
    else agg.conns.set(key, { from, to, count: 1 });
  }
  const byCountThenName = (a, b) => b.count - a.count || a.name.localeCompare(b.name);
  const nodeTypes = [...nodeAgg.entries()].map(([name, a]) => ({
    name,
    count: a.count,
    properties: [...a.props.entries()].map(([k, types]) => ({ name: k, type: types.size === 1 ? [...types][0] : "mixed" })).sort((p, q) => p.name.localeCompare(q.name))
  })).sort(byCountThenName);
  const edgeTypes = [...edgeAgg.entries()].map(([name, a]) => ({
    name,
    count: a.count,
    connections: [...a.conns.values()].sort((p, q) => q.count - p.count)
  })).sort(byCountThenName);
  return { nodeTypes, edgeTypes };
}
function schemaSignature(schema) {
  const nodes = schema.nodeTypes.map((n) => `${n.name}#${n.count}#${n.properties.length}`).join("|");
  const edges = schema.edgeTypes.map((e) => `${e.name}#${e.connections.map((c) => `${c.from}>${c.to}`).join(",")}`).join("|");
  return `${nodes}::${edges}`;
}

// src/layer/GraphLegendLayer.ts
var DEFAULTS2 = {
  title: "Legend",
  showNodes: true,
  showEdges: true,
  nodesTitle: "Nodes",
  edgesTitle: "Edges",
  showCounts: true,
  countMode: "both",
  sort: "count-desc",
  maxRows: 12,
  hideEmpty: false,
  fallbackColor: 10265519,
  toggleOnClick: false,
  hiddenTypeOpacity: 0.45,
  position: "top-left",
  margin: 10,
  enabled: true,
  fontSize: 11,
  opacity: 0.95,
  swatchSize: 10,
  backgroundColor: { light: "rgba(255,255,255,0.92)", dark: "rgba(10,10,10,0.82)" },
  textColor: { light: "#1f2937", dark: "#e5e7eb" },
  mutedColor: { light: "#6b7280", dark: "#9ca3af" },
  borderColor: { light: "rgba(0,0,0,0.10)", dark: "rgba(255,255,255,0.10)" },
  borderRadius: 6,
  mode: "auto"
};
var GraphLegendLayer = class extends ScreenLayer {
  kind = "graph-legend-layer";
  opts;
  graphLayerId;
  nodeTypeOf;
  edgeTypeOf;
  graph = null;
  overlay = null;
  /** Unsubscribers for every event / observer subscription taken on mount. */
  unsubs = [];
  /**
   * Pending repaint handle. Recounting is O(V+E), and the events that invalidate
   * it are bursty — `node:visibility` fires per node, so hiding 1 000 nodes
   * would otherwise mean 1 000 full recounts. Coalesce to one per frame.
   */
  rafId = null;
  /**
   * Delegated row-click handler, attached once to the overlay so it survives the
   * `innerHTML` rewrites each repaint does (a per-row listener would not).
   */
  onRowClick = null;
  /**
   * Whether the last repaint produced any rows. An empty legend (no data yet, or
   * every section switched off) hides the panel rather than floating an empty box
   * over the canvas — tracked here because {@link applyStyles} rewrites
   * `cssText` wholesale and would otherwise drop the `display` the repaint set.
   */
  hasRows = false;
  constructor(opts) {
    super({
      ...opts,
      zIndex: opts.zIndex ?? 1e3,
      cullable: opts.cullable ?? false,
      hittable: opts.hittable ?? false
    });
    const { graphLayerId, nodeTypeOf, edgeTypeOf, ...rest } = opts.options;
    this.graphLayerId = graphLayerId;
    this.nodeTypeOf = nodeTypeOf ?? defaultNodeTypeOf;
    this.edgeTypeOf = edgeTypeOf ?? defaultEdgeTypeOf;
    this.opts = { ...DEFAULTS2, ...rest };
    if (!this.opts.enabled) {
      this.state.update((s) => {
        s.enabled = false;
      }, "legend:init");
    }
  }
  createState() {
    return { enabled: true, hiddenNodeTypes: /* @__PURE__ */ new Set(), hiddenEdgeTypes: /* @__PURE__ */ new Set() };
  }
  // ── ScreenLayer hit-testing ────────────────────────────────────────────────
  /** Overlay is DOM with `pointer-events:none` — never participates in hit-testing. */
  hitTest(_screenX, _screenY) {
    return null;
  }
  // ── Lifecycle ──────────────────────────────────────────────────────────────
  onMount(ctx) {
    const graph = ctx.layers.get(this.graphLayerId);
    if (!graph) {
      throw new Error(
        `GraphLegendLayer "${this.id}": graph layer "${this.graphLayerId}" not found. Add the GraphLayer before GraphLegendLayer.`
      );
    }
    this.graph = graph;
    this.unsubs.push(graph.events.on("data:changed", () => this.schedule()));
    this.unsubs.push(graph.events.on("style:changed", () => this.schedule()));
    this.unsubs.push(graph.store.events.on("node:visibility", () => this.schedule()));
    this.unsubs.push(graph.store.events.on("edge:visibility", () => this.schedule()));
    this.unsubs.push(
      ctx.events.on("theme:change", () => {
        this.applyStyles();
        this.schedule();
      })
    );
    this.unsubs.push(
      ctx.events.on("scene:layer:visibilitychange", ({ id }) => {
        if (id === graph.id) this.schedule();
      })
    );
    if (this.opts.enabled) this.mountOverlay();
  }
  onUnmount() {
    this.cancelScheduled();
    for (const unsub of this.unsubs) unsub();
    this.unsubs = [];
    this.unmountOverlay();
    this.graph = null;
  }
  // ── Public API ─────────────────────────────────────────────────────────────
  /** Show or hide the legend at runtime without removing the layer. */
  setEnabled(enabled) {
    if (enabled) this.enable();
    else this.disable();
  }
  enable() {
    this.opts = { ...this.opts, enabled: true };
    this.state.update((s) => {
      s.enabled = true;
    }, "legend:enable");
    if (this.mounted && !this.overlay) this.mountOverlay();
  }
  disable() {
    this.opts = { ...this.opts, enabled: false };
    this.state.update((s) => {
      s.enabled = false;
    }, "legend:disable");
    this.cancelScheduled();
    this.unmountOverlay();
  }
  /**
   * Update display options at runtime. This is the seam `Canvas.update({ layers:
   * { <id>: … } })` drives, so the whole bag is serialisable — the
   * non-serialisable wiring (`graphLayerId`, the type accessors) is
   * constructor-only and ignored here.
   */
  setOptions(patch) {
    const wasEnabled = this.opts.enabled;
    this.opts = { ...this.opts, ...patch };
    if (patch.enabled !== void 0 && patch.enabled !== wasEnabled) {
      this.setEnabled(patch.enabled);
      return;
    }
    if (this.overlay) {
      this.applyStyles();
      this.repaint();
    }
  }
  /** Force an immediate recount + repaint. Cheap for typical graph sizes. */
  refresh() {
    this.cancelScheduled();
    this.repaint();
  }
  /**
   * The rows the legend is currently showing — node types then edge types, each
   * with its resolved colour and `visible` / `total` counts. Handy for a
   * DOM-free consumer (a React legend panel, a test) that wants the same tally
   * without the overlay.
   */
  getRows() {
    return { nodes: this.tallyNodes(), edges: this.tallyEdges() };
  }
  /** True iff `type` is currently toggled off from the legend. */
  isTypeHidden(kind, type) {
    const s = this.state.getState();
    return (kind === "node" ? s.hiddenNodeTypes : s.hiddenEdgeTypes).has(type);
  }
  /** The types currently toggled off, as plain arrays (node types, edge types). */
  getHiddenTypes() {
    const s = this.state.getState();
    return { nodes: [...s.hiddenNodeTypes], edges: [...s.hiddenEdgeTypes] };
  }
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
  setTypeHidden(kind, type, hidden) {
    const graph = this.graph;
    if (!graph || this.isTypeHidden(kind, type) === hidden) return;
    const store = graph.store;
    if (kind === "node") {
      const ids = [];
      for (const node of store.nodes()) if (this.nodeTypeOf(node) === type) ids.push(node.id);
      if (hidden) store.hideNodes(ids);
      else store.showNodes(ids);
    } else {
      const ids = [];
      for (const edge of store.edges()) if (this.edgeTypeOf(edge) === type) ids.push(edge.id);
      if (hidden) store.hideEdges(ids);
      else store.showEdges(ids);
    }
    this.state.update((s) => {
      const set = kind === "node" ? s.hiddenNodeTypes : s.hiddenEdgeTypes;
      if (hidden) set.add(type);
      else set.delete(type);
    }, hidden ? "legend:hideType" : "legend:showType");
    this.events.emit("type:visibility", { kind, type, hidden });
    this.schedule();
  }
  /** Bring back every type toggled off from the legend, in one batch. */
  showAllTypes() {
    const { nodes, edges } = this.getHiddenTypes();
    for (const type of nodes) this.setTypeHidden("node", type, false);
    for (const type of edges) this.setTypeHidden("edge", type, false);
  }
  /**
   * Concrete kind currently resolved. A pinned `mode` wins; otherwise `'auto'`
   * follows the theme published on `ctx.theme` (defaulting to `'light'` before
   * any theme is published).
   */
  getResolvedKind() {
    const { mode } = this.opts;
    if (mode === "light" || mode === "dark") return mode;
    return this.ctx?.theme.current()?.kind ?? "light";
  }
  // ── Interaction ────────────────────────────────────────────────────────────
  /**
   * Delegated row click: announce it, then apply the built-in toggle when
   * {@link GraphLegendLayerOptions.toggleOnClick} is on. `row:click` fires first
   * and unconditionally so a host can react even with the toggle off.
   */
  handleRowClick(kind, type) {
    const wasHidden = this.isTypeHidden(kind, type);
    const willHide = this.opts.toggleOnClick ? !wasHidden : wasHidden;
    this.events.emit("row:click", { kind, type, hidden: willHide });
    if (this.opts.toggleOnClick) this.setTypeHidden(kind, type, willHide);
  }
  // ── Repaint scheduling ─────────────────────────────────────────────────────
  /** Coalesce bursty invalidations into a single repaint on the next frame. */
  schedule() {
    if (this.rafId !== null || !this.overlay) return;
    this.rafId = requestAnimationFrame(() => {
      this.rafId = null;
      this.repaint();
    });
  }
  cancelScheduled() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }
  // ── Mount / unmount the DOM overlay ────────────────────────────────────────
  mountOverlay() {
    const canvasEl = this.context.canvasElement;
    if (!canvasEl) return;
    const parent = canvasEl.parentElement;
    if (!parent) return;
    if (window.getComputedStyle(parent).position === "static") {
      parent.style.position = "relative";
    }
    const div = document.createElement("div");
    div.dataset["graphLegendLayer"] = this.id;
    this.overlay = div;
    this.onRowClick = (e) => {
      const target = e.target;
      const row = target?.closest("[data-legend-type]");
      if (!row) return;
      const kind = row.dataset["legendKind"];
      const type = row.dataset["legendType"];
      if (kind !== "node" && kind !== "edge" || type === void 0) return;
      this.handleRowClick(kind, type);
    };
    div.addEventListener("click", this.onRowClick);
    this.applyStyles();
    parent.appendChild(div);
    this.repaint();
  }
  unmountOverlay() {
    if (this.onRowClick && this.overlay) {
      this.overlay.removeEventListener("click", this.onRowClick);
    }
    this.onRowClick = null;
    this.overlay?.remove();
    this.overlay = null;
  }
  // ── Styles ─────────────────────────────────────────────────────────────────
  /** Resolve a {@link GraphLegendColor} against the current {@link GraphLegendKind}. */
  color(c) {
    return typeof c === "string" ? c : c[this.getResolvedKind()];
  }
  applyStyles() {
    if (!this.overlay) return;
    const { position, margin, fontSize, opacity, borderRadius } = this.opts;
    const mx = typeof margin === "number" ? margin : margin.x ?? 10;
    const my = typeof margin === "number" ? margin : margin.y ?? 10;
    const inset = {
      "top-left": `top:${my}px; left:${mx}px;`,
      "top-right": `top:${my}px; right:${mx}px;`,
      "bottom-left": `bottom:${my}px; left:${mx}px;`,
      "bottom-right": `bottom:${my}px; right:${mx}px;`
    };
    this.overlay.style.cssText = [
      "position:absolute;",
      `display:${this.hasRows ? "block" : "none"};`,
      inset[position],
      `font-size:${fontSize}px;`,
      `opacity:${opacity};`,
      `background:${this.color(this.opts.backgroundColor)};`,
      `color:${this.color(this.opts.textColor)};`,
      `border:1px solid ${this.color(this.opts.borderColor)};`,
      `border-radius:${borderRadius}px;`,
      'font-family:system-ui,-apple-system,"Segoe UI",sans-serif;',
      "padding:8px 10px;",
      "line-height:1.5;",
      "pointer-events:none;",
      "z-index:9998;",
      "box-shadow:0 4px 16px rgba(0,0,0,0.18);",
      "user-select:none;",
      "backdrop-filter:blur(4px);"
    ].join("");
  }
  // ── Tallying ───────────────────────────────────────────────────────────────
  /**
   * Bucket the store's nodes by type, remembering counts and a representative
   * element per type, then resolve each representative's effective style for the
   * swatch colour. One pass over the nodes; the style resolution is once per
   * *type*, not per node.
   */
  tallyNodes() {
    const graph = this.graph;
    if (!graph || !this.opts.showNodes || !graph.visible) return [];
    const store = graph.store;
    const tallies = /* @__PURE__ */ new Map();
    for (const node of store.nodes()) {
      const type = this.nodeTypeOf(node);
      const visible = store.isNodeVisible(node.id);
      const t = tallies.get(type);
      if (!t) {
        tallies.set(type, {
          visible: visible ? 1 : 0,
          total: 1,
          first: node,
          firstVisible: visible ? node : void 0
        });
        continue;
      }
      t.total++;
      if (visible) {
        t.visible++;
        t.firstVisible ??= node;
      }
    }
    const rows = [];
    for (const [type, t] of tallies) {
      const rep = t.firstVisible ?? t.first;
      const style = graph.resolveNodeStyle(rep);
      rows.push({
        type,
        visible: t.visible,
        total: t.total,
        color: this.opts.colors?.[type] ?? fillColorOf(style.bgFill) ?? style.bgStrokeColor ?? this.opts.fallbackColor
      });
    }
    return this.finalise(rows, "node", this.opts.nodeTypes);
  }
  /** Edge-side sibling of {@link tallyNodes}, adding stroke width / dash to each row. */
  tallyEdges() {
    const graph = this.graph;
    if (!graph || !this.opts.showEdges || !graph.visible) return [];
    const store = graph.store;
    const tallies = /* @__PURE__ */ new Map();
    for (const edge of store.edges()) {
      const type = this.edgeTypeOf(edge);
      const visible = store.isEdgeVisible(edge.id);
      const t = tallies.get(type);
      if (!t) {
        tallies.set(type, {
          visible: visible ? 1 : 0,
          total: 1,
          first: edge,
          firstVisible: visible ? edge : void 0
        });
        continue;
      }
      t.total++;
      if (visible) {
        t.visible++;
        t.firstVisible ??= edge;
      }
    }
    const rows = [];
    for (const [type, t] of tallies) {
      const rep = t.firstVisible ?? t.first;
      const style = graph.resolveEdgeStyle(rep);
      rows.push({
        type,
        visible: t.visible,
        total: t.total,
        color: this.opts.colors?.[type] ?? style.strokeColor ?? this.opts.fallbackColor,
        strokeWidth: style.strokeWidth,
        dashed: style.strokeDashArray !== void 0
      });
    }
    return this.finalise(rows, "edge", this.opts.edgeTypes);
  }
  /**
   * Apply the shared row post-processing: the optional type allow-list (which
   * also fixes the order), `hideEmpty`, and {@link GraphLegendLayerOptions.sort}.
   * `maxRows` is applied at render time so the `+N more` row can be built there.
   *
   * `hideEmpty` deliberately **keeps** a row the user toggled off — dropping it
   * would delete the only control that can bring that type back.
   */
  finalise(rows, kind, allow) {
    let out = this.opts.hideEmpty ? rows.filter((r) => r.visible > 0 || this.isTypeHidden(kind, r.type)) : rows;
    if (allow) {
      const byType = new Map(out.map((r) => [r.type, r]));
      return allow.map((t) => byType.get(t)).filter((r) => r !== void 0);
    }
    out = [...out];
    if (this.opts.sort === "count-desc") {
      out.sort((a, b) => b.total - a.total || a.type.localeCompare(b.type));
    } else if (this.opts.sort === "name-asc") {
      out.sort((a, b) => a.type.localeCompare(b.type));
    }
    return out;
  }
  // ── Render ─────────────────────────────────────────────────────────────────
  repaint() {
    if (!this.overlay || !this.graph) return;
    const nodes = this.tallyNodes();
    const edges = this.tallyEdges();
    const { title, nodesTitle, edgesTitle } = this.opts;
    const html = [];
    if (title) html.push(this.headingHtml(title, true));
    if (nodes.length > 0) {
      if (nodesTitle) html.push(this.headingHtml(nodesTitle, false));
      html.push(...this.sectionHtml(nodes, "node"));
    }
    if (edges.length > 0) {
      if (edgesTitle) html.push(this.headingHtml(edgesTitle, false));
      html.push(...this.sectionHtml(edges, "edge"));
    }
    this.overlay.innerHTML = html.join("");
    this.hasRows = html.length > 0;
    this.overlay.style.display = this.hasRows ? "block" : "none";
  }
  /** The panel title (`strong`) or a section heading (muted, uppercase-ish). */
  headingHtml(text, isTitle) {
    const style = isTitle ? `font-weight:600;margin-bottom:4px;color:${this.color(this.opts.textColor)};` : `margin-top:2px;font-size:0.9em;letter-spacing:0.04em;color:${this.color(this.opts.mutedColor)};`;
    return `<div style="${style}">${escapeHtml(text)}</div>`;
  }
  /** Rows for one section, honouring `maxRows` with a trailing `+N more`. */
  sectionHtml(rows, kind) {
    const { maxRows } = this.opts;
    const capped = maxRows > 0 && rows.length > maxRows;
    const shown = capped ? rows.slice(0, maxRows) : rows;
    const html = shown.map((r) => this.rowHtml(r, kind));
    if (capped) {
      const rest = rows.length - shown.length;
      html.push(
        // Indent to the row text column: swatch width + the 6px row gap.
        `<div style="padding-left:${this.opts.swatchSize + 6}px;color:${this.color(this.opts.mutedColor)};">+${rest} more</div>`
      );
    }
    return html;
  }
  /**
   * One `[swatch] Type   count` row.
   *
   * The row carries its identity in `data-legend-kind` / `data-legend-type` for
   * the delegated click handler, and takes pointer events **only when
   * `toggleOnClick` is on** — so a non-interactive legend still lets pointer
   * input through to the scene beneath it. A type toggled off renders at
   * `hiddenTypeOpacity` with its name struck through and muted.
   */
  rowHtml(row, kind) {
    const swatch = kind === "node" ? this.nodeSwatchHtml(row) : this.edgeSwatchHtml(row);
    const count = this.opts.showCounts ? this.countHtml(row) : "";
    const interactive = this.opts.toggleOnClick;
    const off = this.isTypeHidden(kind, row.type);
    const rowStyle = "display:flex;align-items:center;gap:6px;white-space:nowrap;" + (interactive ? "cursor:pointer;pointer-events:auto;" : "") + (off ? `opacity:${this.opts.hiddenTypeOpacity};` : "");
    const nameStyle = "flex:1;" + (off ? `text-decoration:line-through;color:${this.color(this.opts.mutedColor)};` : "");
    const title = interactive ? ` title="${off ? "Click to show" : "Click to hide"} ${escapeHtml(row.type)}"` : "";
    return `<div data-legend-kind="${kind}" data-legend-type="${escapeHtml(row.type)}"${title} style="${rowStyle}">` + swatch + `<span style="${nameStyle}">${escapeHtml(row.type)}</span>` + count + `</div>`;
  }
  /** A filled circle in the node type's colour — geometry-agnostic on purpose. */
  nodeSwatchHtml(row) {
    const d = this.opts.swatchSize;
    return `<span style="flex:0 0 ${d}px;width:${d}px;height:${d}px;border-radius:50%;background:${cssHex(row.color)};"></span>`;
  }
  /**
   * A short line in the edge type's stroke colour, at its resolved width, dashed
   * when the style dashes the path. Drawn as a `border-top` so CSS gives us the
   * dash pattern for free.
   */
  edgeSwatchHtml(row) {
    const w = this.opts.swatchSize + 4;
    const thickness = Math.max(1, Math.min(4, Math.round(row.strokeWidth ?? 2)));
    const style = row.dashed ? "dashed" : "solid";
    return `<span style="flex:0 0 ${w}px;width:${w}px;height:0;border-top:${thickness}px ${style} ${cssHex(row.color)};"></span>`;
  }
  /**
   * `visible / total` in `'both'` mode, collapsed to a single number when the
   * two agree (an unfiltered graph shouldn't read `40 / 40`).
   */
  countHtml(row) {
    const { countMode } = this.opts;
    const text = countMode === "visible" ? String(row.visible) : countMode === "total" ? String(row.total) : row.visible === row.total ? String(row.total) : `${row.visible} / ${row.total}`;
    return `<span style="color:${this.color(this.opts.mutedColor)};font-variant-numeric:tabular-nums;">${text}</span>`;
  }
};
function fillColorOf(fill) {
  if (typeof fill === "number") return fill;
  if (Array.isArray(fill)) {
    for (const layer of fill) {
      const c = fillColorOf(layer);
      if (c !== void 0) return c;
    }
    return void 0;
  }
  if (fill && typeof fill === "object") {
    const l = fill;
    if (l.kind === "solid" && typeof l.color === "number") return l.color;
  }
  return void 0;
}
function cssHex(color2) {
  return `#${(color2 & 16777215).toString(16).padStart(6, "0")}`;
}
function escapeHtml(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
var DEFAULT_OFFSET = { x: 24, y: 24 };
function defaultRemapId(oldId, attempt) {
  return attempt === 0 ? `${oldId}-copy` : `${oldId}-copy-${attempt}`;
}
var GraphClipboard = class {
  /** Fires `change` whenever the buffer's contents change (copy / clear). */
  events = new EventEmitter();
  store;
  pasteOffset;
  remapId;
  bufferedNodes = [];
  bufferedEdges = [];
  constructor(store, opts = {}) {
    this.store = store;
    this.pasteOffset = opts.pasteOffset ?? DEFAULT_OFFSET;
    this.remapId = opts.remapId ?? defaultRemapId;
  }
  /** True iff the buffer holds at least one node or edge (drives "can paste"). */
  get hasContent() {
    return this.bufferedNodes.length > 0 || this.bufferedEdges.length > 0;
  }
  /** The offset applied to pasted node positions. */
  get offset() {
    return this.pasteOffset;
  }
  /** Change the offset applied to pasted node positions (from the next paste). */
  setPasteOffset(offset) {
    this.pasteOffset = offset;
  }
  /** Empty the buffer. */
  clearBuffer() {
    this.bufferedNodes = [];
    this.bufferedEdges = [];
    this.events.emit("change", { hasContent: false });
  }
  /**
   * Snapshot the given ids into the buffer (clones, so later store mutations
   * don't mutate the buffer). Unknown ids are skipped. Replaces prior contents.
   */
  copy(nodeIds, edgeIds = []) {
    this.bufferedNodes = [];
    this.bufferedEdges = [];
    for (const id of nodeIds) {
      if (this.store.isNodeHidden(id)) continue;
      const node = this.store.getNode(id);
      if (node) this.bufferedNodes.push(node);
    }
    for (const id of edgeIds) {
      if (!this.store.isEdgeVisible(id)) continue;
      const edge = this.store.getEdge(id);
      if (edge) this.bufferedEdges.push(edge);
    }
    this.events.emit("change", { hasContent: this.hasContent });
  }
  /** Copy the ids into the buffer, then delete them as one undoable entry. */
  cut(nodeIds, edgeIds) {
    this.copy(nodeIds, edgeIds);
    this.remove("cut", nodeIds, edgeIds);
  }
  /** Delete the given ids as one undoable entry. Buffer is left untouched. */
  delete(nodeIds, edgeIds) {
    this.remove("delete", nodeIds, edgeIds);
  }
  /**
   * Insert the buffer with fresh ids (collision-free) and a position offset, as
   * one undoable entry. Only buffered edges whose **both** endpoints were
   * also buffered are pasted, with endpoints remapped to the new node ids.
   * `parentId` is remapped when the parent was pasted too, else dropped.
   *
   * Returns the new ids so the caller can re-select the pasted items.
   */
  paste() {
    if (!this.hasContent) return { nodeIds: [], edgeIds: [] };
    const nodeIdMap = /* @__PURE__ */ new Map();
    const taken = /* @__PURE__ */ new Set();
    for (const node of this.bufferedNodes) {
      nodeIdMap.set(node.id, this.freshId(node.id, taken));
    }
    const newNodes = this.bufferedNodes.map((node) => {
      const next = { ...node, id: nodeIdMap.get(node.id) };
      if (node.position) {
        next.position = {
          x: node.position.x + this.pasteOffset.x,
          y: node.position.y + this.pasteOffset.y
        };
      }
      if (node.parentId !== void 0) {
        const mapped = nodeIdMap.get(node.parentId);
        if (mapped) next.parentId = mapped;
        else delete next.parentId;
      }
      return next;
    });
    const newEdges = [];
    for (const edge of this.bufferedEdges) {
      const source = nodeIdMap.get(edge.source);
      const target = nodeIdMap.get(edge.target);
      if (!source || !target) continue;
      newEdges.push({ ...edge, id: this.freshId(edge.id, taken), source, target });
    }
    this.store.applyDelta({ added: { nodes: newNodes, edges: newEdges } }, { title: "paste" });
    return { nodeIds: newNodes.map((n) => n.id), edgeIds: newEdges.map((e) => e.id) };
  }
  // ─── Internals ────────────────────────────────────────────────────────────
  /** Remove explicit edges first, then nodes (cascading) — `applyDelta`'s order — as one labelled entry. */
  remove(title, nodeIds, edgeIds) {
    this.store.applyDelta({ removed: { nodeIds, edgeIds } }, { title });
  }
  /** Pick the first remapped id that is neither already in the store nor reserved. */
  freshId(oldId, taken) {
    let attempt = 0;
    let candidate = this.remapId(oldId, attempt);
    while (this.store.hasNode(candidate) || this.store.hasEdge(candidate) || taken.has(candidate)) {
      attempt++;
      candidate = this.remapId(oldId, attempt);
    }
    taken.add(candidate);
    return candidate;
  }
};

// src/canvas/graphActions.ts
function isClearable(layer) {
  return typeof layer?.clear === "function";
}
function clearGraphLayer(canvas, layerId) {
  const layer = canvas.layers.get(layerId);
  if (!isClearable(layer)) return;
  const log = layer.store?.operationLog;
  if (log && !log.replaying) log.group({ title: "clear" }, () => layer.clear());
  else layer.clear();
}
function selectedElementIds(canvas, clickSelectId) {
  const behaviour = canvas.behaviours.get(clickSelectId);
  return {
    nodeIds: behaviour ? behaviour.getSelectedShapeIds() : [],
    edgeIds: behaviour ? behaviour.getSelectedConnectorIds() : []
  };
}
function copySelection(canvas, clipboard, clickSelectId) {
  const { nodeIds, edgeIds } = selectedElementIds(canvas, clickSelectId);
  clipboard.copy(nodeIds, edgeIds);
}
function cutSelection(canvas, clipboard, clickSelectId) {
  const { nodeIds, edgeIds } = selectedElementIds(canvas, clickSelectId);
  clipboard.cut(nodeIds, edgeIds);
}
function deleteSelection(canvas, clipboard, clickSelectId) {
  const { nodeIds, edgeIds } = selectedElementIds(canvas, clickSelectId);
  clipboard.delete(nodeIds, edgeIds);
}
function pasteAndSelect(canvas, clipboard, clickSelectId) {
  const { nodeIds, edgeIds } = clipboard.paste();
  canvas.behaviours.get(clickSelectId)?.selectMultiple([
    ...nodeIds.map((id) => ({ id, type: "shape" })),
    ...edgeIds.map((id) => ({ id, type: "connector" }))
  ]);
}
function edgeShape(layer) {
  const shape = layer.edgeDefaults?.shape;
  return shape && typeof shape === "object" ? shape : {};
}
function edgePathType(layer) {
  return edgeShape(layer).pathType;
}
function setEdgePathType(layer, type) {
  layer.setEdgeDefaults({ shape: { ...edgeShape(layer), pathType: type } });
}

// src/canvas/selectMode.ts
function resolveSelectMode(modes, isEnabled) {
  for (const [mode, id] of Object.entries(modes)) {
    if (id && isEnabled(id)) return mode;
  }
  const keys = Object.keys(modes);
  return keys.find((k) => !modes[k]) ?? keys[0] ?? null;
}
function selectModePatch(modes, next) {
  const patch = {};
  for (const [mode, id] of Object.entries(modes)) {
    if (id) patch[id] = { enabled: mode === next };
  }
  return patch;
}

// src/canvas/graphCommands.ts
var DEFAULT_EDGE_TYPES = ["straight", "orth", "bezier", "rounded", "smooth"];
var DEFAULT_EDGE_TYPE_LABELS = {
  straight: "Straight",
  orth: "Orthogonal",
  bezier: "Curved",
  quadratic: "Quadratic",
  rounded: "Rounded",
  smooth: "Smooth",
  manhattan: "Manhattan",
  "bump-radial": "Bump (radial)",
  "bump-horizontal": "Bump (horizontal)",
  "step-radial": "Step (radial)",
  bundle: "Bundled"
};
var DEFAULT_SELECT_MODES = { click: "", brush: "brush-select", lasso: "lasso-select" };
var DEFAULT_SELECT_LABELS = {
  click: "Click select",
  brush: "Brush select",
  lasso: "Lasso select"
};
var SELECT_ICONS = { click: "pointer", brush: "select-box", lasso: "lasso" };
function arg(args, key) {
  return args && typeof args === "object" ? args[key] : void 0;
}
function graphLayer(canvas, args, defaultLayerId = "graph") {
  return canvas.layers.get(arg(args, "layerId") ?? defaultLayerId);
}
function layerArg(defaultLayerId) {
  return { layerId: { kind: "layer", label: "Layer", default: defaultLayerId } };
}
var LAYER_ARG = layerArg("graph");
function selectionArgs(defaultLayerId) {
  return {
    ...layerArg(defaultLayerId),
    clickSelectId: { kind: "behaviour", label: "Selection", default: "click-select", description: "The click-select behaviour to read" }
  };
}
var TOOL_OPTIONS = {
  select: { value: "select", label: "Select", icon: "pointer" },
  add: { value: "add", label: "Add node", icon: "plus" },
  connect: { value: "connect", label: "Connect", icon: "spline" },
  delete: { value: "delete", label: "Delete", icon: "eraser" }
};
var interaction = (canvas) => canvas.store.view.getState().interaction;
var clickSelection = (canvas, args) => selectedElementIds(canvas, arg(args, "clickSelectId") ?? "click-select");
function eraseCommand(defaultLayerId = "graph") {
  return {
    label: "Erase",
    args: selectionArgs(defaultLayerId),
    isEnabled: (canvas, args) => graphLayer(canvas, args, defaultLayerId) !== void 0,
    isActive: (canvas, args) => {
      const { nodeIds, edgeIds } = clickSelection(canvas, args);
      return nodeIds.length + edgeIds.length > 0;
    },
    run: (canvas, args) => {
      const layer = graphLayer(canvas, args, defaultLayerId);
      if (!layer) return;
      const { nodeIds, edgeIds } = clickSelection(canvas, args);
      if (nodeIds.length + edgeIds.length === 0) {
        canvas.commands.run("graph.clear", { ...args && typeof args === "object" ? args : {}, layerId: layer.id });
        return;
      }
      new GraphClipboard(layer.store).delete(nodeIds, edgeIds);
    }
  };
}
var clickSelectIdOf = (args) => arg(args, "clickSelectId") ?? "click-select";
function editCommands(access, defaultLayerId = "graph") {
  const layerIdOf = (args) => arg(args, "layerId") ?? defaultLayerId;
  const clipboardArgs = selectionArgs(defaultLayerId);
  const hasSelection = (canvas, args) => {
    const { nodeIds, edgeIds } = clickSelection(canvas, args);
    return nodeIds.length + edgeIds.length > 0;
  };
  const clipboardCommand = (label2, when, run) => ({
    label: label2,
    args: clipboardArgs,
    isEnabled: (canvas, args) => {
      const clipboard = access.clipboard(layerIdOf(args));
      return clipboard !== null && when(canvas, args, clipboard);
    },
    run: (canvas, args) => {
      const clipboard = access.clipboard(layerIdOf(args));
      if (clipboard) run(canvas, clipboard, clickSelectIdOf(args));
    }
  });
  const commands = {
    "graph.clear": {
      label: "Clear canvas",
      args: layerArg(defaultLayerId),
      isEnabled: (canvas, args) => graphLayer(canvas, args, defaultLayerId) !== void 0,
      run: (canvas, args) => clearGraphLayer(canvas, layerIdOf(args))
    },
    "graph.erase": eraseCommand(defaultLayerId),
    "clipboard.cut": clipboardCommand("Cut", (c, a) => hasSelection(c, a), (c, cb, sel) => cutSelection(c, cb, sel)),
    "clipboard.copy": clipboardCommand("Copy", (c, a) => hasSelection(c, a), (c, cb, sel) => copySelection(c, cb, sel)),
    "clipboard.paste": clipboardCommand("Paste", (_c, _a, cb) => cb.hasContent, (c, cb, sel) => pasteAndSelect(c, cb, sel)),
    "clipboard.delete": clipboardCommand("Delete", (c, a) => hasSelection(c, a), (c, cb, sel) => deleteSelection(c, cb, sel))
  };
  for (const name of Object.keys(commands)) commands[name] = { ...GRAPH_META[name], ...commands[name] };
  return commands;
}
var selectModes = (args) => arg(args, "modes") ?? DEFAULT_SELECT_MODES;
var GRAPH_COMMANDS = {
  "select.mode": {
    label: "Select",
    args: {
      value: { kind: "string", label: "Mode", pick: true },
      modes: { kind: "json", label: "Modes", default: DEFAULT_SELECT_MODES, description: "Mode \u2192 behaviour id" },
      labels: { kind: "json", label: "Labels", default: DEFAULT_SELECT_LABELS, description: "Mode \u2192 label" }
    },
    // The first mode whose behaviour is enabled, else the behaviour-less mode
    // (`click`), else the first — `resolveSelectMode`, shared with `useSelectMode`.
    // Reads the live behaviours (the hook reads the definition).
    value: (canvas, args) => resolveSelectMode(selectModes(args), (id) => !!canvas.behaviours.get(id)?.enabled),
    options: (_canvas, args) => {
      const labels = arg(args, "labels") ?? DEFAULT_SELECT_LABELS;
      return Object.keys(selectModes(args)).map((mode) => ({
        value: mode,
        label: labels[mode] ?? mode,
        ...SELECT_ICONS[mode] ? { icon: SELECT_ICONS[mode] } : {}
      }));
    },
    // Through `canvas.update`, so the definition and the behaviours move together.
    run: (canvas, args) => {
      const next = arg(args, "value");
      if (next === void 0) return;
      canvas.update({ behaviours: selectModePatch(selectModes(args), next) });
    }
  },
  "graph.edgeType": {
    label: "Edges",
    args: {
      ...LAYER_ARG,
      value: { kind: "string", label: "Edge type", pick: true },
      types: { kind: "strings", label: "Types", default: DEFAULT_EDGE_TYPES }
    },
    value: (canvas, args) => {
      const layer = graphLayer(canvas, args);
      if (!layer) return null;
      const types = arg(args, "types") ?? DEFAULT_EDGE_TYPES;
      return edgePathType(layer) ?? types[0] ?? null;
    },
    options: (_canvas, args) => (arg(args, "types") ?? DEFAULT_EDGE_TYPES).map((t) => ({
      value: t,
      label: DEFAULT_EDGE_TYPE_LABELS[t] ?? t,
      icon: `edge-${t}`
    })),
    isEnabled: (canvas, args) => graphLayer(canvas, args) !== void 0,
    run: (canvas, args) => {
      const layer = graphLayer(canvas, args);
      const next = arg(args, "value");
      if (!layer || !next) return;
      setEdgePathType(layer, next);
    }
  },
  "graph.redraw": {
    label: "Redraw",
    args: LAYER_ARG,
    isEnabled: (canvas, args) => graphLayer(canvas, args) !== void 0,
    run: (canvas, args) => graphLayer(canvas, args)?.redraw()
  },
  // The modeller tool lives in the view store, so these re-read on every mode
  // write with no `invalidate()`. Behaviours follow it through their `modes`.
  "tool.active": {
    label: "Tool",
    args: {
      value: { kind: "enum", label: "Tool", pick: true, options: Object.values(TOOL_OPTIONS) },
      tools: { kind: "strings", label: "Tools", default: Object.keys(TOOL_OPTIONS), description: "Tools the picker offers, in order" }
    },
    value: (canvas) => interaction(canvas).viewMode,
    // As a toggle item (`args: { value: 'add' }`): pressed while that tool is on.
    isActive: (canvas, args) => interaction(canvas).viewMode === arg(args, "value"),
    // `args.tools` narrows / reorders the offered tools.
    options: (_canvas, args) => {
      const tools = arg(args, "tools") ?? Object.keys(TOOL_OPTIONS);
      return tools.filter((t) => t in TOOL_OPTIONS).map((t) => TOOL_OPTIONS[t]);
    },
    run: (canvas, args) => {
      const value = arg(args, "value");
      if (value) canvas.store.actions.viewMode.set(value);
    }
  },
  "tool.nodeKind": {
    label: "Shape",
    args: {
      value: { kind: "string", label: "Shape", pick: true },
      kinds: { kind: "json", label: "Shapes", description: "Shape key \u2192 label" }
    },
    value: (canvas) => interaction(canvas).viewModeArgs.nodeKind ?? null,
    // `args.kinds` (key → label) lists the shapes; without it, only the current one.
    options: (canvas, args) => {
      const kinds = arg(args, "kinds");
      if (kinds) return Object.entries(kinds).map(([value, label2]) => ({ value, label: label2 }));
      const current = interaction(canvas).viewModeArgs.nodeKind;
      return current ? [{ value: current, label: current }] : [];
    },
    isEnabled: (canvas) => interaction(canvas).viewMode === "add",
    run: (canvas, args) => {
      const value = arg(args, "value");
      if (value) canvas.store.actions.viewMode.setArgs({ nodeKind: value });
    }
  },
  "layout.activate": {
    label: "Layout",
    args: { value: { kind: "layout", label: "Layout", pick: true } },
    value: (canvas) => canvas.store.view.getState().definition.activeLayout,
    options: (canvas) => canvas.layouts.list().map((l) => ({ value: l.id, label: l.id })),
    isEnabled: (canvas) => canvas.layouts.list().length > 0,
    // `GraphCanvas.update` re-wires and runs `activeLayout` itself.
    run: (canvas, args) => {
      const id = arg(args, "value");
      if (id && canvas.layouts.has(id)) canvas.update({ activeLayout: id });
    }
  }
};
var GRAPH_META = {
  "select.mode": { category: "Selection", keywords: ["brush", "lasso", "click"] },
  "graph.edgeType": { category: "View", keywords: ["routing", "curved", "straight", "orthogonal"] },
  "graph.clear": { category: "Edit", keywords: ["empty", "remove all", "reset"] },
  "graph.redraw": { category: "View", keywords: ["refresh", "repaint"] },
  "graph.erase": { category: "Edit", keywords: ["delete", "remove"] },
  "clipboard.cut": { category: "Edit" },
  "clipboard.copy": { category: "Edit", keywords: ["duplicate"] },
  "clipboard.paste": { category: "Edit", keywords: ["insert"] },
  "clipboard.delete": { category: "Edit", keywords: ["remove", "erase"] },
  "tool.active": { category: "Tools", keywords: ["select", "add", "connect", "delete", "mode"] },
  "tool.nodeKind": { category: "Tools", keywords: ["shape"] },
  "layout.activate": { category: "Layout", keywords: ["switch layout"] }
};
function registerGraphCommands(registry, access) {
  for (const [name, command] of Object.entries(GRAPH_COMMANDS)) {
    registry.register(name, { ...GRAPH_META[name], ...command });
  }
  registerGraphEditCommands(registry, access);
}
function registerGraphEditCommands(registry, access, opts = {}) {
  const commands = editCommands(access, opts.layerId ?? "graph");
  const names = opts.only ?? Object.keys(commands);
  const offs = names.map((name) => registry.register(name, commands[name]));
  return () => {
    for (const off of offs) off();
  };
}

// src/canvas/GraphCanvas.ts
var GraphCanvas = class extends Canvas {
  offActiveLayout = null;
  /** Per graph layer id, its clipboard and bridges (see the constructor). */
  editState = /* @__PURE__ */ new Map();
  clipboardOptions;
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
  constructor(opts = {}) {
    super(opts);
    this.clipboardOptions = opts.clipboard ?? {};
    registerGraphCommands(this.commands, { clipboard: (layerId) => this.clipboard(layerId) });
    this.events.on("scene:layer:add", ({ id }) => {
      this.disposeEditState(id);
      const layer = this.layers.get(id);
      if (layer instanceof GraphLayer) this.editState.set(id, this.createEditState(layer));
    });
    this.events.on("scene:layer:remove", ({ id }) => this.disposeEditState(id));
  }
  /**
   * The `GraphClipboard` over graph layer `layerId`'s store, or `null` when
   * there is no such `GraphLayer`. The `clipboard.*` commands and canvas-react's
   * `useClipboard` use it.
   */
  clipboard(layerId = "graph") {
    return this.editState.get(layerId)?.clipboard ?? null;
  }
  /** Typed layer lookup; defaults to `GraphLayer`. */
  layer(id) {
    return this.layers.get(id);
  }
  /** Typed behaviour lookup. */
  behaviour(id) {
    return this.behaviours.get(id);
  }
  /** Typed layout lookup. */
  layout(id) {
    return this.layouts.get(id);
  }
  async init(opts) {
    await super.init(opts);
    this.wireActiveLayout();
  }
  update(patch, action) {
    super.update(patch, action);
    if (patch.activeLayout !== void 0) this.wireActiveLayout();
  }
  destroy() {
    this.offActiveLayout?.();
    this.offActiveLayout = null;
    for (const id of [...this.editState.keys()]) this.disposeEditState(id);
    super.destroy();
  }
  /** Build `layer`'s clipboard and bridge its state to bound controls. */
  createEditState(layer) {
    const invalidate = () => this.commands.invalidate();
    const clipboard = new GraphClipboard(
      layer.store,
      this.clipboardOptions.pasteOffset ? { pasteOffset: this.clipboardOptions.pasteOffset } : {}
    );
    const offs = [
      clipboard.events.on("change", invalidate),
      layer.events.on("style:changed", ({ scope }) => {
        if (scope === "edge") invalidate();
      })
    ];
    return {
      clipboard,
      dispose: () => {
        for (const off of offs) off();
      }
    };
  }
  disposeEditState(id) {
    const state = this.editState.get(id);
    if (!state) return;
    this.editState.delete(id);
    state.dispose();
  }
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
  wireActiveLayout() {
    this.offActiveLayout?.();
    this.offActiveLayout = null;
    const activeId = this.get().activeLayout;
    const layout = activeId ? this.layouts.get(activeId) : void 0;
    const targetId = layout?.targetLayerId;
    const layer = targetId ? this.layers.get(targetId) : void 0;
    if (!activeId || !layout || !layer) return;
    let lastRun = -Infinity;
    let trailing;
    const now = () => typeof performance !== "undefined" ? performance.now() : Date.now();
    const runOnData = () => {
      lastRun = now();
      void this.runLayout(activeId, layout.onData.preserveCamera ? { preserveCamera: true } : void 0);
    };
    const onDataChange = () => {
      const throttleMs = layout.onData.throttleMs ?? 0;
      if (throttleMs <= 0) return runOnData();
      if (trailing !== void 0) return;
      const wait = lastRun + throttleMs - now();
      if (wait <= 0) return runOnData();
      trailing = setTimeout(() => {
        trailing = void 0;
        runOnData();
      }, wait);
    };
    if (layer.store.nodeCount() > 0) {
      lastRun = now();
      void this.runLayout(activeId);
    }
    const off = layer.events.on("data:changed", (e) => {
      if (e.addedNodes > 0 || e.removedNodes > 0 || e.hiddenNodes > 0 || e.shownNodes > 0) onDataChange();
    });
    this.offActiveLayout = () => {
      off();
      if (trailing !== void 0) clearTimeout(trailing);
    };
  }
};
var OneShotPositionLayout = class extends Layout {
  /**
   * The live options bag. Subclasses read their own fields off this (it's the
   * merged result of the constructor opts and every {@link setOptions} patch),
   * rather than keeping a private copy — so config edits take effect.
   */
  opts;
  /** `false` | `true` (default ms) | explicit ms. See {@link OneShotLayoutOptions.transition}. */
  transition;
  /** Easing key for the transition. See {@link OneShotLayoutOptions.transitionEase}. */
  transitionEase;
  /** Monotonic run id. Each `apply()` bumps it; stale runs check against it and bail. */
  runToken = 0;
  /** True while a run (compute + transition) is in flight. */
  running = false;
  /** In-flight position transition, so `stop()` can cancel it. */
  activeTransition = null;
  /** Resolver for the `apply()` Promise blocked on the transition. */
  transitionResolve = null;
  /** Last layer `apply()` ran against — so `setOptions` can re-run live. */
  lastLayer = null;
  constructor(opts = {}) {
    super(opts);
    this.opts = { ...opts };
    this.transition = opts.transition ?? true;
    this.transitionEase = opts.transitionEase ?? "easeOutCubic";
  }
  /**
   * Live-reconfigure. Called by `Canvas.update({ layouts: { id: patch } })` (and
   * once at init with the `config.layouts[id]` slice). Merges the patch into
   * {@link opts}, re-derives the transition settings, and — if the layout has
   * already run against a layer — re-applies so the change shows immediately
   * (the one-shot analog of `D3ForceLayout` re-heating its simulation). Before
   * the first `apply()` it just records the options (no premature run).
   */
  setOptions(patch) {
    this.opts = { ...this.opts, ...patch };
    if (patch.transition !== void 0) this.transition = patch.transition;
    if (patch.transitionEase !== void 0) this.transitionEase = patch.transitionEase;
    if (this.lastLayer) void this.apply(this.lastLayer);
  }
  /**
   * Shift a run's `meta` by `(dx, dy)` — called when an anchored run translates
   * the computed positions, for subclasses whose `meta` holds **absolute**
   * coordinates that must move with them (e.g. ELK's routed edge bend points).
   * Default: returns `meta` unchanged, which is right for translation-invariant
   * payloads (pack radii, sunburst arcs).
   */
  translateMeta(meta, _dx, _dy) {
    return meta;
  }
  /**
   * Whether a node should be placed by this run. Excludes explicitly-hidden
   * nodes unless {@link OneShotLayoutOptions.includeHidden} is set. Subclasses
   * call this while snapshotting `layer.store.nodes()` so hidden nodes stay
   * frozen at their last positions. Edges incident to a skipped node should be
   * dropped from the layout graph too (both endpoints must be placeable).
   */
  shouldPlaceNode(node) {
    return this.opts.includeHidden === true || node.hidden !== true;
  }
  /**
   * Hook run once the node positions have settled (immediately when snapping,
   * or after the transition completes), before `tick` / `end`. `meta` is the
   * payload {@link computeLayout} returned for this run. Override to write
   * derived geometry that depends on final positions — e.g. ELK edge routing,
   * pack sizes, sunburst arcs. Default no-op.
   */
  onPositionsApplied(_layer, _meta) {
  }
  /**
   * Whether this run should animate (vs snap), on top of the `transition`
   * option. Defaults to `true`. Override to veto for runs whose output isn't a
   * pure position move — e.g. a mode that replaces node *geometry* (circle-pack
   * sizes, sunburst arcs) where tweening the positions would look wrong.
   */
  shouldTransition(_layer) {
    return true;
  }
  async apply(layer, run = {}) {
    this.stop();
    this.lastLayer = layer;
    this.runOptions = run;
    const token = ++this.runToken;
    this.running = true;
    this.events.emit("start", {});
    let result;
    try {
      result = await Promise.resolve(this.computeLayout(layer, run));
    } catch (err) {
      if (token === this.runToken) {
        this.running = false;
        this.events.emit("end", { reason: "completed" });
      }
      throw err;
    }
    if (token !== this.runToken) return;
    if (!result || result.ids.length === 0) {
      this.running = false;
      this.events.emit("end", { reason: "completed" });
      return;
    }
    let meta = result.meta;
    if (run.anchorNodeId !== void 0) {
      const shift = anchorShift(layer, run.anchorNodeId, result.ids, result.positions);
      if (shift) {
        translatePositions(result.positions, shift.dx, shift.dy);
        meta = this.translateMeta(meta, shift.dx, shift.dy);
      }
    }
    await this.writePositions(layer, result.ids, result.positions, meta, token);
  }
  /** Cancel an in-flight run. Positions already written stay in the store. */
  stop() {
    if (!this.running) return;
    this.running = false;
    this.runToken++;
    this.activeTransition?.cancel();
    this.activeTransition = null;
    const resolve = this.transitionResolve;
    this.transitionResolve = null;
    resolve?.();
    this.events.emit("end", { reason: "stopped" });
  }
  /** Resolve the `transition` option to a concrete duration in ms (`0` = snap). */
  transitionDurationMs() {
    if (this.transition === false) return 0;
    if (this.transition === true) return DEFAULT_POSITION_TRANSITION_MS;
    return Math.max(0, this.transition);
  }
  /** Snap or tween `target` onto the store, then run the settle hook + lifecycle. */
  async writePositions(layer, ids, target, meta, token) {
    const store = layer.store;
    const applyGeometry = () => {
      if (token === this.runToken) this.onPositionsApplied(layer, meta);
    };
    const settle = () => {
      if (token !== this.runToken) return;
      this.events.emit("tick", {});
      this.running = false;
      this.events.emit("end", { reason: "completed" });
    };
    const duration = this.shouldTransition(layer) ? this.transitionDurationMs() : 0;
    if (duration <= 0) {
      store.setPositionsBulk(ids, target);
      applyGeometry();
      settle();
      return;
    }
    const from = new Float32Array(ids.length * 2);
    let moves = false;
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      const p = store.hasPosition(id) ? store.getPosition(id) : void 0;
      const fx = p?.x ?? target[i * 2];
      const fy = p?.y ?? target[i * 2 + 1];
      from[i * 2] = fx;
      from[i * 2 + 1] = fy;
      if (!moves && (fx !== target[i * 2] || fy !== target[i * 2 + 1])) moves = true;
    }
    if (!moves) {
      store.setPositionsBulk(ids, target);
      applyGeometry();
      settle();
      return;
    }
    await new Promise((resolve) => {
      this.transitionResolve = resolve;
      this.activeTransition = animatePositions({
        from,
        to: target,
        duration,
        easing: resolveEasing(this.transitionEase),
        onFrame: (xy, progress) => {
          store.setPositionsBulk(ids, xy);
          if (token === this.runToken) this.events.emit("transition", { progress });
        },
        onComplete: () => {
          this.activeTransition = null;
          this.transitionResolve = null;
          applyGeometry();
          settle();
          resolve();
        }
      });
    });
  }
};
function anchorShift(layer, anchorId, ids, positions) {
  const i = ids.indexOf(anchorId);
  if (i < 0) return null;
  const bounds = layer.getRenderer()?.getShapeWorldBounds(anchorId);
  let cx;
  let cy;
  if (bounds) {
    cx = bounds.x + bounds.width / 2;
    cy = bounds.y + bounds.height / 2;
  } else if (layer.store.hasPosition(anchorId)) {
    const p = layer.store.getPosition(anchorId);
    cx = p.x;
    cy = p.y;
  } else {
    return null;
  }
  const dx = cx - positions[i * 2];
  const dy = cy - positions[i * 2 + 1];
  return dx === 0 && dy === 0 ? null : { dx, dy };
}
function translatePositions(positions, dx, dy) {
  for (let j = 0; j < positions.length; j += 2) {
    positions[j] = positions[j] + dx;
    positions[j + 1] = positions[j + 1] + dy;
  }
}

// src/layout/groups.ts
var FALLBACK_SIZE = { width: 40, height: 40 };
var DEFAULT_GROUP_PADDING = 16;
function isPlaceableNode(layer, node, includeHidden = false) {
  if (includeHidden) return true;
  if (node.hidden === true) return false;
  return layer.collapsedAncestor(node.id) === void 0;
}
function collectPlaceableNodes(layer, includeHidden = false) {
  const out = /* @__PURE__ */ new Set();
  for (const node of layer.store.nodes()) {
    if (isPlaceableNode(layer, node, includeHidden)) out.add(node.id);
  }
  return out;
}
function effectiveLayoutEndpoint(layer, id) {
  let current = id;
  const seen = /* @__PURE__ */ new Set([current]);
  for (; ; ) {
    const next = layer.effectiveEndpoint(current);
    if (next === current || seen.has(next)) return current;
    seen.add(next);
    current = next;
  }
}
function collectLayoutEdges(layer, placeable) {
  const out = [];
  const seen = /* @__PURE__ */ new Set();
  for (const edge of layer.store.edges()) {
    const source = effectiveLayoutEndpoint(layer, edge.source);
    const target = effectiveLayoutEndpoint(layer, edge.target);
    if (source === target) continue;
    if (!placeable.has(source) || !placeable.has(target)) continue;
    const key = `${source}\0${target}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const id = source === edge.source && target === edge.target ? edge.id : `${edge.id}\0merged`;
    out.push({ id, source, target });
  }
  return out;
}
function isMergedEdgeId(id) {
  return id.endsWith("\0merged");
}
function buildGroupForest(layer, placeable) {
  const visited = /* @__PURE__ */ new Set();
  const build = (id) => {
    if (visited.has(id)) return void 0;
    visited.add(id);
    const node = layer.store.getNode(id);
    if (!node) return void 0;
    const isGroup = layer.isGroupNode(node);
    const isCollapsed = isGroup && layer.isCollapsedGroup(node);
    const children = [];
    if (isGroup && !isCollapsed) {
      for (const childId of layer.store.childrenOf(id)) {
        if (!placeable.has(childId)) continue;
        const child = build(childId);
        if (child) children.push(child);
      }
    }
    return { id, isGroup, isCollapsed, children };
  };
  const roots = [];
  for (const node of layer.store.nodes()) {
    if (!placeable.has(node.id)) continue;
    if (visited.has(node.id)) continue;
    const parent = node.parentId ? layer.store.getNode(node.parentId) : void 0;
    if (parent && placeable.has(parent.id) && layer.isGroupNode(parent)) continue;
    const root = build(node.id);
    if (root) roots.push(root);
  }
  for (const node of layer.store.nodes()) {
    if (!placeable.has(node.id) || visited.has(node.id)) continue;
    const root = build(node.id);
    if (root) roots.push(root);
  }
  return roots;
}
function groupInsets(layer, node) {
  const group = layer.resolveNodeStyle(node).group;
  const padding = group?.padding ?? DEFAULT_GROUP_PADDING;
  const header = group?.headerHeight ?? 0;
  return { top: padding + header, right: padding, bottom: padding, left: padding };
}
function groupSizeFloor(layer, node) {
  const style = layer.resolveNodeStyle(node);
  const group = style.group;
  if (!group) return void 0;
  const shape = style.shape;
  const radius = group.radius ?? shape?.radius;
  const width = group.width ?? shape?.width;
  const height = group.height ?? shape?.height;
  const insets = groupInsets(layer, node);
  const padX = insets.left + insets.right;
  const padY = insets.top + insets.bottom;
  if (radius !== void 0) {
    return { width: radius * 2 + padX, height: radius * 2 + padY };
  }
  if (width !== void 0 && height !== void 0) {
    return { width: width + padX, height: height + padY };
  }
  return void 0;
}
function resolveNodeSize(layer, node, fallback = FALLBACK_SIZE) {
  if (node.boundingBox) {
    return { width: node.boundingBox.width, height: node.boundingBox.height };
  }
  const local = layer.boundsOfNode(node);
  if (!local) return fallback;
  return { width: local.width, height: local.height };
}

// src/layout/SubgraphPositionLayout.ts
var SubgraphPositionLayout = class extends OneShotPositionLayout {
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
  canRecurseGroups() {
    return true;
  }
  /**
   * Snapshot the layer and either run the subclass once (flat) or drive the
   * group recursion. Subclasses normally leave this alone — override only for a
   * layout that needs the layer itself, and then it probably shouldn't extend
   * this class.
   */
  async computeLayout(layer) {
    const placeable = collectPlaceableNodes(layer, this.opts.includeHidden === true);
    if (placeable.size === 0) return null;
    const edges = collectLayoutEdges(layer, placeable);
    const sizes = /* @__PURE__ */ new Map();
    const sizeOf = (id) => {
      let size = sizes.get(id);
      if (!size) {
        const node = layer.store.getNode(id);
        size = node ? resolveNodeSize(layer, node) : { width: 40, height: 40 };
        sizes.set(id, size);
      }
      return size;
    };
    const getPosition = (id) => layer.store.getPosition(id);
    const dataOf = (id) => layer.store.getNode(id)?.data;
    const isGroup = (id) => {
      const node = layer.store.getNode(id);
      return node ? layer.isGroupNode(node) : false;
    };
    const recursing = this.opts.includeGroups === true && this.canRecurseGroups();
    const forest = recursing ? buildGroupForest(layer, placeable) : null;
    const nests = forest?.some((n) => n.children.length > 0) ?? false;
    if (!forest || !nests) {
      return this.runSubgraph({
        ids: [...placeable],
        edges,
        sizeOf,
        getPosition,
        dataOf,
        isGroup
      });
    }
    return this.solveRecursively(layer, forest, edges, sizeOf, getPosition, dataOf, isGroup);
  }
  /** Run the subclass over one subgraph, normalising an empty result to `null`. */
  async runSubgraph(sub) {
    const result = await Promise.resolve(this.computeSubgraphLayout(sub));
    if (!result || result.ids.length === 0) return null;
    return result;
  }
  /**
   * The recursive group solve: post-order to size every group from its members,
   * then pre-order to translate local solutions into world coordinates.
   */
  async solveRecursively(layer, forest, edges, sizeOf, getPosition, dataOf, isGroup) {
    const forestParent = /* @__PURE__ */ new Map();
    const walkParents = (node) => {
      for (const child of node.children) {
        forestParent.set(child.id, node.id);
        walkParents(child);
      }
    };
    for (const root of forest) walkParents(root);
    const boxes = /* @__PURE__ */ new Map();
    const effectiveSize = (id) => boxes.get(id)?.size ?? sizeOf(id);
    const edgesForLevel = (levelIds) => {
      const out = [];
      const seen = /* @__PURE__ */ new Set();
      const lift = (id) => {
        let current = id;
        while (current && !levelIds.has(current)) current = forestParent.get(current);
        return current;
      };
      for (const edge of edges) {
        const source = lift(edge.source);
        const target = lift(edge.target);
        if (!source || !target || source === target) continue;
        const key = `${source} ${target}`;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({ id: `${edge.id} ${source} ${target}`, source, target });
      }
      return out;
    };
    const solveLevel = async (siblings, groupId) => {
      const ids2 = siblings.map((s) => s.id);
      const levelIds = new Set(ids2);
      const sub = {
        ids: ids2,
        edges: edgesForLevel(levelIds),
        sizeOf: effectiveSize,
        getPosition,
        dataOf,
        isGroup,
        groupId
      };
      const placed = /* @__PURE__ */ new Map();
      if (ids2.length === 1) {
        placed.set(ids2[0], { x: 0, y: 0 });
        return placed;
      }
      const result = await this.runSubgraph(sub);
      if (!result) {
        for (const id of ids2) placed.set(id, getPosition(id) ?? { x: 0, y: 0 });
        return placed;
      }
      for (let i = 0; i < result.ids.length; i++) {
        placed.set(result.ids[i], { x: result.positions[i * 2], y: result.positions[i * 2 + 1] });
      }
      for (const id of ids2) if (!placed.has(id)) placed.set(id, getPosition(id) ?? { x: 0, y: 0 });
      return placed;
    };
    const sizeGroup = async (node) => {
      for (const child of node.children) await sizeGroup(child);
      if (node.children.length === 0) return;
      const local = await solveLevel(node.children, node.id);
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      for (const child of node.children) {
        const p = local.get(child.id);
        const s = effectiveSize(child.id);
        minX = Math.min(minX, p.x - s.width / 2);
        minY = Math.min(minY, p.y - s.height / 2);
        maxX = Math.max(maxX, p.x + s.width / 2);
        maxY = Math.max(maxY, p.y + s.height / 2);
      }
      const contentSize = { width: maxX - minX, height: maxY - minY };
      const groupNode = layer.store.getNode(node.id);
      const insets = groupNode ? groupInsets(layer, groupNode) : { top: 16, right: 16, bottom: 16, left: 16 };
      const floor = groupNode ? groupSizeFloor(layer, groupNode) : void 0;
      const size = {
        width: Math.max(insets.left + contentSize.width + insets.right, floor?.width ?? 0),
        height: Math.max(insets.top + contentSize.height + insets.bottom, floor?.height ?? 0)
      };
      boxes.set(node.id, { size, local, contentMin: { x: minX, y: minY }, contentSize });
    };
    for (const root of forest) await sizeGroup(root);
    const topLevel = await solveLevel(forest, void 0);
    const ids = [];
    const xy = [];
    const place = (node, centre) => {
      ids.push(node.id);
      xy.push(centre.x, centre.y);
      const box = boxes.get(node.id);
      if (!box) return;
      const groupNode = layer.store.getNode(node.id);
      const insets = groupNode ? groupInsets(layer, groupNode) : { top: 16, right: 16, bottom: 16, left: 16 };
      const slackX = box.size.width - (insets.left + box.contentSize.width + insets.right);
      const slackY = box.size.height - (insets.top + box.contentSize.height + insets.bottom);
      const contentX = centre.x - box.size.width / 2 + insets.left + Math.max(0, slackX) / 2;
      const contentY = centre.y - box.size.height / 2 + insets.top + Math.max(0, slackY) / 2;
      for (const child of node.children) {
        const p = box.local.get(child.id);
        place(child, {
          x: contentX + (p.x - box.contentMin.x),
          y: contentY + (p.y - box.contentMin.y)
        });
      }
    };
    for (const root of forest) place(root, topLevel.get(root.id) ?? { x: 0, y: 0 });
    if (ids.length === 0) return null;
    return { ids, positions: new Float32Array(xy) };
  }
};
function resolveOptions(prev, patch) {
  const base = prev ?? {
    enable: true,
    hoverEdges: false,
    excludeNodeTypes: [],
    excludeGroups: "expanded",
    excludeEdgeTypes: [],
    state: "hovered",
    inactiveState: void 0,
    raiseActive: true,
    degree: 0,
    direction: "both",
    zoomThreshold: void 0,
    zoomedOutState: void 0,
    zoomedOutEdgeState: void 0,
    zoomedOutScale: void 0,
    onHover: void 0,
    onHoverEnd: void 0
  };
  return {
    enable: patch.enable ?? base.enable,
    hoverEdges: patch.hoverEdges ?? base.hoverEdges,
    excludeNodeTypes: patch.excludeNodeTypes ?? base.excludeNodeTypes,
    excludeGroups: patch.excludeGroups ?? base.excludeGroups,
    excludeEdgeTypes: patch.excludeEdgeTypes ?? base.excludeEdgeTypes,
    state: patch.state ?? base.state,
    inactiveState: "inactiveState" in patch ? patch.inactiveState : base.inactiveState,
    raiseActive: patch.raiseActive ?? base.raiseActive,
    degree: patch.degree ?? base.degree,
    direction: patch.direction ?? base.direction,
    zoomThreshold: "zoomThreshold" in patch ? patch.zoomThreshold : base.zoomThreshold,
    zoomedOutState: "zoomedOutState" in patch ? patch.zoomedOutState : base.zoomedOutState,
    zoomedOutEdgeState: "zoomedOutEdgeState" in patch ? patch.zoomedOutEdgeState : base.zoomedOutEdgeState,
    zoomedOutScale: "zoomedOutScale" in patch ? patch.zoomedOutScale : base.zoomedOutScale,
    onHover: "onHover" in patch ? patch.onHover : base.onHover,
    onHoverEnd: "onHoverEnd" in patch ? patch.onHoverEnd : base.onHoverEnd
  };
}
var HoverActivateBehaviour = class extends Behaviour {
  kind = "hover-activate";
  /** Bound target layer — resolved in `onRegister`. */
  layer = null;
  opts;
  /** Subscription disposers, called in `onDestroy`. */
  subs = [];
  /** Currently hovered element, or `null`. */
  current = null;
  /**
   * Kernel store — the focal hover id is mirrored into `view.interaction.hover`
   * so it's observable (`useStore`), tap-able, and syncable (Awareness) without
   * readers touching this behaviour. The behaviour keeps owning the hover
   * machinery + render visuals (`GraphStore` runtime states).
   */
  _canvasStore;
  /** Neighbour ids that received the active state (excluding `current`). */
  activeIds = /* @__PURE__ */ new Set();
  /** Element ids that received the inactive state. */
  inactiveIds = /* @__PURE__ */ new Set();
  /**
   * State name actually applied to nodes for the current hover — equals
   * `opts.state` normally, `opts.zoomedOutState` when the camera was below
   * `opts.zoomThreshold` at activation (or after a mid-hover swap). Tracked
   * so `clearHover` / `swapStates` remove whatever was actually applied,
   * not just whatever the current `opts.state` is now.
   */
  appliedNodeState = null;
  /** Sibling of {@link appliedNodeState} for edges. */
  appliedEdgeState = null;
  /**
   * Gfx-transform multiplier currently applied to the hovered node set.
   * `1` (or `null`) means no multiplier is active. Tracked so a threshold
   * cross or clear can reset only the ids we actually scaled.
   */
  appliedScale = 1;
  /** Node ids currently scaled via `renderer.scaleShape` — reset on clear. */
  scaledNodeIds = /* @__PURE__ */ new Set();
  constructor(opts) {
    super({ ...opts, shortcuts: opts.shortcuts ?? ["pointer+hover"] });
    this.opts = resolveOptions(null, opts);
  }
  // ─── Lifecycle ──────────────────────────────────────────────────────────
  onRegister(ctx) {
    const layer = ctx.layers.get(this.targetLayerId);
    if (!layer) {
      throw new Error(
        `HoverActivateBehaviour "${this.id}": layer "${this.targetLayerId}" not found. Add the GraphLayer before registering this behaviour.`
      );
    }
    this.layer = layer;
    this._canvasStore = ctx.store;
    const renderer = layer.getRenderer();
    if (!renderer) {
      throw new Error(
        `HoverActivateBehaviour "${this.id}": target layer "${this.targetLayerId}" is not mounted. Add the GraphLayer to the canvas before registering this behaviour.`
      );
    }
    const onShapeOver = (e) => this.handlePointerOver(e.id, "shape");
    const onShapeOut = (e) => this.handlePointerOut(e.id, "shape");
    const onConnOver = (e) => this.handlePointerOver(e.id, "connector");
    const onConnOut = (e) => this.handlePointerOut(e.id, "connector");
    renderer.events.on("shape:pointerover", onShapeOver);
    renderer.events.on("shape:pointerout", onShapeOut);
    renderer.events.on("connector:pointerover", onConnOver);
    renderer.events.on("connector:pointerout", onConnOut);
    this.subs.push(
      () => renderer.events.off("shape:pointerover", onShapeOver),
      () => renderer.events.off("shape:pointerout", onShapeOut),
      () => renderer.events.off("connector:pointerover", onConnOver),
      () => renderer.events.off("connector:pointerout", onConnOut),
      // A frame opening or closing changes what a hover over it should lift
      // (itself vs its contents), and the pointer doesn't have to move for that
      // to happen — a collapse toggle fires under a stationary cursor. Re-resolve.
      layer.store.events.on("node:state", ({ name }) => {
        if (name === COLLAPSED_STATE && this.opts.raiseActive && this.current) this.applyRaise();
      }),
      // Project the *shared* lift state onto the renderer: every source's ids,
      // not just this behaviour's. Reconciling the union in one call is what
      // lets hover and selection lift overlapping sets without lowering each
      // other's elements. Idempotent, so it's harmless that a sibling
      // behaviour projects the same state too — whichever is registered keeps
      // the renderer honest.
      ctx.store.view.subscribe((state, prev) => {
        if (state.interaction.raised === prev.interaction.raised) return;
        const union = /* @__PURE__ */ new Set();
        for (const ids of Object.values(state.interaction.raised)) {
          for (const id of ids) union.add(id);
        }
        layer.getRenderer()?.setRaised(union);
      })
    );
    const el = ctx.canvasElement;
    if (el) {
      const onLeave = () => {
        if (!this.current) return;
        this.opts.onHoverEnd?.(this.current);
        this.clearHover();
      };
      el.addEventListener("pointerleave", onLeave);
      this.subs.push(() => el.removeEventListener("pointerleave", onLeave));
    }
    if (this.opts.zoomThreshold !== void 0) {
      const onZoom = () => this.handleCameraZoom();
      ctx.events.on("input:camera:zoom", onZoom);
      this.subs.push(() => ctx.events.off("input:camera:zoom", onZoom));
    }
  }
  onDestroy() {
    this.clearHover();
    for (const off of this.subs) off();
    this.subs.length = 0;
    this.layer = null;
  }
  onDisable() {
    this.clearHover();
  }
  // ─── Public API ─────────────────────────────────────────────────────────
  /** The element currently driving the hover effect, or `null`. */
  get hoveredElement() {
    return this.current;
  }
  /** Read-only snapshot of resolved options. */
  get options() {
    return this.opts;
  }
  /**
   * Runtime option update. State-affecting changes clear any in-flight hover
   * so the next hover applies the new visuals cleanly.
   */
  setOptions(patch) {
    this.recordOptions(patch);
    const stateChanged = patch.state !== void 0 && patch.state !== this.opts.state || "inactiveState" in patch && patch.inactiveState !== this.opts.inactiveState || "zoomedOutState" in patch && patch.zoomedOutState !== this.opts.zoomedOutState || "zoomedOutEdgeState" in patch && patch.zoomedOutEdgeState !== this.opts.zoomedOutEdgeState;
    const raiseChanged = patch.raiseActive !== void 0 && patch.raiseActive !== this.opts.raiseActive;
    if (stateChanged) this.clearHover();
    this.opts = resolveOptions(this.opts, patch);
    if (!this.opts.hoverEdges && this.current?.type === "connector") this.clearHover();
    if (this.current && this.isExcluded(this.current.id, this.current.type)) this.clearHover();
    if (this.current) this.handleCameraZoom();
    if (this.current && raiseChanged) {
      if (this.opts.raiseActive) this.applyRaise();
      else this.resetRaise();
    }
  }
  /** Mirror the focal hover id into `view.interaction.hover` (D11). */
  mirrorHover(id) {
    if (id === null) this._canvasStore?.actions.hover.clear();
    else this._canvasStore?.actions.hover.set(id);
  }
  /** Clear all states applied by the current hover. */
  clearHover() {
    if (!this.layer) {
      this.current = null;
      this.mirrorHover(null);
      this.activeIds.clear();
      this.inactiveIds.clear();
      this.scaledNodeIds.clear();
      this.resetRaise();
      this.appliedNodeState = null;
      this.appliedEdgeState = null;
      this.appliedScale = 1;
      return;
    }
    const nodeState = this.appliedNodeState ?? this.opts.state;
    const edgeState = this.appliedEdgeState ?? this.opts.state;
    if (this.current) {
      if (this.current.type === "shape") {
        this.layer.store.setNodeState(this.current.id, nodeState, false);
      } else {
        this.layer.store.setEdgeState(this.current.id, edgeState, false);
      }
    }
    for (const id of this.activeIds) {
      this.layer.store.setNodeState(id, nodeState, false);
      this.layer.store.setEdgeState(id, edgeState, false);
    }
    this.activeIds.clear();
    const inactive = this.opts.inactiveState;
    if (inactive) {
      for (const id of this.inactiveIds) {
        this.layer.store.setNodeState(id, inactive, false);
        this.layer.store.setEdgeState(id, inactive, false);
      }
    }
    this.inactiveIds.clear();
    if (this.scaledNodeIds.size > 0) {
      const renderer = this.layer.getRenderer();
      if (renderer) {
        for (const id of this.scaledNodeIds) renderer.scaleShape(id, 1);
      }
      this.scaledNodeIds.clear();
    }
    this.appliedScale = 1;
    this.resetRaise();
    this.current = null;
    this.mirrorHover(null);
    this.appliedNodeState = null;
    this.appliedEdgeState = null;
  }
  // ─── Pointer handlers ───────────────────────────────────────────────────
  handlePointerOver(id, type) {
    if (!this._enabled) return;
    if (type === "connector" && !this.opts.hoverEdges) return;
    if (this.isExcluded(id, type)) return;
    const target = this.resolveElement(id, type);
    if (!target) return;
    const { enable } = this.opts;
    if (enable === false) return;
    if (typeof enable === "function" && !enable(target)) return;
    if (this.current && this.current.id !== id) {
      this.clearHover();
    } else if (this.current && this.current.id === id) {
      return;
    }
    this.activate(target);
  }
  handlePointerOut(id, _type) {
    if (!this.current || this.current.id !== id) return;
    const ending = this.current;
    this.opts.onHoverEnd?.(ending);
    this.clearHover();
  }
  activate(target) {
    const layer = this.layer;
    if (!layer) return;
    this.current = target;
    this.mirrorHover(target.id);
    const picked = this.pickTier();
    this.appliedNodeState = picked.node;
    this.appliedEdgeState = picked.edge;
    if (target.type === "shape") layer.store.setNodeState(target.id, picked.node, true);
    else layer.store.setEdgeState(target.id, picked.edge, true);
    if (this.opts.degree > 0 && target.type === "shape") {
      const { nodeIds, edgeIds } = this.collectNeighbours(target.id, this.opts.degree);
      for (const nid of nodeIds) {
        layer.store.setNodeState(nid, picked.node, true);
        this.activeIds.add(nid);
      }
      for (const eid of edgeIds) {
        layer.store.setEdgeState(eid, picked.edge, true);
        this.activeIds.add(eid);
      }
    }
    if (this.opts.inactiveState) this.applyInactive(target.id);
    if (picked.scale !== 1) this.applyScale(picked.scale);
    if (this.opts.raiseActive) this.applyRaise();
    this.opts.onHover?.(target);
  }
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
  pickTier() {
    const o = this.opts;
    const scale = this.ctx?.camera.scale ?? Infinity;
    const usingZoomed = o.zoomThreshold !== void 0 && scale <= o.zoomThreshold;
    return {
      node: usingZoomed && o.zoomedOutState ? o.zoomedOutState : o.state,
      edge: usingZoomed && o.zoomedOutEdgeState ? o.zoomedOutEdgeState : o.state,
      scale: usingZoomed && o.zoomedOutScale !== void 0 && o.zoomedOutScale > 0 ? o.zoomedOutScale : 1
    };
  }
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
  handleCameraZoom() {
    if (!this.current || !this.layer) return;
    const picked = this.pickTier();
    const statesChanged = picked.node !== this.appliedNodeState || picked.edge !== this.appliedEdgeState;
    const scaleChanged = picked.scale !== this.appliedScale;
    if (!statesChanged && !scaleChanged) return;
    if (statesChanged) {
      this.swapStates({ node: picked.node, edge: picked.edge });
    }
    if (scaleChanged) {
      this.applyScale(picked.scale);
    }
  }
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
  applyScale(scale) {
    const renderer = this.layer?.getRenderer();
    if (!renderer) {
      this.scaledNodeIds.clear();
      this.appliedScale = 1;
      return;
    }
    for (const id of this.scaledNodeIds) renderer.scaleShape(id, 1);
    this.scaledNodeIds.clear();
    this.appliedScale = 1;
    if (scale === 1) return;
    if (this.current?.type === "shape") {
      renderer.scaleShape(this.current.id, scale);
      this.scaledNodeIds.add(this.current.id);
    }
    for (const id of this.activeIds) {
      if (!renderer.hasShape(id)) continue;
      renderer.scaleShape(id, scale);
      this.scaledNodeIds.add(id);
    }
    this.appliedScale = scale;
  }
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
  applyRaise() {
    const store = this._canvasStore;
    if (!store) return;
    const ids = /* @__PURE__ */ new Set();
    if (this.current) this.collectRaiseTargets(this.current.id, ids);
    for (const id of this.activeIds) this.collectRaiseTargets(id, ids);
    store.actions.raise.set(this.id, ids);
  }
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
  collectRaiseTargets(id, out) {
    const layer = this.layer;
    if (!layer) return;
    const node = layer.store.getNode(id);
    if (!node || !layer.isGroupNode(node) || layer.isCollapsedGroup(node)) {
      out.add(id);
      return;
    }
    const memberIds = /* @__PURE__ */ new Set([id, ...layer.store.descendantsOf(id)]);
    for (const memberId of memberIds) {
      if (memberId === id) continue;
      out.add(memberId);
      for (const edge of layer.store.edgesOf(memberId, "both")) {
        if (memberIds.has(edge.source) && memberIds.has(edge.target)) out.add(edge.id);
      }
    }
  }
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
  resetRaise() {
    this._canvasStore?.actions.raise.clear(this.id);
  }
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
  swapStates(picked) {
    const layer = this.layer;
    if (!layer) return;
    const prevNode = this.appliedNodeState ?? this.opts.state;
    const prevEdge = this.appliedEdgeState ?? this.opts.state;
    const nodeChanged = prevNode !== picked.node;
    const edgeChanged = prevEdge !== picked.edge;
    if (!nodeChanged && !edgeChanged) return;
    if (this.current) {
      if (this.current.type === "shape" && nodeChanged) {
        layer.store.setNodeState(this.current.id, prevNode, false);
        layer.store.setNodeState(this.current.id, picked.node, true);
      } else if (this.current.type === "connector" && edgeChanged) {
        layer.store.setEdgeState(this.current.id, prevEdge, false);
        layer.store.setEdgeState(this.current.id, picked.edge, true);
      }
    }
    for (const id of this.activeIds) {
      if (nodeChanged) {
        layer.store.setNodeState(id, prevNode, false);
        layer.store.setNodeState(id, picked.node, true);
      }
      if (edgeChanged) {
        layer.store.setEdgeState(id, prevEdge, false);
        layer.store.setEdgeState(id, picked.edge, true);
      }
    }
    this.appliedNodeState = picked.node;
    this.appliedEdgeState = picked.edge;
  }
  /** BFS neighbourhood expansion using the store's adjacency index. */
  collectNeighbours(rootId, degree) {
    const nodeIds = /* @__PURE__ */ new Set();
    const edgeIds = /* @__PURE__ */ new Set();
    const layer = this.layer;
    if (!layer) return { nodeIds, edgeIds };
    const store = layer.store;
    let frontier = [rootId];
    const visited = /* @__PURE__ */ new Set([rootId]);
    for (let hop = 0; hop < degree; hop++) {
      const next = [];
      for (const u of frontier) {
        for (const e of store.edgesOf(u, this.opts.direction)) {
          edgeIds.add(e.id);
          const otherId = e.source === u ? e.target : e.source;
          if (!visited.has(otherId)) {
            visited.add(otherId);
            nodeIds.add(otherId);
            next.push(otherId);
          }
        }
      }
      frontier = next;
      if (frontier.length === 0) break;
    }
    return { nodeIds, edgeIds };
  }
  applyInactive(hoveredId) {
    const inactive = this.opts.inactiveState;
    if (!inactive) return;
    const layer = this.layer;
    if (!layer) return;
    const activeIds = /* @__PURE__ */ new Set([hoveredId, ...this.activeIds]);
    for (const node of layer.store.nodes()) {
      if (activeIds.has(node.id)) continue;
      layer.store.setNodeState(node.id, inactive, true);
      this.inactiveIds.add(node.id);
    }
    for (const edge of layer.store.edges()) {
      if (activeIds.has(edge.id)) continue;
      layer.store.setEdgeState(edge.id, inactive, true);
      this.inactiveIds.add(edge.id);
    }
  }
  /**
   * Is this element's `type` on the matching exclusion list?
   *
   * Reads `GraphNode.type` / `GraphEdge.type` off the store rather than the
   * {@link HoverableElement} payload, because that struct carries the *render*
   * kind (`'shape'` / `'connector'`), not the record's domain type. An id the
   * store no longer knows is not excluded — the `resolveElement` call that
   * follows will drop it anyway.
   */
  isExcluded(id, type) {
    const layer = this.layer;
    if (!layer) return false;
    if (type === "shape") {
      if (this.opts.excludeGroups !== "never") {
        const role = layer.getGroupRole(id);
        if (role === "expanded") return true;
        if (role === "collapsed" && this.opts.excludeGroups === "always") return true;
      }
      if (this.opts.excludeNodeTypes.length === 0) return false;
      const node = layer.store.getNode(id);
      return node ? this.opts.excludeNodeTypes.includes(node.type) : false;
    }
    if (this.opts.excludeEdgeTypes.length === 0) return false;
    const edge = layer.store.getEdge(id);
    return edge ? this.opts.excludeEdgeTypes.includes(edge.type) : false;
  }
  resolveElement(id, type) {
    const layer = this.layer;
    if (!layer) return null;
    if (type === "shape") {
      const node = layer.store.getNode(id);
      return node ? { id, type, data: node.data } : null;
    }
    const edge = layer.store.getEdge(id);
    return edge ? { id, type, data: edge.data } : null;
  }
};

// src/behaviours/ModifierTracker.ts
var held = /* @__PURE__ */ new Set();
var refCount = 0;
function onKeyDown(e) {
  if (e.shiftKey) held.add("shift");
  if (e.ctrlKey) held.add("control");
  if (e.altKey) held.add("alt");
  if (e.metaKey) held.add("meta");
}
function onKeyUp(e) {
  if (!e.shiftKey) held.delete("shift");
  if (!e.ctrlKey) held.delete("control");
  if (!e.altKey) held.delete("alt");
  if (!e.metaKey) held.delete("meta");
}
function onBlur() {
  held.clear();
}
var ModifierTracker = {
  /** Install window listeners (refcounted). Safe to call repeatedly. */
  attach() {
    if (refCount === 0 && typeof window !== "undefined") {
      window.addEventListener("keydown", onKeyDown);
      window.addEventListener("keyup", onKeyUp);
      window.addEventListener("blur", onBlur);
    }
    refCount++;
  },
  /** Remove window listeners when the last user detaches. */
  detach() {
    if (refCount === 0) return;
    refCount--;
    if (refCount === 0 && typeof window !== "undefined") {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
      held.clear();
    }
  },
  /** True iff *any* of the given modifier keys is currently held. */
  anyHeld(keys) {
    for (const k of keys) if (held.has(k)) return true;
    return false;
  },
  /** Snapshot of currently held modifiers. */
  snapshot() {
    return new Set(held);
  }
};

// src/behaviours/ClickSelectBehaviour.ts
function resolveOptions2(prev, patch) {
  const base = prev ?? {
    enable: true,
    excludeNodeTypes: [],
    excludeGroups: "expanded",
    excludeEdgeTypes: [],
    multiple: false,
    trigger: [],
    degree: 0,
    direction: "both",
    state: "selected",
    unselectedState: void 0,
    raiseActive: true,
    clearOnBackground: true,
    onSelect: void 0,
    onDeselect: void 0,
    onSelectionChange: void 0
  };
  return {
    enable: patch.enable ?? base.enable,
    excludeNodeTypes: patch.excludeNodeTypes ?? base.excludeNodeTypes,
    excludeGroups: patch.excludeGroups ?? base.excludeGroups,
    excludeEdgeTypes: patch.excludeEdgeTypes ?? base.excludeEdgeTypes,
    multiple: patch.multiple ?? base.multiple,
    trigger: patch.trigger ?? base.trigger,
    degree: patch.degree ?? base.degree,
    direction: patch.direction ?? base.direction,
    state: patch.state ?? base.state,
    unselectedState: "unselectedState" in patch ? patch.unselectedState === "" ? void 0 : patch.unselectedState : base.unselectedState,
    raiseActive: patch.raiseActive ?? base.raiseActive,
    clearOnBackground: patch.clearOnBackground ?? base.clearOnBackground,
    onSelect: "onSelect" in patch ? patch.onSelect : base.onSelect,
    onDeselect: "onDeselect" in patch ? patch.onDeselect : base.onDeselect,
    onSelectionChange: "onSelectionChange" in patch ? patch.onSelectionChange : base.onSelectionChange
  };
}
var ClickSelectBehaviour = class extends Behaviour {
  kind = "click-select";
  /**
   * Selection event bus. Subscribe to `'selection:change'` for a reactive
   * snapshot every time the selection set is replaced. Independent of (and
   * additive to) the `onSelectionChange` option.
   */
  events = new EventEmitter();
  layer = null;
  opts;
  /** Subscription disposers. */
  subs = [];
  /**
   * Kernel store — the semantic selection set is mirrored into
   * `view.interaction.selection` (D11) so it's observable (`useStore`), tap-able
   * (telemetry), and syncable (Awareness) without readers touching this behaviour.
   * The behaviour keeps owning the interaction *machinery* (expansion / dimming /
   * z-raise) and the render visuals (`GraphStore` runtime states).
   */
  _canvasStore;
  /** Seed set — ids the user *directly* clicked / passed to `select*`. */
  seeds = /* @__PURE__ */ new Map();
  /** Expanded set — seeds + degree-expanded neighbours. */
  selected = /* @__PURE__ */ new Map();
  /**
   * The ids this behaviour last wrote into the store's canvas-wide selection —
   * its share, replaced as a whole on the next change even when some of those
   * elements have since been removed from the layer.
   */
  mirrored = /* @__PURE__ */ new Set();
  /** Ids currently rendered with the `unselectedState`. */
  unselectedIds = /* @__PURE__ */ new Set();
  /** True when the most recent click already consumed an element. */
  clickConsumedByElement = false;
  /** Pointerdown screen-position — used to distinguish a click from a drag. */
  pointerDownScreen = null;
  /**
   * Set once the pointer travels past the click/drag threshold while a button
   * is held. Used to suppress the synthetic element `click` that fires at the
   * end of a node drag — without it, dragging a selected node would collapse
   * the whole selection down to that one node on release.
   */
  pressMoved = false;
  constructor(opts) {
    super({ ...opts, shortcuts: opts.shortcuts ?? ["pointer+click"] });
    this.opts = resolveOptions2(null, opts);
  }
  // ─── Lifecycle ──────────────────────────────────────────────────────────
  onRegister(ctx) {
    const layer = ctx.layers.get(this.targetLayerId);
    if (!layer) {
      throw new Error(
        `ClickSelectBehaviour "${this.id}": layer "${this.targetLayerId}" not found. Add the GraphLayer before registering this behaviour.`
      );
    }
    this.layer = layer;
    this._canvasStore = ctx.store;
    this.subs.push(
      ctx.store.view.subscribe((state, prev) => {
        const next = state.interaction.selection;
        if (next === prev.interaction.selection || !this._enabled) return;
        this.followStoreSelection(next);
      })
    );
    const renderer = layer.getRenderer();
    if (!renderer) {
      throw new Error(
        `ClickSelectBehaviour "${this.id}": target layer is not mounted. Add the GraphLayer to the canvas before registering this behaviour.`
      );
    }
    ModifierTracker.attach();
    this.subs.push(
      ctx.store.view.subscribe((state, prev) => {
        if (state.interaction.raised === prev.interaction.raised) return;
        const union = /* @__PURE__ */ new Set();
        for (const ids of Object.values(state.interaction.raised)) {
          for (const id of ids) union.add(id);
        }
        layer.getRenderer()?.setRaised(union);
      })
    );
    const onShapeClick = (e) => {
      this.clickConsumedByElement = true;
      if (this.pressMoved) return;
      this.handleElementClick(e.id, "shape");
    };
    const onConnClick = (e) => {
      this.clickConsumedByElement = true;
      if (this.pressMoved) return;
      this.handleElementClick(e.id, "connector");
    };
    const DRAG_VS_CLICK_THRESHOLD_PX = 4;
    const onPointerDown = (e) => {
      this.pressMoved = false;
      if (e.button !== 0) {
        this.pointerDownScreen = null;
        return;
      }
      this.pointerDownScreen = { x: e.clientX, y: e.clientY };
    };
    const onPointerMove = (e) => {
      const down = this.pointerDownScreen;
      if (!down || this.pressMoved) return;
      if (Math.hypot(e.clientX - down.x, e.clientY - down.y) > DRAG_VS_CLICK_THRESHOLD_PX) {
        this.pressMoved = true;
      }
    };
    const onCanvasClick = (e) => {
      const down = this.pointerDownScreen;
      this.pointerDownScreen = null;
      if (this.clickConsumedByElement) {
        this.clickConsumedByElement = false;
        return;
      }
      if (e.button !== 0) return;
      if (down) {
        const dx = e.clientX - down.x;
        const dy = e.clientY - down.y;
        if (Math.hypot(dx, dy) > DRAG_VS_CLICK_THRESHOLD_PX) return;
      }
      if (this.opts.clearOnBackground) this.clearSelection();
    };
    renderer.events.on("shape:click", onShapeClick);
    renderer.events.on("connector:click", onConnClick);
    const el = ctx.canvasElement;
    if (el) {
      el.addEventListener("pointerdown", onPointerDown);
      el.addEventListener("pointermove", onPointerMove);
      el.addEventListener("click", onCanvasClick);
    }
    this.subs.push(
      () => renderer.events.off("shape:click", onShapeClick),
      () => renderer.events.off("connector:click", onConnClick),
      () => {
        if (el) {
          el.removeEventListener("pointerdown", onPointerDown);
          el.removeEventListener("pointermove", onPointerMove);
          el.removeEventListener("click", onCanvasClick);
        }
      }
    );
  }
  onDestroy() {
    this.clearSelection();
    for (const off of this.subs) off();
    this.subs.length = 0;
    ModifierTracker.detach();
    this.layer = null;
  }
  onDisable() {
    this.clearSelection();
  }
  /**
   * Pick up a selection written while this behaviour was off (a playbook step,
   * a panel) — the store subscription ignores writes while disabled.
   */
  onEnable() {
    const store = this._canvasStore;
    if (store) this.followStoreSelection(store.view.getState().interaction.selection);
  }
  // ─── Public API ─────────────────────────────────────────────────────────
  /** Resolved current options (read-only snapshot). */
  get options() {
    return this.opts;
  }
  /**
   * Runtime option update. State-affecting changes clear the current
   * visual selection and re-apply with the new options.
   */
  setOptions(patch) {
    this.recordOptions(patch);
    const prev = this.opts;
    const stateChanged = patch.state !== void 0 && patch.state !== prev.state;
    const unselChanged = "unselectedState" in patch && (patch.unselectedState === "" ? void 0 : patch.unselectedState) !== prev.unselectedState;
    const expansionChanged = patch.degree !== void 0 && patch.degree !== prev.degree || patch.direction !== void 0 && patch.direction !== prev.direction;
    const raiseChanged = patch.raiseActive !== void 0 && patch.raiseActive !== prev.raiseActive;
    const seedsSnapshot = new Map(this.seeds);
    const hadSelection = this.selected.size > 0;
    const reapply = hadSelection && (stateChanged || unselChanged || expansionChanged);
    if (reapply) this.clearVisualsOnly();
    this.opts = resolveOptions2(this.opts, patch);
    if (reapply) {
      this.applySelection(seedsSnapshot, false);
    } else if (hadSelection && raiseChanged) {
      if (this.opts.raiseActive) this.applyRaise();
      else this.resetRaise();
    }
  }
  /** Replace the selection with a single element. */
  select(id, type = "shape") {
    this.applySelection(/* @__PURE__ */ new Map([[id, type]]), true);
  }
  /** Replace the selection with the given (id, type) pairs. */
  selectMultiple(elements) {
    const next = /* @__PURE__ */ new Map();
    for (const el of elements) next.set(el.id, el.type ?? "shape");
    this.applySelection(next, true);
  }
  /** Add a single element to the current selection. */
  addToSelection(id, type = "shape") {
    if (this.seeds.has(id)) return;
    const next = new Map(this.seeds);
    next.set(id, type);
    this.applySelection(next, true);
  }
  /** Remove a single element from the current selection. */
  deselect(id) {
    if (!this.seeds.has(id)) return;
    const next = new Map(this.seeds);
    next.delete(id);
    this.applySelection(next, true);
  }
  /** Toggle the membership of `id` in the selection. */
  toggle(id, type = "shape") {
    if (this.seeds.has(id)) this.deselect(id);
    else this.addToSelection(id, type);
  }
  /** True iff `id` is part of the rendered selection (seed or expanded). */
  isSelected(id) {
    return this.selected.has(id);
  }
  /** All currently selected ids (seeds + expanded). */
  getSelectedIds() {
    return [...this.selected.keys()];
  }
  /** Currently selected shape (node) ids. */
  getSelectedShapeIds() {
    const out = [];
    for (const [id, type] of this.selected) if (type === "shape") out.push(id);
    return out;
  }
  /** Currently selected connector (edge) ids. */
  getSelectedConnectorIds() {
    const out = [];
    for (const [id, type] of this.selected) if (type === "connector") out.push(id);
    return out;
  }
  /** Clear the entire selection and any dimming. */
  clearSelection() {
    if (this.selected.size === 0 && this.unselectedIds.size === 0 && this.seeds.size === 0)
      return;
    this.applySelection(/* @__PURE__ */ new Map(), true);
  }
  /**
   * Select every node and edge on the target layer. Replaces the current
   * selection. No-op if the layer isn't mounted.
   */
  selectAll() {
    if (!this.layer) return;
    const store = this.layer.store;
    const next = [];
    for (const node of store.nodes()) {
      if (!store.isNodeVisible(node.id)) continue;
      next.push({ id: node.id, type: "shape" });
    }
    for (const edge of store.edges()) {
      if (!store.isEdgeVisible(edge.id)) continue;
      next.push({ id: edge.id, type: "connector" });
    }
    this.selectMultiple(next);
  }
  /**
   * Select a node together with its neighbours (in the given direction) and the
   * edges incident to it. Replaces the current selection. No-op if the layer
   * isn't mounted.
   *
   * @param id  Seed node id.
   * @param dir Adjacency direction for neighbours + incident edges. Default `'both'`.
   */
  selectNeighbourhood(id, dir = "both") {
    if (!this.layer) return;
    const store = this.layer.store;
    const next = [{ id, type: "shape" }];
    for (const nb of store.neighborsOf(id, dir)) {
      if (store.isNodeHidden(nb)) continue;
      next.push({ id: nb, type: "shape" });
    }
    for (const e of store.edgesOf(id, dir)) {
      if (!store.isEdgeVisible(e.id)) continue;
      next.push({ id: e.id, type: "connector" });
    }
    this.selectMultiple(next);
  }
  // ─── Internals ──────────────────────────────────────────────────────────
  handleElementClick(id, type) {
    if (!this._enabled) return;
    if (this.isExcluded(id, type)) return;
    const target = this.resolveElement(id, type);
    if (!target) return;
    const { enable } = this.opts;
    if (enable === false) return;
    if (typeof enable === "function" && !enable(target)) return;
    const { multiple, trigger } = this.opts;
    if (trigger.length > 0 && !ModifierTracker.anyHeld(trigger)) return;
    if (multiple) {
      const next = new Map(this.seeds);
      if (next.has(id)) next.delete(id);
      else next.set(id, type);
      this.applySelection(next, true);
    } else {
      this.applySelection(/* @__PURE__ */ new Map([[id, type]]), true);
    }
  }
  /**
   * Apply the store's canvas-wide selection as this layer's share (RFC F8):
   * the ids this layer holds, as-is — the store holds the *resolved* selection,
   * so it isn't re-expanded by `degree`. Our own mirror arrives here as a set
   * equal to `selected`, which is the echo guard.
   */
  followStoreSelection(ids) {
    const layer = this.layer;
    if (!layer) return;
    const incoming = /* @__PURE__ */ new Map();
    for (const id of ids) {
      if (layer.store.hasNode(id)) incoming.set(id, "shape");
      else if (layer.store.hasEdge(id)) incoming.set(id, "connector");
    }
    if (sameKeys(incoming, this.selected)) return;
    this.applySelection(incoming, true, false);
  }
  /**
   * Core selection engine: replace seeds, recompute expansion, swap visuals,
   * diff-emit callbacks.
   */
  applySelection(seeds, emitEvents, expand = true) {
    if (!this.layer) return;
    const expanded = expand ? this.expandSeeds(seeds) : new Map(seeds);
    const prevSelected = new Map(this.selected);
    this.clearVisualsOnly();
    this.seeds = new Map(seeds);
    this.selected = new Map(expanded);
    for (const [id, type] of this.selected) {
      if (type === "shape") this.layer.store.setNodeState(id, this.opts.state, true);
      else this.layer.store.setEdgeState(id, this.opts.state, true);
    }
    if (this.opts.unselectedState && this.selected.size > 0) {
      this.applyUnselected(this.selected);
    }
    if (this.opts.raiseActive) this.applyRaise();
    if (!emitEvents) return;
    for (const [id, type] of prevSelected) {
      if (this.selected.has(id)) continue;
      const target = this.resolveElement(id, type);
      if (target) this.opts.onDeselect?.(target);
    }
    for (const [id, type] of this.selected) {
      if (prevSelected.has(id)) continue;
      const target = this.resolveElement(id, type);
      if (target) this.opts.onSelect?.(target);
    }
    const snapshot = this.buildSnapshot();
    if (this.opts.onSelectionChange) this.opts.onSelectionChange(snapshot);
    this.events.emit("selection:change", snapshot);
    const store = this._canvasStore;
    const layerStore = this.layer?.store;
    if (store && layerStore) {
      const current = store.view.getState().interaction.selection;
      const mirrored = this.mirrored;
      const next = [];
      for (const id of current) {
        if (!mirrored.has(id) && !layerStore.hasNode(id) && !layerStore.hasEdge(id)) next.push(id);
      }
      const ours = [...snapshot.shapeIds, ...snapshot.connectorIds];
      next.push(...ours);
      this.mirrored = new Set(ours);
      if (!sameSet(current, next)) store.actions.selection.set(next);
    }
  }
  /** Expand seeds by `degree` hops (BFS) — same shape as HoverActivate. */
  expandSeeds(seeds) {
    const expanded = new Map(seeds);
    const { degree, direction } = this.opts;
    if (!this.layer || degree <= 0 || seeds.size === 0) return expanded;
    const store = this.layer.store;
    let frontier = [];
    for (const [id, type] of seeds) if (type === "shape") frontier.push(id);
    for (let hop = 0; hop < degree && frontier.length > 0; hop++) {
      const next = [];
      for (const u of frontier) {
        for (const e of store.edgesOf(u, direction)) {
          if (!store.isEdgeVisible(e.id)) continue;
          if (!expanded.has(e.id)) expanded.set(e.id, "connector");
          const otherId = e.source === u ? e.target : e.source;
          if (store.isNodeHidden(otherId)) continue;
          if (!expanded.has(otherId)) {
            expanded.set(otherId, "shape");
            next.push(otherId);
          }
        }
      }
      frontier = next;
    }
    return expanded;
  }
  clearVisualsOnly() {
    if (!this.layer) {
      this.seeds.clear();
      this.selected.clear();
      this.unselectedIds.clear();
      this.resetRaise();
      return;
    }
    for (const [id, type] of this.selected) {
      if (type === "shape") this.layer.store.setNodeState(id, this.opts.state, false);
      else this.layer.store.setEdgeState(id, this.opts.state, false);
    }
    const unsel = this.opts.unselectedState;
    if (unsel) {
      for (const id of this.unselectedIds) {
        this.layer.store.setNodeState(id, unsel, false);
        this.layer.store.setEdgeState(id, unsel, false);
      }
    }
    this.resetRaise();
    this.seeds.clear();
    this.selected.clear();
    this.unselectedIds.clear();
  }
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
  applyRaise() {
    this._canvasStore?.actions.raise.set(this.id, this.selected.keys());
  }
  /** Drop this behaviour's paint-order lift; other sources keep theirs. */
  resetRaise() {
    this._canvasStore?.actions.raise.clear(this.id);
  }
  applyUnselected(selected) {
    const unsel = this.opts.unselectedState;
    if (!unsel || !this.layer) return;
    for (const node of this.layer.store.nodes()) {
      if (selected.has(node.id)) continue;
      this.layer.store.setNodeState(node.id, unsel, true);
      this.unselectedIds.add(node.id);
    }
    for (const edge of this.layer.store.edges()) {
      if (selected.has(edge.id)) continue;
      this.layer.store.setEdgeState(edge.id, unsel, true);
      this.unselectedIds.add(edge.id);
    }
  }
  /**
   * Is this element's `type` on the matching exclusion list?
   *
   * Reads `GraphNode.type` / `GraphEdge.type` off the store rather than the
   * {@link SelectableElement} payload, because that struct carries the
   * *render* kind (`'shape'` / `'connector'`), not the record's domain type.
   * An id the store no longer knows is not excluded — the `resolveElement`
   * call that follows will drop it anyway.
   */
  isExcluded(id, type) {
    if (!this.layer) return false;
    if (type === "shape") {
      if (this.opts.excludeGroups !== "never") {
        const role = this.layer.getGroupRole(id);
        if (role === "expanded") return true;
        if (role === "collapsed" && this.opts.excludeGroups === "always") return true;
      }
      if (this.opts.excludeNodeTypes.length === 0) return false;
      const node = this.layer.store.getNode(id);
      return node ? this.opts.excludeNodeTypes.includes(node.type) : false;
    }
    if (this.opts.excludeEdgeTypes.length === 0) return false;
    const edge = this.layer.store.getEdge(id);
    return edge ? this.opts.excludeEdgeTypes.includes(edge.type) : false;
  }
  resolveElement(id, type) {
    if (!this.layer) return null;
    if (type === "shape") {
      const node = this.layer.store.getNode(id);
      return node ? { id, type, data: node.data } : null;
    }
    const edge = this.layer.store.getEdge(id);
    return edge ? { id, type, data: edge.data } : null;
  }
  buildSnapshot() {
    const shapeIds = [];
    const connectorIds = [];
    for (const [id, type] of this.selected) {
      if (type === "shape") shapeIds.push(id);
      else connectorIds.push(id);
    }
    return { shapeIds, connectorIds };
  }
};
function sameKeys(a, b) {
  if (a.size !== b.size) return false;
  for (const id of a.keys()) if (!b.has(id)) return false;
  return true;
}
function sameSet(set, ids) {
  if (set.size !== ids.length) return false;
  for (const id of ids) if (!set.has(id)) return false;
  return true;
}
var ClickInspectBehaviour = class extends Behaviour {
  kind = "click-inspect";
  /**
   * Inspection event bus. Subscribe to `'inspect:change'` for the current
   * single target (or `null`) every time it changes.
   */
  events = new EventEmitter();
  layer = null;
  /** Live-read from `_options` (consulted at click-time) so `setOptions` applies. */
  get clearOnBackground() {
    return this._options.clearOnBackground ?? true;
  }
  /** Subscription disposers. */
  subs = [];
  /** Current inspected element, or `null`. */
  target = null;
  /** True when the most recent click already consumed an element. */
  clickConsumedByElement = false;
  /** Pointerdown screen-position — used to distinguish a click from a drag. */
  pointerDownScreen = null;
  /**
   * Set once the pointer travels past the click/drag threshold while a button
   * is held — suppresses the synthetic element `click` fired at the end of a
   * node drag so a drag doesn't open the inspector.
   */
  pressMoved = false;
  constructor(opts) {
    super({ ...opts, shortcuts: opts.shortcuts ?? ["pointer+click"] });
  }
  // ─── Lifecycle ──────────────────────────────────────────────────────────
  onRegister(ctx) {
    const layer = ctx.layers.get(this.targetLayerId);
    if (!layer) {
      throw new Error(
        `ClickInspectBehaviour "${this.id}": layer "${this.targetLayerId}" not found. Add the GraphLayer before registering this behaviour.`
      );
    }
    this.layer = layer;
    const renderer = layer.getRenderer();
    if (!renderer) {
      throw new Error(
        `ClickInspectBehaviour "${this.id}": target layer is not mounted. Add the GraphLayer to the canvas before registering this behaviour.`
      );
    }
    const onShapeClick = (e) => {
      this.clickConsumedByElement = true;
      if (this.pressMoved) return;
      this.handleElementClick(e.id, "node");
    };
    const onConnClick = (e) => {
      this.clickConsumedByElement = true;
      if (this.pressMoved) return;
      this.handleElementClick(e.id, "edge");
    };
    const DRAG_VS_CLICK_THRESHOLD_PX = 4;
    const onPointerDown = (e) => {
      this.pressMoved = false;
      if (e.button !== 0) {
        this.pointerDownScreen = null;
        return;
      }
      this.pointerDownScreen = { x: e.clientX, y: e.clientY };
    };
    const onPointerMove = (e) => {
      const down = this.pointerDownScreen;
      if (!down || this.pressMoved) return;
      if (Math.hypot(e.clientX - down.x, e.clientY - down.y) > DRAG_VS_CLICK_THRESHOLD_PX) {
        this.pressMoved = true;
      }
    };
    const onCanvasClick = (e) => {
      const down = this.pointerDownScreen;
      this.pointerDownScreen = null;
      if (this.clickConsumedByElement) {
        this.clickConsumedByElement = false;
        return;
      }
      if (e.button !== 0) return;
      if (down) {
        if (Math.hypot(e.clientX - down.x, e.clientY - down.y) > DRAG_VS_CLICK_THRESHOLD_PX) return;
      }
      if (this.clearOnBackground) this.clear();
    };
    renderer.events.on("shape:click", onShapeClick);
    renderer.events.on("connector:click", onConnClick);
    const el = ctx.canvasElement;
    if (el) {
      el.addEventListener("pointerdown", onPointerDown);
      el.addEventListener("pointermove", onPointerMove);
      el.addEventListener("click", onCanvasClick);
    }
    this.subs.push(
      () => renderer.events.off("shape:click", onShapeClick),
      () => renderer.events.off("connector:click", onConnClick),
      () => {
        if (el) {
          el.removeEventListener("pointerdown", onPointerDown);
          el.removeEventListener("pointermove", onPointerMove);
          el.removeEventListener("click", onCanvasClick);
        }
      }
    );
  }
  onDestroy() {
    this.setTarget(null);
    for (const off of this.subs) off();
    this.subs.length = 0;
    this.layer = null;
  }
  onDisable() {
    this.setTarget(null);
  }
  // ─── Public API ─────────────────────────────────────────────────────────
  /** The element currently targeted for inspection, or `null`. */
  getTarget() {
    return this.target;
  }
  /** Set the inspected element explicitly (e.g. from a context menu). */
  setTarget(target) {
    const same = target === null && this.target === null || target !== null && this.target !== null && target.kind === this.target.kind && target.id === this.target.id;
    if (same) return;
    this.target = target;
    this.events.emit("inspect:change", target);
  }
  /** Clear the inspected element. */
  clear() {
    this.setTarget(null);
  }
  // ─── Internals ──────────────────────────────────────────────────────────
  handleElementClick(id, kind) {
    if (!this._enabled || !this.layer) return;
    const exists = kind === "node" ? this.layer.store.hasNode(id) : this.layer.store.hasEdge(id);
    if (!exists) return;
    this.setTarget({ kind, id });
  }
};
var ClickViewBehaviour = class extends Behaviour {
  kind = "click-view";
  /**
   * View event bus. Subscribe to `'view:change'` for the current single target
   * (or `null`) every time it changes.
   */
  events = new EventEmitter();
  layer = null;
  /** Live-read from `_options` (consulted at click-time) so `setOptions` applies. */
  get clearOnBackground() {
    return this._options.clearOnBackground ?? true;
  }
  /** Subscription disposers. */
  subs = [];
  /** Current viewed element, or `null`. */
  target = null;
  /** The kernel store, for mirroring {@link target} into `interaction.inspect`. */
  canvasStore = null;
  /** True when the most recent click already consumed an element. */
  clickConsumedByElement = false;
  /** Pointerdown screen-position — used to distinguish a click from a drag. */
  pointerDownScreen = null;
  /**
   * Set once the pointer travels past the click/drag threshold while a button
   * is held — suppresses the synthetic element `click` fired at the end of a
   * node drag so a drag doesn't open the viewer.
   */
  pressMoved = false;
  constructor(opts) {
    super({ ...opts, shortcuts: opts.shortcuts ?? ["pointer+click"] });
  }
  // ─── Lifecycle ──────────────────────────────────────────────────────────
  onRegister(ctx) {
    const layer = ctx.layers.get(this.targetLayerId);
    if (!layer) {
      throw new Error(
        `ClickViewBehaviour "${this.id}": layer "${this.targetLayerId}" not found. Add the GraphLayer before registering this behaviour.`
      );
    }
    this.layer = layer;
    const renderer = layer.getRenderer();
    if (!renderer) {
      throw new Error(
        `ClickViewBehaviour "${this.id}": target layer is not mounted. Add the GraphLayer to the canvas before registering this behaviour.`
      );
    }
    const onShapeClick = (e) => {
      this.clickConsumedByElement = true;
      if (this.pressMoved) return;
      this.handleElementClick(e.id, "node");
    };
    const onConnClick = (e) => {
      this.clickConsumedByElement = true;
      if (this.pressMoved) return;
      this.handleElementClick(e.id, "edge");
    };
    const DRAG_VS_CLICK_THRESHOLD_PX = 4;
    const onPointerDown = (e) => {
      this.pressMoved = false;
      if (e.button !== 0) {
        this.pointerDownScreen = null;
        return;
      }
      this.pointerDownScreen = { x: e.clientX, y: e.clientY };
    };
    const onPointerMove = (e) => {
      const down = this.pointerDownScreen;
      if (!down || this.pressMoved) return;
      if (Math.hypot(e.clientX - down.x, e.clientY - down.y) > DRAG_VS_CLICK_THRESHOLD_PX) {
        this.pressMoved = true;
      }
    };
    const onCanvasClick = (e) => {
      const down = this.pointerDownScreen;
      this.pointerDownScreen = null;
      if (this.clickConsumedByElement) {
        this.clickConsumedByElement = false;
        return;
      }
      if (e.button !== 0) return;
      if (down) {
        if (Math.hypot(e.clientX - down.x, e.clientY - down.y) > DRAG_VS_CLICK_THRESHOLD_PX) return;
      }
      if (this.clearOnBackground) this.clear();
    };
    this.canvasStore = ctx.store;
    this.subs.push(
      ctx.store.view.subscribe((state, prev) => {
        const id = state.interaction.inspect;
        if (id === prev.interaction.inspect || !this._enabled || !this.layer) return;
        if (id === null) {
          if (this.target) this.setTarget(null);
          return;
        }
        if (this.layer.store.hasNode(id)) this.setTarget({ kind: "node", id });
        else if (this.layer.store.hasEdge(id)) this.setTarget({ kind: "edge", id });
      })
    );
    renderer.events.on("shape:click", onShapeClick);
    renderer.events.on("connector:click", onConnClick);
    const el = ctx.canvasElement;
    if (el) {
      el.addEventListener("pointerdown", onPointerDown);
      el.addEventListener("pointermove", onPointerMove);
      el.addEventListener("click", onCanvasClick);
    }
    this.subs.push(
      () => renderer.events.off("shape:click", onShapeClick),
      () => renderer.events.off("connector:click", onConnClick),
      () => {
        if (el) {
          el.removeEventListener("pointerdown", onPointerDown);
          el.removeEventListener("pointermove", onPointerMove);
          el.removeEventListener("click", onCanvasClick);
        }
      }
    );
  }
  onDestroy() {
    this.setTarget(null);
    for (const off of this.subs) off();
    this.subs.length = 0;
    this.layer = null;
    this.canvasStore = null;
  }
  onDisable() {
    this.setTarget(null);
  }
  // ─── Public API ─────────────────────────────────────────────────────────
  /** The element currently targeted for viewing, or `null`. */
  getTarget() {
    return this.target;
  }
  /** Set the viewed element explicitly (e.g. from a context menu). */
  setTarget(target) {
    const same = target === null && this.target === null || target !== null && this.target !== null && target.kind === this.target.kind && target.id === this.target.id;
    if (same) return;
    const previous = this.target;
    this.target = target;
    this.events.emit("view:change", target);
    const inspect = this.canvasStore?.view.getState().interaction.inspect ?? null;
    if (target && inspect !== target.id) this.canvasStore?.actions.inspect.set(target.id);
    else if (!target && previous && inspect === previous.id) this.canvasStore?.actions.inspect.clear();
  }
  /** Clear the viewed element. */
  clear() {
    this.setTarget(null);
  }
  // ─── Internals ──────────────────────────────────────────────────────────
  handleElementClick(id, kind) {
    if (!this._enabled || !this.layer) return;
    const exists = kind === "node" ? this.layer.store.hasNode(id) : this.layer.store.hasEdge(id);
    if (!exists) return;
    this.setTarget({ kind, id });
  }
};
function resolveOptions3(prev, patch) {
  const base = prev ?? {
    focusState: "highlighted",
    dimState: "dimmed",
    includeEdges: true,
    frame: false,
    framePadding: 80,
    frameDurationMs: 450,
    frameMaxZoom: 2
  };
  return {
    focusState: patch.focusState ?? base.focusState,
    dimState: patch.dimState ?? base.dimState,
    includeEdges: patch.includeEdges ?? base.includeEdges,
    frame: patch.frame ?? base.frame,
    framePadding: patch.framePadding ?? base.framePadding,
    frameDurationMs: patch.frameDurationMs ?? base.frameDurationMs,
    frameMaxZoom: patch.frameMaxZoom ?? base.frameMaxZoom
  };
}
var FocusBehaviour = class extends Behaviour {
  kind = "focus";
  opts;
  layer = null;
  ctxRef = null;
  subs = [];
  /**
   * What this behaviour has written, per element id, with the state name it
   * used — so an option change (a new `focusState`) still clears the old name.
   */
  nodeMarks = /* @__PURE__ */ new Map();
  edgeMarks = /* @__PURE__ */ new Map();
  constructor(opts) {
    super({ ...opts, shortcuts: opts.shortcuts ?? [] });
    this.opts = resolveOptions3(null, opts);
  }
  // ─── Lifecycle ──────────────────────────────────────────────────────────
  onRegister(ctx) {
    const layer = ctx.layers.get(this.targetLayerId);
    if (!layer) {
      throw new Error(
        `FocusBehaviour "${this.id}": layer "${this.targetLayerId}" not found. Add the GraphLayer before registering this behaviour.`
      );
    }
    this.layer = layer;
    this.ctxRef = ctx;
    this.subs.push(
      ctx.store.view.subscribe((state, prev) => {
        if (!this.isEnabled) return;
        const focusChanged = state.interaction.focus !== prev.interaction.focus;
        if (focusChanged) {
          this.sync();
          if (this.opts.frame && state.interaction.focus) this.frameWhenSettled();
        }
        const intent = state.interaction.cameraIntent;
        if (intent && intent !== prev.interaction.cameraIntent && intent.intent === "focus") {
          this.frameWhenSettled();
        }
      }),
      // Nodes added or removed under an active focus: dim the newcomers, forget the gone.
      layer.events.on("data:changed", (e) => {
        if (e.addedNodes > 0 || e.removedNodes > 0 || e.addedEdges > 0 || e.removedEdges > 0) this.sync();
      })
    );
  }
  onEnable() {
    this.sync();
  }
  onDisable() {
    this.clearAll();
  }
  onDestroy() {
    this.clearAll();
    for (const off of this.subs) off();
    this.subs.length = 0;
    this.layer = null;
    this.ctxRef = null;
  }
  // ─── Public API ─────────────────────────────────────────────────────────
  /** Resolved current options (read-only snapshot). */
  get options() {
    return this.opts;
  }
  /** Runtime option update; redraws the current focus when enabled. */
  setOptions(patch) {
    this.recordOptions(patch);
    this.opts = resolveOptions3(this.opts, patch);
    if (this.isEnabled) this.sync();
  }
  // ─── Internals ──────────────────────────────────────────────────────────
  focus() {
    return this.ctxRef?.store.view.getState().interaction.focus ?? null;
  }
  /** Bring the written states in line with the store's focus, writing only the difference. */
  sync() {
    const layer = this.layer;
    if (!layer || !this.isEnabled) return;
    const focus = this.focus();
    const { focusState, dimState, includeEdges } = this.opts;
    const dim = focus !== null && focus.dim && dimState !== "";
    const wantNodes = /* @__PURE__ */ new Map();
    const wantEdges = /* @__PURE__ */ new Map();
    if (focus && focus.ids.size > 0) {
      for (const node of layer.store.nodes()) {
        if (focus.ids.has(node.id)) wantNodes.set(node.id, "focus");
        else if (dim) wantNodes.set(node.id, "dim");
      }
      for (const edge of layer.store.edges()) {
        const inside = focus.ids.has(edge.source) && focus.ids.has(edge.target);
        if (inside && includeEdges) wantEdges.set(edge.id, "focus");
        else if (dim && !inside) wantEdges.set(edge.id, "dim");
      }
    }
    const nameOf = (mark) => mark === "focus" ? focusState : dimState;
    const store = layer.store;
    store.batch(() => {
      reconcile(this.nodeMarks, wantNodes, nameOf, (id, state, on) => {
        if (on || store.hasNode(id)) store.internal.setNodeState(id, state, on);
      });
      reconcile(this.edgeMarks, wantEdges, nameOf, (id, state, on) => {
        if (on || store.hasEdge(id)) store.internal.setEdgeState(id, state, on);
      });
    });
  }
  clearAll() {
    const store = this.layer?.store;
    if (!store) {
      this.nodeMarks.clear();
      this.edgeMarks.clear();
      return;
    }
    store.batch(() => {
      for (const [id, { state }] of this.nodeMarks) if (store.hasNode(id)) store.internal.setNodeState(id, state, false);
      for (const [id, { state }] of this.edgeMarks) if (store.hasEdge(id)) store.internal.setEdgeState(id, state, false);
    });
    this.nodeMarks.clear();
    this.edgeMarks.clear();
  }
  /**
   * Frame the focus once the canvas settles — after the layout a step
   * triggered has placed the nodes, so the camera aims at where they end up.
   * A focus that changed meanwhile is framed as it is then.
   */
  frameWhenSettled() {
    const ctx = this.ctxRef;
    if (!ctx) return;
    const settled = ctx.whenSettled?.() ?? Promise.resolve();
    void settled.then(() => this.frameNow());
  }
  frameNow() {
    const layer = this.layer;
    const ctx = this.ctxRef;
    const focus = this.focus();
    if (!layer || !ctx || !focus || focus.ids.size === 0 || !this.isEnabled) return;
    const rect2 = layer.getBounds({ ids: focus.ids });
    if (!rect2) return;
    const cam = ctx.camera;
    const { framePadding: pad, frameMaxZoom, frameDurationMs } = this.opts;
    const minX = rect2.x;
    const minY = rect2.y;
    const width = Math.max(1, rect2.width);
    const height = Math.max(1, rect2.height);
    const zoom = Math.min(
      frameMaxZoom,
      Math.max(1, cam.screenWidth - pad * 2) / width,
      Math.max(1, cam.screenHeight - pad * 2) / height
    );
    const cx = minX + width / 2;
    const cy = minY + height / 2;
    const to = { x: cam.screenWidth / 2 - cx * zoom, y: cam.screenHeight / 2 - cy * zoom, zoom };
    if (frameDurationMs > 0) cam.animateTo(to, { durationMs: frameDurationMs, easing: "easeOutCubic" });
    else cam.setTransform(to);
  }
};
function reconcile(written, want, nameOf, write) {
  for (const [id, prev] of written) {
    const mark = want.get(id);
    if (mark !== void 0 && nameOf(mark) === prev.state && mark === prev.mark) continue;
    write(id, prev.state, false);
    written.delete(id);
  }
  for (const [id, mark] of want) {
    if (written.has(id)) continue;
    const state = nameOf(mark);
    write(id, state, true);
    written.set(id, { mark, state });
  }
}
function resolveOptions4(prev, patch) {
  const base = prev ?? {
    targets: ["node", "edge"],
    openDelay: 50,
    closeDelay: 50,
    placement: "bottom-right",
    interactive: true,
    enable: true,
    card: {},
    cards: {},
    onShow: void 0,
    onHide: void 0
  };
  return {
    targets: patch.targets ?? base.targets,
    openDelay: patch.openDelay ?? base.openDelay,
    closeDelay: patch.closeDelay ?? base.closeDelay,
    placement: patch.placement ?? base.placement,
    interactive: patch.interactive ?? base.interactive,
    enable: patch.enable ?? base.enable,
    card: patch.card ?? base.card,
    cards: patch.cards ?? base.cards,
    onShow: "onShow" in patch ? patch.onShow : base.onShow,
    onHide: "onHide" in patch ? patch.onHide : base.onHide
  };
}
function getByPath(subject, path) {
  if (!path) return void 0;
  let cur = subject;
  for (const key of path.split(".")) {
    if (cur === null || cur === void 0) return void 0;
    cur = cur[key];
  }
  return cur;
}
function toDisplayString(value) {
  if (value === null || value === void 0) return void 0;
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return void 0;
}
function formatRowValue(value, format) {
  if (format === "percent" && typeof value === "number") {
    const pct = value <= 1 && value >= -1 ? value * 100 : value;
    return `${Math.round(pct)}%`;
  }
  return toDisplayString(value) ?? "";
}
function resolvePreviewCard(spec, subject, id, kind, type) {
  const imageUrl = spec.image ? toDisplayString(getByPath(subject, spec.image.field)) : void 0;
  const title = spec.title ? toDisplayString(getByPath(subject, spec.title.field)) : void 0;
  const subtitle = spec.subtitle ? toDisplayString(getByPath(subject, spec.subtitle.field)) : void 0;
  const rows = [{ label: "id", value: id }];
  if (type !== void 0 && type !== "") rows.push({ label: "type", value: type });
  for (const row of spec.rows ?? []) {
    const raw = getByPath(subject, row.field);
    const value = formatRowValue(raw, row.format);
    if (value === "") continue;
    rows.push({ label: row.label, value });
  }
  const card = {
    id,
    kind,
    imageShape: spec.image?.shape ?? "rounded",
    subtitleMaxLines: spec.subtitle?.maxLines ?? 2,
    rows
  };
  if (type !== void 0) card.type = type;
  if (imageUrl !== void 0) card.imageUrl = imageUrl;
  if (title !== void 0) card.title = title;
  if (subtitle !== void 0) card.subtitle = subtitle;
  return card;
}
var HoverElementPreviewBehaviour = class extends Behaviour {
  kind = "hover-element-preview";
  /**
   * Preview event bus. Subscribe to `'preview:show'` / `'preview:move'` /
   * `'preview:hide'` to render and position the card.
   */
  events = new EventEmitter();
  layer = null;
  opts;
  /** Subscription disposers, called in `onDestroy`. */
  subs = [];
  /** The snapshot currently shown, or `null`. */
  shown = null;
  /** The target queued by the open timer (awaiting dwell), or `null`. */
  pending = null;
  /**
   * `true` while the pointer rests on an interactive card ({@link holdOpen}).
   * Suppresses every hide path — so a late `shape:pointerout` (fired because the
   * DOM card swallowed the pointer over the node) can't close the card after
   * `holdOpen` already cancelled the timer. Order-independent.
   */
  held = false;
  openTimer = null;
  closeTimer = null;
  constructor(opts) {
    super({ ...opts, shortcuts: opts.shortcuts ?? ["pointer+hover"] });
    this.opts = resolveOptions4(null, opts);
  }
  // ─── Lifecycle ──────────────────────────────────────────────────────────
  onRegister(ctx) {
    const layer = ctx.layers.get(this.targetLayerId);
    if (!layer) {
      throw new Error(
        `HoverElementPreviewBehaviour "${this.id}": layer "${this.targetLayerId}" not found. Add the GraphLayer before registering this behaviour.`
      );
    }
    this.layer = layer;
    const renderer = layer.getRenderer();
    if (!renderer) {
      throw new Error(
        `HoverElementPreviewBehaviour "${this.id}": target layer "${this.targetLayerId}" is not mounted. Add the GraphLayer to the canvas before registering this behaviour.`
      );
    }
    const onShapeOver = (e) => this.handlePointerOver(e.id, "node", e.worldX, e.worldY);
    const onShapeOut = (e) => this.handlePointerOut(e.id);
    const onConnOver = (e) => this.handlePointerOver(e.id, "edge", e.worldX, e.worldY);
    const onConnOut = (e) => this.handlePointerOut(e.id);
    renderer.events.on("shape:pointerover", onShapeOver);
    renderer.events.on("shape:pointerout", onShapeOut);
    renderer.events.on("connector:pointerover", onConnOver);
    renderer.events.on("connector:pointerout", onConnOut);
    this.subs.push(
      () => renderer.events.off("shape:pointerover", onShapeOver),
      () => renderer.events.off("shape:pointerout", onShapeOut),
      () => renderer.events.off("connector:pointerover", onConnOver),
      () => renderer.events.off("connector:pointerout", onConnOut)
    );
    const onCameraChange = () => this.reposition();
    ctx.events.on("input:camera:pan", onCameraChange);
    ctx.events.on("input:camera:zoom", onCameraChange);
    this.subs.push(
      () => ctx.events.off("input:camera:pan", onCameraChange),
      () => ctx.events.off("input:camera:zoom", onCameraChange)
    );
    const el = ctx.canvasElement;
    if (el) {
      const onLeave = () => {
        if (this.opts.interactive) this.scheduleHide();
        else this.hideNow();
      };
      el.addEventListener("pointerleave", onLeave);
      this.subs.push(() => el.removeEventListener("pointerleave", onLeave));
      const onPointerDown = () => this.hideNow();
      el.addEventListener("pointerdown", onPointerDown);
      this.subs.push(() => el.removeEventListener("pointerdown", onPointerDown));
    }
  }
  onDestroy() {
    this.hideNow();
    for (const off of this.subs) off();
    this.subs.length = 0;
    this.layer = null;
  }
  onDisable() {
    this.hideNow();
  }
  // ─── Public API ─────────────────────────────────────────────────────────
  /** The snapshot currently shown, or `null`. */
  get current() {
    return this.shown;
  }
  /** Read-only snapshot of resolved options. */
  get options() {
    return this.opts;
  }
  /**
   * Runtime option update. A `card` / `placement` change re-resolves any
   * in-flight card so the next paint reflects it immediately.
   */
  setOptions(patch) {
    this.recordOptions(patch);
    const repaint = "card" in patch && patch.card !== this.opts.card || "cards" in patch && patch.cards !== this.opts.cards || patch.placement !== void 0 && patch.placement !== this.opts.placement;
    this.opts = resolveOptions4(this.opts, patch);
    if (repaint && this.shown) {
      const snap = this.shown;
      const subject = snap.kind === "node" ? snap.node : snap.edge;
      const card = resolvePreviewCard(
        this.specFor(snap.kind, subject.type),
        subject,
        snap.id,
        snap.kind,
        subject.type
      );
      this.shown = { ...snap, card, placement: this.opts.placement };
      this.events.emit("preview:show", this.shown);
      this.opts.onShow?.(this.shown);
    }
  }
  /** Force the card to hide (cancels any pending dwell). */
  hide() {
    this.hideNow();
  }
  /**
   * Keep the card open — cancels the pending close timer. Call from the card's
   * `pointerenter` in {@link HoverElementPreviewBehaviourOptions.interactive} mode so
   * the pointer can rest on the card (to select text / click) without it hiding.
   */
  holdOpen() {
    this.held = true;
    this.clearCloseTimer();
  }
  /**
   * Release a {@link holdOpen} — restart the `closeDelay` grace timer. Call from
   * the card's `pointerleave` so it hides once the pointer leaves the card.
   */
  releaseHold() {
    this.held = false;
    this.scheduleHide();
  }
  // ─── Pointer handlers ─────────────────────────────────────────────────────
  handlePointerOver(id, kind, worldX, worldY) {
    if (!this._enabled) return;
    if (this.held) return;
    if (!this.opts.targets.includes(kind)) return;
    const snap = this.resolveSnapshot(id, kind, worldX, worldY);
    if (!snap) return;
    const { enable } = this.opts;
    if (enable === false) return;
    const element = snap.kind === "node" ? snap.node : snap.edge;
    if (typeof enable === "function" && !enable(element, kind)) return;
    this.clearCloseTimer();
    if (this.shown && this.shown.id === id) return;
    if (this.pending && this.pending.id === id) return;
    if (this.shown) {
      this.clearOpenTimer();
      this.pending = null;
      this.showSnapshot(snap);
      return;
    }
    this.pending = snap;
    this.clearOpenTimer();
    if (this.opts.openDelay <= 0) {
      this.fireOpen();
    } else {
      this.openTimer = setTimeout(() => this.fireOpen(), this.opts.openDelay);
    }
  }
  handlePointerOut(id) {
    if (this.pending && this.pending.id === id) {
      this.clearOpenTimer();
      this.pending = null;
      return;
    }
    if (this.shown && this.shown.id === id) this.scheduleHide();
  }
  /** Start (or restart) the `closeDelay` grace timer that hides the card. */
  scheduleHide() {
    if (!this.shown) return;
    if (this.held) return;
    this.clearCloseTimer();
    if (this.opts.closeDelay <= 0) {
      this.hideNow();
    } else {
      this.closeTimer = setTimeout(() => this.hideNow(), this.opts.closeDelay);
    }
  }
  // ─── Internals ────────────────────────────────────────────────────────────
  /** Mature the dwell timer — show whatever snapshot is pending. */
  fireOpen() {
    this.openTimer = null;
    const snap = this.pending;
    this.pending = null;
    if (snap) this.showSnapshot(snap);
  }
  showSnapshot(snap) {
    this.held = false;
    this.shown = snap;
    this.events.emit("preview:show", snap);
    this.opts.onShow?.(snap);
  }
  hideNow() {
    this.clearOpenTimer();
    this.clearCloseTimer();
    this.pending = null;
    this.held = false;
    if (!this.shown) return;
    this.shown = null;
    this.events.emit("preview:hide", null);
    this.opts.onHide?.();
  }
  /** Re-project the shown card's world anchor to screen and emit `preview:move`. */
  reposition() {
    const snap = this.shown;
    const ctx = this.ctx;
    if (!snap || !ctx) return;
    const s = ctx.camera.toScreen(snap.world.x, snap.world.y);
    this.shown = { ...snap, screen: { x: s.x, y: s.y } };
    this.events.emit("preview:move", this.shown);
  }
  /**
   * Pick the card spec for a hovered element — its per-type override from
   * {@link HoverElementPreviewBehaviourOptions.cards} when present, else the
   * single {@link HoverElementPreviewBehaviourOptions.card} fallback.
   */
  specFor(kind, type) {
    const byType = kind === "node" ? this.opts.cards.nodes : this.opts.cards.edges;
    return (type !== void 0 ? byType?.[type] : void 0) ?? this.opts.card;
  }
  /**
   * Resolve a hovered id into a full {@link PreviewSnapshot} (live record +
   * anchor + card). Nodes anchor at their centre (stable across pan / zoom);
   * edges anchor at the hover point `(worldX, worldY)`. Returns `null` if the
   * element vanished between the pointer event and resolution.
   */
  resolveSnapshot(id, kind, worldX, worldY) {
    const layer = this.layer;
    const ctx = this.ctx;
    if (!layer || !ctx) return null;
    const placement = this.opts.placement;
    if (kind === "node") {
      const node = layer.store.getNode(id);
      if (!node) return null;
      const world = node.position ?? layer.store.getPosition(id) ?? { x: worldX, y: worldY };
      const s2 = ctx.camera.toScreen(world.x, world.y);
      return {
        kind: "node",
        id,
        node,
        card: resolvePreviewCard(this.specFor("node", node.type), node, id, "node", node.type),
        placement,
        world: { x: world.x, y: world.y },
        screen: { x: s2.x, y: s2.y }
      };
    }
    const edge = layer.store.getEdge(id);
    if (!edge) return null;
    const s = ctx.camera.toScreen(worldX, worldY);
    return {
      kind: "edge",
      id,
      edge,
      card: resolvePreviewCard(this.specFor("edge", edge.type), edge, id, "edge", edge.type),
      placement,
      world: { x: worldX, y: worldY },
      screen: { x: s.x, y: s.y }
    };
  }
  clearOpenTimer() {
    if (this.openTimer !== null) {
      clearTimeout(this.openTimer);
      this.openTimer = null;
    }
  }
  clearCloseTimer() {
    if (this.closeTimer !== null) {
      clearTimeout(this.closeTimer);
      this.closeTimer = null;
    }
  }
};
var DEFAULT_CATEGORY_PALETTE = [
  3900150,
  15680580,
  1096065,
  16096779,
  9133302,
  15485081,
  440020,
  15381256,
  1357990,
  10741301,
  16347926,
  6514417
];
var DEFAULT_RANGE_STOPS = [15726335, 12573694, 6333946, 2450411, 1981066];
function resolveOptions5(prev, patch) {
  const base = prev ?? {
    mode: "categorical",
    nodeValueKey: "type",
    edgeValueKey: "type",
    nodeValueBy: void 0,
    edgeValueBy: void 0,
    colorNodes: true,
    colorEdges: true,
    fallbackColor: 10265519,
    palette: DEFAULT_CATEGORY_PALETTE,
    valueColors: {},
    maxCategories: 24,
    scale: "linear",
    colorStops: DEFAULT_RANGE_STOPS,
    nodeDomain: void 0,
    edgeDomain: void 0,
    bins: 5,
    nodeThresholds: void 0,
    edgeThresholds: void 0
  };
  const stops = patch.colorStops ?? base.colorStops;
  return {
    mode: patch.mode ?? base.mode,
    nodeValueKey: patch.nodeValueKey ?? base.nodeValueKey,
    edgeValueKey: patch.edgeValueKey ?? base.edgeValueKey,
    nodeValueBy: "nodeValueBy" in patch ? patch.nodeValueBy : base.nodeValueBy,
    edgeValueBy: "edgeValueBy" in patch ? patch.edgeValueBy : base.edgeValueBy,
    colorNodes: patch.colorNodes ?? base.colorNodes,
    colorEdges: patch.colorEdges ?? base.colorEdges,
    fallbackColor: patch.fallbackColor ?? base.fallbackColor,
    // An empty palette would divide by zero in the cycle; treat it as "unset".
    palette: patch.palette && patch.palette.length > 0 ? patch.palette : base.palette,
    valueColors: patch.valueColors ?? base.valueColors,
    maxCategories: patch.maxCategories ?? base.maxCategories,
    scale: patch.scale ?? base.scale,
    colorStops: stops.length > 0 ? stops : DEFAULT_RANGE_STOPS,
    nodeDomain: "nodeDomain" in patch ? patch.nodeDomain : base.nodeDomain,
    edgeDomain: "edgeDomain" in patch ? patch.edgeDomain : base.edgeDomain,
    bins: patch.bins ?? base.bins,
    nodeThresholds: "nodeThresholds" in patch ? normaliseEdgesList(patch.nodeThresholds) : base.nodeThresholds,
    edgeThresholds: "edgeThresholds" in patch ? normaliseEdgesList(patch.edgeThresholds) : base.edgeThresholds
  };
}
function normaliseEdgesList(xs) {
  if (!xs) return void 0;
  return [...new Set(xs.filter((n) => Number.isFinite(n)))].sort((a, b) => a - b);
}
function toCategory(value) {
  if (value == null || value === "") return null;
  return String(value);
}
function toMagnitude(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
function lerpColor(a, b, t) {
  const ar = a >> 16 & 255;
  const ag = a >> 8 & 255;
  const ab = a & 255;
  const br = b >> 16 & 255;
  const bg = b >> 8 & 255;
  const bb = b & 255;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return r << 16 | g << 8 | bl;
}
function sampleStops(stops, t) {
  if (stops.length === 0) return null;
  if (stops.length === 1) return stops[0];
  const clamped = t < 0 ? 0 : t > 1 ? 1 : t;
  const pos = clamped * (stops.length - 1);
  const i = Math.min(stops.length - 2, Math.floor(pos));
  return lerpColor(stops[i], stops[i + 1], pos - i);
}
function easeMagnitude(value, lo, hi, scale) {
  if (hi <= lo) return 0;
  const t = (value - lo) / (hi - lo);
  const clamped = t < 0 ? 0 : t > 1 ? 1 : t;
  switch (scale) {
    case "sqrt":
      return Math.sqrt(clamped);
    case "log":
      return Math.log1p(clamped * (hi - lo)) / Math.log1p(hi - lo);
    default:
      return clamped;
  }
}
function bucketIndex(value, edges) {
  let i = 0;
  while (i < edges.length && value >= edges[i]) i += 1;
  return i;
}
function quantileEdges(sorted, bins) {
  if (sorted.length === 0 || bins <= 1) return [];
  const edges = [];
  for (let i = 1; i < bins; i++) {
    const idx = Math.floor(i / bins * sorted.length);
    edges.push(sorted[Math.min(sorted.length - 1, idx)]);
  }
  return [...new Set(edges)];
}
var ColorByBehaviour = class extends Behaviour {
  kind = "color-by";
  layer = null;
  opts;
  /** Subscription disposers, called in `onDestroy`. */
  subs = [];
  /** Coalesces a burst of topology events into one domain rescan. */
  rescanScheduled = false;
  /** Re-entrancy guard — our own repaint must not feed back into a rescan. */
  patching = false;
  /** value → assigned colour, in first-appearance order. Categorical mode. */
  colors = /* @__PURE__ */ new Map();
  /** Distinct values assigned *from the palette* — what `maxCategories` counts. */
  paletteAssigned = 0;
  /** Values that overflowed the cap, for the legend's `other (N)` row. */
  overflow = /* @__PURE__ */ new Set();
  nodeState = { domain: [0, 1], edges: [] };
  edgeState = { domain: [0, 1], edges: [] };
  /** True while the resolvers are installed on the template. */
  applied = false;
  /** Prior template fields, captured on `apply` and put back on `restore`. */
  priorNodeBgFill = void 0;
  priorEdgeStroke = void 0;
  priorEdgeArrow = void 0;
  /**
   * The exact resolver instances this behaviour installed, so `restore` can tell
   * **its own** function from a consumer's. Identity, not `typeof === 'function'`:
   * a consumer's `bgFill: (n) => …` is also a function, and treating it as ours
   * meant disabling this behaviour overwrote their fill with a snapshot taken
   * before their config was ever applied — usually `undefined`, which renders a
   * node with no fill at all.
   */
  installedNodeBgFill = void 0;
  /** Stroke alone identifies the edge channel — both fields install together. */
  installedEdgeStroke = void 0;
  constructor(opts) {
    super({ ...opts, shortcuts: opts.shortcuts ?? [] });
    this.opts = resolveOptions5(null, opts);
  }
  // ─── Lifecycle ────────────────────────────────────────────────────────────
  onRegister(ctx) {
    const layer = ctx.layers.get(this.targetLayerId);
    if (!layer) {
      throw new Error(
        `ColorByBehaviour "${this.id}": layer "${this.targetLayerId}" not found. Add the GraphLayer before registering this behaviour.`
      );
    }
    this.layer = layer;
    const schedule = () => this.scheduleRescan();
    this.subs.push(
      layer.store.events.on("node:add", schedule),
      layer.store.events.on("node:remove", schedule),
      layer.store.events.on("edge:add", schedule),
      layer.store.events.on("edge:remove", schedule)
    );
  }
  onEnable() {
    this.rescanDomains();
    this.apply();
  }
  onDisable() {
    this.restore();
  }
  onDestroy() {
    this.restore();
    for (const off of this.subs.splice(0)) off();
    this.layer = null;
  }
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
  onOptionsChanged(patch) {
    this.opts = resolveOptions5(this.opts, patch);
    if (!this.isEnabled || !this.layer) return;
    this.resetAssignments();
    this.rescanDomains();
    this.apply();
  }
  // ─── Public API ───────────────────────────────────────────────────────────
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
  getResolvedOptions() {
    return this.opts;
  }
  /**
   * The derived per-channel domain and bin edges the colour resolvers read.
   *
   * Only meaningful in `'range'` mode. Worth exposing separately from
   * {@link getResolvedOptions} because when `nodeDomain` / `edgeDomain` are unset
   * the *resolved option* is `undefined` while the *domain in use* is whatever
   * the last auto-scan found — and that gap is exactly what surprises people.
   */
  getDomains() {
    return {
      nodes: { domain: [...this.nodeState.domain], edges: [...this.nodeState.edges] },
      edges: { domain: [...this.edgeState.domain], edges: [...this.edgeState.edges] }
    };
  }
  /**
   * Live value → colour mapping. Categorical mode only — `'range'` has no discrete
   * assignment, so prefer {@link getLegend} for anything mode-agnostic.
   */
  getColorMap() {
    return this.colors;
  }
  /**
   * What a legend should render, per coloured channel.
   *
   * Derived from the same resolved options and domain the canvas is painted
   * from, so a legend sourced here can never disagree with what's on screen —
   * which a type-keyed legend structurally does once `mode: 'range'` is on.
   */
  getLegend() {
    const out = {};
    if (this.opts.colorNodes) out.nodes = this.legendFor("node");
    if (this.opts.colorEdges) out.edges = this.legendFor("edge");
    return out;
  }
  /** The colour for one already-extracted category value. */
  colorForValue(value) {
    if (value == null || value === "") return this.opts.fallbackColor;
    const pinned = this.opts.valueColors[value];
    if (pinned !== void 0) return pinned;
    const existing = this.colors.get(value);
    if (existing !== void 0) return existing;
    if (this.paletteAssigned >= this.opts.maxCategories) {
      this.overflow.add(value);
      return this.opts.fallbackColor;
    }
    const colour = this.opts.palette[this.paletteAssigned % this.opts.palette.length];
    this.paletteAssigned += 1;
    this.colors.set(value, colour);
    return colour;
  }
  // ─── Internals — value extraction ─────────────────────────────────────────
  /** Extract a node's raw colour value: accessor if set, else the dot path. */
  nodeValue(n) {
    return this.opts.nodeValueBy ? this.opts.nodeValueBy(n) : readValueKey(n, this.opts.nodeValueKey);
  }
  /** Extract an edge's raw colour value: accessor if set, else the dot path. */
  edgeValue(e) {
    return this.opts.edgeValueBy ? this.opts.edgeValueBy(e) : readValueKey(e, this.opts.edgeValueKey);
  }
  /** Map a raw value to a colour under the current mode. */
  colorFor(raw, state) {
    if (this.opts.mode === "categorical") return this.colorForValue(toCategory(raw));
    const value = toMagnitude(raw);
    if (value === null) return this.opts.fallbackColor;
    const { scale, colorStops } = this.opts;
    if (scale === "quantile" || scale === "threshold") {
      const i = bucketIndex(value, state.edges);
      const t = state.edges.length === 0 ? 0 : i / state.edges.length;
      return sampleStops(colorStops, t) ?? this.opts.fallbackColor;
    }
    const [lo, hi] = state.domain;
    return sampleStops(colorStops, easeMagnitude(value, lo, hi, scale)) ?? this.opts.fallbackColor;
  }
  // ─── Internals — domain ───────────────────────────────────────────────────
  /** Drop category assignments so a new palette / cap re-assigns from scratch. */
  resetAssignments() {
    this.colors.clear();
    this.paletteAssigned = 0;
    this.overflow.clear();
  }
  /**
   * Coalesce a burst of topology events into one rescan on the next microtask.
   * Guarded by `patching` so the repaint we trigger can't feed back into another.
   */
  scheduleRescan() {
    if (!this.isEnabled || this.patching || this.rescanScheduled) return;
    if (this.opts.mode !== "range") return;
    this.rescanScheduled = true;
    queueMicrotask(() => {
      this.rescanScheduled = false;
      if (!this.isEnabled) return;
      this.rescanDomains();
      this.repaint();
    });
  }
  /**
   * Recompute each channel's domain and bin edges.
   *
   * **Refreshes the derived fields only — it never re-runs the install path.**
   * The resolvers close over `this`, so a fresh domain is picked up on the next
   * read; re-installing would re-snapshot the prior template fields and break
   * restore.
   */
  rescanDomains() {
    const layer = this.layer;
    if (!layer || this.opts.mode !== "range") return;
    if (this.opts.colorNodes) {
      const values = [];
      for (const n of layer.store.nodes()) {
        const v = toMagnitude(this.nodeValue(n));
        if (v !== null) values.push(v);
      }
      this.nodeState = this.deriveState(values, this.opts.nodeDomain, this.opts.nodeThresholds);
    }
    if (this.opts.colorEdges) {
      const values = [];
      for (const e of layer.store.edges()) {
        const v = toMagnitude(this.edgeValue(e));
        if (v !== null) values.push(v);
      }
      this.edgeState = this.deriveState(values, this.opts.edgeDomain, this.opts.edgeThresholds);
    }
  }
  /** Build one channel's domain + bin edges from its observed values. */
  deriveState(values, explicitDomain, thresholds) {
    const sorted = values.slice().sort((a, b) => a - b);
    const domain = explicitDomain ? [explicitDomain[0], explicitDomain[1]] : sorted.length > 0 ? [sorted[0], sorted[sorted.length - 1]] : [0, 1];
    const edges = this.opts.scale === "threshold" ? [...thresholds ?? []] : this.opts.scale === "quantile" ? quantileEdges(sorted, this.opts.bins) : [];
    return { domain, edges };
  }
  // ─── Internals — legend ───────────────────────────────────────────────────
  /** Build one channel's legend section from the resolved options + domain. */
  legendFor(channel) {
    const usesAccessor = channel === "node" ? this.opts.nodeValueBy !== void 0 : this.opts.edgeValueBy !== void 0;
    const field = usesAccessor ? "(computed)" : channel === "node" ? this.opts.nodeValueKey : this.opts.edgeValueKey;
    if (this.opts.mode === "categorical") {
      const entries = [...this.colors].map(([value, color2]) => ({ value, color: color2 }));
      for (const [value, color2] of Object.entries(this.opts.valueColors)) {
        if (!this.colors.has(value)) entries.push({ value, color: color2 });
      }
      return this.overflow.size > 0 ? {
        kind: "categories",
        field,
        entries,
        other: { count: this.overflow.size, color: this.opts.fallbackColor }
      } : { kind: "categories", field, entries };
    }
    const state = channel === "node" ? this.nodeState : this.edgeState;
    if (this.opts.scale === "quantile" || this.opts.scale === "threshold") {
      const cuts = state.edges;
      const lo = state.domain[0];
      const hi = state.domain[1];
      const bounds = [lo, ...cuts, hi];
      const bins = bounds.slice(0, -1).map((from, i) => ({
        from,
        to: bounds[i + 1],
        color: sampleStops(this.opts.colorStops, cuts.length === 0 ? 0 : i / cuts.length) ?? this.opts.fallbackColor
      }));
      return { kind: "bins", field, bins };
    }
    return { kind: "gradient", field, domain: [...state.domain], stops: this.opts.colorStops };
  }
  // ─── Internals — write path ───────────────────────────────────────────────
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
  syncNode(layer, on) {
    const current = layer.nodeDefaults?.bgFill;
    const ours = this.installedNodeBgFill !== void 0 && current === this.installedNodeBgFill;
    if (on) {
      if (!ours) this.priorNodeBgFill = current;
      const bgFill = (n) => this.colorFor(this.nodeValue(n), this.nodeState);
      this.installedNodeBgFill = bgFill;
      layer.setNodeDefaults({ bgFill });
    } else if (ours) {
      layer.setNodeDefaults({ bgFill: this.priorNodeBgFill });
      this.installedNodeBgFill = void 0;
    }
  }
  /**
   * Sibling of {@link syncNode} for the edge channel (`strokeColor` +
   * `arrowTargetColor`), with the same identity guard — a consumer's own stroke
   * resolver is never mistaken for ours and restored over.
   */
  syncEdge(layer, on) {
    const current = layer.edgeDefaults?.strokeColor;
    const ours = this.installedEdgeStroke !== void 0 && current === this.installedEdgeStroke;
    if (on) {
      if (!ours) {
        this.priorEdgeStroke = layer.edgeDefaults?.strokeColor;
        this.priorEdgeArrow = layer.edgeDefaults?.arrowTargetColor;
      }
      const colour = (e) => this.colorFor(this.edgeValue(e), this.edgeState);
      this.installedEdgeStroke = colour;
      layer.setEdgeDefaults({
        strokeColor: colour,
        arrowTargetColor: colour
      });
    } else if (ours) {
      layer.setEdgeDefaults({
        strokeColor: this.priorEdgeStroke,
        arrowTargetColor: this.priorEdgeArrow
      });
      this.installedEdgeStroke = void 0;
    }
  }
  /** Install the colour resolvers for the enabled channels. */
  apply() {
    const layer = this.layer;
    if (!layer) return;
    this.syncNode(layer, this.opts.colorNodes);
    this.syncEdge(layer, this.opts.colorEdges);
    this.applied = true;
  }
  /**
   * Re-render with the **already-installed** resolvers, after a domain rescan
   * changed what they return.
   *
   * Deliberately not `apply()`: re-installing would re-snapshot the prior
   * template fields (§restore) and, on every data batch, break disable. Passing
   * the same function identity back through `setNodeDefaults` re-renders every
   * item while leaving the identity guard intact.
   */
  repaint() {
    const layer = this.layer;
    if (!layer || !this.applied) return;
    this.patching = true;
    try {
      if (this.installedNodeBgFill !== void 0) {
        layer.setNodeDefaults({ bgFill: this.installedNodeBgFill });
      }
      if (this.installedEdgeStroke !== void 0) {
        layer.setEdgeDefaults({
          strokeColor: this.installedEdgeStroke,
          arrowTargetColor: this.installedEdgeStroke
        });
      }
    } finally {
      this.patching = false;
    }
  }
  /** Put the snapshotted template fields back (uninstall both channels). */
  restore() {
    const layer = this.layer;
    if (!layer || !this.applied) return;
    this.syncNode(layer, false);
    this.syncEdge(layer, false);
    this.applied = false;
  }
};
function resolveOptions6(prev, patch) {
  const base = prev ?? {
    enable: true,
    enableElements: ["shape", "connector"],
    trigger: ["shift"],
    immediately: false,
    state: "selected",
    style: {},
    clearOnBackground: true,
    onSelect: void 0
  };
  return {
    enable: patch.enable ?? base.enable,
    enableElements: patch.enableElements ?? base.enableElements,
    trigger: patch.trigger ?? base.trigger,
    immediately: patch.immediately ?? base.immediately,
    state: patch.state ?? base.state,
    style: patch.style ?? base.style,
    clearOnBackground: patch.clearOnBackground ?? base.clearOnBackground,
    onSelect: "onSelect" in patch ? patch.onSelect : base.onSelect
  };
}
var DRAG_THRESHOLD = 3;
var BrushSelectBehaviour = class extends Behaviour {
  kind = "brush-select";
  clickSelectId;
  opts;
  layer = null;
  ctxRef = null;
  overlay = null;
  dragActive = false;
  dragStart = null;
  dragCurrent = null;
  // Native canvas-element listener disposers.
  listenerDisposers = [];
  constructor(opts) {
    super({ ...opts, shortcuts: opts.shortcuts ?? ["shift+drag-on-bg"] });
    this.clickSelectId = opts.clickSelectId ?? "click-select";
    this.opts = resolveOptions6(null, opts);
  }
  // ─── Lifecycle ──────────────────────────────────────────────────────────
  onRegister(ctx) {
    const layer = ctx.layers.get(this.targetLayerId);
    if (!layer) {
      throw new Error(
        `BrushSelectBehaviour "${this.id}": layer "${this.targetLayerId}" not found.`
      );
    }
    this.layer = layer;
    this.ctxRef = ctx;
    this.overlay = ctx.createOverlay(`${this.id}-overlay`, "screen");
    const el = ctx.canvasElement;
    if (!el) {
      return;
    }
    const onDown = (e) => this.handlePointerDown(e);
    const onMove = (e) => this.handlePointerMove(e);
    const onUp = (e) => this.handlePointerUp(e);
    const onCancel = () => this.cancelDrag();
    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
    this.listenerDisposers.push(
      () => el.removeEventListener("pointerdown", onDown),
      () => window.removeEventListener("pointermove", onMove),
      () => window.removeEventListener("pointerup", onUp),
      () => window.removeEventListener("pointercancel", onCancel)
    );
  }
  onDestroy() {
    this.cancelDrag();
    for (const off of this.listenerDisposers) off();
    this.listenerDisposers.length = 0;
    this.overlay?.destroy();
    this.overlay = null;
    this.layer = null;
    this.ctxRef = null;
  }
  onDisable() {
    this.cancelDrag();
  }
  // ─── Public API ─────────────────────────────────────────────────────────
  get options() {
    return this.opts;
  }
  setOptions(patch) {
    this.recordOptions(patch);
    this.opts = resolveOptions6(this.opts, patch);
  }
  // ─── Pointer handlers ───────────────────────────────────────────────────
  screenFromEvent(e) {
    const el = this.ctxRef?.canvasElement;
    if (!el) return { x: e.clientX, y: e.clientY };
    const rect2 = el.getBoundingClientRect();
    return { x: e.clientX - rect2.left, y: e.clientY - rect2.top };
  }
  handlePointerDown(e) {
    this.clearRect();
    this.dragActive = false;
    this.dragStart = null;
    this.dragCurrent = null;
    if (!this._enabled) return;
    if (e.button !== 0) return;
    const { enable } = this.opts;
    if (typeof enable === "function" ? !enable(e) : !enable) return;
    if (!this.triggerActive(e)) return;
    const target = e.target;
    if (target !== this.ctxRef?.canvasElement) return;
    const p = this.screenFromEvent(e);
    const world = this.ctxRef?.camera.toWorld(p.x, p.y);
    if (world && this.layer?.getRenderer()?.hitTest(world.x, world.y)?.kind === "shape") {
      return;
    }
    if (!this.claimGesture()) return;
    this.dragActive = true;
    this.dragStart = p;
    this.dragCurrent = p;
  }
  handlePointerMove(e) {
    if (!this.dragActive || !this.dragStart) return;
    if (e.buttons === 0) {
      this.handlePointerUp(e);
      return;
    }
    const p = this.screenFromEvent(e);
    const dx = p.x - this.dragStart.x;
    const dy = p.y - this.dragStart.y;
    if (Math.sqrt(dx * dx + dy * dy) < DRAG_THRESHOLD && this.dragCurrent && this.dragCurrent.x === this.dragStart.x && this.dragCurrent.y === this.dragStart.y) {
      return;
    }
    this.dragCurrent = p;
    this.drawRect();
    if (this.opts.immediately) this.applySelection();
  }
  handlePointerUp(_e) {
    if (!this.dragActive || !this.dragStart || !this.dragCurrent) {
      this.releaseGesture();
      this.dragActive = false;
      return;
    }
    this.clearRect();
    const hasArea = this.rectHasArea();
    if (hasArea) {
      const snapshot = this.applySelection();
      if (snapshot) this.opts.onSelect?.(snapshot);
    } else if (this.opts.clearOnBackground) {
      this.clearSelection();
    }
    this.releaseGesture();
    this.dragActive = false;
    this.dragStart = null;
    this.dragCurrent = null;
  }
  cancelDrag() {
    if (!this.dragActive) return;
    this.clearRect();
    this.releaseGesture();
    this.dragActive = false;
    this.dragStart = null;
    this.dragCurrent = null;
  }
  // ─── Drawing ────────────────────────────────────────────────────────────
  drawRect() {
    const g = this.overlay;
    if (!g || !this.dragStart || !this.dragCurrent) return;
    const x = Math.min(this.dragStart.x, this.dragCurrent.x);
    const y = Math.min(this.dragStart.y, this.dragCurrent.y);
    const w = Math.abs(this.dragCurrent.x - this.dragStart.x);
    const h = Math.abs(this.dragCurrent.y - this.dragStart.y);
    const style = this.opts.style;
    const dash = style.strokeDash ?? [4, 4];
    g.clear().rect(x, y, w, h).fill({ color: style.fill ?? 1472511, alpha: style.fillAlpha ?? 0.1 }).rect(x, y, w, h).stroke({
      color: style.stroke ?? 1472511,
      alpha: style.strokeAlpha ?? 0.8,
      width: style.strokeWidth ?? 1,
      ...dash.length >= 2 ? { dashArray: [dash[0], dash[1]] } : {}
    });
  }
  clearRect() {
    this.overlay?.clear();
  }
  rectHasArea() {
    if (!this.dragStart || !this.dragCurrent) return false;
    return Math.abs(this.dragCurrent.x - this.dragStart.x) > DRAG_THRESHOLD || Math.abs(this.dragCurrent.y - this.dragStart.y) > DRAG_THRESHOLD;
  }
  // ─── Selection ──────────────────────────────────────────────────────────
  triggerActive(e) {
    const { trigger } = this.opts;
    if (trigger.length === 0) return true;
    const active = /* @__PURE__ */ new Set();
    if (e.shiftKey) active.add("shift");
    if (e.ctrlKey) active.add("control");
    if (e.altKey) active.add("alt");
    if (e.metaKey) active.add("meta");
    return trigger.some((k) => active.has(k.toLowerCase()));
  }
  applySelection() {
    const layer = this.layer;
    const ctx = this.ctxRef;
    if (!layer || !ctx || !this.dragStart || !this.dragCurrent) return null;
    const tl = ctx.camera.toWorld(
      Math.min(this.dragStart.x, this.dragCurrent.x),
      Math.min(this.dragStart.y, this.dragCurrent.y)
    );
    const br = ctx.camera.toWorld(
      Math.max(this.dragStart.x, this.dragCurrent.x),
      Math.max(this.dragStart.y, this.dragCurrent.y)
    );
    const wx1 = Math.min(tl.x, br.x);
    const wy1 = Math.min(tl.y, br.y);
    const wx2 = Math.max(tl.x, br.x);
    const wy2 = Math.max(tl.y, br.y);
    const wantShapes = this.opts.enableElements.includes("shape");
    const wantConnectors = this.opts.enableElements.includes("connector");
    const enclosedShapes = /* @__PURE__ */ new Set();
    if (wantShapes) {
      for (const node of layer.store.nodes()) {
        if (!layer.store.isNodeVisible(node.id)) continue;
        const pos = node.position ?? { x: 0, y: 0 };
        if (pos.x >= wx1 && pos.x <= wx2 && pos.y >= wy1 && pos.y <= wy2) {
          enclosedShapes.add(node.id);
        }
      }
    }
    const enclosedConnectors = /* @__PURE__ */ new Set();
    if (wantConnectors) {
      for (const edge of layer.store.edges()) {
        if (!layer.store.isEdgeVisible(edge.id)) continue;
        if (enclosedShapes.has(edge.source) && enclosedShapes.has(edge.target)) {
          enclosedConnectors.add(edge.id);
        }
      }
    }
    const clickSelect = ctx.behaviours.get(this.clickSelectId);
    if (clickSelect) {
      const merged = /* @__PURE__ */ new Map();
      for (const sid of clickSelect.getSelectedShapeIds()) merged.set(sid, "shape");
      for (const cid of clickSelect.getSelectedConnectorIds()) merged.set(cid, "connector");
      for (const sid of enclosedShapes) merged.set(sid, "shape");
      for (const cid of enclosedConnectors) merged.set(cid, "connector");
      const elements = [];
      for (const [id, type] of merged) elements.push({ id, type });
      clickSelect.selectMultiple(elements);
      return {
        shapeIds: clickSelect.getSelectedShapeIds(),
        connectorIds: clickSelect.getSelectedConnectorIds()
      };
    }
    const { state } = this.opts;
    for (const sid of enclosedShapes) layer.store.setNodeState(sid, state, true);
    for (const cid of enclosedConnectors) layer.store.setEdgeState(cid, state, true);
    return {
      shapeIds: [...enclosedShapes],
      connectorIds: [...enclosedConnectors]
    };
  }
  clearSelection() {
    const ctx = this.ctxRef;
    const layer = this.layer;
    if (!ctx || !layer) return;
    const clickSelect = ctx.behaviours.get(this.clickSelectId);
    if (clickSelect) {
      clickSelect.clearSelection();
      return;
    }
    layer.store.clearNodeState(this.opts.state);
    layer.store.clearEdgeState(this.opts.state);
  }
};
function resolveOptions7(prev, patch) {
  const base = prev ?? {
    enable: true,
    enableElements: ["shape", "connector"],
    trigger: ["shift"],
    immediately: false,
    state: "selected",
    style: {},
    clearOnBackground: true,
    onSelect: void 0
  };
  return {
    enable: patch.enable ?? base.enable,
    enableElements: patch.enableElements ?? base.enableElements,
    trigger: patch.trigger ?? base.trigger,
    immediately: patch.immediately ?? base.immediately,
    state: patch.state ?? base.state,
    style: patch.style ?? base.style,
    clearOnBackground: patch.clearOnBackground ?? base.clearOnBackground,
    onSelect: "onSelect" in patch ? patch.onSelect : base.onSelect
  };
}
var MIN_POINT_DISTANCE = 5;
var DRAG_THRESHOLD2 = 3;
function pointInPolygon(px, py, polygon2) {
  let inside = false;
  for (let i = 0, j = polygon2.length - 1; i < polygon2.length; j = i++) {
    const xi = polygon2[i].x;
    const yi = polygon2[i].y;
    const xj = polygon2[j].x;
    const yj = polygon2[j].y;
    const intersect = yi > py !== yj > py && px < (xj - xi) * (py - yi) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}
var LassoSelectBehaviour = class extends Behaviour {
  kind = "lasso-select";
  clickSelectId;
  opts;
  layer = null;
  ctxRef = null;
  overlay = null;
  dragActive = false;
  /** Polygon points in WORLD space. */
  worldPoints = [];
  lastScreen = null;
  startScreen = null;
  listenerDisposers = [];
  constructor(opts) {
    super({ ...opts, shortcuts: opts.shortcuts ?? ["shift+drag-lasso"] });
    this.clickSelectId = opts.clickSelectId ?? "click-select";
    this.opts = resolveOptions7(null, opts);
  }
  // ─── Lifecycle ──────────────────────────────────────────────────────────
  onRegister(ctx) {
    const layer = ctx.layers.get(this.targetLayerId);
    if (!layer) {
      throw new Error(
        `LassoSelectBehaviour "${this.id}": layer "${this.targetLayerId}" not found.`
      );
    }
    this.layer = layer;
    this.ctxRef = ctx;
    this.overlay = ctx.createOverlay(`${this.id}-overlay`, "world");
    const el = ctx.canvasElement;
    if (!el) return;
    const onDown = (e) => this.handlePointerDown(e);
    const onMove = (e) => this.handlePointerMove(e);
    const onUp = (e) => this.handlePointerUp(e);
    const onCancel = () => this.cancelDrag();
    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
    this.listenerDisposers.push(
      () => el.removeEventListener("pointerdown", onDown),
      () => window.removeEventListener("pointermove", onMove),
      () => window.removeEventListener("pointerup", onUp),
      () => window.removeEventListener("pointercancel", onCancel)
    );
  }
  onDestroy() {
    this.cancelDrag();
    for (const off of this.listenerDisposers) off();
    this.listenerDisposers.length = 0;
    this.overlay?.destroy();
    this.overlay = null;
    this.layer = null;
    this.ctxRef = null;
  }
  onDisable() {
    this.cancelDrag();
  }
  // ─── Public API ─────────────────────────────────────────────────────────
  get options() {
    return this.opts;
  }
  setOptions(patch) {
    this.recordOptions(patch);
    this.opts = resolveOptions7(this.opts, patch);
  }
  // ─── Pointer handlers ───────────────────────────────────────────────────
  screenFromEvent(e) {
    const el = this.ctxRef?.canvasElement;
    if (!el) return { x: e.clientX, y: e.clientY };
    const rect2 = el.getBoundingClientRect();
    return { x: e.clientX - rect2.left, y: e.clientY - rect2.top };
  }
  handlePointerDown(e) {
    this.clearPolygon();
    this.dragActive = false;
    this.worldPoints = [];
    this.lastScreen = null;
    this.startScreen = null;
    if (!this._enabled) return;
    if (e.button !== 0) return;
    if (e.target !== this.ctxRef?.canvasElement) return;
    const { enable } = this.opts;
    if (typeof enable === "function" ? !enable(e) : !enable) return;
    if (!this.triggerActive(e)) return;
    const screen = this.screenFromEvent(e);
    const world = this.ctxRef.camera.toWorld(screen.x, screen.y);
    if (this.layer?.getRenderer()?.hitTest(world.x, world.y)?.kind === "shape") {
      return;
    }
    if (!this.claimGesture()) return;
    this.dragActive = true;
    this.worldPoints = [{ x: world.x, y: world.y }];
    this.lastScreen = screen;
    this.startScreen = screen;
  }
  handlePointerMove(e) {
    if (!this.dragActive || !this.lastScreen) return;
    if (e.buttons === 0) {
      this.handlePointerUp(e);
      return;
    }
    const screen = this.screenFromEvent(e);
    const dx = screen.x - this.lastScreen.x;
    const dy = screen.y - this.lastScreen.y;
    if (Math.hypot(dx, dy) < MIN_POINT_DISTANCE) return;
    const world = this.ctxRef.camera.toWorld(screen.x, screen.y);
    this.worldPoints.push({ x: world.x, y: world.y });
    this.lastScreen = screen;
    this.drawPolygon();
    if (this.opts.immediately) this.applySelection();
  }
  handlePointerUp(_e) {
    if (!this.dragActive) {
      this.releaseGesture();
      return;
    }
    this.clearPolygon();
    const hasArea = this.gestureHasArea();
    if (hasArea) {
      const snapshot = this.applySelection();
      if (snapshot) this.opts.onSelect?.(snapshot);
    } else if (this.opts.clearOnBackground) {
      this.clearSelection();
    }
    this.releaseGesture();
    this.dragActive = false;
    this.worldPoints = [];
    this.lastScreen = null;
    this.startScreen = null;
  }
  cancelDrag() {
    if (!this.dragActive) return;
    this.clearPolygon();
    this.releaseGesture();
    this.dragActive = false;
    this.worldPoints = [];
    this.lastScreen = null;
    this.startScreen = null;
  }
  gestureHasArea() {
    if (this.worldPoints.length < 3) return false;
    if (!this.startScreen || !this.lastScreen) return false;
    const dx = this.lastScreen.x - this.startScreen.x;
    const dy = this.lastScreen.y - this.startScreen.y;
    return Math.hypot(dx, dy) > DRAG_THRESHOLD2;
  }
  // ─── Drawing ────────────────────────────────────────────────────────────
  drawPolygon() {
    const g = this.overlay;
    if (!g || this.worldPoints.length < 2) return;
    const style = this.opts.style;
    const zoom = this.ctxRef?.camera.scale ?? 1;
    const lineWidth = (style.strokeWidth ?? 1) / Math.max(zoom, 1e-6);
    const dash = style.strokeDash ?? [4, 4];
    g.clear().poly(this.worldPoints, true).fill({ color: style.fill ?? 1472511, alpha: style.fillAlpha ?? 0.1 }).poly(this.worldPoints, true).stroke({
      color: style.stroke ?? 1472511,
      alpha: style.strokeAlpha ?? 0.8,
      width: lineWidth,
      ...dash.length >= 2 ? { dashArray: [dash[0] / zoom, dash[1] / zoom] } : {}
    });
  }
  clearPolygon() {
    this.overlay?.clear();
  }
  // ─── Selection ──────────────────────────────────────────────────────────
  triggerActive(e) {
    const { trigger } = this.opts;
    if (trigger.length === 0) return true;
    const active = /* @__PURE__ */ new Set();
    if (e.shiftKey) active.add("shift");
    if (e.ctrlKey) active.add("control");
    if (e.altKey) active.add("alt");
    if (e.metaKey) active.add("meta");
    return trigger.some((k) => active.has(k.toLowerCase()));
  }
  applySelection() {
    const layer = this.layer;
    const ctx = this.ctxRef;
    if (!layer || !ctx || this.worldPoints.length < 3) return null;
    const polygon2 = this.worldPoints;
    const wantShapes = this.opts.enableElements.includes("shape");
    const wantConnectors = this.opts.enableElements.includes("connector");
    const enclosedShapes = /* @__PURE__ */ new Set();
    if (wantShapes) {
      for (const node of layer.store.nodes()) {
        if (!layer.store.isNodeVisible(node.id)) continue;
        const pos = node.position ?? { x: 0, y: 0 };
        if (pointInPolygon(pos.x, pos.y, polygon2)) enclosedShapes.add(node.id);
      }
    }
    const enclosedConnectors = /* @__PURE__ */ new Set();
    if (wantConnectors) {
      for (const edge of layer.store.edges()) {
        if (!layer.store.isEdgeVisible(edge.id)) continue;
        if (enclosedShapes.has(edge.source) && enclosedShapes.has(edge.target)) {
          enclosedConnectors.add(edge.id);
        }
      }
    }
    const clickSelect = ctx.behaviours.get(this.clickSelectId);
    if (clickSelect) {
      const merged = /* @__PURE__ */ new Map();
      for (const sid of clickSelect.getSelectedShapeIds()) merged.set(sid, "shape");
      for (const cid of clickSelect.getSelectedConnectorIds()) merged.set(cid, "connector");
      for (const sid of enclosedShapes) merged.set(sid, "shape");
      for (const cid of enclosedConnectors) merged.set(cid, "connector");
      const elements = [];
      for (const [id, type] of merged) elements.push({ id, type });
      clickSelect.selectMultiple(elements);
      return {
        shapeIds: clickSelect.getSelectedShapeIds(),
        connectorIds: clickSelect.getSelectedConnectorIds()
      };
    }
    const { state } = this.opts;
    for (const sid of enclosedShapes) layer.store.setNodeState(sid, state, true);
    for (const cid of enclosedConnectors) layer.store.setEdgeState(cid, state, true);
    return { shapeIds: [...enclosedShapes], connectorIds: [...enclosedConnectors] };
  }
  clearSelection() {
    const ctx = this.ctxRef;
    const layer = this.layer;
    if (!ctx || !layer) return;
    const clickSelect = ctx.behaviours.get(this.clickSelectId);
    if (clickSelect) {
      clickSelect.clearSelection();
      return;
    }
    layer.store.clearNodeState(this.opts.state);
    layer.store.clearEdgeState(this.opts.state);
  }
};
var DragNodeBehaviour = class extends Behaviour {
  kind = "drag-node";
  layer = null;
  ctxRef = null;
  // Tuning knobs live-read from `_options` (all consumed at event-time in the
  // drag handlers) so `setOptions` takes effect without a re-arm.
  get filter() {
    return this._options.filter;
  }
  get dragCursor() {
    return this._options.dragCursor ?? "grabbing";
  }
  get groupAware() {
    return this._options.groupAware ?? true;
  }
  get pinOnRelease() {
    return this._options.pinOnRelease ?? false;
  }
  get dragSelection() {
    return this._options.dragSelection ?? true;
  }
  get selectionState() {
    return this._options.selectionState ?? "selected";
  }
  get selectionBodyDrag() {
    return this._options.selectionBodyDrag ?? true;
  }
  get selectionBodyPadding() {
    return this._options.selectionBodyPadding ?? 0;
  }
  state = null;
  offShapeDown = null;
  offCanvasDown = null;
  canvasEl = null;
  prevCursor = null;
  /**
   * Pointer id captured on `pointerdown` so we can hold the capture on the
   * canvas element for the duration of the drag — otherwise the cursor
   * crossing the canvas bounds (e.g. over a lil-gui panel) fires
   * `pointercancel` on the document and the drag ends prematurely.
   */
  capturedPointerId = null;
  constructor(opts) {
    super({ ...opts, shortcuts: opts.shortcuts ?? ["node+drag"] });
  }
  // ─── Lifecycle ──────────────────────────────────────────────────────────
  onRegister(ctx) {
    const layer = ctx.layers.get(this.targetLayerId);
    if (!layer) {
      throw new Error(
        `DragNodeBehaviour "${this.id}": layer "${this.targetLayerId}" not found.`
      );
    }
    this.layer = layer;
    this.ctxRef = ctx;
    this.canvasEl = ctx.canvasElement ?? null;
    const renderer = layer.getRenderer();
    if (!renderer) {
      throw new Error(
        `DragNodeBehaviour "${this.id}": target layer is not mounted.`
      );
    }
    const onShapeDown = (e) => {
      if (!this._enabled) return;
      if (this.filter && !this.filter(e.id)) return;
      if (!layer.store.hasNode(e.id)) return;
      this.capturedPointerId = e.pointerId;
      this.startDrag(e.id, e.worldX, e.worldY);
    };
    renderer.events.on("shape:pointerdown", onShapeDown);
    this.offShapeDown = () => renderer.events.off("shape:pointerdown", onShapeDown);
    if (this.selectionBodyDrag && this.canvasEl) {
      const el = this.canvasEl;
      const onCanvasDown = (e) => this.onCanvasPointerDown(e);
      el.addEventListener("pointerdown", onCanvasDown);
      this.offCanvasDown = () => el.removeEventListener("pointerdown", onCanvasDown);
    }
  }
  onDestroy() {
    this.endDrag();
    this.offShapeDown?.();
    this.offShapeDown = null;
    this.offCanvasDown?.();
    this.offCanvasDown = null;
    this.layer = null;
    this.ctxRef = null;
    this.canvasEl = null;
  }
  onDisable() {
    if (this.state) this.endDrag();
  }
  // ─── Drag flow ──────────────────────────────────────────────────────────
  /**
   * Resolve the set of *primary* nodes a gesture on `grabbedId` should drag.
   * With `dragSelection` on, a grab on a selected node drags every selected
   * node (filtered by `filter`); otherwise — or for a selection of one — just
   * the grabbed node. Group descendants are added later, in the first move.
   */
  resolveDragSet(grabbedId) {
    const layer = this.layer;
    if (!layer || !this.dragSelection) return [grabbedId];
    if (!layer.store.hasNodeState(grabbedId, this.selectionState)) return [grabbedId];
    const selected = this.selectedNodeIds();
    return selected.length > 1 ? selected : [grabbedId];
  }
  /** Current selection (nodes carrying `selectionState`), filtered by `filter`. */
  selectedNodeIds() {
    const layer = this.layer;
    if (!layer) return [];
    const ids = [];
    for (const id of layer.store.nodesWithState(this.selectionState)) {
      if (this.filter && !this.filter(id)) continue;
      ids.push(id);
    }
    return ids;
  }
  /**
   * World-space union AABB of the given nodes, or `null` if none resolve. Each
   * node contributes its `boundsOfNode` rect (centre-relative, so offset by the
   * node's stored position); a node whose shape kind reports no bounds collapses
   * to a zero-size point at its centre.
   */
  selectionBounds(ids) {
    const layer = this.layer;
    if (!layer) return null;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const id of ids) {
      const node = layer.store.getNode(id);
      if (!node) continue;
      const pos = node.position ?? { x: 0, y: 0 };
      const local = layer.boundsOfNode(node);
      const x0 = pos.x + (local?.x ?? 0);
      const y0 = pos.y + (local?.y ?? 0);
      const x1 = x0 + (local?.width ?? 0);
      const y1 = y0 + (local?.height ?? 0);
      if (x0 < minX) minX = x0;
      if (y0 < minY) minY = y0;
      if (x1 > maxX) maxX = x1;
      if (y1 > maxY) maxY = y1;
    }
    if (minX === Infinity) return null;
    return { minX, minY, maxX, maxY };
  }
  /**
   * Selection-body drag entry point (see `selectionBodyDrag`). A plain press on
   * empty world space that falls inside the selection's union bounds grabs the
   * whole selection. Presses on a node, with a modifier held, or outside the
   * bounds are left alone so the per-node / brush / lasso / pan paths win.
   */
  onCanvasPointerDown(e) {
    if (!this._enabled || !this.dragSelection) return;
    if (e.button !== 0) return;
    if (e.shiftKey || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target !== this.canvasEl) return;
    if (this.state) return;
    const ctx = this.ctxRef;
    const layer = this.layer;
    if (!ctx || !layer) return;
    const { screenX, screenY } = this.clientToScreen(e.clientX, e.clientY);
    const world = ctx.camera.toWorld(screenX, screenY);
    if (layer.getRenderer()?.hitTest(world.x, world.y)?.kind === "shape") return;
    const ids = this.selectedNodeIds();
    if (ids.length === 0) return;
    const b = this.selectionBounds(ids);
    if (!b) return;
    const pad = this.selectionBodyPadding;
    if (world.x < b.minX - pad || world.x > b.maxX + pad || world.y < b.minY - pad || world.y > b.maxY + pad) {
      return;
    }
    this.capturedPointerId = e.pointerId;
    this.beginDrag(ids[0], ids, world.x, world.y);
  }
  startDrag(grabbedId, worldX, worldY) {
    if (!this.layer) return;
    this.beginDrag(grabbedId, this.resolveDragSet(grabbedId), worldX, worldY);
  }
  /**
   * Low-level drag start shared by the per-node path ({@link startDrag}) and the
   * selection-body path ({@link onCanvasPointerDown}). `primaryId` is the gesture's
   * emitted primary; `ids` is the full primary set to translate together.
   */
  beginDrag(primaryId, ids, worldX, worldY) {
    if (!this.layer) return;
    if (!this.claimGesture()) return;
    this.state = {
      primaryId,
      ids,
      pointerWorldStart: { x: worldX, y: worldY },
      moveIds: [],
      starts: /* @__PURE__ */ new Map(),
      moved: false
    };
    window.addEventListener("pointermove", this.onWindowPointerMove);
    window.addEventListener("pointerup", this.onWindowPointerUp);
    window.addEventListener("pointercancel", this.onWindowPointerUp);
    if (this.canvasEl) {
      this.prevCursor = this.canvasEl.style.cursor;
      this.canvasEl.style.cursor = this.dragCursor;
      if (this.capturedPointerId !== null) {
        try {
          this.canvasEl.setPointerCapture(this.capturedPointerId);
        } catch {
        }
      }
    }
  }
  endDrag() {
    if (!this.state) return;
    const { primaryId, ids, moved } = this.state;
    window.removeEventListener("pointermove", this.onWindowPointerMove);
    window.removeEventListener("pointerup", this.onWindowPointerUp);
    window.removeEventListener("pointercancel", this.onWindowPointerUp);
    if (this.prevCursor !== null && this.canvasEl) {
      this.canvasEl.style.cursor = this.prevCursor;
      this.prevCursor = null;
    }
    if (this.canvasEl && this.capturedPointerId !== null) {
      try {
        this.canvasEl.releasePointerCapture(this.capturedPointerId);
      } catch {
      }
    }
    this.capturedPointerId = null;
    this.releaseGesture();
    this.state = null;
    if (moved && this.layer) {
      const store = this.layer.store;
      const release = () => {
        if (this.pinOnRelease) {
          store.batch(() => {
            for (const id of ids) store.setPinned(id, true);
          });
        }
        this.layer.events.emit("node:drag-end", { nodeId: primaryId, nodeIds: ids });
      };
      const log = store.operationLog;
      if (log && !log.replaying) log.group({ title: "move" }, release);
      else release();
    }
  }
  onWindowPointerMove = (e) => {
    if (!this.state || !this.ctxRef || !this.layer) return;
    const layer = this.layer;
    const state = this.state;
    const { screenX, screenY } = this.clientToScreen(e.clientX, e.clientY);
    const world = this.ctxRef.camera.toWorld(screenX, screenY);
    if (!state.moved) {
      const moveIds = [];
      const seen = /* @__PURE__ */ new Set();
      const add = (id) => {
        if (seen.has(id)) return;
        const pos = layer.store.getNode(id)?.position;
        if (!pos) return;
        seen.add(id);
        moveIds.push(id);
        state.starts.set(id, { x: pos.x, y: pos.y });
      };
      for (const id of state.ids) {
        add(id);
        if (this.groupAware && layer.getGroupRole(id) === "expanded") {
          for (const descId of layer.store.descendantsOf(id)) add(descId);
        }
      }
      state.moveIds = moveIds;
      state.pointerWorldStart = { x: world.x, y: world.y };
      state.moved = true;
      layer.events.emit("node:drag-start", {
        nodeId: state.primaryId,
        nodeIds: state.ids
      });
    }
    const dx = world.x - state.pointerWorldStart.x;
    const dy = world.y - state.pointerWorldStart.y;
    const xy = new Float32Array(state.moveIds.length * 2);
    for (let i = 0; i < state.moveIds.length; i++) {
      const start = state.starts.get(state.moveIds[i]);
      xy[i * 2] = start.x + dx;
      xy[i * 2 + 1] = start.y + dy;
    }
    layer.store.batch(() => {
      layer.store.setPositionsBulk(state.moveIds, xy);
    });
  };
  onWindowPointerUp = () => {
    this.endDrag();
  };
  clientToScreen(clientX, clientY) {
    if (!this.canvasEl) return { screenX: clientX, screenY: clientY };
    const rect2 = this.canvasEl.getBoundingClientRect();
    return { screenX: clientX - rect2.left, screenY: clientY - rect2.top };
  }
};
function resolveOptions8(prev, patch) {
  const base = prev ?? {
    targets: ["node", "edge", "canvas"],
    state: null,
    onContextMenu: void 0
  };
  return {
    targets: patch.targets ?? base.targets,
    state: "state" in patch ? patch.state ?? null : base.state,
    onContextMenu: "onContextMenu" in patch ? patch.onContextMenu : base.onContextMenu
  };
}
var ContextMenuBehaviour = class extends Behaviour {
  kind = "context-menu";
  layer = null;
  opts;
  /** Subscription disposers. */
  subs = [];
  /** Element currently carrying `opts.state`, so we can clear it on the next open. */
  statedTarget = null;
  constructor(opts) {
    super({ ...opts, shortcuts: opts.shortcuts ?? ["pointer+rclick"] });
    this.opts = resolveOptions8(null, opts);
  }
  // ─── Lifecycle ──────────────────────────────────────────────────────────
  onRegister(ctx) {
    const layer = ctx.layers.get(this.targetLayerId);
    if (!layer) {
      throw new Error(
        `ContextMenuBehaviour "${this.id}": layer "${this.targetLayerId}" not found. Add the GraphLayer before registering this behaviour.`
      );
    }
    this.layer = layer;
    const renderer = layer.getRenderer();
    if (!renderer) {
      throw new Error(
        `ContextMenuBehaviour "${this.id}": target layer is not mounted. Add the GraphLayer to the canvas before registering this behaviour.`
      );
    }
    const onShape = (e) => {
      this.handle("node", e.id, e.worldX, e.worldY);
    };
    const onConn = (e) => {
      this.handle("edge", e.id, e.worldX, e.worldY);
    };
    const onBackground = (e) => {
      this.handle("canvas", null, e.worldX, e.worldY);
    };
    renderer.events.on("shape:contextmenu", onShape);
    renderer.events.on("connector:contextmenu", onConn);
    renderer.events.on("background:contextmenu", onBackground);
    this.subs.push(
      () => renderer.events.off("shape:contextmenu", onShape),
      () => renderer.events.off("connector:contextmenu", onConn),
      () => renderer.events.off("background:contextmenu", onBackground)
    );
  }
  onDestroy() {
    this.clearStatedTarget();
    for (const off of this.subs) off();
    this.subs.length = 0;
    this.layer = null;
  }
  onDisable() {
    this.clearStatedTarget();
  }
  // ─── Public API ─────────────────────────────────────────────────────────
  /** Resolved current options (read-only snapshot). */
  get options() {
    return this.opts;
  }
  /** Merge new options. Unspecified fields keep their current value. */
  setOptions(patch) {
    this.recordOptions(patch);
    this.opts = resolveOptions8(this.opts, patch);
  }
  // ─── Internals ────────────────────────────────────────────────────────────
  handle(targetType, id, worldX, worldY) {
    if (!this.isEnabled) return;
    if (!this.opts.targets.includes(targetType)) return;
    const layer = this.layer;
    const ctx = this.ctx;
    if (!layer || !ctx) return;
    let data;
    if (targetType === "node" && id !== null) {
      data = layer.store.getNode(id)?.data;
    } else if (targetType === "edge" && id !== null) {
      data = layer.store.getEdge(id)?.data;
    }
    this.applyStatedTarget(targetType, id);
    const screen = ctx.camera.toScreen(worldX, worldY);
    this.opts.onContextMenu?.({
      targetType,
      id,
      data,
      world: { x: worldX, y: worldY },
      screen: { x: screen.x, y: screen.y }
    });
  }
  /** Move the transient `opts.state` marker onto the freshly clicked target. */
  applyStatedTarget(targetType, id) {
    const state = this.opts.state;
    if (!state) return;
    this.clearStatedTarget();
    if (id === null || targetType === "canvas") return;
    if (targetType === "node") this.layer?.store.setNodeState(id, state, true);
    else this.layer?.store.setEdgeState(id, state, true);
    this.statedTarget = { type: targetType, id };
  }
  clearStatedTarget() {
    const state = this.opts.state;
    const target = this.statedTarget;
    if (!state || !target) {
      this.statedTarget = null;
      return;
    }
    if (target.type === "node") this.layer?.store.setNodeState(target.id, state, false);
    else this.layer?.store.setEdgeState(target.id, state, false);
    this.statedTarget = null;
  }
};
var createNodeSeq = 0;
var CreateNodeBehaviour = class extends Behaviour {
  kind = "create-node";
  layer = null;
  ctxRef = null;
  canvasEl = null;
  // Both live-read from `_options` (consumed at click-time) so `setOptions`
  // applies. `makeNode` falls back to the built-in id/position factory.
  get makeNode() {
    return this._options.createNode ?? ((world) => ({
      id: `n-${Date.now().toString(36)}-${(createNodeSeq++).toString(36)}`,
      // The built-in factory knows nothing about the domain, so the record it
      // makes has no meaningful kind. Supply `createNode` to give one.
      type: UNKNOWN_TYPE,
      position: { x: world.x, y: world.y }
    }));
  }
  get onNodeCreate() {
    return this._options.onNodeCreate;
  }
  /** Subscription disposers. */
  subs = [];
  /** True when the in-flight click already landed on a node/edge. */
  clickConsumedByElement = false;
  /** Pointerdown screen-position — used to distinguish a click from a drag/pan. */
  pointerDownScreen = null;
  constructor(opts) {
    super({ ...opts, shortcuts: opts.shortcuts ?? ["pointer+click"] });
  }
  // ─── Lifecycle ──────────────────────────────────────────────────────────
  onRegister(ctx) {
    const layer = ctx.layers.get(this.targetLayerId);
    if (!layer) {
      throw new Error(`CreateNodeBehaviour "${this.id}": layer "${this.targetLayerId}" not found.`);
    }
    this.layer = layer;
    this.ctxRef = ctx;
    this.canvasEl = ctx.canvasElement ?? null;
    const renderer = layer.getRenderer();
    if (!renderer) {
      throw new Error(`CreateNodeBehaviour "${this.id}": target layer is not mounted.`);
    }
    const consume = () => {
      this.clickConsumedByElement = true;
    };
    const DRAG_VS_CLICK_PX = 4;
    const onPointerDown = (e) => {
      this.pointerDownScreen = e.button === 0 ? { x: e.clientX, y: e.clientY } : null;
    };
    const onClick = (e) => {
      const down = this.pointerDownScreen;
      this.pointerDownScreen = null;
      if (this.clickConsumedByElement) {
        this.clickConsumedByElement = false;
        return;
      }
      if (!this.isEnabled || e.button !== 0 || !this.layer || !this.ctxRef) return;
      if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) > DRAG_VS_CLICK_PX) return;
      const { screenX, screenY } = this.clientToScreen(e.clientX, e.clientY);
      const world = this.ctxRef.camera.toWorld(screenX, screenY);
      const node = this.makeNode({ x: world.x, y: world.y });
      if (!node) return;
      this.layer.store.addNode(node);
      this.onNodeCreate?.(this.layer.store.getNode(node.id) ?? { ...node, type: node.type || UNKNOWN_TYPE });
    };
    renderer.events.on("shape:click", consume);
    renderer.events.on("connector:click", consume);
    const el = ctx.canvasElement;
    if (el) {
      el.addEventListener("pointerdown", onPointerDown);
      el.addEventListener("click", onClick);
    }
    this.subs.push(
      () => renderer.events.off("shape:click", consume),
      () => renderer.events.off("connector:click", consume),
      () => {
        if (el) {
          el.removeEventListener("pointerdown", onPointerDown);
          el.removeEventListener("click", onClick);
        }
      }
    );
  }
  onDestroy() {
    for (const off of this.subs) off();
    this.subs.length = 0;
    this.layer = null;
    this.ctxRef = null;
    this.canvasEl = null;
  }
  clientToScreen(clientX, clientY) {
    if (!this.canvasEl) return { screenX: clientX, screenY: clientY };
    const rect2 = this.canvasEl.getBoundingClientRect();
    return { screenX: clientX - rect2.left, screenY: clientY - rect2.top };
  }
};
var DRAFT_ID = "__draw_edge__";
var DRAFT_EXCLUDE = /* @__PURE__ */ new Set([DRAFT_ID]);
var drawEdgeSeq = 0;
var DrawEdgeBehaviour = class extends Behaviour {
  kind = "draw-edge";
  layer = null;
  ctxRef = null;
  canvasEl = null;
  // All live-read from `_options` (consumed at draw-time) so `setOptions`
  // applies. `makeEdge` falls back to the built-in id / self-loop factory.
  get allowSelfLoop() {
    return this._options.allowSelfLoop ?? false;
  }
  get onEdgeCreate() {
    return this._options.onEdgeCreate;
  }
  get makeEdge() {
    return this._options.createEdge ?? ((source, target) => {
      const id = `e-${Date.now().toString(36)}-${(drawEdgeSeq++).toString(36)}`;
      const type = UNKNOWN_TYPE;
      if (source === target) {
        return {
          id,
          type,
          source,
          target,
          style: {
            shape: { pathType: "loop-curve", sourceAnchor: "center", targetAnchor: "center" }
          }
        };
      }
      return { id, type, source, target };
    });
  }
  get draft() {
    const s = this._options.draftStyle;
    return {
      color: s?.color ?? 6333946,
      width: s?.width ?? 2,
      alpha: s?.alpha ?? 0.9,
      dash: s?.dash ?? [6, 4]
    };
  }
  offShapeDown = null;
  sourceId = null;
  candidateTarget = null;
  capturedPointerId = null;
  constructor(opts) {
    super({ ...opts, shortcuts: opts.shortcuts ?? ["shape+drag"] });
  }
  // ─── Lifecycle ──────────────────────────────────────────────────────────
  onRegister(ctx) {
    const layer = ctx.layers.get(this.targetLayerId);
    if (!layer) {
      throw new Error(`DrawEdgeBehaviour "${this.id}": layer "${this.targetLayerId}" not found.`);
    }
    this.layer = layer;
    this.ctxRef = ctx;
    this.canvasEl = ctx.canvasElement ?? null;
    const renderer = layer.getRenderer();
    if (!renderer) {
      throw new Error(`DrawEdgeBehaviour "${this.id}": target layer is not mounted.`);
    }
    const onShapeDown = (e) => {
      if (!this.isEnabled || e.button !== 0) return;
      this.capturedPointerId = e.pointerId;
      this.startDraw(e.id, e.worldX, e.worldY);
    };
    renderer.events.on("shape:pointerdown", onShapeDown);
    this.offShapeDown = () => renderer.events.off("shape:pointerdown", onShapeDown);
  }
  onDestroy() {
    this.endDraw(false);
    this.offShapeDown?.();
    this.offShapeDown = null;
    this.layer = null;
    this.ctxRef = null;
    this.canvasEl = null;
  }
  onDisable() {
    if (this.sourceId !== null) this.endDraw(false);
  }
  // ─── Draw flow ────────────────────────────────────────────────────────────
  startDraw(sourceId, worldX, worldY) {
    const renderer = this.layer?.getRenderer();
    if (!renderer) return;
    if (!this.claimGesture()) return;
    this.sourceId = sourceId;
    this.candidateTarget = null;
    const spec = {
      kind: "connector",
      source: { kind: "shape", shapeId: sourceId },
      target: { kind: "point", x: worldX, y: worldY },
      router: "straight",
      stroke: {
        color: this.draft.color,
        width: this.draft.width,
        alpha: this.draft.alpha,
        dashArray: this.draft.dash
      },
      zIndex: 1e4
    };
    renderer.addConnector(DRAFT_ID, spec);
    window.addEventListener("pointermove", this.onWindowPointerMove);
    window.addEventListener("pointerup", this.onWindowPointerUp);
    window.addEventListener("pointercancel", this.onWindowPointerUp);
    if (this.canvasEl && this.capturedPointerId !== null) {
      try {
        this.canvasEl.setPointerCapture(this.capturedPointerId);
      } catch {
      }
    }
  }
  endDraw(finalize) {
    if (this.sourceId === null) return;
    const source = this.sourceId;
    const target = this.candidateTarget;
    this.sourceId = null;
    this.candidateTarget = null;
    window.removeEventListener("pointermove", this.onWindowPointerMove);
    window.removeEventListener("pointerup", this.onWindowPointerUp);
    window.removeEventListener("pointercancel", this.onWindowPointerUp);
    const renderer = this.layer?.getRenderer();
    if (renderer?.hasConnector(DRAFT_ID)) renderer.removeConnector(DRAFT_ID);
    if (this.canvasEl && this.capturedPointerId !== null) {
      try {
        this.canvasEl.releasePointerCapture(this.capturedPointerId);
      } catch {
      }
    }
    this.capturedPointerId = null;
    this.releaseGesture();
    if (finalize && target !== null && this.layer) {
      const edge = this.makeEdge(source, target);
      if (edge) {
        this.layer.store.addEdge(edge);
        this.onEdgeCreate?.(
          this.layer.store.getEdge(edge.id) ?? { ...edge, type: edge.type || UNKNOWN_TYPE }
        );
      }
    }
  }
  onWindowPointerMove = (e) => {
    if (this.sourceId === null || !this.ctxRef || !this.layer) return;
    const renderer = this.layer.getRenderer();
    if (!renderer) return;
    const { screenX, screenY } = this.clientToScreen(e.clientX, e.clientY);
    const world = this.ctxRef.camera.toWorld(screenX, screenY);
    renderer.updateConnector(DRAFT_ID, { target: { kind: "point", x: world.x, y: world.y } });
    const hit = renderer.hitTest(world.x, world.y, DRAFT_EXCLUDE);
    const onNode = hit !== null && hit.kind === "shape";
    this.candidateTarget = onNode && (this.allowSelfLoop || hit.id !== this.sourceId) ? hit.id : null;
  };
  onWindowPointerUp = () => {
    this.endDraw(true);
  };
  clientToScreen(clientX, clientY) {
    if (!this.canvasEl) return { screenX: clientX, screenY: clientY };
    const rect2 = this.canvasEl.getBoundingClientRect();
    return { screenX: clientX - rect2.left, screenY: clientY - rect2.top };
  }
};
var EraseBehaviour = class extends Behaviour {
  kind = "erase";
  layer = null;
  // Both live-read from `_options` (consulted at click-time) so `setOptions` applies.
  get target() {
    return this._options.target ?? "both";
  }
  get onErase() {
    return this._options.onErase;
  }
  /** Subscription disposers. */
  subs = [];
  constructor(opts) {
    super({ ...opts, shortcuts: opts.shortcuts ?? ["pointer+click"] });
  }
  // ─── Lifecycle ──────────────────────────────────────────────────────────
  onRegister(ctx) {
    const layer = ctx.layers.get(this.targetLayerId);
    if (!layer) {
      throw new Error(`EraseBehaviour "${this.id}": layer "${this.targetLayerId}" not found.`);
    }
    this.layer = layer;
    const renderer = layer.getRenderer();
    if (!renderer) {
      throw new Error(`EraseBehaviour "${this.id}": target layer is not mounted.`);
    }
    const onShapeClick = (e) => {
      if (!this.isEnabled || e.button !== 0) return;
      if (this.target === "edge") return;
      this.eraseNode(e.id);
    };
    const onConnClick = (e) => {
      if (!this.isEnabled || e.button !== 0) return;
      if (this.target === "node") return;
      this.eraseEdge(e.id);
    };
    renderer.events.on("shape:click", onShapeClick);
    renderer.events.on("connector:click", onConnClick);
    this.subs.push(
      () => renderer.events.off("shape:click", onShapeClick),
      () => renderer.events.off("connector:click", onConnClick)
    );
  }
  onDestroy() {
    for (const off of this.subs) off();
    this.subs.length = 0;
    this.layer = null;
  }
  // ─── Removal ──────────────────────────────────────────────────────────────
  /** Capture node + incident edges, cascade-remove, then report. */
  eraseNode(id) {
    const store = this.layer?.store;
    if (!store) return;
    const node = store.getNode(id);
    if (!node) return;
    const edges = this.incidentEdges(id);
    store.removeNode(id, { cascade: true });
    this.onErase?.({ kind: "node", node, edges });
  }
  /** Capture the edge, remove it, then report. */
  eraseEdge(id) {
    const store = this.layer?.store;
    if (!store) return;
    const edge = store.getEdge(id);
    if (!edge) return;
    store.removeEdge(id);
    this.onErase?.({ kind: "edge", edge });
  }
  /** Cloned incident edges (both directions), deduped — self-loops appear once. */
  incidentEdges(nodeId) {
    const store = this.layer.store;
    const seen = /* @__PURE__ */ new Set();
    const out = [];
    for (const edge of store.edgesOf(nodeId, "both")) {
      if (seen.has(edge.id)) continue;
      seen.add(edge.id);
      out.push(edge);
    }
    return out;
  }
};
function asToggleDecoration(deco) {
  if (deco && typeof deco.getLocalHitGeometry === "function") {
    return deco;
  }
  return null;
}
var GROUP_TOGGLE_SLOT = "group-toggle";
var COLLAPSED_COUNT_BADGE_ID = "collapsed-count";
var BADGE_REACH = 16;
var DEFAULT_CENTER_DURATION_MS = 300;
var { categorical: _fallbackCategorical2, ...FALLBACK_PALETTE2 } = DEFAULT_THEME.light;
var CollapseExpandBehaviour = class extends Behaviour {
  kind = "collapse-expand";
  layer = null;
  ctxRef = null;
  canvasEl = null;
  /** Unsubscribers for the layer / canvas events the count badge follows. */
  subs = [];
  /** Active theme roles for the count badge, over {@link FALLBACK_PALETTE}. */
  palette = FALLBACK_PALETTE2;
  constructor(opts) {
    super({ ...opts, shortcuts: opts.shortcuts ?? ["pointer+click"] });
  }
  onRegister(ctx) {
    const layer = ctx.layers.get(this.targetLayerId);
    if (!layer) {
      throw new Error(
        `CollapseExpandBehaviour "${this.id}": layer "${this.targetLayerId}" not found. Add the GraphLayer before registering this behaviour.`
      );
    }
    if (!layer.getRenderer()) {
      throw new Error(
        `CollapseExpandBehaviour "${this.id}": target layer is not mounted. Add the GraphLayer to the canvas before registering this behaviour.`
      );
    }
    this.layer = layer;
    this.ctxRef = ctx;
    this.canvasEl = ctx.canvasElement ?? null;
    if (!this.canvasEl) {
      throw new Error(
        `CollapseExpandBehaviour "${this.id}": canvas element is not available on the context.`
      );
    }
    this.canvasEl.addEventListener("pointerdown", this.onPointerDown, true);
    this.canvasEl.addEventListener("dblclick", this.onDoubleClick, true);
    this.palette = { ...FALLBACK_PALETTE2, ...ctx.theme.current()?.palette };
    this.subs.push(
      layer.events.on("data:changed", () => this.syncCountBadges()),
      ctx.events.on("theme:change", (theme) => {
        this.palette = { ...FALLBACK_PALETTE2, ...theme.palette };
        this.syncCountBadges();
      })
    );
  }
  onEnable() {
    this.syncCountBadges();
  }
  onDisable() {
    this.syncCountBadges();
  }
  onOptionsChanged() {
    this.syncCountBadges();
  }
  onDestroy() {
    this.syncCountBadges();
    for (const off of this.subs) off();
    this.subs = [];
    if (this.canvasEl) {
      this.canvasEl.removeEventListener("pointerdown", this.onPointerDown, true);
      this.canvasEl.removeEventListener("dblclick", this.onDoubleClick, true);
    }
    this.layer = null;
    this.ctxRef = null;
    this.canvasEl = null;
  }
  onPointerDown = (e) => {
    if (!this.isEnabled) return;
    if (e.button !== 0) return;
    const hit = this.findToggleHit(e);
    if (!hit) return;
    e.stopPropagation();
    this.toggleCollapsed(hit.nodeId);
  };
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
  onDoubleClick = (e) => {
    if (!this.isEnabled) return;
    if (this._options.doubleClickToToggle === false) return;
    if (e.button !== 0) return;
    const nodeId = this.groupUnder(e);
    if (!nodeId) return;
    e.stopPropagation();
    e.preventDefault();
    this.toggleCollapsed(nodeId);
  };
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
  groupUnder(e) {
    const layer = this.layer;
    const ctx = this.ctxRef;
    const canvasEl = this.canvasEl;
    if (!layer || !ctx || !canvasEl) return null;
    const renderer = layer.getRenderer();
    if (!renderer) return null;
    const rect2 = canvasEl.getBoundingClientRect();
    const world = ctx.camera.toWorld(e.clientX - rect2.left, e.clientY - rect2.top);
    const exclude = /* @__PURE__ */ new Set();
    let hit = renderer.hitTest(world.x, world.y);
    while (hit && hit.kind === "shape" && !layer.store.getNode(hit.id) && exclude.size < 8) {
      exclude.add(hit.id);
      hit = renderer.hitTest(world.x, world.y, exclude);
    }
    if (exclude.size > 0 && (!hit || hit.kind !== "shape")) return this.groupNear(world.x, world.y);
    if (!hit || hit.kind !== "shape") return null;
    const role = layer.getGroupRole(hit.id);
    return role === "expanded" || role === "collapsed" ? hit.id : null;
  }
  /**
   * The smallest group frame whose on-screen box, grown by
   * {@link BADGE_REACH}, contains `(x, y)` — how a double-click on the part of
   * a badge hanging outside its frame finds that frame. `null` when none does.
   */
  groupNear(x, y) {
    const layer = this.layer;
    const renderer = layer?.getRenderer();
    if (!layer || !renderer) return null;
    let best = null;
    let bestArea = Infinity;
    for (const node of layer.store.nodes()) {
      if (!layer.isGroupNode(node) || !layer.store.isNodeVisible(node.id)) continue;
      const b = renderer.getShapeWorldBounds(node.id);
      if (!b) continue;
      const inside = x >= b.x - BADGE_REACH && x <= b.x + b.width + BADGE_REACH && y >= b.y - BADGE_REACH && y <= b.y + b.height + BADGE_REACH;
      const area = b.width * b.height;
      if (inside && area < bestArea) {
        best = node.id;
        bestArea = area;
      }
    }
    return best;
  }
  /**
   * Convert a `PointerEvent` into world coordinates and walk every group
   * node in the layer. Return the first group whose mounted toggle
   * decoration's hit area contains the click, or `null` if none match.
   */
  findToggleHit(e) {
    const layer = this.layer;
    const ctx = this.ctxRef;
    const canvasEl = this.canvasEl;
    if (!layer || !ctx || !canvasEl) return null;
    const renderer = layer.getRenderer();
    if (!renderer) return null;
    const rect2 = canvasEl.getBoundingClientRect();
    const world = ctx.camera.toWorld(e.clientX - rect2.left, e.clientY - rect2.top);
    for (const node of layer.store.nodes()) {
      const style = layer.resolveNodeStyle(node);
      if (!style.group) continue;
      const toggle = asToggleDecoration(renderer.getDecoration(node.id, GROUP_TOGGLE_SLOT));
      if (!toggle) continue;
      const hg = toggle.getLocalHitGeometry();
      if (hg.radius <= 0) continue;
      const pos = renderer.getShapePosition(node.id);
      if (!pos) continue;
      const dx = world.x - (pos.x + hg.cx);
      const dy = world.y - (pos.y + hg.cy);
      if (dx * dx + dy * dy <= hg.radius * hg.radius) {
        return { nodeId: node.id };
      }
    }
    return null;
  }
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
  toggleCollapsed(nodeId) {
    const layer = this.layer;
    if (!layer) return;
    const node = layer.store.getNode(nodeId);
    if (!node) return;
    const open = layer.isCollapsedGroup(node);
    this.afterReproject(nodeId);
    layer.store.setNodeState(nodeId, COLLAPSED_STATE, !open, { actor: this.id });
    if (open && node.states?.includes(COLLAPSED_STATE)) {
      layer.store.updateNode(nodeId, {
        states: node.states.filter((s) => s !== COLLAPSED_STATE)
      });
    }
  }
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
  afterReproject(nodeId) {
    const layer = this.layer;
    const ctx = this.ctxRef;
    if (!layer || !ctx) return;
    const relayout = this._options.relayoutOnToggle === true;
    const center = this._options.centerOnToggle === true;
    if (!relayout && !center) return;
    const off = layer.events.on("data:changed", () => {
      off();
      if (!relayout) {
        this.centerOn(nodeId);
        return;
      }
      const run = ctx.runActiveLayout?.({ anchorNodeId: nodeId, preserveCamera: true }) ?? Promise.resolve();
      run.then(
        () => {
          if (center) this.centerOn(nodeId);
        },
        (err) => console.warn(`CollapseExpandBehaviour "${this.id}": re-layout failed`, err)
      );
    });
  }
  /**
   * Glide the camera to centre `nodeId`'s frame.
   *
   * Bounds rather than `node.position`: an auto-fit frame's stored position is
   * its top-left, and a collapsed one keeps the position of the frame it used
   * to be — neither is the centre of what's on screen.
   */
  centerOn(nodeId) {
    const bounds = this.layer?.getRenderer()?.getShapeWorldBounds(nodeId);
    if (!bounds || !this.ctxRef) return;
    this.ctxRef.camera.centerOn(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2, {
      durationMs: this._options.centerDurationMs ?? DEFAULT_CENTER_DURATION_MS,
      easing: "easeOutCubic"
    });
  }
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
  syncCountBadges() {
    const layer = this.layer;
    if (!layer) return;
    const on = this.isEnabled && this._options.countBadge === true;
    layer.store.batch(() => {
      for (const node of layer.store.nodes()) {
        if (!layer.isGroupNode(node) && !hasCountBadge(node)) continue;
        const badge = on && layer.isCollapsedGroup(node) ? this.countBadgeFor(node.id) : void 0;
        this.writeCountBadge(node, badge);
      }
    });
  }
  /**
   * The count pill for frame `id`: a rounded rect sized to the digits, centred
   * on {@link CollapseExpandBehaviourOptions.countBadgePlacement}, in theme
   * colours.
   */
  countBadgeFor(id) {
    let count = 0;
    for (const _ of this.layer.store.descendantsOf(id)) count++;
    const text = String(count);
    const fontSize = 11;
    const height = 18;
    const width = Math.max(height, Math.round(text.length * fontSize * 0.62) + 12);
    return {
      id: COLLAPSED_COUNT_BADGE_ID,
      placement: this._options.countBadgePlacement ?? "top-right",
      origin: "center",
      shape: { kind: "rect", width, height, cornerRadius: height / 2 },
      fill: this.palette.accent,
      strokeColor: this.palette.cardBg,
      strokeWidth: 1.5,
      labelText: text,
      labelColor: this.palette.surface,
      labelFontSize: fontSize
    };
  }
  /**
   * Put `badge` in `node.style.badges` under {@link COLLAPSED_COUNT_BADGE_ID}
   * (or remove that entry when `badge` is `undefined`), leaving the node's
   * other badges alone. Skips the write when nothing would change.
   */
  writeCountBadge(node, badge) {
    const style = node.style ?? {};
    const current = style.badges?.find((b) => b.id === COLLAPSED_COUNT_BADGE_ID);
    if (JSON.stringify(current) === JSON.stringify(badge)) return;
    const others = (style.badges ?? []).filter((b) => b.id !== COLLAPSED_COUNT_BADGE_ID);
    const badges = badge ? [...others, badge] : others;
    const { badges: _prev, ...rest } = style;
    const next = badges.length > 0 ? { ...rest, badges } : rest;
    this.layer.store.internal.updateNode(node.id, { style: next });
  }
};
function hasCountBadge(node) {
  return (node.style ?? {}).badges?.some((b) => b.id === COLLAPSED_COUNT_BADGE_ID) === true;
}
function asSelectionFrame(deco) {
  if (deco && typeof deco.getLocalHandleHits === "function") {
    return deco;
  }
  return null;
}
var FRAME_SLOT = "resize-frame";
var RECT_HANDLES = [
  "top-left",
  "top",
  "top-right",
  "right",
  "bottom-right",
  "bottom",
  "bottom-left",
  "left"
];
var CIRCLE_HANDLES = ["right"];
function resolveOptions9(patch) {
  return {
    handleRadius: patch.handleRadius ?? 5,
    handleFill: patch.handleFill ?? 16777215,
    frameColor: patch.frameColor ?? 7045119,
    dashArray: patch.dashArray ?? [5, 4],
    framePadding: patch.framePadding ?? 4,
    minSize: patch.minSize ?? 20
  };
}
var NodeResizeBehaviour = class extends Behaviour {
  kind = "node-resize";
  layer = null;
  ctxRef = null;
  canvasEl = null;
  prevCursor = null;
  state = null;
  subs = [];
  opts;
  /** Node ids that currently have a selection-frame decoration mounted. */
  mountedNodes = /* @__PURE__ */ new Set();
  constructor(opts) {
    super({ ...opts, shortcuts: opts.shortcuts ?? ["handle+drag"] });
    this.opts = resolveOptions9(opts);
  }
  onRegister(ctx) {
    const layer = ctx.layers.get(this.targetLayerId);
    if (!layer) {
      throw new Error(
        `NodeResizeBehaviour "${this.id}": layer "${this.targetLayerId}" not found.`
      );
    }
    if (!layer.getRenderer()) {
      throw new Error(
        `NodeResizeBehaviour "${this.id}": target layer is not mounted.`
      );
    }
    this.layer = layer;
    this.ctxRef = ctx;
    this.canvasEl = ctx.canvasElement ?? null;
    if (!this.canvasEl) {
      throw new Error(
        `NodeResizeBehaviour "${this.id}": canvas element is not available on the context.`
      );
    }
    if (this._enabled) this.refreshAllFrames();
    const offChanged = layer.events.on("data:changed", () => {
      if (this._enabled) this.refreshAllFrames();
    });
    this.subs.push(offChanged);
    this.canvasEl.addEventListener("pointerdown", this.onCanvasPointerDown, true);
  }
  onDestroy() {
    this.endDrag();
    this.clearAllFrames();
    for (const off of this.subs) off();
    this.subs.length = 0;
    if (this.canvasEl) {
      this.canvasEl.removeEventListener("pointerdown", this.onCanvasPointerDown, true);
    }
    this.layer = null;
    this.ctxRef = null;
    this.canvasEl = null;
  }
  onEnable() {
    this.refreshAllFrames();
  }
  onDisable() {
    if (this.state) this.endDrag();
    this.clearAllFrames();
  }
  // ─── Eligibility ────────────────────────────────────────────────────────
  /**
   * Returns the write-target a drag on this node would use, or `null` when
   * the node isn't resizable. A group with `userResizable: true` always
   * writes to `style.group.*`; a non-group with `style.resizable: true`
   * writes to `style.shape.*`.
   */
  resizeTarget(node) {
    if (!this.layer) return null;
    const style = this.layer.resolveNodeStyle(node);
    const group = style.group;
    if (group?.userResizable && !this.layer.isCollapsedGroup(node)) return "group";
    if (style.resizable) {
      const kind = style.shape?.kind;
      if (kind === "rect" || kind === "circle") return "shape";
    }
    return null;
  }
  // ─── Frame mount / unmount ──────────────────────────────────────────────
  refreshAllFrames() {
    if (!this.layer) return;
    const visited = /* @__PURE__ */ new Set();
    for (const node of this.layer.store.nodes()) {
      const target = this.resizeTarget(node);
      if (!target) {
        if (this.mountedNodes.has(node.id)) this.clearFrameFor(node.id);
        continue;
      }
      const style = this.layer.resolveNodeStyle(node);
      const kind = style.shape?.kind;
      if (kind !== "rect" && kind !== "circle") {
        if (this.mountedNodes.has(node.id)) this.clearFrameFor(node.id);
        continue;
      }
      this.mountFrameFor(node.id, kind);
      visited.add(node.id);
    }
    for (const id of [...this.mountedNodes]) {
      if (!visited.has(id)) this.clearFrameFor(id);
    }
  }
  mountFrameFor(nodeId, kind) {
    if (!this.layer) return;
    const renderer = this.layer.getRenderer();
    if (!renderer) return;
    const handles = kind === "rect" ? RECT_HANDLES : CIRCLE_HANDLES;
    renderer.setDecoration(nodeId, FRAME_SLOT, {
      kind: "selection-frame",
      style: {
        borderColor: this.opts.frameColor,
        dashArray: this.opts.dashArray,
        padding: this.opts.framePadding,
        handleRadius: this.opts.handleRadius,
        handleFill: this.opts.handleFill,
        handleStrokeColor: this.opts.frameColor,
        handles
      }
    });
    this.mountedNodes.add(nodeId);
  }
  clearFrameFor(nodeId) {
    if (!this.layer) return;
    const renderer = this.layer.getRenderer();
    if (!renderer) return;
    try {
      renderer.setDecoration(nodeId, FRAME_SLOT, null);
    } catch {
    }
    this.mountedNodes.delete(nodeId);
  }
  clearAllFrames() {
    for (const id of [...this.mountedNodes]) this.clearFrameFor(id);
  }
  // ─── Drag flow ──────────────────────────────────────────────────────────
  onCanvasPointerDown = (e) => {
    if (!this._enabled) return;
    if (e.button !== 0) return;
    if (this.state) return;
    const hit = this.findHandleHit(e);
    if (!hit) return;
    e.stopPropagation();
    this.startDrag(hit.nodeId, hit.placement);
  };
  findHandleHit(e) {
    const layer = this.layer;
    const ctx = this.ctxRef;
    const canvasEl = this.canvasEl;
    if (!layer || !ctx || !canvasEl) return null;
    const renderer = layer.getRenderer();
    if (!renderer) return null;
    const rect2 = canvasEl.getBoundingClientRect();
    const world = ctx.camera.toWorld(e.clientX - rect2.left, e.clientY - rect2.top);
    for (const nodeId of this.mountedNodes) {
      const frame = asSelectionFrame(renderer.getDecoration(nodeId, FRAME_SLOT));
      if (!frame) continue;
      const pos = renderer.getShapePosition(nodeId);
      if (!pos) continue;
      for (const h of frame.getLocalHandleHits()) {
        if (h.radius <= 0) continue;
        const dx = world.x - (pos.x + h.cx);
        const dy = world.y - (pos.y + h.cy);
        if (dx * dx + dy * dy <= h.radius * h.radius) {
          return { nodeId, placement: h.placement };
        }
      }
    }
    return null;
  }
  startDrag(nodeId, placement) {
    if (!this.layer) return;
    const node = this.layer.store.getNode(nodeId);
    if (!node) return;
    const target = this.resizeTarget(node);
    if (!target) return;
    const style = this.layer.resolveNodeStyle(node);
    const shape = style.shape;
    if (shape?.kind !== "rect" && shape?.kind !== "circle") return;
    const renderer = this.layer.getRenderer();
    if (!renderer) return;
    const worldBounds = renderer.getShapeWorldBounds(nodeId);
    if (!worldBounds) return;
    if (!this.claimGesture()) return;
    this.state = {
      id: nodeId,
      placement,
      shapeKind: shape.kind,
      target,
      startGroup: target === "group" ? { ...style.group } : void 0,
      startStyle: node.style ?? {},
      startPosition: node.position ? { ...node.position } : void 0,
      resized: false,
      startBounds: {
        left: worldBounds.x,
        top: worldBounds.y,
        right: worldBounds.x + worldBounds.width,
        bottom: worldBounds.y + worldBounds.height
      },
      startCentre: {
        x: worldBounds.x + worldBounds.width / 2,
        y: worldBounds.y + worldBounds.height / 2
      }
    };
    window.addEventListener("pointermove", this.onWindowPointerMove);
    window.addEventListener("pointerup", this.onWindowPointerUp);
    window.addEventListener("pointercancel", this.onWindowPointerUp);
    if (this.canvasEl) {
      this.prevCursor = this.canvasEl.style.cursor;
      this.canvasEl.style.cursor = cursorFor(placement);
    }
  }
  endDrag() {
    if (!this.state) return;
    this.journalResize(this.state);
    window.removeEventListener("pointermove", this.onWindowPointerMove);
    window.removeEventListener("pointerup", this.onWindowPointerUp);
    window.removeEventListener("pointercancel", this.onWindowPointerUp);
    if (this.prevCursor !== null && this.canvasEl) {
      this.canvasEl.style.cursor = this.prevCursor;
      this.prevCursor = null;
    }
    this.releaseGesture();
    this.state = null;
  }
  onWindowPointerMove = (e) => {
    if (!this.state || !this.ctxRef || !this.layer) return;
    const rect2 = this.canvasEl?.getBoundingClientRect();
    const screenX = rect2 ? e.clientX - rect2.left : e.clientX;
    const screenY = rect2 ? e.clientY - rect2.top : e.clientY;
    const world = this.ctxRef.camera.toWorld(screenX, screenY);
    const st = this.state;
    if (st.shapeKind === "circle") {
      const dx = world.x - st.startCentre.x;
      const dy = world.y - st.startCentre.y;
      const r = Math.max(this.opts.minSize, Math.hypot(dx, dy));
      this.commit(st, { radius: r });
      return;
    }
    let left = st.startBounds.left;
    let top = st.startBounds.top;
    let right = st.startBounds.right;
    let bottom = st.startBounds.bottom;
    const min = this.opts.minSize;
    if (st.placement === "top-left" || st.placement === "left" || st.placement === "bottom-left") {
      left = Math.min(world.x, right - min);
    }
    if (st.placement === "top-right" || st.placement === "right" || st.placement === "bottom-right") {
      right = Math.max(world.x, left + min);
    }
    if (st.placement === "top" || st.placement === "top-left" || st.placement === "top-right") {
      top = Math.min(world.y, bottom - min);
    }
    if (st.placement === "bottom" || st.placement === "bottom-left" || st.placement === "bottom-right") {
      bottom = Math.max(world.y, top + min);
    }
    const width = right - left;
    const height = bottom - top;
    this.commit(st, { width, height, posX: left, posY: top });
  };
  onWindowPointerUp = () => {
    this.endDrag();
  };
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
  commit(st, next) {
    if (!this.layer) return;
    let nextStyle;
    let mayWritePos = false;
    if (st.target === "group") {
      const priorGroup = st.startGroup ?? {};
      nextStyle = {
        ...st.startStyle,
        group: {
          ...priorGroup,
          ...next.width !== void 0 ? { width: next.width } : {},
          ...next.height !== void 0 ? { height: next.height } : {},
          ...next.radius !== void 0 ? { radius: next.radius } : {}
        }
      };
      mayWritePos = !priorGroup.autoFit && st.shapeKind === "rect";
    } else {
      const priorShape = st.startStyle.shape ?? { kind: st.shapeKind };
      const shapePatch = { ...priorShape };
      if (next.width !== void 0) shapePatch.width = next.width;
      if (next.height !== void 0) shapePatch.height = next.height;
      if (next.radius !== void 0) shapePatch.radius = next.radius;
      nextStyle = {
        ...st.startStyle,
        shape: shapePatch
      };
      mayWritePos = st.shapeKind === "rect";
    }
    const patch = { style: nextStyle };
    if (mayWritePos && next.posX !== void 0 && next.posY !== void 0) {
      patch.position = { x: next.posX, y: next.posY };
    }
    this.layer.store.internal.updateNode(st.id, patch);
    st.resized = true;
  }
  /** Record the whole gesture as one undoable `'resize'` entry, start → final. */
  journalResize(st) {
    const store = this.layer?.store;
    const node = st.resized ? store?.getNode(st.id) : void 0;
    if (!store || !node) return;
    const before = { style: st.startStyle };
    const after = { style: node.style };
    if (st.startPosition && node.position) {
      before.position = st.startPosition;
      after.position = { ...node.position };
    }
    store.recordApplied([{ kind: "updateNode", id: st.id, before, after }], { title: "resize" });
  }
};
function cursorFor(placement) {
  switch (placement) {
    case "top":
    case "bottom":
      return "ns-resize";
    case "left":
    case "right":
      return "ew-resize";
    case "top-left":
    case "bottom-right":
      return "nwse-resize";
    case "top-right":
    case "bottom-left":
      return "nesw-resize";
  }
}
var VIEWPORT_PAD = 0.2;
var COLLISION_THROTTLE_MS = 90;
var toBBox = (b) => ({
  minX: b.x,
  minY: b.y,
  maxX: b.x + b.width,
  maxY: b.y + b.height
});
function labelSettingsFromStyle(style) {
  const hasFlat = style.labelText !== void 0 || style.labelPriority !== void 0 || style.labelCollisionGroup !== void 0 || style.labelForceShow !== void 0;
  if (style.labelStyle === void 0 && !hasFlat) return void 0;
  const ls = style.labelStyle;
  return {
    priority: style.labelPriority ?? ls?.priority,
    collisionGroup: style.labelCollisionGroup ?? ls?.collisionGroup,
    forceShow: style.labelForceShow ?? ls?.forceShow
  };
}
var LabelCollisionBehaviour = class extends Behaviour {
  kind = "label-collision";
  layer = null;
  /** Camera — read for the visible world bounds each pass (viewport-scoping). */
  camera = null;
  opts;
  /** Last-flip timestamp per label id (perf.now()). */
  lastFlip = /* @__PURE__ */ new Map();
  /** Last visibility decision per label id. */
  lastVisible = /* @__PURE__ */ new Map();
  /** Subscription disposers, called in onDestroy. */
  subs = [];
  /** Coalesce repeated triggers within a single frame. */
  scheduled = false;
  /** `performance.now()` of the last pass — throttles passes during a gesture. */
  lastRunAt = 0;
  /** Pending trailing-edge pass (settle), or `null`. */
  trailingTimer = null;
  constructor(opts) {
    super({ ...opts, shortcuts: opts.shortcuts ?? [] });
    this.opts = {
      strategy: opts.strategy ?? "hide",
      prioritise: opts.prioritise ?? "priority-field",
      flickerGuardMs: opts.flickerGuardMs ?? 100,
      nodeGroup: opts.groups?.nodes ?? "nodes",
      edgeGroup: opts.groups?.edges ?? "edges"
    };
  }
  onRegister(ctx) {
    const layer = ctx.layers.get(this.targetLayerId);
    if (!layer) {
      throw new Error(
        `LabelCollisionBehaviour "${this.id}": layer "${this.targetLayerId}" not found.`
      );
    }
    this.layer = layer;
    this.camera = ctx.camera;
    const offFlush = layer.store.events.on("flush", () => this.schedule());
    this.subs.push(offFlush);
    const bus = ctx.events;
    const onCameraChange = () => this.schedule();
    bus.on("input:camera:zoom", onCameraChange);
    bus.on("input:camera:pan", onCameraChange);
    this.subs.push(
      () => bus.off("input:camera:zoom", onCameraChange),
      () => bus.off("input:camera:pan", onCameraChange)
    );
    if (this.enabled) this.schedule();
  }
  onDestroy() {
    for (const off of this.subs) off();
    this.subs.length = 0;
    if (this.trailingTimer !== null) {
      clearTimeout(this.trailingTimer);
      this.trailingTimer = null;
    }
    this.lastFlip.clear();
    this.lastVisible.clear();
    this.layer = null;
    this.camera = null;
  }
  onEnable() {
    this.schedule();
  }
  onDisable() {
    if (this.trailingTimer !== null) {
      clearTimeout(this.trailingTimer);
      this.trailingTimer = null;
    }
    this.lastRunAt = 0;
    if (!this.layer) return;
    const r = this.layer.getRenderer();
    if (!r) return;
    for (const id of this.lastVisible.keys()) r.setDecorationVisible(id, "label", true);
    this.lastVisible.clear();
    this.lastFlip.clear();
  }
  /**
   * Throttle passes during a gesture: run on the leading edge, then at most once
   * per {@link COLLISION_THROTTLE_MS} while events keep streaming, with a
   * guaranteed trailing pass after they stop (settle). Off a gesture (a lone
   * flush / the first event) this runs immediately.
   */
  schedule() {
    if (!this.enabled) return;
    const elapsed = performance.now() - this.lastRunAt;
    if (this.lastRunAt === 0 || elapsed >= COLLISION_THROTTLE_MS) {
      this.runSoon();
    } else if (this.trailingTimer === null) {
      this.trailingTimer = setTimeout(() => {
        this.trailingTimer = null;
        this.runSoon();
      }, COLLISION_THROTTLE_MS - elapsed);
    }
  }
  /** Coalesce a single pass into a microtask; stamps `lastRunAt`. */
  runSoon() {
    if (this.scheduled) return;
    this.scheduled = true;
    queueMicrotask(() => {
      this.scheduled = false;
      this.lastRunAt = performance.now();
      this.runPass();
    });
  }
  /**
   * Collect the in-viewport labels, sort by priority, and greedy-hide overlaps
   * within each `collisionGroup` using a per-group rbush index. Mutates label
   * `gfx.visible` via `setDecorationVisible`; doesn't touch decoration state
   * otherwise.
   */
  runPass() {
    if (!this.enabled) return;
    const layer = this.layer;
    if (!layer) return;
    const renderer = layer.getRenderer();
    if (!renderer) return;
    const view = this.camera?.getVisibleBounds();
    const padX = view ? view.width * VIEWPORT_PAD : 0;
    const padY = view ? view.height * VIEWPORT_PAD : 0;
    const inView = (b) => !view || b.x < view.x + view.width + padX && b.x + b.width > view.x - padX && b.y < view.y + view.height + padY && b.y + b.height > view.y - padY;
    const records = [];
    for (const node of layer.store.nodes()) {
      if (!layer.store.isNodeVisible(node.id)) continue;
      if (!renderer.isTextVisible(node.id)) continue;
      const settings = labelSettingsFromStyle(layer.resolveNodeStyle(node));
      if (settings === void 0) continue;
      const b = renderer.getDecorationWorldBounds(node.id, "label");
      if (!b || b.width === 0 || b.height === 0) continue;
      if (!inView(b)) continue;
      records.push({
        kind: "node",
        id: node.id,
        bounds: b,
        priority: this.priorityFor("node", node.id, settings),
        group: settings.collisionGroup ?? this.opts.nodeGroup,
        forceShow: settings.forceShow === true
      });
    }
    for (const edge of layer.store.edges()) {
      if (!layer.store.isEdgeVisible(edge.id)) continue;
      if (!renderer.isTextVisible(edge.id)) continue;
      const settings = labelSettingsFromStyle(layer.resolveEdgeStyle(edge));
      if (settings === void 0) continue;
      const b = renderer.getDecorationWorldBounds(edge.id, "label");
      if (!b || b.width === 0 || b.height === 0) continue;
      if (!inView(b)) continue;
      records.push({
        kind: "edge",
        id: edge.id,
        bounds: b,
        priority: this.priorityFor("edge", edge.id, settings),
        group: settings.collisionGroup ?? this.opts.edgeGroup,
        forceShow: settings.forceShow === true
      });
    }
    records.sort((a, b) => b.priority - a.priority);
    const shownByGroup = /* @__PURE__ */ new Map();
    const now = performance.now();
    for (const rec of records) {
      const box = toBBox(rec.bounds);
      let show;
      if (rec.forceShow) {
        show = true;
      } else {
        const index = shownByGroup.get(rec.group);
        show = !index || !index.collides(box);
      }
      const last = this.lastVisible.get(rec.id);
      if (last !== void 0 && last !== show) {
        const since = now - (this.lastFlip.get(rec.id) ?? 0);
        if (since < this.opts.flickerGuardMs) {
          show = last;
        }
      }
      if (show) {
        let index = shownByGroup.get(rec.group);
        if (!index) {
          index = new RBush();
          shownByGroup.set(rec.group, index);
        }
        index.insert(box);
      }
      if (this.lastVisible.get(rec.id) !== show) {
        this.lastFlip.set(rec.id, now);
        this.lastVisible.set(rec.id, show);
        renderer.setDecorationVisible(rec.id, "label", show);
      }
    }
  }
  priorityFor(kind, id, settings) {
    const resolver = this.opts.prioritise;
    if (typeof resolver === "function") return resolver(kind, id);
    if (resolver === "priority-field") {
      if (settings.priority !== void 0) return settings.priority;
      return kind === "node" ? this.degreeOf(id) : 0;
    }
    return kind === "node" ? this.degreeOf(id) : 0;
  }
  degreeOf(nodeId) {
    if (!this.layer) return 0;
    let n = 0;
    for (const _ of this.layer.store.edgesOf(nodeId, "both")) n++;
    return n;
  }
};
var DEFAULT_LEVELS = [
  // Each tier covers a ~2.5× zoom band so sampling stays ≥ ~1px-per-glyph-
  // px through the whole zoom range. The math: at zoom Z with multiplier M
  // and DPR=2, glyph-texture sampling per displayed pixel = (M * 2) / Z.
  // Aim for ≥ 1 to keep text crisp. So multiplier ≈ Z / 2.
  { minZoom: 0, multiplier: 1 },
  // 0 – 1.5×: native DPR
  { minZoom: 1.5, multiplier: 4 },
  // 1.5 – 4×: sampling 8/Z ∈ [2, 5.3]
  { minZoom: 4, multiplier: 8 },
  // 4 – 10×: sampling 16/Z ∈ [1.6, 4]
  { minZoom: 10, multiplier: 16 }
  // 10×+ : sampling 32/Z, headroom for deep zoom
];
var TextResolutionLODBehaviour = class extends Behaviour {
  kind = "label-resolution-lod";
  layer = null;
  subs = [];
  // Config live-read (and normalised) from `_options` so `setOptions` applies;
  // `onOptionsChanged` forces a re-evaluation of the active tier.
  /** Base resolution multiplied by the active tier's multiplier. */
  get baseResolution() {
    return this._options.baseResolution ?? (typeof window !== "undefined" ? window.devicePixelRatio : 1) ?? 1;
  }
  /** Tiers sorted ascending by `minZoom`, guaranteed to cover zoom 0. */
  get levels() {
    const raw = this._options.levels && this._options.levels.length > 0 ? this._options.levels : DEFAULT_LEVELS;
    const levels = raw.slice().sort((a, b) => a.minZoom - b.minZoom);
    if (levels[0].minZoom > 0) levels.unshift({ minZoom: 0, multiplier: 1 });
    return levels;
  }
  get hysteresis() {
    return this._options.hysteresis ?? 0.1;
  }
  /**
   * Index into `opts.levels` of the currently active tier. Re-evaluated
   * on every camera-zoom event; the renderer is only nudged when this
   * index actually changes, so a continuous zoom inside one tier costs
   * nothing past the cheap comparison below.
   */
  currentTierIdx = 0;
  /** Last resolution actually pushed to the renderer. */
  lastPushed = null;
  constructor(opts) {
    super({ ...opts, shortcuts: opts.shortcuts ?? [] });
  }
  onRegister(ctx) {
    const layer = ctx.layers.get(this.targetLayerId);
    if (!layer) {
      throw new Error(
        `TextResolutionLODBehaviour "${this.id}": layer "${this.targetLayerId}" not found.`
      );
    }
    this.layer = layer;
    const onCameraZoom = () => this.apply();
    ctx.events.on("input:camera:zoom", onCameraZoom);
    this.subs.push(() => ctx.events.off("input:camera:zoom", onCameraZoom));
    const offFlush = layer.store.events.on("flush", () => this.apply());
    this.subs.push(offFlush);
    if (this.enabled) this.apply();
  }
  onDestroy() {
    for (const off of this.subs) off();
    this.subs.length = 0;
    this.layer = null;
    this.lastPushed = null;
    this.currentTierIdx = 0;
  }
  onEnable() {
    this.apply();
  }
  onDisable() {
    const renderer = this.layer?.getRenderer();
    if (renderer) renderer.setLabelsResolution(this.baseResolution);
    this.lastPushed = this.baseResolution;
    this.currentTierIdx = 0;
  }
  /**
   * A live `levels` / `baseResolution` / `hysteresis` change must re-evaluate
   * the active tier and re-push the resolution. Drop the memo (`lastPushed`)
   * and reset the tier index so {@link apply} climbs the (possibly reshaped)
   * tier list from scratch instead of early-returning on an unchanged index.
   */
  onOptionsChanged() {
    if (!this.isEnabled) return;
    this.currentTierIdx = 0;
    this.lastPushed = null;
    this.apply();
  }
  /**
   * Re-evaluate the active tier under the current camera zoom and push the
   * tier's resolution to the renderer only when the tier index changes.
   * Continuous zoom inside one tier is a constant-time no-op past the
   * `idx === currentTierIdx` check below.
   */
  apply() {
    if (!this.enabled) return;
    const renderer = this.layer?.getRenderer();
    if (!renderer || !this.ctx) return;
    const zoom = this.ctx.camera.scale;
    let idx = this.currentTierIdx;
    const levels = this.levels;
    const hyst = this.hysteresis;
    while (idx + 1 < levels.length && levels[idx + 1].minZoom <= zoom) idx++;
    while (idx > 0 && zoom < levels[idx].minZoom - hyst) idx--;
    if (idx === this.currentTierIdx && this.lastPushed !== null) return;
    this.currentTierIdx = idx;
    const next = levels[idx].multiplier * this.baseResolution;
    if (this.lastPushed !== null && Math.abs(this.lastPushed - next) < 1e-6) return;
    this.lastPushed = next;
    renderer.setLabelsResolution(next);
  }
};
var REANCHOR_SETTLE_MS = 80;
var NodeScaleLODBehaviour = class extends ElementScaleLODBehaviour {
  kind = "node-size-lod";
  /** Live-read from `_options` so `setOptions` applies; `onOptionsChanged` reflows. */
  get configs() {
    return this._options.layers;
  }
  resolved = [];
  /**
   * Pending reanchor timer. The per-frame `scaleShape` fast path is cheap
   * (transform writes only), but `reanchorAllConnectors` rebuilds every
   * connector's Pixi geometry — at thousands of edges that drops fps to
   * the floor under a continuous zoom gesture. Coalesce to a single
   * trailing-edge call.
   */
  reanchorTimer = null;
  constructor(opts) {
    super(opts);
  }
  /**
   * Re-write the baseline and re-apply the transform when a live option patch
   * lands (e.g. a `sizePx` / `strokeWidthPx` slider), so the change shows
   * without waiting for the next zoom. `reflow()` is overridden here to
   * `writeBaseline('target')` first.
   */
  onOptionsChanged() {
    this.reflow();
  }
  onResolveTargets(ctx) {
    for (const config of this.configs) {
      const layer = ctx.layers.get(config.targetLayerId);
      if (!layer) {
        throw new Error(
          `NodeScaleLODBehaviour "${this.id}": layer "${config.targetLayerId}" not found in CanvasContext.`
        );
      }
      this.resolved.push({ config, layer });
    }
  }
  onReleaseTargets() {
    if (this.reanchorTimer !== null) {
      clearTimeout(this.reanchorTimer);
      this.reanchorTimer = null;
    }
    this.resolved = [];
  }
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
  apply(rawScale) {
    const scale = Math.max(rawScale, 1e-6);
    const gfxScale = 1 / scale;
    for (const { layer } of this.resolved) {
      const renderer = layer.getRenderer();
      if (!renderer) continue;
      for (const node of layer.store.nodes()) {
        renderer.scaleShape(node.id, gfxScale);
      }
    }
    this.scheduleReanchor();
  }
  scheduleReanchor() {
    if (this.reanchorTimer !== null) clearTimeout(this.reanchorTimer);
    this.reanchorTimer = setTimeout(() => {
      this.reanchorTimer = null;
      this.flushReanchor();
    }, REANCHOR_SETTLE_MS);
  }
  flushReanchor() {
    if (this.reanchorTimer !== null) {
      clearTimeout(this.reanchorTimer);
      this.reanchorTimer = null;
    }
    for (const { layer } of this.resolved) {
      const renderer = layer.getRenderer();
      if (!renderer) continue;
      const ids = [];
      for (const node of layer.store.nodes()) ids.push(node.id);
      renderer.reindexScaledShapeHits(ids);
      renderer.reanchorAllConnectors();
    }
  }
  onEnable() {
    if (!this.ctx) return;
    this.writeBaseline("target");
    super.onEnable();
  }
  onDisable() {
    super.onDisable();
    this.writeBaseline("worldUnit");
  }
  reflow() {
    if (this.isEnabled) this.writeBaseline("target");
    super.reflow();
  }
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
  writeBaseline(mode) {
    for (const { config, layer } of this.resolved) {
      const renderer = layer.getRenderer();
      if (!renderer) continue;
      this.writeLayerBaseline(layer, renderer, mode, config);
    }
    this.flushReanchor();
  }
  writeLayerBaseline(layer, renderer, mode, config) {
    const preserveRelative = config.preserveRelativeSize === true;
    const sizePxFallback = preserveRelative ? void 0 : resolveNumberOrGetter(config.sizePx);
    const strokePxFallback = preserveRelative ? void 0 : resolveNumberOrGetter(config.strokeWidthPx);
    for (const node of layer.store.nodes()) {
      const style = layer.resolveNodeStyle(node);
      const shape = style.shape;
      if (!shape) continue;
      const naturalAABB = renderer.boundsOfSpec(shape);
      if (!naturalAABB) continue;
      const naturalSize = Math.max(naturalAABB.width, naturalAABB.height);
      if (naturalSize <= 0) continue;
      const baselineSize = mode === "target" ? sizePxFallback ?? naturalSize : naturalSize;
      const factor = baselineSize / naturalSize;
      const geomPartial = renderer.scaleShapeSpec(shape, factor);
      if (!geomPartial) continue;
      const partial = { ...geomPartial };
      const strokeColor = style.bgStrokeColor;
      const naturalStrokeWidth = style.bgStrokeWidth;
      if (strokeColor !== void 0 && naturalStrokeWidth !== void 0 && naturalStrokeWidth > 0) {
        const baseSw = mode === "target" ? strokePxFallback ?? naturalStrokeWidth : naturalStrokeWidth;
        partial.stroke = {
          color: strokeColor,
          width: baseSw,
          ...style.bgStrokeAlignment ? { alignment: style.bgStrokeAlignment } : {}
        };
      }
      renderer.updateShape(node.id, partial);
    }
  }
};
var DEFAULT_EDGE_SETTLE_MS = 80;
var EdgeScaleLODBehaviour = class extends ElementScaleLODBehaviour {
  kind = "edge-size-lod";
  /** Live-read from `_options` so `setOptions` applies; `onOptionsChanged` reflows. */
  get configs() {
    return this._options.layers;
  }
  resolved = [];
  constructor(opts) {
    super({ settleMs: DEFAULT_EDGE_SETTLE_MS, ...opts });
  }
  /**
   * Re-apply the stroke scaling at the current camera scale when a live option
   * patch lands (e.g. a `strokeWidthPx` slider), so the change shows without
   * waiting for the next zoom.
   */
  onOptionsChanged() {
    this.reflow();
  }
  onResolveTargets(ctx) {
    for (const config of this.configs) {
      const layer = ctx.layers.get(config.targetLayerId);
      if (!layer) {
        throw new Error(
          `EdgeScaleLODBehaviour "${this.id}": layer "${config.targetLayerId}" not found in CanvasContext.`
        );
      }
      this.resolved.push({ config, layer });
    }
  }
  onReleaseTargets() {
    this.resolved = [];
  }
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
  apply(rawScale) {
    const scale = Math.max(rawScale, 1e-6);
    const multiplier = 1 / scale;
    for (const { layer } of this.resolved) {
      const renderer = layer.getRenderer();
      if (!renderer) continue;
      for (const edge of layer.store.edges()) {
        renderer.scaleConnectorStroke(edge.id, multiplier);
      }
    }
  }
};
var defaultGroupBy = (edge) => `${edge.source}::${edge.target}`;
function resolveOptions10(prev, patch) {
  const base = prev ?? {
    spacing: 12,
    basis: "auto",
    anchorOffset: true,
    groupBy: defaultGroupBy,
    distribute: centeredRanksPolicy
  };
  return {
    spacing: patch.spacing ?? base.spacing,
    basis: patch.basis ?? base.basis,
    anchorOffset: patch.anchorOffset ?? base.anchorOffset,
    groupBy: patch.groupBy ?? base.groupBy,
    distribute: patch.distribute ?? base.distribute
  };
}
var PORT_ANCHORS = /* @__PURE__ */ new Set([
  "edge-port",
  "silhouette-port"
]);
var AXIS_ALIGNED_PATH_TYPES = /* @__PURE__ */ new Set([
  "manhattan",
  "orth",
  "rounded"
]);
var centeredRanksPolicy = (group, ctx) => {
  const { sourceCenter: src, targetCenter: tgt, edges } = group;
  const dx = tgt.x - src.x;
  const dy = tgt.y - src.y;
  const len = Math.hypot(dx, dy) || 1;
  const horizontal = Math.abs(dx) >= Math.abs(dy);
  const nx = -dy / len;
  const ny = dx / len;
  const mx = (src.x + tgt.x) / 2;
  const my = (src.y + tgt.y) / 2;
  const half = (edges.length - 1) / 2;
  const patches = [];
  for (let i = 0; i < edges.length; i++) {
    const edge = edges[i];
    const k = i - half;
    const off = k * ctx.spacing;
    const shape = edge.style?.shape;
    const pathType = shape?.pathType;
    const effectiveBasis = ctx.basis === "auto" ? pathType !== void 0 && AXIS_ALIGNED_PATH_TYPES.has(pathType) ? "axis-aligned" : "perpendicular" : ctx.basis;
    const waypoint = effectiveBasis === "axis-aligned" ? horizontal ? { x: mx + off, y: my } : { x: mx, y: my + off } : { x: mx + nx * off, y: my + ny * off };
    const patch = {
      edgeId: edge.id,
      waypoints: [waypoint]
    };
    if (ctx.anchorOffset) {
      const sourceAnchor = shape?.sourceAnchor;
      const targetAnchor = shape?.targetAnchor;
      if (sourceAnchor !== void 0 && PORT_ANCHORS.has(sourceAnchor)) {
        patch.sourceAnchorOpts = {
          side: "auto",
          offset: off
        };
      }
      if (targetAnchor !== void 0 && PORT_ANCHORS.has(targetAnchor)) {
        patch.targetAnchorOpts = {
          side: "auto",
          offset: off
        };
      }
    }
    patches.push(patch);
  }
  return patches;
};
var ParallelEdgeBehaviour = class extends Behaviour {
  kind = "parallel-edge";
  /** Bound target layer — resolved in `onRegister`. */
  layer = null;
  opts;
  /** Subscription disposers, called in `onDestroy`. */
  subs = [];
  /** Re-entrancy guard: `true` while writing patches to the store. */
  patching = false;
  constructor(opts) {
    super({ ...opts, shortcuts: opts.shortcuts ?? [] });
    this.opts = resolveOptions10(null, opts);
  }
  // ─── Lifecycle ──────────────────────────────────────────────────────────
  onRegister(ctx) {
    const layer = ctx.layers.get(this.targetLayerId);
    if (!layer) {
      throw new Error(
        `ParallelEdgeBehaviour "${this.id}": layer "${this.targetLayerId}" not found. Add the GraphLayer before registering this behaviour.`
      );
    }
    this.layer = layer;
    const onChange = () => {
      if (!this.isEnabled) return;
      this.recompute();
    };
    this.subs.push(
      layer.store.events.on("edge:add", onChange),
      layer.store.events.on("edge:remove", onChange),
      layer.store.events.on("node:update", onChange),
      layer.store.events.on("node:remove", onChange)
    );
  }
  onDestroy() {
    for (const off of this.subs) off();
    this.subs.length = 0;
    this.layer = null;
  }
  onEnable() {
    this.recompute();
  }
  // ─── Public API ─────────────────────────────────────────────────────────
  /** Read-only snapshot of resolved options. */
  get options() {
    return this.opts;
  }
  /** Runtime option update. Re-runs the distribution immediately if enabled. */
  setOptions(patch) {
    this.recordOptions(patch);
    this.opts = resolveOptions10(this.opts, patch);
    if (this.isEnabled) this.recompute();
  }
  /**
   * Force a recompute pass. Useful after bulk mutations performed inside a
   * `store.batch()` that callers want to flush through the behaviour
   * immediately.
   */
  recompute() {
    const layer = this.layer;
    if (!layer || this.patching) return;
    const store = layer.store;
    const renderer = layer.getRenderer();
    const groups = /* @__PURE__ */ new Map();
    for (const edge of store.edges()) {
      const key = this.opts.groupBy(edge);
      if (key === null) continue;
      let bucket = groups.get(key);
      if (bucket === void 0) {
        bucket = [];
        groups.set(key, bucket);
      }
      bucket.push(edge);
    }
    this.patching = true;
    try {
      for (const edges of groups.values()) {
        if (edges.length < 2) continue;
        const first = edges[0];
        const sourceCenter = resolveCenter(layer, renderer, first.source);
        const targetCenter = resolveCenter(layer, renderer, first.target);
        if (!sourceCenter || !targetCenter) continue;
        const patches = this.opts.distribute(
          {
            sourceId: first.source,
            targetId: first.target,
            sourceCenter,
            targetCenter,
            edges
          },
          {
            spacing: this.opts.spacing,
            basis: this.opts.basis,
            anchorOffset: this.opts.anchorOffset
          }
        );
        for (const patch of patches) {
          applyPatch(store, patch);
        }
      }
    } finally {
      this.patching = false;
    }
  }
};
function resolveCenter(layer, renderer, nodeId) {
  const c = renderer?.getShapeCenter(nodeId);
  if (c) return { x: c.x, y: c.y };
  return layer.store.getPosition(nodeId) ?? null;
}
function applyPatch(store, patch) {
  const edge = store.getEdge(patch.edgeId);
  if (!edge) return;
  const priorStyle = edge.style ?? {};
  const priorShape = priorStyle.shape ?? {};
  const nextShape = { ...priorShape };
  if (patch.waypoints !== void 0) {
    nextShape.waypoints = patch.waypoints;
  }
  if (patch.sourceAnchorOpts !== void 0) {
    nextShape.sourceAnchorOpts = patch.sourceAnchorOpts;
  }
  if (patch.targetAnchorOpts !== void 0) {
    nextShape.targetAnchorOpts = patch.targetAnchorOpts;
  }
  store.internal.updateEdge(patch.edgeId, {
    style: { ...priorStyle, shape: nextShape }
  });
}

// src/behaviours/fisheye.ts
function fisheyeDisplace(px, py, fx, fy, r, d, nodeScale) {
  const vx = px - fx;
  const vy = py - fy;
  const dist = Math.hypot(vx, vy);
  if (!(r > 0) || dist > r) return null;
  const scale = 1 + (nodeScale - 1) * (1 - dist / r);
  if (dist === 0) return { dx: 0, dy: 0, scale };
  const magnified = (d + 1) * r * dist / (d * dist + r);
  const k = magnified / dist - 1;
  return { dx: vx * k, dy: vy * k, scale };
}

// src/behaviours/FisheyeBehaviour.ts
var DEFAULTS3 = {
  trigger: "pointermove",
  radius: 120,
  minRadius: 20,
  maxRadius: null,
  distortion: 1.5,
  minDistortion: 0,
  maxDistortion: 5,
  nodeScale: 1.5,
  showLabels: true,
  radiusWheelModifier: "alt",
  distortionWheelModifier: "shift",
  lensStrokeColor: 6583435,
  lensStrokeWidth: 2,
  lensFillColor: 9741240,
  lensFillAlpha: 0.08
};
function clamp(v, min, max) {
  return v < min ? min : v > max ? max : v;
}
function resolveOptions11(prev, patch) {
  const base = prev ?? DEFAULTS3;
  const pick = (k) => k in patch && patch[k] !== void 0 ? patch[k] : base[k];
  const r = {
    trigger: pick("trigger"),
    radius: pick("radius"),
    minRadius: pick("minRadius"),
    maxRadius: pick("maxRadius"),
    distortion: pick("distortion"),
    minDistortion: pick("minDistortion"),
    maxDistortion: pick("maxDistortion"),
    nodeScale: pick("nodeScale"),
    showLabels: pick("showLabels"),
    radiusWheelModifier: pick("radiusWheelModifier"),
    distortionWheelModifier: pick("distortionWheelModifier"),
    lensStrokeColor: pick("lensStrokeColor"),
    lensStrokeWidth: pick("lensStrokeWidth"),
    lensFillColor: pick("lensFillColor"),
    lensFillAlpha: pick("lensFillAlpha")
  };
  r.radius = clamp(r.radius, r.minRadius, r.maxRadius ?? Number.POSITIVE_INFINITY);
  r.distortion = clamp(r.distortion, r.minDistortion, r.maxDistortion);
  return r;
}
function modifierHeld(e, mod) {
  switch (mod) {
    case "alt":
      return e.altKey;
    case "shift":
      return e.shiftKey;
    case "ctrl":
      return e.ctrlKey;
    case "meta":
      return e.metaKey;
    default:
      return false;
  }
}
var RADIUS_STEP = 0.05;
var DISTORTION_STEP = 0.1;
var CLICK_SLOP_PX = 4;
var FisheyeBehaviour = class _FisheyeBehaviour extends Behaviour {
  kind = "fisheye";
  opts;
  layer = null;
  overlay = null;
  /** Lens centre in canvas-relative screen px, or `null` when there is no lens. */
  focus = null;
  /** Overrides currently applied, by node id — diffed against each new frame. */
  applied = /* @__PURE__ */ new Map();
  /** Reused buffer for {@link GraphStore.nodeIdsWithin}. */
  candidates = [];
  /** Per-node group role, cached between data changes (style resolution isn't free). */
  skipCache = /* @__PURE__ */ new Map();
  /** Press position for click detection, or `null` when no press is in flight. */
  press = null;
  /** `true` while this behaviour is dragging the lens (`trigger: 'drag'`). */
  draggingLens = false;
  rafId = null;
  disposers = [];
  constructor(opts) {
    super({ ...opts, shortcuts: opts.shortcuts ?? _FisheyeBehaviour.shortcutsFor(resolveOptions11(null, opts)) });
    this.opts = resolveOptions11(null, opts);
  }
  /** Advisory gesture ids for the registry's conflict warnings. */
  static shortcutsFor(o) {
    const out = [o.trigger];
    if (o.radiusWheelModifier) out.push(`${o.radiusWheelModifier}+wheel`);
    if (o.distortionWheelModifier) out.push(`${o.distortionWheelModifier}+wheel`);
    return out;
  }
  // ─── Lifecycle ──────────────────────────────────────────────────────────
  onRegister(ctx) {
    const layer = ctx.layers.get(this.targetLayerId);
    if (!layer) {
      throw new Error(
        `FisheyeBehaviour "${this.id}": layer "${this.targetLayerId}" not found. Add the GraphLayer before registering this behaviour.`
      );
    }
    this.layer = layer;
    this.overlay = ctx.createOverlay(`${this.id}-lens`, "screen");
    this.overlay.setVisible(false);
    this.drawRing();
    const schedule = () => this.schedule();
    this.disposers.push(
      // Positions moved (layout tick, data edit) — re-distort from the new ones.
      layer.events.on("data:changed", () => {
        this.skipCache.clear();
        schedule();
      }),
      // The lens is screen-anchored, so any camera move changes what's under it.
      ctx.events.on("input:camera:pan", schedule),
      ctx.events.on("input:camera:zoom", schedule),
      ctx.store.view.subscribe((s, prev) => {
        if (s.interaction.camera !== prev.interaction.camera) schedule();
      }),
      // Step aside while another behaviour owns the gesture (D12).
      ctx.gestures.onOwnerChange(schedule)
    );
    const el = ctx.canvasElement;
    if (!el) return;
    const onMove = (e) => this.handlePointerMove(e);
    const onLeave = () => this.handlePointerLeave();
    const onDown = (e) => this.handlePointerDown(e);
    const onUp = (e) => this.handlePointerUp(e);
    const onWheel = (e) => this.handleWheel(e);
    const wheelTarget = el.parentElement ?? el;
    el.addEventListener("pointerleave", onLeave);
    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    wheelTarget.addEventListener("wheel", onWheel, { capture: true, passive: false });
    this.disposers.push(
      () => el.removeEventListener("pointerleave", onLeave),
      () => el.removeEventListener("pointerdown", onDown),
      () => window.removeEventListener("pointermove", onMove),
      () => window.removeEventListener("pointerup", onUp),
      () => window.removeEventListener("pointercancel", onUp),
      () => wheelTarget.removeEventListener("wheel", onWheel, { capture: true })
    );
  }
  onEnable() {
    this.schedule();
  }
  onDisable() {
    this.focus = null;
    this.press = null;
    this.draggingLens = false;
    this.cancelFrame();
    this.clearLens();
  }
  onDestroy() {
    this.cancelFrame();
    this.clearLens();
    for (const off of this.disposers) off();
    this.disposers.length = 0;
    this.overlay?.destroy();
    this.overlay = null;
    this.layer = null;
  }
  // ─── Public API ─────────────────────────────────────────────────────────
  /** Read-only snapshot of the resolved options. */
  get options() {
    return this.opts;
  }
  /**
   * Place the lens at a canvas-relative screen point (`null` removes it) — the
   * programmatic twin of a click, for hosts that drive the lens themselves.
   */
  setFocus(point) {
    this.focus = point === null ? null : { x: point.x, y: point.y };
    this.schedule();
  }
  /** Include the serialisable lens options in a canvas-state snapshot. */
  serializeDefinition() {
    const o = this.opts;
    return {
      ...super.serializeDefinition(),
      trigger: o.trigger,
      radius: o.radius,
      minRadius: o.minRadius,
      maxRadius: o.maxRadius,
      distortion: o.distortion,
      minDistortion: o.minDistortion,
      maxDistortion: o.maxDistortion,
      nodeScale: o.nodeScale,
      showLabels: o.showLabels,
      radiusWheelModifier: o.radiusWheelModifier,
      distortionWheelModifier: o.distortionWheelModifier,
      lensStrokeColor: o.lensStrokeColor,
      lensStrokeWidth: o.lensStrokeWidth,
      lensFillColor: o.lensFillColor,
      lensFillAlpha: o.lensFillAlpha
    };
  }
  /** Live option update (settings editor, `canvas.update`). */
  onOptionsChanged(changes) {
    const prevTrigger = this.opts.trigger;
    this.opts = resolveOptions11(this.opts, changes);
    if (this.opts.trigger !== prevTrigger) this.focus = null;
    this.drawRing();
    this.schedule();
  }
  // ─── Input ──────────────────────────────────────────────────────────────
  /** Canvas-relative screen coordinates of a DOM event. */
  screenFromEvent(e) {
    const el = this.ctx?.canvasElement;
    if (!el) return { x: e.clientX, y: e.clientY };
    const rect2 = el.getBoundingClientRect();
    return { x: e.clientX - rect2.left, y: e.clientY - rect2.top };
  }
  insideLens(p) {
    const f = this.focus;
    return f !== null && Math.hypot(p.x - f.x, p.y - f.y) <= this.opts.radius;
  }
  handlePointerMove(e) {
    if (!this.isEnabled) return;
    const onCanvas = e.target === this.ctx?.canvasElement;
    if (this.opts.trigger === "pointermove") {
      if (!onCanvas) return;
      this.focus = this.screenFromEvent(e);
      this.schedule();
    } else if (this.draggingLens) {
      this.focus = this.screenFromEvent(e);
      this.schedule();
    }
  }
  handlePointerLeave() {
    if (!this.isEnabled || this.opts.trigger !== "pointermove") return;
    this.focus = null;
    this.schedule();
  }
  handlePointerDown(e) {
    if (!this.isEnabled || e.button !== 0) return;
    const p = this.screenFromEvent(e);
    this.press = p;
    if (this.opts.trigger === "drag" && this.insideLens(p) && this.claimGesture()) {
      this.draggingLens = true;
    }
  }
  handlePointerUp(e) {
    const press = this.press;
    this.press = null;
    if (this.draggingLens) {
      this.draggingLens = false;
      this.releaseGesture();
      return;
    }
    if (!this.isEnabled || press === null || e.type === "pointercancel") return;
    const p = this.screenFromEvent(e);
    if (Math.hypot(p.x - press.x, p.y - press.y) > CLICK_SLOP_PX) return;
    if (this.opts.trigger === "click" || this.opts.trigger === "drag" && this.focus === null) {
      this.focus = p;
      this.schedule();
    }
  }
  handleWheel(e) {
    if (!this.isEnabled || this.focus === null) return;
    const { radiusWheelModifier, distortionWheelModifier } = this.opts;
    const adjustR = modifierHeld(e, radiusWheelModifier);
    const adjustD = !adjustR && modifierHeld(e, distortionWheelModifier);
    if (!adjustR && !adjustD) return;
    if (!this.insideLens(this.screenFromEvent(e))) return;
    e.preventDefault();
    e.stopPropagation();
    const delta = e.deltaY + e.deltaX;
    if (delta === 0) return;
    const grow = delta < 0;
    const o = this.opts;
    if (adjustR) {
      const ceiling = o.maxRadius ?? this.halfShortSide();
      const next = o.radius * (grow ? 1 / (1 - RADIUS_STEP) : 1 - RADIUS_STEP);
      this.adjust({ radius: clamp(next, o.minRadius, Math.max(o.minRadius, ceiling)) });
    } else {
      const next = o.distortion + (grow ? DISTORTION_STEP : -DISTORTION_STEP);
      this.adjust({ distortion: clamp(next, o.minDistortion, o.maxDistortion) });
    }
  }
  /** Apply a wheel adjustment and record it so `getOptions()` (the editor's seed) stays current. */
  adjust(patch) {
    this.recordOptions(patch);
    this.opts = resolveOptions11(this.opts, patch);
    if ("radius" in patch) this.drawRing();
    this.schedule();
  }
  halfShortSide() {
    const el = this.ctx?.canvasElement;
    return el ? Math.min(el.clientWidth, el.clientHeight) / 2 : Number.POSITIVE_INFINITY;
  }
  // ─── Frame ──────────────────────────────────────────────────────────────
  schedule() {
    if (this.rafId !== null) return;
    if (typeof requestAnimationFrame === "undefined") {
      this.update();
      return;
    }
    this.rafId = requestAnimationFrame(() => {
      this.rafId = null;
      this.update();
    });
  }
  cancelFrame() {
    if (this.rafId !== null && typeof cancelAnimationFrame !== "undefined") {
      cancelAnimationFrame(this.rafId);
    }
    this.rafId = null;
  }
  /** Recompute the lens population and push the diff to the renderer. */
  update() {
    const ctx = this.ctx;
    const layer = this.layer;
    const renderer = layer?.getRenderer();
    const owner = ctx?.gestures.owner ?? null;
    const focus = this.focus;
    if (!ctx || !layer || !renderer || !this.isEnabled || focus === null || owner !== null && owner !== this.id) {
      this.clearLens();
      return;
    }
    const o = this.opts;
    const zoom = Math.max(ctx.camera.scale, 1e-6);
    const centre = ctx.camera.toWorld(focus.x, focus.y);
    const rWorld = o.radius / zoom;
    const store = layer.store;
    const ids = store.nodeIdsWithin(centre.x, centre.y, rWorld, this.candidates);
    const next = /* @__PURE__ */ new Map();
    for (const id of ids) {
      if (this.isSkipped(id)) continue;
      const pos = store.getPosition(id);
      if (!pos) continue;
      const disp = fisheyeDisplace(pos.x, pos.y, centre.x, centre.y, rWorld, o.distortion, o.nodeScale);
      if (!disp) continue;
      next.set(id, { dx: disp.dx, dy: disp.dy, scale: disp.scale, showText: o.showLabels });
    }
    const touched = /* @__PURE__ */ new Set();
    for (const [id, override] of next) {
      renderer.setShapeDisplayOverride(id, override);
      touched.add(id);
    }
    for (const id of this.applied.keys()) {
      if (next.has(id)) continue;
      renderer.setShapeDisplayOverride(id, null);
      touched.add(id);
    }
    this.applied = next;
    this.rerouteIncident(renderer, touched);
    this.overlay?.setPosition(focus.x, focus.y).setVisible(true);
  }
  /** Remove every override this lens applied, re-route their edges, hide the ring. */
  clearLens() {
    this.overlay?.setVisible(false);
    if (this.applied.size === 0) return;
    const renderer = this.layer?.getRenderer();
    const touched = new Set(this.applied.keys());
    this.applied = /* @__PURE__ */ new Map();
    if (!renderer) return;
    for (const id of touched) renderer.setShapeDisplayOverride(id, null);
    this.rerouteIncident(renderer, touched);
  }
  /** Re-route each connector incident to a touched node once, so edges follow the drawn nodes. */
  rerouteIncident(renderer, nodeIds) {
    const store = this.layer?.store;
    if (!store || nodeIds.size === 0) return;
    const done = /* @__PURE__ */ new Set();
    for (const id of nodeIds) {
      for (const edge of store.edgesOf(id)) {
        if (done.has(edge.id)) continue;
        done.add(edge.id);
        if (renderer.hasConnector(edge.id)) renderer.updateConnector(edge.id, {});
      }
    }
  }
  /** Expanded group frames don't distort — their frame is derived from their members. */
  isSkipped(id) {
    let skip = this.skipCache.get(id);
    if (skip === void 0) {
      skip = this.layer?.getGroupRole(id) === "expanded";
      this.skipCache.set(id, skip);
    }
    return skip;
  }
  drawRing() {
    const ov = this.overlay;
    if (!ov) return;
    const o = this.opts;
    ov.clear().ellipse(0, 0, o.radius, o.radius);
    if (o.lensFillAlpha > 0) ov.fill({ color: o.lensFillColor, alpha: o.lensFillAlpha });
    if (o.lensStrokeWidth > 0) ov.stroke({ color: o.lensStrokeColor, width: o.lensStrokeWidth });
  }
};
function resolveOptions12(prev, patch) {
  const base = prev ?? {
    direction: "both",
    minSize: 8,
    maxSize: 32,
    scale: "sqrt",
    sizeFn: void 0,
    weightKey: void 0,
    weightBy: void 0,
    labelScale: 0,
    labelMinSize: 8,
    labelMaxSize: 40
  };
  return {
    direction: patch.direction ?? base.direction,
    minSize: patch.minSize ?? base.minSize,
    maxSize: patch.maxSize ?? base.maxSize,
    scale: patch.scale ?? base.scale,
    sizeFn: "sizeFn" in patch ? patch.sizeFn : base.sizeFn,
    weightKey: "weightKey" in patch ? patch.weightKey : base.weightKey,
    weightBy: "weightBy" in patch ? patch.weightBy : base.weightBy,
    labelScale: patch.labelScale ?? base.labelScale,
    labelMinSize: patch.labelMinSize ?? base.labelMinSize,
    labelMaxSize: patch.labelMaxSize ?? base.labelMaxSize
  };
}
function clamp2(v, min, max) {
  return v < min ? min : v > max ? max : v;
}
function mapDegreeToSize(degree, maxDegree, opts) {
  if (opts.sizeFn) return opts.sizeFn(degree, maxDegree);
  if (maxDegree <= 0) return opts.minSize;
  const t = degree / maxDegree;
  let eased;
  switch (opts.scale) {
    case "linear":
      eased = t;
      break;
    case "log":
      eased = Math.log1p(degree) / Math.log1p(maxDegree);
      break;
    case "sqrt":
    default:
      eased = Math.sqrt(t);
      break;
  }
  return opts.minSize + (opts.maxSize - opts.minSize) * eased;
}
var NodeCentralityBehaviour = class extends Behaviour {
  kind = "degree-size";
  /** Bound target layer — resolved in `onRegister`. */
  layer = null;
  opts;
  /** Subscription disposers, called in `onDestroy`. */
  subs = [];
  /**
   * Snapshot of each touched node's prior `style.size` **and**
   * `style.labelFontSize`, captured on the first write to that node. A field
   * being `undefined` means the node had none before — restore by writing
   * `undefined`. Cleared on `disable` / `destroy`.
   */
  prior = /* @__PURE__ */ new Map();
  /** Microtask debounce flag — coalesces bursts of store events. */
  recomputeScheduled = false;
  /** Re-entrancy guard — set while writing patches so our own emits no-op. */
  patching = false;
  constructor(opts) {
    super({ ...opts, shortcuts: opts.shortcuts ?? [] });
    this.opts = resolveOptions12(null, opts);
  }
  // ─── Lifecycle ──────────────────────────────────────────────────────────
  onRegister(ctx) {
    const layer = ctx.layers.get(this.targetLayerId);
    if (!layer) {
      throw new Error(
        `NodeCentralityBehaviour "${this.id}": layer "${this.targetLayerId}" not found. Add the GraphLayer before registering this behaviour.`
      );
    }
    this.layer = layer;
    const schedule = () => this.scheduleRecompute();
    this.subs.push(
      layer.store.events.on("node:add", schedule),
      layer.store.events.on("node:remove", schedule),
      layer.store.events.on("edge:add", schedule),
      layer.store.events.on("edge:remove", schedule)
    );
  }
  onEnable() {
    this.applyAll();
  }
  onDisable() {
    this.revertAll();
  }
  onDestroy() {
    if (this.prior.size > 0) this.revertAll();
    for (const off of this.subs) off();
    this.subs.length = 0;
    this.layer = null;
  }
  // ─── Public API ─────────────────────────────────────────────────────────
  /** Read-only snapshot of resolved options. */
  get options() {
    return this.opts;
  }
  /**
   * Runtime option update. Re-runs `applyAll()` immediately if enabled so
   * GUI slider changes are visible without an extra call.
   */
  setOptions(patch) {
    this.recordOptions(patch);
    this.opts = resolveOptions12(this.opts, patch);
    if (this.isEnabled) this.applyAll();
  }
  /**
   * Force a recompute + write pass. Useful after a bulk `store.batch()`
   * the caller wants reflected immediately (the microtask-debounced
   * subscription would otherwise fire on the next tick).
   */
  recompute() {
    if (this.isEnabled) this.applyAll();
  }
  // ─── Internals ──────────────────────────────────────────────────────────
  scheduleRecompute() {
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
  applyAll() {
    const layer = this.layer;
    if (!layer) return;
    const store = layer.store;
    const { direction } = this.opts;
    const weighted = this.opts.weightBy !== void 0 || this.opts.weightKey !== void 0;
    const degrees = [];
    let maxDegree = 0;
    for (const node of store.nodes()) {
      const degree = weighted ? this.weightedDegree(store, node.id, direction) : direction === "in" ? store.inDegree(node.id) : direction === "out" ? store.outDegree(node.id) : store.inDegree(node.id) + store.outDegree(node.id);
      if (degree > maxDegree) maxDegree = degree;
      degrees.push({
        id: node.id,
        degree,
        style: node.style
      });
    }
    const { labelScale, labelMinSize, labelMaxSize } = this.opts;
    this.patching = true;
    try {
      for (const { id, degree, style } of degrees) {
        const size = mapDegreeToSize(degree, maxDegree, this.opts);
        if (!this.prior.has(id)) {
          this.prior.set(id, { size: style?.size, labelFontSize: style?.labelFontSize });
        }
        const prevStyle = style ?? {};
        const labelFontSize = labelScale > 0 ? clamp2(size * labelScale, labelMinSize, labelMaxSize) : this.prior.get(id).labelFontSize;
        store.internal.updateNode(id, {
          style: { ...prevStyle, size, labelFontSize }
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
  weightedDegree(store, id, direction) {
    let sum = 0;
    for (const edge of store.edgesOf(id, direction)) sum += this.weightOf(edge);
    return sum;
  }
  /**
   * One edge's weight: `weightBy` fn wins; else `data[weightKey]` (a non-numeric
   * / missing value counts as `0`). Only called when weighting is configured.
   */
  weightOf(edge) {
    const { weightBy, weightKey } = this.opts;
    if (weightBy) return weightBy(edge);
    if (weightKey !== void 0) {
      const v = edge.data?.[weightKey];
      return typeof v === "number" && Number.isFinite(v) ? v : 0;
    }
    return 1;
  }
  /**
   * Restore each touched node's prior `style.size` + `style.labelFontSize` and
   * clear the snapshot. A field that was `undefined` before is dropped again.
   */
  revertAll() {
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
        const prevStyle = node.style ?? {};
        const { size: _dropSize, labelFontSize: _dropFont, ...rest } = prevStyle;
        const restored = { ...rest };
        if (prev.size !== void 0) restored.size = prev.size;
        if (prev.labelFontSize !== void 0)
          restored.labelFontSize = prev.labelFontSize;
        store.internal.updateNode(id, { style: restored });
      }
    } finally {
      this.patching = false;
    }
    this.prior.clear();
  }
};
function inBand(scale, band) {
  return (band.minZoom == null || scale >= band.minZoom) && (band.maxZoom == null || scale <= band.maxZoom);
}
var claims = /* @__PURE__ */ new WeakMap();
var ContentLODBehaviour = class extends Behaviour {
  /** Bound target layer — resolved in `onRegister`. */
  layer = null;
  /**
   * The element set this behaviour's band sweeps. `'nodes'` unless a subclass
   * gates edge content (`EdgeLabelLODBehaviour`).
   */
  contentTarget = "nodes";
  /** The active zoom band, live-read from `_options` so `setOptions` applies. */
  get band() {
    return { minZoom: this._options.minZoom, maxZoom: this._options.maxZoom };
  }
  /** Subscription disposers, called in `onDestroy`. */
  subs = [];
  /**
   * Last-applied visibility. `undefined` = not yet applied. The zoom path only
   * sweeps when the desired value differs, so a non-crossing zoom does no work.
   */
  applied;
  /** RAF-coalescing handle. `null` when no apply is scheduled. */
  rafHandle = null;
  /** A pending scheduled apply must re-sweep every node (new nodes / (re-)enable). */
  pendingFull = false;
  constructor(opts) {
    super({ ...opts, shortcuts: opts.shortcuts ?? [] });
  }
  /**
   * Override hook — elements whose content stays visible **even when the band
   * would hide it** (e.g. always-show the most central nodes' labels). Default:
   * no exemptions. Consulted only while the band is hiding, so it never
   * over-hides.
   */
  isExempt(_id) {
    return false;
  }
  /**
   * Override hook — recompute the exemption set. Called before every **full**
   * sweep (data change / enable / `setOptions`), so an exemption derived from
   * topology (degree centrality) stays current, while zoom-only reflows skip it.
   */
  refreshExemptions() {
  }
  /**
   * Override hook — runs on every **full** reconcile (register / enable / data
   * change / option change), after {@link refreshExemptions}. For a subclass that
   * also pushes layer-wide config to the renderer (a label-size policy): the
   * renderer may not exist at register time, and a data change can mean a
   * remounted one, so re-pushing here keeps it current. Default no-op.
   */
  onFullReconcile() {
  }
  // ─── Lifecycle ────────────────────────────────────────────────────────────
  onRegister(ctx) {
    const layer = ctx.layers.get(this.targetLayerId);
    if (!layer) {
      throw new Error(
        `${this.constructor.name} "${this.id}": layer "${this.targetLayerId}" not found. Add the GraphLayer before registering this behaviour.`
      );
    }
    this.claimLayer(layer);
    this.layer = layer;
    this.subs.push(
      ctx.events.on("input:camera:zoom", () => this.schedule(false)),
      layer.events.on("data:changed", () => this.schedule(true))
    );
    if (this._enabled) this.schedule(true);
  }
  onDestroy() {
    this.cancel();
    for (const off of this.subs) off();
    this.subs.length = 0;
    this.applied = void 0;
    if (this.layer) this.releaseLayer(this.layer);
    this.layer = null;
  }
  /**
   * Take this kind's slot on `layer`, or throw when another live instance of the
   * same kind already holds it. Runs before any subscription, so a rejected
   * instance leaves nothing wired.
   */
  claimLayer(layer) {
    const key = this.kind;
    let held2 = claims.get(layer);
    if (!held2) claims.set(layer, held2 = /* @__PURE__ */ new Map());
    const holder = held2.get(key);
    if (holder && holder !== this) {
      throw new Error(
        `${this.constructor.name} "${this.id}": layer "${layer.id}" already has ${key} "${holder.id}" \u2014 one per layer. Put the band and size options on "${holder.id}" instead.`
      );
    }
    held2.set(key, this);
  }
  /** Give the slot back — only if this instance is the one holding it. */
  releaseLayer(layer) {
    const held2 = claims.get(layer);
    if (held2?.get(this.kind) === this) held2.delete(this.kind);
  }
  onEnable() {
    this.applied = void 0;
    this.schedule(true);
  }
  onDisable() {
    this.cancel();
    this.sweep(true);
    this.applied = void 0;
  }
  // ─── Options ──────────────────────────────────────────────────────────────
  /**
   * A live option patch (band, exemption knobs) re-applies with a full sweep.
   * `enabled` is handled by the base `setOptions` before this runs.
   */
  onOptionsChanged() {
    this.applied = void 0;
    if (this._enabled) this.schedule(true);
  }
  // ─── Scheduling ───────────────────────────────────────────────────────────
  schedule(full) {
    if (!this._enabled) return;
    if (full) this.pendingFull = true;
    if (this.rafHandle !== null) return;
    const raf = typeof requestAnimationFrame === "function" ? requestAnimationFrame : null;
    const run = () => {
      this.rafHandle = null;
      const full2 = this.pendingFull;
      this.pendingFull = false;
      this.apply(full2);
    };
    this.rafHandle = raf ? raf(run) : setTimeout(run, 0);
  }
  cancel() {
    if (this.rafHandle === null) return;
    if (typeof cancelAnimationFrame === "function") cancelAnimationFrame(this.rafHandle);
    else clearTimeout(this.rafHandle);
    this.rafHandle = null;
    this.pendingFull = false;
  }
  // ─── Apply ────────────────────────────────────────────────────────────────
  /**
   * Reconcile visibility to the current camera scale. When `full`, sweep every
   * node regardless of change (covers new nodes / re-enable); otherwise sweep
   * only when the band membership flipped (the zoom hot path).
   */
  apply(full) {
    const scale = this.ctx?.camera.scale;
    if (!this.layer || scale === void 0) return;
    if (full) {
      this.refreshExemptions();
      this.onFullReconcile();
    }
    const vis = inBand(scale, this.band);
    if (!full && this.applied === vis) return;
    this.applied = vis;
    this.sweep(vis);
  }
  /**
   * Set this behaviour's content visibility across every node (or edge, per
   * {@link contentTarget}) in the layer. When the band shows content, everything
   * is shown; when it hides, exempt elements ({@link isExempt}) stay visible.
   */
  sweep(bandVisible) {
    const renderer = this.layer?.getRenderer();
    if (!this.layer || !renderer) return;
    const elements = this.contentTarget === "edges" ? this.layer.store.edges() : this.layer.store.nodes();
    for (const el of elements) {
      const visible = bandVisible || this.isExempt(el.id);
      this.setContentVisible(renderer, el.id, visible);
    }
  }
};

// src/behaviours/labelSize.ts
function fontBound(v) {
  return typeof v === "number" && v > 0 ? v : void 0;
}
function labelSizePolicyOf(opts) {
  const zoomGrowth = opts.zoomGrowth ?? void 0;
  const minFontPx = fontBound(opts.minFontPx);
  const maxFontPx = fontBound(opts.maxFontPx);
  if (zoomGrowth === void 0 && minFontPx === void 0 && maxFontPx === void 0) return null;
  return {
    ...zoomGrowth !== void 0 ? { zoomGrowth } : {},
    ...minFontPx !== void 0 ? { minFontPx } : {},
    ...maxFontPx !== void 0 ? { maxFontPx } : {}
  };
}

// src/behaviours/NodeLabelLODBehaviour.ts
function clampFraction(v) {
  return typeof v === "number" && v > 0 ? Math.min(1, v) : 0;
}
var NodeLabelLODBehaviour = class extends ContentLODBehaviour {
  kind = "node-label-lod";
  /** Node ids currently exempt from hiding (the top-centrality set). */
  exemptIds = /* @__PURE__ */ new Set();
  constructor(opts) {
    super(opts);
  }
  setContentVisible(renderer, id, visible) {
    renderer.setShapeTextVisible(id, visible);
  }
  isExempt(id) {
    return this.exemptIds.has(id);
  }
  /**
   * Recompute the top-centrality exemption set: rank every node by degree
   * (in + out) and keep the top `alwaysShowTop` fraction. O(n log n), but only
   * runs on a full reflow (data change / enable / option change), never per zoom.
   */
  refreshExemptions() {
    this.exemptIds.clear();
    const layer = this.layer;
    const top = clampFraction(this._options.alwaysShowTop);
    if (!layer || top <= 0) return;
    const store = layer.store;
    const ranked = [];
    for (const node of store.nodes()) {
      ranked.push({ id: node.id, degree: store.inDegree(node.id) + store.outDegree(node.id) });
    }
    if (ranked.length === 0) return;
    ranked.sort((a, b) => b.degree - a.degree);
    const k = Math.min(ranked.length, Math.max(1, Math.ceil(ranked.length * top)));
    for (let i = 0; i < k; i++) this.exemptIds.add(ranked[i].id);
  }
  /** Push the node-label size policy (or clear it when no size option is set). */
  onFullReconcile() {
    this.layer?.getRenderer()?.setLabelSizePolicy("shape", labelSizePolicyOf(this._options));
  }
  onDisable() {
    super.onDisable();
    this.layer?.getRenderer()?.setLabelSizePolicy("shape", null);
  }
  onDestroy() {
    this.layer?.getRenderer()?.setLabelSizePolicy("shape", null);
    super.onDestroy();
  }
};

// src/behaviours/EdgeLabelLODBehaviour.ts
var EdgeLabelLODBehaviour = class extends ContentLODBehaviour {
  kind = "edge-label-lod";
  contentTarget = "edges";
  constructor(opts) {
    super(opts);
  }
  setContentVisible(renderer, id, visible) {
    renderer.setConnectorTextVisible(id, visible);
  }
  /** Push the edge-label size policy (or clear it when no size option is set). */
  onFullReconcile() {
    this.layer?.getRenderer()?.setLabelSizePolicy("connector", labelSizePolicyOf(this._options));
  }
  onDisable() {
    super.onDisable();
    this.layer?.getRenderer()?.setLabelSizePolicy("connector", null);
  }
  onDestroy() {
    this.layer?.getRenderer()?.setLabelSizePolicy("connector", null);
    super.onDestroy();
  }
};

// src/behaviours/IconLODBehaviour.ts
var IconLODBehaviour = class extends ContentLODBehaviour {
  kind = "icon-lod";
  setContentVisible(renderer, id, visible) {
    renderer.setShapeIconVisible(id, visible);
  }
};

// src/behaviours/ImageLODBehaviour.ts
var ImageLODBehaviour = class extends ContentLODBehaviour {
  kind = "image-lod";
  setContentVisible(renderer, id, visible) {
    renderer.setShapeImageVisible(id, visible);
  }
};
function resolveOptions13(prev, patch) {
  const base = prev ?? {
    minZoom: 0.5,
    keepFraction: 0.1,
    keepBy: "sample",
    weightKey: void 0
  };
  return {
    minZoom: patch.minZoom ?? base.minZoom,
    keepFraction: clampFraction2(patch.keepFraction ?? base.keepFraction),
    keepBy: patch.keepBy ?? base.keepBy,
    weightKey: "weightKey" in patch ? patch.weightKey : base.weightKey
  };
}
function clampFraction2(v) {
  return typeof v === "number" && v > 0 ? Math.min(1, v) : 1;
}
function hashUnit(id) {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967296;
}
var EdgeLODBehaviour = class extends Behaviour {
  kind = "edge-lod";
  /** Bound target layer — resolved in `onRegister`. */
  layer = null;
  opts;
  /** Subscription disposers, called in `onDestroy`. */
  subs = [];
  /** Edges eligible to be hidden when thinned (everything outside the kept set). */
  thinnable = /* @__PURE__ */ new Set();
  /** Edges *we* hid (weren't already user-hidden) — so restore only touches ours. */
  hiddenByUs = /* @__PURE__ */ new Set();
  /** Last-applied thinned state. `undefined` = not yet applied. */
  applied;
  /** RAF-coalescing handle. */
  rafHandle = null;
  /** A pending scheduled apply must recompute the thinnable set (data / (re-)enable). */
  pendingFull = false;
  constructor(opts) {
    super({ ...opts, shortcuts: opts.shortcuts ?? [] });
    this.opts = resolveOptions13(null, opts);
  }
  // ─── Lifecycle ────────────────────────────────────────────────────────────
  onRegister(ctx) {
    const layer = ctx.layers.get(this.targetLayerId);
    if (!layer) {
      throw new Error(
        `EdgeLODBehaviour "${this.id}": layer "${this.targetLayerId}" not found. Add the GraphLayer before registering this behaviour.`
      );
    }
    this.layer = layer;
    this.subs.push(
      ctx.events.on("input:camera:zoom", () => this.schedule(false)),
      layer.events.on("data:changed", () => this.schedule(true))
    );
    if (this._enabled) this.schedule(true);
  }
  onDestroy() {
    this.cancel();
    this.show();
    for (const off of this.subs) off();
    this.subs.length = 0;
    this.thinnable.clear();
    this.applied = void 0;
    this.layer = null;
  }
  onEnable() {
    this.applied = void 0;
    this.schedule(true);
  }
  onDisable() {
    this.cancel();
    this.show();
    this.applied = void 0;
  }
  // ─── Public API ───────────────────────────────────────────────────────────
  /** Read-only snapshot of resolved options. */
  get options() {
    return this.opts;
  }
  /** Runtime option update — re-applies immediately (a full pass) if enabled. */
  setOptions(patch) {
    this.recordOptions(patch);
    this.opts = resolveOptions13(this.opts, patch);
    this.applied = void 0;
    if (this._enabled) this.schedule(true);
  }
  // ─── Scheduling ───────────────────────────────────────────────────────────
  schedule(full) {
    if (!this._enabled) return;
    if (full) this.pendingFull = true;
    if (this.rafHandle !== null) return;
    const raf = typeof requestAnimationFrame === "function" ? requestAnimationFrame : null;
    const run = () => {
      this.rafHandle = null;
      const full2 = this.pendingFull;
      this.pendingFull = false;
      this.apply(full2);
    };
    this.rafHandle = raf ? raf(run) : setTimeout(run, 0);
  }
  cancel() {
    if (this.rafHandle === null) return;
    if (typeof cancelAnimationFrame === "function") cancelAnimationFrame(this.rafHandle);
    else clearTimeout(this.rafHandle);
    this.rafHandle = null;
    this.pendingFull = false;
  }
  // ─── Apply ────────────────────────────────────────────────────────────────
  apply(full) {
    const scale = this.ctx?.camera.scale;
    if (!this.layer || scale === void 0) return;
    const thinned = scale < this.opts.minZoom;
    if (full) {
      this.show();
      this.computeThinnable();
      this.applied = thinned;
      if (thinned) this.hide();
      return;
    }
    if (this.applied === thinned) return;
    this.applied = thinned;
    if (thinned) this.hide();
    else this.show();
  }
  /** Recompute the thinnable set — every edge outside the top `keepFraction`. */
  computeThinnable() {
    this.thinnable.clear();
    const layer = this.layer;
    if (!layer) return;
    const store = layer.store;
    const { keepFraction, keepBy } = this.opts;
    if (keepFraction >= 1) return;
    if (keepBy === "sample") {
      for (const e of store.edges()) {
        if (hashUnit(e.id) >= keepFraction) this.thinnable.add(e.id);
      }
      return;
    }
    const ranked = [];
    for (const e of store.edges()) {
      const score = keepBy === "weight" ? this.weightOf(e) : store.inDegree(e.source) + store.outDegree(e.source) + store.inDegree(e.target) + store.outDegree(e.target);
      ranked.push({ id: e.id, score });
    }
    ranked.sort((a, b) => b.score - a.score);
    const keepCount = Math.ceil(ranked.length * keepFraction);
    for (let i = keepCount; i < ranked.length; i++) this.thinnable.add(ranked[i].id);
  }
  weightOf(edge) {
    const key = this.opts.weightKey;
    if (key === void 0) return 0;
    const v = edge.data?.[key];
    return typeof v === "number" && Number.isFinite(v) ? v : 0;
  }
  /** Hide the thinnable edges we don't already find hidden (recording which). */
  hide() {
    const store = this.layer?.store;
    if (!store) return;
    const toHide = [];
    for (const id of this.thinnable) {
      if (!store.isEdgeHidden(id)) toHide.push(id);
    }
    if (toHide.length === 0) return;
    store.internal.hideEdges(toHide);
    for (const id of toHide) this.hiddenByUs.add(id);
  }
  /** Un-hide only the edges we hid (leaving any user-hidden edges alone). */
  show() {
    const store = this.layer?.store;
    if (!store || this.hiddenByUs.size === 0) return;
    store.internal.showEdges(this.hiddenByUs);
    this.hiddenByUs.clear();
  }
};

// src/theme/accent.ts
function cssColorToNumber(input) {
  if (!input) return void 0;
  const s = input.trim();
  if (s.startsWith("#")) {
    let hex = s.slice(1);
    if (hex.length === 3) {
      hex = hex.split("").map((c) => c + c).join("");
    }
    if (hex.length === 6 || hex.length === 8) {
      const n = Number.parseInt(hex.slice(0, 6), 16);
      return Number.isNaN(n) ? void 0 : n;
    }
    return void 0;
  }
  const m = s.match(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i);
  if (m) {
    const r = Number(m[1]) & 255;
    const g = Number(m[2]) & 255;
    const b = Number(m[3]) & 255;
    return r << 16 | g << 8 | b;
  }
  return void 0;
}
function resolveAccentVar(varName = "--color-primary") {
  if (typeof document === "undefined" || typeof getComputedStyle !== "function") return void 0;
  const root = document.documentElement;
  if (!root) return void 0;
  const raw = getComputedStyle(root).getPropertyValue(varName);
  return cssColorToNumber(raw);
}

// src/theme/family.ts
function themeFamily(themeId) {
  if (!themeId) return "default";
  const s = themeId.toLowerCase().trim().replace(/^(light|dark)[-_]/, "").replace(/[-_](light|dark)$/, "");
  return s || "default";
}

// src/behaviours/ThemeBehaviour.ts
var ThemeBehaviour = class extends Behaviour {
  kind = "theme";
  themes;
  active;
  fallback;
  mode;
  accent;
  accentVar;
  light;
  dark;
  mediaQuery = null;
  mediaListener = null;
  /** Armed only in `'document'` mode — watches `<html>`'s theme attributes. */
  documentObserver = null;
  constructor(opts) {
    super({ ...opts, shortcuts: opts.shortcuts ?? [] });
    this.fallback = opts.fallback ?? "default";
    this.themes = { ...BUILT_IN_THEMES, ...opts.themes };
    this.active = opts.active ?? this.fallback;
    this.mode = opts.mode ?? "system";
    this.accent = opts.accent;
    this.accentVar = opts.accentVar ?? "--color-primary";
    this.light = opts.light;
    this.dark = opts.dark;
  }
  // ─── Lifecycle ────────────────────────────────────────────────────────────
  onRegister(_ctx) {
  }
  onEnable() {
    this.wireSources();
    this.apply();
  }
  onDisable() {
    this.detachSources();
  }
  onDestroy() {
    this.detachSources();
  }
  // ─── Public API (driven by `canvas.update({ behaviours: { theme: … } })`) ──
  /** Patch options and re-publish (when enabled). */
  setOptions(patch) {
    this.recordOptions(patch);
    if (patch.themes) this.themes = { ...BUILT_IN_THEMES, ...patch.themes };
    if (patch.fallback !== void 0) this.fallback = patch.fallback;
    if (patch.active !== void 0) this.active = patch.active;
    if (patch.mode !== void 0) this.mode = patch.mode;
    if ("accent" in patch) this.accent = patch.accent;
    if (patch.accentVar !== void 0) this.accentVar = patch.accentVar;
    if ("light" in patch) this.light = patch.light;
    if ("dark" in patch) this.dark = patch.dark;
    if (!this.isEnabled) return;
    this.wireSources();
    this.apply();
  }
  /** Switch mode. Re-publishes immediately when enabled. */
  setMode(mode) {
    this.setOptions({ mode });
  }
  /** Switch the active theme by name. Re-publishes immediately when enabled. */
  setTheme(name) {
    this.setOptions({ active: name });
  }
  getMode() {
    return this.mode;
  }
  /**
   * The **pinned** theme name (the option), not the resolved one — in
   * `'document'` mode the page's family may win. Read the published
   * `ResolvedTheme.name` for what is actually on screen.
   */
  getActiveName() {
    return this.active;
  }
  /** Concrete kind currently resolved from {@link mode}. */
  getResolvedKind() {
    return this.resolveKind();
  }
  // ─── Internals ────────────────────────────────────────────────────────────
  /** Resolve + publish the theme onto `ctx.theme` (emits `'theme:change'`). */
  apply() {
    const ctx = this.ctx;
    if (!ctx) return;
    const kind = this.resolveKind();
    const activeName = this.resolveActiveName();
    if (this.light || this.dark) {
      const patch = kind === "dark" ? this.dark : this.light;
      if (patch && this.targetLayerId) {
        const layer = ctx.layers.get(this.targetLayerId);
        layer?.setOptions?.(patch);
      }
      ctx.theme.set({ kind, name: activeName, palette: {} });
      return;
    }
    const theme = this.themes[activeName] ?? this.themes[this.fallback] ?? DEFAULT_THEME;
    const variant = kind === "dark" ? theme.dark : theme.light;
    const { categorical, ...roles } = variant;
    const palette = { ...roles };
    const accent = this.resolveAccent();
    if (accent !== void 0) palette.accent = accent;
    const resolved = { kind, name: theme.name, palette, categorical };
    ctx.theme.set(resolved);
  }
  /** Resolve the live accent colour, if configured. */
  resolveAccent() {
    if (this.accent === void 0) return void 0;
    if (typeof this.accent === "number") return this.accent;
    return resolveAccentVar(this.accentVar);
  }
  /**
   * SSR-safe kind resolution. `'system'` consults the media query, `'document'`
   * the host page, `'light'`/`'dark'` answer themselves.
   */
  resolveKind() {
    if (this.mode === "light" || this.mode === "dark") return this.mode;
    if (this.mode === "document") return this.readDocumentVariant().kind;
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
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
  readDocumentVariant() {
    if (typeof document === "undefined" || !document.documentElement) return { kind: "light" };
    const root = document.documentElement;
    const attr = root.getAttribute("data-theme");
    if (attr) {
      const kind = /-dark$/.test(attr.trim().toLowerCase()) ? "dark" : "light";
      return { kind, family: themeFamily(attr) };
    }
    return { kind: root.classList.contains("dark") ? "dark" : "light" };
  }
  /**
   * The theme name to resolve the palette from. Normally the pinned `active`; in
   * `'document'` mode the page's own family wins **when this engine has a theme
   * by that name** — so a host on `ocean` recolours the canvas to `ocean`, while
   * a host family with no engine counterpart (`tailwind`, `vite`) leaves `active`
   * in charge rather than falling through to `fallback`.
   */
  resolveActiveName() {
    if (this.mode !== "document") return this.active;
    const { family } = this.readDocumentVariant();
    return family && this.themes[family] ? family : this.active;
  }
  /**
   * Arm exactly the listener the current {@link mode} needs and disarm the other:
   * the media query in `'system'`, the document observer in `'document'`, neither
   * when the kind is pinned. Idempotent — safe to call on every `setOptions`.
   */
  wireSources() {
    this.wireMediaQuery();
    this.wireDocumentObserver();
  }
  /** Drop both listeners (disable / destroy). */
  detachSources() {
    this.detachMediaQuery();
    this.detachDocumentObserver();
  }
  /**
   * Observe the host page's theme attributes while in `'document'` mode. Scoped
   * to `<html>`'s `class` + `data-theme` (`attributeFilter`) so an unrelated DOM
   * mutation can't cost a republish, and `subtree: false` — the variant lives on
   * the root element only.
   */
  wireDocumentObserver() {
    if (this.mode !== "document") {
      this.detachDocumentObserver();
      return;
    }
    if (this.documentObserver) return;
    if (typeof document === "undefined" || typeof MutationObserver !== "function") return;
    if (!document.documentElement) return;
    this.documentObserver = new MutationObserver(() => {
      if (this.mode === "document" && this.isEnabled) this.apply();
    });
    this.documentObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme"],
      subtree: false
    });
  }
  detachDocumentObserver() {
    this.documentObserver?.disconnect();
    this.documentObserver = null;
  }
  /** Arm the `prefers-color-scheme` listener while in `'system'` mode. */
  wireMediaQuery() {
    if (this.mode !== "system") {
      this.detachMediaQuery();
      return;
    }
    if (this.mediaQuery) return;
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    this.mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    this.mediaListener = () => {
      if (this.mode === "system" && this.isEnabled) this.apply();
    };
    this.mediaQuery.addEventListener("change", this.mediaListener);
  }
  detachMediaQuery() {
    if (this.mediaQuery && this.mediaListener) {
      this.mediaQuery.removeEventListener("change", this.mediaListener);
    }
    this.mediaQuery = null;
    this.mediaListener = null;
  }
};
var NODE_EFFECT_KIND = "fade-in";
var EDGE_EFFECT_KIND = "fade-in-connector";
function resolveOptions14(prev, patch) {
  const base = prev ?? {
    durationMs: 320,
    staggerMs: 24,
    maxStaggerMs: 600,
    order: "x",
    includeEdges: true,
    easing: "easeOutCubic"
  };
  return {
    durationMs: Math.max(1, patch.durationMs ?? base.durationMs),
    staggerMs: Math.max(0, patch.staggerMs ?? base.staggerMs),
    maxStaggerMs: Math.max(0, patch.maxStaggerMs ?? base.maxStaggerMs),
    order: patch.order ?? base.order,
    includeEdges: patch.includeEdges ?? base.includeEdges,
    easing: patch.easing ?? base.easing
  };
}
function withoutEffect(effects, kind) {
  const out = {};
  for (const key of Object.keys(effects)) {
    if (key !== kind) out[key] = effects[key];
  }
  return out;
}
var EntranceBehaviour = class extends Behaviour {
  kind = "entrance";
  layer = null;
  opts;
  subs = [];
  /** Ids currently carrying an effect this behaviour wrote — what {@link clear} undoes. */
  painted = { nodes: [], edges: [] };
  cleanupTimer;
  played = false;
  /**
   * `true` once the active layout has reported a settled run. Gates
   * {@link onEnable}: before it, the nodes have no meaningful positions, so a
   * position-ordered sweep would be noise.
   */
  layoutSettled = false;
  constructor(opts) {
    super({ ...opts, shortcuts: opts.shortcuts ?? [] });
    this.opts = resolveOptions14(null, opts);
  }
  // ─── Lifecycle ────────────────────────────────────────────────────────────
  onRegister(ctx) {
    const layer = ctx.layers.get(this.targetLayerId);
    if (!layer) {
      throw new Error(
        `EntranceBehaviour "${this.id}": layer "${this.targetLayerId}" not found. Add the GraphLayer before registering this behaviour.`
      );
    }
    this.layer = layer;
    this.subs.push(
      ctx.events.on("layout:run:end", ({ id, reason }) => {
        if (reason !== "settled") return;
        if (id !== ctx.store.view.getState().definition.activeLayout) return;
        this.layoutSettled = true;
        this.play();
      })
    );
    this.subs.push(
      layer.events.on("data:changed", () => {
        if (ctx.store.view.getState().definition.activeLayout) return;
        this.play();
      })
    );
  }
  onEnable() {
    if (!this.layer || this.layer.store.nodeCount() === 0) return;
    const activeLayout = this.ctx?.store.view.getState().definition.activeLayout;
    if (activeLayout && !this.layoutSettled) return;
    this.play();
  }
  onDisable() {
    this.clear();
  }
  onDestroy() {
    this.clear();
    for (const off of this.subs.splice(0)) off();
    this.layer = null;
  }
  onOptionsChanged(patch) {
    this.opts = resolveOptions14(this.opts, patch);
  }
  // ─── Public API ───────────────────────────────────────────────────────────
  /** The fully-resolved option set in use, every default filled in. */
  getResolvedOptions() {
    return this.opts;
  }
  /**
   * Play the entrance again — the escape hatch for a "preview" button in a
   * settings panel, and for a consumer who re-seeds a canvas with new data and
   * wants it to arrive rather than cut.
   */
  replay() {
    this.clear();
    this.played = false;
    this.play();
  }
  // ─── Internals ────────────────────────────────────────────────────────────
  /** Write one staggered fade per element. Once per enable; a no-op when empty. */
  play() {
    if (this.played || !this.isEnabled || !this.layer) return;
    const store = this.layer.store;
    const ids = [...store.nodes()].map((n) => n.id);
    if (ids.length === 0) return;
    this.played = true;
    const { durationMs, includeEdges, easing } = this.opts;
    const delayOf = this.buildDelays(ids);
    let lastDelayMs = 0;
    for (const id of ids) {
      const prev = store.getNode(id)?.style ?? {};
      const delayMs = delayOf(id);
      if (delayMs > lastDelayMs) lastDelayMs = delayMs;
      store.internal.updateNode(id, {
        style: {
          ...prev,
          // Effects are replaced wholesale, so carry any the consumer set.
          effects: { ...prev.effects ?? {}, [NODE_EFFECT_KIND]: { durationMs, delayMs, easing } }
        }
      });
      this.painted.nodes.push(id);
    }
    if (includeEdges) {
      for (const edge of store.edges()) {
        const prev = edge.style ?? {};
        const delayMs = Math.max(delayOf(edge.source), delayOf(edge.target));
        if (delayMs > lastDelayMs) lastDelayMs = delayMs;
        store.internal.updateEdge(edge.id, {
          style: {
            ...prev,
            effects: {
              ...prev.effects ?? {},
              [EDGE_EFFECT_KIND]: { durationMs, delayMs, easing }
            }
          }
        });
        this.painted.edges.push(edge.id);
      }
    }
    this.cleanupTimer = setTimeout(() => {
      this.cleanupTimer = void 0;
      this.clear();
    }, durationMs + lastDelayMs + 120);
  }
  /**
   * Per-item delay, by rank along the chosen axis.
   *
   * The step is `staggerMs`, compressed so the whole sweep fits inside
   * `maxStaggerMs` — the difference between a 10-node graph (which should feel
   * like a sweep) and a 2,000-node one (which should not feel like a wait).
   */
  buildDelays(ids) {
    const { order, staggerMs, maxStaggerMs } = this.opts;
    if (order === "none" || staggerMs === 0 || ids.length < 2) return () => 0;
    const store = this.layer.store;
    const axis = order === "x" ? "x" : "y";
    const ranked = [...ids].sort((a, b) => {
      const pa = store.getPosition(a)?.[axis] ?? 0;
      const pb = store.getPosition(b)?.[axis] ?? 0;
      return pa - pb;
    });
    const step = Math.min(staggerMs, maxStaggerMs / (ranked.length - 1));
    const delays = /* @__PURE__ */ new Map();
    ranked.forEach((id, i) => delays.set(id, Math.round(i * step)));
    return (id) => delays.get(id) ?? 0;
  }
  /** Remove every effect this behaviour wrote, leaving any others in place. */
  clear() {
    if (this.cleanupTimer !== void 0) {
      clearTimeout(this.cleanupTimer);
      this.cleanupTimer = void 0;
    }
    const store = this.layer?.store;
    if (!store) {
      this.painted.nodes.length = 0;
      this.painted.edges.length = 0;
      return;
    }
    for (const id of this.painted.nodes.splice(0)) {
      const prev = store.getNode(id)?.style ?? {};
      if (!prev.effects) continue;
      store.internal.updateNode(id, {
        style: { ...prev, effects: withoutEffect(prev.effects, NODE_EFFECT_KIND) }
      });
    }
    for (const id of this.painted.edges.splice(0)) {
      const prev = store.getEdge(id)?.style ?? {};
      if (!prev.effects) continue;
      store.internal.updateEdge(id, {
        style: { ...prev, effects: withoutEffect(prev.effects, EDGE_EFFECT_KIND) }
      });
    }
  }
};

// src/nodes/composite/base.ts
var CompositeCard = class {
  /** The card's full, resolved configuration. Mutable — edit to re-style. */
  spec;
  constructor(spec) {
    this.spec = spec;
  }
  /** Build the composite spec for one node's data (+ optional per-call opts). */
  build(data, opts) {
    const o = opts ?? {};
    const parts = this.parts(data, o);
    const f = this.frame(data, parts, o);
    return {
      kind: "composite",
      width: f.width,
      height: f.height,
      ...f.cornerRadius !== void 0 ? { cornerRadius: f.cornerRadius } : {},
      fill: f.fill,
      ...f.stroke ? { stroke: f.stroke } : {},
      ...f.clip ? { clip: true } : {},
      parts
    };
  }
};

// src/nodes/composite/shared.ts
var iconifyUrl = (id) => `https://api.iconify.design/${id}.svg`;
var CARD_BG = 988970;
var CARD_STROKE = 3359061;
function metaRow(parts, o) {
  const size = o.iconSize ?? 14;
  const gap = o.gap ?? 8;
  const fontSize = o.fontSize ?? 12;
  parts.push({ part: "icon", x: o.x, y: o.y, size, icon: { kind: "svg-url", url: iconifyUrl(o.icon), color: o.iconColor, strokeWidth: 2 } });
  const tx = o.x + size + gap;
  parts.push({ part: "label", x: tx, y: o.y + size / 2, vAnchor: "middle", text: o.text, fontSize, fill: o.textColor, maxWidth: o.x + o.width - tx, maxLines: 1, overflow: "ellipsis" });
}
function chip(parts, o) {
  const h = o.height ?? 18;
  const fontSize = o.fontSize ?? 11;
  const w = o.text.length * (fontSize * 0.59) + 16;
  parts.push({ part: "rect", x: o.x, y: o.y, width: w, height: h, cornerRadius: o.cornerRadius ?? h / 2, fill: o.color, fillAlpha: o.alpha ?? 0.2 });
  parts.push({ part: "label", x: o.x + w / 2, y: o.y + h / 2, anchor: "center", vAnchor: "middle", text: o.text, fontSize, fontWeight: 600, fill: o.color });
  return w;
}

// src/nodes/composite/schemaTableCard.ts
var SCHEMA_TABLE_CARD_DEFAULTS = {
  width: 210,
  headerHeight: 38,
  rowHeight: 26,
  cornerRadius: 8,
  padding: 12,
  typeColWidth: 64,
  bg: CARD_BG,
  stroke: CARD_STROKE,
  headerColor: 2450411,
  titleColor: 16777215,
  nameColor: 14870768,
  typeColor: 6583435,
  rowHoverColor: 16777215,
  rowHoverAlpha: 0.13
};
var SchemaTableCard = class extends CompositeCard {
  constructor(spec = {}) {
    super({ ...SCHEMA_TABLE_CARD_DEFAULTS, ...spec });
  }
  /** Colour-coded chip glyph + colour for a field's data type. Override to remap. */
  typeChip(type) {
    switch (type.toLowerCase()) {
      case "string":
      case "text":
      case "varchar":
      case "uuid":
        return { char: "Abc", color: 3900150 };
      case "number":
      case "float":
        return { char: "#", color: 2278750 };
      case "integer":
      case "int":
        return { char: "123", color: 2278750 };
      case "date":
      case "datetime":
      case "timestamp":
        return { char: "\u25F7", color: 16096779 };
      case "boolean":
      case "bool":
        return { char: "01", color: 11032055 };
      default:
        return { char: "\u2022", color: 6583435 };
    }
  }
  /** Header band (icon + title). */
  header(data, parts) {
    const { width, headerHeight: H, padding: PAD, titleColor } = this.spec;
    parts.push({ part: "rect", x: 0, y: 0, width, height: H, fill: data.header ?? this.spec.headerColor });
    let titleX = PAD;
    if (data.icon) {
      const box = 20;
      parts.push({ part: "icon", x: PAD, y: (H - box) / 2, size: box, icon: { kind: "svg-url", url: iconifyUrl(data.icon), color: titleColor, strokeWidth: 2 } });
      titleX = PAD + box + 8;
    }
    parts.push({ part: "label", x: titleX, y: H / 2, vAnchor: "middle", text: data.label, fontSize: 14, fontWeight: 700, fill: titleColor, maxWidth: width - titleX - PAD, maxLines: 1, overflow: "ellipsis" });
  }
  /** One field row (chip + name + type). */
  row(field, index, active, parts) {
    const { width: W, padding: PAD, rowHeight: RH, headerHeight, typeColWidth, nameColor, typeColor, rowHoverColor, rowHoverAlpha } = this.spec;
    const rowY = headerHeight + index * RH;
    parts.push({ part: "rect", x: 2, y: rowY, width: W - 4, height: RH, cornerRadius: 4, fill: rowHoverColor, fillAlpha: active ? rowHoverAlpha : 0, hitId: String(index) });
    const chipBox = 16;
    const chipY = rowY + (RH - chipBox) / 2;
    const chip2 = this.typeChip(field.type);
    parts.push({ part: "rect", x: PAD, y: chipY, width: chipBox, height: chipBox, cornerRadius: 3, fill: chip2.color });
    parts.push({ part: "label", x: PAD + chipBox / 2, y: chipY + chipBox / 2, anchor: "center", vAnchor: "middle", text: chip2.char, fontSize: 8, fontWeight: 700, fill: 16777215 });
    const nameX = PAD + chipBox + 8;
    parts.push({ part: "label", x: nameX, y: rowY + RH / 2, vAnchor: "middle", text: field.name, fontSize: 13, fill: nameColor, maxWidth: W - nameX - PAD - typeColWidth, maxLines: 1, overflow: "ellipsis" });
    parts.push({ part: "label", x: W - PAD, y: rowY + RH / 2, anchor: "right", vAnchor: "middle", text: field.type, fontSize: 11, fill: typeColor, maxWidth: typeColWidth, maxLines: 1, overflow: "ellipsis" });
  }
  parts(data, opts) {
    const parts = [];
    const active = opts.hoverRow ?? -1;
    this.header(data, parts);
    data.fields.forEach((f, i) => this.row(f, i, i === active, parts));
    return parts;
  }
  frame(data) {
    const { width, headerHeight, rowHeight, bg, stroke, cornerRadius } = this.spec;
    return {
      width,
      height: headerHeight + data.fields.length * rowHeight + 6,
      fill: bg,
      stroke: { color: stroke, width: 1 },
      cornerRadius,
      clip: true
    };
  }
};
var DEFAULT = new SchemaTableCard();
function schemaTableCard(data, opts) {
  return DEFAULT.build(data, opts);
}

// src/nodes/composite/userCard.ts
var STATUS_COLOR = {
  online: 2278750,
  away: 16096779,
  offline: 6583435
};
var USER_CARD_DEFAULTS = {
  width: 250,
  padding: 16,
  avatarRadius: 22,
  contactRowHeight: 28,
  cornerRadius: 12,
  accentHeight: 4,
  bg: CARD_BG,
  stroke: CARD_STROKE,
  nameColor: 15857145,
  roleColor: 9741240,
  contactColor: 13358561,
  contactIconColor: 9741240
};
var UserCard = class extends CompositeCard {
  constructor(spec = {}) {
    super({ ...USER_CARD_DEFAULTS, ...spec });
  }
  /** Top accent bar (avatar colour). Set `spec.accentHeight = 0` or override to hide. */
  topAccent(data, parts) {
    if (this.spec.accentHeight > 0) parts.push({ part: "rect", x: 0, y: 0, width: this.spec.width, height: this.spec.accentHeight, fill: data.avatar });
  }
  /** Avatar disc + initials + status dot. */
  avatar(data, parts) {
    const { padding, avatarRadius: r, bg } = this.spec;
    const acx = padding + r;
    const acy = padding + r;
    parts.push({ part: "circle", x: acx, y: acy, radius: r, fill: data.avatar });
    parts.push({ part: "label", x: acx, y: acy, anchor: "center", vAnchor: "middle", text: data.initials, fontSize: 15, fontWeight: 700, fill: 16777215 });
    if (data.status) {
      parts.push({ part: "circle", x: acx + 15, y: acy + 15, radius: 7, fill: bg });
      parts.push({ part: "circle", x: acx + 15, y: acy + 15, radius: 4.5, fill: STATUS_COLOR[data.status] });
    }
  }
  /** Name + role, beside the avatar. */
  identity(data, parts) {
    const { padding, avatarRadius, width, nameColor, roleColor } = this.spec;
    const textX = padding + avatarRadius * 2 + 14;
    parts.push({ part: "label", x: textX, y: padding + 6, text: data.name, fontSize: 15, fontWeight: 700, fill: nameColor, maxWidth: width - textX - padding, maxLines: 1, overflow: "ellipsis" });
    parts.push({ part: "label", x: textX, y: padding + 26, text: data.role, fontSize: 12, fill: roleColor, maxWidth: width - textX - padding, maxLines: 1, overflow: "ellipsis" });
  }
  /** The contact rows this card renders (mail / phone), in order. */
  contactRows(data) {
    const rows = [];
    if (data.email) rows.push({ icon: "lucide/mail", text: data.email });
    if (data.phone) rows.push({ icon: "lucide/phone", text: data.phone });
    return rows;
  }
  /** Y of the divider (below the avatar block). */
  dividerY() {
    return this.spec.padding + this.spec.avatarRadius * 2 + 8;
  }
  /** Contact rows (icon + text) below the divider. */
  contacts(data, parts) {
    const { padding, width, contactRowHeight: RH, contactColor, contactIconColor } = this.spec;
    const startY = this.dividerY() + 12;
    this.contactRows(data).forEach((r, i) => {
      const y = startY + i * RH;
      parts.push({ part: "icon", x: padding, y, size: 16, icon: { kind: "svg-url", url: iconifyUrl(r.icon), color: contactIconColor, strokeWidth: 2 } });
      const tx = padding + 16 + 10;
      parts.push({ part: "label", x: tx, y: y + 2, text: r.text, fontSize: 12, fill: contactColor, maxWidth: width - tx - padding, maxLines: 1, overflow: "ellipsis" });
    });
  }
  parts(data) {
    const parts = [];
    this.topAccent(data, parts);
    this.avatar(data, parts);
    this.identity(data, parts);
    const divY = this.dividerY();
    parts.push({ part: "line", x: this.spec.padding, y: divY, x2: this.spec.width - this.spec.padding, y2: divY, stroke: { color: this.spec.stroke, width: 1 } });
    this.contacts(data, parts);
    return parts;
  }
  frame(data) {
    const { width, padding, contactRowHeight, bg, stroke, cornerRadius } = this.spec;
    const height = this.dividerY() + 12 + this.contactRows(data).length * contactRowHeight + padding - 6;
    return { width, height, fill: bg, stroke: { color: stroke, width: 1 }, cornerRadius, clip: true };
  }
};
var DEFAULT2 = new UserCard();
function userCard(data) {
  return DEFAULT2.build(data);
}

// src/nodes/composite/statCard.ts
var STAT_CARD_DEFAULTS = {
  width: 210,
  height: 120,
  padding: 16,
  cornerRadius: 12,
  accentWidth: 4,
  bg: CARD_BG,
  stroke: CARD_STROKE,
  captionColor: 9741240,
  valueColor: 15857145,
  upColor: 2278750,
  downColor: 16007006
};
var StatCard = class extends CompositeCard {
  constructor(spec = {}) {
    super({ ...STAT_CARD_DEFAULTS, ...spec });
  }
  /** Left accent bar (clipped to the card corners). */
  accentBar(data, parts) {
    if (this.spec.accentWidth > 0) parts.push({ part: "rect", x: 0, y: 0, width: this.spec.accentWidth, height: this.spec.height, fill: data.accent });
  }
  /** Upper-left caption. */
  caption(data, parts) {
    const { padding, width, captionColor } = this.spec;
    parts.push({ part: "label", x: padding, y: padding, text: data.label.toUpperCase(), fontSize: 11, fontWeight: 600, fill: captionColor, maxWidth: width - padding * 2 - 40, maxLines: 1, overflow: "ellipsis" });
  }
  /** Accent-tinted icon chip (top-right). */
  iconChip(data, parts) {
    if (!data.icon) return;
    const { width, padding } = this.spec;
    const chip2 = 30;
    const chipX = width - padding - chip2;
    parts.push({ part: "rect", x: chipX, y: padding - 4, width: chip2, height: chip2, cornerRadius: 8, fill: data.accent, fillAlpha: 0.18 });
    parts.push({ part: "icon", x: chipX, y: padding - 4, size: chip2, icon: { kind: "svg-url", url: iconifyUrl(data.icon), color: data.accent, strokeWidth: 2, sizeRatio: 0.5 } });
  }
  /** The big value. */
  value(data, parts) {
    const { padding, width, valueColor } = this.spec;
    parts.push({ part: "label", x: padding, y: 48, text: data.value, fontSize: 26, fontWeight: 700, fill: valueColor, maxWidth: width - padding * 2, maxLines: 1, overflow: "ellipsis" });
  }
  /** Trend-delta row (glyph + text). */
  delta(data, parts) {
    if (!data.delta) return;
    const { padding, width, height, upColor, downColor } = this.spec;
    const color2 = data.trend === "down" ? downColor : upColor;
    const glyph = data.trend === "down" ? "\u25BC" : "\u25B2";
    parts.push({ part: "label", x: padding, y: height - padding - 6, text: glyph, fontSize: 9, fill: color2 });
    parts.push({ part: "label", x: padding + 14, y: height - padding - 8, text: `${data.delta} vs last month`, fontSize: 12, fontWeight: 600, fill: color2, maxWidth: width - padding * 2 - 14, maxLines: 1, overflow: "ellipsis" });
  }
  parts(data) {
    const parts = [];
    this.accentBar(data, parts);
    this.caption(data, parts);
    this.iconChip(data, parts);
    this.value(data, parts);
    this.delta(data, parts);
    return parts;
  }
  frame() {
    const { width, height, bg, stroke, cornerRadius } = this.spec;
    return { width, height, fill: bg, stroke: { color: stroke, width: 1 }, cornerRadius, clip: true };
  }
};
var DEFAULT3 = new StatCard();
function statCard(data) {
  return DEFAULT3.build(data);
}

// src/nodes/composite/taskCard.ts
var TASK_CARD_DEFAULTS = {
  width: 230,
  height: 130,
  padding: 14,
  cornerRadius: 12,
  accentHeight: 4,
  chipRadius: 9,
  bg: CARD_BG,
  stroke: CARD_STROKE,
  titleColor: 15857145,
  priorityColors: { high: 16007006, med: 16096779, low: 6583435 },
  priorityLabels: { high: "High", med: "Medium", low: "Low" }
};
var TaskCard = class extends CompositeCard {
  constructor(spec = {}) {
    super({ ...TASK_CARD_DEFAULTS, ...spec });
  }
  /**
   * A rounded pill chip. Delegates to the shared {@link chip} builder so every
   * pill in the catalogue measures and centres identically — there used to be
   * two implementations here and they drifted apart.
   */
  pill(parts, x, y, text, color2) {
    return chip(parts, { x, y, text, color: color2, cornerRadius: this.spec.chipRadius });
  }
  /** Bottom accent bar (priority colour). */
  bottomAccent(data, parts) {
    if (this.spec.accentHeight > 0) parts.push({ part: "rect", x: 0, y: this.spec.height - this.spec.accentHeight, width: this.spec.width, height: this.spec.accentHeight, fill: this.spec.priorityColors[data.priority] });
  }
  /** Title (wraps to 2 lines) + the priority pill top-right. */
  title(data, parts) {
    const { width, padding, titleColor, priorityColors, priorityLabels } = this.spec;
    const pText = priorityLabels[data.priority];
    const pw = this.pill(parts, width - padding - pText.length * 6.5 - 16, padding, pText, priorityColors[data.priority]);
    parts.push({ part: "label", x: padding, y: padding, text: data.title, fontSize: 14, fontWeight: 700, fill: titleColor, align: "left", maxWidth: width - padding * 2 - pw - 8, maxLines: 2, overflow: "ellipsis", lineHeight: 18 });
  }
  /** Tag chips, left → right. */
  tags(data, parts) {
    let tx = this.spec.padding;
    const y = this.spec.padding + 44;
    for (const tag of data.tags ?? []) tx += this.pill(parts, tx, y, tag.label, tag.color) + 6;
  }
  /** Footer: assignee avatar (left) + due date (right). */
  footer(data, footY, parts) {
    const { width, padding } = this.spec;
    if (data.assignee) {
      parts.push({ part: "circle", x: padding + 12, y: footY + 10, radius: 12, fill: data.assignee.color });
      parts.push({ part: "label", x: padding + 12, y: footY + 10, anchor: "center", vAnchor: "middle", text: data.assignee.initials, fontSize: 10, fontWeight: 700, fill: 16777215 });
    }
    if (data.due) {
      parts.push({ part: "icon", x: width - padding - 78, y: footY + 4, size: 14, icon: { kind: "svg-url", url: iconifyUrl("lucide/calendar"), color: 9741240, strokeWidth: 2 } });
      parts.push({ part: "label", x: width - padding, y: footY + 5, text: data.due, anchor: "right", fontSize: 11, fill: 9741240, maxWidth: 58, maxLines: 1, overflow: "ellipsis" });
    }
  }
  parts(data) {
    const parts = [];
    this.bottomAccent(data, parts);
    this.title(data, parts);
    this.tags(data, parts);
    const divY = this.spec.padding + 44 + 26;
    parts.push({ part: "line", x: this.spec.padding, y: divY, x2: this.spec.width - this.spec.padding, y2: divY, stroke: { color: this.spec.stroke, width: 1 } });
    this.footer(data, divY + 12, parts);
    return parts;
  }
  frame() {
    const { width, height, bg, stroke, cornerRadius } = this.spec;
    return { width, height, fill: bg, stroke: { color: stroke, width: 1 }, cornerRadius, clip: true };
  }
};
var DEFAULT4 = new TaskCard();
function taskCard(data) {
  return DEFAULT4.build(data);
}

// src/nodes/composite/idCard.ts
var STATUS_COLOR2 = {
  active: 2278750,
  expired: 16007006,
  suspended: 16096779
};
var STATUS_LABEL = {
  active: "Active",
  expired: "Expired",
  suspended: "Suspended"
};
var ID_CARD_DEFAULTS = {
  width: 240,
  height: 148,
  padding: 14,
  cornerRadius: 12,
  headerHeight: 26,
  photoSize: 52,
  photoRadius: 8,
  chipRadius: 9,
  bg: CARD_BG,
  stroke: CARD_STROKE,
  orgColor: 16777215,
  nameColor: 15857145,
  titleColor: 9741240,
  idColor: 13358561,
  validColor: 6583435
};
var IDCard = class extends CompositeCard {
  constructor(spec = {}) {
    super({ ...ID_CARD_DEFAULTS, ...spec });
  }
  /** Accent header band + the issuing organisation. */
  header(data, parts) {
    const { width, headerHeight: H, padding, orgColor } = this.spec;
    if (H <= 0) return;
    parts.push({ part: "rect", x: 0, y: 0, width, height: H, fill: data.accent });
    if (data.org) parts.push({ part: "label", x: padding, y: H / 2, vAnchor: "middle", text: data.org.toUpperCase(), fontSize: 10, fontWeight: 700, fill: orgColor, maxWidth: width - padding * 2, maxLines: 1, overflow: "ellipsis" });
  }
  /** Photo chip — the `photo` icon, or `initials` on an accent-tinted square. */
  photo(data, parts) {
    const { padding, headerHeight, photoSize: S, photoRadius } = this.spec;
    const y = headerHeight + padding;
    parts.push({ part: "rect", x: padding, y, width: S, height: S, cornerRadius: photoRadius, fill: data.accent, fillAlpha: 0.22 });
    if (data.photo) {
      parts.push({ part: "icon", x: padding, y, size: S, icon: { kind: "svg-url", url: iconifyUrl(data.photo), color: data.accent, strokeWidth: 2, sizeRatio: 0.55 } });
    } else if (data.initials) {
      parts.push({ part: "label", x: padding + S / 2, y: y + S / 2, anchor: "center", vAnchor: "middle", text: data.initials, fontSize: 18, fontWeight: 700, fill: data.accent });
    }
  }
  /** Name + title, beside the photo chip. */
  identity(data, parts) {
    const { padding, headerHeight, photoSize, width, nameColor, titleColor } = this.spec;
    const x = padding + photoSize + 12;
    const y = headerHeight + padding;
    const maxWidth = width - x - padding;
    parts.push({ part: "label", x, y: y + 6, text: data.name, fontSize: 15, fontWeight: 700, fill: nameColor, maxWidth, maxLines: 1, overflow: "ellipsis" });
    if (data.title) parts.push({ part: "label", x, y: y + 26, text: data.title, fontSize: 12, fill: titleColor, align: "left", maxWidth, maxLines: 2, overflow: "ellipsis", lineHeight: 15 });
  }
  /** Y of the divider, below the photo block. */
  dividerY() {
    return this.spec.headerHeight + this.spec.padding + this.spec.photoSize + 12;
  }
  /** Badge number (left) + status pill and validity note (right). */
  footer(data, parts) {
    const { padding, width, idColor, validColor, chipRadius } = this.spec;
    const y = this.dividerY() + 12;
    let right = width - padding;
    if (data.status) {
      const text = STATUS_LABEL[data.status];
      const w = text.length * 6.5 + 16;
      chip(parts, { x: right - w, y, text, color: STATUS_COLOR2[data.status], cornerRadius: chipRadius });
      right -= w + 8;
    }
    parts.push({ part: "label", x: padding, y: y + 3, text: data.idNumber, fontSize: 12, fontWeight: 600, fill: idColor, maxWidth: right - padding - 6, maxLines: 1, overflow: "ellipsis" });
    if (data.validUntil) parts.push({ part: "label", x: padding, y: y + 20, text: data.validUntil, fontSize: 10, fill: validColor, maxWidth: width - padding * 2, maxLines: 1, overflow: "ellipsis" });
  }
  parts(data) {
    const parts = [];
    this.header(data, parts);
    this.photo(data, parts);
    this.identity(data, parts);
    const divY = this.dividerY();
    parts.push({ part: "line", x: this.spec.padding, y: divY, x2: this.spec.width - this.spec.padding, y2: divY, stroke: { color: this.spec.stroke, width: 1 } });
    this.footer(data, parts);
    return parts;
  }
  frame() {
    const { width, height, bg, stroke, cornerRadius } = this.spec;
    return { width, height, fill: bg, stroke: { color: stroke, width: 1 }, cornerRadius, clip: true };
  }
};
var DEFAULT5 = new IDCard();
function idCard2(data) {
  return DEFAULT5.build(data);
}

// src/nodes/composite/organisationCard.ts
var ORGANISATION_CARD_DEFAULTS = {
  width: 250,
  padding: 16,
  cornerRadius: 12,
  logoSize: 40,
  logoRadius: 8,
  metaRowHeight: 22,
  chipRadius: 8.5,
  bg: CARD_BG,
  stroke: CARD_STROKE,
  nameColor: 15857145,
  metaColor: 13358561,
  metaIconColor: 9741240
};
var OrganisationCard = class extends CompositeCard {
  constructor(spec = {}) {
    super({ ...ORGANISATION_CARD_DEFAULTS, ...spec });
  }
  /** Logo chip — the `logo` icon, or `monogram` on an accent-tinted square. */
  logo(data, parts) {
    const { padding, logoSize: S, logoRadius } = this.spec;
    parts.push({ part: "rect", x: padding, y: padding, width: S, height: S, cornerRadius: logoRadius, fill: data.accent, fillAlpha: 0.22 });
    if (data.logo) {
      parts.push({ part: "icon", x: padding, y: padding, size: S, icon: { kind: "svg-url", url: iconifyUrl(data.logo), color: data.accent, strokeWidth: 2, sizeRatio: 0.55 } });
    } else if (data.monogram) {
      parts.push({ part: "label", x: padding + S / 2, y: padding + S / 2, anchor: "center", vAnchor: "middle", text: data.monogram.toUpperCase(), fontSize: 16, fontWeight: 700, fill: data.accent });
    }
  }
  /** Name + entity-type tag, beside the logo chip. */
  identity(data, parts) {
    const { padding, logoSize, width, nameColor, chipRadius } = this.spec;
    const x = padding + logoSize + 12;
    const maxWidth = width - x - padding;
    parts.push({ part: "label", x, y: padding + 2, text: data.name, fontSize: 15, fontWeight: 700, fill: nameColor, maxWidth, maxLines: 1, overflow: "ellipsis" });
    if (data.kind) chip(parts, { x, y: padding + 22, text: data.kind, color: data.accent, height: 17, fontSize: 10, cornerRadius: chipRadius });
  }
  /** The meta rows this card renders, in order — only the present ones. */
  metaRows(data) {
    const rows = [];
    if (data.location) rows.push({ icon: "lucide/map-pin", text: data.location });
    if (data.headcount) rows.push({ icon: "lucide/users", text: data.headcount });
    if (data.founded) rows.push({ icon: "lucide/calendar", text: data.founded });
    return rows;
  }
  /** Y of the divider, below the logo block. */
  dividerY() {
    return this.spec.padding + this.spec.logoSize + 12;
  }
  parts(data) {
    const { padding, width, metaRowHeight, metaColor, metaIconColor, stroke } = this.spec;
    const parts = [];
    this.logo(data, parts);
    this.identity(data, parts);
    const rows = this.metaRows(data);
    if (rows.length > 0) {
      const divY = this.dividerY();
      parts.push({ part: "line", x: padding, y: divY, x2: width - padding, y2: divY, stroke: { color: stroke, width: 1 } });
      rows.forEach((r, i) => {
        metaRow(parts, { x: padding, y: divY + 12 + i * metaRowHeight, width: width - padding * 2, icon: r.icon, text: r.text, iconColor: metaIconColor, textColor: metaColor });
      });
    }
    return parts;
  }
  frame(data) {
    const { width, padding, metaRowHeight, bg, stroke, cornerRadius } = this.spec;
    const rows = this.metaRows(data);
    const height = rows.length > 0 ? this.dividerY() + 12 + rows.length * metaRowHeight + padding - 4 : this.dividerY() + padding - 4;
    return { width, height, fill: bg, stroke: { color: stroke, width: 1 }, cornerRadius, clip: true };
  }
};
var DEFAULT6 = new OrganisationCard();
function organisationCard(data) {
  return DEFAULT6.build(data);
}

// src/nodes/composite/productCard.ts
var STOCK_COLOR = {
  in: 2278750,
  low: 16096779,
  out: 16007006
};
var STOCK_LABEL = {
  in: "In stock",
  low: "Low stock",
  out: "Out of stock"
};
var PRODUCT_CARD_DEFAULTS = {
  width: 220,
  padding: 14,
  cornerRadius: 12,
  mediaHeight: 96,
  tagRowHeight: 26,
  chipRadius: 9,
  bg: CARD_BG,
  stroke: CARD_STROKE,
  titleColor: 15857145,
  priceColor: 15857145,
  ratingColor: 16096779,
  reviewColor: 6583435
};
var ProductCard = class extends CompositeCard {
  constructor(spec = {}) {
    super({ ...PRODUCT_CARD_DEFAULTS, ...spec });
  }
  /** Accent-tinted media band with a centred icon. */
  media(data, parts) {
    const { width, mediaHeight: H } = this.spec;
    if (H <= 0) return;
    parts.push({ part: "rect", x: 0, y: 0, width, height: H, fill: data.accent, fillAlpha: 0.16 });
    if (data.icon) {
      const box = Math.min(H - 24, 48);
      parts.push({ part: "icon", x: (width - box) / 2, y: (H - box) / 2, size: box, icon: { kind: "svg-url", url: iconifyUrl(data.icon), color: data.accent, strokeWidth: 2 } });
    }
  }
  /** Two-line product title below the media band. */
  title(data, parts) {
    const { width, padding, mediaHeight, titleColor } = this.spec;
    parts.push({ part: "label", x: padding, y: mediaHeight + padding - 2, text: data.title, fontSize: 14, fontWeight: 700, fill: titleColor, align: "left", maxWidth: width - padding * 2, maxLines: 2, overflow: "ellipsis", lineHeight: 18 });
  }
  /** Y of the price row — below a title laid out as two lines. */
  priceRowY() {
    return this.spec.mediaHeight + this.spec.padding + 40;
  }
  /** Price (left) + star rating and review count (right). */
  priceRow(data, parts) {
    const { width, padding, priceColor, ratingColor, reviewColor } = this.spec;
    const y = this.priceRowY();
    parts.push({ part: "label", x: padding, y, text: data.price, fontSize: 16, fontWeight: 700, fill: priceColor, maxWidth: width * 0.5, maxLines: 1, overflow: "ellipsis" });
    if (data.rating === void 0) return;
    const text = data.reviews === void 0 ? data.rating.toFixed(1) : `${data.rating.toFixed(1)} (${data.reviews})`;
    parts.push({ part: "label", x: width - padding, y: y + 3, text, anchor: "right", fontSize: 11, fontWeight: 600, fill: reviewColor, maxWidth: width * 0.4, maxLines: 1, overflow: "ellipsis" });
    parts.push({ part: "icon", x: width - padding - text.length * 6 - 16, y: y + 2, size: 13, icon: { kind: "svg-url", url: iconifyUrl("lucide/star"), color: ratingColor, strokeWidth: 2 } });
  }
  /** Stock pill + tag chips, left → right. */
  tags(data, parts) {
    const { padding, chipRadius } = this.spec;
    const y = this.priceRowY() + 28;
    let x = padding;
    if (data.stock) x += chip(parts, { x, y, text: STOCK_LABEL[data.stock], color: STOCK_COLOR[data.stock], cornerRadius: chipRadius }) + 6;
    for (const tag of data.tags ?? []) x += chip(parts, { x, y, text: tag.label, color: tag.color, cornerRadius: chipRadius }) + 6;
  }
  /** Whether this card renders a chip row at all. */
  hasTagRow(data) {
    return data.stock !== void 0 || (data.tags?.length ?? 0) > 0;
  }
  parts(data) {
    const parts = [];
    this.media(data, parts);
    this.title(data, parts);
    this.priceRow(data, parts);
    if (this.hasTagRow(data)) this.tags(data, parts);
    return parts;
  }
  frame(data) {
    const { width, padding, tagRowHeight, bg, stroke, cornerRadius } = this.spec;
    const height = this.priceRowY() + 24 + (this.hasTagRow(data) ? tagRowHeight : 0) + padding - 8;
    return { width, height, fill: bg, stroke: { color: stroke, width: 1 }, cornerRadius, clip: true };
  }
};
var DEFAULT7 = new ProductCard();
function productCard(data) {
  return DEFAULT7.build(data);
}

// src/nodes/composite/eventCard.ts
var EVENT_CARD_DEFAULTS = {
  width: 250,
  padding: 14,
  cornerRadius: 12,
  dateChipSize: 52,
  dateChipRadius: 10,
  metaRowHeight: 20,
  bg: CARD_BG,
  stroke: CARD_STROKE,
  titleColor: 15857145,
  dayColor: 16777215,
  monthColor: 16777215,
  metaColor: 13358561,
  metaIconColor: 9741240
};
var EventCard = class extends CompositeCard {
  constructor(spec = {}) {
    super({ ...EVENT_CARD_DEFAULTS, ...spec });
  }
  /** Solid accent date chip — day over short month. */
  dateChip(data, parts) {
    const { padding, dateChipSize: S, dateChipRadius, dayColor, monthColor } = this.spec;
    parts.push({ part: "rect", x: padding, y: padding, width: S, height: S, cornerRadius: dateChipRadius, fill: data.accent });
    parts.push({ part: "label", x: padding + S / 2, y: padding + S * 0.38, anchor: "center", vAnchor: "middle", text: data.day, fontSize: 20, fontWeight: 700, fill: dayColor });
    parts.push({ part: "label", x: padding + S / 2, y: padding + S * 0.78, anchor: "center", vAnchor: "middle", text: data.month.toUpperCase(), fontSize: 10, fontWeight: 600, fill: monthColor });
  }
  /** Two-line event title, beside the date chip. */
  title(data, parts) {
    const { padding, dateChipSize, width, titleColor } = this.spec;
    const x = padding + dateChipSize + 12;
    parts.push({ part: "label", x, y: padding + 4, text: data.title, fontSize: 14, fontWeight: 700, fill: titleColor, align: "left", maxWidth: width - x - padding, maxLines: 2, overflow: "ellipsis", lineHeight: 18 });
  }
  /** The meta rows this card renders, in order — only the present ones. */
  metaRows(data) {
    const rows = [];
    if (data.time) rows.push({ icon: "lucide/clock", text: data.time });
    if (data.venue) rows.push({ icon: "lucide/map-pin", text: data.venue });
    if (data.attendees) rows.push({ icon: "lucide/users", text: data.attendees });
    return rows;
  }
  /** Y of the divider, below the date-chip block. */
  dividerY() {
    return this.spec.padding + this.spec.dateChipSize + 10;
  }
  parts(data) {
    const { padding, width, metaRowHeight, metaColor, metaIconColor, stroke } = this.spec;
    const parts = [];
    this.dateChip(data, parts);
    this.title(data, parts);
    const rows = this.metaRows(data);
    if (rows.length > 0) {
      const divY = this.dividerY();
      parts.push({ part: "line", x: padding, y: divY, x2: width - padding, y2: divY, stroke: { color: stroke, width: 1 } });
      rows.forEach((r, i) => {
        metaRow(parts, { x: padding, y: divY + 10 + i * metaRowHeight, width: width - padding * 2, icon: r.icon, text: r.text, iconColor: metaIconColor, textColor: metaColor });
      });
    }
    return parts;
  }
  frame(data) {
    const { width, padding, metaRowHeight, bg, stroke, cornerRadius } = this.spec;
    const rows = this.metaRows(data);
    const height = rows.length > 0 ? this.dividerY() + 10 + rows.length * metaRowHeight + padding - 4 : this.dividerY() + padding - 4;
    return { width, height, fill: bg, stroke: { color: stroke, width: 1 }, cornerRadius, clip: true };
  }
};
var DEFAULT8 = new EventCard();
function eventCard(data) {
  return DEFAULT8.build(data);
}

export { BUILT_IN_STRUCTURES, BUILT_IN_STYLINGS, BUILT_IN_THEMES, BrushSelectBehaviour, CARD_BG, CARD_STROKE, COLLAPSED_COUNT_BADGE_ID, COLLAPSED_STATE, ClickInspectBehaviour, ClickSelectBehaviour, ClickViewBehaviour, CollapseExpandBehaviour, ColorByBehaviour, CompositeCard, ContextMenuBehaviour, CreateNodeBehaviour, DEFAULT_CATEGORY_PALETTE, DEFAULT_EDGE_STATES, DEFAULT_EDGE_TYPES, DEFAULT_EDGE_TYPE_LABELS, DEFAULT_NODE_STATES, DEFAULT_RANGE_STOPS, DEFAULT_THEME, DragNodeBehaviour, DrawEdgeBehaviour, EVENT_CARD_DEFAULTS, EdgeLODBehaviour, EdgeLabelLODBehaviour, EdgeScaleLODBehaviour, EntranceBehaviour, EraseBehaviour, EventCard, FOREST_THEME, FisheyeBehaviour, FocusBehaviour, GOLD_THEME, GROUP_TOGGLE_SLOT, GraphCanvas, GraphClipboard, GraphLayer, GraphLegendLayer, GraphStore, HoverActivateBehaviour, HoverElementPreviewBehaviour, IDCard, ID_CARD_DEFAULTS, IconLODBehaviour, ImageLODBehaviour, LabelCollisionBehaviour, LassoSelectBehaviour, MINIMAL_THEME, MiniMapLayer, NodeCentralityBehaviour, NodeLabelLODBehaviour, NodeResizeBehaviour, NodeScaleLODBehaviour, OCEAN_THEME, ORGANISATION_CARD_DEFAULTS, OneShotPositionLayout, OrganisationCard, PRODUCT_CARD_DEFAULTS, ParallelEdgeBehaviour, ProductCard, ROSE_THEME, SCHEMA_TABLE_CARD_DEFAULTS, STAT_CARD_DEFAULTS, SchemaTableCard, StatCard, SubgraphPositionLayout, TASK_CARD_DEFAULTS, TaskCard, TextResolutionLODBehaviour, ThemeBehaviour, UNKNOWN_TYPE, USER_CARD_DEFAULTS, UserCard, buildGroupForest, centeredRanksPolicy, chip, clearGraphLayer, collectLayoutEdges, collectPlaceableNodes, compileBadges, compileCard, compileFreeform, compileSimple, compileSize, copySelection, cssColorToNumber, cutSelection, defaultEdgeTypeOf, defaultNodeTypeOf, deleteSelection, deriveSchema, edgePathType, effectiveLayoutEndpoint, eraseCommand, eventCard, fisheyeDisplace, groupInsets, groupSizeFloor, iconifyUrl, idCard2 as idCard, interpolate, isBuiltInNodeShape, isMergedEdgeId, isPlaceableNode, metaRow, organisationCard, pasteAndSelect, productCard, readValueKey, registerGraphEditCommands, resolveAccentVar, resolveField, resolveLookup, resolveNodeSize, resolvePath, resolvePreviewCard, resolveSelectMode, resolveText, schemaSignature, schemaTableCard, selectModePatch, selectedElementIds, setEdgePathType, statCard, taskCard, themeFamily, userCard };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map