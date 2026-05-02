// ── breatheHandler (plugins-shapes) ───────────────────────────────────────────
// Oscillates the element's scale to create a living "breathing" effect.

import type { AnimationHandler } from '../AnimationRegistry.js';
import type { BaseShape } from '../BaseShape.js';
import type { AnimationHaloPool } from '../AnimationHaloPool.js';

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
  phase: number;
  repeatCount: number;
}

export const breatheHandler: AnimationHandler<BreatheOptions, BreatheState> = {
  type: 'breathe',

  init(_spec: BreatheOptions, _obj: BaseShape, _halos: AnimationHaloPool): BreatheState {
    return { phase: 0, repeatCount: 0 };
  },

  tick(state: BreatheState, spec: BreatheOptions, deltaMS: number) {
    const dur = spec.duration ?? 2000;
    const prev = state.phase;
    state.phase += (deltaMS / dur) * Math.PI * 2;
    if (Math.floor(state.phase / (Math.PI * 2)) > Math.floor(prev / (Math.PI * 2))) {
      state.repeatCount++;
      const rep = spec.repeat ?? -1;
      if (rep !== -1 && state.repeatCount >= rep) return { dirty: true, stop: true };
    }
    return { dirty: true, stop: false };
  },

  apply(state: BreatheState, spec: BreatheOptions, obj: BaseShape, _halos: AnimationHaloPool) {
    obj._animOverrides.scale = 1 + Math.sin(state.phase) * (spec.amplitude ?? 0.1);
  },

  cleanup(_state: BreatheState, obj: BaseShape, _halos: AnimationHaloPool) {
    obj._animOverrides.scale = 1;
  },
};
