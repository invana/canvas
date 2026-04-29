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
  /** Elements waiting for a LOD redraw, processed in chunks across frames. */
  private _dirtyQueue: string[] = [];
  private _sweepRafId: number | null = null;
  /**
   * Per-scene per-frame redraw cap during a LOD sweep.
   * Two scenes run sweeps simultaneously, so the actual combined cost per frame
   * is 2 × SWEEP_CHUNK. At ~5 µs per element and 120 fps budget (8.3 ms):
   *   80 × 2 = 160 redraws → ~0.8 ms overhead → ~109 fps during sweep.
   * Sweep completes in ≤ ceil(760/80) = 10 frames ≈ 83 ms — imperceptible.
   */
  private static readonly SWEEP_CHUNK = 80;
  /** Reused scratch set for onCameraChanged — avoids a per-frame allocation. */
  private _incomingIds = new Set<string>();

  constructor(layer: Container, pool: ElementPool) {
    this._layer = layer;
    this._pool  = pool;
    // GPU-side transform management: camera pan/zoom no longer requires the
    // CPU to walk every child to recompute world transforms each frame.
    layer.isRenderGroup = true;
  }

  // ── Camera-driven culling ─────────────────────────────────────────────────

  /**
   * Called by {@link CameraTracker} whenever the camera moves or zooms.
   * Attaches newly-visible elements and detaches elements that left the viewport.
   */
  onCameraChanged(bounds: CameraBounds): void {
    // Reuse _incomingIds to avoid a per-frame Set + Array allocation.
    this._incomingIds.clear();
    for (const obj of this._pool.search(bounds.minX, bounds.minY, bounds.maxX, bounds.maxY)) {
      this._incomingIds.add(obj.id);
    }

    // Detach elements that left the viewport
    for (const id of this._visible) {
      if (!this._incomingIds.has(id)) {
        const obj = this._pool.get(id);
        if (obj) this._layer.removeChild(obj.container);
        this._visible.delete(id);
      }
    }

    // Attach elements that entered the viewport
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
   * Redraws all currently-visible elements at the new detail level in chunks
   * of {@link SWEEP_CHUNK} per frame so no single frame bears the full redraw
   * cost. If zoom oscillates around a threshold, the queue is reset and only
   * the final stable LOD triggers a complete sweep.
   */
  onDetailChanged(detail: LOD): void {
    this._detail = detail;
    // Replace any in-progress sweep — if LOD bounces back before the sweep
    // finishes, we restart from scratch at the new LOD.
    this._dirtyQueue = [...this._visible];
    this._scheduleSweep();
  }

  private _scheduleSweep(): void {
    if (this._sweepRafId !== null) return;
    this._sweepRafId = requestAnimationFrame(() => {
      this._sweepRafId = null;
      const chunk = this._dirtyQueue.splice(0, ElementScene.SWEEP_CHUNK);
      for (const id of chunk) {
        // Skip if the element left the viewport while the sweep was queued.
        if (this._visible.has(id)) this._pool.get(id)?.draw(this._detail);
      }
      if (this._dirtyQueue.length > 0) this._scheduleSweep();
    });
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
