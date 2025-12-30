/**
 * Shape Drawing Types
 * Common types for all shape drawing functions
 */

import type { Graphics } from 'pixi.js';
import type { Fill } from '../fills/types.js';

/**
 * Stroke style type - controls line appearance
 */
export type StrokeStyle = 'solid' | 'dashed' | 'dotted';

/**
 * Style options for shape fill and stroke
 */
export interface ShapeStyle {
  /** Fill style - supports solid colors, gradients, images, and patterns */
  fill?: string | number | Fill;
  /** Stroke color */
  stroke?: string;
  /** Stroke width */
  strokeWidth?: number;
  /** Stroke alpha */
  strokeAlpha?: number;
  /** Stroke style - solid, dashed, or dotted */
  strokeStyle?: StrokeStyle;
  /** Custom dash pattern (overrides strokeStyle) - array of [dash, gap] lengths */
  strokeDashPattern?: number[];
  /** Dash pattern offset for animation or alignment */
  strokeDashOffset?: number;
  /** Stroke alignment: 0 = outside, 0.5 = centered (default), 1 = inside */
  strokeAlignment?: number;
  /** Stroke cap style: 'butt' (default), 'round', 'square' */
  strokeCap?: 'butt' | 'round' | 'square';
  
  // Halo effect properties
  /** Whether to display node halo */
  halo?: boolean;
  /** Node halo stroke width */
  haloStrokeWidth?: number;
  /** Node halo stroke color (defaults to fill color) */
  haloStroke?: string | number | Fill;
  /** Node halo stroke opacity */
  haloStrokeOpacity?: number;
}

/**
 * A shape drawing function signature
 * All shape functions follow this pattern for consistency
 */
export type ShapeDrawFn<TParams = unknown> = (
  g: Graphics,
  params: TParams,
  style: ShapeStyle
) => void;

/**
 * Outline-only drawing function signature
 */
export type OutlineDrawFn<TParams = unknown> = (
  g: Graphics,
  params: TParams,
  style: Pick<ShapeStyle, 'stroke' | 'strokeWidth' | 'strokeAlpha' | 'strokeStyle' | 'strokeDashPattern' | 'strokeDashOffset' | 'strokeAlignment' | 'strokeCap'>
) => void;

/**
 * Descriptor for shape outlines (used by effects like ripples, selection rings)
 */
export type OutlineDescriptor =
  | { type: 'none' }
  | { type: 'circle'; x: number; y: number; radius: number }
  | { type: 'rect'; x: number; y: number; width: number; height: number }
  | { type: 'roundedRect'; x: number; y: number; width: number; height: number; radius: number }
  | { type: 'polygon'; points: number[] }
  | { type: 'ellipse'; x: number; y: number; radiusX: number; radiusY: number };

/**
 * Scale an outline descriptor
 */
export function scaleOutlineDescriptor(descriptor: OutlineDescriptor, scale: number): OutlineDescriptor {
  switch (descriptor.type) {
    case 'none':
      return descriptor;
    case 'circle':
      return { ...descriptor, radius: descriptor.radius * scale };
    case 'rect':
      return {
        ...descriptor,
        x: descriptor.x * scale,
        y: descriptor.y * scale,
        width: descriptor.width * scale,
        height: descriptor.height * scale,
      };
    case 'roundedRect':
      return {
        ...descriptor,
        x: descriptor.x * scale,
        y: descriptor.y * scale,
        width: descriptor.width * scale,
        height: descriptor.height * scale,
        radius: descriptor.radius * scale,
      };
    case 'polygon':
      return {
        ...descriptor,
        points: descriptor.points.map((p) => p * scale),
      };
    case 'ellipse':
      return {
        ...descriptor,
        radiusX: descriptor.radiusX * scale,
        radiusY: descriptor.radiusY * scale,
      };
  }
}
