/**
 * HTMLNode
 * 
 * A node shape that can render HTML/DOM content within the canvas.
 * Uses PixiJS HTMLText or ForeignObject to embed HTML.
 */

import { NodeShapeBase, type Point, type Bounds, type NodeShapeType, type BadgePosition } from './NodeShapeBase';
import { HTMLText } from 'pixi.js';
import { getRectIntersection } from '../../primitives/shapes/rect';

export class HTMLNode extends NodeShapeBase {
  private _htmlText?: HTMLText;
  private _htmlContent: string = '';

  get shapeType(): NodeShapeType {
    return 'htmlNode';
  }

  protected render(): void {
    const style = this.getActiveStyle();
    const size = this._data.size ?? 30;
    const width = this._data.width ?? size * 4;
    const height = this._data.height ?? size * 2;
    
    // Get HTML content from data payload
    this._htmlContent = (this._data.payload?.html as string) ?? '<div>HTML Node</div>';

    // Clear existing graphics
    this._graphics.clear();

    // Draw a background rectangle with optional rounded corners
    const cornerRadius = this._data.cornerRadius ?? 8;
    const halfWidth = width / 2;
    const halfHeight = height / 2;

    if (style.fill) {
      if (cornerRadius > 0) {
        this._graphics.roundRect(-halfWidth, -halfHeight, width, height, cornerRadius);
      } else {
        this._graphics.rect(-halfWidth, -halfHeight, width, height);
      }
      this._graphics.fill(style.fill);
    }

    if (style.stroke && (style.strokeWidth ?? 0) > 0) {
      if (cornerRadius > 0) {
        this._graphics.roundRect(-halfWidth, -halfHeight, width, height, cornerRadius);
      } else {
        this._graphics.rect(-halfWidth, -halfHeight, width, height);
      }
      this._graphics.stroke({
        color: style.stroke,
        width: style.strokeWidth ?? 1,
        alpha: style.strokeAlpha ?? 1,
      });
    }

    // Create or update HTMLText
    if (!this._htmlText) {
      this._htmlText = new HTMLText({
        text: this._htmlContent,
        style: {
          fontSize: 14,
          fill: '#000000',
          fontFamily: 'Arial, sans-serif',
        },
      });
      this._htmlText.anchor.set(0.5);
      this.addChild(this._htmlText);
    } else {
      this._htmlText.text = this._htmlContent;
    }

    // Position HTMLText
    this._htmlText.x = 0;
    this._htmlText.y = 0;

    // Scale HTMLText to fit within bounds if needed
    const textWidth = this._htmlText.width;
    const textHeight = this._htmlText.height;
    const padding = 10;
    const maxWidth = width - padding * 2;
    const maxHeight = height - padding * 2;

    if (textWidth > maxWidth || textHeight > maxHeight) {
      const scaleX = maxWidth / textWidth;
      const scaleY = maxHeight / textHeight;
      const scale = Math.min(scaleX, scaleY);
      this._htmlText.scale.set(scale);
    }
  }

  getBoundaryPoint(targetPoint: Point, offset: number = 0): Point {
    const nodeX = this.x;
    const nodeY = this.y;
    const size = this._data.size ?? 30;
    const width = this._data.width ?? size * 4;
    const height = this._data.height ?? size * 2;
    
    const angle = Math.atan2(targetPoint.y - nodeY, targetPoint.x - nodeX);
    
    // Use rect intersection calculation
    return getRectIntersection(
      { x: nodeX, y: nodeY, width, height },
      angle,
      offset
    );
  }

  protected getShapeBounds(): Bounds {
    const size = this._data.size ?? 30;
    const width = this._data.width ?? size * 4;
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
    const width = this._data.width ?? size * 4;
    const height = this._data.height ?? size * 2;
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    const offset = badgeRadius * 0.6;

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

  destroy(): void {
    if (this._htmlText) {
      this._htmlText.destroy();
      this._htmlText = undefined;
    }
    super.destroy();
  }
}
