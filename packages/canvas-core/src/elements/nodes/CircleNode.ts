/**
 * CircleNode
 * 
 * A circular node shape.
 */

import { NodeShapeBase, type Point, type Bounds, type NodeShapeType } from './NodeShapeBase';

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
}
