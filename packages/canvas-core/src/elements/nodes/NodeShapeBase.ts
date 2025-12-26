/**
 * NodeShapeBase
 * 
 * Abstract base class for all node shapes.
 * Provides common functionality: dragging, selection, hover, ripple animations, and labels.
 * Subclasses must implement: render(), getBoundaryPoint(), getShapeBounds()
 * 
 * @example
 * ```typescript
 * class CustomNode extends NodeShapeBase {
 *   protected renderShape(graphics: Graphics, style: ShapeStyle): void {
 *     // Custom shape rendering
 *   }
 *   
 *   getBoundaryPoint(targetPoint: Point, offset: number): Point {
 *     // Custom boundary calculation
 *   }
 *   
 *   protected getShapeBounds(): Bounds {
 *     // Return shape bounds for label positioning
 *   }
 * }
 * ```
 */

import type { ShapeStyle } from '../../primitives/shapes';
import type { LabelStyle } from '../../primitives/labels';
import { createPositionedLabel, type LabelPosition } from '../../primitives/labels';
import { BaseShape, type BaseShapeData, type BaseShapeStyle, type BaseShapeOptions } from '../BaseShape';
import { FederatedPointerEvent, Graphics, Ticker } from 'pixi.js';
import { drawRippleEffect, calculateRippleRadius, calculateRippleAlpha } from '../../primitives/effects';

/**
 * Point interface for coordinates
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * Bounds interface for shape dimensions
 */
export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Badge position on a node (8 positions)
 */
export type BadgePosition =
  | 'top'
  | 'top-right'
  | 'right'
  | 'bottom-right'
  | 'bottom'
  | 'bottom-left'
  | 'left'
  | 'top-left';

/**
 * Badge configuration
 */
export interface NodeBadge {
  /** Badge text or number */
  text: string;
  /** Position on the node */
  position: BadgePosition;
  /** Badge background color */
  color?: string | number;
  /** Badge text color */
  textColor?: string | number;
  /** Badge size (diameter) */
  size?: number;
  /** Badge text size */
  fontSize?: number;
}

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
export interface NodeData extends BaseShapeData {
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
  /** Badges to display on the node */
  badges?: NodeBadge[];
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
export interface NodeStyle extends BaseShapeStyle {
  /** Label position relative to shape */
  labelPosition?: LabelPosition;
  /** Label offset from position */
  labelOffsetX?: number;
  labelOffsetY?: number;
  /** Label text style */
  labelStyle?: LabelStyle;
  /** Selected state style overrides */
  selectedFill?: string;
  selectedStroke?: string;
  selectedStrokeWidth?: number;
  /** Hover state style overrides */
  hoverFill?: string;
  hoverStroke?: string;
  /** Ripple effect style */
  rippleColor?: string;
}

/**
 * Node shape options
 */
export interface NodeShapeOptions extends Omit<BaseShapeOptions<NodeData>, 'style'> {
  style?: NodeStyle;
  /** Enable node dragging */
  draggable?: boolean;
  /** Enable node selection */
  selectable?: boolean;
  /** Callback when node is dragged */
  onDrag?: (node: NodeShapeBase, x: number, y: number) => void;
}

/**
 * Abstract base class for node shapes
 */
export abstract class NodeShapeBase extends BaseShape<NodeData> {
  protected _nodeStyle: NodeStyle;
  private _selected: boolean = false;
  private _hovered: boolean = false;
  private _draggable: boolean;
  private _selectable: boolean;
  
  // Drag callback
  private _onDrag?: (node: NodeShapeBase, x: number, y: number) => void;
  
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
  
  // Badge containers
  private _badgeContainers: Map<string, Graphics> = new Map();

  constructor(options: NodeShapeOptions) {
    super(options as BaseShapeOptions<NodeData>);
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

    // Note: Initial render will be called by Renderer after adding to scene
  }

  // =========================================================================
  // ABSTRACT METHODS - Must be implemented by subclasses
  // =========================================================================

  /**
   * Calculate the boundary point of this node for an edge connection.
   * @param targetPoint - The point the edge connects to
   * @param offset - Additional offset from boundary
   * @returns The point on the node boundary facing the target point
   */
  abstract getBoundaryPoint(targetPoint: Point, offset?: number): Point;

  /**
   * Get bounds for label positioning
   */
  protected abstract getShapeBounds(): Bounds;

  /**
   * Calculate badge position offset based on shape-specific geometry.
   * Each shape should implement this to position badges correctly on its boundary.
   * @param position - The badge position (top, top-right, right, etc.)
   * @param badgeRadius - Half of the badge size
   * @returns The x,y offset from the node center
   */
  protected abstract getBadgeOffset(position: BadgePosition, badgeRadius: number): { x: number; y: number };

  /**
   * Get the shape type identifier
   */
  abstract get shapeType(): NodeShapeType;

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

  /**
   * Set drag callback
   */
  set onDrag(callback: ((node: NodeShapeBase, x: number, y: number) => void) | undefined) {
    this._onDrag = callback;
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
  // STYLE HELPERS
  // =========================================================================

  /**
   * Get the active style based on state (selected, hovered)
   */
  protected getActiveStyle(): ShapeStyle {
    const base = this._nodeStyle;
    let fill = base.fill;
    let stroke = base.stroke;
    let strokeWidth = base.strokeWidth;

    if (this._selected) {
      fill = base.selectedFill ?? fill;
      stroke = base.selectedStroke ?? stroke;
      strokeWidth = base.selectedStrokeWidth ?? strokeWidth;
    } else if (this._hovered) {
      fill = base.hoverFill ?? fill;
      stroke = base.hoverStroke ?? stroke;
    }

    return {
      fill,
      fillAlpha: base.fillAlpha,
      stroke,
      strokeWidth,
      strokeAlpha: base.strokeAlpha,
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
        position: this._nodeStyle.labelPosition ?? 'center',
        offsetX: this._nodeStyle.labelOffsetX ?? 0,
        offsetY: this._nodeStyle.labelOffsetY ?? 0,
      },
      this._nodeStyle.labelStyle ?? { fill: '#000000', fontSize: 12 }
    );

    this.addLabel('main', label);
  }

  // =========================================================================
  // BADGE MANAGEMENT
  // =========================================================================

  /**
   * Update badges based on node data
   */
  updateBadges(): void {
    // Remove all existing badges
    this._badgeContainers.forEach((container) => {
      this.removeChild(container);
      container.destroy();
    });
    this._badgeContainers.clear();

    const badges = this._data.badges;
    if (!badges || badges.length === 0) return;

    // Create new badges
    badges.forEach((badge, index) => {
      const badgeSize = badge.size ?? 24;
      const fontSize = badge.fontSize ?? 12;
      const color = this.normalizeColor(badge.color ?? '#ff4444');
      const textColor = this.normalizeColor(badge.textColor ?? '#ffffff');

      // Create badge graphics
      const badgeContainer = new Graphics();
      
      // Draw circle
      badgeContainer.circle(0, 0, badgeSize / 2);
      badgeContainer.fill(color);
      badgeContainer.stroke({ width: 2, color: 0xffffff });

      // Position badge using shape-specific calculation
      const badgeRadius = badgeSize / 2;
      const offset = this.getBadgeOffset(badge.position, badgeRadius);
      badgeContainer.x = offset.x;
      badgeContainer.y = offset.y;

      // Add to node
      this.addChild(badgeContainer);
      this._badgeContainers.set(`badge-${index}`, badgeContainer);

      // Add text label using the label system
      const badgeLabel = createPositionedLabel(
        badge.text,
        { x: offset.x, y: offset.y, width: badgeSize, height: badgeSize },
        { position: 'center', offsetX: 0, offsetY: 0 },
        { fill: typeof textColor === 'number' ? `#${textColor.toString(16).padStart(6, '0')}` : textColor, fontSize, fontWeight: 'bold' }
      );
      
      this.addLabel(`badge-${index}`, badgeLabel);
    });
  }

  /**
   * Normalize color to number format for PixiJS
   */
  private normalizeColor(color: string | number): number {
    if (typeof color === 'number') return color;
    
    // Remove # if present
    const hex = color.replace('#', '');
    return parseInt(hex, 16);
  }

  // =========================================================================
  // INTERACTION - Drag & Drop
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
      this.selected = !this.selected;
    } else {
      this.selected = true;
    }
    
    // Emit selection event
    this.emit('select', { node: this, selected: this._selected, event: e });
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
  updateData(data: Partial<NodeData>): void {
    super.updateData(data);
    if (data.label !== undefined) {
      this.updateLabel();
    }
    if (data.badges !== undefined) {
      this.updateBadges();
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

    if (style.labelPosition !== undefined || style.labelStyle !== undefined) {
      this.updateLabel();
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
