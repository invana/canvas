/**
 * `AdjacencyIndex` — per-slot `Int32Array` lists of edge slot indices.
 *
 * One instance tracks one direction (out or in) of every node's incident
 * edges. The graph store keeps two: `outAdj` (edges where the node is the
 * source) and `inAdj` (edges where the node is the target).
 *
 * Layout:
 *
 * ```
 *   slot u →  Int32Array of length deg(u), filled with edge slot indices
 *   slot v →  Int32Array of length deg(v), filled with edge slot indices
 *   ...
 * ```
 *
 * Each per-slot array grows geometrically and uses **swap-pop** removal to
 * keep insert / remove at O(1) amortized.
 *
 * Why per-slot `Int32Array`s instead of a single shared CSR-style buffer:
 * realtime mutations dominate this workload. CSR would be faster to iterate
 * but rebuild-on-insert kills the streaming case. Per-slot typed arrays give
 * dynamic O(1) insert + remove with `subarray` views for zero-allocation
 * iteration of live entries.
 *
 * @internal — not exported from `@invana/graph`. Used only inside `GraphStore`.
 */
export class AdjacencyIndex {
  /** Per-slot edge-slot lists. `buckets[u]` may be `undefined` for empty slots. */
  private buckets: (Int32Array | undefined)[] = [];

  /** Live entry count per slot. Parallels `buckets`. */
  private degrees: Int32Array;

  /** Initial per-bucket capacity. Doubles geometrically on overflow. */
  private static readonly INITIAL_BUCKET_CAPACITY = 4;

  constructor(initialNodeCapacity = 256) {
    this.degrees = new Int32Array(initialNodeCapacity);
  }

  /**
   * Ensure the degree array is large enough to address slot `slot`. Mirrors
   * the geometric growth pattern of `ColumnStore`.
   */
  ensureCapacity(slot: number): void {
    if (slot < this.degrees.length) return;
    let next = this.degrees.length || 1;
    while (next <= slot) next *= 2;
    const grown = new Int32Array(next);
    grown.set(this.degrees);
    this.degrees = grown;
  }

  /** Degree of `slot`. Zero if the slot has no edges or is unallocated. */
  degree(slot: number): number {
    return slot < this.degrees.length ? this.degrees[slot]! : 0;
  }

  /**
   * Append `edgeSlot` to slot `slot`'s adjacency. Allocates / grows the
   * per-slot `Int32Array` as needed.
   */
  add(slot: number, edgeSlot: number): void {
    this.ensureCapacity(slot);
    let bucket = this.buckets[slot];
    const deg = this.degrees[slot]!;
    if (!bucket) {
      bucket = new Int32Array(AdjacencyIndex.INITIAL_BUCKET_CAPACITY);
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
  remove(slot: number, edgeSlot: number): boolean {
    if (slot >= this.degrees.length) return false;
    const bucket = this.buckets[slot];
    const deg = this.degrees[slot]!;
    if (!bucket || deg === 0) return false;
    for (let i = 0; i < deg; i++) {
      if (bucket[i] === edgeSlot) {
        const last = deg - 1;
        if (i !== last) bucket[i] = bucket[last]!;
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
  view(slot: number): Int32Array {
    if (slot >= this.degrees.length) return EMPTY_VIEW;
    const bucket = this.buckets[slot];
    const deg = this.degrees[slot]!;
    if (!bucket || deg === 0) return EMPTY_VIEW;
    return bucket.subarray(0, deg);
  }

  /** Clear all per-slot data (e.g. on `store.clear()`). Capacity preserved. */
  clearAll(): void {
    this.buckets.length = 0;
    this.degrees.fill(0);
  }

  /** Reset a single slot (e.g. on `removeNode`). */
  clearSlot(slot: number): void {
    if (slot >= this.degrees.length) return;
    this.buckets[slot] = undefined;
    this.degrees[slot] = 0;
  }
}

/** Shared empty view returned for zero-degree slots. */
const EMPTY_VIEW = new Int32Array(0);
