/**
 * `LayerData` — the **non-reactive** graph data for one source: four record
 * collections (nodes · edges · groups · annotations) with full CRUD, **bulk
 * position updates** (layout output), and **one coalesced `flush` per frame**
 * carrying a per-kind delta. Subscribers (the renderer) rebuild only the delta.
 *
 * **Two lanes (the two physics).** Bulk + machine-rate → it lives *outside* the
 * reactive `view` store:
 * - **COLD** — `Map<id, record>` for human-rate fields (payload/label/style/…).
 * - **HOT** — a typed-array {@link ColumnStore} for node **positions** (`x`/`y`)
 *   and a `flags` byte (has-position / pinned / disabled / hidden). A position
 *   write is ~10 ns (one `Float32Array` slot), no per-node object, no GC. The
 *   layout/renderer fast path holds the column ref and writes slots directly
 *   (see {@link positions} + {@link touchPositions}).
 *
 * `node(id)` stitches the two lanes back into one record on read (cold reads are
 * human-rate; the hot path reads the column directly). The `flush` delta shape is
 * **unchanged** by the lane split — `moved` (position-only) stays separate from
 * `changed` (structure), so a move is a transform-only re-render.
 *
 * **When** the coalesced flush fires is the {@link FlushMode} (default `'microtask'`);
 * the engine flips its stores to `'manual'` and drains them from one rAF loop. See
 * `docs/canvas-store-data-event-flow.md` §2.2.
 */

import { ColumnStore } from './ColumnStore';
import { scheduleFlush, type FlushMode } from './flush';

export interface NodeRecord {
  id: string;
  x?: number;
  y?: number;
  [key: string]: unknown;
}
export interface EdgeRecord {
  id: string;
  source: string;
  target: string;
  [key: string]: unknown;
}
export interface GroupRecord {
  id: string;
  memberIds: string[];
  /** Derived encapsulating geometry (hull / rect / …) — computed by a deriver. */
  geometry?: unknown;
  [key: string]: unknown;
}
export interface AnnotationRecord {
  id: string;
  kind: string;
  [key: string]: unknown;
}

/** Added / changed / removed ids for one collection. */
export interface KindDelta {
  added: string[];
  changed: string[];
  removed: string[];
}
/** Nodes also carry `moved` — position-only changes (transform-only re-render). */
export interface NodeDelta extends KindDelta {
  /** Ids whose position changed this frame. Empty when {@link movedAll} is set. */
  moved: string[];
  /**
   * Every node moved (a force-sim tick via {@link LayerData.touchPositions}) —
   * `moved` is left **empty** so the kernel doesn't allocate an N-id array each
   * frame; the renderer iterates all positions directly. O(1) per flush.
   */
  movedAll: boolean;
}

/** The per-frame coalesced delta across all four collections. */
export interface LayerFlush {
  nodes: NodeDelta;
  edges: KindDelta;
  groups: KindDelta;
  annotations: KindDelta;
  /** Monotonic version — bumps once per flush. */
  version: number;
}

/** Bulk seed/replace input. */
export interface GraphInput {
  nodes?: readonly NodeRecord[];
  edges?: readonly EdgeRecord[];
  groups?: readonly GroupRecord[];
  annotations?: readonly AnnotationRecord[];
}

/** The hot-lane schema: positions (`x`/`y`) + a packed `flags` byte. */
export type PosSchema = { x: 'f32'; y: 'f32'; flags: 'u8' };
const POS_SCHEMA: PosSchema = { x: 'f32', y: 'f32', flags: 'u8' };

/** Bits in the node `flags` column. `HAS_POSITION` distinguishes unset from `(0,0)`. */
export const NODE_FLAG = {
  HAS_POSITION: 1,
  PINNED: 2,
  DISABLED: 4,
  HIDDEN: 8,
} as const;

/** Streaming/ingestion lifecycle for a data source. */
export type QueryStatus = 'idle' | 'loading' | 'streaming' | 'error';

/** A named data mutation, recorded for audit / collaboration (distinct from the per-frame flush). */
export interface IntentLogEntry {
  action: string;
  ids?: readonly string[];
  ts: number;
}

interface KindDirty {
  added: Set<string>;
  changed: Set<string>;
  removed: Set<string>;
}
const newDirty = (): KindDirty => ({ added: new Set(), changed: new Set(), removed: new Set() });
const drain = (d: KindDirty): KindDelta => ({
  added: [...d.added],
  changed: [...d.changed],
  removed: [...d.removed],
});
const clearDirty = (d: KindDirty): void => {
  d.added.clear();
  d.changed.clear();
  d.removed.clear();
};

export class LayerData {
  /** COLD lane — node records WITHOUT `x`/`y` (positions live in {@link _pos}). */
  private readonly _nodes = new Map<string, NodeRecord>();
  /** HOT lane — typed-array `x`/`y`/`flags` columns, keyed by node id. */
  private readonly _pos = new ColumnStore<PosSchema>(POS_SCHEMA);
  private readonly _edges = new Map<string, EdgeRecord>();
  private readonly _groups = new Map<string, GroupRecord>();
  private readonly _annotations = new Map<string, AnnotationRecord>();

  private readonly dNodes = newDirty();
  private readonly dMoved = new Set<string>(); // position-only node changes
  private _movedAll = false; // set by touchPositions() — every node moved (direct-column fast path)
  private readonly dEdges = newDirty();
  private readonly dGroups = newDirty();
  private readonly dAnnotations = newDirty();

  private readonly listeners = new Set<(e: LayerFlush) => void>();
  private version = 0;
  private scheduled = false;
  private flushMode: FlushMode = 'microtask';
  private cancel: (() => void) | undefined;

  // ── stream / query status (small, human-rate; observable) ──────────────────
  private _status: QueryStatus = 'idle';
  private readonly _intents: IntentLogEntry[] = [];
  private readonly statusListeners = new Set<(status: QueryStatus) => void>();

  // ── subscribe ─────────────────────────────────────────────────────────────
  /** Subscribe to coalesced `flush` deltas. Returns an unsubscribe. */
  on(event: 'flush', listener: (e: LayerFlush) => void): () => void {
    void event;
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** {@link DataSource} contract — alias for `on('flush', …)`. */
  onFlush(listener: (e: LayerFlush) => void): () => void {
    return this.on('flush', listener);
  }

  /**
   * Choose **when** a flush fires ({@link FlushMode}). `'manual'` disarms any pending
   * auto-flush so only an explicit {@link flush} emits — used when the engine drives
   * every layer's data from one rAF loop.
   */
  setFlushMode(mode: FlushMode): void {
    this.flushMode = mode;
    if (mode === 'manual' && this.scheduled) {
      this.cancel?.();
      this.scheduled = false;
    }
  }

  // ── reads ─────────────────────────────────────────────────────────────────
  /** Read a node, **stitching** its cold record with its hot `x`/`y` (when set). */
  node(id: string): NodeRecord | undefined {
    const cold = this._nodes.get(id);
    if (!cold) return undefined;
    const slot = this._pos.slot(id);
    if (slot === undefined) return cold;
    const flags = this._pos.column('flags')[slot] ?? 0;
    if ((flags & NODE_FLAG.HAS_POSITION) === 0) return cold;
    return { ...cold, x: this._pos.column('x')[slot], y: this._pos.column('y')[slot] };
  }
  edge(id: string): EdgeRecord | undefined {
    return this._edges.get(id);
  }
  group(id: string): GroupRecord | undefined {
    return this._groups.get(id);
  }
  annotation(id: string): AnnotationRecord | undefined {
    return this._annotations.get(id);
  }
  nodes(): NodeRecord[] {
    return [...this._nodes.keys()].map((id) => this.node(id)!);
  }
  edges(): EdgeRecord[] {
    return [...this._edges.values()];
  }
  groups(): GroupRecord[] {
    return [...this._groups.values()];
  }
  annotations(): AnnotationRecord[] {
    return [...this._annotations.values()];
  }
  get counts(): { nodes: number; edges: number; groups: number; annotations: number } {
    return {
      nodes: this._nodes.size,
      edges: this._edges.size,
      groups: this._groups.size,
      annotations: this._annotations.size,
    };
  }

  // ── hot-lane fast path (layout / renderer) ─────────────────────────────────
  /**
   * Direct access to the typed-array position columns. Hold the ref + a slot once
   * and write in place (~10 ns/slot), then call {@link touchPositions} to emit one
   * coalesced moved flush. `positions.slot(id)` maps id → column index.
   */
  get positions(): ColumnStore<PosSchema> {
    return this._pos;
  }

  /**
   * Bulk-apply layout output from an **interleaved** `[x0,y0,x1,y1,…]` buffer —
   * the layout fast path. Skips ids that aren't present; marks each `moved`.
   */
  setPositionsBulk(ids: readonly string[], xy: ArrayLike<number>): void {
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i]!;
      if (!this._nodes.has(id)) continue;
      this.writePos(id, xy[i * 2], xy[i * 2 + 1], false);
      if (!this.dNodes.added.has(id) && !this.dNodes.changed.has(id)) this.dMoved.add(id);
    }
    this.schedule();
  }

  /**
   * After writing position slots directly via {@link positions}, call this to bump
   * the version and emit **one** flush that marks every node `moved` (the per-tick
   * force-sim path — "everything moved", transform-only).
   */
  touchPositions(): void {
    this._pos.touch();
    this._movedAll = true;
    this.schedule();
  }

  /** Read a node's `flags` byte, or `undefined`. */
  nodeFlags(id: string): number | undefined {
    return this._pos.get(id, 'flags');
  }

  /** Toggle a {@link NODE_FLAG} bit (e.g. pinned/disabled) — marks the node `changed`. */
  setNodeFlag(id: string, flag: number, on: boolean): void {
    const cur = this._pos.get(id, 'flags');
    if (cur === undefined) return;
    const next = on ? cur | flag : cur & ~flag;
    if (next === cur) return;
    this._pos.set(id, 'flags', next);
    if (!this.dNodes.added.has(id)) this.dNodes.changed.add(id);
    this.schedule();
  }

  // ── stream / query status ──────────────────────────────────────────────────
  /** Current ingestion lifecycle status. */
  get status(): QueryStatus {
    return this._status;
  }
  /** Set the ingestion status; notifies {@link onStatus} listeners on change. */
  setStatus(status: QueryStatus): void {
    if (status === this._status) return;
    this._status = status;
    for (const l of [...this.statusListeners]) l(status);
  }
  /** Subscribe to status changes. Returns an unsubscribe. */
  onStatus(listener: (status: QueryStatus) => void): () => void {
    this.statusListeners.add(listener);
    return () => this.statusListeners.delete(listener);
  }
  /** The data-mutation audit trail (one entry per named action). */
  intents(): readonly IntentLogEntry[] {
    return this._intents;
  }
  /** Record a named data intent (audit / collab). */
  logIntent(action: string, ids?: readonly string[], ts: number = Date.now()): void {
    this._intents.push({ action, ids, ts });
  }

  // ── bulk ──────────────────────────────────────────────────────────────────
  /** Replace the whole graph — diffs each collection into the next flush. */
  setData(input: GraphInput): void {
    if (input.nodes) this.replaceNodes(input.nodes);
    if (input.edges) this.replaceKind(this._edges, this.dEdges, input.edges);
    if (input.groups) this.replaceKind(this._groups, this.dGroups, input.groups);
    if (input.annotations) this.replaceKind(this._annotations, this.dAnnotations, input.annotations);
    this.schedule();
  }

  /** Bulk-apply layout output (positions) → marks nodes `moved` (transform-only). */
  applyPositions(positions: Iterable<{ id: string; x: number; y: number }>): void {
    for (const { id, x, y } of positions) {
      if (!this._nodes.has(id)) continue;
      this.writePos(id, x, y, false);
      if (!this.dNodes.added.has(id) && !this.dNodes.changed.has(id)) this.dMoved.add(id);
    }
    this.schedule();
  }

  // ── nodes ─────────────────────────────────────────────────────────────────
  addNode(n: NodeRecord): void {
    this.upsertNode(n);
    this.schedule();
  }
  updateNode(id: string, patch: Partial<NodeRecord>): void {
    if (!this._nodes.has(id)) return;
    const keys = Object.keys(patch);
    const positionOnly = keys.length > 0 && keys.every((k) => k === 'x' || k === 'y');
    if ('x' in patch || 'y' in patch) {
      this.writePos(id, patch.x as number | undefined, patch.y as number | undefined, false);
    }
    const { x: _x, y: _y, ...rest } = patch;
    if (Object.keys(rest).length > 0) {
      const cur = this._nodes.get(id)!;
      this._nodes.set(id, { ...cur, ...rest } as NodeRecord);
    }
    if (positionOnly) {
      if (!this.dNodes.added.has(id) && !this.dNodes.changed.has(id)) this.dMoved.add(id);
    } else {
      if (!this.dNodes.added.has(id)) this.dNodes.changed.add(id);
      this.dMoved.delete(id);
    }
    this.schedule();
  }
  removeNode(id: string): void {
    if (!this._nodes.has(id)) return;
    this._nodes.delete(id);
    this._pos.remove(id);
    this.dNodes.changed.delete(id);
    this.dMoved.delete(id);
    if (this.dNodes.added.delete(id)) {
      this.schedule();
      return; // added then removed before flush → net no-op
    }
    this.dNodes.removed.add(id);
    this.schedule();
  }

  // ── edges ─────────────────────────────────────────────────────────────────
  addEdge(e: EdgeRecord): void {
    this.upsert(this._edges, this.dEdges, e);
    this.schedule();
  }
  updateEdge(id: string, patch: Partial<EdgeRecord>): void {
    if (this.patchRecord(this._edges, this.dEdges, id, patch)) this.schedule();
  }
  removeEdge(id: string): void {
    this.removeFrom(this._edges, this.dEdges, id);
    this.schedule();
  }

  // ── groups ────────────────────────────────────────────────────────────────
  addGroup(g: GroupRecord): void {
    this.upsert(this._groups, this.dGroups, g);
    this.schedule();
  }
  updateGroup(id: string, patch: Partial<GroupRecord>): void {
    if (this.patchRecord(this._groups, this.dGroups, id, patch)) this.schedule();
  }
  removeGroup(id: string): void {
    this.removeFrom(this._groups, this.dGroups, id);
    this.schedule();
  }

  // ── annotations ───────────────────────────────────────────────────────────
  addAnnotation(a: AnnotationRecord): void {
    this.upsert(this._annotations, this.dAnnotations, a);
    this.schedule();
  }
  updateAnnotation(id: string, patch: Partial<AnnotationRecord>): void {
    if (this.patchRecord(this._annotations, this.dAnnotations, id, patch)) this.schedule();
  }
  removeAnnotation(id: string): void {
    this.removeFrom(this._annotations, this.dAnnotations, id);
    this.schedule();
  }

  // ── flush ─────────────────────────────────────────────────────────────────
  /** Emit the pending delta now (the engine calls this once per frame). */
  flush(): void {
    this.scheduled = false;
    const movedAll = this._movedAll;
    this._movedAll = false;
    const hasMoved = movedAll ? this._nodes.size > 0 : this.dMoved.size > 0;
    const empty =
      this.isClean(this.dNodes) &&
      !hasMoved &&
      this.isClean(this.dEdges) &&
      this.isClean(this.dGroups) &&
      this.isClean(this.dAnnotations);
    if (empty) return;

    // `movedAll` (force-sim tick) is signalled as a flag — never enumerated — so a
    // full-graph move is O(1) here; the renderer iterates the position column.
    const moved = movedAll ? [] : [...this.dMoved];

    const event: LayerFlush = {
      nodes: { ...drain(this.dNodes), moved, movedAll },
      edges: drain(this.dEdges),
      groups: drain(this.dGroups),
      annotations: drain(this.dAnnotations),
      version: ++this.version,
    };
    clearDirty(this.dNodes);
    this.dMoved.clear();
    clearDirty(this.dEdges);
    clearDirty(this.dGroups);
    clearDirty(this.dAnnotations);
    for (const l of [...this.listeners]) l(event);
  }

  // ── internals ─────────────────────────────────────────────────────────────
  private schedule(): void {
    if (this.scheduled || this.flushMode === 'manual') return;
    this.scheduled = true;
    this.cancel = scheduleFlush(this.flushMode, () => this.flush());
  }

  private isClean(d: KindDirty): boolean {
    return d.added.size === 0 && d.changed.size === 0 && d.removed.size === 0;
  }

  /** Insert/replace a node: cold record (minus x/y) + hot position columns. */
  private upsertNode(n: NodeRecord): void {
    const { x, y, ...rest } = n;
    const existed = this._nodes.has(n.id);
    this._nodes.set(n.id, rest as NodeRecord);
    this.writePos(n.id, x, y, true);
    if (existed) {
      this.dNodes.removed.delete(n.id);
      if (!this.dNodes.added.has(n.id)) this.dNodes.changed.add(n.id);
    } else {
      this.dNodes.added.add(n.id);
      this.dNodes.removed.delete(n.id);
    }
  }

  /**
   * Write a node's position into the hot column. `replace` (used on full upsert)
   * clears the `HAS_POSITION` bit when no `x`/`y` is supplied; otherwise a partial
   * update keeps the existing coordinate for an omitted axis.
   */
  private writePos(id: string, x: number | undefined, y: number | undefined, replace: boolean): void {
    const has = x !== undefined || y !== undefined;
    if (this._pos.has(id)) {
      if (has) {
        const cx = x ?? this._pos.get(id, 'x') ?? 0;
        const cy = y ?? this._pos.get(id, 'y') ?? 0;
        const flags = (this._pos.get(id, 'flags') ?? 0) | NODE_FLAG.HAS_POSITION;
        this._pos.update(id, { x: cx, y: cy, flags });
      } else if (replace) {
        const flags = (this._pos.get(id, 'flags') ?? 0) & ~NODE_FLAG.HAS_POSITION;
        this._pos.update(id, { x: 0, y: 0, flags });
      }
    } else {
      this._pos.add(id, { x: x ?? 0, y: y ?? 0, flags: has ? NODE_FLAG.HAS_POSITION : 0 });
    }
  }

  private replaceNodes(next: readonly NodeRecord[]): void {
    const nextIds = new Set(next.map((r) => r.id));
    for (const id of [...this._nodes.keys()]) {
      if (!nextIds.has(id)) this.removeNode(id);
    }
    for (const r of next) this.upsertNode(r);
  }

  private upsert<R extends { id: string }>(map: Map<string, R>, dirty: KindDirty, record: R): void {
    const existed = map.has(record.id);
    map.set(record.id, record);
    if (existed) {
      dirty.removed.delete(record.id);
      if (!dirty.added.has(record.id)) dirty.changed.add(record.id);
    } else {
      dirty.added.add(record.id);
      dirty.removed.delete(record.id);
    }
  }

  private patchRecord<R extends { id: string }>(
    map: Map<string, R>,
    dirty: KindDirty,
    id: string,
    patch: Partial<R>,
  ): boolean {
    const cur = map.get(id);
    if (!cur) return false;
    map.set(id, { ...cur, ...patch });
    if (!dirty.added.has(id)) dirty.changed.add(id);
    return true;
  }

  private removeFrom<R extends { id: string }>(map: Map<string, R>, dirty: KindDirty, id: string): boolean {
    if (!map.has(id)) return false;
    map.delete(id);
    dirty.changed.delete(id);
    if (dirty.added.delete(id)) return true; // added then removed before flush → net no-op
    dirty.removed.add(id);
    return true;
  }

  private replaceKind<R extends { id: string }>(
    map: Map<string, R>,
    dirty: KindDirty,
    next: readonly R[],
  ): void {
    const nextIds = new Set(next.map((r) => r.id));
    for (const id of [...map.keys()]) {
      if (!nextIds.has(id)) this.removeFrom(map, dirty, id);
    }
    for (const r of next) this.upsert(map, dirty, r);
  }
}
