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

  /**
   * Query candidates whose bbox contains `(x, y)`. Caller is responsible for
   * precise per-shape hit-testing if the bbox is not the final answer (e.g.
   * a circle inside its bbox).
   */
  query(x: number, y: number): HitEntry[] {
    return this.tree.search({ minX: x, minY: y, maxX: x, maxY: y });
  }

  clear(): void {
    this.tree.clear();
    this.entries.clear();
  }

  get size(): number {
    return this.entries.size;
  }
}
