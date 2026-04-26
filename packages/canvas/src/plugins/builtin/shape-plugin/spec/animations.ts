// ── Animation option types ────────────────────────────────────────────────────
// Each interface describes the user-facing options for one animation type.
// There is no `type` discriminant field — the key in ShapeAnimations IS the type.
// All animations are driven by AnimationTicker (app.ticker), never CSS.
//
// Option types are re-exported from their handler files via handlers/index.ts
// so this file only holds the top-level ShapeAnimations aggregate type.

export type {
  BreatheOptions,
  ColorCycleOptions,
  FadeInOptions,
  PulseOptions,
  MarchingAntsOptions,
  DashedFlowOptions,
  BorderGlowOptions,
} from '../handlers/index.js';

import type {
  BreatheOptions,
  ColorCycleOptions,
  FadeInOptions,
  PulseOptions,
  MarchingAntsOptions,
  DashedFlowOptions,
  BorderGlowOptions,
} from '../handlers/index.js';

/**
 * Animations to apply to a shape.
 *
 * @remarks
 * Each key is the animation **type name**; its value is the options for that
 * animation. Multiple animations can run simultaneously on the same shape and
 * are each independently stoppable via {@link ShapePlugin.stopAnimation}.
 *
 * The index signature allows custom animation types registered on the
 * {@link AnimationRegistry} to be passed without casting.
 *
 * @example
 * ```ts
 * // Single animation
 * shapes.animate('n1', { breathe: { amplitude: 0.12, duration: 1667 } });
 *
 * // Multiple animations simultaneously
 * shapes.animate('n1', {
 *   breathe:     { amplitude: 0.12 },
 *   marchingAnts: { speed: 1.5 },
 * });
 *
 * // Stop one animation, keep the other
 * shapes.stopAnimation('n1', 'breathe');
 * ```
 */
export interface ShapeAnimations {
  /** Scale oscillation — see {@link BreatheOptions}. */
  breathe?: BreatheOptions;
  /** Fill color palette cycling — see {@link ColorCycleOptions}. */
  colorCycle?: ColorCycleOptions;
  /** Radiating ring pulse — see {@link PulseOptions}. */
  pulse?: PulseOptions;
  /** Opacity fade-in — see {@link FadeInOptions}. */
  fadeIn?: FadeInOptions;
  /** Border dash march — see {@link MarchingAntsOptions}. */
  marchingAnts?: MarchingAntsOptions;
  /** Border dash flow — see {@link DashedFlowOptions}. */
  dashedFlow?: DashedFlowOptions;
  /** Border width glow pulse — see {@link BorderGlowOptions}. */
  borderGlow?: BorderGlowOptions;
  /** Custom animation types registered on the {@link AnimationRegistry}. */
  [key: string]: unknown;
}
