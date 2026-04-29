// ── fadeInHandler (element-plugin) ────────────────────────────────────────────
// Fades the element from a starting alpha up to full opacity.
// Uses performance.now() for wall-clock elapsed time so it is unaffected by
// frame-rate spikes. Writes to BaseSolid._animOverrides.alpha.

import type { AnimationHandler } from '../AnimationRegistry.js';
import type { BaseNode as BaseSolid } from '../BaseSolid.js';
import type { ElementHaloPool } from '../ElementHaloPool.js';

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

/**
 * `fadeInHandler` — opacity fade-in animation.
 *
 * @remarks
 * Applies the alpha to `obj._animOverrides.alpha`, which
 * {@link ElementPlugin._applyContainerOverrides} sets on `container.alpha`.
 * The starting alpha is applied immediately in `init` to avoid a one-frame
 * flash at full opacity before the first tick.
 */
export const fadeInHandler: AnimationHandler<FadeInOptions, FadeInState> = {
  type: 'fadeIn',

  init(spec: FadeInOptions, obj: BaseSolid, _halos: ElementHaloPool): FadeInState {
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

  apply(state: FadeInState, spec: FadeInOptions, obj: BaseSolid, _halos: ElementHaloPool) {
    const dur = spec.duration ?? 400;
    const from = spec.from ?? 0;
    const elapsed = performance.now() - state.startTime;
    obj._animOverrides.alpha = Math.min(1, from + (1 - from) * (elapsed / dur));
  },

  cleanup(_state: FadeInState, obj: BaseSolid, _halos: ElementHaloPool) {
    obj._animOverrides.alpha = 1;
  },
};
