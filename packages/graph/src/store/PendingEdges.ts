/**
 * `PendingEdges` — buffer for edges whose source or target node hasn't yet
 * arrived. Used only when `GraphStoreOptions.unknownEndpoint === 'buffer'`.
 *
 * Keyed by missing-endpoint id. An edge missing both endpoints is registered
 * under both ids. When a node arrives, all edges keyed by that id are
 * candidates for admission — those whose other endpoint is already present
 * are admitted; others stay until their second endpoint arrives.
 *
 * Each edge carries its arrival-frame counter for TTL eviction.
 *
 * @internal — not exported from `@invana/graph`. Used only inside `GraphStore`.
 */
import type { GraphEdge } from './types';

/** Pending entry — the edge plus its arrival frame for TTL. */
interface PendingEntry {
  edge: GraphEdge;
  /** Frame counter when the edge was first parked. */
  parkedAtFrame: number;
  /**
   * The waitingFor sets this entry is registered in. Lets us remove the entry
   * from all of them in O(owners) time on admission, instead of scanning every
   * set in the waitingFor map (which would be O(N) per admit with N total
   * pending endpoints — quadratic for streaming workloads).
   */
  ownerSets: Set<Set<PendingEntry>>;
}

export class PendingEdges {
  /** missing-id → set of pending entries waiting on it. */
  private readonly waitingFor: Map<string, Set<PendingEntry>> = new Map();

  /** edge id → entry (so duplicate `addEdge` calls update one entry). */
  private readonly byEdgeId: Map<string, PendingEntry> = new Map();

  /** Number of pending edges (not entries — an edge missing both endpoints counts once). */
  size(): number {
    return this.byEdgeId.size;
  }

  /**
   * Park `edge`, registering it under each of the missing endpoint ids.
   * Replaces a prior pending entry for the same edge id if any.
   */
  park(edge: GraphEdge, missingIds: readonly string[], frame: number): void {
    const existing = this.byEdgeId.get(edge.id);
    if (existing) this.unpark(edge.id);
    const entry: PendingEntry = { edge, parkedAtFrame: frame, ownerSets: new Set() };
    this.byEdgeId.set(edge.id, entry);
    for (const id of missingIds) {
      let set = this.waitingFor.get(id);
      if (!set) {
        set = new Set();
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
  takeWaitingFor(id: string): GraphEdge[] {
    const set = this.waitingFor.get(id);
    if (!set || set.size === 0) return [];
    const entries: PendingEntry[] = [];
    for (const entry of set) {
      entries.push(entry);
      this.byEdgeId.delete(entry.edge.id);
    }
    this.waitingFor.delete(id);
    // For each entry, remove it from every *other* waitingFor set it owned
    // (we just deleted this one). O(owners) per entry — owners is 1 or 2.
    for (const entry of entries) {
      for (const otherSet of entry.ownerSets) {
        if (otherSet !== set) otherSet.delete(entry);
      }
      entry.ownerSets.clear();
    }
    return entries.map((e) => e.edge);
  }

  /** Remove a pending edge entirely (e.g. on `unpark` after admission). */
  unpark(edgeId: string): void {
    const entry = this.byEdgeId.get(edgeId);
    if (!entry) return;
    this.byEdgeId.delete(edgeId);
    for (const set of entry.ownerSets) set.delete(entry);
    entry.ownerSets.clear();
  }

  /** True iff `edgeId` is currently parked. */
  has(edgeId: string): boolean {
    return this.byEdgeId.has(edgeId);
  }

  /**
   * Yield all edges that were parked more than `ttl` frames before `currentFrame`.
   * Caller is expected to call `unpark` on each before emitting `edge:orphaned`.
   */
  *expired(currentFrame: number, ttl: number): IterableIterator<GraphEdge> {
    if (!Number.isFinite(ttl)) return;
    const cutoff = currentFrame - ttl;
    for (const entry of this.byEdgeId.values()) {
      if (entry.parkedAtFrame <= cutoff) yield entry.edge;
    }
  }

  /** Wipe all state. */
  clear(): void {
    this.waitingFor.clear();
    this.byEdgeId.clear();
  }
}
