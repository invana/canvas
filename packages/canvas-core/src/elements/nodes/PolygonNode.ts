/**
 * PolygonNode
 * 
 * A regular polygon node shape with configurable number of sides.
 * Serves as base for triangle, diamond, pentagon, hexagon, octagon, etc.
 */

import { getPolygonIntersection } from '../../primitives/shapes/polygon';
import { NodeShapeBase, type NodeShapeOptions, type Point, type Bounds, type NodeShapeType, type BadgePosition } from './NodeShapeBase';

/**
 * Options specific to polygon nodes
 */
export interface PolygonNodeOptions extends NodeShapeOptions {
  /** Number of sides (3 = triangle, 4 = diamond, 5 = pentagon, etc.) */
  sides?: number;
  /** Rotation offset in radians (0 = first vertex points right) */
  rotation?: number;
}

export class PolygonNode extends NodeShapeBase {
  protected _polygonSides: number;
  protected _polygonRotation: number;

  constructor(options: PolygonNodeOptions) {
    super(options);
    this._polygonSides = options.sides ?? 6; // Default to hexagon
    this._polygonRotation = options.rotation ?? -Math.PI / 2; // Default: first vertex points up
  }

  get shapeType(): NodeShapeType {
    return this.getPolygonShapeName();
  }

  /**
   * Get the shape name based on number of sides
   */
  protected getPolygonShapeName(): NodeShapeType {
    switch (this._polygonSides) {
      case 3: return 'triangle';
      case 4: return 'diamond';
      case 5: return 'pentagon';
      case 6: return 'hexagon';
      case 8: return 'octagon';
      default: return 'polygon';
    }
  }

  /**
   * Get the registry shape name for rendering
   */
  protected getRegistryShapeName(): string {
    switch (this._polygonSides) {
      case 3: return 'triangle';
      case 4: return 'diamond';
      case 5: return 'pentagon';
      case 6: return 'hexagon';
      case 8: return 'octagon';
      default: return 'polygon';
    }
  }

  protected render(): void {
    const style = this.getActiveStyle();
    const radius = this._data.size ?? 30;

    // Draw polygon using registry
    const shapeName = this.getRegistryShapeName();
    const drawer = this._registry.getShape(shapeName);
    
    if (!drawer) {
      console.error('[PolygonNode.render] No drawer found for shape:', shapeName);
      return;
    }
    
    drawer(this._graphics, { 
      x: 0, 
      y: 0, 
      radius, 
      sides: this._polygonSides,
      rotation: this._polygonRotation 
    }, style);
  }

  getBoundaryPoint(targetPoint: Point, offset: number = 0): Point {
    const nodeX = this.x;
    const nodeY = this.y;
    const radius = this._data.size ?? 30;
    
    const angle = Math.atan2(targetPoint.y - nodeY, targetPoint.x - nodeX);
    
    return getPolygonIntersection(
      { x: nodeX, y: nodeY, radius, sides: this._polygonSides, rotation: this._polygonRotation },
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
    const offset = badgeRadius * 0.5; // Good overlap for polygons
    const distance = radius + badgeRadius - offset;

    // Map positions to angles, accounting for polygon rotation
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

    const angle = angles[position] + this._polygonRotation;
    return {
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
    };
  }
}

// ============================================================================
// Convenience classes for specific polygons
// ============================================================================

/**
 * Triangle node (3-sided polygon)
 */
export class TriangleNode extends PolygonNode {
  constructor(options: NodeShapeOptions) {
    super({ ...options, sides: 3, rotation: -Math.PI / 2 });
  }

  get shapeType(): NodeShapeType {
    return 'triangle';
  }
}

/**
 * Diamond node (4-sided polygon rotated 45°)
 */
export class DiamondNode extends PolygonNode {
  constructor(options: NodeShapeOptions) {
    super({ ...options, sides: 4, rotation: 0 }); // First vertex points right, rotates to diamond
  }

  get shapeType(): NodeShapeType {
    return 'diamond';
  }
}

/**
 * Pentagon node (5-sided polygon)
 */
export class PentagonNode extends PolygonNode {
  constructor(options: NodeShapeOptions) {
    super({ ...options, sides: 5, rotation: -Math.PI / 2 });
  }

  get shapeType(): NodeShapeType {
    return 'pentagon';
  }
}

/**
 * Hexagon node (6-sided polygon)
 */
export class HexagonNode extends PolygonNode {
  constructor(options: NodeShapeOptions) {
    super({ ...options, sides: 6, rotation: 0 });
  }

  get shapeType(): NodeShapeType {
    return 'hexagon';
  }
}

/**
 * Octagon node (8-sided polygon)
 */
export class OctagonNode extends PolygonNode {
  constructor(options: NodeShapeOptions) {
    super({ ...options, sides: 8, rotation: Math.PI / 8 });
  }

  get shapeType(): NodeShapeType {
    return 'octagon';
  }
}
