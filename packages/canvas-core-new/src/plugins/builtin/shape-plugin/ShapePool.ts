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

export class ShapePool {
  private _objects = new Map<string, ShapeObject>();
  private _tree = new RBush<RBushItem>();

  add(spec: ShapeSpec): ShapeObject {
    if (this._objects.has(spec.id)) {
      this.remove(spec.id);
    }
    const obj = new ShapeObject(spec);
    this._objects.set(spec.id, obj);
    this._tree.insert(this._item(obj));
    return obj;
  }

  remove(id: string): void {
    const obj = this._objects.get(id);
    if (!obj) return;
    this._tree.remove(this._item(obj), (a, b) => a.id === b.id);
    this._objects.delete(id);
    // Do NOT call obj.destroy() here — SceneContainer may still hold the container.
    // Caller is responsible for removing from scene first.
  }

  get(id: string): ShapeObject | undefined {
    return this._objects.get(id);
  }

  has(id: string): boolean {
    return this._objects.has(id);
  }

  updateBBox(obj: ShapeObject): void {
    this._tree.remove(this._item(obj), (a, b) => a.id === b.id);
    obj.bbox = computeBBox(obj.spec);
    this._tree.insert(this._item(obj));
  }

  /** Return all ShapeObjects whose bbox intersects the given world-space AABB */
  search(minX: number, minY: number, maxX: number, maxY: number): ShapeObject[] {
    return this._tree
      .search({ minX, minY, maxX, maxY })
      .map(item => this._objects.get(item.id)!)
      .filter(Boolean);
  }

  /** Find the topmost shape at a world-space point */
  hitTest(worldX: number, worldY: number, tolerance = 4): ShapeObject | null {
    const candidates = this.search(worldX - tolerance, worldY - tolerance, worldX + tolerance, worldY + tolerance);
    // Test in reverse zIndex order (highest zIndex = topmost)
    candidates.sort((a, b) => (b.spec.zIndex ?? 0) - (a.spec.zIndex ?? 0));
    return candidates.find(c => c.hitTest(worldX, worldY)) ?? null;
  }

  clear(): void {
    this._objects.clear();
    this._tree.clear();
  }

  get size(): number {
    return this._objects.size;
  }

  values(): IterableIterator<ShapeObject> {
    return this._objects.values();
  }

  /** Return every shape's bbox — used by ShapePlugin.fit() */
  allBBoxes(): { minX: number; minY: number; maxX: number; maxY: number }[] {
    return this._tree.all();
  }

  private _item(obj: ShapeObject): RBushItem {
    return { ...obj.bbox, id: obj.id };
  }
}
