/**
 * `PointerCollector` — the pure state machine behind the drawing and measuring
 * tools. It knows nothing about maps, layers or the DOM: it is fed clicks, pointer
 * moves and three keys, and says what shape is being built.
 *
 * | Shape | Vertices | Finishes on |
 * |---|---|---|
 * | `polygon` | 3 or more | double-click or Enter |
 * | `line` | 2 or more | double-click or Enter |
 * | `circle` | centre, then a radius point | the second click, or Enter |
 *
 * Backspace drops the last vertex; Escape abandons the shape. A finish with too
 * few vertices does nothing, so a stray double-click never makes a sliver.
 */

import { haversineKm } from '../geo/geodesy';
import type { Position } from '../features/types';

/** What is being built. */
export type ShapeKind = 'polygon' | 'line' | 'circle';

/** A finished shape. A circle's `points` is `[centre]` and `radiusKm` is set. */
export interface CollectedShape {
  kind: ShapeKind;
  points: Position[];
  radiusKm?: number;
}

export class PointerCollector {
  private vertices: Position[] = [];
  private cursorAt: Position | null = null;

  constructor(readonly kind: ShapeKind) {}

  /** The vertices placed so far. */
  get points(): readonly Position[] {
    return this.vertices;
  }

  /** Where the pointer is now, or `null` before it has moved. */
  get cursor(): Position | null {
    return this.cursorAt;
  }

  /** Whether anything has been placed. */
  get active(): boolean {
    return this.vertices.length > 0;
  }

  /**
   * Place a vertex. A click within `minSeparationKm` of the last vertex is ignored
   * — the two clicks of a double-click land on the same spot, and must not make a
   * zero-length edge. For a circle the second click finishes it and is returned.
   */
  click(p: Position, minSeparationKm = 0): CollectedShape | null {
    const last = this.vertices[this.vertices.length - 1];
    if (last && haversineKm(last, p) <= minSeparationKm) return null;
    this.vertices.push(p);
    if (this.kind === 'circle' && this.vertices.length === 2) return this.finish();
    return null;
  }

  /** The pointer moved. */
  move(p: Position): void {
    this.cursorAt = p;
  }

  /** Finish the shape if it has enough vertices; `null` (and no change) if not. */
  finish(): CollectedShape | null {
    const pts = this.vertices;
    if (this.kind === 'polygon' && pts.length >= 3) return this.done({ kind: 'polygon', points: [...pts] });
    if (this.kind === 'line' && pts.length >= 2) return this.done({ kind: 'line', points: [...pts] });
    if (this.kind === 'circle' && pts.length >= 2) {
      return this.done({ kind: 'circle', points: [pts[0]!], radiusKm: haversineKm(pts[0]!, pts[1]!) });
    }
    // A circle finished with Enter takes its radius from the pointer.
    if (this.kind === 'circle' && pts.length === 1 && this.cursorAt) {
      const radiusKm = haversineKm(pts[0]!, this.cursorAt);
      if (radiusKm > 0) return this.done({ kind: 'circle', points: [pts[0]!], radiusKm });
    }
    return null;
  }

  /** Drop the last vertex. */
  undoLast(): void {
    this.vertices.pop();
  }

  /** Abandon the shape. */
  cancel(): void {
    this.vertices = [];
    this.cursorAt = null;
  }

  /**
   * The shape as it would be if it finished now, pointer included — for the
   * dashed preview. `null` until there is something to show.
   */
  preview(): { geometry: 'point' | 'line' | 'polygon'; points: Position[]; radiusKm?: number } | null {
    const pts = this.cursorAt ? [...this.vertices, this.cursorAt] : [...this.vertices];
    if (this.vertices.length === 0) return null;
    if (this.kind === 'circle') {
      const radiusKm = this.cursorAt ? haversineKm(this.vertices[0]!, this.cursorAt) : 0;
      return { geometry: 'point', points: [this.vertices[0]!], ...(radiusKm > 0 ? { radiusKm } : {}) };
    }
    if (this.kind === 'line' || pts.length < 3) return pts.length >= 2 ? { geometry: 'line', points: pts } : { geometry: 'point', points: pts };
    return { geometry: 'polygon', points: pts };
  }

  private done(shape: CollectedShape): CollectedShape {
    this.cancel();
    return shape;
  }
}
