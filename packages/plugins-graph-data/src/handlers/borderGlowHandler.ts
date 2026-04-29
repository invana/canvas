// ── borderGlowHandler (element-plugin) ────────────────────────────────────────
// Oscillates the border stroke width between minWidth and maxWidth using a sine
// wave. Writes to BaseSolid._animOverrides.borderWidth / borderColor, which
// resolveStyle() picks up automatically.

import type { AnimationHandler } from '../AnimationRegistry.js';
import type { BaseNode as BaseSolid } from '../BaseSolid.js';
import type { ElementHaloPool } from '../ElementHaloPool.js';

/** Options for the `borderGlow` animation. */
export interface BorderGlowOptions {
  /** Override border color. Defaults to the element stroke color. */
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
  phase: number;
  repeatCount: number;
}

/**
 * `borderGlowHandler` — border stroke-width pulse animation.
 *
 * @remarks
 * Writes the computed width to `obj._animOverrides.borderWidth`.
 * {@link BaseSolid.resolveStyle} returns this as `strokeWidth` so any element
 * that renders a border via its `draw()` will pick up the animated width
 * automatically.
 */
export const borderGlowHandler: AnimationHandler<BorderGlowOptions, BorderGlowState> = {
  type: 'borderGlow',

  init(_spec: BorderGlowOptions, _obj: BaseSolid, _halos: ElementHaloPool): BorderGlowState {
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

  apply(state: BorderGlowState, spec: BorderGlowOptions, obj: BaseSolid, _halos: ElementHaloPool) {
    const min = spec.minWidth ?? 1;
    const max = spec.maxWidth ?? 6;
    obj._animOverrides.borderWidth = min + (Math.sin(state.phase) * 0.5 + 0.5) * (max - min);
    if (spec.color) obj._animOverrides.borderColor = spec.color;
  },

  cleanup(_state: BorderGlowState, obj: BaseSolid, _halos: ElementHaloPool) {
    obj._animOverrides.borderWidth = undefined;
    obj._animOverrides.borderColor = undefined;
  },
};
