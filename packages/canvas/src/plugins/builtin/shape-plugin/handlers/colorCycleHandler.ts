// ── colorCycleHandler ─────────────────────────────────────────────────────────
// Transitions the shape fill through a palette of colors over time.
// Writes to ShapeObject._animOverrides.colorOverride, which ShapeObject.draw()
// uses in place of the spec fill color.

import type { AnimationHandler } from '../AnimationRegistry.js';
import type { ShapeObject } from '../ShapeObject.js';
import type { HaloPool } from '../HaloPool.js';

/** Options for the `colorCycle` animation. */
export interface ColorCycleOptions {
  /** Ordered array of hex color strings to cycle through. */
  colors: string[];
  /** Duration per color step in ms. (default: 800) */
  duration?: number;
  /** Full-palette cycle count before auto-stop. Use `-1` for infinite. (default: -1) */
  repeat?: number;
}

interface ColorCycleState {
  /** Continuous phase; integer part = current color index. */
  phase: number;
  /** Number of completed full palette cycles. */
  repeatCount: number;
}

/**
 * `colorCycleHandler` — fill color palette animation.
 *
 * @remarks
 * Writes the active color to `obj._animOverrides.colorOverride`.
 * The standard `ShapeObject.draw()` picks this up automatically via the
 * `solidStyle` resolution path — no extra draw logic required.
 */
export const colorCycleHandler: AnimationHandler<ColorCycleOptions, ColorCycleState> = {
  type: 'colorCycle',

  init(_spec: ColorCycleOptions, _obj: ShapeObject, _halos: HaloPool): ColorCycleState {
    return { phase: 0, repeatCount: 0 };
  },

  tick(state: ColorCycleState, spec: ColorCycleOptions, deltaMS: number) {
    const dur = spec.duration ?? 800;
    const len = spec.colors.length || 1;
    const prev = state.phase;
    state.phase += deltaMS / dur;
    // One full cycle = phase crosses colors.length
    if (Math.floor(state.phase / len) > Math.floor(prev / len)) {
      state.repeatCount++;
      const rep = spec.repeat ?? -1;
      if (rep !== -1 && state.repeatCount >= rep) return { dirty: true, stop: true };
    }
    return { dirty: true, stop: false };
  },

  apply(state: ColorCycleState, spec: ColorCycleOptions, obj: ShapeObject, _halos: HaloPool) {
    const colors = spec.colors;
    if (colors.length > 0) {
      const idx = Math.floor(state.phase) % colors.length;
      obj._animOverrides.colorOverride = colors[idx];
    }
  },

  cleanup(_state: ColorCycleState, obj: ShapeObject, _halos: HaloPool) {
    obj._animOverrides.colorOverride = undefined;
  },
};
