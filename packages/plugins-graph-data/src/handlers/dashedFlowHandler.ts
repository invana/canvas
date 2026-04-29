// ── dashedFlowHandler (element-plugin) ────────────────────────────────────────
// Flows dashes along the border in one direction by advancing dashOffset.
// Writes to BaseSolid._animOverrides.dashOffset (and optionally borderColor).

import type { AnimationHandler } from '../AnimationRegistry.js';
import type { BaseNode as BaseSolid } from '../BaseSolid.js';
import type { ElementHaloPool } from '../ElementHaloPool.js';

/** Options for the `dashedFlow` animation. */
export interface DashedFlowOptions {
  /** Dash offset increment per frame. (default: 1) */
  speed?: number;
  /** Flow direction: `1` = forward along path, `-1` = reverse. (default: 1) */
  direction?: number;
  /** Override border color. Defaults to the element stroke color. */
  color?: string;
  /** Loop count before auto-stop. Use `-1` for infinite. (default: -1) */
  repeat?: number;
}

interface DashedFlowState {
  offset: number;
  repeatCount: number;
}

const CYCLE_SIZE = 360;

/**
 * `dashedFlowHandler` — one-direction dash flow animation.
 *
 * @remarks
 * Unlike `marchingAnts` which reverses naturally, `dashedFlow` keeps dashes
 * moving in a single direction, giving a "current" or "data-flow" metaphor.
 * Supports reverse via `direction: -1`.
 */
export const dashedFlowHandler: AnimationHandler<DashedFlowOptions, DashedFlowState> = {
  type: 'dashedFlow',

  init(_spec: DashedFlowOptions, _obj: BaseSolid, _halos: ElementHaloPool): DashedFlowState {
    return { offset: 0, repeatCount: 0 };
  },

  tick(state: DashedFlowState, spec: DashedFlowOptions, _deltaMS: number) {
    const speed = spec.speed ?? 1;
    const dir = spec.direction ?? 1;
    const prev = state.offset;
    state.offset += speed * dir;
    if (Math.floor(Math.abs(state.offset) / CYCLE_SIZE) > Math.floor(Math.abs(prev) / CYCLE_SIZE)) {
      state.repeatCount++;
      const rep = spec.repeat ?? -1;
      if (rep !== -1 && state.repeatCount >= rep) return { dirty: true, stop: true };
    }
    return { dirty: true, stop: false };
  },

  apply(state: DashedFlowState, spec: DashedFlowOptions, obj: BaseSolid, _halos: ElementHaloPool) {
    obj._animOverrides.dashOffset = state.offset;
    if (spec.color) obj._animOverrides.borderColor = spec.color;
  },

  cleanup(_state: DashedFlowState, obj: BaseSolid, _halos: ElementHaloPool) {
    obj._animOverrides.dashOffset = 0;
    obj._animOverrides.borderColor = undefined;
  },
};
