/**
 * Polygon Node Shape - Triangle, Pentagon, Hexagon, etc.
 */

import type { NodeShapeType, NodeStyle } from '../../types/index.js';
import { BaseNodeShape, type NodeShapeConfig } from './BaseNodeShape.js';

const SHAPE_SIDES: Record<string, number> = {
  triangle: 3,
  square: 4,
  diamond: 4,
  pentagon: 5,
  hexagon: 6,
  octagon: 8,
};

export class PolygonNode extends BaseNodeShape {
  private _sides: number;
  private _rotationOffset: number;

  constructor(config: NodeShapeConfig) {
    super(config);
    const shape = config.data.style?.shape ?? 'hexagon';
    this._sides = config.data.style?.sides ?? SHAPE_SIDES[shape] ?? 6;
    
    // Diamond rotates 45 degrees
    this._rotationOffset = shape === 'diamond' ? Math.PI / 4 : 0;
    // Triangle points up
    if (shape === 'triangle') {
      this._rotationOffset = -Math.PI / 2;
    }
  }

  protected _getDefaultStyle(): NodeStyle {
    return {
      shape: 'hexagon',
      size: 40,
      sides: this._sides,
      fill: '#9C27B0',
      fillOpacity: 1,
      stroke: '#6A1B9A',
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
    const radius = (style.size ?? 40) / 2;
    const sides = style.sides ?? this._sides;

    this._graphics.clear();

    // Calculate polygon points
    const points = this._getPolygonPoints(radius, sides);

    // Fill
    if (style.fill) {
      this._graphics.poly(points);
      this._graphics.fill({
        color: style.fill,
        alpha: style.fillOpacity ?? 1,
      });
    }

    // Stroke
    if (style.stroke && (style.strokeWidth ?? 0) > 0) {
      this._graphics.poly(points);
      this._graphics.stroke({
        color: style.stroke,
        width: style.strokeWidth ?? 2,
        alpha: style.strokeOpacity ?? 1,
      });
    }

    // Apply container transforms
    this._container.alpha = style.opacity ?? 1;
    this._container.scale.set(style.scale ?? 1);
    this._container.rotation = (style.rotation ?? 0) + this._rotationOffset;

    // Draw label
    this._drawLabel();
  }

  private _getPolygonPoints(radius: number, sides: number): number[] {
    const points: number[] = [];
    const angleStep = (Math.PI * 2) / sides;

    for (let i = 0; i < sides; i++) {
      const angle = i * angleStep - Math.PI / 2; // Start from top
      points.push(Math.cos(angle) * radius, Math.sin(angle) * radius);
    }

    return points;
  }

  hitTest(x: number, y: number): boolean {
    // Simplified: use bounding circle
    const style = this.getComputedStyle();
    const radius = (style.size ?? 40) / 2;
    const dx = x - this._container.x;
    const dy = y - this._container.y;
    return dx * dx + dy * dy <= radius * radius;
  }

  getIntersectionPoint(angle: number, offset: number = 0): { x: number; y: number } {
    const style = this.getComputedStyle();
    const radius = (style.size ?? 40) / 2 + offset;
    const sides = style.sides ?? this._sides;

    // Adjust angle for shape rotation
    const totalRotation = (style.rotation ?? 0) + this._rotationOffset;
    const adjustedAngle = angle - totalRotation;

    // Normalize angle to [0, 2π)
    let normAngle = adjustedAngle % (Math.PI * 2);
    if (normAngle < 0) normAngle += Math.PI * 2;

    // Calculate which segment the angle falls into
    const angleStep = (Math.PI * 2) / sides;
    const startAngle = -Math.PI / 2; // Start from top

    // Find intersection with polygon edge
    for (let i = 0; i < sides; i++) {
      const a1 = startAngle + i * angleStep;
      const a2 = startAngle + (i + 1) * angleStep;

      // Get the two vertices of this edge
      const p1x = Math.cos(a1) * radius;
      const p1y = Math.sin(a1) * radius;
      const p2x = Math.cos(a2) * radius;
      const p2y = Math.sin(a2) * radius;

      // Check if the ray intersects this edge
      // Ray from origin at `adjustedAngle`
      const rayDx = Math.cos(adjustedAngle);
      const rayDy = Math.sin(adjustedAngle);

      // Edge direction
      const edgeDx = p2x - p1x;
      const edgeDy = p2y - p1y;

      // Calculate intersection using parametric form
      const denom = rayDx * edgeDy - rayDy * edgeDx;
      if (Math.abs(denom) < 0.0001) continue; // Parallel

      const t1 = (p1x * edgeDy - p1y * edgeDx) / denom;
      const t2 = (p1x * rayDy - p1y * rayDx) / denom;

      if (t1 > 0 && t2 >= 0 && t2 <= 1) {
        // Found intersection
        const localX = rayDx * t1;
        const localY = rayDy * t1;

        // Rotate back and translate to world coordinates
        const cos = Math.cos(totalRotation);
        const sin = Math.sin(totalRotation);
        return {
          x: this._container.x + localX * cos - localY * sin,
          y: this._container.y + localX * sin + localY * cos,
        };
      }
    }

    // Fallback: use circle approximation
    return {
      x: this._container.x + Math.cos(angle) * radius,
      y: this._container.y + Math.sin(angle) * radius,
    };
  }

  // Factory methods for specific shapes
  static triangle(config: NodeShapeConfig): PolygonNode {
    return new PolygonNode({
      ...config,
      data: {
        ...config.data,
        style: { ...config.data.style, shape: 'triangle' as NodeShapeType, sides: 3 },
      },
    });
  }

  static diamond(config: NodeShapeConfig): PolygonNode {
    return new PolygonNode({
      ...config,
      data: {
        ...config.data,
        style: { ...config.data.style, shape: 'diamond' as NodeShapeType, sides: 4 },
      },
    });
  }

  static pentagon(config: NodeShapeConfig): PolygonNode {
    return new PolygonNode({
      ...config,
      data: {
        ...config.data,
        style: { ...config.data.style, shape: 'pentagon' as NodeShapeType, sides: 5 },
      },
    });
  }

  static hexagon(config: NodeShapeConfig): PolygonNode {
    return new PolygonNode({
      ...config,
      data: {
        ...config.data,
        style: { ...config.data.style, shape: 'hexagon' as NodeShapeType, sides: 6 },
      },
    });
  }

  static octagon(config: NodeShapeConfig): PolygonNode {
    return new PolygonNode({
      ...config,
      data: {
        ...config.data,
        style: { ...config.data.style, shape: 'octagon' as NodeShapeType, sides: 8 },
      },
    });
  }
}
