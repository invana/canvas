// ── GraphPool ─────────────────────────────────────────────────────────────────
// Stores ALL graph objects (including off-screen ones) and maintains an RBush
// spatial index for O(log n) viewport culling and pointer hit-testing.

import RBush from 'rbush';
import type { GraphObject } from './GraphObject.js';
import type { BBox } from './spec/index.js';

interface RBushEntry extends BBox {
  id: string;
}

/**
 * `GraphPool` stores `GraphObject` instances and maintains an RBush R-tree
 * for O(log n) viewport culling and pointer hit-testing.
 *
 * @remarks
 * Use a **separate** `GraphPool` instance for node elements and for connector
 * elements so each can be culled and z-ordered independently.
 *
 * This class is internal to {@link GraphPlugin}.
 */
export class GraphPool {
  private _objects = new Map<string, GraphObject>();
  private _tree    = new RBush<RBushEntry>();

  /**
   * Add an object to the pool.  If an object with the same id already exists
   * it is replaced (old entry removed first).
   */
  add(obj: GraphObject): void {
    if (this._objects.has(obj.id)) this.remove(obj.id);
    this._objects.set(obj.id, obj);
    this._tree.insert(this._entry(obj));
  }

  /**
   * Remove an object from the pool and the spatial index.
   */
  remove(id: string): void {
    const obj = this._objects.get(id);
    if (!obj) return;
    this._tree.remove(this._entry(obj), (a, b) => a.id === b.id);
    this._objects.delete(id);
  }

  /** Retrieve a `GraphObject` by id. */
  get(id: string): GraphObject | undefined {
    return this._objects.get(id);
  }

  /** Returns `true` if an object with the given id is in the pool. */
  has(id: string): boolean {
    return this._objects.has(id);
  }

  /**
   * Recompute the spatial bbox of an object after its spec has been mutated.
   */
  updateBBox(obj: GraphObject): void {
    this._tree.remove(this._entry(obj), (a, b) => a.id === b.id);
    this._tree.insert(this._entry(obj));
  }

  /**
   * Return all `GraphObject`s whose bounding box intersects the given AABB.
   */
  search(minX: number, minY: number, maxX: number, maxY: number): GraphObject[] {
    return this._tree
      .search({ minX, minY, maxX, maxY })
      .map(e => this._objects.get(e.id)!)
      .filter(Boolean);
  }

  /**
   * Find the topmost (highest z-index) object under a world-space pointer.
   */
  hitTest(wx: number, wy: number): GraphObject | null {
    const candidates = this.search(wx - 1, wy - 1, wx + 1, wy + 1);
    for (let i = candidates.length - 1; i >= 0; i--) {
      if (candidates[i]!.hitTest(wx, wy)) return candidates[i]!;
    }
    return null;
  }

  /** All bounding boxes — used by `GraphPlugin.fitContent()`. */
  allBBoxes(): BBox[] {
    return Array.from(this._objects.values()).map(o => o.getBBox());
  }

  /** Iterable over all stored `GraphObject`s. */
  values(): IterableIterator<GraphObject> {
    return this._objects.values();
  }

  /** Clear pool and spatial index.  Does NOT destroy the objects. */
  clear(): void {
    this._tree.clear();
    this._objects.clear();
  }

  private _entry(obj: GraphObject): RBushEntry {
    return { ...obj.getBBox(), id: obj.id };
  }
}
