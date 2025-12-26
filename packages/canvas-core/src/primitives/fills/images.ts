/**
 * Image Fill Primitives
 * 
 * Reusable image fill functions for use in nodes
 * (Edges typically don't use image fills)
 */

import { Assets, Texture, type Graphics } from 'pixi.js';
import type { ImageFill, FillBounds } from './types.js';

/**
 * Calculate image transformation matrix for fit modes
 * 
 * @param texture - Image texture
 * @param bounds - Target bounds
 * @param fit - Fit mode
 * @param alignX - Horizontal alignment (0-1)
 * @param alignY - Vertical alignment (0-1)
 * @returns Matrix parameters
 */
export function calculateImageMatrix(
  texture: Texture,
  bounds: FillBounds,
  fit: 'fill' | 'contain' | 'cover' | 'none' = 'cover',
  alignX: number = 0.5,
  alignY: number = 0.5
): {
  scaleX: number;
  scaleY: number;
  offsetX: number;
  offsetY: number;
} {
  // Validate texture
  if (!texture || !texture.width || !texture.height) {
    console.error('Invalid texture provided to calculateImageMatrix');
    return {
      scaleX: 1,
      scaleY: 1,
      offsetX: bounds.x,
      offsetY: bounds.y,
    };
  }

  const imgWidth = texture.width;
  const imgHeight = texture.height;
  const imgRatio = imgWidth / imgHeight;
  const boundsRatio = bounds.width / bounds.height;

  let finalWidth = bounds.width;
  let finalHeight = bounds.height;
  let offsetX = 0;
  let offsetY = 0;

  switch (fit) {
    case 'fill':
      // Stretch to fill, ignore aspect ratio
      finalWidth = bounds.width;
      finalHeight = bounds.height;
      break;

    case 'contain':
      // Fit inside bounds, maintain aspect ratio
      if (imgRatio > boundsRatio) {
        finalWidth = bounds.width;
        finalHeight = bounds.width / imgRatio;
      } else {
        finalHeight = bounds.height;
        finalWidth = bounds.height * imgRatio;
      }
      break;

    case 'cover':
      // Cover bounds, maintain aspect ratio (crop if needed)
      if (imgRatio > boundsRatio) {
        finalHeight = bounds.height;
        finalWidth = bounds.height * imgRatio;
      } else {
        finalWidth = bounds.width;
        finalHeight = bounds.width / imgRatio;
      }
      break;

    case 'none':
      // Original size
      finalWidth = imgWidth;
      finalHeight = imgHeight;
      break;
  }

  // Apply alignment
  offsetX = (bounds.width - finalWidth) * alignX;
  offsetY = (bounds.height - finalHeight) * alignY;

  return {
    scaleX: finalWidth / imgWidth,
    scaleY: finalHeight / imgHeight,
    offsetX: bounds.x + offsetX,
    offsetY: bounds.y + offsetY,
  };
}

/**
 * Load an image texture from URL
 * 
 * @param url - Image URL
 * @returns Promise resolving to Texture or null
 * 
 * @example
 * ```typescript
 * const texture = await loadImageTexture('https://example.com/image.png');
 * if (texture) {
 *   // use texture
 * }
 * ```
 */
export async function loadImageTexture(url: string): Promise<Texture | null> {
  try {
    const texture = await Assets.load(url);
    if (!texture || !texture.width || !texture.height) {
      console.warn(`Texture loaded but is invalid: ${url}`);
      return null;
    }
    return texture;
  } catch (error) {
    console.warn(`Failed to load image texture from ${url}:`, error);
    return null;
  }
}

/**
 * Apply image fill to graphics synchronously (texture must be pre-loaded)
 * 
 * @param graphics - Graphics object
 * @param texture - Pre-loaded texture
 * @param bounds - Shape bounds
 * @param options - Image fill options
 * 
 * @example
 * ```typescript
 * const texture = await Assets.load('image.png');
 * applyImageFill(graphics, texture, bounds, {
 *   fit: 'cover',
 *   alignX: 0.5,
 *   alignY: 0.5,
 *   alpha: 1,
 *   tint: 0xFFFFFF
 * });
 * ```
 */
export function applyImageFill(
  graphics: Graphics,
  texture: Texture,
  bounds: FillBounds,
  options: {
    fit?: 'fill' | 'contain' | 'cover' | 'none';
    alignX?: number;
    alignY?: number;
    alpha?: number;
    tint?: number;
  } = {}
): void {
  const {
    fit = 'cover',
    alignX = 0.5,
    alignY = 0.5,
    alpha = 1,
    tint = 0xFFFFFF,
  } = options;

  const matrix = calculateImageMatrix(texture, bounds, fit, alignX, alignY);

  graphics.fill({
    texture,
    alpha,
    color: tint,
    matrix: {
      a: matrix.scaleX,
      b: 0,
      c: 0,
      d: matrix.scaleY,
      tx: matrix.offsetX,
      ty: matrix.offsetY,
    },
  } as any);
}

/**
 * Apply image fill from ImageFill definition (async)
 * 
 * @param graphics - Graphics object
 * @param fill - Image fill configuration
 * @param bounds - Shape bounds
 * 
 * @example
 * ```typescript
 * await applyImageFillAsync(graphics, {
 *   type: 'image',
 *   src: 'https://example.com/image.png',
 *   fit: 'cover',
 *   alignX: 0.5,
 *   alignY: 0.5,
 *   alpha: 1
 * }, bounds);
 * ```
 */
export async function applyImageFillAsync(
  graphics: Graphics,
  fill: ImageFill,
  bounds: FillBounds
): Promise<void> {
  try {
    const texture = typeof fill.src === 'string'
      ? await loadImageTexture(fill.src)
      : fill.src;

    // Check if texture loaded successfully
    if (!texture || !texture.width || !texture.height) {
      console.warn(`Image texture failed to load or is invalid: ${fill.src}`);
      // Fallback to solid color
      graphics.fill({ color: 0xcccccc, alpha: 0.5 });
      return;
    }

    applyImageFill(graphics, texture, bounds, {
      fit: fill.fit,
      alignX: fill.alignX,
      alignY: fill.alignY,
      alpha: fill.alpha,
      tint: fill.tint as number | undefined,
    });
  } catch (error) {
    console.error('Failed to load image fill:', error);
    // Fallback to solid color
    graphics.fill({ color: 0xcccccc, alpha: 0.5 });
  }
}
