// ── pulseHandler (element-plugin) ─────────────────────────────────────────────
// Draws expanding ripple rings radiating out from the element.
// Rings are rendered on a rented ElementHaloPool Graphics — the element's own
// Graphics is not touched, so dirty is always false.

import type { AnimationHandler } from '../AnimationRegistry.js';
import type { BaseSolid } from '../BaseSolid.js';
import type { ElementHaloPool } from '../ElementHaloPool.js';

/** Options for the `pulse` animation. */
export interface PulseOptions {
  /** Ring color. Defaults to the element fill color. */
  color?: string;
  /** How far rings expand beyond the element's base radius in px. (default: 40) */
  maxRadius?: number;
  /** Duration of one pulse cycle in ms. (default: 1200) */
  duration?: number;
  /** Cycle count before auto-stop. Use `-1` for infinite. (default: -1) */
  repeat?: number;
}

interface PulseState {
  progress: number;
  repeatCount: number;
}

/**
 * `pulseHandler` — radiating ring animation.
 *
 * @remarks
 * Rents an `ElementHaloPool` `Graphics` instance on `init` and returns it on
 * `cleanup`. All drawing is delegated to {@link ElementHaloPool.redrawPulse}
 * each frame. The element's own `Graphics` is never touched, so `dirty` is
 * always `false`.
 */
export const pulseHandler: AnimationHandler<PulseOptions, PulseState> = {
  type: 'pulse',

  init(_spec: PulseOptions, obj: BaseSolid, halos: ElementHaloPool): PulseState {
    halos.rentForPulse(obj);
    return { progress: 0, repeatCount: 0 };
  },

  tick(state: PulseState, spec: PulseOptions, deltaMS: number) {
    const dur = spec.duration ?? 1200;
    const prev = state.progress;
    const next = prev + deltaMS / dur;
    if (Math.floor(next) > Math.floor(prev)) {
      state.repeatCount++;
      const rep = spec.repeat ?? -1;
      if (rep !== -1 && state.repeatCount >= rep) {
        state.progress = 0;
        return { dirty: false, stop: true };
      }
    }
    state.progress = next % 1;
    return { dirty: false, stop: false };
  },

  apply(state: PulseState, spec: PulseOptions, obj: BaseSolid, halos: ElementHaloPool) {
    const fillStyle = obj.spec.style?.fill;
    const color = spec.color ?? (typeof fillStyle === 'string' ? fillStyle : undefined) ?? '#ffffff';
    halos.redrawPulse(obj, state.progress, spec.maxRadius ?? 40, color);
  },

  cleanup(_state: PulseState, obj: BaseSolid, halos: ElementHaloPool) {
    halos.return(obj.spec.id);
  },
};
