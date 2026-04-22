// ── marchingAntsHandler ───────────────────────────────────────────────────────
// Animates dashes marching around the shape border by incrementing dashOffset
// each frame. Writes to ShapeObject._animOverrides.dashOffset (and optionally
// borderColor), which ShapeObject.draw() feeds into the dash drawing functions.

import type { AnimationHandler } from '../AnimationRegistry.js';
import type { ShapeObject } from '../ShapeObject.js';
import type { HaloPool } from '../HaloPool.js';

/** Options for the `marchingAnts` animation. */
export interface MarchingAntsOptions {
  /** Dash offset increment per frame. (default: 1) */
  speed?: number;
  /** Override border color. Defaults to the shape border color. */
  color?: string;
  /** Perimeter-loop count before auto-stop. Use `-1` for infinite. (default: -1) */
  repeat?: number;
}

interface MarchingAntsState {
  /** Accumulated dash offset. */
  offset: number;
  /** Number of completed 360-unit loops. */
  repeatCount: number;
}

/** Offset units considered one perimeter loop for repeat counting. */
const CYCLE_SIZE = 360;

/**
 * `marchingAntsHandler` — border dash march animation.
 *
 * @remarks
 * The offset value is unitless; the dash drawing functions (`drawDashedCircle`,
 * `drawDashedRect`, etc.) interpret it as a pixel offset along the path.
 */
export const marchingAntsHandler: AnimationHandler<MarchingAntsOptions, MarchingAntsState> = {
  type: 'marchingAnts',

  init(_spec: MarchingAntsOptions, _obj: ShapeObject, _halos: HaloPool): MarchingAntsState {
    return { offset: 0, repeatCount: 0 };
  },

  tick(state: MarchingAntsState, spec: MarchingAntsOptions, _deltaMS: number) {
    const speed = spec.speed ?? 1;
    const prev = state.offset;
    state.offset += speed;
    if (Math.floor(state.offset / CYCLE_SIZE) > Math.floor(prev / CYCLE_SIZE)) {
      state.repeatCount++;
      const rep = spec.repeat ?? -1;
      if (rep !== -1 && state.repeatCount >= rep) return { dirty: true, stop: true };
    }
    return { dirty: true, stop: false };
  },

  apply(state: MarchingAntsState, spec: MarchingAntsOptions, obj: ShapeObject, _halos: HaloPool) {
    obj._animOverrides.dashOffset = state.offset;
    if (spec.color) obj._animOverrides.borderColor = spec.color;
  },

  cleanup(_state: MarchingAntsState, obj: ShapeObject, _halos: HaloPool) {
    obj._animOverrides.dashOffset = 0;
    obj._animOverrides.borderColor = undefined;
  },
};
