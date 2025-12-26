/**
 * Gradient Fill Primitives
 * 
 * Reusable gradient creation functions for use in nodes and edges
 */

import { FillGradient } from 'pixi.js';
import type { LinearGradientFill, RadialGradientFill, FillBounds } from './types.js';

/**
 * Create a linear gradient
 * 
 * @param fill - Linear gradient configuration
 * @param bounds - Shape bounds for coordinate conversion
 * @returns Configured FillGradient instance
 * 
 * @example
 * ```typescript
 * const gradient = createLinearGradient({
 *   type: 'linear',
 *   x0: 0, y0: 0, x1: 1, y1: 1,
 *   stops: [
 *     { offset: 0, color: '#FF0000' },
 *     { offset: 1, color: '#0000FF' }
 *   ]
 * }, { x: 0, y: 0, width: 100, height: 100 });
 * 
 * graphics.fill({ fill: gradient });
 * ```
 */
export function createLinearGradient(
  fill: LinearGradientFill,
  _bounds: FillBounds // Not used with normalized coordinates
): FillGradient {
  // Convert relative coordinates to normalized (0-1) space for PixiJS v8
  // PixiJS v8 uses textureSpace: 'local' which expects 0-1 coordinates
  const gradient = new FillGradient({
    type: 'linear',
    start: { x: fill.x0, y: fill.y0 },
    end: { x: fill.x1, y: fill.y1 },
    colorStops: fill.stops.map(stop => ({
      offset: stop.offset,
      color: stop.color
    })),
    textureSpace: 'local' // Use normalized coordinates
  });

  return gradient;
}

/**
 * Create a radial gradient
 * 
 * @param fill - Radial gradient configuration
 * @param bounds - Shape bounds for coordinate conversion
 * @returns Configured FillGradient instance
 * 
 * @example
 * ```typescript
 * const gradient = createRadialGradient({
 *   type: 'radial',
 *   x: 0.5, y: 0.5, radius: 0.5,
 *   stops: [
 *     { offset: 0, color: '#FFFFFF' },
 *     { offset: 1, color: '#000000' }
 *   ]
 * }, { x: 0, y: 0, width: 100, height: 100 });
 * 
 * graphics.fill(gradient);
 * ```
 */
export function createRadialGradient(
  fill: RadialGradientFill,
  _bounds: FillBounds // Not used with normalized coordinates
): FillGradient {
  // PixiJS v8 uses normalized coordinates (0-1) with textureSpace: 'local'
  const gradient = new FillGradient({
    type: 'radial',
    center: { x: fill.x, y: fill.y },
    innerRadius: 0,
    outerCenter: { x: fill.x, y: fill.y },
    outerRadius: fill.radius,
    colorStops: fill.stops.map(stop => ({
      offset: stop.offset,
      color: stop.color
    })),
    textureSpace: 'local' // Use normalized coordinates
  });

  return gradient;
}

/**
 * Create a linear gradient along a line segment (useful for edges)
 * 
 * @param startX - Start point X coordinate
 * @param startY - Start point Y coordinate
 * @param endX - End point X coordinate
 * @param endY - End point Y coordinate
 * @param stops - Color stops
 * @returns Configured FillGradient instance
 * 
 * @example
 * ```typescript
 * // Gradient from node A to node B
 * const gradient = createLineGradient(
 *   nodeA.x, nodeA.y,
 *   nodeB.x, nodeB.y,
 *   [
 *     { offset: 0, color: '#FF0000' },
 *     { offset: 1, color: '#0000FF' }
 *   ]
 * );
 * 
 * graphics.stroke({ fill: gradient, width: 2 });
 * ```
 */
export function createLineGradient(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  stops: Array<{ offset: number; color: string | number }>
): FillGradient {
  const gradient = new FillGradient(startX, startY, endX, endY);
  
  stops.forEach(stop => {
    gradient.addColorStop(stop.offset, stop.color);
  });

  return gradient;
}

/**
 * Create a radial gradient at a specific point (useful for circular effects)
 * 
 * @param centerX - Center point X coordinate
 * @param centerY - Center point Y coordinate
 * @param radius - Gradient radius in pixels
 * @param stops - Color stops
 * @returns Configured FillGradient instance
 * 
 * @example
 * ```typescript
 * // Radial gradient for a node
 * const gradient = createPointGradient(
 *   node.x, node.y, 50,
 *   [
 *     { offset: 0, color: '#FFFFFF' },
 *     { offset: 1, color: '#000000' }
 *   ]
 * );
 * 
 * graphics.fill(gradient);
 * ```
 */
export function createPointGradient(
  centerX: number,
  centerY: number,
  radius: number,
  stops: Array<{ offset: number; color: string | number }>
): FillGradient {
  // Create radial gradient at specific point using absolute coordinates
  const gradient = new FillGradient({
    type: 'radial',
    center: { x: centerX, y: centerY },
    innerRadius: 0,
    outerCenter: { x: centerX, y: centerY },
    outerRadius: radius,
    colorStops: stops.map(stop => ({
      offset: stop.offset,
      color: stop.color
    })),
    textureSpace: 'global' // Use absolute/global coordinates
  });

  return gradient;
}
