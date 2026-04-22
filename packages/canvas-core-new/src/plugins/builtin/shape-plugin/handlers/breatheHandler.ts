// ── breatheHandler ────────────────────────────────────────────────────────────
// Oscillates the shape's scale to create a living "breathing" effect.
// Uses Container.scale — no Graphics redraw needed.

import type { AnimationHandler } from '../AnimationRegistry.js';
import type { ShapeObject } from '../ShapeObject.js';
import type { HaloPool } from '../HaloPool.js';

/** Options for the `breathe` animation. */
export interface BreatheOptions {
  /** Maximum scale delta, e.g. `0.15` = ±15% of normal size. (default: 0.1) */
  amplitude?: number;
  /** Duration of one full breathe cycle in ms. (default: 2000) */
  duration?: number;
  /** Cycle count before auto-stop. Use `-1` for infinite. (default: -1) */
  repeat?: number;
}

interface BreatheState {
  /** Current phase in radians (0 – 2π per cycle). */
  phase: number;
  /** Number of completed full cycles. */
  repeatCount: number;
}

/**
 * `breatheHandler` — scale oscillation animation.
 *
 * @remarks
 * Sets the shape container's pivot to the shape anchor point on `init` so the
 * scale effect is centred on the shape rather than the world origin.
 * Cleans up by resetting scale, pivot, and position.
 */
export const breatheHandler: AnimationHandler<BreatheOptions, BreatheState> = {
  type: 'breathe',

  init(_spec, obj: ShapeObject, _halos: HaloPool): BreatheState {
    // Set pivot to the shape's anchor so scaling orbits around it
    obj.container.pivot.set(obj.cx, obj.cy);
    obj.container.position.set(obj.cx, obj.cy);
    return { phase: 0, repeatCount: 0 };
  },

  tick(state: BreatheState, spec: BreatheOptions, deltaMS: number) {
    const dur = spec.duration ?? 2000;
    const prev = state.phase;
    state.phase += (deltaMS / dur) * Math.PI * 2;
    // Detect cycle crossing
    if (Math.floor(state.phase / (Math.PI * 2)) > Math.floor(prev / (Math.PI * 2))) {
      state.repeatCount++;
      const rep = spec.repeat ?? -1;
      if (rep !== -1 && state.repeatCount >= rep) return { dirty: true, stop: true };
    }
    return { dirty: true, stop: false };
  },

  apply(state: BreatheState, spec: BreatheOptions, obj: ShapeObject, _halos: HaloPool) {
    obj._animOverrides.scale = 1 + Math.sin(state.phase) * (spec.amplitude ?? 0.1);
  },

  cleanup(_state: BreatheState, obj: ShapeObject, _halos: HaloPool) {
    obj._animOverrides.scale = 1;
    obj.container.pivot.set(0, 0);
    obj.container.position.set(0, 0);
    obj.container.scale.set(1);
  },
};
