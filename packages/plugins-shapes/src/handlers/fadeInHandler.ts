// ── fadeInHandler (plugins-shapes) ────────────────────────────────────────────

import type { AnimationHandler } from '../AnimationRegistry.js';
import type { BaseShape } from '../BaseShape.js';
import type { AnimationHaloPool } from '../AnimationHaloPool.js';

/** Options for the `fadeIn` animation. */
export interface FadeInOptions {
  /** Total fade duration in ms. (default: 400) */
  duration?: number;
  /** Starting alpha value 0–1. (default: 0) */
  from?: number;
  /** Replay count before auto-stop. Use `-1` for infinite. (default: 1) */
  repeat?: number;
}

interface FadeInState {
  startTime: number;
  repeatCount: number;
}

export const fadeInHandler: AnimationHandler<FadeInOptions, FadeInState> = {
  type: 'fadeIn',

  init(spec: FadeInOptions, obj: BaseShape, _halos: AnimationHaloPool): FadeInState {
    obj._animOverrides.alpha = spec.from ?? 0;
    return { startTime: performance.now(), repeatCount: 0 };
  },

  tick(state: FadeInState, spec: FadeInOptions, _deltaMS: number) {
    const dur = spec.duration ?? 400;
    const from = spec.from ?? 0;
    const rep = spec.repeat ?? 1;
    const elapsed = performance.now() - state.startTime;
    const raw = from + (1 - from) * (elapsed / dur);
    if (raw >= 1) {
      state.repeatCount++;
      if (rep === -1 || state.repeatCount < rep) {
        state.startTime = performance.now();
        return { dirty: true, stop: false };
      }
      return { dirty: true, stop: true };
    }
    return { dirty: true, stop: false };
  },

  apply(state: FadeInState, spec: FadeInOptions, obj: BaseShape, _halos: AnimationHaloPool) {
    const dur = spec.duration ?? 400;
    const from = spec.from ?? 0;
    const elapsed = performance.now() - state.startTime;
    obj._animOverrides.alpha = Math.min(1, from + (1 - from) * (elapsed / dur));
  },

  cleanup(_state: FadeInState, obj: BaseShape, _halos: AnimationHaloPool) {
    obj._animOverrides.alpha = 1;
  },
};
