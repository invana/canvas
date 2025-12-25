/**
 * Circle Node Shape
 */

import type { NodeStyle } from '../../types/index.js';
import { BaseNodeShape } from './BaseNodeShape.js';

export class CircleNode extends BaseNodeShape {
  protected _getDefaultStyle(): NodeStyle {
    return {
      shape: 'circle',
      size: 40,
      fill: '#4CAF50',
      fillOpacity: 1,
      stroke: '#2E7D32',
      strokeWidth: 2,
      strokeOpacity: 1,
      opacity: 1,
      scale: 1,
      rotation: 0,
      label: {
        visible: false,
        fontSize: 12,
        textColor: '#000000',
        position: 'center',
      },
    };
  }

  draw(): void {
    const style = this.getComputedStyle();
    const radius = (style.size ?? 40) / 2;

    this._graphics.clear();

    // Fill
    if (style.fill) {
      this._graphics.circle(0, 0, radius);
      this._graphics.fill({
        color: style.fill,
        alpha: style.fillOpacity ?? 1,
      });
    }

    // Stroke
    if (style.stroke && (style.strokeWidth ?? 0) > 0) {
      this._graphics.circle(0, 0, radius);
      this._graphics.stroke({
        color: style.stroke,
        width: style.strokeWidth ?? 2,
        alpha: style.strokeOpacity ?? 1,
      });
    }

    // Apply container transforms
    this._container.alpha = style.opacity ?? 1;
    this._container.scale.set(style.scale ?? 1);
    this._container.rotation = style.rotation ?? 0;

    // Draw label
    this._drawLabel();
  }

  hitTest(x: number, y: number): boolean {
    const style = this.getComputedStyle();
    const radius = (style.size ?? 40) / 2;
    const dx = x - this._container.x;
    const dy = y - this._container.y;
    return dx * dx + dy * dy <= radius * radius;
  }
}
