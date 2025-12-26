/**
 * Arrow Primitives Module
 * 
 * Pure functions for drawing arrow heads.
 * All PixiJS Graphics calls for arrows are contained here.
 * 
 * @example
 * ```typescript
 * import { drawTriangleArrow, drawArrow, getArrowOffset } from './primitives/arrows';
 * 
 * // Draw specific arrow type
 * drawTriangleArrow(graphics, { x: 100, y: 100, angle: Math.PI, size: 10 }, { fill: '#000' });
 * 
 * // Draw arrow by type name
 * drawArrow(graphics, 'diamond', { x, y, angle, size }, { fill: '#333' });
 * 
 * // Get arrow offset for path trimming
 * const offset = getArrowOffset('triangle', 10);
 * ```
 */

import type { Graphics } from 'pixi.js';
import type { ArrowParams, ArrowStyle, ArrowType } from './types';
import { drawTriangleArrow, drawTriangleOutlineArrow, drawThinTriangleArrow, drawVeeArrow } from './triangle';
import { drawCircleArrow, drawCircleOutlineArrow } from './circle';
import { drawDiamondArrow, drawDiamondOutlineArrow } from './diamond';
import { drawSquareArrow, drawSquareOutlineArrow, drawTeeArrow, drawBarArrow } from './square';

// Types
export type { ArrowStyle, ArrowParams, ArrowDrawFn, ArrowType } from './types';
export { getArrowOffset } from './types';

// Triangle
export { drawTriangleArrow, drawTriangleOutlineArrow, drawThinTriangleArrow, drawVeeArrow } from './triangle';

// Circle
export { drawCircleArrow, drawCircleOutlineArrow } from './circle';

// Diamond
export { drawDiamondArrow, drawDiamondOutlineArrow } from './diamond';

// Square
export { drawSquareArrow, drawSquareOutlineArrow, drawTeeArrow, drawBarArrow } from './square';

/**
 * Draw an arrow by type name
 * Unified function to draw any arrow type
 */
export function drawArrow(
  g: Graphics,
  type: ArrowType,
  params: ArrowParams,
  style: ArrowStyle
): void {
  switch (type) {
    case 'triangle':
      drawTriangleArrow(g, params, style);
      break;
    case 'triangle-outline':
      drawTriangleOutlineArrow(g, params, style);
      break;
    case 'triangle-thin':
      drawThinTriangleArrow(g, params, style);
      break;
    case 'vee':
      drawVeeArrow(g, params, style);
      break;
    case 'circle':
      drawCircleArrow(g, params, style);
      break;
    case 'circle-outline':
      drawCircleOutlineArrow(g, params, style);
      break;
    case 'diamond':
      drawDiamondArrow(g, params, style);
      break;
    case 'diamond-outline':
      drawDiamondOutlineArrow(g, params, style);
      break;
    case 'square':
      drawSquareArrow(g, params, style);
      break;
    case 'square-outline':
      drawSquareOutlineArrow(g, params, style);
      break;
    case 'tee':
      drawTeeArrow(g, params, style);
      break;
    case 'bar':
      drawBarArrow(g, params, style);
      break;
    case 'none':
    default:
      // No arrow to draw
      break;
  }
}
