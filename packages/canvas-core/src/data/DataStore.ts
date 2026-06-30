/**
 * `DataStore` — the **non-reactive** half of `CanvasState`: a keyed source of bulk
 * records (nodes/edges/…). Writes mark a dirty delta and emit **one coalesced
 * `flush` per frame** (a microtask here; the engine drives it off rAF), so a layer
 * subscriber rebuilds only the delta — never the whole set.
 *
 * M0 holds records as plain objects keyed by id. The typed-array `ColumnStore`
 * backing (positions/payloads as `Float32Array`) is an internal optimisation that
 * lands later **without changing this API** — bulk fields never enter the reactive
 * store either way (the two-physics split).
 */

/** The per-frame coalesced change delta. */
export interface FlushEvent {
  added: string[];
  changed: string[];
  removed: string[];
  /** Monotonic version — bumps once per flush. */
  version: number;
}

/** Minimal record shape — domain stores (e.g. graph) extend this. */
export interface Record_ {
  id: string;
}

export class DataStore<R extends Record_ = Record_> {
  private readonly records = new Map<string, R>();
  private readonly added = new Set<string>();
  private readonly changed = new Set<string>();
  private readonly removed = new Set<string>();
  private readonly listeners = new Set<(e: FlushEvent) => void>();
  private version = 0;
  private scheduled = false;

  /** Subscribe to coalesced `flush` deltas. Returns an unsubscribe. */
  on(event: 'flush', listener: (e: FlushEvent) => void): () => void {
    void event;
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Read one record (or `undefined`). */
  read(id: string): R | undefined {
    return this.records.get(id);
  }

  /** All records (snapshot array). */
  all(): R[] {
    return [...this.records.values()];
  }

  /** Number of records. */
  get size(): number {
    return this.records.size;
  }

  /** Replace the whole set — diffs against the current contents into one delta. */
  setData(records: readonly R[]): void {
    const next = new Set(records.map((r) => r.id));
    for (const id of this.records.keys()) {
      if (!next.has(id)) this.markRemoved(id);
    }
    for (const r of records) this.upsert(r);
  }

  /** Insert or replace one record. */
  upsert(record: R): void {
    const existed = this.records.has(record.id);
    this.records.set(record.id, record);
    if (existed) {
      this.removed.delete(record.id);
      if (!this.added.has(record.id)) this.changed.add(record.id);
    } else {
      this.added.add(record.id);
      this.removed.delete(record.id);
    }
    this.schedule();
  }

  /** Shallow-merge a patch into an existing record. No-op if absent. */
  update(id: string, patch: Partial<R>): void {
    const cur = this.records.get(id);
    if (!cur) return;
    this.records.set(id, { ...cur, ...patch });
    if (!this.added.has(id)) this.changed.add(id);
    this.schedule();
  }

  /** Remove one record. No-op if absent. */
  remove(id: string): void {
    if (!this.records.has(id)) return;
    this.records.delete(id);
    this.markRemoved(id);
    this.schedule();
  }

  private markRemoved(id: string): void {
    this.records.delete(id);
    if (this.added.delete(id)) {
      // Added then removed before a flush → net no-op.
    } else {
      this.removed.add(id);
    }
    this.changed.delete(id);
  }

  private schedule(): void {
    if (this.scheduled) return;
    this.scheduled = true;
    queueMicrotask(() => this.flush());
  }

  /** Emit the pending delta now (the engine calls this once per frame). */
  flush(): void {
    this.scheduled = false;
    if (this.added.size === 0 && this.changed.size === 0 && this.removed.size === 0) return;
    const event: FlushEvent = {
      added: [...this.added],
      changed: [...this.changed],
      removed: [...this.removed],
      version: ++this.version,
    };
    this.added.clear();
    this.changed.clear();
    this.removed.clear();
    for (const l of this.listeners) l(event);
  }
}
