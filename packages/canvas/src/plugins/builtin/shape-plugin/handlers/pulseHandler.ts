// ── pulseHandler ─────────────────────────────────────────────────────────────
// Draws expanding ripple rings radiating out from the shape.
// Rings are rendered on a rented HaloPool Graphics — the shape's own Graphics
// is not touched, so dirty is always false.

import type { AnimationHandler } from '../AnimationRegistry.js';
import type { ShapeObject } from '../ShapeObject.js';
import type { HaloPool } from '../HaloPool.js';

/** Options for the `pulse` animation. */
export interface PulseOptions {
  /** Ring color. Defaults to the shape fill color. */
  color?: string;
  /** How far rings expand beyond the shape radius in px. (default: 40) */
  maxRadius?: number;
  /** Duration of one pulse cycle in ms. (default: 1200) */
  duration?: number;
  /** Cycle count before auto-stop. Use `-1` for infinite. (default: -1) */
  repeat?: number;
}

interface PulseState {
  /** Progress through the current cycle (0–1). */
  progress: number;
  /** Number of completed full cycles. */
  repeatCount: number;
}

/**
 * `pulseHandler` — radiating ring animation.
 *
 * @remarks
 * Rents a `HaloPool` `Graphics` instance on `init` and returns it on `cleanup`.
 * All drawing is delegated to {@link HaloPool.redrawPulse} each frame.
 * The shape's own `Graphics` is never touched, so `dirty` is always `false`.
 */
export const pulseHandler: AnimationHandler<PulseOptions, PulseState> = {
  type: 'pulse',

  init(_spec: PulseOptions, obj: ShapeObject, halos: HaloPool): PulseState {
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
    // dirty=false: pulse draws to HaloPool Graphics, not to the shape's Graphics
    return { dirty: false, stop: false };
  },

  apply(state: PulseState, spec: PulseOptions, obj: ShapeObject, halos: HaloPool) {
    const fillColor = (obj.spec.fill as { color?: string } | undefined)?.color;
    const color = spec.color ?? fillColor ?? '#ffffff';
    halos.redrawPulse(obj, state.progress, spec.maxRadius ?? 40, color);
  },

  cleanup(_state: PulseState, obj: ShapeObject, halos: HaloPool) {
    halos.return(obj.id);
  },
};
