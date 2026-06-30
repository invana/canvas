/**
 * `LayerData` — the **non-reactive** graph data for one layer: four record
 * collections (nodes · edges · groups · annotations) with full CRUD, **bulk
 * position updates** (layout output), and **one coalesced `flush` per frame**
 * carrying a per-kind delta. Subscribers (the renderer) rebuild only the delta.
 *
 * Bulk + machine-rate → it lives **outside** the reactive `view` store (the
 * two-physics split). M0 holds records as plain objects; the typed-array
 * `ColumnStore` backing for `x`/`y` is an internal optimisation that lands later
 * without changing this API.
 */

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
  moved: string[];
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
  private readonly _nodes = new Map<string, NodeRecord>();
  private readonly _edges = new Map<string, EdgeRecord>();
  private readonly _groups = new Map<string, GroupRecord>();
  private readonly _annotations = new Map<string, AnnotationRecord>();

  private readonly dNodes = newDirty();
  private readonly dMoved = new Set<string>(); // position-only node changes
  private readonly dEdges = newDirty();
  private readonly dGroups = newDirty();
  private readonly dAnnotations = newDirty();

  private readonly listeners = new Set<(e: LayerFlush) => void>();
  private version = 0;
  private scheduled = false;

  // ── subscribe ─────────────────────────────────────────────────────────────
  /** Subscribe to coalesced `flush` deltas. Returns an unsubscribe. */
  on(event: 'flush', listener: (e: LayerFlush) => void): () => void {
    void event;
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // ── reads ─────────────────────────────────────────────────────────────────
  node(id: string): NodeRecord | undefined {
    return this._nodes.get(id);
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
    return [...this._nodes.values()];
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

  // ── bulk ──────────────────────────────────────────────────────────────────
  /** Replace the whole graph — diffs each collection into the next flush. */
  setData(input: GraphInput): void {
    if (input.nodes) this.replaceKind(this._nodes, this.dNodes, input.nodes, (id) => this.dMoved.delete(id));
    if (input.edges) this.replaceKind(this._edges, this.dEdges, input.edges);
    if (input.groups) this.replaceKind(this._groups, this.dGroups, input.groups);
    if (input.annotations) this.replaceKind(this._annotations, this.dAnnotations, input.annotations);
    this.schedule();
  }

  /** Bulk-apply layout output (positions) → marks nodes `moved` (transform-only). */
  applyPositions(positions: Iterable<{ id: string; x: number; y: number }>): void {
    for (const { id, x, y } of positions) {
      const n = this._nodes.get(id);
      if (!n) continue;
      n.x = x;
      n.y = y;
      if (!this.dNodes.added.has(id) && !this.dNodes.changed.has(id)) this.dMoved.add(id);
    }
    this.schedule();
  }

  // ── nodes ─────────────────────────────────────────────────────────────────
  addNode(n: NodeRecord): void {
    this.upsert(this._nodes, this.dNodes, n);
    this.schedule();
  }
  updateNode(id: string, patch: Partial<NodeRecord>): void {
    const cur = this._nodes.get(id);
    if (!cur) return;
    this._nodes.set(id, { ...cur, ...patch });
    const positionOnly = Object.keys(patch).every((k) => k === 'x' || k === 'y');
    if (positionOnly) {
      if (!this.dNodes.added.has(id) && !this.dNodes.changed.has(id)) this.dMoved.add(id);
    } else if (!this.dNodes.added.has(id)) {
      this.dNodes.changed.add(id);
      this.dMoved.delete(id);
    }
    this.schedule();
  }
  removeNode(id: string): void {
    if (this.removeFrom(this._nodes, this.dNodes, id)) this.dMoved.delete(id);
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
    const empty =
      this.isClean(this.dNodes) &&
      this.dMoved.size === 0 &&
      this.isClean(this.dEdges) &&
      this.isClean(this.dGroups) &&
      this.isClean(this.dAnnotations);
    if (empty) return;
    const event: LayerFlush = {
      nodes: { ...drain(this.dNodes), moved: [...this.dMoved] },
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
    if (this.scheduled) return;
    this.scheduled = true;
    queueMicrotask(() => this.flush());
  }

  private isClean(d: KindDirty): boolean {
    return d.added.size === 0 && d.changed.size === 0 && d.removed.size === 0;
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
    onRemove?: (id: string) => void,
  ): void {
    const nextIds = new Set(next.map((r) => r.id));
    for (const id of [...map.keys()]) {
      if (!nextIds.has(id)) {
        this.removeFrom(map, dirty, id);
        onRemove?.(id);
      }
    }
    for (const r of next) this.upsert(map, dirty, r);
  }
}
