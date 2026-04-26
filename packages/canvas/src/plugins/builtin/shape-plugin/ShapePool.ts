// ── ShapePool ─────────────────────────────────────────────────────────────────
// Stores ALL shapes (including off-screen ones) as plain JS ShapeObjects.
// Maintains an RBush spatial index for O(log n) viewport cull + hit-testing.

import RBush from 'rbush';
import { ShapeObject } from './ShapeObject.js';
import type { ShapeSpec, ShapeBBox } from './spec/shapes.js';
import { computeBBox } from './spec/shapes.js';

interface RBushItem extends ShapeBBox {
  id: string;
}

/**
 * `ShapePool` stores **all** shapes — including off-screen ones — as
 * `ShapeObject` instances and maintains an RBush R-tree spatial index for
 * O(log n) viewport culling and hit-testing.
 *
 * @remarks
 * This class is internal to {@link ShapePlugin}. Consumers interact with shapes
 * through the plugin’s public API (`add`, `remove`, `update`, `get`).
 */
export class ShapePool {
  private _objects = new Map<string, ShapeObject>();
  private _tree = new RBush<RBushItem>();

  /**
   * Add a shape to the pool. If a shape with the same id already exists it is
   * replaced (removed first, then re-added).
   *
   * @param spec - The shape specification.
   * @returns The newly created {@link ShapeObject}.
   */
  add(spec: ShapeSpec): ShapeObject {
    if (this._objects.has(spec.id)) {
      this.remove(spec.id);
    }
    const obj = new ShapeObject(spec);
    this._objects.set(spec.id, obj);
    this._tree.insert(this._item(obj));
    return obj;
  }

  /**
   * Remove a shape from the pool and the spatial index.
   *
   * @remarks
   * Does **not** call `obj.destroy()` — the caller is responsible for evicting
   * the shape from the scene graph before calling this method.
   *
   * @param id - Id of the shape to remove.
   */
  remove(id: string): void {
    const obj = this._objects.get(id);
    if (!obj) return;
    this._tree.remove(this._item(obj), (a, b) => a.id === b.id);
    this._objects.delete(id);
    // Do NOT call obj.destroy() here — SceneContainer may still hold the container.
    // Caller is responsible for removing from scene first.
  }

  /**
   * Retrieve a {@link ShapeObject} by id.
   *
   * @param id - Shape id.
   * @returns The `ShapeObject`, or `undefined` if not in the pool.
   */
  get(id: string): ShapeObject | undefined {
    return this._objects.get(id);
  }

  /** Returns `true` if a shape with the given id is in the pool. */
  has(id: string): boolean {
    return this._objects.has(id);
  }

  /**
   * Recompute the spatial bbox of a shape after its spec has been mutated.
   * Removes the old R-tree entry and re-inserts with the fresh bbox.
   *
   * @param obj - The shape whose spec was modified.
   */
  updateBBox(obj: ShapeObject): void {
    this._tree.remove(this._item(obj), (a, b) => a.id === b.id);
    obj.bbox = computeBBox(obj.spec);
    this._tree.insert(this._item(obj));
  }

  /**
   * Return all `ShapeObject`s whose bounding box intersects the given
   * world-space AABB. O(log n) via the RBush spatial index.
   *
   * @param minX - Left edge of the query rectangle.
   * @param minY - Top edge of the query rectangle.
   * @param maxX - Right edge of the query rectangle.
   * @param maxY - Bottom edge of the query rectangle.
   */
  search(minX: number, minY: number, maxX: number, maxY: number): ShapeObject[] {
    return this._tree
      .search({ minX, minY, maxX, maxY })
      .map(item => this._objects.get(item.id)!)
      .filter(Boolean);
  }

  /**
   * Find the topmost shape at a world-space point using a broad-phase RBush
   * search followed by precise geometric per-shape hit testing.
   *
   * @param worldX - X coordinate in world space.
   * @param worldY - Y coordinate in world space.
   * @param tolerance - Half-size of the broad-phase query box in pixels (default: 4).
   * @returns The topmost hit shape, or `null` if none.
   */
  hitTest(worldX: number, worldY: number, tolerance = 4): ShapeObject | null {
    const candidates = this.search(worldX - tolerance, worldY - tolerance, worldX + tolerance, worldY + tolerance);
    // Test in reverse zIndex order (highest zIndex = topmost)
    candidates.sort((a, b) => (b.spec.zIndex ?? 0) - (a.spec.zIndex ?? 0));
    return candidates.find(c => c.hitTest(worldX, worldY)) ?? null;
  }

  /** Remove all shapes and clear the spatial index. */
  clear(): void {
    this._objects.clear();
    this._tree.clear();
  }

  /** Total number of shapes in the pool (visible and off-screen). */
  get size(): number {
    return this._objects.size;
  }

  /** Iterate over all shapes in the pool. */
  values(): IterableIterator<ShapeObject> {
    return this._objects.values();
  }

  /**
   * Return the bounding box of every shape in the pool.
   * Used by {@link ShapePlugin.fit} to compute the full content AABB.
   */
  allBBoxes(): { minX: number; minY: number; maxX: number; maxY: number }[] {
    return this._tree.all();
  }

  private _item(obj: ShapeObject): RBushItem {
    return { ...obj.bbox, id: obj.id };
  }
}
