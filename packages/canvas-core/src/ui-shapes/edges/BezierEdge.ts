/**
 * BezierEdge
 * 
 * Curved bezier edge implementation.
 * Draws a quadratic bezier curve from source to target.
 */

import type { PathStyle, Point } from '../../primitives/paths';
import { EdgeShapeBase, type EdgeShapeOptions, type EdgeTangents, type EdgePathType } from './EdgeShapeBase';

/**
 * Bezier edge options (same as base edge options)
 */
export type BezierEdgeOptions = EdgeShapeOptions;

/**
 * Quadratic bezier edge
 */
export class BezierEdge extends EdgeShapeBase {
  get pathType(): EdgePathType {
    return 'bezier';
  }

  protected drawPath(source: Point, target: Point, style: PathStyle): void {
    const curvature = this._data.curvature ?? 0.25;
    
    this._registry.drawPath(this._graphics, 'bezier', {
      source,
      target,
      curvature,
    }, style);
  }

  protected calculateTangents(source: Point, target: Point): EdgeTangents {
    const curvature = this._data.curvature ?? 0.25;
    
    // Calculate control point
    const midX = (source.x + target.x) / 2;
    const midY = (source.y + target.y) / 2;
    const dx = target.x - source.x;
    const dy = target.y - source.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    // Perpendicular offset for control point
    const perpX = -dy / dist;
    const perpY = dx / dist;
    const offset = dist * curvature;
    
    const controlX = midX + perpX * offset;
    const controlY = midY + perpY * offset;

    // Tangent at source: direction from source to control point
    const sourceTangent = Math.atan2(controlY - source.y, controlX - source.x);
    
    // Tangent at target: direction from control point to target
    const targetTangent = Math.atan2(target.y - controlY, target.x - controlX);

    return {
      sourceTangent,
      targetTangent,
    };
  }
}
