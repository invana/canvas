/**
 * StarNode
 * 
 * A star-shaped node with configurable number of points.
 */

import type { ShapeStyle } from '../../primitives/shapes';
import { getStarIntersection } from '../../primitives/shapes/star';
import { RendererNodeBase, type NodeShapeOptions, type Point, type Bounds, type NodeShapeType, type BadgePosition } from './RendererNodeBase';

/**
 * Options specific to star nodes
 */
export interface StarNodeOptions extends NodeShapeOptions {
  /** Number of points on the star (default: 5) */
  points?: number;
  /** Inner radius ratio (default: 0.5) */
  innerRadiusRatio?: number;
}

export class StarNode extends RendererNodeBase {
  protected _starPoints: number;
  protected _innerRadiusRatio: number;

  constructor(options: StarNodeOptions) {
    super(options);
    this._starPoints = options.points ?? 5;
    this._innerRadiusRatio = options.innerRadiusRatio ?? 0.5;
  }

  get shapeType(): NodeShapeType {
    return 'star';
  }

  protected render(): void {
    const style = this.getActiveStyle();
    const radius = this._data.size ?? 30;

    // Draw halo first (underneath main shape)
    this.drawHalo(style);

    // Draw star using registry
    const drawer = this._registry.getShape('star');
    
    if (!drawer) {
      console.error('[StarNode.render] No drawer found for shape: star');
      return;
    }
    
    drawer(this._graphics, { 
      x: 0, 
      y: 0, 
      radius,
      points: this._starPoints,
      innerRadiusRatio: this._innerRadiusRatio,
      rotation: -Math.PI / 2, // Point up by default
    }, style);
  }

  protected drawHalo(style: ShapeStyle): void {
    if (!style.halo) return;

    const radius = this._data.size ?? 30;
    const haloWidth = style.haloStrokeWidth ?? 3;
    const haloColor = this.getHaloColor(style);
    const haloOpacity = style.haloStrokeOpacity ?? 0.25;

    const haloRadius = radius + haloWidth;
    const innerRadius = haloRadius * this._innerRadiusRatio;
    
    // Generate star points with larger radius for halo
    const points: number[] = [];
    const angleStep = Math.PI / this._starPoints;
    for (let i = 0; i < this._starPoints * 2; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const r = i % 2 === 0 ? haloRadius : innerRadius;
      points.push(Math.cos(angle) * r);
      points.push(Math.sin(angle) * r);
    }
    
    // Draw halo as stroke-only outline
    this._graphics.poly(points);
    this._graphics.fill({ color: 0x000000, alpha: 0 }); // Transparent fill to complete the path
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
    const radius = this._data.size ?? 30;
    
    const angle = Math.atan2(targetPoint.y - nodeY, targetPoint.x - nodeX);
    
    return getStarIntersection(
      { x: nodeX, y: nodeY, radius, points: this._starPoints, innerRadiusRatio: this._innerRadiusRatio },
      angle,
      offset
    );
  }

  protected getShapeBounds(): Bounds {
    const radius = this._data.size ?? 30;
    const diameter = radius * 2;
    return {
      x: -radius,
      y: -radius,
      width: diameter,
      height: diameter,
    };
  }

  protected getBadgeOffset(position: BadgePosition, badgeRadius: number): { x: number; y: number } {
    const radius = this._data.size ?? 30;
    const offset = badgeRadius * 0.5;
    const distance = radius + badgeRadius - offset;

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
    return {
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
    };
  }
}
