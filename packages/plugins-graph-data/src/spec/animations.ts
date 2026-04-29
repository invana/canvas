// ── Animation option types (element-plugin) ───────────────────────────────────
// Each interface describes the user-facing options for one animation type.
// There is no `type` discriminant field — the key in ElementAnimations IS the type.

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
 * Animations to apply to a solid element via {@link ElementPlugin.animate}.
 *
 * @remarks
 * Each key is the animation **type name**; its value is the options for that
 * animation. Multiple animations can run simultaneously on the same element.
 *
 * @example
 * ```ts
 * elements.animate('n1', { breathe: { amplitude: 0.12, duration: 1667 } });
 *
 * // Multiple simultaneous animations
 * elements.animate('n1', {
 *   breathe:      { amplitude: 0.12 },
 *   colorCycle:   { colors: ['#ff0000', '#00ff00', '#0000ff'] },
 * });
 *
 * // Stop one animation, keep the other
 * elements.clearAnimation('n1', 'breathe');
 * ```
 */
export interface ElementAnimations {
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
  /** Custom animation types registered on {@link AnimationRegistry}. */
  [key: string]: unknown;
}
