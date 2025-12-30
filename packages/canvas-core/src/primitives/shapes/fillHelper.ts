/**
 * Shape Fill Helper
 * 
 * Common utility for applying fills to shape primitives
 */

import type { Graphics } from 'pixi.js';
import type { ShapeStyle } from './types.js';
import { normalizeFill, applyFill, type FillBounds } from '../fills/index.js';

/**
 * Apply fill from ShapeStyle to graphics (async version)
 * Converts various fill formats (string, number, Fill object) to the standard Fill system
 * Supports async fills like images and patterns
 */
export async function applyShapeFill(
  g: Graphics,
  style: ShapeStyle,
  bounds: FillBounds
): Promise<boolean> {
  if (!style.fill) return false;

  const fill = normalizeFill(style.fill);
  if (!fill) return false;

  await applyFill(g, fill, bounds);
  return true;
}
