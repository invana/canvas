/**
 * RectNode
 * 
 * A rectangular node shape.
 */

import type { ShapeStyle } from '../../primitives/shapes';
import { getRectIntersection } from '../../primitives/shapes/rect';
import { RendererNodeBase, type Point, type Bounds, type NodeShapeType, type BadgePosition } from './RendererNodeBase';

export class RectNode extends RendererNodeBase {
  
  get shapeType(): NodeShapeType {
    return 'rect';
  }

  protected render(): void {
    const style = this.getActiveStyle();
    const size = this._data.size ?? 30;
    const width = this._data.width ?? size * 2;
    const height = this._data.height ?? size * 2;
    const cornerRadius = this._data.cornerRadius ?? 0;

    // Draw halo first (underneath main shape)
    this.drawHalo(style);

    // Draw rectangle using registry (supports rounded corners via cornerRadius)
    const drawer = this._registry.getShape('rect');
    if (drawer) {
      drawer(this._graphics, { x: 0, y: 0, width, height, cornerRadius, centered: true }, style);
    }
  }

  protected drawHalo(style: ShapeStyle): void {
    if (!style.halo) return;

    const size = this._data.size ?? 30;
    const width = this._data.width ?? size * 2;
    const height = this._data.height ?? size * 2;
    const cornerRadius = this._data.cornerRadius ?? 0;
    const haloWidth = style.haloStrokeWidth ?? 3;
    const haloColor = this.getHaloColor(style);
    const haloOpacity = style.haloStrokeOpacity ?? 0.25;

    if (cornerRadius > 0) {
      this._graphics.roundRect(
        -width / 2 - haloWidth,
        -height / 2 - haloWidth,
        width + haloWidth * 2,
        height + haloWidth * 2,
        cornerRadius + haloWidth
      );
    } else {
      this._graphics.rect(
        -width / 2 - haloWidth,
        -height / 2 - haloWidth,
        width + haloWidth * 2,
        height + haloWidth * 2
      );
    }
    this._graphics.stroke({
      color: haloColor,
      width: haloWidth * 2,
      alpha: haloOpacity,
      alignment: 1,
    });
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
