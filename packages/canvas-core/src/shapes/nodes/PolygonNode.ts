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
        fill: '#000000',
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
