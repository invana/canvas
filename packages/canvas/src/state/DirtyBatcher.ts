/**
 * `DirtyBatcher<TBucket>` — accumulates "this id changed" signals between
 * frames, deduplicates them, and hands a per-frame snapshot to a flush callback.
 *
 * Architecture: see `architecture-proposal.md` §2.1 (Render projection).
 *
 * **Single responsibility:** absorb high-frequency dirty signals; nothing else.
 * No rendering, no PixiJS knowledge, no `requestAnimationFrame` of its own.
 * Canvas owns the single RAF (proposal §2.1) and calls `flush()` once per tick.
 *
 * **Performance properties (the contract that makes the architecture work)**
 *
 * - `mark(bucket, id)`: O(1) — Map.get + Set.add. No allocation in steady state.
 * - `markAll(bucket)`: O(1) — sets a flag.
 * - `flush()`: O(1) — Map swap, no copy.
 * - Per-frame work for the consumer is proportional to `changed` ids,
 *   never total scene size.
 * - Sets are reused across frames (cleared after swap-out, not reallocated).
 *   Zero GC pressure in steady state.
 *
 * **Double buffering & mid-flush mutations**
 *
 * `flush()` returns a snapshot whose Sets are the previous frame's accumulated
 * marks. The "active" Sets are swapped to the empty buffer, so any `mark()`
 * call made *during* the consumer's flush handler lands in the next frame's
 * bucket — never corrupts the iteration in flight, never loops.
 *
 * @example
 * type GraphDirty = 'shape' | 'halo' | 'edge';
 * const dirty = new DirtyBatcher<GraphDirty>();
 *
 * // anywhere — mutation site
 * dirty.mark('shape', 'n-42');
 *
 * // canvas tick
 * if (dirty.hasPending()) {
 *   const snap = dirty.flush();
 *   for (const id of snap.buckets.shape) renderer.updateShape(id, ...);
 *   for (const id of snap.buckets.halo)  renderer.setDecoration(id, 'halo', ...);
 * }
 */

/**
 * The frozen snapshot handed to the flush handler.
 *
 * `buckets` is a ReadonlyMap keyed by bucket name; each value is the Set of
 * dirty ids for that bucket this frame. Buckets that have never been touched
 * are absent (use `snap.buckets.get(bucket) ?? EMPTY_SET` to handle missing).
 *
 * `rebuildAll` is the Set of buckets the consumer marked with `markAll()`.
 * For those buckets, the consumer should iterate the underlying data
 * (not the per-id Set) — usually meaning "rebuild everything in this category."
 */
export interface DirtySnapshot<TBucket extends string = string> {
  readonly buckets: ReadonlyMap<TBucket, ReadonlySet<string>>;
  readonly rebuildAll: ReadonlySet<TBucket>;
}

/**
 * One side of the double buffer. Internal.
 */
interface BatcherFrame<TBucket extends string> {
  buckets: Map<TBucket, Set<string>>;
  rebuildAll: Set<TBucket>;
}

export class DirtyBatcher<TBucket extends string = string> {
  // The currently-accumulating frame.
  private active: BatcherFrame<TBucket> = makeFrame<TBucket>();
  // The other half of the double buffer. Repurposed for the next frame
  // after `flush()` swaps and clears it.
  private buffer: BatcherFrame<TBucket> = makeFrame<TBucket>();

  /** True iff at least one mark has landed since the last flush. */
  private _dirty = false;

  /**
   * Mark a single id as dirty in a bucket. O(1), no allocation in steady state.
   *
   * Bucket Sets are created lazily on first mark and reused thereafter.
   * If the bucket is currently flagged `markAll`, this call is redundant
   * (consumer will iterate all data anyway) but cheap and harmless.
   */
  mark(bucket: TBucket, id: string): void {
    let set = this.active.buckets.get(bucket);
    if (!set) {
      set = new Set<string>();
      this.active.buckets.set(bucket, set);
    }
    set.add(id);
    this._dirty = true;
  }

  /**
   * Flag a whole bucket as needing rebuild. The consumer's flush handler
   * should iterate its full data set for this bucket, ignoring the per-id Set.
   *
   * Use for bulk events: theme change, LOD swap, "everything moved",
   * data feed wholesale replace.
   */
  markAll(bucket: TBucket): void {
    this.active.rebuildAll.add(bucket);
    this._dirty = true;
  }

  /** Cheap check the canvas tick uses to decide whether to call `flush()`. */
  hasPending(): boolean {
    return this._dirty;
  }

  /**
   * Swap buffers and return the previous frame's snapshot. After this call:
   *   - The returned snapshot is stable for the duration of the consumer's
   *     handler (any new marks land in the freshly-cleared other buffer).
   *   - `hasPending()` returns false until the next mark.
   *
   * The handed-out Sets are still owned by the batcher — the consumer must
   * **not retain references past the flush call**. The next `flush()` will
   * reuse and clear them.
   */
  flush(): DirtySnapshot<TBucket> {
    // Swap: outgoing snapshot = active; new active = buffer (which is empty).
    const outgoing = this.active;
    this.active = this.buffer;
    this.buffer = outgoing;
    this._dirty = false;

    // Pre-clear the new active frame so the next `mark()` finds it empty.
    // Note: we DON'T clear `outgoing` here — we hand it to the consumer first.
    // It gets cleared on the next `flush()` (when it returns to active service)
    // or right now if we want eager cleanup. We do eager cleanup AFTER returning
    // (no — actually we must do it before, since we return outgoing as-is).
    // Compromise: pre-clear new active *before* returning the snapshot. The
    // outgoing buffer is cleared on the FOLLOWING flush, when it cycles back.

    for (const set of this.active.buckets.values()) set.clear();
    this.active.rebuildAll.clear();

    return outgoing as unknown as DirtySnapshot<TBucket>;
  }

  /**
   * Drop both buffers. Call on layer unmount. After reset(), the batcher is
   * usable again from a clean state.
   */
  reset(): void {
    for (const set of this.active.buckets.values()) set.clear();
    for (const set of this.buffer.buckets.values()) set.clear();
    this.active.rebuildAll.clear();
    this.buffer.rebuildAll.clear();
    this._dirty = false;
  }

  // ─── Test/debug helpers ─────────────────────────────────────────────────

  /** Number of dirty ids in a bucket. Returns 0 if bucket has never been touched. */
  bucketSize(bucket: TBucket): number {
    return this.active.buckets.get(bucket)?.size ?? 0;
  }

  /** True iff the bucket has been flagged for rebuild this frame. */
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
