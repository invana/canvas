/**
 * EdgeShape
 * 
 * Visual representation of an edge (connection) between nodes.
 * Uses path and arrow primitives from the Registry for rendering.
 * 
 * @example
 * ```typescript
 * const edge = new EdgeShape({
 *   data: {
 *     id: 'edge1',
 *     source: { x: 100, y: 100 },
 *     target: { x: 300, y: 200 },
 *     pathType: 'bezier',
 *     arrowTarget: 'triangle',
 *   },
 *   style: { stroke: '#666', strokeWidth: 2 },
 *   registry,
 * });
 * 
 * canvas.edgeLayer.addChild(edge);
 * ```
 */

import type { PathStyle, Point, Direction } from '../primitives/paths';
import type { ArrowType, ArrowStyle } from '../primitives/arrows';
import { getArrowOffset } from '../primitives/arrows';
import {
  getLineTangentAtEnd,
  getQuadraticTangentAtEnd,
  getQuadraticTangentAtStart,
  calculateQuadraticControl,
  getOrthogonalTangentAtEnd,
  getOrthogonalTangentAtStart,
} from '../primitives/paths';
import { BaseShape, type BaseShapeData, type BaseShapeOptions } from './BaseShape';

/**
 * Edge path types
 */
export type EdgePathType = 'line' | 'bezier' | 'orthogonal' | 'orthogonal-rounded' | string;

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
 * Edge shape class
 */
export class EdgeShape extends BaseShape<EdgeData> {
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

  get pathType(): EdgePathType {
    return this._data.pathType ?? 'line';
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

    // Get adjusted endpoints for arrow positioning
    const { adjustedSource, adjustedTarget, sourceTangent, targetTangent } =
      this.calculateAdjustedEndpoints(source, target, sourceOffset, targetOffset);

    // Draw path
    this.drawPath(adjustedSource, adjustedTarget, style);

    // Draw arrows
    const arrowStyle: ArrowStyle = {
      fill: this._edgeStyle.arrowFill ?? style.stroke,
      stroke: this._edgeStyle.arrowStroke,
      strokeWidth: style.strokeWidth,
    };

    if (sourceArrow !== 'none') {
      // Source arrow points back toward source
      this.drawArrowAtPoint(source, sourceTangent + Math.PI, arrowSize, sourceArrow as ArrowType, arrowStyle);
    }

    if (targetArrow !== 'none') {
      this.drawArrowAtPoint(target, targetTangent, arrowSize, targetArrow as ArrowType, arrowStyle);
    }
  }

  /**
   * Draw the path between source and target
   */
  private drawPath(source: Point, target: Point, style: PathStyle): void {
    const pathType = this.pathType;
    const pathDrawer = this._registry.getPath(pathType);

    const params: Record<string, unknown> = {
      from: source,
      to: target,
      curvature: this._data.curvature ?? 0.3,
      sourceDirection: this._data.sourceDirection,
      targetDirection: this._data.targetDirection,
      cornerRadius: 8,
    };

    if (pathDrawer) {
      pathDrawer(this._graphics, params, style);
    } else {
      // Fallback to line
      const lineDrawer = this._registry.getPath('line');
      if (lineDrawer) {
        lineDrawer(this._graphics, { from: source, to: target }, style);
      }
    }
  }

  /**
   * Draw arrow at a specific point
   */
  private drawArrowAtPoint(
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
   * Calculate adjusted endpoints considering arrow offsets
   */
  private calculateAdjustedEndpoints(
    source: Point,
    target: Point,
    sourceOffset: number,
    targetOffset: number
  ): {
    adjustedSource: Point;
    adjustedTarget: Point;
    sourceTangent: number;
    targetTangent: number;
  } {
    const pathType = this.pathType;

    switch (pathType) {
      case 'bezier': {
        const control = calculateQuadraticControl(source, target, this._data.curvature ?? 0.3);
        const sourceTangent = getQuadraticTangentAtStart(source, control);
        const targetTangent = getQuadraticTangentAtEnd(control, target);

        return {
          adjustedSource: {
            x: source.x + Math.cos(sourceTangent) * sourceOffset,
            y: source.y + Math.sin(sourceTangent) * sourceOffset,
          },
          adjustedTarget: {
            x: target.x - Math.cos(targetTangent) * targetOffset,
            y: target.y - Math.sin(targetTangent) * targetOffset,
          },
          sourceTangent,
          targetTangent,
        };
      }

      case 'orthogonal':
      case 'orthogonal-rounded': {
        const params = {
          from: source,
          to: target,
          sourceDirection: this._data.sourceDirection,
          targetDirection: this._data.targetDirection,
        };
        const sourceTangent = getOrthogonalTangentAtStart(params);
        const targetTangent = getOrthogonalTangentAtEnd(params);

        return {
          adjustedSource: {
            x: source.x + Math.cos(sourceTangent) * sourceOffset,
            y: source.y + Math.sin(sourceTangent) * sourceOffset,
          },
          adjustedTarget: {
            x: target.x - Math.cos(targetTangent) * targetOffset,
            y: target.y - Math.sin(targetTangent) * targetOffset,
          },
          sourceTangent,
          targetTangent,
        };
      }

      case 'line':
      default: {
        const tangent = getLineTangentAtEnd(source, target);

        return {
          adjustedSource: {
            x: source.x + Math.cos(tangent) * sourceOffset,
            y: source.y + Math.sin(tangent) * sourceOffset,
          },
          adjustedTarget: {
            x: target.x - Math.cos(tangent) * targetOffset,
            y: target.y - Math.sin(tangent) * targetOffset,
          },
          sourceTangent: tangent,
          targetTangent: tangent,
        };
      }
    }
  }

  /**
   * Get the active style based on state (selected, hovered)
   */
  private getActiveStyle(): PathStyle {
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
    // Use forceRender to ensure immediate redraw
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
