/**
 * Straight Edge Shape
 */

import { Graphics } from 'pixi.js';
import type { EdgeStyle, Point } from '../../types/index.js';
import { BaseEdgeShape } from './BaseEdgeShape.js';

export class StraightEdge extends BaseEdgeShape {
  protected _getDefaultStyle(): EdgeStyle {
    return {
      type: 'straight',
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
    return [this._endpoints.source, this._endpoints.target];
  }

  draw(): void {
    const style = this.getComputedStyle();
    const { source, target } = this._endpoints;

    this._graphics.clear();

    // Draw line
    this._graphics.moveTo(source.x, source.y);
    this._graphics.lineTo(target.x, target.y);
    this._graphics.stroke({
      color: style.stroke ?? '#999999',
      width: style.strokeWidth ?? 2,
      alpha: style.strokeOpacity ?? 1,
    });

    // Apply container opacity
    this._container.alpha = style.opacity ?? 1;

    // Draw arrow heads
    const angle = Math.atan2(target.y - source.y, target.x - source.x);

    if (style.sourceArrow && style.sourceArrow.type !== 'none') {
      if (!this._sourceArrow) {
        this._sourceArrow = new Graphics();
        this._container.addChild(this._sourceArrow);
      }
      this._drawArrowHead(
        this._sourceArrow,
        source,
        angle + Math.PI,
        style.sourceArrow,
      );
    }

    if (style.targetArrow && style.targetArrow.type !== 'none') {
      if (!this._targetArrow) {
        this._targetArrow = new Graphics();
        this._container.addChild(this._targetArrow);
      }
      this._drawArrowHead(this._targetArrow, target, angle, style.targetArrow);
    }

    // Draw label
    this._drawLabel();
  }
}
