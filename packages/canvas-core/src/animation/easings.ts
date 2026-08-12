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

export const easeOutQuad: Easing = (t) => 1 - (1 - t) * (1 - t);

/**
 * Stable string keys for the built-in easings.
 *
 * Serializable easing handle — use this (not an `Easing` function) anywhere an
 * easing must live in JSON config or bind to a `<select>` / lil-gui dropdown
 * (e.g. a layout's `transitionEase`). Resolve to the function with
 * {@link resolveEasing}.
 */
export type EasingName = 'linear' | 'easeInOutSine' | 'easeOutCubic' | 'easeInOutCubic' | 'easeOutQuad';

/** Registry backing {@link resolveEasing}. Keep in sync with {@link EasingName}. */
const EASINGS: Record<EasingName, Easing> = {
  linear,
  easeInOutSine,
  easeOutCubic,
  easeInOutCubic,
  easeOutQuad,
};

/** All built-in easing names — handy for populating a picker. */
export const EASING_NAMES = Object.keys(EASINGS) as EasingName[];

/**
 * Resolve an {@link EasingName} (or `undefined`) to its `Easing` function,
 * falling back to `fallback` (default {@link easeOutCubic}) for an unknown or
 * missing name. Lets config carry a serializable easing key while runtime code
 * gets the function.
 */
export function resolveEasing(name: EasingName | undefined, fallback: Easing = easeOutCubic): Easing {
  return (name && EASINGS[name]) || fallback;
}
