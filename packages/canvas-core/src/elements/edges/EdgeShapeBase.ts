/**
 * EdgeShapeBase
 * 
 * Abstract base class for all edge shapes.
 * Provides common functionality: hover, selection, arrows, and style management.
 * Subclasses must implement: drawPath(), calculateTangents()
 * 
 * @example
 * ```typescript
 * class CustomEdge extends EdgeShapeBase {
 *   get pathType() { return 'custom'; }
 *   
 *   protected drawPath(source: Point, target: Point, style: PathStyle): void {
 *     // Custom path rendering
 *   }
 *   
 *   protected calculateTangents(source: Point, target: Point): Tangents {
 *     // Calculate path tangents for arrow placement
 *   }
 * }
 * ```
 */

import type { PathStyle, Point, Direction } from '../../primitives/paths';
import type { ArrowType, ArrowStyle } from '../../primitives/arrows';
import { getArrowOffset } from '../../primitives/arrows';
import { BaseShape, type BaseShapeData, type BaseShapeOptions } from '../BaseShape';

/**
 * Edge path types
 */
export type EdgePathType = 'line' | 'bezier' | 'orthogonal' | string;

/**
 * Tangent information for arrow placement
 */
export interface EdgeTangents {
  /** Angle at source point (radians) */
  sourceTangent: number;
  /** Angle at target point (radians) */
  targetTangent: number;
}

/**
 * Data for an edge
 */
export interface EdgeData extends BaseShapeData {
  /** Source point */
  source: Point;
  /** Target point */
  target: Point;
  /** Path type */
  pathType?: EdgePathType;
  /** Curvature for bezier paths */
  curvature?: number;
  /** Source direction hint for orthogonal */
  sourceDirection?: Direction;
  /** Target direction hint for orthogonal */
  targetDirection?: Direction;
  /** Arrow at source */
  arrowSource?: ArrowType | 'none';
  /** Arrow at target */
  arrowTarget?: ArrowType | 'none';
  /** Arrow size */
  arrowSize?: number;
  /** Edge label */
  label?: string;
  /** Optional data payload */
  payload?: Record<string, unknown>;
}

/**
 * Style for an edge
 */
export interface EdgeStyle {
  /** Stroke color */
  stroke: string;
  /** Stroke width */
  strokeWidth: number;
  /** Stroke alpha */
  strokeAlpha?: number;
  /** Line cap style */
  lineCap?: 'butt' | 'round' | 'square';
  /** Line join style */
  lineJoin?: 'miter' | 'round' | 'bevel';
  /** Corner radius for orthogonal edges (0 = sharp corners) */
  cornerRadius?: number;
  /** Visibility */
  visible?: boolean;
  /** Overall alpha */
  alpha?: number;
  /** Cursor style */
  cursor?: string;
  /** Arrow fill color (defaults to stroke) */
  arrowFill?: string;
  /** Arrow stroke color */
  arrowStroke?: string;
  /** Selected state style overrides */
  selectedStroke?: string;
  selectedStrokeWidth?: number;
  /** Hover state style overrides */
  hoverStroke?: string;
  hoverStrokeWidth?: number;
}

/**
 * Edge shape options
 */
export interface EdgeShapeOptions extends Omit<BaseShapeOptions<EdgeData>, 'style' | 'data'> {
  data: Omit<EdgeData, 'x' | 'y'> & { x?: number; y?: number };
  style?: EdgeStyle;
}

/**
 * Abstract base class for edge shapes
 */
export abstract class EdgeShapeBase extends BaseShape<EdgeData> {
  protected _edgeStyle: EdgeStyle;
  private _selected: boolean = false;
  private _hovered: boolean = false;

  constructor(options: EdgeShapeOptions) {
    // Edges don't use x/y positioning - they draw from source to target
    const data = {
      ...options.data,
      x: options.data.x ?? 0,
      y: options.data.y ?? 0,
    } as EdgeData;

    super({ ...options, data } as BaseShapeOptions<EdgeData>);
    this._edgeStyle = options.style ?? { stroke: '#666666', strokeWidth: 2 };

    // Set up hover events
    this.on('pointerover', this.onPointerOver, this);
    this.on('pointerout', this.onPointerOut, this);

    // Initial render
    this.forceRender();
  }

  // =========================================================================
  // ABSTRACT METHODS - Must be implemented by subclasses
  // =========================================================================

  /**
   * Get the path type identifier
   */
  abstract get pathType(): EdgePathType;

  /**
   * Draw the path between source and target points
   * @param source - Adjusted source point (after arrow offset)
   * @param target - Adjusted target point (after arrow offset)
   * @param style - Path style to use
   */
  protected abstract drawPath(source: Point, target: Point, style: PathStyle): void;

  /**
   * Calculate tangent angles at source and target for arrow placement
   * @param source - Source point
   * @param target - Target point
   */
  protected abstract calculateTangents(source: Point, target: Point): EdgeTangents;

  // =========================================================================
  // PROPERTIES
  // =========================================================================

  get edgeStyle(): EdgeStyle {
    return this._edgeStyle;
  }

  set edgeStyle(value: EdgeStyle) {
    this._edgeStyle = value;
    this._style = value;
    this.markDirty();
  }

  get selected(): boolean {
    return this._selected;
  }

  set selected(value: boolean) {
    if (this._selected !== value) {
      this._selected = value;
      this.markDirty();
      this.update();
    }
  }

  get hovered(): boolean {
    return this._hovered;
  }

  get source(): Point {
    return this._data.source;
  }

  get target(): Point {
    return this._data.target;
  }

  // =========================================================================
  // RENDERING
  // =========================================================================

  protected render(): void {
    const style = this.getActiveStyle();
    const { source, target } = this._data;
    const arrowSize = this._data.arrowSize ?? 10;

    // Calculate arrow offsets
    const sourceArrow = this._data.arrowSource ?? 'none';
    const targetArrow = this._data.arrowTarget ?? 'triangle';
    const sourceOffset = getArrowOffset(sourceArrow as ArrowType, arrowSize);
    const targetOffset = getArrowOffset(targetArrow as ArrowType, arrowSize);

    // Get tangents for arrow placement
    const { sourceTangent, targetTangent } = this.calculateTangents(source, target);

    // Calculate adjusted endpoints
    const adjustedSource = this.adjustPointForArrow(source, sourceTangent, sourceOffset);
    const adjustedTarget = this.adjustPointForArrow(target, targetTangent + Math.PI, targetOffset);

    // Draw path
    this.drawPath(adjustedSource, adjustedTarget, style);

    // Draw arrows
    const arrowStyle: ArrowStyle = {
      fill: this._edgeStyle.arrowFill ?? style.stroke,
      stroke: this._edgeStyle.arrowStroke,
      strokeWidth: style.strokeWidth,
    };

    if (sourceArrow !== 'none') {
      this.drawArrowAtPoint(source, sourceTangent + Math.PI, arrowSize, sourceArrow as ArrowType, arrowStyle);
    }

    if (targetArrow !== 'none') {
      this.drawArrowAtPoint(target, targetTangent, arrowSize, targetArrow as ArrowType, arrowStyle);
    }
  }

  /**
   * Adjust a point along a tangent for arrow offset
   */
  protected adjustPointForArrow(point: Point, tangent: number, offset: number): Point {
    return {
      x: point.x + Math.cos(tangent) * offset,
      y: point.y + Math.sin(tangent) * offset,
    };
  }

  /**
   * Draw arrow at a specific point
   */
  protected drawArrowAtPoint(
    point: Point,
    angle: number,
    size: number,
    type: ArrowType,
    style: ArrowStyle
  ): void {
    this._registry.drawArrowByName(this._graphics, type, {
      x: point.x,
      y: point.y,
      angle,
      size,
    }, style);
  }

  /**
   * Get the active style based on state (selected, hovered)
   */
  protected getActiveStyle(): PathStyle {
    const base = this._edgeStyle;
    let stroke = base.stroke;
    let strokeWidth = base.strokeWidth;

    if (this._selected) {
      stroke = base.selectedStroke ?? stroke;
      strokeWidth = base.selectedStrokeWidth ?? strokeWidth;
    } else if (this._hovered) {
      stroke = base.hoverStroke ?? stroke;
      strokeWidth = base.hoverStrokeWidth ?? strokeWidth;
    }

    return {
      stroke: stroke ?? '#666666',
      strokeWidth: strokeWidth ?? 2,
      strokeAlpha: base.strokeAlpha,
      lineCap: base.lineCap,
      lineJoin: base.lineJoin,
    };
  }

  // =========================================================================
  // INTERACTION
  // =========================================================================

  private onPointerOver(): void {
    this._hovered = true;
    this.markDirty();
    this.update();
  }

  private onPointerOut(): void {
    this._hovered = false;
    this.markDirty();
    this.update();
  }

  // =========================================================================
  // PUBLIC METHODS
  // =========================================================================

  /**
   * Update edge endpoints
   */
  updateEndpoints(source: Point, target: Point): void {
    this._data.source = source;
    this._data.target = target;
    this.forceRender();
  }

  /**
   * Update edge style
   */
  updateEdgeStyle(style: Partial<EdgeStyle>): void {
    this._edgeStyle = { ...this._edgeStyle, ...style };
    this._style = this._edgeStyle;
    this.markDirty();
    this.update();
  }

  // =========================================================================
  // CLEANUP
  // =========================================================================

  destroy(): void {
    this.off('pointerover', this.onPointerOver, this);
    this.off('pointerout', this.onPointerOut, this);
    super.destroy();
  }
}
