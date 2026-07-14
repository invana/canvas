/**
 * `HitIndex` — thin wrapper around `rbush` for spatial hit-testing.
 *
 * Stays generic over kind ('shape' | 'connector') so a single index serves
 * both. Hit-testing returns candidates in indeterminate order; the renderer
 * resolves topmost-by-zIndex.
 *
 * Per-id slot map keeps `update(id, ...)` O(log n) — we hold onto the
 * inserted entry so we can remove it before re-inserting the new bbox.
 */

import RBush from 'rbush';
import type { Rect } from '../primitives/types';

export interface HitEntry {
  readonly id: string;
  readonly kind: 'shape' | 'connector';
  /** zIndex from the spec; used by `PrimitivesRenderer` to pick topmost. */
  readonly zIndex: number;
  // rbush indexes by these four fields:
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export class HitIndex {
  private readonly tree = new RBush<HitEntry>();
  private readonly entries = new Map<string, HitEntry>();

  insert(id: string, kind: HitEntry['kind'], rect: Rect, zIndex: number): void {
    this.remove(id);
    const entry: HitEntry = {
      id,
      kind,
      zIndex,
      minX: rect.x,
      minY: rect.y,
      maxX: rect.x + rect.width,
      maxY: rect.y + rect.height,
    };
    this.tree.insert(entry);
    this.entries.set(id, entry);
  }

  /** Update the bbox + zIndex for an existing entry. No-op if unknown. */
  update(id: string, rect: Rect, zIndex: number): void {
    const prev = this.entries.get(id);
    if (!prev) return;
    this.insert(id, prev.kind, rect, zIndex);
  }

  remove(id: string): void {
    const prev = this.entries.get(id);
    if (!prev) return;
    this.tree.remove(prev);
    this.entries.delete(id);
  }

  /** True if an entry with this id is currently indexed. Lets callers choose
   * between an immediate insert (new id) and a deferred bulk bbox refresh
   * (existing id) — see `PrimitivesRenderer`'s moved-hit deferral. */
  has(id: string): boolean {
    return this.entries.has(id);
  }

  /**
   * Query candidates whose bbox intersects a `padWorld`-padded box around
   * `(x, y)`. With `padWorld = 0` (default), this matches the classic
   * "point in bbox" search.
   *
   * The pad exists for the renderer's **screen-pixel hit floor**:
   * `PrimitivesRenderer.hitTest` passes `MIN_HIT_PX / camera.scale` so a
   * shape whose bbox is smaller than the floor (e.g. a node collapsed to
   * sub-pixel size at low zoom) is still in the candidate set. The
   * subsequent `containsWithFloor` / precise check applies the same floor
   * in local coords. Without this pad, rbush would prune the tiny shape
   * before the floor could rescue it.
   *
   * Caller is responsible for the precise per-shape hit-test if the bbox
   * isn't the final answer (e.g. a circle inside its bbox).
   */
  query(x: number, y: number, padWorld: number = 0): HitEntry[] {
    return this.tree.search({
      minX: x - padWorld,
      minY: y - padWorld,
      maxX: x + padWorld,
      maxY: y + padWorld,
    });
  }

  clear(): void {
    this.tree.clear();
    this.entries.clear();
  }

  /**
   * Bulk replace bboxes for many existing entries in one O(N log N) pass.
   *
   * Per-id `update(...)` does `remove + insert`, and rbush's `remove(item)`
   * is a linear tree walk — so updating thousands of entries one at a time
   * is O(N²). When a behaviour like `NodeScaleLODBehaviour` rescales every
   * node on each camera-zoom frame, the per-id path floors fps even at
   * modest graph sizes.
   *
   * This path swaps the cached entry's bbox in place (the tree still holds
   * the same reference, so we can mutate the four bbox fields directly),
   * then rebuilds the tree once via `clear + load`. Bulk-loading is
   * `O(N log N)` total — for 3k entries, ~10× faster than the per-id
   * variant. zIndex is left untouched.
   *
   * Use when many entries change in the same logical tick (zoom settle,
   * bulk position update). For single-shape edits, prefer {@link update}.
   */
  bulkUpdateBoxes(updates: Iterable<{ id: string; rect: Rect }>): void {
    let touched = false;
    for (const u of updates) {
      const entry = this.entries.get(u.id);
      if (!entry) continue;
      entry.minX = u.rect.x;
      entry.minY = u.rect.y;
      entry.maxX = u.rect.x + u.rect.width;
      entry.maxY = u.rect.y + u.rect.height;
      touched = true;
    }
    if (!touched) return;
    this.tree.clear();
    this.tree.load([...this.entries.values()]);
  }

  get size(): number {
    return this.entries.size;
  }
}
