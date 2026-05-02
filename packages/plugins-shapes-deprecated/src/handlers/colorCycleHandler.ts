// ── colorCycleHandler (plugins-shapes) ────────────────────────────────────────

import type { AnimationHandler } from '../AnimationRegistry.js';
import type { BaseShape } from '../BaseShape.js';
import type { AnimationHaloPool } from '../AnimationHaloPool.js';

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
  phase: number;
  repeatCount: number;
}

export const colorCycleHandler: AnimationHandler<ColorCycleOptions, ColorCycleState> = {
  type: 'colorCycle',

  init(_spec: ColorCycleOptions, _obj: BaseShape, _halos: AnimationHaloPool): ColorCycleState {
    return { phase: 0, repeatCount: 0 };
  },

  tick(state: ColorCycleState, spec: ColorCycleOptions, deltaMS: number) {
    const dur = spec.duration ?? 800;
    const len = spec.colors.length || 1;
    const prev = state.phase;
    state.phase += deltaMS / dur;
    if (Math.floor(state.phase / len) > Math.floor(prev / len)) {
      state.repeatCount++;
      const rep = spec.repeat ?? -1;
      if (rep !== -1 && state.repeatCount >= rep) return { dirty: true, stop: true };
    }
    return { dirty: true, stop: false };
  },

  apply(state: ColorCycleState, spec: ColorCycleOptions, obj: BaseShape, _halos: AnimationHaloPool) {
    const colors = spec.colors;
    if (colors.length > 0) {
      const idx = Math.floor(state.phase) % colors.length;
      obj._animOverrides.colorOverride = colors[idx];
    }
  },

  cleanup(_state: ColorCycleState, obj: BaseShape, _halos: AnimationHaloPool) {
    obj._animOverrides.colorOverride = undefined;
  },
};
