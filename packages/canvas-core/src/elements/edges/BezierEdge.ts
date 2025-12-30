/**
 * BezierEdge
 * 
 * Curved bezier edge implementation.
 * Draws a quadratic bezier curve from source to target.
 */

import type { PathStyle, Point } from '../../primitives/paths';
import { RendererEdgeBase, type EdgeShapeOptions, type EdgeTangents, type EdgePathType } from './RendererEdgeBase';

/**
 * Bezier edge options (same as base edge options)
 */
export type BezierEdgeOptions = EdgeShapeOptions;

/**
 * Quadratic bezier edge
 */
export class BezierEdge extends RendererEdgeBase {
  get pathType(): EdgePathType {
    return 'bezier';
  }

  protected drawPath(source: Point, target: Point, style: PathStyle): void {
    const curvature = this._data.curvature ?? 0.25;
    
    this._registry.drawPath(this._graphics, 'bezier', {
      from: source,
      to: target,
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

    console.log(`[BezierEdge ${this.id}] calculateTangents:`, {
      source, target, curvature, control: { x: controlX, y: controlY }
    });

    // Tangent at source: direction from source to control point
    const sourceTangent = Math.atan2(controlY - source.y, controlX - source.x);
    
    // Tangent at target: direction from control point to target
    const targetTangent = Math.atan2(target.y - controlY, target.x - controlX);

    return {
      sourceTangent,
      targetTangent,
    };
  }

  /**
   * Override boundary direction to match the bezier curve tangent
   * This ensures edges connect to nodes at the correct angle
   */
  public calculateBoundaryDirection(source: Point, target: Point, isSource: boolean): Point {
    const tangents = this.calculateTangents(source, target);
    const angle = isSource ? tangents.sourceTangent : tangents.targetTangent;
    
    return {
      x: Math.cos(angle),
      y: Math.sin(angle),
    };
  }
}
