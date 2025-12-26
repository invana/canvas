/**
 * Glow Effect Drawing
 * Soft glow/halo effects around shapes
 */

import type { Graphics } from 'pixi.js';
import type { EffectStyle } from './types';

/**
 * Parameters for glow effect around a circle
 */
export interface CircleGlowParams {
  x: number;
  y: number;
  radius: number;
  /** How far the glow extends beyond the shape */
  glowSize: number;
  /** Number of layers for smooth gradient effect */
  layers?: number;
}

/**
 * Parameters for glow effect around a rectangle
 */
export interface RectGlowParams {
  x: number;
  y: number;
  width: number;
  height: number;
  glowSize: number;
  layers?: number;
  cornerRadius?: number;
}

/**
 * Draw a circular glow effect
 * Uses multiple concentric circles with decreasing alpha
 */
export function drawCircleGlow(
  g: Graphics,
  params: CircleGlowParams,
  style: EffectStyle
): void {
  const { x, y, radius, glowSize, layers = 8 } = params;
  const baseAlpha = style.alpha ?? 0.3;

  for (let i = layers; i >= 0; i--) {
    const layerProgress = i / layers;
    const layerRadius = radius + glowSize * layerProgress;
    const layerAlpha = baseAlpha * (1 - layerProgress) * (1 - layerProgress);

    if (layerAlpha > 0.01) {
      g.circle(x, y, layerRadius);
      g.fill({ color: style.color, alpha: layerAlpha });
    }
  }
}

/**
 * Draw a rectangular glow effect
 */
export function drawRectGlow(
  g: Graphics,
  params: RectGlowParams,
  style: EffectStyle
): void {
  const { x, y, width, height, glowSize, layers = 8, cornerRadius = 0 } = params;
  const baseAlpha = style.alpha ?? 0.3;

  for (let i = layers; i >= 0; i--) {
    const layerProgress = i / layers;
    const expansion = glowSize * layerProgress;
    const layerAlpha = baseAlpha * (1 - layerProgress) * (1 - layerProgress);

    if (layerAlpha > 0.01) {
      const lx = x - expansion;
      const ly = y - expansion;
      const lw = width + expansion * 2;
      const lh = height + expansion * 2;
      const lr = cornerRadius + expansion;

      if (cornerRadius > 0) {
        g.roundRect(lx, ly, lw, lh, lr);
      } else {
        g.rect(lx, ly, lw, lh);
      }
      g.fill({ color: style.color, alpha: layerAlpha });
    }
  }
}

/**
 * Draw a selection highlight (thin glow border)
 */
export function drawSelectionHighlight(
  g: Graphics,
  params: { x: number; y: number; width: number; height: number; cornerRadius?: number },
  style: EffectStyle
): void {
  const { x, y, width, height, cornerRadius = 0 } = params;

  if (cornerRadius > 0) {
    g.roundRect(x, y, width, height, cornerRadius);
  } else {
    g.rect(x, y, width, height);
  }
  g.stroke({
    color: style.color,
    width: style.strokeWidth ?? 2,
    alpha: style.alpha ?? 1,
  });
}
