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
    // Container is positioned at sourceCenter, so convert to relative coordinates
    const containerPos = this._data.sourceCenter;
    
    this._registry.drawPath(this._graphics, 'line', {
      from: { x: source.x - containerPos.x, y: source.y - containerPos.y },
      to: { x: target.x - containerPos.x, y: target.y - containerPos.y },
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
