/**
 * Shape Fill Helper
 * 
 * Common utility for applying fills to shape primitives
 */

import type { Graphics } from 'pixi.js';
import type { ShapeStyle } from './types.js';
import { normalizeFill, applyFillSync, type FillBounds } from '../fills/index.js';

/**
 * Apply fill from ShapeStyle to graphics
 * This handles the conversion of legacy string/number fills to the new Fill system
 */
export function applyShapeFill(
  g: Graphics,
  style: ShapeStyle,
  bounds: FillBounds
): boolean {
  if (!style.fill) return false;

  const fill = normalizeFill(style.fill);
  if (!fill) return false;

  // Override alpha if fillAlpha is specified (legacy support)
  if (style.fillAlpha !== undefined && fill.type === 'solid') {
    fill.alpha = style.fillAlpha;
  }

  applyFillSync(g, fill, bounds);
  return true;
}
