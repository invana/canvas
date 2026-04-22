// ── borderGlowHandler ─────────────────────────────────────────────────────────
// Oscillates the border stroke width between minWidth and maxWidth using a sine
// wave, creating a pulsing glow effect. Writes to
// ShapeObject._animOverrides.borderWidth (and optionally borderColor).

import type { AnimationHandler } from '../AnimationRegistry.js';
import type { ShapeObject } from '../ShapeObject.js';
import type { HaloPool } from '../HaloPool.js';

/** Options for the `borderGlow` animation. */
export interface BorderGlowOptions {
  /** Override border color. Defaults to the shape border color. */
  color?: string;
  /** Minimum stroke width in px. (default: 1) */
  minWidth?: number;
  /** Maximum stroke width in px. (default: 6) */
  maxWidth?: number;
  /** Duration of one oscillation cycle in ms. (default: 1000) */
  duration?: number;
  /** Cycle count before auto-stop. Use `-1` for infinite. (default: -1) */
  repeat?: number;
}

interface BorderGlowState {
  /** Current oscillation phase in radians (0 – 2π per cycle). */
  phase: number;
  /** Number of completed full cycles. */
  repeatCount: number;
}

/**
 * `borderGlowHandler` — border stroke-width pulse animation.
 *
 * @remarks
 * The computed width is written to `obj._animOverrides.borderWidth`.
 * `ShapeObject._drawBorder` reads this in place of `spec.border.width`.
 */
export const borderGlowHandler: AnimationHandler<BorderGlowOptions, BorderGlowState> = {
  type: 'borderGlow',

  init(_spec: BorderGlowOptions, _obj: ShapeObject, _halos: HaloPool): BorderGlowState {
    return { phase: 0, repeatCount: 0 };
  },

  tick(state: BorderGlowState, spec: BorderGlowOptions, deltaMS: number) {
    const dur = spec.duration ?? 1000;
    const prev = state.phase;
    state.phase += (deltaMS / dur) * Math.PI * 2;
    if (Math.floor(state.phase / (Math.PI * 2)) > Math.floor(prev / (Math.PI * 2))) {
      state.repeatCount++;
      const rep = spec.repeat ?? -1;
      if (rep !== -1 && state.repeatCount >= rep) return { dirty: true, stop: true };
    }
    return { dirty: true, stop: false };
  },

  apply(state: BorderGlowState, spec: BorderGlowOptions, obj: ShapeObject, _halos: HaloPool) {
    const min = spec.minWidth ?? 1;
    const max = spec.maxWidth ?? 6;
    obj._animOverrides.borderWidth = min + (Math.sin(state.phase) * 0.5 + 0.5) * (max - min);
    if (spec.color) obj._animOverrides.borderColor = spec.color;
  },

  cleanup(_state: BorderGlowState, obj: ShapeObject, _halos: HaloPool) {
    obj._animOverrides.borderWidth = undefined;
    obj._animOverrides.borderColor = undefined;
  },
};
