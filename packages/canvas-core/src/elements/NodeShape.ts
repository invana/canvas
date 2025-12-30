/**
 * NodeShape
 * 
 * Visual representation of a node on the canvas.
 * Uses primitives from the Registry for rendering.
 * 
 * @example
 * ```typescript
 * const node = new NodeShape({
 *   data: { id: 'node1', x: 100, y: 100, shape: 'circle', size: 40 },
 *   style: { fill: '#4a90d9', stroke: '#2d5a87', strokeWidth: 2 },
 *   registry,
 * });
 * 
 * canvas.nodeLayer.addChild(node);
 * ```
 */

import type { ShapeStyle } from '../primitives/shapes';
import type { LabelAlign } from '../primitives/labels';
import { createPositionedLabel, type LabelPosition } from '../primitives/labels';
import { RendererBase, type RendererBaseData, type RendererBaseStyle, type RendererBaseOptions } from './RendererBase';
import { FederatedPointerEvent, Graphics, Ticker } from 'pixi.js';
import { drawRippleEffect, calculateRippleRadius, calculateRippleAlpha } from '../primitives/effects';
import { getRectIntersection } from '../primitives/shapes/rect';
import { getPolygonIntersection } from '../primitives/shapes/polygon';
import { DEFAULT_NODE_STYLE } from '../defaults/nodes';
import { NodeStates, type NodeStateName } from '../types/states';

/**
 * Node shape types
 */
export type NodeShapeType =
  | 'circle'
  | 'rect'
  | 'roundedRect'
  | 'ellipse'
  | 'triangle'
  | 'diamond'
  | 'pentagon'
  | 'hexagon'
  | 'octagon'
  | string; // Allow custom shapes

/**
 * Data for a node
 */
export interface RendererNode extends RendererBaseData {
  /** Node label text */
  label?: string;
  /** Shape type */
  shape?: NodeShapeType;
  /** Size (radius for circle, or uniform size for others) */
  size?: number;
  /** Width (for rect/ellipse) */
  width?: number;
  /** Height (for rect/ellipse) */
  height?: number;
  /** Corner radius (for roundedRect) */
  cornerRadius?: number;
  /** Optional data payload */
  payload?: Record<string, unknown>;
}

/**
 * Ripple animation options
 */
export interface RippleAnimationOptions {
  /** Duration of one ripple cycle in ms */
  duration?: number;
  /** Color of the ripple */
  color?: string;
  /** Maximum radius of ripple (relative to node size) */
  maxRadiusMultiplier?: number;
  /** Number of ripple rings */
  ringCount?: number;
  /** Whether to loop continuously */
  loop?: boolean;
}

/**
 * Style for a node
 */
export interface NodeStyle extends RendererBaseStyle {
  /** Label position relative to shape */
  labelPosition?: LabelPosition;
  /** Label offset from position */
  labelOffsetX?: number;
  labelOffsetY?: number;
  
  // Flattened label properties
  labelFontFamily?: string;
  labelFontSize?: number;
  labelFontWeight?: 'normal' | 'bold' | 'lighter' | 'bolder';
  labelFontStyle?: 'normal' | 'italic' | 'oblique';
  labelFill?: string;
  labelStroke?: string;
  labelStrokeWidth?: number;
  labelLetterSpacing?: number;
  labelLineHeight?: number;
  labelWordWrap?: boolean;
  labelWordWrapWidth?: number;
  labelAlign?: LabelAlign;
  
  /** State-based style overrides */
  states?: {
    [stateName: string]: Partial<NodeStyle>;
  };
  /** State priority order (default: ['default', 'active', 'selected']) */
  statePriority?: string[];
  
  /** Ripple effect style */
  rippleColor?: string;
}

/**
 * Node shape options
 */
export interface NodeShapeOptions extends Omit<RendererBaseOptions<RendererNode>, 'style'> {
  style?: NodeStyle;
  /** Enable node dragging */
  draggable?: boolean;
  /** Enable node selection */
  selectable?: boolean;
  /** Initial states to activate (e.g., ['selected', 'highlighted']) */
  states?: string[];
  /** Callback when node is dragged */
  onDrag?: (node: NodeShape, x: number, y: number) => void;
}

/**
 * Node shape class
 */
export class NodeShape extends RendererBase<RendererNode> {
  protected _nodeStyle: NodeStyle;
  private _activeStates = new Set<string>([NodeStates.DEFAULT]);
  private _draggable: boolean;
  private _selectable: boolean;
  
  // Drag callback
  private _onDrag?: (node: NodeShape, x: number, y: number) => void;
  
  // Drag state
  private _isDragging: boolean = false;
  private _dragStartX: number = 0;
  private _dragStartY: number = 0;
  private _dragStartPosX: number = 0;
  private _dragStartPosY: number = 0;
  
  // Ripple animation state
  private _rippleGraphics: Graphics | null = null;
  private _rippleActive: boolean = false;
  private _rippleProgress: number = 0;
  private _rippleOptions: RippleAnimationOptions = {};
  private _rippleTicker: Ticker | null = null;
  private _rippleTickerCallback: ((delta: { deltaMS: number }) => void) | null = null;

  constructor(options: NodeShapeOptions) {
    super(options as RendererBaseOptions<RendererNode>);
    this._nodeStyle = options.style ?? {};
    this._draggable = options.draggable ?? true;
    this._selectable = options.selectable ?? true;
    this._onDrag = options.onDrag;

    // Set up hover events
    this.on('pointerover', this.onPointerOver, this);
    this.on('pointerout', this.onPointerOut, this);
    
    // Set up drag events
    if (this._draggable) {
      this.on('pointerdown', this.onDragStart, this);
      this.on('globalpointermove', this.onDragMove, this);
      this.on('pointerup', this.onDragEnd, this);
      this.on('pointerupoutside', this.onDragEnd, this);
    }
    
    // Set up click/selection events
    if (this._selectable) {
      this.on('pointertap', this.onTap, this);
    }
    
    // Prevent context menu on right-click
    this.on('rightclick', this.onRightClick, this);

    // Initial render
    this.forceRender();
    this.updateLabel();
    
    // Apply initial states if provided
    if (options.states) {
      options.states.forEach(state => this.setState(state, true));
    }
  }

  // =========================================================================
  // STATE MANAGEMENT
  // =========================================================================

  /**
   * Set a state on the node
   * @param name - State name (use NodeStates constants)
   * @param active - Whether to activate or deactivate the state
   */
  setState(name: NodeStateName, active: boolean): void {
    const changed = active 
      ? !this._activeStates.has(name)
      : this._activeStates.has(name);
    
    if (!changed) return;
    
    if (active) {
      this._activeStates.add(name);
    } else {
      this._activeStates.delete(name);
    }
    
    this.markDirty();
  }

  /**
   * Check if a state is active
   * @param name - State name to check
   * @returns true if the state is active
   */
  getState(name: NodeStateName): boolean {
    return this._activeStates.has(name);
  }

  /**
   * Get all active states
   * @returns Array of active state names
   */
  getActiveStates(): string[] {
    return Array.from(this._activeStates);
  }

  // =========================================================================
  // PROPERTIES
  // =========================================================================

  get nodeStyle(): NodeStyle {
    return this._nodeStyle;
  }

  set nodeStyle(value: NodeStyle) {
    this._nodeStyle = value;
    this._style = value;
    this.markDirty();
  }

  get selected(): boolean {
    return this.getState(NodeStates.SELECTED);
  }

  set selected(value: boolean) {
    this.setState(NodeStates.SELECTED, value);
  }

  get hovered(): boolean {
    return this.getState(NodeStates.ACTIVE);
  }

  get shapeType(): NodeShapeType {
    return this._data.shape ?? 'circle';
  }

  /**
   * Set drag callback
   */
  set onDrag(callback: ((node: NodeShape, x: number, y: number) => void) | undefined) {
    this._onDrag = callback;
  }

  // =========================================================================
  // RENDERING
  // =========================================================================

  /**
   * Get style with state overrides applied
   * @returns Resolved ShapeStyle with active states merged
   */
  private getResolvedStyle(): ShapeStyle {
    const base = this._nodeStyle;
    const result: ShapeStyle = {
      fill: base.fill ?? DEFAULT_NODE_STYLE.fill,
      stroke: base.stroke ?? DEFAULT_NODE_STYLE.stroke,
      strokeWidth: base.strokeWidth ?? DEFAULT_NODE_STYLE.strokeWidth,
      fillAlpha: base.fillAlpha ?? DEFAULT_NODE_STYLE.fillAlpha,
      strokeAlpha: base.strokeAlpha ?? DEFAULT_NODE_STYLE.strokeAlpha,
    };

    // Apply state styles if defined
    if (base.states) {
      // Get state priority (default or custom)
      const priority = base.statePriority ?? [NodeStates.DEFAULT, NodeStates.ACTIVE, NodeStates.SELECTED];
      
      // Apply states in priority order
      for (const stateName of priority) {
        if (!this._activeStates.has(stateName)) continue;
        
        const stateStyle = base.states[stateName];
        if (!stateStyle) continue;
        
        if (stateStyle.fill !== undefined) result.fill = stateStyle.fill;
        if (stateStyle.stroke !== undefined) result.stroke = stateStyle.stroke;
        if (stateStyle.strokeWidth !== undefined) result.strokeWidth = stateStyle.strokeWidth;
        if (stateStyle.fillAlpha !== undefined) result.fillAlpha = stateStyle.fillAlpha;
        if (stateStyle.strokeAlpha !== undefined) result.strokeAlpha = stateStyle.strokeAlpha;
      }
      
      // Apply any custom states not in priority list
      for (const stateName of this._activeStates) {
        if (priority.includes(stateName)) continue;
        
        const stateStyle = base.states[stateName];
        if (!stateStyle) continue;
        
        if (stateStyle.fill !== undefined) result.fill = stateStyle.fill;
        if (stateStyle.stroke !== undefined) result.stroke = stateStyle.stroke;
        if (stateStyle.strokeWidth !== undefined) result.strokeWidth = stateStyle.strokeWidth;
        if (stateStyle.fillAlpha !== undefined) result.fillAlpha = stateStyle.fillAlpha;
        if (stateStyle.strokeAlpha !== undefined) result.strokeAlpha = stateStyle.strokeAlpha;
      }
    }

    return result;
  }

  protected render(): void {
    const shapeType = this.shapeType;
    const style = this.getResolvedStyle();

    // Get shape dimensions
    const params = this.getShapeParams();

    // Draw using registry
    const drawer = this._registry.getShape(shapeType);
    if (drawer) {
      drawer(this._graphics, params, style);
    } else {
      // Fallback to circle
      const circleDrawer = this._registry.getShape('circle');
      if (circleDrawer) {
        circleDrawer(this._graphics, { x: 0, y: 0, radius: params.size ?? 30 }, style);
      }
    }
  }

  /**
   * Get parameters for the shape drawer
   */
  private getShapeParams(): Record<string, unknown> {
    const data = this._data;
    return {
      x: 0,
      y: 0,
      size: data.size ?? 30,
      radius: data.size ?? data.cornerRadius ?? 30,
      width: data.width ?? data.size ?? 60,
      height: data.height ?? data.size ?? 40,
      cornerRadius: data.cornerRadius ?? 8,
      radiusX: data.width ?? 40,
      radiusY: data.height ?? 25,
      centered: true,
    };
  }

  // =========================================================================
  // LABEL MANAGEMENT
  // =========================================================================

  /**
   * Update the main label
   */
  updateLabel(): void {
    // Remove old label
    this.removeLabel('main');

    const labelText = this._data.label;
    if (!labelText) return;

    // Create new label
    const bounds = this.getShapeBounds();
    const label = createPositionedLabel(
      labelText,
      bounds,
      {
        position: this._nodeStyle.labelPosition ?? DEFAULT_NODE_STYLE.labelPosition,
        offsetX: this._nodeStyle.labelOffsetX ?? DEFAULT_NODE_STYLE.labelOffsetX,
        offsetY: this._nodeStyle.labelOffsetY ?? DEFAULT_NODE_STYLE.labelOffsetY,
      },
      this.collectLabelStyle()
    );

    this.addLabel('main', label);
  }

  /**
   * Collect flattened label* properties into a LabelStyle object
   * @internal
   */
  private collectLabelStyle(): import('../primitives/labels').LabelStyle {
    return {
      fontFamily: this._nodeStyle.labelFontFamily,
      fontSize: this._nodeStyle.labelFontSize,
      fontWeight: this._nodeStyle.labelFontWeight,
      fontStyle: this._nodeStyle.labelFontStyle,
      fill: this._nodeStyle.labelFill,
      stroke: this._nodeStyle.labelStroke,
      strokeWidth: this._nodeStyle.labelStrokeWidth,
      letterSpacing: this._nodeStyle.labelLetterSpacing,
      lineHeight: this._nodeStyle.labelLineHeight,
      wordWrap: this._nodeStyle.labelWordWrap,
      wordWrapWidth: this._nodeStyle.labelWordWrapWidth,
      align: this._nodeStyle.labelAlign,
    };
  }

  /**
   * Get bounds for label positioning
   */
  private getShapeBounds(): { x: number; y: number; width: number; height: number } {
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

  // =========================================================================
  // INTERACTION
  // =========================================================================

  private onPointerOver(): void {
    this.setState(NodeStates.ACTIVE, true);
  }

  private onPointerOut(): void {
    this.setState(NodeStates.ACTIVE, false);
  }
  
  private onDragStart(e: FederatedPointerEvent): void {
    // Only left-click drag
    if (e.button !== 0) return;
    
    // Stop propagation to prevent viewport panning
    e.stopPropagation();
    
    this._isDragging = true;
    this._dragStartX = e.globalX;
    this._dragStartY = e.globalY;
    this._dragStartPosX = this.x;
    this._dragStartPosY = this.y;
    
    this.cursor = 'grabbing';
    this.alpha = 0.8;
    
    // Emit drag start event
    this.emit('dragstart', { node: this, event: e });
  }
  
  private onDragMove(e: FederatedPointerEvent): void {
    if (!this._isDragging) return;
    
    // Calculate delta in screen space, then convert to world space
    const dx = e.globalX - this._dragStartX;
    const dy = e.globalY - this._dragStartY;
    
    // Get the zoom level from parent to correctly scale movement
    const zoom = this.parent?.parent?.scale?.x ?? 1;
    
    const newX = this._dragStartPosX + dx / zoom;
    const newY = this._dragStartPosY + dy / zoom;
    
    this.x = newX;
    this.y = newY;
    this._data.x = newX;
    this._data.y = newY;
    
    // Call drag callback if provided
    if (this._onDrag) {
      this._onDrag(this, newX, newY);
    }
    
    // Emit drag event
    this.emit('drag', { node: this, event: e, x: newX, y: newY });
  }
  
  private onDragEnd(e: FederatedPointerEvent): void {
    if (!this._isDragging) return;
    
    this._isDragging = false;
    this.cursor = 'pointer';
    this.alpha = this._style.alpha ?? 1;
    
    // Emit drag end event
    this.emit('dragend', { node: this, event: e, x: this.x, y: this.y });
  }
  
  private onTap(e: FederatedPointerEvent): void {
    // Skip if we just finished dragging (click after drag)
    if (this._isDragging) return;
    
    // Stop propagation to prevent canvas deselect
    e.stopPropagation();
    
    // Toggle or set selection based on modifier key
    if (e.shiftKey) {
      this.setState(NodeStates.SELECTED, !this.getState(NodeStates.SELECTED));
    } else {
      this.setState(NodeStates.SELECTED, true);
    }
    
    // Emit selection event
    this.emit('select', { node: this, selected: this.getState(NodeStates.SELECTED), event: e });
  }
  
  private onRightClick(e: FederatedPointerEvent): void {
    // Stop propagation and prevent browser context menu
    e.stopPropagation();
    
    // Emit context menu event for custom handling
    this.emit('contextmenu', { node: this, event: e, x: e.globalX, y: e.globalY });
  }

  // =========================================================================
  // PUBLIC METHODS
  // =========================================================================

  /**
   * Update node data
   */
  updateData(data: Partial<RendererNode>): void {
    super.updateData(data);
    if (data.label !== undefined) {
      this.updateLabel();
    }
  }

  /**
   * Update node style
   */
  updateNodeStyle(style: Partial<NodeStyle>): void {
    this._nodeStyle = { ...this._nodeStyle, ...style };
    this._style = this._nodeStyle;
    this.markDirty();
    this.update();

    if (style.labelPosition !== undefined || 
        style.labelFontSize !== undefined || 
        style.labelFill !== undefined) {
      this.updateLabel();
    }
  }
  
  /**
   * Check if node is currently being dragged
   */
  get isDragging(): boolean {
    return this._isDragging;
  }
  
  /**
   * Check if node is draggable
   */
  get draggable(): boolean {
    return this._draggable;
  }
  
  set draggable(value: boolean) {
    this._draggable = value;
  }

  // =========================================================================
  // BOUNDARY CALCULATION
  // =========================================================================

  /**
   * Calculate the boundary point of this node for an edge connection.
   * This method can be overridden in custom node shapes for precise boundary calculation.
   * 
   * @param targetPoint - The point the edge connects to (other node center or point)
   * @param offset - Additional offset from boundary (for stroke width, hover effects, etc.)
   * @returns The point on the node boundary facing the target point
   */
  getBoundaryPoint(
    targetPoint: { x: number; y: number },
    offset: number = 0
  ): { x: number; y: number } {
    const nodeX = this.x;
    const nodeY = this.y;
    
    // Calculate angle from node center to the target point
    const angle = Math.atan2(targetPoint.y - nodeY, targetPoint.x - nodeX);
    
    // Get node shape properties
    const shapeType = this.shapeType;
    const data = this._data;
    const size = data.size ?? 30;
    const width = data.width ?? size * 2;
    const height = data.height ?? size * 2;
    
    // Calculate boundary based on shape type
    return this.calculateBoundaryForShape(shapeType, angle, size, width, height, offset);
  }

  /**
   * Calculate boundary point for a specific shape type.
   * Override this method to add support for custom shapes.
   */
  protected calculateBoundaryForShape(
    shapeType: string,
    angle: number,
    size: number,
    width: number,
    height: number,
    offset: number
  ): { x: number; y: number } {
    const nodeX = this.x;
    const nodeY = this.y;

    switch (shapeType) {
      case 'circle': {
        const radius = size + offset;
        return {
          x: nodeX + Math.cos(angle) * radius,
          y: nodeY + Math.sin(angle) * radius,
        };
      }

      case 'ellipse': {
        const radiusX = (this._data.width ?? size * 2) / 2 + offset;
        const radiusY = (this._data.height ?? size) / 2 + offset;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const denominator = Math.sqrt((radiusY * cos) ** 2 + (radiusX * sin) ** 2);
        const r = (radiusX * radiusY) / denominator;
        return {
          x: nodeX + cos * r,
          y: nodeY + sin * r,
        };
      }

      case 'rect':
      case 'roundedRect': {
        return getRectIntersection(
          { x: nodeX, y: nodeY, width, height },
          angle,
          offset
        );
      }

      case 'triangle':
        return getPolygonIntersection(
          { x: nodeX, y: nodeY, radius: size, sides: 3 },
          angle,
          offset
        );

      case 'diamond':
        return getPolygonIntersection(
          { x: nodeX, y: nodeY, radius: size, sides: 4, rotation: 0 },
          angle,
          offset
        );

      case 'pentagon':
        return getPolygonIntersection(
          { x: nodeX, y: nodeY, radius: size, sides: 5 },
          angle,
          offset
        );

      case 'hexagon':
        return getPolygonIntersection(
          { x: nodeX, y: nodeY, radius: size, sides: 6 },
          angle,
          offset
        );

      case 'octagon':
        return getPolygonIntersection(
          { x: nodeX, y: nodeY, radius: size, sides: 8 },
          angle,
          offset
        );

      default: {
        // Default to circle for unknown shapes
        const radius = size + offset;
        return {
          x: nodeX + Math.cos(angle) * radius,
          y: nodeY + Math.sin(angle) * radius,
        };
      }
    }
  }

  // =========================================================================
  // RIPPLE ANIMATION
  // =========================================================================

  /**
   * Start ripple animation
   */
  startRipple(options: RippleAnimationOptions = {}): void {
    // Stop any existing ripple
    this.stopRipple();
    
    this._rippleOptions = {
      duration: options.duration ?? 1000,
      color: options.color ?? this._nodeStyle.rippleColor ?? this._nodeStyle.stroke ?? '#4a90d9',
      maxRadiusMultiplier: options.maxRadiusMultiplier ?? 2,
      ringCount: options.ringCount ?? 3,
      loop: options.loop ?? true,
    };
    
    // Create ripple graphics layer (behind the main shape)
    this._rippleGraphics = new Graphics();
    this.addChildAt(this._rippleGraphics, 0);
    
    this._rippleActive = true;
    this._rippleProgress = 0;
    
    // Set up animation ticker
    this._rippleTicker = Ticker.shared;
    this._rippleTickerCallback = (ticker: { deltaMS: number }) => {
      this.updateRipple(ticker.deltaMS);
    };
    this._rippleTicker.add(this._rippleTickerCallback);
  }
  
  /**
   * Stop ripple animation
   */
  stopRipple(): void {
    if (this._rippleTicker && this._rippleTickerCallback) {
      this._rippleTicker.remove(this._rippleTickerCallback);
      this._rippleTicker = null;
      this._rippleTickerCallback = null;
    }
    
    if (this._rippleGraphics) {
      this.removeChild(this._rippleGraphics);
      this._rippleGraphics.destroy();
      this._rippleGraphics = null;
    }
    
    this._rippleActive = false;
    this._rippleProgress = 0;
  }
  
  /**
   * Check if ripple is active
   */
  get isRippling(): boolean {
    return this._rippleActive;
  }
  
  /**
   * Update ripple animation frame
   */
  private updateRipple(deltaMS: number): void {
    if (!this._rippleActive || !this._rippleGraphics) return;
    
    const duration = this._rippleOptions.duration ?? 1000;
    this._rippleProgress += deltaMS / duration;
    
    if (this._rippleProgress >= 1) {
      if (this._rippleOptions.loop) {
        this._rippleProgress = this._rippleProgress % 1;
      } else {
        this.stopRipple();
        this.emit('rippleend', { node: this });
        return;
      }
    }
    
    // Draw ripple
    this._rippleGraphics.clear();
    
    const size = this._data.size ?? 30;
    const maxRadius = size * (this._rippleOptions.maxRadiusMultiplier ?? 2);
    const radius = calculateRippleRadius(this._rippleProgress, maxRadius);
    const alpha = calculateRippleAlpha(this._rippleProgress, 0.6);
    
    drawRippleEffect(
      this._rippleGraphics,
      {
        x: 0,
        y: 0,
        radius,
        maxRadius,
        ringCount: this._rippleOptions.ringCount ?? 3,
      },
      {
        color: this._rippleOptions.color ?? '#4a90d9',
        alpha,
        strokeWidth: 2,
      }
    );
  }
  
  /**
   * Trigger a single ripple (non-looping)
   */
  triggerRipple(options: Omit<RippleAnimationOptions, 'loop'> = {}): void {
    this.startRipple({ ...options, loop: false });
  }

  // =========================================================================
  // CLEANUP
  // =========================================================================

  destroy(): void {
    this.stopRipple();
    this.off('pointerover', this.onPointerOver, this);
    this.off('pointerout', this.onPointerOut, this);
    this.off('pointerdown', this.onDragStart, this);
    this.off('globalpointermove', this.onDragMove, this);
    this.off('pointerup', this.onDragEnd, this);
    this.off('pointerupoutside', this.onDragEnd, this);
    this.off('pointertap', this.onTap, this);
    this.off('rightclick', this.onRightClick, this);
    super.destroy();
  }
}
