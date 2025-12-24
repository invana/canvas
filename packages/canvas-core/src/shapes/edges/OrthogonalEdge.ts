/**
 * Orthogonal Edge Shape - Right-angle paths
 */

import { Graphics } from 'pixi.js';
import type { EdgeStyle, Point } from '../../types/index.js';
import { BaseEdgeShape } from './BaseEdgeShape.js';

export class OrthogonalEdge extends BaseEdgeShape {
  protected _getDefaultStyle(): EdgeStyle {
    return {
      type: 'orthogonal',
      stroke: '#999999',
      strokeWidth: 2,
      strokeOpacity: 1,
      opacity: 1,
      targetArrow: {
        type: 'triangleFilled',
        size: 10,
      },
      label: {
        visible: false,
        fontSize: 10,
        fill: '#666666',
      },
    };
  }

  protected _calculatePath(): Point[] {
    const { source, target } = this._endpoints;
    const midX = (source.x + target.x) / 2;

    // Create orthogonal path with horizontal-vertical-horizontal segments
    return [
      source,
      { x: midX, y: source.y },
      { x: midX, y: target.y },
      target,
    ];
  }

  draw(): void {
    const style = this.getComputedStyle();
    const path = this._calculatePath();

    this._graphics.clear();

    // Draw orthogonal path
    if (path.length > 0) {
      this._graphics.moveTo(path[0]!.x, path[0]!.y);
      for (let i = 1; i < path.length; i++) {
        this._graphics.lineTo(path[i]!.x, path[i]!.y);
      }
    }

    this._graphics.stroke({
      color: style.stroke ?? '#999999',
      width: style.strokeWidth ?? 2,
      alpha: style.strokeOpacity ?? 1,
    });

    // Apply container opacity
    this._container.alpha = style.opacity ?? 1;

    // Draw arrow heads
    if (style.sourceArrow && style.sourceArrow.type !== 'none') {
      if (!this._sourceArrow) {
        this._sourceArrow = new Graphics();
        this._container.addChild(this._sourceArrow);
      }
      // Arrow points back towards the first path segment direction
      const p0 = path[0]!;
      const p1 = path[1]!;
      const angle = Math.atan2(p1.y - p0.y, p1.x - p0.x) + Math.PI;
      this._drawArrowHead(this._sourceArrow, p0, angle, style.sourceArrow);
    }

    if (style.targetArrow && style.targetArrow.type !== 'none') {
      if (!this._targetArrow) {
        this._targetArrow = new Graphics();
        this._container.addChild(this._targetArrow);
      }
      // Arrow points in direction of last path segment
      const pn = path[path.length - 1]!;
      const pn1 = path[path.length - 2]!;
      const angle = Math.atan2(pn.y - pn1.y, pn.x - pn1.x);
      this._drawArrowHead(this._targetArrow, pn, angle, style.targetArrow);
    }

    // Draw label
    this._drawLabel();
  }
}
