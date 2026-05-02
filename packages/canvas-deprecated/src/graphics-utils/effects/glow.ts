import type { Graphics } from 'pixi.js';
import type { EffectStyle } from './types.js';

export interface CircleGlowParams {
  x: number;
  y: number;
  radius: number;
  glowSize: number;
  layers?: number;
}

export interface RectGlowParams {
  x: number;
  y: number;
  width: number;
  height: number;
  glowSize: number;
  layers?: number;
  cornerRadius?: number;
}

export function drawCircleGlow(g: Graphics, params: CircleGlowParams, style: EffectStyle): void {
  const { x, y, radius, glowSize, layers = 8 } = params;
  const baseAlpha = style.alpha ?? 0.3;

  for (let i = layers; i >= 0; i--) {
    const p = i / layers;
    const layerRadius = radius + glowSize * p;
    const layerAlpha = baseAlpha * (1 - p) * (1 - p);
    if (layerAlpha > 0.01) {
      g.circle(x, y, layerRadius);
      g.fill({ color: style.color, alpha: layerAlpha });
    }
  }
}

export function drawRectGlow(g: Graphics, params: RectGlowParams, style: EffectStyle): void {
  const { x, y, width, height, glowSize, layers = 8, cornerRadius = 0 } = params;
  const baseAlpha = style.alpha ?? 0.3;

  for (let i = layers; i >= 0; i--) {
    const p = i / layers;
    const exp = glowSize * p;
    const layerAlpha = baseAlpha * (1 - p) * (1 - p);
    if (layerAlpha > 0.01) {
      if (cornerRadius > 0) {
        g.roundRect(x - exp, y - exp, width + exp * 2, height + exp * 2, cornerRadius + exp);
      } else {
        g.rect(x - exp, y - exp, width + exp * 2, height + exp * 2);
      }
      g.fill({ color: style.color, alpha: layerAlpha });
    }
  }
}

export function drawSelectionHighlight(
  g: Graphics,
  params: { x: number; y: number; width: number; height: number; cornerRadius?: number },
  style: EffectStyle,
): void {
  const { x, y, width, height, cornerRadius = 0 } = params;
  if (cornerRadius > 0) {
    g.roundRect(x, y, width, height, cornerRadius);
  } else {
    g.rect(x, y, width, height);
  }
  g.stroke({ color: style.color, width: style.strokeWidth ?? 2, alpha: style.alpha ?? 1, alignment: 0.5 });
}
