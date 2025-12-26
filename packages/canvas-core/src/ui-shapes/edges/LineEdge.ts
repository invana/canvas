/**
 * LineEdge
 * 
 * Straight line edge implementation.
 * Draws a simple line from source to target.
 */

import type { PathStyle, Point } from '../../primitives/paths';
import { EdgeShapeBase, type EdgeShapeOptions, type EdgeTangents, type EdgePathType } from './EdgeShapeBase';

/**
 * Line edge options (same as base edge options)
 */
export type LineEdgeOptions = EdgeShapeOptions;

/**
 * Straight line edge
 */
export class LineEdge extends EdgeShapeBase {
  get pathType(): EdgePathType {
    return 'line';
  }

  protected drawPath(source: Point, target: Point, style: PathStyle): void {
    this._registry.drawPath(this._graphics, 'line', {
      source,
      target,
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
