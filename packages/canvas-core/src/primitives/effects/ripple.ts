/**
 * Ripple Effect Drawing
 * Concentric circles radiating outward
 */

import type { Graphics } from 'pixi.js';
import type { EffectStyle } from './types';

/**
 * Parameters for ripple effect
 */
export interface RippleParams {
  x: number;
  y: number;
  /** Current radius of the ripple */
  radius: number;
  /** Maximum radius the ripple will reach */
  maxRadius: number;
  /** Number of concentric rings */
  ringCount?: number;
}

/**
 * Draw a single ripple ring
 */
export function drawRippleRing(
  g: Graphics,
  x: number,
  y: number,
  radius: number,
  style: EffectStyle
): void {
  g.circle(x, y, radius);
  g.stroke({
    color: style.color,
    width: style.strokeWidth ?? 2,
    alpha: style.alpha ?? 0.5,
    alignment: 0.5,
  });
}

/**
 * Draw concentric ripple circles
 * The alpha fades as radius increases
 */
export function drawRippleEffect(
  g: Graphics,
  params: RippleParams,
  style: EffectStyle
): void {
  const { x, y, radius, maxRadius, ringCount = 3 } = params;
  const baseAlpha = style.alpha ?? 0.5;

  for (let i = 0; i < ringCount; i++) {
    // Stagger rings at different phases
    const phase = i / ringCount;
    const ringRadius = (radius + maxRadius * phase) % maxRadius;
    
    // Alpha fades as ring expands
    const progress = ringRadius / maxRadius;
    const alpha = baseAlpha * (1 - progress);
    
    if (alpha > 0.01 && ringRadius > 0) {
      g.circle(x, y, ringRadius);
      g.stroke({
        color: style.color,
        width: style.strokeWidth ?? 2,
        alpha,
        alignment: 0.5,
      });
    }
  }
}

/**
 * Calculate ripple radius based on animation progress (0 to 1)
 */
export function calculateRippleRadius(
  progress: number,
  maxRadius: number
): number {
  return progress * maxRadius;
}

/**
 * Calculate ripple alpha based on animation progress (0 to 1)
 * Fades out as it expands
 */
export function calculateRippleAlpha(
  progress: number,
  baseAlpha: number = 0.5
): number {
  return baseAlpha * (1 - progress);
}
