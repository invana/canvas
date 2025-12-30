/**
 * Arrow Drawing Types
 * Common types for all arrow head drawing functions
 */

import type { Graphics } from 'pixi.js';

/**
 * Style options for arrow heads
 */
export interface ArrowStyle {
  fill?: string;
  fillAlpha?: number;
  stroke?: string;
  strokeWidth?: number;
  strokeAlpha?: number;
}

/**
 * Common parameters for all arrow heads
 */
export interface ArrowParams {
  /** Position of the arrow tip */
  x: number;
  y: number;
  /** Angle in radians (direction the arrow points) */
  angle: number;
  /** Size of the arrow */
  size: number;
}

/**
 * An arrow drawing function signature
 */
export type ArrowDrawFn = (
  g: Graphics,
  params: ArrowParams,
  style: ArrowStyle
) => void;

/**
 * Available arrow types
 */
export type ArrowType =
  | 'triangle'
  | 'triangle-outline'
  | 'triangle-thin'
  | 'circle'
  | 'circle-outline'
  | 'diamond'
  | 'diamond-outline'
  | 'vee'
  | 'tee'
  | 'square'
  | 'square-outline'
  | 'bar'
  | 'none';

/**
 * Get the offset (length) of an arrow type
 * This is how far back from the edge endpoint the arrow extends
 */
export function getArrowOffset(type: ArrowType, size: number): number {
  switch (type) {
    case 'triangle':
    case 'triangle-outline':
    case 'vee':
      return size;
    case 'triangle-thin':
      return size * 1.5;
    case 'diamond':
    case 'diamond-outline':
      return size;
    case 'circle':
    case 'circle-outline':
      return size / 2;
    case 'square':
    case 'square-outline':
      return size / 2;
    case 'tee':
    case 'bar':
      return 0;
    case 'none':
    default:
      return 0;
  }
}
