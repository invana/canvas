// ── colorCycleHandler (element-plugin) ────────────────────────────────────────
// Transitions the element fill through a palette of colors over time.
// Writes to BaseNode._animOverrides.colorOverride, which resolveStyle()
// merges in place of the spec fill color.

import type { AnimationHandler } from '../AnimationRegistry.js';
import type { BaseNode } from '../BaseNode.js';
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
  phase: number;
  repeatCount: number;
}

/**
 * `colorCycleHandler` — fill color palette animation.
 *
 * @remarks
 * Writes the active color to `obj._animOverrides.colorOverride`.
 * {@link BaseNode.resolveStyle} picks this up automatically — no extra
 * draw logic required in element subclasses.
 */
export const colorCycleHandler: AnimationHandler<ColorCycleOptions, ColorCycleState> = {
  type: 'colorCycle',

  init(_spec: ColorCycleOptions, _obj: BaseNode, _halos: HaloPool): ColorCycleState {
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

  apply(state: ColorCycleState, spec: ColorCycleOptions, obj: BaseNode, _halos: HaloPool) {
    const colors = spec.colors;
    if (colors.length > 0) {
      const idx = Math.floor(state.phase) % colors.length;
      obj._animOverrides.colorOverride = colors[idx];
    }
  },

  cleanup(_state: ColorCycleState, obj: BaseNode, _halos: HaloPool) {
    obj._animOverrides.colorOverride = undefined;
  },
};
