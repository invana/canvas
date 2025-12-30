/**
 * LineEdge
 * 
 * Straight line edge implementation.
 * Draws a simple line from source to target.
 */

import type { PathStyle, Point } from '../../primitives/paths';
import { RendererEdgeBase, type EdgeShapeOptions, type EdgeTangents, type EdgePathType } from './RendererEdgeBase';

/**
 * Line edge options (same as base edge options)
 */
export type LineEdgeOptions = EdgeShapeOptions;

/**
 * Straight line edge
 */
export class LineEdge extends RendererEdgeBase {
  get pathType(): EdgePathType {
    return 'line';
  }

  protected drawPath(source: Point, target: Point, style: PathStyle): void {
    this._registry.drawPath(this._graphics, 'line', {
      from: source,
      to: target,
    }, style);
  }

  protected calculateTangents(source: Point, target: Point): EdgeTangents {
    // Simple straight line - tangent is the angle from source to target
    const angle = Math.atan2(target.y - source.y, target.x - source.x);
    return {
      sourceTangent: angle,
      targetTangent: angle,
    };
  }
}
