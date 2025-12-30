/**
 * Fill Types
 * 
 * Comprehensive fill system supporting:
 * - Solid colors
 * - Linear gradients
 * - Radial gradients
 * - Image/texture fills
 * - Pattern fills
 */

import type { Texture } from 'pixi.js';

/**
 * Solid color fill
 */
export interface SolidFill {
  type: 'solid';
  /** Color as hex string or number */
  color: string | number;
  /** Optional alpha (0-1) */
  alpha?: number;
}

/**
 * Color stop for gradients
 */
export interface ColorStop {
  /** Position (0-1) */
  offset: number;
  /** Color */
  color: string | number;
}

/**
 * Linear gradient fill
 */
export interface LinearGradientFill {
  type: 'linear';
  /** Start x coordinate (0-1, relative to shape bounds) */
  x0: number;
  /** Start y coordinate (0-1, relative to shape bounds) */
  y0: number;
  /** End x coordinate (0-1, relative to shape bounds) */
  x1: number;
  /** End y coordinate (0-1, relative to shape bounds) */
  y1: number;
  /** Gradient color stops */
  stops: ColorStop[];
  /** Optional alpha (0-1) */
  alpha?: number;
}

/**
 * Radial gradient fill
 */
export interface RadialGradientFill {
  type: 'radial';
  /** Center x coordinate (0-1, relative to shape bounds) */
  x: number;
  /** Center y coordinate (0-1, relative to shape bounds) */
  y: number;
  /** Radius (0-1, relative to shape size) */
  radius: number;
  /** Gradient color stops */
  stops: ColorStop[];
  /** Optional alpha (0-1) */
  alpha?: number;
}

/**
 * Image/texture fill
 */
export interface ImageFill {
  type: 'image';
  /** Image source (URL, base64, or Texture) */
  src: string | Texture;
  /** Fit mode for the image */
  fit?: 'fill' | 'contain' | 'cover' | 'none';
  /** Horizontal alignment (0-1, default 0.5 for center) */
  alignX?: number;
  /** Vertical alignment (0-1, default 0.5 for center) */
  alignY?: number;
  /** Optional alpha (0-1) */
  alpha?: number;
  /** Optional tint color */
  tint?: string | number;
}

/**
 * Pattern fill (repeating image)
 */
export interface PatternFill {
  type: 'pattern';
  /** Pattern image source */
  src: string | Texture;
  /** Pattern repeat mode */
  repeat?: 'repeat' | 'repeat-x' | 'repeat-y' | 'no-repeat';
  /** Scale factor for pattern */
  scale?: number;
  /** Optional alpha (0-1) */
  alpha?: number;
  /** Optional tint color */
  tint?: string | number;
}

/**
 * Union type for all fill types
 */
export type Fill = SolidFill | LinearGradientFill | RadialGradientFill | ImageFill | PatternFill;

/**
 * Bounds for calculating fill coordinates
 */
export interface FillBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Type guard for solid fill
 */
export function isSolidFill(fill: Fill): fill is SolidFill {
  return fill.type === 'solid';
}

/**
 * Type guard for linear gradient
 */
export function isLinearGradientFill(fill: Fill): fill is LinearGradientFill {
  return fill.type === 'linear';
}

/**
 * Type guard for radial gradient
 */
export function isRadialGradientFill(fill: Fill): fill is RadialGradientFill {
  return fill.type === 'radial';
}

/**
 * Type guard for image fill
 */
export function isImageFill(fill: Fill): fill is ImageFill {
  return fill.type === 'image';
}

/**
 * Type guard for pattern fill
 */
export function isPatternFill(fill: Fill): fill is PatternFill {
  return fill.type === 'pattern';
}

/**
 * Helper to normalize fill input
 * Converts simple color strings/numbers to SolidFill
 */
export function normalizeFill(fill: string | number | Fill | undefined): Fill | undefined {
  if (fill === undefined) return undefined;
  
  if (typeof fill === 'string' || typeof fill === 'number') {
    return { type: 'solid', color: fill };
  }
  
  return fill;
}
