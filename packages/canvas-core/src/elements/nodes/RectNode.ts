/**
 * RectNode
 * 
 * A rectangular node shape.
 */

import { getRectIntersection } from '../../primitives/shapes/rect';
import { NodeShapeBase, type Point, type Bounds, type NodeShapeType, type BadgePosition } from './NodeShapeBase';

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

  protected getBadgeOffset(position: BadgePosition, badgeRadius: number): { x: number; y: number } {
    const size = this._data.size ?? 30;
    const width = this._data.width ?? size * 2;
    const height = this._data.height ?? size * 2;
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    const offset = badgeRadius * 0.6; // Slight overlap for better visual alignment

    const offsets: Record<BadgePosition, { x: number; y: number }> = {
      'top': { x: 0, y: -(halfHeight + badgeRadius - offset) },
      'top-right': { x: halfWidth + badgeRadius - offset, y: -(halfHeight + badgeRadius - offset) },
      'right': { x: halfWidth + badgeRadius - offset, y: 0 },
      'bottom-right': { x: halfWidth + badgeRadius - offset, y: halfHeight + badgeRadius - offset },
      'bottom': { x: 0, y: halfHeight + badgeRadius - offset },
      'bottom-left': { x: -(halfWidth + badgeRadius - offset), y: halfHeight + badgeRadius - offset },
      'left': { x: -(halfWidth + badgeRadius - offset), y: 0 },
      'top-left': { x: -(halfWidth + badgeRadius - offset), y: -(halfHeight + badgeRadius - offset) },
    };

    return offsets[position];
  }
}
