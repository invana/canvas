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
import type { LabelAlign } from '../../primitives/labels';
import { createPositionedLabel, type LabelPosition } from '../../primitives/labels';
import { BaseShape, type BaseShapeData, type BaseShapeStyle, type BaseShapeOptions } from '../BaseShape';
import { FederatedPointerEvent, Graphics, Ticker } from 'pixi.js';
import { drawRippleEffect, calculateRippleRadius, calculateRippleAlpha } from '../../primitives/effects';
import { NodeStates, KNOWN_NODE_STATES, type NodeStateName } from '../../types/states';
import { DEFAULT_NODE_STYLE } from '../../defaults/nodes';

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
  | 'ellipse'
  | 'triangle'
  | 'diamond'
  | 'pentagon'
  | 'hexagon'
  | 'octagon'
  | 'htmlNode'
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
 * Base style properties for nodes (without state-specific overrides)
 */
export interface BaseNodeStyleProps extends BaseShapeStyle {
  /** Label position relative to shape */
  labelPosition?: LabelPosition;
  /** Label offset from position */
  labelOffsetX?: number;
  labelOffsetY?: number;
  
  // Flattened label style properties
  /** Label font family */
  labelFontFamily?: string;
  /** Label font size */
  labelFontSize?: number;
  /** Label font weight */
  labelFontWeight?: 'normal' | 'bold' | 'lighter' | 'bolder';
  /** Label font style */
  labelFontStyle?: 'normal' | 'italic' | 'oblique';
  /** Label text fill color */
  labelFill?: string;
  /** Label text stroke color */
  labelStroke?: string;
  /** Label text stroke width */
  labelStrokeWidth?: number;
  /** Label letter spacing */
  labelLetterSpacing?: number;
  /** Label line height */
  labelLineHeight?: number;
  /** Label word wrap */
  labelWordWrap?: boolean;
  /** Label word wrap width */
  labelWordWrapWidth?: number;
  /** Label text alignment */
  labelAlign?: LabelAlign;
  
  /** Ripple effect style */
  rippleColor?: string;
}

/**
 * Style for a node with state-based styling
 */
export interface NodeStyle extends BaseNodeStyleProps {
  /** 
   * State-based style overrides
   * Define styles for different states (selected, active, custom states)
   * 
   * @example
   * ```typescript
   * {
   *   fill: '#1890ff',
   *   states: {
   *     selected: { stroke: '#ff4d4f', strokeWidth: 4 },
   *     active: { fill: '#40a9ff', opacity: 0.9 },
   *     loading: { opacity: 0.5 },
   *     error: { stroke: '#ff0000', strokeWidth: 3 },
   *   }
   * }
   * ```
   */
  states?: {
    [stateName: string]: Partial<BaseNodeStyleProps>;
  };
  
  /**
   * State priority order (default: ['default', 'active', 'selected'])
   * States are applied in this order, later states override earlier ones
   */
  statePriority?: string[];
}

/**
 * Node shape options
 */
export interface NodeShapeOptions extends Omit<BaseShapeOptions<NodeData>, 'style'> {
  style?: Partial<NodeStyle>;
  /** Enable node dragging (deprecated - use DragElementPlugin) */
  draggable?: boolean;
  /** Initial states to activate (e.g., ['selected', 'highlighted']) */
  states?: string[];
  /** Callback when node is dragged */
  onDrag?: (node: NodeShapeBase, x: number, y: number) => void;
}

/**
 * Abstract base class for node shapes
 */
export abstract class NodeShapeBase extends BaseShape<NodeData> {
  protected _nodeStyle: Partial<NodeStyle>;
  private _draggable: boolean;
  
  // State management
  private _activeStates = new Set<string>([NodeStates.DEFAULT]);
  private _cachedStyle: ShapeStyle | null = null;
  private _styleDirty = true;
  private _styleHash = '';
  
  // Global style cache (shared across all node instances)
  private static _globalStyleCache = new Map<string, ShapeStyle>();
  private static _styleIdCounter = 0;
  private _styleId: number = 0;
  
  // Batch mode for bulk operations (set to true to defer rendering)
  private static _batchMode = false;
  private static _batchedNodes = new Set<NodeShapeBase>();
  
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
    
    // Interaction defaults changed to false - plugins enable interactions
    this._draggable = options.draggable ?? false;
    this._onDrag = options.onDrag;
    
    // Assign unique style ID for caching
    this._styleId = ++NodeShapeBase._styleIdCounter;

    // Always activate DEFAULT state
    this._activeStates.add(NodeStates.DEFAULT);

    // Activate initial states if provided
    if (options.states && options.states.length > 0) {
      for (const state of options.states) {
        this._activeStates.add(state);
      }
      this._styleDirty = true;
    }

    // Update interaction mode based on disabled state
    this.updateInteractionMode();

    // NOTE: All interaction event handlers (drag, hover, selection) are now
    // managed by plugins. This keeps nodes pure rendering components.
    // Plugins will attach their own event listeners when enabled.

    // Initial render
    this.forceRender();
    this.updateLabel();
    if (this._data.badges) {
      this.updateBadges();
    }
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
   * Draw halo effect for this shape
   * Each shape must implement its own halo rendering based on its geometry
   * @param style - Active style with halo properties
   */
  protected abstract drawHalo(style: ShapeStyle): void;

  /**
   * Get the shape type identifier
   */
  abstract get shapeType(): NodeShapeType;

  // =========================================================================
  // PROPERTIES
  // =========================================================================

  get nodeStyle(): Partial<NodeStyle> {
    return this._nodeStyle;
  }

  set nodeStyle(value: Partial<NodeStyle>) {
    this._nodeStyle = value;
    this._style = value;
    this._styleDirty = true;
    this.markDirty();
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
   * Check if node is draggable (used for cursor styling)
   * Note: Actual drag behavior is handled by DragElementPlugin
   */
  get draggable(): boolean {
    return this._draggable;
  }
  
  set draggable(value: boolean) {
    this._draggable = value;
  }

  // =========================================================================
  // STATE MANAGEMENT
  // =========================================================================

  /**
   * Set a state on the node
   * 
   * @example
   * ```typescript
   * node.setState(NodeStates.SELECTED, true);
   * node.setState(NodeStates.LOADING, true);
   * node.setState('custom-state', true);
   * ```
   * 
   * @param name - State name (use NodeStates constants for type safety)
   * @param active - Whether to activate or deactivate the state
   */
  setState(name: NodeStateName, active: boolean): void {
    const changed = active 
      ? !this._activeStates.has(name)
      : this._activeStates.has(name);
    
    if (!changed) return; // Skip if no change
    
    // Dev mode validation (only in development)
    // @ts-ignore - process.env check for dev validation
    if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development' && name !== NodeStates.DEFAULT) {
      // Type assertion needed because name is NodeStateName (union with string)
      if (!KNOWN_NODE_STATES.has(name as any) && !this._nodeStyle.states?.[name]) {
        console.warn(
          `[Node ${this.id}] Unknown state "${name}". ` +
          `Consider using NodeStates constants or defining it in style.states.`
        );
      }
    }
    
    if (active) {
      this._activeStates.add(name);
    } else {
      this._activeStates.delete(name);
    }
    
    this._styleDirty = true;
    
    // Update interaction mode if disabled/muted state changed
    if (name === NodeStates.DISABLED || name === 'muted') {
      this.updateInteractionMode();
    }
    
    this.markDirty();
    
    // If in batch mode, defer update; otherwise update immediately
    if (NodeShapeBase._batchMode) {
      NodeShapeBase._batchedNodes.add(this);
    } else {
      this.update();
      // Emit state change event to trigger canvas re-render
      this.emit('statechange', { node: this, state: name, active });
    }
  }

  /**
   * Check if a state is active
   * 
   * @param name - State name to check
   * @returns true if the state is active
   */
  getState(name: NodeStateName): boolean {
    return this._activeStates.has(name);
  }

  /**
   * Get all active states
   * 
   * @returns Array of active state names
   */
  getActiveStates(): string[] {
    return Array.from(this._activeStates);
  }

  /**
   * Check if the node is disabled (should not respond to interactions)
   * 
   * @returns true if the node is in disabled or muted state
   */
  isDisabled(): boolean {
    return this._activeStates.has(NodeStates.DISABLED) || this._activeStates.has('muted');
  }

  /**
   * Start batch mode - defers all rendering until endBatch() is called
   * Use this when updating state on many nodes at once for better performance
   * 
   * @example
   * ```typescript
   * NodeShapeBase.startBatch();
   * nodes.forEach(node => node.setState(NodeStates.HIGHLIGHTED, true));
   * NodeShapeBase.endBatch();
   * ```
   */
  static startBatch(): void {
    NodeShapeBase._batchMode = true;
    NodeShapeBase._batchedNodes.clear();
  }

  /**
   * End batch mode and render all nodes that were modified
   * @returns Number of nodes that were updated
   */
  static endBatch(): number {
    NodeShapeBase._batchMode = false;
    const count = NodeShapeBase._batchedNodes.size;
    
    // Update all batched nodes
    for (const node of NodeShapeBase._batchedNodes) {
      node.update();
    }
    
    NodeShapeBase._batchedNodes.clear();
    return count;
  }

  /**
   * Check if batch mode is active
   */
  static isBatchMode(): boolean {
    return NodeShapeBase._batchMode;
  }

  /**
   * Update interaction mode based on disabled state
   * Disabled nodes are not interactive (no hover, click, drag)
   * @internal
   */
  private updateInteractionMode(): void {
    if (this.isDisabled()) {
      this.eventMode = 'none';
      this.cursor = 'default';
    } else {
      this.eventMode = 'static';
      this.cursor = this._draggable ? 'pointer' : 'default';
    }
  }

  /**
   * Clear specific states or all custom states
   * 
   * @param names - Optional array of state names to clear. If not provided, clears all except default
   */
  clearStates(names?: string[]): void {
    if (names) {
      names.forEach(n => this._activeStates.delete(n));
    } else {
      this._activeStates.clear();
      this._activeStates.add(NodeStates.DEFAULT);
    }
    
    this._styleDirty = true;
    this.markDirty();
    this.update();
  }

  // =========================================================================
  // STYLE HELPERS
  // =========================================================================

  /**
   * Get the active style based on current states
   * Optimized with caching for performance
   */
  protected getActiveStyle(): ShapeStyle {
    // OPTIMIZATION: Return cached style if not dirty
    if (!this._styleDirty && this._cachedStyle) {
      return this._cachedStyle;
    }
    
    // OPTIMIZATION: Check global cache (shared between nodes with same states)
    const hashCode = this.computeStyleHash();
    if (hashCode === this._styleHash && this._cachedStyle) {
      return this._cachedStyle;
    }
    
    const cached = NodeShapeBase._globalStyleCache.get(hashCode);
    if (cached) {
      this._cachedStyle = cached;
      this._styleHash = hashCode;
      this._styleDirty = false;
      return cached;
    }
    
    // Compute new style
    const result = this.computeActiveStyle();
    
    // Cache globally (limit cache size to prevent memory issues)
    if (NodeShapeBase._globalStyleCache.size < 10000) {
      NodeShapeBase._globalStyleCache.set(hashCode, result);
    }
    
    this._cachedStyle = result;
    this._styleHash = hashCode;
    this._styleDirty = false;
    return result;
  }

  /**
   * Compute hash code for current style + states combination
   * @internal
   */
  private computeStyleHash(): string {
    const stateStr = Array.from(this._activeStates).sort().join(',');
    return `${this._styleId}:${stateStr}`;
  }

  /**
   * Compute the active style by merging state styles
   * @internal
   */
  private computeActiveStyle(): ShapeStyle {
    const base = this._nodeStyle;
    
    // Start with top-level base style properties (applied first as fallback)
    const result: Partial<ShapeStyle> = {};
    
    // Apply top-level style properties first (these act as base/fallback)
    if (base.fill !== undefined) result.fill = base.fill;
    if (base.stroke !== undefined) result.stroke = base.stroke;
    if (base.strokeWidth !== undefined) result.strokeWidth = base.strokeWidth;
    if (base.fillAlpha !== undefined) result.fillAlpha = base.fillAlpha;
    if (base.strokeAlpha !== undefined) result.strokeAlpha = base.strokeAlpha;
    if (base.strokeStyle !== undefined) result.strokeStyle = base.strokeStyle;
    if (base.strokeDashPattern !== undefined) result.strokeDashPattern = base.strokeDashPattern;
    if (base.strokeDashOffset !== undefined) result.strokeDashOffset = base.strokeDashOffset;
    if (base.strokeAlignment !== undefined) result.strokeAlignment = base.strokeAlignment;
    if (base.strokeCap !== undefined) result.strokeCap = base.strokeCap;
    if (base.halo !== undefined) result.halo = base.halo;
    if (base.haloStrokeWidth !== undefined) result.haloStrokeWidth = base.haloStrokeWidth;
    if (base.haloStroke !== undefined) result.haloStroke = base.haloStroke;
    if (base.haloStrokeOpacity !== undefined) result.haloStrokeOpacity = base.haloStrokeOpacity;
    
    // Apply states in priority order (override top-level base)
    const priority = base.statePriority ?? [NodeStates.DEFAULT, NodeStates.ACTIVE, NodeStates.SELECTED];
    
    if (base.states) {
      for (const stateName of priority) {
        if (!this._activeStates.has(stateName)) continue;
        
        const stateStyle = base.states[stateName];
        if (!stateStyle) continue;
        
        // Direct property assignment (faster than Object.assign)
        if (stateStyle.fill !== undefined) result.fill = stateStyle.fill;
        if (stateStyle.stroke !== undefined) result.stroke = stateStyle.stroke;
        if (stateStyle.strokeWidth !== undefined) result.strokeWidth = stateStyle.strokeWidth;
        if (stateStyle.fillAlpha !== undefined) result.fillAlpha = stateStyle.fillAlpha;
        if (stateStyle.strokeAlpha !== undefined) result.strokeAlpha = stateStyle.strokeAlpha;
        if (stateStyle.strokeStyle !== undefined) result.strokeStyle = stateStyle.strokeStyle;
        if (stateStyle.strokeDashPattern !== undefined) result.strokeDashPattern = stateStyle.strokeDashPattern;
        if (stateStyle.strokeDashOffset !== undefined) result.strokeDashOffset = stateStyle.strokeDashOffset;
        if (stateStyle.strokeAlignment !== undefined) result.strokeAlignment = stateStyle.strokeAlignment;
        if (stateStyle.strokeCap !== undefined) result.strokeCap = stateStyle.strokeCap;
        if (stateStyle.halo !== undefined) result.halo = stateStyle.halo;
        if (stateStyle.haloStrokeWidth !== undefined) result.haloStrokeWidth = stateStyle.haloStrokeWidth;
        if (stateStyle.haloStroke !== undefined) result.haloStroke = stateStyle.haloStroke;
        if (stateStyle.haloStrokeOpacity !== undefined) result.haloStrokeOpacity = stateStyle.haloStrokeOpacity;
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
        if (stateStyle.strokeStyle !== undefined) result.strokeStyle = stateStyle.strokeStyle;
        if (stateStyle.strokeDashPattern !== undefined) result.strokeDashPattern = stateStyle.strokeDashPattern;
        if (stateStyle.strokeDashOffset !== undefined) result.strokeDashOffset = stateStyle.strokeDashOffset;
        if (stateStyle.strokeAlignment !== undefined) result.strokeAlignment = stateStyle.strokeAlignment;
        if (stateStyle.strokeCap !== undefined) result.strokeCap = stateStyle.strokeCap;
        if (stateStyle.halo !== undefined) result.halo = stateStyle.halo;
        if (stateStyle.haloStrokeWidth !== undefined) result.haloStrokeWidth = stateStyle.haloStrokeWidth;
        if (stateStyle.haloStroke !== undefined) result.haloStroke = stateStyle.haloStroke;
        if (stateStyle.haloStrokeOpacity !== undefined) result.haloStrokeOpacity = stateStyle.haloStrokeOpacity;
      }
    }
    
    // Ensure all required properties are defined
    return result as ShapeStyle;
  }

  /**
   * Compute style for a specific state (not merging with other active states)
   * Useful for getting isolated state styles
   * 
   * @param stateName - The state name to compute style for
   * @returns Style for the specified state only
   */
  computeStyleForState(stateName: string): Partial<ShapeStyle> {
    const base = this._nodeStyle;
    
    if (!base.states || !base.states[stateName]) {
      return {};
    }
    
    // Start with DEFAULT state as base
    const result: Partial<ShapeStyle> = {};
    const defaultStyle = base.states[NodeStates.DEFAULT];
    
    if (defaultStyle) {
      Object.assign(result, defaultStyle);
    }
    
    // Apply the specific state
    const stateStyle = base.states[stateName];
    if (stateStyle) {
      Object.assign(result, stateStyle);
    }
    
    return result;
  }

  /**
   * Get merged style for multiple specific states
   * Applies states in the order provided
   * 
   * @param stateNames - Array of state names to merge
   * @returns Merged style
   */
  computeStyleForStates(stateNames: string[]): Partial<ShapeStyle> {
    const base = this._nodeStyle;
    const result: Partial<ShapeStyle> = {};
    
    if (!base.states) {
      return result;
    }
    
    // Always start with DEFAULT
    if (!stateNames.includes(NodeStates.DEFAULT)) {
      stateNames = [NodeStates.DEFAULT, ...stateNames];
    }
    
    // Apply each state in order
    for (const stateName of stateNames) {
      const stateStyle = base.states[stateName];
      if (stateStyle) {
        Object.assign(result, stateStyle);
      }
    }
    
    return result;
  }

  /**
   * Helper to get halo color from style
   */
  protected getHaloColor(style: ShapeStyle): string | number {
    if (style.haloStroke) {
      return typeof style.haloStroke === 'object' ? DEFAULT_NODE_STYLE.labelFill ?? '#000000' : style.haloStroke;
    } else if (style.fill) {
      return typeof style.fill === 'object' ? DEFAULT_NODE_STYLE.labelFill ?? '#000000' : style.fill;
    } else if (style.stroke) {
      return style.stroke;
    }
    return DEFAULT_NODE_STYLE.labelFill ?? '#000000';
  }

  // =========================================================================
  // LABEL MANAGEMENT
  // =========================================================================

  /**
   * Collect flattened label* properties into a LabelStyle object
   * @internal
   */
  private collectLabelStyle(): import('../../primitives/labels').LabelStyle {
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
      const fontSize = badge.fontSize ?? 10;
      const color = this.normalizeColor(badge.color ?? 0xff4d4f);
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
    if (this.isDisabled()) return;
    this.setState(NodeStates.ACTIVE, true);
  }

  private onPointerOut(): void {
    if (this.isDisabled()) return;
    this.setState(NodeStates.ACTIVE, false);
  }
  
  private onDragStart(e: FederatedPointerEvent): void {
    if (this.isDisabled()) return;
    
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
    
    // Set dragging state
    this.setState(NodeStates.DRAGGING, true);
    
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
    
    // Clear dragging state
    this.setState(NodeStates.DRAGGING, false);
    
    // Emit drag end event
    this.emit('dragend', { node: this, event: e, x: this.x, y: this.y });
  }
  
  private onTap(e: FederatedPointerEvent): void {
    if (this.isDisabled()) return;
    
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

    if (style.labelPosition !== undefined || 
        style.labelFontSize !== undefined || 
        style.labelFill !== undefined) {
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
