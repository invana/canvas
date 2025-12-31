/**
 * BezierEdge
 * 
 * Curved bezier edge implementation following invana-studio-mvp architecture.
 * Calculates control points FIRST, then boundaries based on curve direction.
 */

import type { PathStyle } from '../../primitives/paths';
import { RendererEdgeBase, type EdgeShapeOptions, type EdgePathType } from './RendererEdgeBase';

/**
 * Bezier edge options (same as base edge options)
 */
export type BezierEdgeOptions = EdgeShapeOptions;

/**
 * Quadratic bezier edge - following invana-studio-mvp BezierEdgeRenderer pattern
 */
export class BezierEdge extends RendererEdgeBase {
  get pathType(): EdgePathType {
    return 'bezier';
  }

  /**
   * Render bezier edge - calculate control point first, then boundaries based on curve
   * Following invana-studio-mvp: BezierEdgeRenderer.ts
   */
  protected renderEdge(sourceNode: any, targetNode: any, style: PathStyle): void {
    if (!sourceNode || !targetNode) {
      console.warn('BezierEdge: Missing source or target node');
      return;
    }

    const curvature = this._data.curvature ?? 0.25;
    const targetArrow = this._data.arrowTarget ?? 'triangle';
    const arrowSize = this._data.arrowSize ?? 10;

    // Calculate vector between node centers
    const dx = targetNode.x - sourceNode.x;
    const dy = targetNode.y - sourceNode.y;
    const length = Math.sqrt(dx * dx + dy * dy);

    if (length < 0.001) {
      return; // Avoid division by zero
    }

    // Perpendicular vector for curve offset
    const vectorNormInverse = {
      x: -dy / length,
      y: dx / length
    };

    // Get node radii for midpoint calculation
    const sourceRadius = (sourceNode._data?.size ?? 30) / 2;
    const targetRadius = (targetNode._data?.size ?? 30) / 2;

    // Calculate midpoint between intersection points (not centers!)
    // This matches invana-studio-mvp exactly
    const midptPts = {
      x1: sourceNode.x + (dx / length) * sourceRadius,
      y1: sourceNode.y + (dy / length) * sourceRadius,
      x2: targetNode.x - (dx / length) * targetRadius,
      y2: targetNode.y - (dy / length) * targetRadius
    };

    const adjustedMidpt = {
      x: (midptPts.x1 + midptPts.x2) / 2,
      y: (midptPts.y1 + midptPts.y2) / 2
    };

    // Calculate control point perpendicular to line
    const curveOffset = length * curvature;
    const cpX = adjustedMidpt.x + vectorNormInverse.x * curveOffset;
    const cpY = adjustedMidpt.y + vectorNormInverse.y * curveOffset;

    // NOW calculate boundaries based on control point direction
    // Source: angle from source to control point
    const sourceAngle = Math.atan2(cpY - sourceNode.y, cpX - sourceNode.x);
    const start = this.getEdgeEndpointByAngle(sourceNode, sourceAngle, 0);

    // Target: angle from control point to target
    const targetAngle = Math.atan2(targetNode.y - cpY, targetNode.x - cpX);
    
    // Calculate target offset for arrow
    let targetOffset = 0;
    if (targetArrow !== 'none') {
      const arrowBackDistance = arrowSize * Math.cos(Math.PI / 6); // 30 degrees
      targetOffset = arrowBackDistance;
    }
    
    const end = this.getEdgeEndpointByAngle(targetNode, targetAngle + Math.PI, targetOffset);

    // Convert to container-relative coordinates (container is at sourceNode)
    const relStart = {
      x: start.x - sourceNode.x,
      y: start.y - sourceNode.y
    };
    const relCP = {
      x: cpX - sourceNode.x,
      y: cpY - sourceNode.y
    };
    const relEnd = {
      x: end.x - sourceNode.x,
      y: end.y - sourceNode.y
    };

    // Draw the bezier curve
    this._graphics.clear();
    this._graphics.moveTo(relStart.x, relStart.y);
    this._graphics.quadraticCurveTo(relCP.x, relCP.y, relEnd.x, relEnd.y);
    this._graphics.stroke({ 
      width: style.strokeWidth ?? 2, 
      color: style.stroke ?? '#000000' 
    });

    // Draw arrows - convert hex string to number for arrows
    const strokeColor = typeof style.stroke === 'string' 
      ? parseInt(style.stroke.replace('#', ''), 16)
      : 0x000000;
    
    if (targetArrow !== 'none') {
      // Calculate tangent at end point (from control point to end)
      const tangentAngle = Math.atan2(end.y - cpY, end.x - cpX);
      this.drawArrowAtPoint(relEnd, tangentAngle, targetArrow, arrowSize, strokeColor);
    }

    const sourceArrow = this._data.arrowSource ?? 'none';
    if (sourceArrow !== 'none') {
      // Calculate tangent at start point (from start to control point)  
      const tangentAngle = Math.atan2(cpY - start.y, cpX - start.x);
      this.drawArrowAtPoint(relStart, tangentAngle + Math.PI, sourceArrow, arrowSize, strokeColor);
    }
  }
}
