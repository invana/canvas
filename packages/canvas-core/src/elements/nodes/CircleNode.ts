/**
 * CircleNode
 * 
 * A circular node shape.
 */

import { NodeShapeBase, type Point, type Bounds, type NodeShapeType, type BadgePosition } from './NodeShapeBase';

export class CircleNode extends NodeShapeBase {
  
  get shapeType(): NodeShapeType {
    return 'circle';
  }

  protected render(): void {
    const style = this.getActiveStyle();
    const radius = this._data.size ?? 30;

    // Draw circle using registry
    const drawer = this._registry.getShape('circle');
    if (drawer) {
      drawer(this._graphics, { x: 0, y: 0, radius }, style);
    }
  }

  getBoundaryPoint(targetPoint: Point, offset: number = 0): Point {
    const nodeX = this.x;
    const nodeY = this.y;
    const radius = (this._data.size ?? 30) + offset;
    
    const angle = Math.atan2(targetPoint.y - nodeY, targetPoint.x - nodeX);
    
    return {
      x: nodeX + Math.cos(angle) * radius,
      y: nodeY + Math.sin(angle) * radius,
    };
  }

  protected getShapeBounds(): Bounds {
    const size = this._data.size ?? 30;
    const diameter = size * 2;
    return {
      x: -size,
      y: -size,
      width: diameter,
      height: diameter,
    };
  }

  protected getBadgeOffset(position: BadgePosition, badgeRadius: number): { x: number; y: number } {
    const radius = this._data.size ?? 30;
    const distance = radius + badgeRadius * 0.5; // Position badge just outside circle edge

    // Map positions to angles (0° = right, 90° = bottom, etc.)
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
    return {
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
    };
  }
}
