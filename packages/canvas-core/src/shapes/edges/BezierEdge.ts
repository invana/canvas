/**
 * Bezier Edge Shape - Cubic bezier curve
 */

import type { EdgeStyle, Point } from '../../types/index.js';
import { BaseEdgeShape } from './BaseEdgeShape.js';
import { normalizeArrowConfig } from './ArrowRenderer.js';

export class BezierEdge extends BaseEdgeShape {
  protected _getDefaultStyle(): EdgeStyle {
    return {
      type: 'bezier',
      stroke: '#999999',
      strokeWidth: 2,
      strokeOpacity: 1,
      opacity: 1,
      targetArrow: {
        type: 'triangle',
        size: 10,
      },
      label: {
        visible: false,
        fontSize: 10,
        textColor: '#666666',
      },
    };
  }

  protected _calculatePath(): Point[] {
    const { source, target } = this._endpoints;
    const controlPoints = this._getControlPoints();

    // Sample points along the bezier curve
    const points: Point[] = [];
    const steps = 20;

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const point = this._bezierPoint(
        t,
        source,
        controlPoints.cp1,
        controlPoints.cp2,
        target,
      );
      points.push(point);
    }

    return points;
  }

  private _getControlPoints(): { cp1: Point; cp2: Point } {
    const { source, target } = this._endpoints;
    const dx = target.x - source.x;
    const dy = target.y - source.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Control point offset based on distance
    const offset = Math.min(distance * 0.4, 100);

    // Horizontal bezier
    return {
      cp1: { x: source.x + offset, y: source.y },
      cp2: { x: target.x - offset, y: target.y },
    };
  }

  private _bezierPoint(
    t: number,
    p0: Point,
    p1: Point,
    p2: Point,
    p3: Point,
  ): Point {
    const t2 = t * t;
    const t3 = t2 * t;
    const mt = 1 - t;
    const mt2 = mt * mt;
    const mt3 = mt2 * mt;

    return {
      x: mt3 * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t3 * p3.x,
      y: mt3 * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t3 * p3.y,
    };
  }

  private _bezierTangent(
    t: number,
    p0: Point,
    p1: Point,
    p2: Point,
    p3: Point,
  ): { dx: number; dy: number } {
    const mt = 1 - t;
    const mt2 = mt * mt;
    const t2 = t * t;

    const dx =
      3 * mt2 * (p1.x - p0.x) +
      6 * mt * t * (p2.x - p1.x) +
      3 * t2 * (p3.x - p2.x);
    const dy =
      3 * mt2 * (p1.y - p0.y) +
      6 * mt * t * (p2.y - p1.y) +
      3 * t2 * (p3.y - p2.y);

    return { dx, dy };
  }

  /**
   * Get adjusted endpoints accounting for arrow offsets and gap
   */
  private _getAdjustedEndpoints(): { source: Point; target: Point } {
    const style = this.getComputedStyle();
    const { source, target } = this._endpoints;
    const { cp1, cp2 } = this._getControlPoints();

    // Get arrow lengths and gap offsets
    const sourceArrowLength = this._getArrowOffset(normalizeArrowConfig(style.sourceArrow));
    const targetArrowLength = this._getArrowOffset(normalizeArrowConfig(style.targetArrow));
    const sourceOffset = this._getSourceOffset();
    const targetOffset = this._getTargetOffset();

    // Total offset from original endpoint = gap + arrow length
    const totalSourceOffset = sourceOffset + sourceArrowLength;
    const totalTargetOffset = targetOffset + targetArrowLength;

    // Adjust source point along the curve tangent
    let adjustedSource = source;
    if (totalSourceOffset > 0) {
      const tangent = this._bezierTangent(0, source, cp1, cp2, target);
      const len = Math.sqrt(tangent.dx * tangent.dx + tangent.dy * tangent.dy);
      if (len > 0) {
        adjustedSource = {
          x: source.x + (tangent.dx / len) * totalSourceOffset,
          y: source.y + (tangent.dy / len) * totalSourceOffset,
        };
      }
    }

    // Adjust target point along the curve tangent
    let adjustedTarget = target;
    if (totalTargetOffset > 0) {
      const tangent = this._bezierTangent(1, source, cp1, cp2, target);
      const len = Math.sqrt(tangent.dx * tangent.dx + tangent.dy * tangent.dy);
      if (len > 0) {
        adjustedTarget = {
          x: target.x - (tangent.dx / len) * totalTargetOffset,
          y: target.y - (tangent.dy / len) * totalTargetOffset,
        };
      }
    }

    return { source: adjustedSource, target: adjustedTarget };
  }

  draw(): void {
    const style = this.getComputedStyle();
    const adjusted = this._getAdjustedEndpoints();
    const { cp1, cp2 } = this._getControlPoints();

    // Store control points for label positioning
    this._controlPoints = [cp1, cp2];

    this._graphics.clear();

    // Draw bezier curve with adjusted endpoints
    this._graphics.moveTo(adjusted.source.x, adjusted.source.y);
    this._graphics.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, adjusted.target.x, adjusted.target.y);
    this._graphics.stroke({
      color: style.stroke ?? '#999999',
      width: style.strokeWidth ?? 2,
      alpha: style.strokeOpacity ?? 1,
    });

    // Apply container opacity
    this._container.alpha = style.opacity ?? 1;

    // Draw arrows
    const path = this._calculatePath();
    this._drawArrows([adjusted.source, ...path.slice(1, -1), adjusted.target]);

    // Draw label
    this._drawLabel();
  }
}
