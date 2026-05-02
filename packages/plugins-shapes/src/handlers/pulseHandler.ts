// ── pulseHandler (plugins-shapes) ─────────────────────────────────────────────

import type { AnimationHandler } from '../AnimationRegistry.js';
import type { BaseShape } from '../BaseShape.js';
import type { AnimationHaloPool } from '../AnimationHaloPool.js';

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

export const pulseHandler: AnimationHandler<PulseOptions, PulseState> = {
  type: 'pulse',

  init(_spec: PulseOptions, obj: BaseShape, halos: AnimationHaloPool): PulseState {
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

  apply(state: PulseState, spec: PulseOptions, obj: BaseShape, halos: AnimationHaloPool) {
    const fillStyle = obj.spec.style?.fill;
    const color = spec.color ?? (typeof fillStyle === 'string' ? fillStyle : undefined) ?? '#ffffff';
    halos.redrawPulse(obj, state.progress, spec.maxRadius ?? 40, color);
  },

  cleanup(_state: PulseState, obj: BaseShape, halos: AnimationHaloPool) {
    halos.return(obj.spec.id);
  },
};
