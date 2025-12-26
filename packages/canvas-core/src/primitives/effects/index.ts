/**
 * Effect Primitives Module
 * 
 * Pure functions for drawing visual effects (ripples, glows, etc.)
 * All PixiJS Graphics calls for effects are contained here.
 * 
 * @example
 * ```typescript
 * import { drawRippleEffect, drawCircleGlow } from './primitives/effects';
 * 
 * // Draw expanding ripple
 * drawRippleEffect(graphics, { x: 100, y: 100, radius: 30, maxRadius: 80 }, { color: '#00f' });
 * 
 * // Draw glow around a circle
 * drawCircleGlow(graphics, { x, y, radius: 30, glowSize: 15 }, { color: '#ff0', alpha: 0.3 });
 * ```
 */

// Types
export type { EffectStyle, EffectParams, EffectDrawFn } from './types';

// Ripple
export type { RippleParams } from './ripple';
export {
  drawRippleRing,
  drawRippleEffect,
  calculateRippleRadius,
  calculateRippleAlpha,
} from './ripple';

// Glow
export type { CircleGlowParams, RectGlowParams } from './glow';
export {
  drawCircleGlow,
  drawRectGlow,
  drawSelectionHighlight,
} from './glow';
