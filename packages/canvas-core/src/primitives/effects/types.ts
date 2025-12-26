/**
 * Effect Drawing Types
 * Common types for visual effect drawing functions
 */

import type { Graphics } from 'pixi.js';

/**
 * Style for effect rendering
 */
export interface EffectStyle {
  color: string;
  alpha?: number;
  strokeWidth?: number;
}

/**
 * Base params for effects
 */
export interface EffectParams {
  x: number;
  y: number;
}

/**
 * An effect drawing function signature
 */
export type EffectDrawFn<TParams = unknown> = (
  g: Graphics,
  params: TParams,
  style: EffectStyle
) => void;
