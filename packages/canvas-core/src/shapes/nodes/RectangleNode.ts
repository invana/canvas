/**
 * Rectangle Node Shape
 */

import type { NodeStyle } from '../../types/index.js';
import { BaseNodeShape } from './BaseNodeShape.js';

export class RectangleNode extends BaseNodeShape {
  protected _getDefaultStyle(): NodeStyle {
    return {
      shape: 'rectangle',
      width: 80,
      height: 40,
      fill: '#2196F3',
      fillOpacity: 1,
      stroke: '#1565C0',
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
    const width = style.width ?? 80;
    const height = style.height ?? 40;

    this._graphics.clear();

    // Fill
    if (style.fill) {
      this._graphics.rect(-width / 2, -height / 2, width, height);
      this._graphics.fill({
        color: style.fill,
        alpha: style.fillOpacity ?? 1,
      });
    }

    // Stroke
    if (style.stroke && (style.strokeWidth ?? 0) > 0) {
      this._graphics.rect(-width / 2, -height / 2, width, height);
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
    const width = style.width ?? 80;
    const height = style.height ?? 40;
    const dx = x - this._container.x;
    const dy = y - this._container.y;
    return (
      dx >= -width / 2 &&
      dx <= width / 2 &&
      dy >= -height / 2 &&
      dy <= height / 2
    );
  }
}
