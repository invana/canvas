// ── ElementPool ───────────────────────────────────────────────────────────────
// Stores ALL elements (including off-screen ones) and maintains an RBush
// spatial index for O(log n) viewport culling and pointer hit-testing.

import RBush from 'rbush';
import type { ElementObject } from './ElementObject.js';
import type { BBox } from './spec/index.js';

interface RBushEntry extends BBox {
  id: string;
}

/**
 * `ElementPool` stores `ElementObject` instances and maintains an RBush R-tree
 * for O(log n) viewport culling and pointer hit-testing.
 *
 * @remarks
 * Use a **separate** `ElementPool` instance for solid elements and for connector
 * elements so each can be culled and z-ordered independently.
 *
 * This class is internal to {@link ElementPlugin}.
 */
export class ElementPool {
  private _objects = new Map<string, ElementObject>();
  private _tree    = new RBush<RBushEntry>();

  /**
   * Add an element to the pool.  If an element with the same id already exists
   * it is replaced (old entry removed first).
   */
  add(obj: ElementObject): void {
    if (this._objects.has(obj.id)) this.remove(obj.id);
    this._objects.set(obj.id, obj);
    this._tree.insert(this._entry(obj));
  }

  /**
   * Remove an element from the pool and the spatial index.
   *
   * @remarks
   * Does **not** call `obj.destroy()` — the caller is responsible for evicting
   * the container from the scene before calling this.
   */
  remove(id: string): void {
    const obj = this._objects.get(id);
    if (!obj) return;
    this._tree.remove(this._entry(obj), (a, b) => a.id === b.id);
    this._objects.delete(id);
  }

  /** Retrieve an `ElementObject` by id. */
  get(id: string): ElementObject | undefined {
    return this._objects.get(id);
  }

  /** Returns `true` if an element with the given id is in the pool. */
  has(id: string): boolean {
    return this._objects.has(id);
  }

  /**
   * Recompute the spatial bbox of an element after its spec has been mutated.
   * Removes the old R-tree entry and re-inserts with the fresh bbox.
   */
  updateBBox(obj: ElementObject): void {
    this._tree.remove(this._entry(obj), (a, b) => a.id === b.id);
    this._tree.insert(this._entry(obj));
  }

  /**
   * Return all `ElementObject`s whose bounding box intersects the given AABB.
   * O(log n) via RBush.
   */
  search(minX: number, minY: number, maxX: number, maxY: number): ElementObject[] {
    return this._tree
      .search({ minX, minY, maxX, maxY })
      .map(e => this._objects.get(e.id)!)
      .filter(Boolean);
  }

  /**
   * Find the topmost (highest z-index) element under a world-space pointer.
   * Queries a 1-pixel box and runs precise `hitTest()` on each candidate.
   *
   * @returns The hit `ElementObject`, or `null` if nothing was hit.
   */
  hitTest(wx: number, wy: number): ElementObject | null {
    const candidates = this.search(wx - 1, wy - 1, wx + 1, wy + 1);
    // Iterate in reverse to hit topmost (highest z-index) first
    for (let i = candidates.length - 1; i >= 0; i--) {
      if (candidates[i]!.hitTest(wx, wy)) return candidates[i]!;
    }
    return null;
  }

  /** All bounding boxes — used by `ElementPlugin.fit()`. */
  allBBoxes(): BBox[] {
    return Array.from(this._objects.values()).map(o => o.getBBox());
  }

  /** Iterable over all stored `ElementObject`s. */
  values(): IterableIterator<ElementObject> {
    return this._objects.values();
  }

  /** Clear pool and spatial index.  Does NOT destroy the objects. */
  clear(): void {
    this._tree.clear();
    this._objects.clear();
  }

  private _entry(obj: ElementObject): RBushEntry {
    return { ...obj.getBBox(), id: obj.id };
  }
}
