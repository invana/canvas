/**
 * Easing functions consumed by `Tween`. Each is a pure `(t: number) => number`
 * where `t ∈ [0, 1]` is normalised progress and the return value is the eased
 * progress (also typically in `[0, 1]`, though overshoot easings may exceed).
 *
 * Naming follows the standard easing taxonomy (Penner et al). Add new entries
 * here rather than inline-defining easings in effect / decoration code so the
 * set stays consistent across animated primitives.
 */

export type Easing = (t: number) => number;

export const linear: Easing = (t) => t;

export const easeInOutSine: Easing = (t) => -(Math.cos(Math.PI * t) - 1) / 2;

export const easeOutCubic: Easing = (t) => 1 - Math.pow(1 - t, 3);

export const easeInOutCubic: Easing = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
