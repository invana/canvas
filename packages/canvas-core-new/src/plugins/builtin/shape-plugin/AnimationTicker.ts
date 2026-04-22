// ── AnimationTicker ───────────────────────────────────────────────────────────
// Drives per-frame updates for animated shapes.
// Only shapes with active animations are in the animated set — O(animated), not O(total).
// Registered with PixiJS app.ticker via the PluginContext renderer handle.

import type { Ticker } from 'pixi.js';
import type { ShapeObject } from './ShapeObject.js';
import type { SceneContainer } from './SceneContainer.js';
import type { HaloPool } from './HaloPool.js';
import type { ShapeAnimations } from './spec/animations.js';

/**
 * `AnimationTicker` drives per-frame updates for animated shapes.
 *
 * @remarks
 * Only shapes with active animations are stored in the internal `_animated` map,
 * so the per-frame cost is **O(animated)**, not O(total shapes).
 *
 * Each tick advances numeric fields in `ShapeObject._animState` and sets a
 * `dirty` flag. Only dirty shapes that are currently visible trigger a
 * `SceneContainer.redraw()` call, keeping GPU command submissions minimal.
 *
 * This class is internal to {@link ShapePlugin}.
 */
export class AnimationTicker {
  private _animated = new Map<string, ShapeObject>();
  private _scene: SceneContainer;
  private _halos: HaloPool;
  private _ticker: Ticker;
  private _bound: (ticker: Ticker) => void;

  constructor(ticker: Ticker, scene: SceneContainer, halos: HaloPool) {
    this._ticker = ticker;
    this._scene = scene;
    this._halos = halos;
    this._bound = this._tick.bind(this);
    this._ticker.add(this._bound);
  }

  /**
   * Register a shape for per-frame animation.
   *
   * @param obj - The {@link ShapeObject} to animate.
   * @param animations - Animation declarations for `body` and/or `border`.
   */
  start(obj: ShapeObject, animations: ShapeAnimations): void {
    obj.animations = animations;
    obj._animState.startTime = performance.now();
    this._animated.set(obj.id, obj);
  }

  /**
   * Stop all or a specific layer’s animation for a shape.
   *
   * @param id - Shape id.
   * @param layer - Target layer (`'border'` or `'body'`). Omit to stop all animations.
   */
  stop(id: string, layer?: 'border' | 'body'): void {
    const obj = this._animated.get(id);
    if (!obj) return;

    if (!layer) {
      obj.animations = {};
      this._animated.delete(id);
    } else if (layer === 'border') {
      obj.animations = { ...obj.animations, border: undefined };
      if (!obj.animations.body) this._animated.delete(id);
    } else {
      obj.animations = { ...obj.animations, body: undefined };
      if (!obj.animations.border) this._animated.delete(id);
    }
  }

  /** Stop all animations and remove all shapes from the animated set. */
  stopAll(): void {
    for (const obj of this._animated.values()) {
      obj.animations = {};
    }
    this._animated.clear();
  }

  /**
   * Remove the ticker listener and release all animated shape references.
   * Called by {@link ShapePlugin.destroy}.
   */
  destroy(): void {
    this._ticker.remove(this._bound);
    this._animated.clear();
  }

  private _tick(ticker: Ticker): void {
    const dt = ticker.deltaMS; // ms since last frame

    for (const obj of this._animated.values()) {
      let dirty = false;

      // ── Border animations ────────────────────────────────────────────────
      const ba = obj.animations.border;
      if (ba) {
        switch (ba.type) {
          case 'marchingAnts':
          case 'dashedFlow': {
            obj._animState.dashOffset += (ba.speed ?? 1);
            dirty = true;
            break;
          }
          case 'borderGlow': {
            const dur = ba.duration ?? 1000;
            obj._animState.borderGlowPhase += (dt / dur) * Math.PI * 2;
            dirty = true;
            break;
          }
        }
      }

      // ── Body animations ──────────────────────────────────────────────────
      const body = obj.animations.body;
      if (body) {
        switch (body.type) {
          case 'breathe': {
            const dur = body.duration ?? 2000;
            obj._animState.breathePhase += (dt / dur) * Math.PI * 2;
            dirty = true;
            break;
          }
          case 'colorCycle': {
            const dur = body.duration ?? 800;
            obj._animState.colorCyclePhase += dt / dur;
            dirty = true;
            break;
          }
          case 'fadeIn': {
            const dur = body.duration ?? 400;
            const from = body.from ?? 0;
            const elapsed = performance.now() - obj._animState.startTime;
            obj._animState.fadeAlpha = Math.min(1, from + (1 - from) * (elapsed / dur));
            dirty = true;
            if (obj._animState.fadeAlpha >= 1) this.stop(obj.id, 'body');
            break;
          }
          case 'pulse': {
            const dur = body.duration ?? 1200;
            obj._animState.pulseProgress = (obj._animState.pulseProgress + dt / dur) % 1;
            // Pulse is drawn on HaloPool, not on the shape's own Graphics
            this._halos.redraw(obj);
            break;
          }
        }
      }

      // Halo pulse for halo spec (separate from body pulse animation)
      if (obj.spec.halo?.animated) {
        this._halos.redraw(obj);
      }

      if (dirty && this._scene.isVisible(obj.id)) {
        this._scene.redraw(obj.id);
      }
    }
  }
}
