/**
 * EllipseNode
 * 
 * An elliptical node shape.
 */

import { NodeShapeBase, type Point, type Bounds, type NodeShapeType, type BadgePosition } from './NodeShapeBase';

export class EllipseNode extends NodeShapeBase {
  
  get shapeType(): NodeShapeType {
    return 'ellipse';
  }

  protected render(): void {
    const style = this.getActiveStyle();
    const size = this._data.size ?? 30;
    const radiusX = (this._data.width ?? size * 2) / 2;
    const radiusY = (this._data.height ?? size) / 2;

    // Draw halo first (underneath main shape)
    this.drawHalo(style, { type: 'ellipse', radiusX, radiusY });

    // Draw ellipse using registry
    const drawer = this._registry.getShape('ellipse');
    if (drawer) {
      drawer(this._graphics, { x: 0, y: 0, radiusX, radiusY }, style);
    }
  }

  getBoundaryPoint(targetPoint: Point, offset: number = 0): Point {
    const nodeX = this.x;
    const nodeY = this.y;
    const size = this._data.size ?? 30;
    const radiusX = (this._data.width ?? size * 2) / 2 + offset;
    const radiusY = (this._data.height ?? size) / 2 + offset;
    
    const angle = Math.atan2(targetPoint.y - nodeY, targetPoint.x - nodeX);
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    
    // Parametric ellipse intersection
    const denominator = Math.sqrt((radiusY * cos) ** 2 + (radiusX * sin) ** 2);
    const r = (radiusX * radiusY) / denominator;
    
    return {
      x: nodeX + cos * r,
      y: nodeY + sin * r,
    };
  }

  protected getShapeBounds(): Bounds {
    const size = this._data.size ?? 30;
    const width = this._data.width ?? size * 2;
    const height = this._data.height ?? size;
    return {
      x: -width / 2,
      y: -height / 2,
      width,
      height,
    };
  }

  protected getBadgeOffset(position: BadgePosition, badgeRadius: number): { x: number; y: number } {
    const size = this._data.size ?? 30;
    const radiusX = (this._data.width ?? size * 2) / 2;
    const radiusY = (this._data.height ?? size) / 2;
    const offset = badgeRadius * 0.5;

    // Map positions to angles
    const angles: Record<BadgePosition, number> = {
      'right': 0,
      'bottom-right': Math.PI / 4,
      'bottom': Math.PI / 2,
      'bottom-left': (3 * Math.PI) / 4,
      'left': Math.PI,
      'top-left': (5 * Math.PI) / 4,
      'top': (3 * Math.PI) / 2,
      'top-right': (7 * Math.PI) / 4,
    };

    const angle = angles[position];
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    
    // Calculate point on ellipse boundary
    const denominator = Math.sqrt((radiusY * cos) ** 2 + (radiusX * sin) ** 2);
    const r = (radiusX * radiusY) / denominator;
    
    // Add badge radius offset
    const distance = r + badgeRadius - offset;
    return {
      x: cos * distance,
      y: sin * distance,
    };
  }
}
