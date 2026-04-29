// ── ShapeScene ────────────────────────────────────────────────────────────────
// Manages one PixiJS scene graph slice for ShapesPlugin.
// Only visible elements are attached as Container children.

import type { Container } from 'pixi.js';
import type { ShapePool } from './ShapePool.js';
import type { CameraBounds } from './CameraTracker.js';
import { LOD } from './LODController.js';

/**
 * `ShapeScene` manages one PixiJS layer for {@link ShapesPlugin}.
 *
 * @remarks
 * On every camera change it diffs the current visible set against the new
 * viewport AABB provided by {@link CameraTracker}:
 * - Elements **entering** the viewport are drawn then attached.
 * - Elements **leaving** the viewport are detached (not destroyed) for cheap re-entry.
 *
 * This class is internal to {@link ShapesPlugin}.
 */
export class ShapeScene {
  private _layer:   Container;
  private _pool:    ShapePool;
  private _visible = new Set<string>();
  private _detail:  LOD = LOD.DETAIL;
  private _dirtyQueue: string[] = [];
  private _sweepRafId: number | null = null;
  private static readonly SWEEP_CHUNK = 80;
  private _incomingIds = new Set<string>();

  constructor(layer: Container, pool: ShapePool) {
    this._layer = layer;
    this._pool  = pool;
    layer.isRenderGroup = true;
  }

  // ── Camera-driven culling ─────────────────────────────────────────────────

  /**
   * Called by {@link CameraTracker} whenever the camera moves or zooms.
   */
  onCameraChanged(bounds: CameraBounds): void {
    this._incomingIds.clear();
    for (const obj of this._pool.search(bounds.minX, bounds.minY, bounds.maxX, bounds.maxY)) {
      this._incomingIds.add(obj.id);
    }

    for (const id of this._visible) {
      if (!this._incomingIds.has(id)) {
        const obj = this._pool.get(id);
        if (obj) this._layer.removeChild(obj.container);
        this._visible.delete(id);
      }
    }

    for (const id of this._incomingIds) {
      if (!this._visible.has(id)) {
        const obj = this._pool.get(id);
        if (obj) {
          obj.draw(this._detail);
          this._layer.addChild(obj.container);
          this._visible.add(id);
        }
      }
    }
  }

  // ── LOD-driven redraws ────────────────────────────────────────────────────

  /**
   * Called by {@link LODController} when zoom crosses a threshold.
   */
  onDetailChanged(detail: LOD): void {
    this._detail = detail;
    this._dirtyQueue = [...this._visible];
    this._scheduleSweep();
  }

  private _scheduleSweep(): void {
    if (this._sweepRafId !== null) return;
    this._sweepRafId = requestAnimationFrame(() => {
      this._sweepRafId = null;
      const chunk = this._dirtyQueue.splice(0, ShapeScene.SWEEP_CHUNK);
      for (const id of chunk) {
        if (this._visible.has(id)) this._pool.get(id)?.draw(this._detail);
      }
      if (this._dirtyQueue.length > 0) this._scheduleSweep();
    });
  }

  // ── Targeted redraws ──────────────────────────────────────────────────────

  /**
   * Force-redraw a single element if it is currently visible.
   */
  redraw(id: string): void {
    if (!this._visible.has(id)) return;
    this._pool.get(id)?.draw(this._detail);
  }

  /**
   * Detach a single element from the scene (without destroying it).
   */
  evict(id: string): void {
    const obj = this._pool.get(id);
    if (obj) this._layer.removeChild(obj.container);
    this._visible.delete(id);
  }

  /**
   * Detach all visible elements.  Called by `ShapesPlugin.clear()`.
   */
  clear(): void {
    for (const id of this._visible) {
      const obj = this._pool.get(id);
      if (obj) this._layer.removeChild(obj.container);
    }
    this._visible.clear();
  }

  /** Returns `true` if the element is currently attached to the scene. */
  isVisible(id: string): boolean {
    return this._visible.has(id);
  }

  /** The active {@link LOD} level. */
  get detail(): LOD {
    return this._detail;
  }
}

// ── Backward-compatibility alias ─────────────────────────────────────────────
/** @deprecated Use {@link ShapeScene} instead. */
export { ShapeScene as GraphScene };
