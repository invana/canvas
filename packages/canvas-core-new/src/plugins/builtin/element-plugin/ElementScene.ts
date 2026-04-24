// ── ElementScene ──────────────────────────────────────────────────────────────
// Manages one PixiJS scene graph slice for ElementPlugin.
// Only visible elements are attached as Container children.
// Mirrors SceneContainer from shape-plugin but is generic over ElementPool.

import type { Container } from 'pixi.js';
import type { ElementPool } from './ElementPool.js';
import type { CameraBounds } from './CameraTracker.js';
import { LOD } from './LODController.js';

/**
 * `ElementScene` manages one PixiJS layer for {@link ElementPlugin}.
 *
 * @remarks
 * On every camera change it diffs the current visible set against the new
 * viewport AABB provided by {@link CameraTracker}:
 * - Elements **entering** the viewport are drawn then attached.
 * - Elements **leaving** the viewport are detached (not destroyed) for cheap re-entry.
 *
 * This class is internal to {@link ElementPlugin}.
 */
export class ElementScene {
  private _layer:   Container;
  private _pool:    ElementPool;
  private _visible = new Set<string>();
  private _detail:  LOD = LOD.DETAIL;

  constructor(layer: Container, pool: ElementPool) {
    this._layer = layer;
    this._pool  = pool;
  }

  // ── Camera-driven culling ─────────────────────────────────────────────────

  /**
   * Called by {@link CameraTracker} whenever the camera moves or zooms.
   * Attaches newly-visible elements and detaches elements that left the viewport.
   */
  onCameraChanged(bounds: CameraBounds): void {
    const incoming = new Set(
      this._pool.search(bounds.minX, bounds.minY, bounds.maxX, bounds.maxY).map(o => o.id),
    );

    // Detach elements that left the viewport
    for (const id of this._visible) {
      if (!incoming.has(id)) {
        const obj = this._pool.get(id);
        if (obj) this._layer.removeChild(obj.container);
        this._visible.delete(id);
      }
    }

    // Attach elements that entered the viewport
    for (const id of incoming) {
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
   * Redraws all currently-visible elements at the new detail level.
   */
  onDetailChanged(detail: LOD): void {
    this._detail = detail;
    for (const id of this._visible) {
      this._pool.get(id)?.draw(detail);
    }
  }

  // ── Targeted redraws ──────────────────────────────────────────────────────

  /**
   * Force-redraw a single element if it is currently visible.
   * Called after spec updates and state changes.
   */
  redraw(id: string): void {
    if (!this._visible.has(id)) return;
    this._pool.get(id)?.draw(this._detail);
  }

  /**
   * Detach a single element from the scene (without destroying it).
   * Called before removing an element from the pool.
   */
  evict(id: string): void {
    const obj = this._pool.get(id);
    if (obj) this._layer.removeChild(obj.container);
    this._visible.delete(id);
  }

  /**
   * Detach all visible elements.  Called by `ElementPlugin.clear()`.
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
