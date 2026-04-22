// ── AnimationTicker ───────────────────────────────────────────────────────────
// Drives per-frame updates for animated shapes by dispatching through the
// AnimationRegistry. Only shapes with at least one active animation slot are
// kept in the animated set — O(animated), not O(total shapes).

import type { Ticker } from 'pixi.js';
import type { ShapeObject } from './ShapeObject.js';
import type { SceneContainer } from './SceneContainer.js';
import type { HaloPool } from './HaloPool.js';
import type { ShapeAnimations } from './spec/animations.js';
import { AnimationRegistry } from './AnimationRegistry.js';
import { defaultRegistry } from './handlers/index.js';

/**
 * `AnimationTicker` drives per-frame updates for animated shapes via the
 * {@link AnimationRegistry}.
 *
 * @remarks
 * Only shapes with at least one active slot in `_animSlots` are stored in the
 * internal `_animated` map, keeping per-frame cost at **O(animated)**, not
 * O(total shapes).
 *
 * Each tick dispatches to the registered {@link AnimationHandler} for every
 * active slot: `tick()` advances state, `apply()` writes to
 * `ShapeObject._animOverrides` (or PixiJS Container properties directly), and
 * `cleanup()` is called automatically when an animation finishes.
 *
 * This class is internal to {@link ShapePlugin}.
 */
export class AnimationTicker {
  private _animated = new Map<string, ShapeObject>();
  private _scene: SceneContainer;
  private _halos: HaloPool;
  private _ticker: Ticker;
  private _registry: AnimationRegistry;
  private _bound: (ticker: Ticker) => void;

  constructor(
    ticker: Ticker,
    scene: SceneContainer,
    halos: HaloPool,
    registry: AnimationRegistry = defaultRegistry,
  ) {
    this._ticker = ticker;
    this._scene = scene;
    this._halos = halos;
    this._registry = registry;
    this._bound = this._tick.bind(this);
    this._ticker.add(this._bound);
  }

  /**
   * Register one or more animations on a shape.
   *
   * @remarks
   * Calling `start` while an animation of the same type is already running
   * stops and cleans up the existing slot before starting the new one, so
   * parameters can be hot-swapped at any time.
   *
   * @param obj        - The {@link ShapeObject} to animate.
   * @param animations - Map of animation type → options (e.g. `{ breathe: { amplitude: 0.12 } }`).
   */
  start(obj: ShapeObject, animations: ShapeAnimations): void {
    for (const [type, spec] of Object.entries(animations)) {
      if (!spec) continue;

      // Cleanup any existing slot for this type before overwriting
      const existing = obj._animSlots.get(type);
      if (existing) {
        this._registry.get(type)?.cleanup?.(existing.state, obj, this._halos);
      }

      const handler = this._registry.get(type);
      if (!handler) {
        console.warn(`[AnimationTicker] No handler registered for animation type: "${type}"`);
        continue;
      }

      const state = handler.init(spec as Record<string, unknown>, obj, this._halos);
      obj._animSlots.set(type, { spec: spec as Record<string, unknown>, state });
    }

    if (obj._animSlots.size > 0) {
      this._animated.set(obj.id, obj);
    }
  }

  /**
   * Stop all or a specific animation on a shape.
   *
   * @param id        - Shape id.
   * @param animType  - Animation type to stop (e.g. `'breathe'`). Omit to stop all.
   */
  stop(id: string, animType?: string): void {
    const obj = this._animated.get(id);
    if (!obj) return;

    if (!animType) {
      // Stop all animations on this shape
      for (const [type, slot] of obj._animSlots) {
        this._registry.get(type)?.cleanup?.(slot.state, obj, this._halos);
      }
      obj._animSlots.clear();
      this._animated.delete(id);
    } else {
      // Stop only the named animation type
      const slot = obj._animSlots.get(animType);
      if (slot) {
        this._registry.get(animType)?.cleanup?.(slot.state, obj, this._halos);
        obj._animSlots.delete(animType);
      }
      if (obj._animSlots.size === 0) this._animated.delete(id);
    }
  }

  /**
   * Stop all animations on every shape and clear the animated set.
   * Called by {@link ShapePlugin.clear}.
   */
  stopAll(): void {
    for (const obj of this._animated.values()) {
      for (const [type, slot] of obj._animSlots) {
        this._registry.get(type)?.cleanup?.(slot.state, obj, this._halos);
      }
      obj._animSlots.clear();
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
    const dt = ticker.deltaMS;
    // Collect shapes that have no remaining slots so we can remove them after
    // iterating (cannot mutate _animated while iterating it).
    const removeFromAnimated: string[] = [];

    for (const obj of this._animated.values()) {
      let dirty = false;
      const toStop: string[] = [];

      for (const [type, slot] of obj._animSlots) {
        const handler = this._registry.get(type);
        if (!handler) continue;

        const { dirty: d, stop } = handler.tick(
          slot.state as never,
          slot.spec as never,
          dt,
        );
        // apply() is always called so side-effect animations (e.g. pulse halo)
        // update every frame regardless of the dirty flag
        handler.apply(slot.state as never, slot.spec as never, obj, this._halos);

        if (d) dirty = true;
        if (stop) toStop.push(type);
      }

      // Cleanup finished animations (safe: collected separately)
      for (const type of toStop) {
        const slot = obj._animSlots.get(type);
        if (slot) {
          this._registry.get(type)?.cleanup?.(slot.state, obj, this._halos);
          obj._animSlots.delete(type);
        }
      }
      if (obj._animSlots.size === 0) removeFromAnimated.push(obj.id);

      // Halo spec animation (driven by spec.halo.animated — not a registry handler)
      if ((obj.spec as { halo?: { animated?: boolean } }).halo?.animated) {
        this._halos.redraw(obj);
      }

      if (dirty && this._scene.isVisible(obj.id)) {
        this._scene.redraw(obj.id);
      }
    }

    for (const id of removeFromAnimated) this._animated.delete(id);
  }
}
