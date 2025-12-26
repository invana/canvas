/**
 * Registry
 * 
 * Extensible registry for shapes, arrows, path types, and other customizable components.
 * Allows users to register custom implementations that integrate seamlessly with the canvas.
 * 
 * ## Design Principles
 * 
 * 1. **Type-safe**: Full TypeScript support with generics
 * 2. **Extensible**: Register new types without modifying core code
 * 3. **Default-friendly**: Provide sensible defaults that can be overridden
 * 4. **Singleton per canvas**: Each canvas instance has its own registry
 * 
 * @example
 * ```typescript
 * import { Registry } from './canvas/Registry';
 * 
 * // Create a registry with default primitives
 * const registry = new Registry();
 * 
 * // Register a custom shape
 * registry.registerShape('star', (g, params, style) => {
 *   // Draw star shape
 * });
 * 
 * // Get a registered shape drawer
 * const drawStar = registry.getShape('star');
 * drawStar(graphics, { x: 0, y: 0, size: 30 }, { fill: '#gold' });
 * ```
 */

import type { Graphics } from 'pixi.js';
import type { ShapeStyle } from '../primitives/shapes';
import type { PathStyle } from '../primitives/paths';
import type { ArrowStyle, ArrowDrawFn, ArrowParams, ArrowType } from '../primitives/arrows';

// Import default primitives
import {
  drawCircle,
  drawRect,
  drawRoundedRect,
  drawEllipse,
  drawTriangle,
  drawDiamond,
  drawPentagon,
  drawHexagon,
  drawOctagon,
} from '../primitives/shapes';

import {
  drawLine,
  drawAutoBezier,
  drawOrthogonalPath,
  drawRoundedOrthogonalPath,
} from '../primitives/paths';

import { drawArrow } from '../primitives/arrows';

// Import node shape classes
import type { NodeShapeBase, NodeShapeOptions } from '../elements/nodes/NodeShapeBase';
import { CircleNode } from '../elements/nodes/CircleNode';
import { RectNode } from '../elements/nodes/RectNode';
import { RoundedRectNode } from '../elements/nodes/RoundedRectNode';
import { EllipseNode } from '../elements/nodes/EllipseNode';
import { TriangleNode, DiamondNode, PentagonNode, HexagonNode, OctagonNode, PolygonNode } from '../elements/nodes/PolygonNode';

/**
 * Node shape class constructor type
 */
export type NodeShapeConstructor = new (options: NodeShapeOptions) => NodeShapeBase;

/**
 * Shape types that come built-in
 */
export type BuiltInShapeType =
  | 'circle'
  | 'rect'
  | 'roundedRect'
  | 'ellipse'
  | 'triangle'
  | 'diamond'
  | 'pentagon'
  | 'hexagon'
  | 'octagon';

/**
 * Path types that come built-in
 */
export type BuiltInPathType = 'line' | 'bezier' | 'orthogonal' | 'orthogonal-rounded';

/**
 * Generic shape drawer function type
 */
export type ShapeDrawer<TParams = Record<string, unknown>> = (
  g: Graphics,
  params: TParams,
  style: ShapeStyle
) => void;

/**
 * Generic path drawer function type
 */
export type PathDrawer<TParams = Record<string, unknown>> = (
  g: Graphics,
  params: TParams,
  style: PathStyle
) => void;

/**
 * Registry for all extensible components
 */
export class Registry {
  private shapes = new Map<string, ShapeDrawer>();
  private paths = new Map<string, PathDrawer>();
  private arrows = new Map<string, ArrowDrawFn>();
  private nodeClasses = new Map<string, NodeShapeConstructor>();

  constructor(registerDefaults: boolean = true) {
    if (registerDefaults) {
      this.registerDefaultShapes();
      this.registerDefaultPaths();
      this.registerDefaultArrows();
      this.registerDefaultNodeClasses();
    }
  }

  // =========================================================================
  // SHAPES
  // =========================================================================

  /**
   * Register a shape drawer
   */
  registerShape<TParams = Record<string, unknown>>(
    name: string,
    drawer: ShapeDrawer<TParams>
  ): this {
    this.shapes.set(name, drawer as ShapeDrawer);
    return this;
  }

  /**
   * Get a registered shape drawer
   */
  getShape<TParams = Record<string, unknown>>(name: string): ShapeDrawer<TParams> | undefined {
    return this.shapes.get(name) as ShapeDrawer<TParams> | undefined;
  }

  /**
   * Check if a shape is registered
   */
  hasShape(name: string): boolean {
    return this.shapes.has(name);
  }

  /**
   * Get all registered shape names
   */
  getShapeNames(): string[] {
    return Array.from(this.shapes.keys());
  }

  /**
   * Draw a shape by name
   */
  drawShape(
    g: Graphics,
    shapeName: string,
    params: Record<string, unknown>,
    style: ShapeStyle
  ): boolean {
    const drawer = this.shapes.get(shapeName);
    if (drawer) {
      drawer(g, params, style);
      return true;
    }
    return false;
  }

  // =========================================================================
  // PATHS
  // =========================================================================

  /**
   * Register a path drawer
   */
  registerPath<TParams = Record<string, unknown>>(
    name: string,
    drawer: PathDrawer<TParams>
  ): this {
    this.paths.set(name, drawer as PathDrawer);
    return this;
  }

  /**
   * Get a registered path drawer
   */
  getPath<TParams = Record<string, unknown>>(name: string): PathDrawer<TParams> | undefined {
    return this.paths.get(name) as PathDrawer<TParams> | undefined;
  }

  /**
   * Check if a path is registered
   */
  hasPath(name: string): boolean {
    return this.paths.has(name);
  }

  /**
   * Get all registered path names
   */
  getPathNames(): string[] {
    return Array.from(this.paths.keys());
  }

  /**
   * Draw a path by name
   */
  drawPath(
    g: Graphics,
    pathName: string,
    params: Record<string, unknown>,
    style: PathStyle
  ): boolean {
    const drawer = this.paths.get(pathName);
    if (drawer) {
      drawer(g, params, style);
      return true;
    }
    return false;
  }

  // =========================================================================
  // ARROWS
  // =========================================================================

  /**
   * Register an arrow drawer
   */
  registerArrow(name: string, drawer: ArrowDrawFn): this {
    this.arrows.set(name, drawer);
    return this;
  }

  /**
   * Get a registered arrow drawer
   */
  getArrow(name: string): ArrowDrawFn | undefined {
    return this.arrows.get(name);
  }

  /**
   * Check if an arrow is registered
   */
  hasArrow(name: string): boolean {
    return this.arrows.has(name);
  }

  /**
   * Get all registered arrow names
   */
  getArrowNames(): string[] {
    return Array.from(this.arrows.keys());
  }

  /**
   * Draw an arrow by name
   */
  drawArrowByName(
    g: Graphics,
    arrowName: string,
    params: ArrowParams,
    style: ArrowStyle
  ): boolean {
    const drawer = this.arrows.get(arrowName);
    if (drawer) {
      drawer(g, params, style);
      return true;
    }
    return false;
  }

  // =========================================================================
  // DEFAULT REGISTRATIONS
  // =========================================================================

  private registerDefaultShapes(): void {
    // Wrapper functions to normalize params
    this.registerShape('circle', (g, params: any, style) => {
      drawCircle(g, { x: params.x ?? 0, y: params.y ?? 0, radius: params.radius ?? params.size ?? 30 }, style);
    });

    this.registerShape('rect', (g, params: any, style) => {
      drawRect(g, {
        x: params.x ?? 0,
        y: params.y ?? 0,
        width: params.width ?? params.size ?? 60,
        height: params.height ?? params.size ?? 40,
        centered: params.centered ?? true,
      }, style);
    });

    this.registerShape('roundedRect', (g, params: any, style) => {
      drawRoundedRect(g, {
        x: params.x ?? 0,
        y: params.y ?? 0,
        width: params.width ?? params.size ?? 60,
        height: params.height ?? params.size ?? 40,
        radius: params.radius ?? 8,
        centered: params.centered ?? true,
      }, style);
    });

    this.registerShape('ellipse', (g, params: any, style) => {
      drawEllipse(g, {
        x: params.x ?? 0,
        y: params.y ?? 0,
        radiusX: params.radiusX ?? params.width ?? 40,
        radiusY: params.radiusY ?? params.height ?? 25,
      }, style);
    });

    this.registerShape('triangle', (g, params: any, style) => {
      drawTriangle(g, { x: params.x ?? 0, y: params.y ?? 0, radius: params.radius ?? params.size ?? 30 }, style);
    });

    this.registerShape('diamond', (g, params: any, style) => {
      drawDiamond(g, { x: params.x ?? 0, y: params.y ?? 0, radius: params.radius ?? params.size ?? 30 }, style);
    });

    this.registerShape('pentagon', (g, params: any, style) => {
      drawPentagon(g, { x: params.x ?? 0, y: params.y ?? 0, radius: params.radius ?? params.size ?? 30 }, style);
    });

    this.registerShape('hexagon', (g, params: any, style) => {
      drawHexagon(g, { x: params.x ?? 0, y: params.y ?? 0, radius: params.radius ?? params.size ?? 30 }, style);
    });

    this.registerShape('octagon', (g, params: any, style) => {
      drawOctagon(g, { x: params.x ?? 0, y: params.y ?? 0, radius: params.radius ?? params.size ?? 30 }, style);
    });
  }

  private registerDefaultPaths(): void {
    this.registerPath('line', (g, params: any, style) => {
      drawLine(g, { from: params.from, to: params.to }, style);
    });

    this.registerPath('bezier', (g, params: any, style) => {
      drawAutoBezier(g, {
        from: params.from,
        to: params.to,
        curvature: params.curvature ?? 0.3,
      }, style);
    });

    this.registerPath('orthogonal', (g, params: any, style) => {
      drawOrthogonalPath(g, {
        from: params.from,
        to: params.to,
        sourceDirection: params.sourceDirection,
        targetDirection: params.targetDirection,
        minSegmentLength: params.minSegmentLength,
      }, style);
    });

    this.registerPath('orthogonal-rounded', (g, params: any, style) => {
      drawRoundedOrthogonalPath(g, {
        from: params.from,
        to: params.to,
        sourceDirection: params.sourceDirection,
        targetDirection: params.targetDirection,
        minSegmentLength: params.minSegmentLength,
        cornerRadius: params.cornerRadius ?? 8,
      }, style);
    });
  }

  private registerDefaultArrows(): void {
    // Register all built-in arrow types
    const arrowTypes: ArrowType[] = [
      'triangle', 'triangle-outline', 'triangle-thin', 'vee',
      'circle', 'circle-outline',
      'diamond', 'diamond-outline',
      'square', 'square-outline',
      'tee', 'bar', 'none',
    ];

    for (const type of arrowTypes) {
      this.registerArrow(type, (g, params, style) => {
        drawArrow(g, type, params, style);
      });
    }
  }

  /**
   * Register default node shape classes
   */
  private registerDefaultNodeClasses(): void {
    // Register circle
    this.registerNodeClass('circle', CircleNode);
    
    // Register rectangles
    this.registerNodeClass('rect', RectNode);
    this.registerNodeClass('rectangle', RectNode);
    this.registerNodeClass('square', RectNode);
    
    // Register rounded rectangles
    this.registerNodeClass('roundedRect', RoundedRectNode);
    this.registerNodeClass('rounded-rect', RoundedRectNode);
    
    // Register ellipse
    this.registerNodeClass('ellipse', EllipseNode);
    
    // Register polygons
    this.registerNodeClass('triangle', TriangleNode);
    this.registerNodeClass('diamond', DiamondNode);
    this.registerNodeClass('pentagon', PentagonNode);
    this.registerNodeClass('hexagon', HexagonNode);
    this.registerNodeClass('octagon', OctagonNode);
    this.registerNodeClass('polygon', PolygonNode);
  }

  // =========================================================================
  // NODE CLASSES
  // =========================================================================

  /**
   * Register a node shape class
   */
  registerNodeClass(shapeName: string, nodeClass: NodeShapeConstructor): this {
    this.nodeClasses.set(shapeName, nodeClass);
    return this;
  }

  /**
   * Get a registered node class
   */
  getNodeClass(shapeName: string): NodeShapeConstructor | undefined {
    return this.nodeClasses.get(shapeName);
  }

  /**
   * Check if a node class is registered
   */
  hasNodeClass(shapeName: string): boolean {
    return this.nodeClasses.has(shapeName);
  }

  /**
   * Get all registered node shape names
   */
  getNodeClassNames(): string[] {
    return Array.from(this.nodeClasses.keys());
  }

  // =========================================================================
  // UTILITY
  // =========================================================================

  /**
   * Clear all registrations
   */
  clear(): void {
    this.shapes.clear();
    this.paths.clear();
    this.arrows.clear();
    this.nodeClasses.clear();
  }

  /**
   * Clone this registry
   */
  clone(): Registry {
    const cloned = new Registry(false);
    this.shapes.forEach((v, k) => cloned.shapes.set(k, v));
    this.paths.forEach((v, k) => cloned.paths.set(k, v));
    this.arrows.forEach((v, k) => cloned.arrows.set(k, v));
    this.nodeClasses.forEach((v, k) => cloned.nodeClasses.set(k, v));
    return cloned;
  }
}

/**
 * Default global registry instance
 * Can be used when a per-canvas registry isn't needed
 */
export const defaultRegistry = new Registry();
