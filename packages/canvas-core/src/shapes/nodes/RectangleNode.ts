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

  getIntersectionPoint(angle: number, offset: number = 0): { x: number; y: number } {
    const style = this.getComputedStyle();
    const halfWidth = (style.width ?? 80) / 2 + offset;
    const halfHeight = (style.height ?? 40) / 2 + offset;

    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    // Handle degenerate cases
    if (Math.abs(cos) < 0.0001) {
      // Vertical (top or bottom)
      return {
        x: this._container.x,
        y: this._container.y + (sin > 0 ? halfHeight : -halfHeight),
      };
    }
    if (Math.abs(sin) < 0.0001) {
      // Horizontal (left or right)
      return {
        x: this._container.x + (cos > 0 ? halfWidth : -halfWidth),
        y: this._container.y,
      };
    }

    // Calculate intersection with rectangle boundary
    // Check which edge the ray intersects first
    const tx = halfWidth / Math.abs(cos); // Time to reach vertical edge
    const ty = halfHeight / Math.abs(sin); // Time to reach horizontal edge

    const t = Math.min(tx, ty);

    return {
      x: this._container.x + cos * t,
      y: this._container.y + sin * t,
    };
  }
}
