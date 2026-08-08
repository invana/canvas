/**
 * Time primitives — interpolation with duration, easing, repeat and yoyo.
 *
 * Engine-side: a `Tween` produces numbers, not pixels. Camera easing, layout
 * simulation, drag inertia, animated decorations and animated effects all pull
 * from here, and none of it knows what a renderer is. Moved out of
 * `primitives/` with the P6 split for that reason.
 */

export { Tween } from './Tween';
export type { TweenOptions } from './Tween';
export {
  linear,
  easeInOutSine,
  easeOutCubic,
  easeInOutCubic,
} from './easings';
export type { Easing } from './easings';
