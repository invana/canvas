/**
 * Shape Drawing Types
 * Common types for all shape drawing functions
 */

import type { Graphics } from 'pixi.js';

/**
 * Style options for shape fill and stroke
 */
export interface ShapeStyle {
  fill?: string;
  fillAlpha?: number;
  stroke?: string;
  strokeWidth?: number;
  strokeAlpha?: number;
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
  style: Pick<ShapeStyle, 'stroke' | 'strokeWidth' | 'strokeAlpha'>
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
