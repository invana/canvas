/**
 * `DirtyBatcher<TBucket>` — accumulates "this id changed" signals between frames,
 * deduplicates them, and hands a per-frame snapshot to a flush callback.
 *
 * Relocated into `@invana/canvas-store` (decision D1) alongside {@link ColumnStore}
 * — the renderer-free machinery behind the kernel's coalesced data flush. Pure;
 * **no rendering, no pixi, no `requestAnimationFrame` of its own** — the owner
 * (the engine's single rAF loop) calls {@link flush} once per tick.
 *
 * **Performance contract:** `mark` O(1) (Map.get + Set.add, no steady-state
 * alloc); `markAll` O(1) (a flag); `flush` O(1) (Map swap, no copy). Per-frame
 * consumer work is proportional to *changed* ids, never total scene size. Sets are
 * reused across frames (double-buffered) — zero GC pressure in steady state.
 *
 * **Double buffering:** `flush()` returns a snapshot of the previous frame's marks
 * and swaps in the empty buffer, so any `mark()` during the consumer's handler
 * lands in the *next* frame — never corrupts the iteration in flight.
 */

/**
 * The snapshot handed to the flush handler. `buckets` is keyed by bucket name →
 * the Set of dirty ids this frame (untouched buckets are absent). `rebuildAll` is
 * the set of buckets flagged via {@link DirtyBatcher.markAll} — for those, iterate
 * the underlying data, not the per-id Set.
 */
export interface DirtySnapshot<TBucket extends string = string> {
  readonly buckets: ReadonlyMap<TBucket, ReadonlySet<string>>;
  readonly rebuildAll: ReadonlySet<TBucket>;
}

/** One side of the double buffer. Internal. */
interface BatcherFrame<TBucket extends string> {
  buckets: Map<TBucket, Set<string>>;
  rebuildAll: Set<TBucket>;
}

export class DirtyBatcher<TBucket extends string = string> {
  private active: BatcherFrame<TBucket> = makeFrame<TBucket>();
  private buffer: BatcherFrame<TBucket> = makeFrame<TBucket>();
  private _dirty = false;

  /** Mark a single id dirty in a bucket. O(1); bucket Sets are created lazily + reused. */
  mark(bucket: TBucket, id: string): void {
    let set = this.active.buckets.get(bucket);
    if (!set) {
      set = new Set<string>();
      this.active.buckets.set(bucket, set);
    }
    set.add(id);
    this._dirty = true;
  }

  /** Flag a whole bucket for rebuild (theme change, LOD swap, wholesale replace). */
  markAll(bucket: TBucket): void {
    this.active.rebuildAll.add(bucket);
    this._dirty = true;
  }

  /** Cheap check the tick uses to decide whether to call {@link flush}. */
  hasPending(): boolean {
    return this._dirty;
  }

  /**
   * Swap buffers and return the previous frame's snapshot. The returned Sets are
   * still owned by the batcher — **do not retain references past the flush call**;
   * the next `flush()` reuses and clears them.
   */
  flush(): DirtySnapshot<TBucket> {
    const outgoing = this.active;
    this.active = this.buffer;
    this.buffer = outgoing;
    this._dirty = false;
    // Pre-clear the new active frame; `outgoing` is cleared on the FOLLOWING flush.
    for (const set of this.active.buckets.values()) set.clear();
    this.active.rebuildAll.clear();
    return outgoing as unknown as DirtySnapshot<TBucket>;
  }

  /** Drop both buffers. Call on unmount; usable again afterwards. */
  reset(): void {
    for (const set of this.active.buckets.values()) set.clear();
    for (const set of this.buffer.buckets.values()) set.clear();
    this.active.rebuildAll.clear();
    this.buffer.rebuildAll.clear();
    this._dirty = false;
  }

  /** Number of dirty ids in a bucket (0 if never touched). Debug. */
  bucketSize(bucket: TBucket): number {
    return this.active.buckets.get(bucket)?.size ?? 0;
  }

  /** True iff the bucket is flagged for rebuild this frame. Debug. */
  isRebuildAll(bucket: TBucket): boolean {
    return this.active.rebuildAll.has(bucket);
  }
}

function makeFrame<TBucket extends string>(): BatcherFrame<TBucket> {
  return {
    buckets: new Map<TBucket, Set<string>>(),
    rebuildAll: new Set<TBucket>(),
  };
}
