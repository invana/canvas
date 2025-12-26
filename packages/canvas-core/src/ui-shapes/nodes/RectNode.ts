/**
 * RectNode
 * 
 * A rectangular node shape.
 */

import { getRectIntersection } from '../../primitives/shapes/rect';
import { NodeShapeBase, type Point, type Bounds, type NodeShapeType } from './NodeShapeBase';

export class RectNode extends NodeShapeBase {
  
  get shapeType(): NodeShapeType {
    return 'rect';
  }

  protected render(): void {
    const style = this.getActiveStyle();
    const size = this._data.size ?? 30;
    const width = this._data.width ?? size * 2;
    const height = this._data.height ?? size * 2;

    // Draw rectangle using registry
    const drawer = this._registry.getShape('rect');
    if (drawer) {
      drawer(this._graphics, { x: 0, y: 0, width, height, centered: true }, style);
    }
  }

  getBoundaryPoint(targetPoint: Point, offset: number = 0): Point {
    const nodeX = this.x;
    const nodeY = this.y;
    const size = this._data.size ?? 30;
    const width = this._data.width ?? size * 2;
    const height = this._data.height ?? size * 2;
    
    const angle = Math.atan2(targetPoint.y - nodeY, targetPoint.x - nodeX);
    
    return getRectIntersection(
      { x: nodeX, y: nodeY, width, height },
      angle,
      offset
    );
  }

  protected getShapeBounds(): Bounds {
    const size = this._data.size ?? 30;
    const width = this._data.width ?? size * 2;
    const height = this._data.height ?? size * 2;
    return {
      x: -width / 2,
      y: -height / 2,
      width,
      height,
    };
  }
}
