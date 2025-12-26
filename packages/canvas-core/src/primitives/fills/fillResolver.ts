/**
 * Fill Resolver
 * 
 * Converts Fill definitions to PixiJS-compatible fill styles
 * Uses reusable gradient and image primitives
 */

import { Graphics } from 'pixi.js';
import type {
  Fill,
  SolidFill,
  LinearGradientFill,
  RadialGradientFill,
  ImageFill,
  PatternFill,
  FillBounds,
} from './types.js';
import { createLinearGradient, createRadialGradient } from './gradients.js';
import {
  applyImageFillAsync,
  applyImageFill as applyImageFillPrimitive,
  loadImageTexture,
} from './images.js';

/**
 * Apply a fill to a Graphics object
 * This function handles all fill types and converts them to PixiJS fill styles
 */
export async function applyFill(
  graphics: Graphics,
  fill: Fill,
  bounds: FillBounds
): Promise<void> {
  switch (fill.type) {
    case 'solid':
      applySolidFill(graphics, fill);
      break;
    case 'linear':
      applyLinearGradientFill(graphics, fill, bounds);
      break;
    case 'radial':
      applyRadialGradientFill(graphics, fill, bounds);
      break;
    case 'image':
      await applyImageFill(graphics, fill, bounds);
      break;
    case 'pattern':
      await applyPatternFill(graphics, fill, bounds);
      break;
  }
}

/**
 * Apply solid color fill
 */
function applySolidFill(graphics: Graphics, fill: SolidFill): void {
  graphics.fill({
    color: fill.color,
    alpha: fill.alpha ?? 1,
  });
}

/**
 * Apply linear gradient fill using reusable primitive
 */
function applyLinearGradientFill(
  graphics: Graphics,
  fill: LinearGradientFill,
  bounds: FillBounds
): void {
  const gradient = createLinearGradient(fill, bounds);
  // PixiJS v8 expects gradient to be passed directly
  graphics.fill(gradient);
  // Apply alpha separately if specified
  if (fill.alpha !== undefined && fill.alpha !== 1) {
    graphics.alpha = fill.alpha;
  }
}

/**
 * Apply radial gradient fill using reusable primitive
 */
function applyRadialGradientFill(
  graphics: Graphics,
  fill: RadialGradientFill,
  bounds: FillBounds
): void {
  const gradient = createRadialGradient(fill, bounds);
  // PixiJS v8 expects gradient to be passed directly
  graphics.fill(gradient);
  // Apply alpha separately if specified
  if (fill.alpha !== undefined && fill.alpha !== 1) {
    graphics.alpha = fill.alpha;
  }
}

/**
 * Apply image fill using reusable primitive (async)
 */
async function applyImageFill(
  graphics: Graphics,
  fill: ImageFill,
  bounds: FillBounds
): Promise<void> {
  await applyImageFillAsync(graphics, fill, bounds);
}

/**
 * Apply pattern fill (repeating texture)
 */
async function applyPatternFill(
  graphics: Graphics,
  fill: PatternFill,
  bounds: FillBounds
): Promise<void> {
  try {
    const texture = typeof fill.src === 'string'
      ? await loadImageTexture(fill.src)
      : fill.src;

    const scale = fill.scale ?? 1;

    graphics.fill({
      texture,
      alpha: fill.alpha ?? 1,
      color: fill.tint ?? 0xFFFFFF,
      matrix: {
        a: scale,
        b: 0,
        c: 0,
        d: scale,
        tx: bounds.x,
        ty: bounds.y,
      },
    } as any);
  } catch (error) {
    console.error('Failed to load pattern fill:', error);
    graphics.fill({ color: '#eeeeee', alpha: 0.5 });
  }
}

/**
 * Synchronous version of applyFill for backward compatibility
 * Note: Image/pattern fills will not work, will fallback to solid color
 */
export function applyFillSync(
  graphics: Graphics,
  fill: Fill,
  bounds: FillBounds
): void {
  switch (fill.type) {
    case 'solid':
      applySolidFill(graphics, fill);
      break;
    case 'linear':
      applyLinearGradientFill(graphics, fill, bounds);
      break;
    case 'radial':
      applyRadialGradientFill(graphics, fill, bounds);
      break;
    case 'image':
      // Try to apply if texture is already loaded
      if (typeof fill.src !== 'string') {
        try {
          applyImageFillSync(graphics, fill, bounds);
        } catch (error) {
          console.warn('Image fill requires Texture object or async loading. Falling back to solid color.');
          graphics.fill({ color: '#cccccc', alpha: 0.5 });
        }
      } else {
        console.warn('Image fill from URL requires async loading. Use applyFill() instead or pass a Texture object.');
        graphics.fill({ color: '#cccccc', alpha: 0.5 });
      }
      break;
    case 'pattern':
      console.warn('Pattern fills require async loading. Use applyFill() instead.');
      graphics.fill({ color: '#eeeeee', alpha: 0.5 });
      break;
  }
}

/**
 * Apply image fill synchronously using reusable primitive
 * (texture must already be loaded)
 */
function applyImageFillSync(
  graphics: Graphics,
  fill: ImageFill,
  bounds: FillBounds
): void {
  if (typeof fill.src === 'string') {
    throw new Error('Cannot apply image fill synchronously from URL');
  }

  applyImageFillPrimitive(graphics, fill.src, bounds, {
    fit: fill.fit,
    alignX: fill.alignX,
    alignY: fill.alignY,
    alpha: fill.alpha,
    tint: fill.tint as number | undefined,
  });
}
