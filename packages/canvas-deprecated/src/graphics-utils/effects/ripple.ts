import type { Graphics } from 'pixi.js';
import type { EffectStyle } from './types.js';

export interface RippleParams {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  ringCount?: number;
}

export function drawRippleRing(g: Graphics, x: number, y: number, radius: number, style: EffectStyle): void {
  g.circle(x, y, radius);
  g.stroke({ color: style.color, width: style.strokeWidth ?? 2, alpha: style.alpha ?? 0.5, alignment: 0.5 });
}

export function drawRippleEffect(g: Graphics, params: RippleParams, style: EffectStyle): void {
  const { x, y, radius, maxRadius, ringCount = 3 } = params;
  const baseAlpha = style.alpha ?? 0.5;
  for (let i = 0; i < ringCount; i++) {
    const phase = i / ringCount;
    const ringRadius = (radius + maxRadius * phase) % maxRadius;
    const progress = ringRadius / maxRadius;
    const alpha = baseAlpha * (1 - progress);
    if (alpha > 0.01 && ringRadius > 0) {
      g.circle(x, y, ringRadius);
      g.stroke({ color: style.color, width: style.strokeWidth ?? 2, alpha, alignment: 0.5 });
    }
  }
}

export function calculateRippleRadius(progress: number, maxRadius: number): number {
  return progress * maxRadius;
}

export function calculateRippleAlpha(progress: number, baseAlpha = 0.5): number {
  return baseAlpha * (1 - progress);
}
